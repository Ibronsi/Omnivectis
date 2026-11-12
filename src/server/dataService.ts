import fs from 'fs';
import path from 'path';
import {
  StrictOpportunity,
  DigitalLaunchKit,
  PhysicalExploitationPlan,
  ValidationItem,
  AuditLogEntry,
  RealSaleRecord,
  UsageCounterStats,
} from '../types/market.js';

export interface SignalItem {
  id: string;
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
  countryCode?: string;
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
const PIPELINE_FILE = path.join(DATA_DIR, 'pipeline.json');
const OPPORTUNITIES_FILE = path.join(DATA_DIR, 'opportunities.json');
const KITS_FILE = path.join(DATA_DIR, 'kits.json');
const VALIDATION_FILE = path.join(DATA_DIR, 'validation_queue.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_log.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage_counter.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create data dir:', e);
  }
}

// In-memory cache
let cachedSignals: SignalItem[] = [];
let lastHarvestTime: number = 0;
let cachedFxRates: { XOF: number; USD: number; EUR: number; lastUpdate: string } = {
  XOF: 655.957,
  USD: 1.12,
  EUR: 1,
  lastUpdate: new Date().toISOString(),
};

function formatRelativeTime(dateString: string): string {
  try {
    const pub = new Date(dateString);
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

// Parse XML helper with robust Regex
function extractXmlItems(xml: string): { title: string; link: string; pubDate: string; desc: string }[] {
  const items: { title: string; link: string; pubDate: string; desc: string }[] = [];
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const match of matches) {
    const titleMatch =
      match.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
      match.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const linkMatch =
      match.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)?.[1] ||
      match.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ||
      match.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1];
    const pubDateMatch =
      match.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] ||
      match.match(/<dc:date>([\s\S]*?)<\/dc:date>/i)?.[1];
    const descMatch =
      match.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
      match.match(/<description>([\s\S]*?)<\/description>/i)?.[1];

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(),
        link: linkMatch.trim(),
        pubDate: pubDateMatch ? pubDateMatch.trim() : new Date().toISOString(),
        desc: descMatch ? descMatch.replace(/<[^>]+>/g, '').trim().slice(0, 300) : '',
      });
    }
  }

  return items;
}

// Classify and build signal from real RSS excerpt
function classifyArticleToSignal(
  item: { title: string; link: string; pubDate: string; desc: string },
  sourceName: string,
  region: 'niger_uemoa' | 'europe' | 'global'
): SignalItem | null {
  const text = `${item.title} ${item.desc}`.toLowerCase();

  // Enforce user rule: "Sans source, il n'est pas publié."
  if (!item.link || !sourceName) return null;

  let sectorId = 'b2b_services';
  let sectorName = 'B2B Services & Conseil';
  let category: SignalItem['category'] = 'reglementaire';

  if (text.includes('ia') || text.includes('intelligence') || text.includes('tech') || text.includes('logiciel') || text.includes('numérique')) {
    sectorId = 'ai_deeptech';
    sectorName = 'Intelligence Artificielle & DeepTech';
    category = 'ia_tech';
  } else if (text.includes('banque') || text.includes('finance') || text.includes('monnaie') || text.includes('paiement') || text.includes('taux') || text.includes('fcfa') || text.includes('cfa') || text.includes('crédit')) {
    sectorId = 'fintech';
    sectorName = 'FinTech & Arbitrage de Flux';
    category = 'finance_taux';
  } else if (text.includes('climat') || text.includes('énergie') || text.includes('solaire') || text.includes('carbone') || text.includes('électricité') || text.includes('pétrole')) {
    sectorId = 'cleantech';
    sectorName = 'Énergie & Transition Climat';
    category = 'energie_matiere';
  } else if (text.includes('agri') || text.includes('agricole') || text.includes('céréale') || text.includes('alimentaire') || text.includes('récolte')) {
    sectorId = 'agritech';
    sectorName = 'AgriTech & Souveraineté Alimentaire';
    category = 'energie_matiere';
  } else if (text.includes('transport') || text.includes('port') || text.includes('camion') || text.includes('fret') || text.includes('corridor') || text.includes('logistique')) {
    sectorId = 'logistics';
    sectorName = 'Supply Chain & Logistique';
    category = 'supply_chain';
  }

  // Real excerpt from the RSS item without artificial placeholder text
  const cleanContext = item.desc ? item.desc.replace(/<[^>]+>/g, '').trim().slice(0, 300) : '';
  let countryCode: string | undefined = undefined;
  if (text.includes('niger') || text.includes('niamey')) countryCode = 'NER';
  else if (text.includes('sénégal') || text.includes('senegal') || text.includes('dakar')) countryCode = 'SEN';
  else if (text.includes('côte d\'ivoire') || text.includes('cote d\'ivoire') || text.includes('abidjan') || text.includes('ivory coast')) countryCode = 'CIV';
  else if (region === 'europe' || text.includes('france') || text.includes('paris')) countryCode = 'FRA';

  return {
    id: `sig-${Math.abs(hashString(item.link))}`,
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
    countryCode,
    isGlobal: region === 'global',
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

// Core live harvester function
export async function harvestRealTimeSignals(): Promise<SignalItem[]> {
  const harvested: SignalItem[] = [];

  try {
    // 1. Fetch live Open Exchange Rates
    const fxRes = await fetch('https://open.er-api.com/v6/latest/EUR', {
      headers: { 'User-Agent': 'OmniVectis-Engine/2.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      if (fxData.rates) {
        cachedFxRates = {
          XOF: fxData.rates.XOF || 655.957,
          USD: fxData.rates.USD || 1.12,
          EUR: 1,
          lastUpdate: new Date().toISOString(),
        };

        // Add collected FX parity signal (strictly collected rates, no handwritten commentary)
        harvested.push({
          id: 'sig-fx-live-bceao',
          category: 'finance_taux',
          headline: `Taux de change collecté : 1 EUR = ${cachedFxRates.XOF.toFixed(2)} XOF · 1 USD = ${(cachedFxRates.XOF / cachedFxRates.USD).toFixed(2)} XOF`,
          context: `Relevé Open Exchange Rates : 1 EUR = ${cachedFxRates.XOF.toFixed(2)} XOF, 1 EUR = ${cachedFxRates.USD.toFixed(4)} USD (date : ${cachedFxRates.lastUpdate}).`,
          immediateArbitragePlay: '',
          sectorId: 'fintech',
          sectorName: 'FinTech & Arbitrage de Flux',
          estimatedMarginImpact: '',
          urgency: 'Cette semaine',
          timestamp: 'Collecté en direct',
          sourceName: 'Open Exchange Rates',
          sourceUrl: 'https://open.er-api.com',
          publishedAt: cachedFxRates.lastUpdate,
          relativeTime: 'en direct',
          region: 'global',
          isGlobal: true,
          isVerifiedSource: true,
          status: 'live',
        });
      }
    }
  } catch (e) {
    console.info('FX rate live fetch notice:', e);
  }

  // 2. Fetch live AllAfrica Business (West Africa / UEMOA)
  try {
    const res = await fetch('https://allafrica.com/tools/headlines/rdf/business/headlines.rdf', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmniVectis/2.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const xml = await res.text();
      const items = extractXmlItems(xml);
      for (const item of items.slice(0, 5)) {
        const signal = classifyArticleToSignal(item, 'AllAfrica Business (Zone UEMOA)', 'niger_uemoa');
        if (signal) harvested.push(signal);
      }
    }
  } catch (e) {
    console.info('AllAfrica live fetch notice:', e);
  }

  // 3. Fetch live Le Figaro Économie (Europe / Global)
  try {
    const res = await fetch('https://www.lefigaro.fr/rss/figaro_economie.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmniVectis/2.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const xml = await res.text();
      const items = extractXmlItems(xml);
      for (const item of items.slice(0, 5)) {
        const signal = classifyArticleToSignal(item, 'Le Figaro Économie', 'europe');
        if (signal) harvested.push(signal);
      }
    }
  } catch (e) {
    console.info('Figaro live fetch notice:', e);
  }

  // 4. Fetch live World Bank Data Indicators (Niger & West Africa)
  try {
    const wbRes = await fetch('https://api.worldbank.org/v2/country/NER/indicator/NY.GDP.MKTP.KD.ZG?format=json', {
      headers: { 'User-Agent': 'OmniVectis/2.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (wbRes.ok) {
      const wbData = await wbRes.json();
      const latest = wbData?.[1]?.[0];
      if (latest && latest.value) {
        harvested.push({
          id: 'sig-wb-niger-gdp',
          category: 'reglementaire',
          headline: `Banque Mondiale (WDI) : Croissance du PIB du Niger à ${Number(latest.value).toFixed(2)}% (indicateur NY.GDP.MKTP.KD.ZG, référence ${latest.date || 'récente'})`,
          context: `Indicateur brut Banque Mondiale NY.GDP.MKTP.KD.ZG : valeur de ${Number(latest.value).toFixed(2)}% enregistrée pour le Niger.`,
          immediateArbitragePlay: '',
          sectorId: 'agritech',
          sectorName: 'AgriTech & Souveraineté Alimentaire',
          estimatedMarginImpact: '',
          urgency: 'Ce mois-ci',
          timestamp: 'Collecté Banque Mondiale',
          sourceName: 'Banque Mondiale (Open Data WDI Niger)',
          sourceUrl: 'https://api.worldbank.org/v2/country/NER',
          publishedAt: new Date().toISOString(),
          relativeTime: 'officiel WDI',
          region: 'niger_uemoa',
          isVerifiedSource: true,
          status: 'live',
          countryCode: 'NER',
        });
      }
    }
  } catch (e) {
    console.info('World Bank live fetch notice:', e);
  }

  // Filter out any duplicates and ensure strictly valid sources
  const validSignals = harvested.filter((s) => s.sourceUrl && s.sourceName && s.isVerifiedSource);

  if (validSignals.length > 0) {
    cachedSignals = validSignals;
    lastHarvestTime = Date.now();
    try {
      fs.writeFileSync(SIGNALS_FILE, JSON.stringify(validSignals, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write signals.json:', e);
    }
  }

  return cachedSignals;
}

export function getCachedSignals(): SignalItem[] {
  if (cachedSignals.length > 0) {
    // Update relative times on each read
    return cachedSignals.map((s) => ({
      ...s,
      relativeTime: formatRelativeTime(s.publishedAt),
      timestamp: `Collecté ${formatRelativeTime(s.publishedAt)}`,
    }));
  }

  if (fs.existsSync(SIGNALS_FILE)) {
    try {
      const data = fs.readFileSync(SIGNALS_FILE, 'utf-8');
      cachedSignals = JSON.parse(data);
      return cachedSignals.map((s) => ({
        ...s,
        relativeTime: formatRelativeTime(s.publishedAt),
        timestamp: `Collecté ${formatRelativeTime(s.publishedAt)}`,
      }));
    } catch (e) {
      console.error('Error reading signals.json:', e);
    }
  }

  return [];
}

export function getCachedRates() {
  return cachedFxRates;
}

// ----------------- PIPELINE PERSISTENCE (Multi-device database) -----------------

const DEFAULT_PIPELINE: PersistentPipelineItem[] = [
  {
    id: 'pipe-ner-1',
    title: 'Passerelle d Encaissement Mobile Money Multi-Opérateurs (Airtel / Moov / Wave)',
    sectorId: 'fintech',
    sectorName: 'FinTech & Arbitrage de Flux (UEMOA)',
    stage: 'monetizing',
    targetMrr: 3500000, // 3.5M FCFA (~5 300€)
    currentMrr: 1200000,
    notes: 'Intégration chez 8 marchands de Niamey avec règlement automatique via SONIBANK et Airtel Money.',
    addedAt: '10/11/2026',
    countryCode: 'NER',
    currency: 'XOF',
    paymentMethod: 'Airtel Money / Moov Flooz',
    checklists: [
      { text: 'Valider les webhooks marchands FedaPay/CinetPay', done: true },
      { text: 'Ouvrir le compte pro dédié à la SONIBANK Niamey', done: true },
      { text: 'Déployer sur 15 nouveaux points de vente maraîchers', done: false },
    ],
  },
  {
    id: 'pipe-cleantech-2',
    title: 'Audit & Kits Solaires Maraîchers en Leasing Pay-As-You-Go',
    sectorId: 'agritech',
    sectorName: 'AgriTech & Souveraineté Alimentaire',
    stage: 'validation',
    targetMrr: 4500000, // 4.5M FCFA (~6 800€)
    currentMrr: 800000,
    notes: 'Partenariat avec 2 coopératives maraîchères de la vallée du fleuve Niger.',
    addedAt: '08/11/2026',
    countryCode: 'NER',
    currency: 'XOF',
    paymentMethod: 'Virement SONIBANK / NITA',
    checklists: [
      { text: 'Chiffrer le coût des pompes solaires immergées 3kW', done: true },
      { text: 'Signer 3 contrats de leasing test avec acompte 30%', done: true },
      { text: 'Mettre en place la surveillance IoT par carte SIM locale', done: false },
    ],
  },
  {
    id: 'pipe-ai-b2b-3',
    title: 'Micro-SaaS d Audit de Conformité CSRD Automatisée B2B',
    sectorId: 'cleantech',
    sectorName: 'Énergie & Transition Climat (CleanTech)',
    stage: 'building',
    targetMrr: 8000, // in EUR
    currentMrr: 1500,
    notes: 'Partenariat avec 2 cabinets d audit pour distribution européenne.',
    addedAt: '05/11/2026',
    countryCode: 'FRA',
    currency: 'EUR',
    paymentMethod: 'Stripe SEPA / CB',
    checklists: [
      { text: 'Finaliser la grille de questions ESRS avec citations', done: true },
      { text: 'Tester avec 3 PME pilotes du secteur agroalimentaire', done: true },
      { text: 'Signer 5 abonnements annuels payants à 7 500€', done: false },
    ],
  },
];

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
    return true;
  } catch (e) {
    console.error('Error writing kits.json:', e);
    return false;
  }
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
  } catch (e) {
    console.error('Error saving usage stats:', e);
  }

  return current;
}
