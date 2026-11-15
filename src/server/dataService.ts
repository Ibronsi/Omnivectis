import fs from 'fs';
import path from 'path';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  appState,
  auditLog,
  companyProfiles,
  launchKits,
  opportunities,
  pipelineItems,
  realSales,
  savedArbitrages,
  savedBlueprints,
  savedLaunchpads,
  validationQueue,
} from '../db/schema.ts';
import {
  AuditLogEntry,
  CompanyProfile,
  CountryCode,
  DigitalLaunchKit,
  LiveFxRates,
  PhysicalExploitationPlan,
  RealSaleRecord,
  SavedArbitrageRecord,
  SavedBlueprintRecord,
  SavedLaunchpadRecord,
  SourceHealthItem,
  StrictOpportunity,
  UsageCounterStats,
  ValidationItem,
} from '../types/market.js';

export interface SignalItem {
  id: string;
  sourceId?: string;
  category: 'reglementaire' | 'energie_matiere' | 'ia_tech' | 'finance_taux' | 'supply_chain';
  headline: string;
  context: string;
  immediateArbitragePlay: string;
  sectorId: string;
  sectorName: string;
  estimatedMarginImpact: string;
  urgency: 'Immédiat (<48h)' | 'Cette semaine' | 'Ce mois-ci';
  timestamp: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  relativeTime: string;
  region: 'niger_uemoa' | 'europe' | 'global';
  isVerifiedSource: boolean;
  status: 'live' | 'cache' | 'indisponible';
  countryCode?: CountryCode;
  isGlobal?: boolean;
}

export interface PersistentPipelineItem {
  id: string;
  title: string;
  sectorId: string;
  sectorName: string;
  stage: 'discovery' | 'validation' | 'building' | 'monetizing';
  targetMrr: number;
  currentMrr: number;
  notes: string;
  addedAt: string;
  checklists: { text: string; done: boolean }[];
  countryCode?: string;
  currency?: string;
  paymentMethod?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LEGACY_FILES = {
  pipeline: path.join(DATA_DIR, 'pipeline.json'),
  opportunities: path.join(DATA_DIR, 'opportunities.json'),
  kits: path.join(DATA_DIR, 'kits.json'),
  validation: path.join(DATA_DIR, 'validation_queue.json'),
  audit: path.join(DATA_DIR, 'audit_log.json'),
  sales: path.join(DATA_DIR, 'sales.json'),
  blueprints: path.join(DATA_DIR, 'blueprints.json'),
  arbitrages: path.join(DATA_DIR, 'arbitrages.json'),
  launchpads: path.join(DATA_DIR, 'launchpads.json'),
  signals: path.join(DATA_DIR, 'signals.json'),
  sourceHealth: path.join(DATA_DIR, 'source_health.json'),
  rates: path.join(DATA_DIR, 'rates.json'),
  usage: path.join(DATA_DIR, 'usage_counter.json'),
};

// In-memory runtime cache (populated lazily by async requests, never via top-level DB probe)
let cachedSignals: SignalItem[] = [];
let cachedSourceHealth: SourceHealthItem[] = [];
let lastHarvestTime = 0;
let isHarvesting = false;
let cachedFxRates: LiveFxRates = {
  XOF: 655.957,
  USD: 1.08,
  EUR: 1,
  lastUpdate: new Date().toISOString(),
  status: 'fallback',
};
let fxRatesLoadedFromDb = false;

type SignalsListener = (payload: {
  signals: SignalItem[];
  sourceHealth: SourceHealthItem[];
  rates: LiveFxRates;
  lastSync: string;
  timestamp: string;
}) => void;

type WorkspaceEventListener = (eventName: string, payload: unknown, userUid?: string) => void;

const signalsListeners = new Set<SignalsListener>();
const workspaceEventListeners = new Set<WorkspaceEventListener>();

export function onSignalsUpdated(listener: SignalsListener): () => void {
  signalsListeners.add(listener);
  return () => {
    signalsListeners.delete(listener);
  };
}

export function onWorkspaceEvent(listener: WorkspaceEventListener): () => void {
  workspaceEventListeners.add(listener);
  return () => {
    workspaceEventListeners.delete(listener);
  };
}

function emitWorkspaceEvent(eventName: string, payload: unknown, userUid?: string) {
  for (const listener of workspaceEventListeners) {
    try {
      listener(eventName, payload, userUid);
    } catch (e) {
      console.error('Workspace event listener error:', e);
    }
  }
}

function emitSignalsUpdated() {
  const now = new Date();
  const lastSync = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const payload = {
    signals: getCachedSignals(),
    sourceHealth: getSourceHealth(),
    rates: cachedFxRates,
    lastSync,
    timestamp: now.toISOString(),
  };
  for (const listener of signalsListeners) {
    try {
      listener(payload);
    } catch (e) {
      console.error('Signals listener error:', e);
    }
  }
}

async function getAppState<T>(key: string): Promise<T | null> {
  try {
    const rows = await db.select().from(appState).where(eq(appState.key, key)).limit(1);
    if (rows.length === 0) return null;
    return rows[0].value as T;
  } catch (error) {
    console.error(`Database query failed in getAppState(${key}):`, error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

async function setAppState(key: string, value: unknown): Promise<void> {
  try {
    await db
      .insert(appState)
      .values({
        key,
        value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appState.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`Database query failed in setAppState(${key}):`, error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const pub = new Date(dateString);
    if (Number.isNaN(pub.getTime())) return 'En direct';
    const diffMs = Date.now() - pub.getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMins < 60) return `il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} j`;
  } catch {
    return 'En direct';
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractXmlItems(xml: string): { title: string; link: string; pubDate: string; desc: string }[] {
  const items: { title: string; link: string; pubDate: string; desc: string }[] = [];

  const rssMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const match of rssMatches) {
    const titleMatch =
      match.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
      match.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const linkMatch =
      match.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)?.[1] ||
      match.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ||
      match.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i)?.[1];
    const pubDateMatch =
      match.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ||
      match.match(/<dc:date>([\s\S]*?)<\/dc:date>/i)?.[1];
    const descMatch =
      match.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
      match.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1];

    if (titleMatch && linkMatch) {
      items.push({
        title: decodeHtmlEntities(titleMatch),
        link: linkMatch.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim(),
        pubDate: pubDateMatch ? pubDateMatch.trim() : new Date().toISOString(),
        desc: descMatch ? decodeHtmlEntities(descMatch).slice(0, 320) : '',
      });
    }
  }

  if (items.length === 0) {
    const atomMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    for (const match of atomMatches) {
      const titleMatch = match.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      const linkAttr =
        match.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ||
        match.match(/<id>(https?:\/\/[^<]+)<\/id>/i)?.[1];
      const pubDateMatch =
        match.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1] ||
        match.match(/<published>([\s\S]*?)<\/published>/i)?.[1];
      const descMatch =
        match.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ||
        match.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1];

      if (titleMatch && linkAttr) {
        items.push({
          title: decodeHtmlEntities(titleMatch),
          link: linkAttr.trim(),
          pubDate: pubDateMatch ? pubDateMatch.trim() : new Date().toISOString(),
          desc: descMatch ? decodeHtmlEntities(descMatch).slice(0, 320) : '',
        });
      }
    }
  }

  return items;
}

function detectCountryCode(textLower: string, defaultCountry?: CountryCode): CountryCode | undefined {
  if (
    textLower.includes('niger') ||
    textLower.includes('niamey') ||
    textLower.includes('maradi') ||
    textLower.includes('zinder') ||
    textLower.includes('agadez') ||
    textLower.includes('tahoua') ||
    textLower.includes('dosso')
  ) {
    return 'NER';
  }
  if (
    textLower.includes('sénégal') ||
    textLower.includes('senegal') ||
    textLower.includes('dakar') ||
    textLower.includes('thiès') ||
    textLower.includes('casamance')
  ) {
    return 'SEN';
  }
  if (
    textLower.includes("côte d'ivoire") ||
    textLower.includes("cote d'ivoire") ||
    textLower.includes('abidjan') ||
    textLower.includes('ivory coast') ||
    textLower.includes('ivoirien') ||
    textLower.includes('bouaké')
  ) {
    return 'CIV';
  }
  if (
    textLower.includes('france') ||
    textLower.includes('français') ||
    textLower.includes('francais') ||
    textLower.includes('paris') ||
    textLower.includes('bercy') ||
    textLower.includes('insee') ||
    textLower.includes('cac 40') ||
    textLower.includes('urssaf')
  ) {
    return 'FRA';
  }
  if (
    textLower.includes('états-unis') ||
    textLower.includes('etats-unis') ||
    textLower.includes('united states') ||
    textLower.includes('u.s.') ||
    textLower.includes('federal reserve') ||
    textLower.includes('wall street') ||
    textLower.includes('nasdaq') ||
    textLower.includes('washington')
  ) {
    return 'USA';
  }
  return defaultCountry;
}

function classifyArticleToSignal(
  item: { title: string; link: string; pubDate: string; desc: string },
  sourceId: string,
  sourceName: string,
  region: 'niger_uemoa' | 'europe' | 'global',
  defaultCountry?: CountryCode,
  isGlobalSource?: boolean
): SignalItem | null {
  const text = `${item.title} ${item.desc}`.toLowerCase();

  if (!item.link || !sourceName) return null;

  let sectorId = 'b2b_services';
  let sectorName = 'B2B Services & Conseil';
  let category: SignalItem['category'] = 'reglementaire';

  if (
    text.includes('ia') ||
    text.includes('ai ') ||
    text.includes('intelligence') ||
    text.includes('tech') ||
    text.includes('logiciel') ||
    text.includes('numérique') ||
    text.includes('software') ||
    text.includes('cloud')
  ) {
    sectorId = 'ai_deeptech';
    sectorName = 'Intelligence Artificielle & DeepTech';
    category = 'ia_tech';
  } else if (
    text.includes('banque') ||
    text.includes('bank') ||
    text.includes('finance') ||
    text.includes('monnaie') ||
    text.includes('paiement') ||
    text.includes('taux') ||
    text.includes('rate') ||
    text.includes('fcfa') ||
    text.includes('cfa') ||
    text.includes('crédit') ||
    text.includes('fed') ||
    text.includes('bce') ||
    text.includes('inflation')
  ) {
    sectorId = 'fintech';
    sectorName = 'FinTech & Arbitrage de Flux';
    category = 'finance_taux';
  } else if (
    text.includes('climat') ||
    text.includes('énergie') ||
    text.includes('energie') ||
    text.includes('energy') ||
    text.includes('solaire') ||
    text.includes('solar') ||
    text.includes('carbone') ||
    text.includes('électricité') ||
    text.includes('pétrole') ||
    text.includes('oil')
  ) {
    sectorId = 'cleantech';
    sectorName = 'Énergie & Transition Climat';
    category = 'energie_matiere';
  } else if (
    text.includes('agri') ||
    text.includes('agricole') ||
    text.includes('céréale') ||
    text.includes('alimentaire') ||
    text.includes('récolte') ||
    text.includes('food') ||
    text.includes('coton') ||
    text.includes('cacao')
  ) {
    sectorId = 'agritech';
    sectorName = 'AgriTech & Souveraineté Alimentaire';
    category = 'energie_matiere';
  } else if (
    text.includes('transport') ||
    text.includes('port') ||
    text.includes('camion') ||
    text.includes('fret') ||
    text.includes('corridor') ||
    text.includes('logistique') ||
    text.includes('supply') ||
    text.includes('shipping') ||
    text.includes('export')
  ) {
    sectorId = 'logistics';
    sectorName = 'Supply Chain & Logistique';
    category = 'supply_chain';
  }

  const cleanContext = item.desc ? item.desc.slice(0, 320) : '';
  const detectedCountry = detectCountryCode(text, defaultCountry);

  return {
    id: `sig-${sourceId}-${Math.abs(hashString(item.link))}`,
    sourceId,
    category,
    headline: item.title,
    context: cleanContext,
    immediateArbitragePlay: '',
    sectorId,
    sectorName,
    estimatedMarginImpact: '',
    urgency: 'Cette semaine',
    timestamp: `Collecté ${formatRelativeTime(item.pubDate)}`,
    sourceName,
    sourceUrl: item.link,
    publishedAt: item.pubDate,
    relativeTime: formatRelativeTime(item.pubDate),
    region,
    isVerifiedSource: true,
    status: 'live',
    countryCode: detectedCountry,
    isGlobal: Boolean(isGlobalSource || (region === 'global' && !detectedCountry)),
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const COUNTRY_NAMES_FR: Record<CountryCode, string> = {
  NER: 'Niger',
  SEN: 'Sénégal',
  CIV: "Côte d'Ivoire",
  FRA: 'France',
  USA: 'États-Unis',
};

const COUNTRY_REGIONS: Record<CountryCode, 'niger_uemoa' | 'europe' | 'global'> = {
  NER: 'niger_uemoa',
  SEN: 'niger_uemoa',
  CIV: 'niger_uemoa',
  FRA: 'europe',
  USA: 'global',
};

const SUPPORTED_COUNTRIES: CountryCode[] = ['NER', 'SEN', 'CIV', 'FRA', 'USA'];

interface SourceTaskResult {
  health: SourceHealthItem;
  signals: SignalItem[];
}

interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  region: 'niger_uemoa' | 'europe' | 'global';
  countryCodes: CountryCode[];
  defaultCountry?: CountryCode;
  isGlobalSource?: boolean;
  limit: number;
}

const RSS_SOURCES: RssSourceConfig[] = [
  {
    id: 'rss-allafrica-biz',
    name: 'AllAfrica Business (UEMOA)',
    url: 'https://allafrica.com/tools/headlines/rdf/business/headlines.rdf',
    region: 'niger_uemoa',
    countryCodes: ['NER', 'SEN', 'CIV'],
    limit: 5,
  },
  {
    id: 'rss-rfi-afrique',
    name: 'RFI Afrique',
    url: 'https://www.rfi.fr/fr/afrique/rss',
    region: 'niger_uemoa',
    countryCodes: ['NER', 'SEN', 'CIV'],
    limit: 5,
  },
  {
    id: 'rss-bbc-afrique',
    name: 'BBC Afrique',
    url: 'https://feeds.bbci.co.uk/afrique/rss.xml',
    region: 'niger_uemoa',
    countryCodes: ['NER', 'SEN', 'CIV'],
    limit: 4,
  },
  {
    id: 'rss-rfi-eco',
    name: 'RFI Économie',
    url: 'https://www.rfi.fr/fr/economie/rss',
    region: 'global',
    countryCodes: ['NER', 'SEN', 'CIV', 'FRA', 'USA'],
    isGlobalSource: true,
    limit: 5,
  },
  {
    id: 'rss-figaro-eco',
    name: 'Le Figaro Économie',
    url: 'https://www.lefigaro.fr/rss/figaro_economie.xml',
    region: 'europe',
    countryCodes: ['FRA'],
    defaultCountry: 'FRA',
    limit: 5,
  },
  {
    id: 'rss-franceinfo-eco',
    name: 'Franceinfo Économie',
    url: 'https://www.francetvinfo.fr/economie.rss',
    region: 'europe',
    countryCodes: ['FRA'],
    defaultCountry: 'FRA',
    limit: 4,
  },
  {
    id: 'rss-cnbc-biz',
    name: 'CNBC Business',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147',
    region: 'global',
    countryCodes: ['USA'],
    defaultCountry: 'USA',
    isGlobalSource: false,
    limit: 5,
  },
  {
    id: 'rss-fed-press',
    name: 'Federal Reserve (USA)',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    region: 'global',
    countryCodes: ['USA'],
    defaultCountry: 'USA',
    isGlobalSource: true,
    limit: 4,
  },
];

function reconcileFailedSource(
  meta: Omit<SourceHealthItem, 'status' | 'lastCheckedAt' | 'signalCount' | 'error' | 'lastSuccessAt'>,
  previousSignals: SignalItem[],
  previousHealth: SourceHealthItem[],
  errorMsg: string,
  checkedAt: string
): SourceTaskResult {
  const retained = previousSignals
    .filter((s) => s.sourceId === meta.id || (!s.sourceId && s.sourceName === meta.name))
    .map((s) => ({
      ...s,
      sourceId: s.sourceId || meta.id,
      status: 'cache' as const,
      relativeTime: formatRelativeTime(s.publishedAt),
      timestamp: `Cache (${formatRelativeTime(s.publishedAt)})`,
    }));

  const prevHealthEntry = previousHealth.find((h) => h.id === meta.id);

  if (retained.length > 0) {
    return {
      signals: retained,
      health: {
        ...meta,
        status: 'cache',
        lastCheckedAt: checkedAt,
        lastSuccessAt: prevHealthEntry?.lastSuccessAt,
        signalCount: retained.length,
        error: errorMsg,
      },
    };
  }

  return {
    signals: [],
    health: {
      ...meta,
      status: 'indisponible',
      lastCheckedAt: checkedAt,
      lastSuccessAt: prevHealthEntry?.lastSuccessAt,
      signalCount: 0,
      error: errorMsg,
    },
  };
}

async function fetchFxSource(
  previousSignals: SignalItem[],
  previousHealth: SourceHealthItem[]
): Promise<SourceTaskResult> {
  const checkedAt = new Date().toISOString();
  const meta = {
    id: 'fx-open-er',
    name: 'Open Exchange Rates',
    url: 'https://open.er-api.com/v6/latest/EUR',
    region: 'global' as const,
    countryCodes: SUPPORTED_COUNTRIES,
  };

  try {
    const fxRes = await fetch(meta.url, {
      headers: { 'User-Agent': 'OmniVectis-Engine/2.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!fxRes.ok) {
      throw new Error(`HTTP ${fxRes.status}`);
    }
    const fxData = await fxRes.json();
    if (!fxData?.rates?.XOF || !fxData?.rates?.USD) {
      throw new Error('Réponse taux de change incomplète');
    }

    cachedFxRates = {
      XOF: fxData.rates.XOF,
      USD: fxData.rates.USD,
      EUR: 1,
      lastUpdate: checkedAt,
      status: 'live',
    };
    fxRatesLoadedFromDb = true;

    try {
      await setAppState('fx_rates', cachedFxRates);
    } catch (e) {
      console.error('Failed to persist fx_rates in PostgreSQL:', e);
    }

    const signal: SignalItem = {
      id: 'sig-fx-live-bceao',
      sourceId: meta.id,
      category: 'finance_taux',
      headline: `Taux de change collecté : 1 EUR = ${cachedFxRates.XOF.toFixed(2)} XOF · 1 EUR = ${cachedFxRates.USD.toFixed(4)} USD · 1 USD = ${(cachedFxRates.XOF / cachedFxRates.USD).toFixed(2)} XOF`,
      context: `Relevé Open Exchange Rates (base EUR) : XOF=${cachedFxRates.XOF.toFixed(3)}, USD=${cachedFxRates.USD.toFixed(4)} (${checkedAt}).`,
      immediateArbitragePlay: '',
      sectorId: 'fintech',
      sectorName: 'FinTech & Arbitrage de Flux',
      estimatedMarginImpact: '',
      urgency: 'Cette semaine',
      timestamp: 'Collecté en direct',
      sourceName: meta.name,
      sourceUrl: 'https://open.er-api.com',
      publishedAt: checkedAt,
      relativeTime: 'en direct',
      region: 'global',
      isGlobal: true,
      isVerifiedSource: true,
      status: 'live',
    };

    return {
      signals: [signal],
      health: {
        ...meta,
        status: 'live',
        lastCheckedAt: checkedAt,
        lastSuccessAt: checkedAt,
        signalCount: 1,
      },
    };
  } catch (e: any) {
    if (cachedFxRates.status === 'live') {
      cachedFxRates = { ...cachedFxRates, status: 'cache' };
    }
    return reconcileFailedSource(meta, previousSignals, previousHealth, e?.message || 'Erreur réseau', checkedAt);
  }
}

async function fetchImfIndicatorSource(
  indicatorCode: 'NGDP_RPCH' | 'PCPIPCH',
  previousSignals: SignalItem[],
  previousHealth: SourceHealthItem[]
): Promise<SourceTaskResult> {
  const checkedAt = new Date().toISOString();
  const isGdp = indicatorCode === 'NGDP_RPCH';
  const meta = {
    id: isGdp ? 'imf-datamapper-gdp' : 'imf-datamapper-cpi',
    name: isGdp ? 'FMI DataMapper (Croissance PIB)' : 'FMI DataMapper (Inflation IPC)',
    url: `https://www.imf.org/external/datamapper/api/v1/${indicatorCode}/NER/SEN/CIV/FRA/USA`,
    region: 'global' as const,
    countryCodes: SUPPORTED_COUNTRIES,
  };

  try {
    const res = await fetch(meta.url, {
      headers: { 'User-Agent': 'OmniVectis-Engine/2.0' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const byCountry = json?.values?.[indicatorCode];
    if (!byCountry || typeof byCountry !== 'object') {
      throw new Error('Données FMI absentes');
    }

    const currentYear = new Date().getFullYear();
    const signals: SignalItem[] = [];

    for (const iso of SUPPORTED_COUNTRIES) {
      const series = byCountry[iso];
      if (!series || typeof series !== 'object') continue;
      const validYears = Object.keys(series)
        .filter((y) => Number(y) <= currentYear && series[y] !== null && series[y] !== undefined)
        .sort();
      const latestYear = validYears[validYears.length - 1];
      if (!latestYear) continue;

      const value = Number(series[latestYear]);
      if (Number.isNaN(value)) continue;

      signals.push({
        id: `sig-imf-${indicatorCode.toLowerCase()}-${iso.toLowerCase()}`,
        sourceId: meta.id,
        category: isGdp ? 'reglementaire' : 'finance_taux',
        headline: isGdp
          ? `FMI DataMapper (${COUNTRY_NAMES_FR[iso]}) : Croissance du PIB réel de ${value.toFixed(1)}% (${latestYear})`
          : `FMI DataMapper (${COUNTRY_NAMES_FR[iso]}) : Inflation moyenne des prix à la consommation de ${value.toFixed(1)}% (${latestYear})`,
        context: `Indicateur officiel FMI ${indicatorCode} pour ${COUNTRY_NAMES_FR[iso]} (${iso}) — année ${latestYear} : ${value.toFixed(2)}%.`,
        immediateArbitragePlay: '',
        sectorId: isGdp ? 'b2b_services' : 'fintech',
        sectorName: isGdp ? 'B2B Services & Conseil' : 'FinTech & Arbitrage de Flux',
        estimatedMarginImpact: '',
        urgency: 'Ce mois-ci',
        timestamp: 'Collecté FMI officiel',
        sourceName: meta.name,
        sourceUrl: `https://www.imf.org/external/datamapper/${indicatorCode}@WEO/${iso}`,
        publishedAt: checkedAt,
        relativeTime: `FMI ${latestYear}`,
        region: COUNTRY_REGIONS[iso],
        isVerifiedSource: true,
        status: 'live',
        countryCode: iso,
        isGlobal: false,
      });
    }

    if (signals.length === 0) {
      throw new Error('Aucun point de données valide extrait');
    }

    return {
      signals,
      health: {
        ...meta,
        status: 'live',
        lastCheckedAt: checkedAt,
        lastSuccessAt: checkedAt,
        signalCount: signals.length,
      },
    };
  } catch (e: any) {
    return reconcileFailedSource(meta, previousSignals, previousHealth, e?.message || 'Erreur FMI', checkedAt);
  }
}

async function fetchWorldBankMultiCountrySource(
  previousSignals: SignalItem[],
  previousHealth: SourceHealthItem[]
): Promise<SourceTaskResult> {
  const checkedAt = new Date().toISOString();
  const meta = {
    id: 'wb-wdi-gdp',
    name: 'Banque Mondiale (Open Data WDI)',
    url: 'https://api.worldbank.org/v2/country/NER;SEN;CIV;FRA;USA/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=30',
    region: 'global' as const,
    countryCodes: SUPPORTED_COUNTRIES,
  };

  try {
    const wbRes = await fetch(meta.url, {
      headers: { 'User-Agent': 'OmniVectis-Engine/2.0' },
      signal: AbortSignal.timeout(5500),
    });
    if (!wbRes.ok) {
      throw new Error(`HTTP ${wbRes.status}`);
    }
    const wbData = await wbRes.json();
    const rows = Array.isArray(wbData?.[1]) ? wbData[1] : [];
    const signals: SignalItem[] = [];

    for (const iso of SUPPORTED_COUNTRIES) {
      const latest = rows.find((r: any) => r?.countryiso3code === iso && r.value !== null && r.value !== undefined);
      if (!latest) continue;

      signals.push({
        id: `sig-wb-${iso.toLowerCase()}-gdp`,
        sourceId: meta.id,
        category: 'reglementaire',
        headline: `Banque Mondiale WDI (${COUNTRY_NAMES_FR[iso]}) : Croissance du PIB à ${Number(latest.value).toFixed(2)}% (${latest.date})`,
        context: `Indicateur brut Banque Mondiale NY.GDP.MKTP.KD.ZG pour ${COUNTRY_NAMES_FR[iso]} (${iso}) en ${latest.date} : ${Number(latest.value).toFixed(2)}%.`,
        immediateArbitragePlay: '',
        sectorId: iso === 'NER' || iso === 'SEN' || iso === 'CIV' ? 'agritech' : 'b2b_services',
        sectorName:
          iso === 'NER' || iso === 'SEN' || iso === 'CIV'
            ? 'AgriTech & Souveraineté Alimentaire'
            : 'B2B Services & Conseil',
        estimatedMarginImpact: '',
        urgency: 'Ce mois-ci',
        timestamp: 'Collecté Banque Mondiale',
        sourceName: meta.name,
        sourceUrl: `https://data.worldbank.org/country/${iso}`,
        publishedAt: checkedAt,
        relativeTime: `WDI ${latest.date}`,
        region: COUNTRY_REGIONS[iso],
        isVerifiedSource: true,
        status: 'live',
        countryCode: iso,
        isGlobal: false,
      });
    }

    if (signals.length === 0) {
      throw new Error('Aucun indicateur WDI disponible');
    }

    return {
      signals,
      health: {
        ...meta,
        status: 'live',
        lastCheckedAt: checkedAt,
        lastSuccessAt: checkedAt,
        signalCount: signals.length,
      },
    };
  } catch (e: any) {
    return reconcileFailedSource(
      meta,
      previousSignals,
      previousHealth,
      e?.name === 'TimeoutError' || e?.message?.includes('aborted')
        ? 'Délai dépassé (API Banque Mondiale)'
        : e?.message || 'Source inaccessible',
      checkedAt
    );
  }
}

async function fetchRssSource(
  config: RssSourceConfig,
  previousSignals: SignalItem[],
  previousHealth: SourceHealthItem[]
): Promise<SourceTaskResult> {
  const checkedAt = new Date().toISOString();
  const meta = {
    id: config.id,
    name: config.name,
    url: config.url,
    region: config.region,
    countryCodes: config.countryCodes,
  };

  try {
    const res = await fetch(config.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmniVectis/2.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    const items = extractXmlItems(xml);
    const signals: SignalItem[] = [];

    for (const item of items.slice(0, config.limit)) {
      const sig = classifyArticleToSignal(
        item,
        config.id,
        config.name,
        config.region,
        config.defaultCountry,
        config.isGlobalSource
      );
      if (sig) signals.push(sig);
    }

    if (signals.length === 0) {
      throw new Error('Flux RSS vide ou format non reconnu');
    }

    return {
      signals,
      health: {
        ...meta,
        status: 'live',
        lastCheckedAt: checkedAt,
        lastSuccessAt: checkedAt,
        signalCount: signals.length,
      },
    };
  } catch (e: any) {
    return reconcileFailedSource(meta, previousSignals, previousHealth, e?.message || 'Erreur flux RSS', checkedAt);
  }
}

export async function loadSignalsFromDbIfNeeded(): Promise<SignalItem[]> {
  if (cachedSignals.length > 0) return getCachedSignals();
  try {
    const stored = await getAppState<SignalItem[]>('signals');
    if (Array.isArray(stored) && stored.length > 0) {
      cachedSignals = stored.map((s) => ({ ...s, status: 'cache' as const }));
      return getCachedSignals();
    }
  } catch {
    // non-fatal, fallback to empty until harvest
  }
  return [];
}

export async function loadSourceHealthFromDbIfNeeded(): Promise<SourceHealthItem[]> {
  if (cachedSourceHealth.length > 0) return cachedSourceHealth;
  try {
    const stored = await getAppState<SourceHealthItem[]>('source_health');
    if (Array.isArray(stored) && stored.length > 0) {
      cachedSourceHealth = stored.map((h) => ({
        ...h,
        status: h.status === 'live' ? 'cache' : h.status,
      }));
      return cachedSourceHealth;
    }
  } catch {
    // non-fatal
  }
  return [];
}

export async function loadRatesFromDbIfNeeded(): Promise<LiveFxRates> {
  if (fxRatesLoadedFromDb) return cachedFxRates;
  try {
    const stored = await getAppState<LiveFxRates>('fx_rates');
    if (stored && typeof stored.XOF === 'number' && typeof stored.USD === 'number') {
      cachedFxRates = { ...stored, status: stored.status === 'live' ? 'cache' : stored.status || 'cache' };
      fxRatesLoadedFromDb = true;
      return cachedFxRates;
    }
  } catch {
    // non-fatal
  }
  return cachedFxRates;
}

export async function harvestRealTimeSignals(auditUserUid?: string): Promise<SignalItem[]> {
  if (isHarvesting && cachedSignals.length > 0) {
    return getCachedSignals();
  }

  isHarvesting = true;
  try {
    const previousSignals =
      cachedSignals.length > 0 ? cachedSignals : await loadSignalsFromDbIfNeeded();
    const previousHealth =
      cachedSourceHealth.length > 0 ? cachedSourceHealth : await loadSourceHealthFromDbIfNeeded();

    const tasks: Promise<SourceTaskResult>[] = [
      fetchFxSource(previousSignals, previousHealth),
      fetchImfIndicatorSource('NGDP_RPCH', previousSignals, previousHealth),
      fetchImfIndicatorSource('PCPIPCH', previousSignals, previousHealth),
      fetchWorldBankMultiCountrySource(previousSignals, previousHealth),
      ...RSS_SOURCES.map((cfg) => fetchRssSource(cfg, previousSignals, previousHealth)),
    ];

    const settled = await Promise.all(tasks);
    const collectedSignals: SignalItem[] = [];
    const nextHealth: SourceHealthItem[] = [];
    const seenIds = new Set<string>();

    for (const result of settled) {
      nextHealth.push(result.health);
      for (const sig of result.signals) {
        if (sig.sourceUrl && sig.sourceName && sig.isVerifiedSource && !seenIds.has(sig.id)) {
          seenIds.add(sig.id);
          collectedSignals.push(sig);
        }
      }
    }

    cachedSignals = collectedSignals;
    cachedSourceHealth = nextHealth;
    lastHarvestTime = Date.now();

    try {
      await setAppState('signals', collectedSignals);
      await setAppState('source_health', nextHealth);
    } catch (e) {
      console.error('Failed to persist signals/source_health in PostgreSQL:', e);
    }

    const liveCount = nextHealth.filter((h) => h.status === 'live').length;
    const cacheCount = nextHealth.filter((h) => h.status === 'cache').length;
    const unavailableCount = nextHealth.filter((h) => h.status === 'indisponible').length;

    try {
      const stats = await getUsageStats();
      stats.signalsCollected =
        (stats.signalsCollected || 0) + collectedSignals.filter((s) => s.status === 'live').length;
      await setAppState('usage_counter', stats);
      emitWorkspaceEvent('usage_updated', { stats });
    } catch (e) {
      console.error('Failed to update signalsCollected counter:', e);
    }

    if (auditUserUid) {
      try {
        await appendAuditLog(auditUserUid, {
          actionType: 'signal_harvested',
          actor: 'agent_serveur',
          description: `Collecte multi-pays terminée : ${collectedSignals.length} signaux (${liveCount} sources live, ${cacheCount} en cache, ${unavailableCount} indisponibles).`,
          provenanceDetails: nextHealth.map((h) => `${h.name}:${h.status}`).join(' | '),
          status: liveCount > 0 ? 'success' : 'warning',
        });
      } catch {
        // non-fatal
      }
    }

    emitSignalsUpdated();
    return getCachedSignals();
  } finally {
    isHarvesting = false;
  }
}

export function getCachedSignals(): SignalItem[] {
  return cachedSignals.map((s) => ({
    ...s,
    relativeTime: formatRelativeTime(s.publishedAt),
    timestamp:
      s.status === 'cache'
        ? `Cache (${formatRelativeTime(s.publishedAt)})`
        : `Collecté ${formatRelativeTime(s.publishedAt)}`,
  }));
}

export function getSourceHealth(): SourceHealthItem[] {
  return cachedSourceHealth;
}

export function getCachedRates(): LiveFxRates {
  return cachedFxRates;
}

export function getLastHarvestTimestamp(): number {
  return lastHarvestTime;
}

// ----------------- ONE-TIME LEGACY JSON -> POSTGRESQL MIGRATION -----------------

function readJsonFileSafe<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export async function migrateLegacyJsonIfNeeded(userUid: string): Promise<void> {
  try {
    const markerKey = `legacy_migrated_${userUid}`;
    const already = await getAppState<boolean>(markerKey);
    if (already) return;

    // Only import legacy local files if user currently has zero records across core tables
    const [existingPipe, existingSales, existingOpps] = await Promise.all([
      db.select({ id: pipelineItems.id }).from(pipelineItems).where(eq(pipelineItems.userUid, userUid)).limit(1),
      db.select({ id: realSales.id }).from(realSales).where(eq(realSales.userUid, userUid)).limit(1),
      db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.userUid, userUid)).limit(1),
    ]);

    if (existingPipe.length === 0 && existingSales.length === 0 && existingOpps.length === 0) {
      const legacyPipe = readJsonFileSafe<PersistentPipelineItem[]>(LEGACY_FILES.pipeline);
      if (Array.isArray(legacyPipe) && legacyPipe.length > 0) {
        await db
          .insert(pipelineItems)
          .values(
            legacyPipe.map((p, idx) => ({
              id: p.id,
              userUid,
              title: p.title,
              sectorId: p.sectorId,
              sectorName: p.sectorName,
              stage: p.stage,
              targetMrr: Number(p.targetMrr || 0),
              currentMrr: Number(p.currentMrr || 0),
              notes: p.notes || '',
              addedAt: p.addedAt || new Date().toLocaleDateString('fr-FR'),
              checklists: Array.isArray(p.checklists) ? p.checklists : [],
              countryCode: p.countryCode || null,
              currency: p.currency || null,
              paymentMethod: p.paymentMethod || null,
              sortOrder: idx,
              updatedAt: new Date(),
            }))
          )
          .onConflictDoNothing();
      }

      const legacyOpps = readJsonFileSafe<StrictOpportunity[]>(LEGACY_FILES.opportunities);
      if (Array.isArray(legacyOpps) && legacyOpps.length > 0) {
        await db
          .insert(opportunities)
          .values(
            legacyOpps.map((o) => ({
              id: o.id,
              userUid,
              countryCode: o.countryCode,
              type: o.type,
              title: o.title,
              description: o.description,
              sourceSignals: o.sourceSignals || [],
              whyItExists: o.whyItExists,
              confidenceLevel: o.confidenceLevel,
              risks: o.risks || [],
              invalidationTriggers: o.invalidationTriggers || [],
              targetRevenueLocal: o.targetRevenueLocal,
              estimatedMargin: o.estimatedMargin,
              hasEnoughData: Boolean(o.hasEnoughData),
              insufficientDataReason: o.insufficientDataReason || null,
              createdAt: o.createdAt || new Date().toISOString(),
            }))
          )
          .onConflictDoNothing();
      }

      const legacySales = readJsonFileSafe<RealSaleRecord[]>(LEGACY_FILES.sales);
      if (Array.isArray(legacySales) && legacySales.length > 0) {
        await db
          .insert(realSales)
          .values(
            legacySales.map((s) => ({
              id: s.id,
              userUid,
              clientName: s.clientName,
              opportunityId: s.opportunityId || null,
              opportunityTitle: s.opportunityTitle,
              amount: Number(s.amount || 0),
              currency: s.currency,
              date: s.date,
              status: s.status,
              paymentMethod: s.paymentMethod,
              notes: s.notes || null,
              reference: s.reference || null,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyValidation = readJsonFileSafe<ValidationItem[]>(LEGACY_FILES.validation);
      if (Array.isArray(legacyValidation) && legacyValidation.length > 0) {
        await db
          .insert(validationQueue)
          .values(
            legacyValidation.map((v) => ({
              id: v.id,
              userUid,
              title: v.title,
              category: v.category,
              targetRecipient: v.targetRecipient || null,
              contentPayload: v.contentPayload,
              sourceOpportunityTitle: v.sourceOpportunityTitle,
              countryCode: v.countryCode,
              status: v.status || 'en_attente',
              createdAt: v.createdAt || new Date().toISOString(),
              reviewedAt: v.reviewedAt || null,
              reviewNotes: v.reviewNotes || null,
              deliveryChannel: v.deliveryChannel || null,
              deliveryStatus: v.deliveryStatus || 'not_sent',
              deliveryTarget: v.deliveryTarget || null,
              deliverySubject: v.deliverySubject || null,
              deliveryProvider: v.deliveryProvider || null,
              deliveryMessageId: v.deliveryMessageId || null,
              deliveryError: v.deliveryError || null,
              deliveredAt: v.deliveredAt || null,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyAudit = readJsonFileSafe<AuditLogEntry[]>(LEGACY_FILES.audit);
      if (Array.isArray(legacyAudit) && legacyAudit.length > 0) {
        await db
          .insert(auditLog)
          .values(
            legacyAudit.slice(0, 200).map((a) => ({
              id: a.id,
              userUid,
              timestamp: a.timestamp,
              actionType: a.actionType,
              actor: a.actor,
              description: a.description,
              provenanceDetails: a.provenanceDetails || null,
              status: a.status,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyBlueprints = readJsonFileSafe<SavedBlueprintRecord[]>(LEGACY_FILES.blueprints);
      if (Array.isArray(legacyBlueprints) && legacyBlueprints.length > 0) {
        await db
          .insert(savedBlueprints)
          .values(
            legacyBlueprints.map((b) => ({
              id: b.id,
              userUid,
              sectorId: b.sectorId,
              sectorName: b.sectorName,
              niche: b.niche,
              targetRevenue: b.targetRevenue,
              capitalBudget: b.capitalBudget,
              userSkills: b.userSkills,
              businessModel: b.businessModel,
              blueprint: b.blueprint as unknown as Record<string, unknown>,
              createdAt: b.createdAt,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyArbitrages = readJsonFileSafe<SavedArbitrageRecord[]>(LEGACY_FILES.arbitrages);
      if (Array.isArray(legacyArbitrages) && legacyArbitrages.length > 0) {
        await db
          .insert(savedArbitrages)
          .values(
            legacyArbitrages.map((a) => ({
              id: a.id,
              userUid,
              sectorA: a.sectorA,
              sectorB: a.sectorB,
              riskTolerance: a.riskTolerance,
              analysis: a.analysis as unknown as Record<string, unknown>,
              createdAt: a.createdAt,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyLaunchpads = readJsonFileSafe<SavedLaunchpadRecord[]>(LEGACY_FILES.launchpads);
      if (Array.isArray(legacyLaunchpads) && legacyLaunchpads.length > 0) {
        await db
          .insert(savedLaunchpads)
          .values(
            legacyLaunchpads.map((l) => ({
              id: l.id,
              userUid,
              sectorId: l.sectorId,
              sectorName: l.sectorName,
              opportunityTitle: l.opportunityTitle,
              circuit: l.circuit as unknown as Record<string, unknown>,
              createdAt: l.createdAt,
            }))
          )
          .onConflictDoNothing();
      }

      const legacyKits = readJsonFileSafe<
        Record<string, { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }>
      >(LEGACY_FILES.kits);
      if (legacyKits && typeof legacyKits === 'object') {
        const entries = Object.entries(legacyKits);
        if (entries.length > 0) {
          await db
            .insert(launchKits)
            .values(
              entries.map(([oppId, k]) => ({
                id: `${userUid}:${oppId}`,
                oppId,
                userUid,
                digital: (k.digital as unknown as Record<string, unknown>) || null,
                physical: (k.physical as unknown as Record<string, unknown>) || null,
                updatedAt: new Date(),
              }))
            )
            .onConflictDoNothing();
        }
      }
    }

    await setAppState(markerKey, true);
  } catch (e) {
    console.error('Legacy JSON migration check skipped due to error:', e);
  }
}

// ----------------- PIPELINE PERSISTENCE (PostgreSQL) -----------------

export async function getPersistentPipeline(userUid: string): Promise<PersistentPipelineItem[]> {
  try {
    const rows = await db
      .select()
      .from(pipelineItems)
      .where(eq(pipelineItems.userUid, userUid))
      .orderBy(pipelineItems.sortOrder);

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      sectorId: r.sectorId,
      sectorName: r.sectorName,
      stage: r.stage as PersistentPipelineItem['stage'],
      targetMrr: Number(r.targetMrr),
      currentMrr: Number(r.currentMrr),
      notes: r.notes,
      addedAt: r.addedAt,
      checklists: r.checklists || [],
      countryCode: r.countryCode || undefined,
      currency: r.currency || undefined,
      paymentMethod: r.paymentMethod || undefined,
    }));
  } catch (error) {
    console.error('Database query failed in getPersistentPipeline:', error);
    throw new Error('Impossible de charger le pipeline depuis PostgreSQL.', { cause: error });
  }
}

export async function savePersistentPipeline(
  userUid: string,
  items: PersistentPipelineItem[]
): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(pipelineItems).where(eq(pipelineItems.userUid, userUid));
      if (items.length > 0) {
        await tx.insert(pipelineItems).values(
          items.map((item, idx) => ({
            id: item.id,
            userUid,
            title: item.title,
            sectorId: item.sectorId,
            sectorName: item.sectorName,
            stage: item.stage,
            targetMrr: Number(item.targetMrr || 0),
            currentMrr: Number(item.currentMrr || 0),
            notes: item.notes || '',
            addedAt: item.addedAt || new Date().toLocaleDateString('fr-FR'),
            checklists: Array.isArray(item.checklists) ? item.checklists : [],
            countryCode: item.countryCode || null,
            currency: item.currency || null,
            paymentMethod: item.paymentMethod || null,
            sortOrder: idx,
            updatedAt: new Date(),
          }))
        );
      }
    });
    emitWorkspaceEvent('pipeline_updated', { items }, userUid);
    return true;
  } catch (error) {
    console.error('Database query failed in savePersistentPipeline:', error);
    throw new Error('Impossible de sauvegarder le pipeline dans PostgreSQL.', { cause: error });
  }
}

// ----------------- STRICT OPPORTUNITIES PERSISTENCE (PostgreSQL) -----------------

export async function getPersistentOpportunities(
  userUid: string,
  countryCode?: string
): Promise<StrictOpportunity[]> {
  try {
    const rows =
      countryCode && countryCode !== 'all'
        ? await db
            .select()
            .from(opportunities)
            .where(
              and(eq(opportunities.userUid, userUid), eq(opportunities.countryCode, countryCode))
            )
            .orderBy(desc(opportunities.createdAt))
        : await db
            .select()
            .from(opportunities)
            .where(eq(opportunities.userUid, userUid))
            .orderBy(desc(opportunities.createdAt));

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type as StrictOpportunity['type'],
      description: r.description,
      sourceSignals: (r.sourceSignals || []) as StrictOpportunity['sourceSignals'],
      whyItExists: r.whyItExists,
      confidenceLevel: r.confidenceLevel as StrictOpportunity['confidenceLevel'],
      risks: r.risks || [],
      invalidationTriggers: r.invalidationTriggers || [],
      targetRevenueLocal: r.targetRevenueLocal,
      estimatedMargin: r.estimatedMargin,
      countryCode: r.countryCode as CountryCode,
      createdAt: r.createdAt,
      hasEnoughData: r.hasEnoughData,
      insufficientDataReason: r.insufficientDataReason || undefined,
    }));
  } catch (error) {
    console.error('Database query failed in getPersistentOpportunities:', error);
    throw new Error('Impossible de charger les opportunités depuis PostgreSQL.', { cause: error });
  }
}

export async function savePersistentOpportunities(
  userUid: string,
  items: StrictOpportunity[]
): Promise<boolean> {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(opportunities).where(eq(opportunities.userUid, userUid));
      if (items.length > 0) {
        await tx.insert(opportunities).values(
          items.map((o) => ({
            id: o.id,
            userUid,
            countryCode: o.countryCode,
            type: o.type,
            title: o.title,
            description: o.description,
            sourceSignals: o.sourceSignals || [],
            whyItExists: o.whyItExists,
            confidenceLevel: o.confidenceLevel,
            risks: o.risks || [],
            invalidationTriggers: o.invalidationTriggers || [],
            targetRevenueLocal: o.targetRevenueLocal,
            estimatedMargin: o.estimatedMargin,
            hasEnoughData: Boolean(o.hasEnoughData),
            insufficientDataReason: o.insufficientDataReason || null,
            createdAt: o.createdAt || new Date().toISOString(),
          }))
        );
      }
    });
    emitWorkspaceEvent('opportunities_updated', { opportunities: items }, userUid);
    return true;
  } catch (error) {
    console.error('Database query failed in savePersistentOpportunities:', error);
    throw new Error('Impossible de sauvegarder les opportunités dans PostgreSQL.', { cause: error });
  }
}

// ----------------- LAUNCH KITS PERSISTENCE (PostgreSQL) -----------------

export async function getPersistentKits(
  userUid: string
): Promise<Record<string, { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }>> {
  try {
    const rows = await db
      .select()
      .from(launchKits)
      .where(eq(launchKits.userUid, userUid));

    const result: Record<string, { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }> = {};
    for (const r of rows) {
      result[r.oppId] = {
        digital: (r.digital as unknown as DigitalLaunchKit) || undefined,
        physical: (r.physical as unknown as PhysicalExploitationPlan) || undefined,
      };
    }
    return result;
  } catch (error) {
    console.error('Database query failed in getPersistentKits:', error);
    throw new Error('Impossible de charger les dossiers depuis PostgreSQL.', { cause: error });
  }
}

export async function savePersistentKit(
  userUid: string,
  oppId: string,
  kit: { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }
): Promise<boolean> {
  try {
    const key = `${userUid}:${oppId}`;
    const existingRows = await db
      .select()
      .from(launchKits)
      .where(eq(launchKits.id, key))
      .limit(1);

    const existingDigital = (existingRows[0]?.digital as Record<string, unknown> | null) || null;
    const existingPhysical = (existingRows[0]?.physical as Record<string, unknown> | null) || null;

    await db
      .insert(launchKits)
      .values({
        id: key,
        oppId,
        userUid,
        digital: (kit.digital as unknown as Record<string, unknown>) ?? existingDigital,
        physical: (kit.physical as unknown as Record<string, unknown>) ?? existingPhysical,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: launchKits.id,
        set: {
          digital: (kit.digital as unknown as Record<string, unknown>) ?? existingDigital,
          physical: (kit.physical as unknown as Record<string, unknown>) ?? existingPhysical,
          updatedAt: new Date(),
        },
      });

    emitWorkspaceEvent('workspace_updated', { kind: 'kit', oppId }, userUid);
    return true;
  } catch (error) {
    console.error('Database query failed in savePersistentKit:', error);
    throw new Error('Impossible de sauvegarder le dossier dans PostgreSQL.', { cause: error });
  }
}

// ----------------- BLUEPRINT / ARBITRAGE / LAUNCHPAD PERSISTENCE (PostgreSQL) -----------------

export async function getSavedBlueprints(userUid: string): Promise<SavedBlueprintRecord[]> {
  try {
    const rows = await db
      .select()
      .from(savedBlueprints)
      .where(eq(savedBlueprints.userUid, userUid))
      .orderBy(desc(savedBlueprints.createdAt))
      .limit(30);

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      sectorId: r.sectorId as SavedBlueprintRecord['sectorId'],
      sectorName: r.sectorName,
      niche: r.niche,
      targetRevenue: r.targetRevenue,
      capitalBudget: r.capitalBudget,
      userSkills: r.userSkills,
      businessModel: r.businessModel,
      blueprint: r.blueprint as unknown as SavedBlueprintRecord['blueprint'],
    }));
  } catch (error) {
    console.error('Database query failed in getSavedBlueprints:', error);
    throw new Error('Impossible de charger les plans stratégiques.', { cause: error });
  }
}

export async function saveBlueprintRecord(
  userUid: string,
  input: Omit<SavedBlueprintRecord, 'id' | 'createdAt'>
): Promise<SavedBlueprintRecord> {
  try {
    const record: SavedBlueprintRecord = {
      ...input,
      id: `bp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    await db.insert(savedBlueprints).values({
      id: record.id,
      userUid,
      sectorId: record.sectorId,
      sectorName: record.sectorName,
      niche: record.niche,
      targetRevenue: record.targetRevenue,
      capitalBudget: record.capitalBudget,
      userSkills: record.userSkills,
      businessModel: record.businessModel,
      blueprint: record.blueprint as unknown as Record<string, unknown>,
      createdAt: record.createdAt,
    });
    const updated = await getSavedBlueprints(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'blueprint', record, blueprints: updated }, userUid);
    return record;
  } catch (error) {
    console.error('Database query failed in saveBlueprintRecord:', error);
    throw new Error('Impossible de sauvegarder le plan stratégique.', { cause: error });
  }
}

export async function deleteSavedBlueprint(
  userUid: string,
  id: string
): Promise<SavedBlueprintRecord[]> {
  try {
    await db
      .delete(savedBlueprints)
      .where(and(eq(savedBlueprints.id, id), eq(savedBlueprints.userUid, userUid)));
    const updated = await getSavedBlueprints(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'blueprint', blueprints: updated }, userUid);
    return updated;
  } catch (error) {
    console.error('Database query failed in deleteSavedBlueprint:', error);
    throw new Error('Impossible de supprimer le plan stratégique.', { cause: error });
  }
}

export async function getSavedArbitrages(userUid: string): Promise<SavedArbitrageRecord[]> {
  try {
    const rows = await db
      .select()
      .from(savedArbitrages)
      .where(eq(savedArbitrages.userUid, userUid))
      .orderBy(desc(savedArbitrages.createdAt))
      .limit(30);

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      sectorA: r.sectorA,
      sectorB: r.sectorB,
      riskTolerance: r.riskTolerance,
      analysis: r.analysis as unknown as SavedArbitrageRecord['analysis'],
    }));
  } catch (error) {
    console.error('Database query failed in getSavedArbitrages:', error);
    throw new Error('Impossible de charger les arbitrages.', { cause: error });
  }
}

export async function saveArbitrageRecord(
  userUid: string,
  input: Omit<SavedArbitrageRecord, 'id' | 'createdAt'>
): Promise<SavedArbitrageRecord> {
  try {
    const record: SavedArbitrageRecord = {
      ...input,
      id: `arb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    await db.insert(savedArbitrages).values({
      id: record.id,
      userUid,
      sectorA: record.sectorA,
      sectorB: record.sectorB,
      riskTolerance: record.riskTolerance,
      analysis: record.analysis as unknown as Record<string, unknown>,
      createdAt: record.createdAt,
    });
    const updated = await getSavedArbitrages(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'arbitrage', record, arbitrages: updated }, userUid);
    return record;
  } catch (error) {
    console.error('Database query failed in saveArbitrageRecord:', error);
    throw new Error('Impossible de sauvegarder l’arbitrage.', { cause: error });
  }
}

export async function deleteSavedArbitrage(
  userUid: string,
  id: string
): Promise<SavedArbitrageRecord[]> {
  try {
    await db
      .delete(savedArbitrages)
      .where(and(eq(savedArbitrages.id, id), eq(savedArbitrages.userUid, userUid)));
    const updated = await getSavedArbitrages(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'arbitrage', arbitrages: updated }, userUid);
    return updated;
  } catch (error) {
    console.error('Database query failed in deleteSavedArbitrage:', error);
    throw new Error('Impossible de supprimer l’arbitrage.', { cause: error });
  }
}

export async function getSavedLaunchpads(userUid: string): Promise<SavedLaunchpadRecord[]> {
  try {
    const rows = await db
      .select()
      .from(savedLaunchpads)
      .where(eq(savedLaunchpads.userUid, userUid))
      .orderBy(desc(savedLaunchpads.createdAt))
      .limit(30);

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      sectorId: r.sectorId as SavedLaunchpadRecord['sectorId'],
      sectorName: r.sectorName,
      opportunityTitle: r.opportunityTitle,
      circuit: r.circuit as unknown as SavedLaunchpadRecord['circuit'],
    }));
  } catch (error) {
    console.error('Database query failed in getSavedLaunchpads:', error);
    throw new Error('Impossible de charger les circuits Launchpad.', { cause: error });
  }
}

export async function saveLaunchpadRecord(
  userUid: string,
  input: Omit<SavedLaunchpadRecord, 'id' | 'createdAt'>
): Promise<SavedLaunchpadRecord> {
  try {
    const record: SavedLaunchpadRecord = {
      ...input,
      id: `lp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    await db.insert(savedLaunchpads).values({
      id: record.id,
      userUid,
      sectorId: record.sectorId,
      sectorName: record.sectorName,
      opportunityTitle: record.opportunityTitle,
      circuit: record.circuit as unknown as Record<string, unknown>,
      createdAt: record.createdAt,
    });
    const updated = await getSavedLaunchpads(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'launchpad', record, launchpads: updated }, userUid);
    return record;
  } catch (error) {
    console.error('Database query failed in saveLaunchpadRecord:', error);
    throw new Error('Impossible de sauvegarder le circuit Launchpad.', { cause: error });
  }
}

export async function deleteSavedLaunchpad(
  userUid: string,
  id: string
): Promise<SavedLaunchpadRecord[]> {
  try {
    await db
      .delete(savedLaunchpads)
      .where(and(eq(savedLaunchpads.id, id), eq(savedLaunchpads.userUid, userUid)));
    const updated = await getSavedLaunchpads(userUid);
    emitWorkspaceEvent('workspace_updated', { kind: 'launchpad', launchpads: updated }, userUid);
    return updated;
  } catch (error) {
    console.error('Database query failed in deleteSavedLaunchpad:', error);
    throw new Error('Impossible de supprimer le circuit Launchpad.', { cause: error });
  }
}

// ----------------- VALIDATION QUEUE (PostgreSQL + Delivery Tracking) -----------------

function mapValidationRow(r: typeof validationQueue.$inferSelect): ValidationItem {
  return {
    id: r.id,
    title: r.title,
    category: r.category as ValidationItem['category'],
    targetRecipient: r.targetRecipient || undefined,
    contentPayload: r.contentPayload,
    sourceOpportunityTitle: r.sourceOpportunityTitle,
    countryCode: r.countryCode as CountryCode,
    createdAt: r.createdAt,
    status: r.status as ValidationItem['status'],
    reviewedAt: r.reviewedAt || undefined,
    reviewNotes: r.reviewNotes || undefined,
    deliveryChannel: (r.deliveryChannel as ValidationItem['deliveryChannel']) || undefined,
    deliveryStatus: (r.deliveryStatus as ValidationItem['deliveryStatus']) || undefined,
    deliveryTarget: r.deliveryTarget || undefined,
    deliverySubject: r.deliverySubject || undefined,
    deliveryProvider: r.deliveryProvider || undefined,
    deliveryMessageId: r.deliveryMessageId || undefined,
    deliveryError: r.deliveryError || undefined,
    deliveredAt: r.deliveredAt || undefined,
  };
}

export async function getValidationQueue(userUid: string): Promise<ValidationItem[]> {
  try {
    const rows = await db
      .select()
      .from(validationQueue)
      .where(eq(validationQueue.userUid, userUid))
      .orderBy(desc(validationQueue.createdAt));

    return rows.map(mapValidationRow);
  } catch (error) {
    console.error('Database query failed in getValidationQueue:', error);
    throw new Error('Impossible de charger la file de validation.', { cause: error });
  }
}

export async function getValidationItemById(
  userUid: string,
  id: string
): Promise<ValidationItem | null> {
  try {
    const rows = await db
      .select()
      .from(validationQueue)
      .where(and(eq(validationQueue.id, id), eq(validationQueue.userUid, userUid)))
      .limit(1);
    return rows[0] ? mapValidationRow(rows[0]) : null;
  } catch (error) {
    console.error('Database query failed in getValidationItemById:', error);
    throw new Error('Impossible de lire cet élément de validation.', { cause: error });
  }
}

export async function addValidationItem(
  userUid: string,
  item: Omit<ValidationItem, 'id' | 'createdAt' | 'status'>
): Promise<ValidationItem> {
  try {
    const newItem: ValidationItem = {
      ...item,
      id: `val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      status: 'en_attente',
      deliveryStatus: 'not_sent',
    };

    await db.insert(validationQueue).values({
      id: newItem.id,
      userUid,
      title: newItem.title,
      category: newItem.category,
      targetRecipient: newItem.targetRecipient || null,
      contentPayload: newItem.contentPayload,
      sourceOpportunityTitle: newItem.sourceOpportunityTitle,
      countryCode: newItem.countryCode,
      status: newItem.status,
      createdAt: newItem.createdAt,
      deliveryStatus: 'not_sent',
    });

    const updated = await getValidationQueue(userUid);
    emitWorkspaceEvent('validation_updated', { items: updated }, userUid);

    await appendAuditLog(userUid, {
      actionType: 'item_queued',
      actor: 'agent_serveur',
      description: `Élément mis en file d attente de validation : ${newItem.title}`,
      provenanceDetails: newItem.sourceOpportunityTitle,
      status: 'warning',
    });

    return newItem;
  } catch (error) {
    console.error('Database query failed in addValidationItem:', error);
    throw new Error('Impossible d’ajouter l’élément à la file de validation.', { cause: error });
  }
}

export async function updateValidationStatus(
  userUid: string,
  id: string,
  status: 'valide' | 'rejete',
  reviewNotes?: string
): Promise<ValidationItem | null> {
  try {
    const existing = await getValidationItemById(userUid, id);
    if (!existing) return null;

    const reviewedAt = new Date().toISOString();
    const rows = await db
      .update(validationQueue)
      .set({
        status,
        reviewedAt,
        reviewNotes: reviewNotes || existing.reviewNotes || null,
      })
      .where(and(eq(validationQueue.id, id), eq(validationQueue.userUid, userUid)))
      .returning();

    if (rows.length === 0) return null;

    const updatedItem = mapValidationRow(rows[0]);
    const allItems = await getValidationQueue(userUid);
    emitWorkspaceEvent('validation_updated', { items: allItems }, userUid);

    await appendAuditLog(userUid, {
      actionType: status === 'valide' ? 'item_validated' : 'item_rejected',
      actor: 'utilisateur',
      description: `Élément ${status === 'valide' ? 'validé manuellement' : 'rejeté'} : ${updatedItem.title}`,
      provenanceDetails: updatedItem.sourceOpportunityTitle,
      status: status === 'valide' ? 'success' : 'warning',
    });

    return updatedItem;
  } catch (error) {
    console.error('Database query failed in updateValidationStatus:', error);
    throw new Error('Impossible de mettre à jour le statut de validation.', { cause: error });
  }
}

export async function updateValidationDelivery(
  userUid: string,
  id: string,
  delivery: {
    deliveryChannel: 'email' | 'whatsapp' | 'webhook' | 'none';
    deliveryStatus: 'not_sent' | 'sent' | 'failed';
    deliveryTarget?: string;
    deliverySubject?: string;
    deliveryProvider?: string;
    deliveryMessageId?: string;
    deliveryError?: string;
    deliveredAt?: string;
  }
): Promise<ValidationItem | null> {
  try {
    const rows = await db
      .update(validationQueue)
      .set({
        deliveryChannel: delivery.deliveryChannel,
        deliveryStatus: delivery.deliveryStatus,
        deliveryTarget: delivery.deliveryTarget || null,
        deliverySubject: delivery.deliverySubject || null,
        deliveryProvider: delivery.deliveryProvider || null,
        deliveryMessageId: delivery.deliveryMessageId || null,
        deliveryError: delivery.deliveryError || null,
        deliveredAt: delivery.deliveredAt || null,
      })
      .where(and(eq(validationQueue.id, id), eq(validationQueue.userUid, userUid)))
      .returning();

    if (rows.length === 0) return null;
    const updatedItem = mapValidationRow(rows[0]);
    const allItems = await getValidationQueue(userUid);
    emitWorkspaceEvent('validation_updated', { items: allItems }, userUid);
    return updatedItem;
  } catch (error) {
    console.error('Database query failed in updateValidationDelivery:', error);
    throw new Error('Impossible d’enregistrer le résultat d’envoi.', { cause: error });
  }
}

// ----------------- AUDIT LOG PERSISTENCE (PostgreSQL) -----------------

export async function getAuditLog(userUid: string): Promise<AuditLogEntry[]> {
  try {
    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userUid, userUid))
      .orderBy(desc(auditLog.timestamp))
      .limit(500);

    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      actionType: r.actionType as AuditLogEntry['actionType'],
      actor: r.actor as AuditLogEntry['actor'],
      description: r.description,
      provenanceDetails: r.provenanceDetails || undefined,
      status: r.status as AuditLogEntry['status'],
    }));
  } catch (error) {
    console.error('Database query failed in getAuditLog:', error);
    throw new Error('Impossible de charger le journal d’audit.', { cause: error });
  }
}

export async function appendAuditLog(
  userUid: string,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<AuditLogEntry> {
  try {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };

    await db.insert(auditLog).values({
      id: newEntry.id,
      userUid,
      timestamp: newEntry.timestamp,
      actionType: newEntry.actionType,
      actor: newEntry.actor,
      description: newEntry.description,
      provenanceDetails: newEntry.provenanceDetails || null,
      status: newEntry.status,
    });

    const entries = await getAuditLog(userUid);
    emitWorkspaceEvent('audit_updated', { entries, latest: newEntry }, userUid);
    return newEntry;
  } catch (error) {
    console.error('Database query failed in appendAuditLog:', error);
    throw new Error('Impossible d’écrire dans le journal d’audit.', { cause: error });
  }
}

// ----------------- REAL SALES TRACKING (PostgreSQL) -----------------

export async function getRealSales(userUid: string): Promise<RealSaleRecord[]> {
  try {
    const rows = await db
      .select()
      .from(realSales)
      .where(eq(realSales.userUid, userUid))
      .orderBy(desc(realSales.createdAt));

    return rows.map((r) => ({
      id: r.id,
      clientName: r.clientName,
      opportunityId: r.opportunityId || undefined,
      opportunityTitle: r.opportunityTitle,
      amount: Number(r.amount),
      currency: r.currency as RealSaleRecord['currency'],
      date: r.date,
      status: r.status as RealSaleRecord['status'],
      paymentMethod: r.paymentMethod,
      notes: r.notes || undefined,
      reference: r.reference || undefined,
    }));
  } catch (error) {
    console.error('Database query failed in getRealSales:', error);
    throw new Error('Impossible de charger les ventes depuis PostgreSQL.', { cause: error });
  }
}

export async function addRealSale(
  userUid: string,
  sale: Omit<RealSaleRecord, 'id'>
): Promise<RealSaleRecord> {
  try {
    const newSale: RealSaleRecord = {
      ...sale,
      id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    await db.insert(realSales).values({
      id: newSale.id,
      userUid,
      clientName: newSale.clientName,
      opportunityId: newSale.opportunityId || null,
      opportunityTitle: newSale.opportunityTitle,
      amount: Number(newSale.amount),
      currency: newSale.currency,
      date: newSale.date,
      status: newSale.status,
      paymentMethod: newSale.paymentMethod,
      notes: newSale.notes || null,
      reference: newSale.reference || null,
    });

    const updated = await getRealSales(userUid);
    emitWorkspaceEvent('sales_updated', { sales: updated, latest: newSale }, userUid);

    await appendAuditLog(userUid, {
      actionType: 'sale_recorded',
      actor: 'utilisateur',
      description: `Encaissement réel enregistré : ${newSale.amount.toLocaleString()} ${newSale.currency} de ${newSale.clientName} (${newSale.paymentMethod})`,
      provenanceDetails: newSale.opportunityTitle,
      status: 'success',
    });

    return newSale;
  } catch (error) {
    console.error('Database query failed in addRealSale:', error);
    throw new Error('Impossible d’enregistrer la vente dans PostgreSQL.', { cause: error });
  }
}

export async function updateRealSale(
  userUid: string,
  id: string,
  patch: Partial<Omit<RealSaleRecord, 'id'>>
): Promise<RealSaleRecord | null> {
  try {
    const existingRows = await db
      .select()
      .from(realSales)
      .where(and(eq(realSales.id, id), eq(realSales.userUid, userUid)))
      .limit(1);

    if (existingRows.length === 0) return null;
    const prev = existingRows[0];

    const updateSet: Record<string, unknown> = {};
    if (patch.clientName !== undefined) updateSet.clientName = patch.clientName;
    if (patch.opportunityTitle !== undefined) updateSet.opportunityTitle = patch.opportunityTitle;
    if (patch.amount !== undefined) updateSet.amount = Number(patch.amount);
    if (patch.currency !== undefined) updateSet.currency = patch.currency;
    if (patch.date !== undefined) updateSet.date = patch.date;
    if (patch.status !== undefined) updateSet.status = patch.status;
    if (patch.paymentMethod !== undefined) updateSet.paymentMethod = patch.paymentMethod;
    if (patch.notes !== undefined) updateSet.notes = patch.notes || null;
    if (patch.reference !== undefined) updateSet.reference = patch.reference || null;

    if (Object.keys(updateSet).length === 0) {
      return {
        id: prev.id,
        clientName: prev.clientName,
        opportunityId: prev.opportunityId || undefined,
        opportunityTitle: prev.opportunityTitle,
        amount: Number(prev.amount),
        currency: prev.currency as RealSaleRecord['currency'],
        date: prev.date,
        status: prev.status as RealSaleRecord['status'],
        paymentMethod: prev.paymentMethod,
        notes: prev.notes || undefined,
        reference: prev.reference || undefined,
      };
    }

    const updatedRows = await db
      .update(realSales)
      .set(updateSet)
      .where(and(eq(realSales.id, id), eq(realSales.userUid, userUid)))
      .returning();

    if (updatedRows.length === 0) return null;
    const r = updatedRows[0];
    const mapped: RealSaleRecord = {
      id: r.id,
      clientName: r.clientName,
      opportunityId: r.opportunityId || undefined,
      opportunityTitle: r.opportunityTitle,
      amount: Number(r.amount),
      currency: r.currency as RealSaleRecord['currency'],
      date: r.date,
      status: r.status as RealSaleRecord['status'],
      paymentMethod: r.paymentMethod,
      notes: r.notes || undefined,
      reference: r.reference || undefined,
    };

    const allSales = await getRealSales(userUid);
    emitWorkspaceEvent('sales_updated', { sales: allSales, latest: mapped }, userUid);

    const becamePaid = prev.status !== 'encaisse' && mapped.status === 'encaisse';
    await appendAuditLog(userUid, {
      actionType: 'sale_recorded',
      actor: 'utilisateur',
      description: becamePaid
        ? `Encaissement confirmé : ${mapped.amount.toLocaleString()} ${mapped.currency} de ${mapped.clientName} (${mapped.paymentMethod})`
        : `Écriture de vente mise à jour : ${mapped.clientName} — ${mapped.amount.toLocaleString()} ${mapped.currency} (${mapped.status})`,
      provenanceDetails: mapped.opportunityTitle,
      status: 'success',
    });

    return mapped;
  } catch (error) {
    console.error('Database query failed in updateRealSale:', error);
    throw new Error('Impossible de mettre à jour la vente dans PostgreSQL.', { cause: error });
  }
}

export async function deleteRealSale(userUid: string, id: string): Promise<boolean> {
  try {
    await db
      .delete(realSales)
      .where(and(eq(realSales.id, id), eq(realSales.userUid, userUid)));
    const updated = await getRealSales(userUid);
    emitWorkspaceEvent('sales_updated', { sales: updated }, userUid);
    return true;
  } catch (error) {
    console.error('Database query failed in deleteRealSale:', error);
    throw new Error('Impossible de supprimer la vente.', { cause: error });
  }
}

// ----------------- COMPANY BILLING PROFILE (PostgreSQL) -----------------

export async function getCompanyProfile(userUid: string): Promise<CompanyProfile> {
  try {
    const rows = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userUid, userUid))
      .limit(1);

    if (rows.length === 0) {
      return {
        companyName: '',
        nif: '',
        phone: '',
        iban: '',
        selectedBank: '',
        selectedMobileOperator: '',
        selectedAgency: '',
        customPaymentLink: '',
      };
    }

    const r = rows[0];
    return {
      companyName: r.companyName,
      nif: r.nif,
      phone: r.phone,
      iban: r.iban,
      selectedBank: r.selectedBank,
      selectedMobileOperator: r.selectedMobileOperator,
      selectedAgency: r.selectedAgency,
      customPaymentLink: r.customPaymentLink,
      updatedAt: r.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in getCompanyProfile:', error);
    throw new Error('Impossible de charger le profil entreprise.', { cause: error });
  }
}

export async function saveCompanyProfile(
  userUid: string,
  input: Partial<CompanyProfile>
): Promise<CompanyProfile> {
  try {
    const existing = await getCompanyProfile(userUid);
    const merged: CompanyProfile = {
      companyName: typeof input.companyName === 'string' ? input.companyName.trim() : existing.companyName,
      nif: typeof input.nif === 'string' ? input.nif.trim() : existing.nif,
      phone: typeof input.phone === 'string' ? input.phone.trim() : existing.phone,
      iban: typeof input.iban === 'string' ? input.iban.trim() : existing.iban,
      selectedBank: typeof input.selectedBank === 'string' ? input.selectedBank.trim() : existing.selectedBank,
      selectedMobileOperator:
        typeof input.selectedMobileOperator === 'string'
          ? input.selectedMobileOperator.trim()
          : existing.selectedMobileOperator,
      selectedAgency: typeof input.selectedAgency === 'string' ? input.selectedAgency.trim() : existing.selectedAgency,
      customPaymentLink:
        typeof input.customPaymentLink === 'string' ? input.customPaymentLink.trim() : existing.customPaymentLink,
    };

    const now = new Date();
    const rows = await db
      .insert(companyProfiles)
      .values({
        userUid,
        companyName: merged.companyName,
        nif: merged.nif,
        phone: merged.phone,
        iban: merged.iban,
        selectedBank: merged.selectedBank,
        selectedMobileOperator: merged.selectedMobileOperator,
        selectedAgency: merged.selectedAgency,
        customPaymentLink: merged.customPaymentLink,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: companyProfiles.userUid,
        set: {
          companyName: merged.companyName,
          nif: merged.nif,
          phone: merged.phone,
          iban: merged.iban,
          selectedBank: merged.selectedBank,
          selectedMobileOperator: merged.selectedMobileOperator,
          selectedAgency: merged.selectedAgency,
          customPaymentLink: merged.customPaymentLink,
          updatedAt: now,
        },
      })
      .returning();

    const r = rows[0];
    const saved: CompanyProfile = {
      companyName: r.companyName,
      nif: r.nif,
      phone: r.phone,
      iban: r.iban,
      selectedBank: r.selectedBank,
      selectedMobileOperator: r.selectedMobileOperator,
      selectedAgency: r.selectedAgency,
      customPaymentLink: r.customPaymentLink,
      updatedAt: r.updatedAt?.toISOString(),
    };

    emitWorkspaceEvent('workspace_updated', { kind: 'profile', profile: saved }, userUid);
    return saved;
  } catch (error) {
    console.error('Database query failed in saveCompanyProfile:', error);
    throw new Error('Impossible de sauvegarder le profil entreprise.', { cause: error });
  }
}

// ----------------- USAGE COUNTER & API METRICS (PostgreSQL app_state) -----------------

const DEFAULT_USAGE: UsageCounterStats = {
  totalGeminiCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  signalsCollected: 0,
  opportunitiesSynthesized: 0,
  kitsGenerated: 0,
  lastResponseTimeMs: 0,
};

export async function getUsageStats(): Promise<UsageCounterStats> {
  try {
    const stored = await getAppState<UsageCounterStats>('usage_counter');
    return stored ? { ...DEFAULT_USAGE, ...stored } : { ...DEFAULT_USAGE };
  } catch {
    return { ...DEFAULT_USAGE };
  }
}

export async function recordGeminiCall(
  durationMs: number,
  success: boolean,
  errorMessage?: string,
  extra?: { signalsCollected?: number; opportunitiesSynthesized?: number; kitsGenerated?: number },
  userUid?: string
): Promise<UsageCounterStats> {
  const current = await getUsageStats();
  current.totalGeminiCalls += 1;
  if (success) {
    current.successfulCalls += 1;
  } else {
    current.failedCalls += 1;
  }
  current.lastResponseTimeMs = durationMs;
  if (extra?.signalsCollected) current.signalsCollected += extra.signalsCollected;
  if (extra?.opportunitiesSynthesized) current.opportunitiesSynthesized += extra.opportunitiesSynthesized;
  if (extra?.kitsGenerated) current.kitsGenerated += extra.kitsGenerated;

  if (errorMessage) {
    current.lastGeminiError = {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
    if (userUid) {
      try {
        await appendAuditLog(userUid, {
          actionType: 'api_error',
          actor: 'gemini_api',
          description: `Erreur API Gemini : ${errorMessage}`,
          status: 'error',
        });
      } catch {
        // non-fatal
      }
    }
  }

  try {
    await setAppState('usage_counter', current);
    emitWorkspaceEvent('usage_updated', { stats: current });
  } catch (e) {
    console.error('Error saving usage stats to PostgreSQL:', e);
  }

  return current;
}
