import fs from 'fs';
import path from 'path';
import {
  CountryCode,
  StrictOpportunity,
  DigitalLaunchKit,
  PhysicalExploitationPlan,
  ValidationItem,
  AuditLogEntry,
  RealSaleRecord,
  UsageCounterStats,
  SourceHealthItem,
  LiveFxRates,
  SavedBlueprintRecord,
  SavedArbitrageRecord,
  SavedLaunchpadRecord,
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
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');
const SOURCE_HEALTH_FILE = path.join(DATA_DIR, 'source_health.json');
const PIPELINE_FILE = path.join(DATA_DIR, 'pipeline.json');
const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const KITS_FILE = path.join(DATA_DIR, 'kits.json');
const VALIDATION_FILE = path.join(DATA_DIR, 'validation_queue.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage_counter.json');
const RATES_FILE = path.join(DATA_DIR, 'rates.json');
const BLUEPRINTS_FILE = path.join(DATA_DIR, 'blueprints.json');
const ARBITRAGES_FILE = path.join(DATA_DIR, 'arbitrages.json');
const LAUNCHPADS_FILE = path.join(DATA_DIR, 'launchpads.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

function loadRatesFromDisk(): LiveFxRates | null {
  if (!fs.existsSync(RATES_FILE)) return null;
  try {
    const raw = fs.readFileSync(RATES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed?.XOF === 'number' && typeof parsed?.USD === 'number') {
      return {
        EUR: 1,
        XOF: parsed.XOF,
        USD: parsed.USD,
        lastUpdate: parsed.lastUpdate || new Date().toISOString(),
        status: 'cache',
      };
    }
  } catch (e) {
    console.error('Error reading rates.json:', e);
  }
  return null;
}

// In-memory cache & subscribers
let cachedSignals: SignalItem[] = [];
let cachedSourceHealth: SourceHealthItem[] = [];
let lastHarvestTime: number = 0;
let isHarvesting: boolean = false;
let cachedFxRates: LiveFxRates = loadRatesFromDisk() || {
  XOF: 655.957,
  USD: 1.08,
  EUR: 1,
  lastUpdate: new Date().toISOString(),
  status: 'fallback',
};

type SignalsListener = (payload: {
  signals: SignalItem[];
  sourceHealth: SourceHealthItem[];
  rates: LiveFxRates;
  lastSync: string;
  timestamp: string;
}) => void;

type WorkspaceEventListener = (eventName: string, payload: unknown) => void;

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

function emitWorkspaceEvent(eventName: string, payload: unknown) {
  for (const listener of workspaceEventListeners) {
    try {
      listener(eventName, payload);
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
    rates: getCachedRates(),
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

// Parse RSS (<item>) and Atom (<entry>) XML feeds
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

function detectCountryCode(
  textLower: string,
  defaultCountry?: CountryCode
): CountryCode | undefined {
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

// Classify and build signal from real RSS/Atom excerpt
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

    try {
      fs.writeFileSync(RATES_FILE, JSON.stringify(cachedFxRates, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist rates.json:', e);
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
      e?.name === 'TimeoutError' || e?.message?.includes('aborted') ? 'Délai dépassé (API Banque Mondiale)' : e?.message || 'Source inaccessible',
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

function loadSignalsFromDisk(): SignalItem[] {
  if (!fs.existsSync(SIGNALS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SIGNALS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading signals.json:', e);
    return [];
  }
}

function loadSourceHealthFromDisk(): SourceHealthItem[] {
  if (!fs.existsSync(SOURCE_HEALTH_FILE)) return [];
  try {
    const raw = fs.readFileSync(SOURCE_HEALTH_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading source_health.json:', e);
    return [];
  }
}

// Core multi-country live harvester function
export async function harvestRealTimeSignals(): Promise<SignalItem[]> {
  if (isHarvesting && cachedSignals.length > 0) {
    return getCachedSignals();
  }

  isHarvesting = true;
  try {
    const previousSignals = cachedSignals.length > 0 ? cachedSignals : loadSignalsFromDisk();
    const previousHealth = cachedSourceHealth.length > 0 ? cachedSourceHealth : loadSourceHealthFromDisk();

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
      fs.writeFileSync(SIGNALS_FILE, JSON.stringify(collectedSignals, null, 2), 'utf-8');
      fs.writeFileSync(SOURCE_HEALTH_FILE, JSON.stringify(nextHealth, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist signals/source_health:', e);
    }

    const liveCount = nextHealth.filter((h) => h.status === 'live').length;
    const cacheCount = nextHealth.filter((h) => h.status === 'cache').length;
    const unavailableCount = nextHealth.filter((h) => h.status === 'indisponible').length;

    // Increment collected signals counter on usage stats
    try {
      const stats = getUsageStats();
      stats.signalsCollected = (stats.signalsCollected || 0) + collectedSignals.filter((s) => s.status === 'live').length;
      fs.writeFileSync(USAGE_FILE, JSON.stringify(stats, null, 2), 'utf-8');
      emitWorkspaceEvent('usage_updated', { stats });
    } catch (e) {
      console.error('Failed to update signalsCollected counter:', e);
    }

    appendAuditLog({
      actionType: 'signal_harvested',
      actor: 'agent_serveur',
      description: `Collecte multi-pays terminée : ${collectedSignals.length} signaux (${liveCount} sources live, ${cacheCount} en cache, ${unavailableCount} indisponibles).`,
      provenanceDetails: nextHealth.map((h) => `${h.name}:${h.status}`).join(' | '),
      status: liveCount > 0 ? 'success' : 'warning',
    });

    emitSignalsUpdated();
    return getCachedSignals();
  } finally {
    isHarvesting = false;
  }
}

export function getCachedSignals(): SignalItem[] {
  if (cachedSignals.length > 0) {
    return cachedSignals.map((s) => ({
      ...s,
      relativeTime: formatRelativeTime(s.publishedAt),
      timestamp:
        s.status === 'cache'
          ? `Cache (${formatRelativeTime(s.publishedAt)})`
          : `Collecté ${formatRelativeTime(s.publishedAt)}`,
    }));
  }

  const diskSignals = loadSignalsFromDisk();
  if (diskSignals.length > 0) {
    // Loaded from disk after cold start -> mark status 'cache' until live harvest refreshes
    cachedSignals = diskSignals.map((s) => ({
      ...s,
      status: 'cache' as const,
    }));
    return cachedSignals.map((s) => ({
      ...s,
      relativeTime: formatRelativeTime(s.publishedAt),
      timestamp: `Cache (${formatRelativeTime(s.publishedAt)})`,
    }));
  }

  return [];
}

export function getSourceHealth(): SourceHealthItem[] {
  if (cachedSourceHealth.length > 0) {
    return cachedSourceHealth;
  }
  const diskHealth = loadSourceHealthFromDisk();
  if (diskHealth.length > 0) {
    cachedSourceHealth = diskHealth.map((h) => ({
      ...h,
      status: h.status === 'live' ? 'cache' : h.status,
    }));
    return cachedSourceHealth;
  }
  return [];
}

export function getCachedRates(): LiveFxRates {
  return cachedFxRates;
}

export function getLastHarvestTimestamp(): number {
  return lastHarvestTime;
}

// ----------------- PIPELINE PERSISTENCE (Multi-device database) -----------------

export function getPersistentPipeline(): PersistentPipelineItem[] {
  if (fs.existsSync(PIPELINE_FILE)) {
    try {
      const data = fs.readFileSync(PIPELINE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading pipeline.json:', e);
    }
  }

  return [];
}

export function savePersistentPipeline(items: PersistentPipelineItem[]): boolean {
  try {
    fs.writeFileSync(PIPELINE_FILE, JSON.stringify(items, null, 2), 'utf-8');
    emitWorkspaceEvent('pipeline_updated', { items });
    return true;
  } catch (e) {
    console.error('Error writing pipeline.json:', e);
    return false;
  }
}

// ----------------- STRICT OPPORTUNITIES PERSISTENCE -----------------

export function getPersistentOpportunities(countryCode?: string): StrictOpportunity[] {
  if (fs.existsSync(OPPORTUNITIES_FILE)) {
    try {
      const data = fs.readFileSync(OPPORTUNITIES_FILE, 'utf-8');
      const all: StrictOpportunity[] = JSON.parse(data);
      if (countryCode && countryCode !== 'all') {
        return all.filter((o) => o.countryCode === countryCode);
      }
      return all;
    } catch (e) {
      console.error('Error reading opportunities.json:', e);
    }
  }
  return [];
}

export function savePersistentOpportunities(items: StrictOpportunity[]): boolean {
  try {
    fs.writeFileSync(OPPORTUNITIES_FILE, JSON.stringify(items, null, 2), 'utf-8');
    emitWorkspaceEvent('opportunities_updated', { opportunities: items });
    return true;
  } catch (e) {
    console.error('Error writing opportunities.json:', e);
    return false;
  }
}

// ----------------- LAUNCH KITS PERSISTENCE -----------------

export function getPersistentKits(): Record<string, { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }> {
  if (fs.existsSync(KITS_FILE)) {
    try {
      const data = fs.readFileSync(KITS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading kits.json:', e);
    }
  }
  return {};
}

export function savePersistentKit(
  oppId: string,
  kit: { digital?: DigitalLaunchKit; physical?: PhysicalExploitationPlan }
): boolean {
  try {
    const existing = getPersistentKits();
    existing[oppId] = { ...existing[oppId], ...kit };
    fs.writeFileSync(KITS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'kit', oppId });
    return true;
  } catch (e) {
    console.error('Error writing kits.json:', e);
    return false;
  }
}

// ----------------- BLUEPRINT / ARBITRAGE / LAUNCHPAD PERSISTENCE -----------------

export function getSavedBlueprints(): SavedBlueprintRecord[] {
  if (fs.existsSync(BLUEPRINTS_FILE)) {
    try {
      const data = fs.readFileSync(BLUEPRINTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading blueprints.json:', e);
    }
  }
  return [];
}

export function saveBlueprintRecord(
  input: Omit<SavedBlueprintRecord, 'id' | 'createdAt'>
): SavedBlueprintRecord {
  const current = getSavedBlueprints();
  const record: SavedBlueprintRecord = {
    ...input,
    id: `bp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [record, ...current].slice(0, 30);
  try {
    fs.writeFileSync(BLUEPRINTS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'blueprint', record, blueprints: updated });
  } catch (e) {
    console.error('Error writing blueprints.json:', e);
  }
  return record;
}

export function deleteSavedBlueprint(id: string): SavedBlueprintRecord[] {
  const updated = getSavedBlueprints().filter((b) => b.id !== id);
  try {
    fs.writeFileSync(BLUEPRINTS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'blueprint', blueprints: updated });
  } catch (e) {
    console.error('Error deleting blueprint:', e);
  }
  return updated;
}

export function getSavedArbitrages(): SavedArbitrageRecord[] {
  if (fs.existsSync(ARBITRAGES_FILE)) {
    try {
      const data = fs.readFileSync(ARBITRAGES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading arbitrages.json:', e);
    }
  }
  return [];
}

export function saveArbitrageRecord(
  input: Omit<SavedArbitrageRecord, 'id' | 'createdAt'>
): SavedArbitrageRecord {
  const current = getSavedArbitrages();
  const record: SavedArbitrageRecord = {
    ...input,
    id: `arb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [record, ...current].slice(0, 30);
  try {
    fs.writeFileSync(ARBITRAGES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'arbitrage', record, arbitrages: updated });
  } catch (e) {
    console.error('Error writing arbitrages.json:', e);
  }
  return record;
}

export function deleteSavedArbitrage(id: string): SavedArbitrageRecord[] {
  const updated = getSavedArbitrages().filter((a) => a.id !== id);
  try {
    fs.writeFileSync(ARBITRAGES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'arbitrage', arbitrages: updated });
  } catch (e) {
    console.error('Error deleting arbitrage:', e);
  }
  return updated;
}

export function getSavedLaunchpads(): SavedLaunchpadRecord[] {
  if (fs.existsSync(LAUNCHPADS_FILE)) {
    try {
      const data = fs.readFileSync(LAUNCHPADS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error reading launchpads.json:', e);
    }
  }
  return [];
}

export function saveLaunchpadRecord(
  input: Omit<SavedLaunchpadRecord, 'id' | 'createdAt'>
): SavedLaunchpadRecord {
  const current = getSavedLaunchpads();
  const record: SavedLaunchpadRecord = {
    ...input,
    id: `lp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [record, ...current].slice(0, 30);
  try {
    fs.writeFileSync(LAUNCHPADS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'launchpad', record, launchpads: updated });
  } catch (e) {
    console.error('Error writing launchpads.json:', e);
  }
  return record;
}

export function deleteSavedLaunchpad(id: string): SavedLaunchpadRecord[] {
  const updated = getSavedLaunchpads().filter((l) => l.id !== id);
  try {
    fs.writeFileSync(LAUNCHPADS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('workspace_updated', { kind: 'launchpad', launchpads: updated });
  } catch (e) {
    console.error('Error deleting launchpad:', e);
  }
  return updated;
}

// ----------------- VALIDATION QUEUE (Rien sans validation) -----------------

export function getValidationQueue(): ValidationItem[] {
  if (fs.existsSync(VALIDATION_FILE)) {
    try {
      const data = fs.readFileSync(VALIDATION_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading validation_queue.json:', e);
    }
  }
  return [];
}

export function saveValidationQueue(items: ValidationItem[]): boolean {
  try {
    fs.writeFileSync(VALIDATION_FILE, JSON.stringify(items, null, 2), 'utf-8');
    emitWorkspaceEvent('validation_updated', { items });
    return true;
  } catch (e) {
    console.error('Error writing validation_queue.json:', e);
    return false;
  }
}

export function addValidationItem(item: Omit<ValidationItem, 'id' | 'createdAt' | 'status'>): ValidationItem {
  const current = getValidationQueue();
  const newItem: ValidationItem = {
    ...item,
    id: `val-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    status: 'en_attente',
  };
  const updated = [newItem, ...current];
  saveValidationQueue(updated);
  appendAuditLog({
    actionType: 'item_queued',
    actor: 'agent_serveur',
    description: `Élément mis en file d attente de validation : ${newItem.title}`,
    provenanceDetails: newItem.sourceOpportunityTitle,
    status: 'warning',
  });
  return newItem;
}

export function updateValidationStatus(
  id: string,
  status: 'valide' | 'rejete',
  reviewNotes?: string
): ValidationItem | null {
  const current = getValidationQueue();
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;

  current[index].status = status;
  current[index].reviewedAt = new Date().toISOString();
  if (reviewNotes) current[index].reviewNotes = reviewNotes;

  saveValidationQueue(current);
  appendAuditLog({
    actionType: status === 'valide' ? 'item_validated' : 'item_rejected',
    actor: 'utilisateur',
    description: `Élément ${status === 'valide' ? 'validé manuellement' : 'rejeté'} : ${current[index].title}`,
    provenanceDetails: current[index].sourceOpportunityTitle,
    status: status === 'valide' ? 'success' : 'warning',
  });

  return current[index];
}

// ----------------- AUDIT LOG PERSISTENCE (Journal de toutes les actions) -----------------

export function getAuditLog(): AuditLogEntry[] {
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      const data = fs.readFileSync(AUDIT_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading audit_log.json:', e);
    }
  }
  return [];
}

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const current = getAuditLog();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...current].slice(0, 500); // keep 500 latest entries
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('audit_updated', { entries: updated, latest: newEntry });
  } catch (e) {
    console.error('Error appending audit log:', e);
  }
  return newEntry;
}

// ----------------- REAL SALES TRACKING (Encaissements Réels vs Prévisions) -----------------

export function getRealSales(): RealSaleRecord[] {
  if (fs.existsSync(SALES_FILE)) {
    try {
      const data = fs.readFileSync(SALES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading sales.json:', e);
    }
  }
  return [];
}

export function addRealSale(sale: Omit<RealSaleRecord, 'id'>): RealSaleRecord {
  const current = getRealSales();
  const newSale: RealSaleRecord = {
    ...sale,
    id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  const updated = [newSale, ...current];
  try {
    fs.writeFileSync(SALES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('sales_updated', { sales: updated, latest: newSale });
  } catch (e) {
    console.error('Error saving sale:', e);
  }
  appendAuditLog({
    actionType: 'sale_recorded',
    actor: 'utilisateur',
    description: `Encaissement réel enregistré : ${newSale.amount.toLocaleString()} ${newSale.currency} de ${newSale.clientName} (${newSale.paymentMethod})`,
    provenanceDetails: newSale.opportunityTitle,
    status: 'success',
  });
  return newSale;
}

export function deleteRealSale(id: string): boolean {
  const current = getRealSales();
  const updated = current.filter((s) => s.id !== id);
  try {
    fs.writeFileSync(SALES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    emitWorkspaceEvent('sales_updated', { sales: updated });
    return true;
  } catch (e) {
    console.error('Error deleting sale:', e);
    return false;
  }
}

// ----------------- USAGE COUNTER & API METRICS (Pas de quota arbitraire) -----------------

const DEFAULT_USAGE: UsageCounterStats = {
  totalGeminiCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  signalsCollected: 0,
  opportunitiesSynthesized: 0,
  kitsGenerated: 0,
  lastResponseTimeMs: 0,
};

export function getUsageStats(): UsageCounterStats {
  if (fs.existsSync(USAGE_FILE)) {
    try {
      const data = fs.readFileSync(USAGE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading usage_counter.json:', e);
    }
  }
  return DEFAULT_USAGE;
}

export function recordGeminiCall(
  durationMs: number,
  success: boolean,
  errorMessage?: string,
  extra?: { signalsCollected?: number; opportunitiesSynthesized?: number; kitsGenerated?: number }
): UsageCounterStats {
  const current = getUsageStats();
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
    appendAuditLog({
      actionType: 'api_error',
      actor: 'gemini_api',
      description: `Erreur API Gemini : ${errorMessage}`,
      status: 'error',
    });
  }

  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(current, null, 2), 'utf-8');
    emitWorkspaceEvent('usage_updated', { stats: current });
  } catch (e) {
    console.error('Error saving usage stats:', e);
  }

  return current;
}
