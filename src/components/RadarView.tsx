import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  Search,
  Zap,
  Cpu,
  BadgeEuro,
  Briefcase,
  Activity,
  Building,
  Truck,
  Sprout,
  ShoppingBag,
  Radio,
  RefreshCw,
  Sparkles,
  Sliders,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Globe,
  Rocket,
} from 'lucide-react';
import {
  EconomicSector,
  OpportunityNiche,
  MarketSignal,
  SectorCategory,
  SourceHealthItem,
  SignalsSnapshotPayload,
  CountryCode,
} from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import {
  getLastSignalsSnapshot,
  subscribeLiveEvent,
  subscribeSseStatus,
} from '../utils/liveStream';

interface RadarViewProps {
  onSelectSector: (sector: EconomicSector, niche?: OpportunityNiche) => void;
  onOpenSimulatorWithSectors: (sectorIds: string[]) => void;
  onTriggerBlueprintForSignal?: (sectorId: SectorCategory, headline: string) => void;
  onLaunchCircuitForSignal?: (sectorId: SectorCategory, headline: string) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  onSelectSector,
  onOpenSimulatorWithSectors,
  onTriggerBlueprintForSignal,
  onLaunchCircuitForSignal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sectors' | 'live_signals'>('sectors');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'margin' | 'speed' | 'tam'>('margin');

  // Live signals & SSE real-time state
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [sourceHealth, setSourceHealth] = useState<SourceHealthItem[]>([]);
  const [sseStatus, setSseStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [signalsFilter, setSignalsFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'niger_uemoa' | 'europe' | 'global'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | CountryCode>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('—');

  const applyPayload = (data: Partial<SignalsSnapshotPayload>) => {
    if (Array.isArray(data?.signals)) {
      setSignals(data.signals);
    }
    if (Array.isArray(data?.sourceHealth)) {
      setSourceHealth(data.sourceHealth);
    }
    if (data?.lastSync) {
      setLastSyncTime(data.lastSync);
    }
  };

  const fetchLiveSignals = async (forceRefresh = false) => {
    setRefreshing(true);
    setFetchError(null);
    try {
      const endpoint = forceRefresh ? '/api/signals/refresh' : '/api/signals/live';
      const method = forceRefresh ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      applyPayload(data);
    } catch (e: any) {
      setFetchError(e?.message || 'Impossible de collecter les signaux en direct.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = getLastSignalsSnapshot();
    if (cached) {
      applyPayload(cached);
    }
    fetchLiveSignals(false);

    const handleSnapshot = (payload: SignalsSnapshotPayload) => {
      applyPayload(payload);
      setFetchError(null);
    };

    const unsubSnap = subscribeLiveEvent<SignalsSnapshotPayload>('signals_snapshot', handleSnapshot);
    const unsubUpd = subscribeLiveEvent<SignalsSnapshotPayload>('signals_updated', handleSnapshot);
    const unsubStatus = subscribeSseStatus((status) => {
      if (status === 'live') setSseStatus('live');
      else if (status === 'error') setSseStatus('error');
      else setSseStatus('connecting');
    });

    return () => {
      unsubSnap();
      unsubUpd();
      unsubStatus();
    };
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-700 dark:text-amber-400" />;
      case 'BadgeEuro':
        return <BadgeEuro className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-blue-700 dark:text-blue-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-rose-700 dark:text-rose-400" />;
      case 'Building':
        return <Building className="w-5 h-5 text-purple-700 dark:text-purple-400" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-orange-700 dark:text-orange-400" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5 text-teal-700 dark:text-teal-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-pink-700 dark:text-pink-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />;
    }
  };

  const filteredSectors = ECONOMIC_SECTORS.filter((sector) => {
    const matchesFilter =
      filterCategory === 'all' ||
      (filterCategory === 'tech' && ['ai_deeptech', 'b2b_services'].includes(sector.id)) ||
      (filterCategory === 'finance_infra' && ['fintech', 'cleantech', 'proptech'].includes(sector.id)) ||
      (filterCategory === 'operations' && ['logistics', 'agritech', 'digital_commerce', 'health_longevity'].includes(sector.id));

    const matchesSearch =
      sector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sector.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sector.niches.some(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'margin') {
      return b.averageMargin - a.averageMargin;
    }
    if (sortBy === 'speed') {
      const speedScore: Record<string, number> = {
        'Immédiat (<30j)': 3,
        'Moyen terme (1-3m)': 2,
        'Long terme (6m+)': 1,
      };
      return (speedScore[b.cashFlowSpeed] || 0) - (speedScore[a.cashFlowSpeed] || 0);
    }
    return b.name.localeCompare(a.name);
  });

  const filteredSignals = signals.filter((sig) => {
    // "Sans source, il n'est pas publié"
    if (!sig.sourceName || !sig.sourceUrl) return false;

    const matchesCategory = signalsFilter === 'all' || sig.category === signalsFilter;
    const matchesRegion = regionFilter === 'all' || sig.region === regionFilter;
    const matchesCountry =
      countryFilter === 'all' ||
      sig.countryCode === countryFilter ||
      (sig.region === 'global' && sig.isGlobal === true);
    return matchesCategory && matchesRegion && matchesCountry;
  });

  return (
    <div className="space-y-8">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Intelligence Macro-Économique & Signaux de Marché Collectés
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Radar des Opportunités Sectorielles
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Sources publiques collectées (Banque Mondiale, BCEAO, flux économiques officiels) et catalyseurs en temps réel.
            Chaque opportunité est reliée à sa source légale ou économique certifiée.
          </p>
        </div>

        {/* View Switcher: Sectors vs Live Signals */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1 bg-[#F2EFE9] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] rounded-xl flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('sectors')}
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeSubTab === 'sectors'
                  ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Matrice Sectorielle ({ECONOMIC_SECTORS.length})
            </button>
            <button
              onClick={() => setActiveSubTab('live_signals')}
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'live_signals'
                  ? 'bg-blue-700 dark:bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeSubTab === 'live_signals' ? 'text-blue-100' : 'text-teal-700 dark:text-teal-400'}`} />
              <span>Signaux en Direct ({signals.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explanation Strip on Real-Time vs Structural Data */}
      <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-start sm:items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-stone-900 dark:text-stone-100">Protocole Données Réelles : </span>
            {activeSubTab === 'live_signals'
              ? "Flux d'actualités, taux de change et indicateurs macroéconomiques collectés côté serveur. Aucun signal sans source externe vérifiable."
              : 'Données structurelles (TAM, marges, CAGR) avec sources publiques citées (Banque Mondiale, GSMA, BCEAO).'}
          </p>
        </div>
        <div className="text-[11px] font-mono shrink-0 tabular-nums flex items-center gap-2.5">
          <span
            className={`font-medium ${
              sseStatus === 'live'
                ? 'text-emerald-700 dark:text-emerald-400'
                : sseStatus === 'connecting'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {sseStatus === 'live'
              ? 'Flux SSE actif'
              : sseStatus === 'connecting'
              ? 'Connexion SSE...'
              : 'Flux SSE interrompu'}
          </span>
          <span aria-hidden="true" className="text-stone-400 dark:text-stone-600">·</span>
          <span className="text-stone-500 dark:text-stone-400">
            Sync <span className="text-stone-800 dark:text-stone-200 font-medium">{lastSyncTime}</span>
          </span>
        </div>
      </div>

      {/* VIEW 1: SECTORS GRID */}
      {activeSubTab === 'sectors' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3.5 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            {/* Category Filter Segments */}
            <div className="flex items-center gap-1 p-1 bg-[#F6F4EF] dark:bg-[#0D1017] rounded-xl border border-stone-200/80 dark:border-white/[0.08] overflow-x-auto">
              <button
                onClick={() => setFilterCategory('all')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Tous les secteurs ({ECONOMIC_SECTORS.length})
              </button>
              <button
                onClick={() => setFilterCategory('tech')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === 'tech'
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                IA & Services B2B
              </button>
              <button
                onClick={() => setFilterCategory('finance_infra')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === 'finance_infra'
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Finance, Climat & PropTech
              </button>
              <button
                onClick={() => setFilterCategory('operations')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  filterCategory === 'operations'
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Santé, Logistique & Commerce
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher secteur, niche, mot-clé..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 shrink-0">
                <Filter className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span className="hidden sm:inline">Trier :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] text-stone-800 dark:text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer"
                >
                  <option value="margin">Marge brute la plus forte</option>
                  <option value="speed">Vitesse de cash-flow (rapide)</option>
                  <option value="tam">Taille du marché</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid of Sector Cards (Single-Elevation with Hairline Dividers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSectors.map((sector) => {
              const leadNiche = sector.niches[0];
              return (
                <div
                  key={sector.id}
                  className="group bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.16] rounded-2xl p-5 flex flex-col justify-between transition-all shadow-[0_1px_3px_rgba(28,25,23,0.04)] hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Header row with Icon and Unboxed Metadata */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-center">
                        {getIcon(sector.iconName)}
                      </div>
                      <div className="text-right text-xs text-stone-600 dark:text-stone-400 font-mono tabular-nums">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{sector.growthRate}</span>
                        <span aria-hidden="true" className="mx-1.5 text-stone-300 dark:text-stone-600">·</span>
                        <span className="text-stone-700 dark:text-stone-300 font-medium">{sector.globalTam}</span>
                      </div>
                    </div>

                    {/* Sector Title and Pitch */}
                    <div>
                      <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {sector.name}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {sector.tagline}
                      </p>
                      {sector.tamSource && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                          <span>Source : <span className="text-stone-700 dark:text-stone-300 font-medium">{sector.tamSource}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Unit Economics Hairline Row */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-200/80 dark:border-white/[0.07]">
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Marge brute moyenne</span>
                        <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">
                          {sector.averageMargin}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Vitesse premier cash</span>
                        <span className="text-xs font-medium text-teal-700 dark:text-teal-400 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{sector.cashFlowSpeed}</span>
                        </span>
                      </div>
                    </div>

                    {/* Featured Niche preview */}
                    <div className="pt-3 border-t border-stone-200/80 dark:border-white/[0.07] space-y-1">
                      <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 block">
                        Niche phare recommandée
                      </span>
                      <div className="text-xs font-semibold text-stone-800 dark:text-stone-200">{leadNiche.title}</div>
                      <div className="text-[11px] text-stone-600 dark:text-stone-400 flex items-center gap-2 font-mono tabular-nums">
                        <span>Ticket : {leadNiche.typicalTicket.split('/')[0]}</span>
                        <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                        <span className="text-blue-700 dark:text-blue-400 font-medium">{leadNiche.timeToFirstRevenue} pour encaisser</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 mt-5 border-t border-stone-200/80 dark:border-white/[0.07] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                      {sector.niches.length} {sector.niches.length > 1 ? 'niches analysées' : 'niche analysée'}
                    </span>
                    <button
                      onClick={() => onSelectSector(sector, leadNiche)}
                      className="cursor-pointer text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5"
                    >
                      <span>Explorer le Playbook</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LIVE SIGNALS & CATALYSTS STREAM */}
      {activeSubTab === 'live_signals' && (
        <div className="space-y-6">
          {/* Controls Bar for Live Signals with Geographic and Category Filters */}
          <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-3">
            {/* Row 1: Geographic Region Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  Zone Géographique
                </span>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#F6F4EF] dark:bg-[#0D1017] rounded-xl border border-stone-200/80 dark:border-white/[0.08] text-xs overflow-x-auto">
                <button
                  onClick={() => setRegionFilter('all')}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    regionFilter === 'all' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Toutes les zones ({signals.length})
                </button>
                <button
                  onClick={() => setRegionFilter('niger_uemoa')}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    regionFilter === 'niger_uemoa' ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-emerald-800 dark:hover:text-emerald-300'
                  }`}
                >
                  Niger & UEMOA / Afrique
                </button>
                <button
                  onClick={() => setRegionFilter('europe')}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    regionFilter === 'europe' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Europe (CSRD, ENTSO-E)
                </button>
                <button
                  onClick={() => setRegionFilter('global')}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    regionFilter === 'global' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  Global (Taux, Devises)
                </button>
              </div>
            </div>

            {/* Row 2: Country Filter + Category Filters + Refresh Button */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#F6F4EF] dark:bg-[#0D1017] rounded-xl border border-stone-200/80 dark:border-white/[0.08] overflow-x-auto text-xs">
                  {(['all', 'NER', 'SEN', 'CIV', 'FRA', 'USA'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => setCountryFilter(code)}
                      className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap font-mono ${
                        countryFilter === code
                          ? 'bg-blue-700 dark:bg-blue-600 text-white font-medium shadow-xs'
                          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      {code === 'all' ? 'Tous pays' : code}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#F6F4EF] dark:bg-[#0D1017] rounded-xl border border-stone-200/80 dark:border-white/[0.08] overflow-x-auto text-xs">
                  <button
                    onClick={() => setSignalsFilter('all')}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      signalsFilter === 'all' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Tous thèmes
                  </button>
                  <button
                    onClick={() => setSignalsFilter('reglementaire')}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      signalsFilter === 'reglementaire' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Réglementation & Lois
                  </button>
                  <button
                    onClick={() => setSignalsFilter('energie_matiere')}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      signalsFilter === 'energie_matiere' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Énergie & Matières
                  </button>
                  <button
                    onClick={() => setSignalsFilter('ia_tech')}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      signalsFilter === 'ia_tech' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    IA & Inférence
                  </button>
                  <button
                    onClick={() => setSignalsFilter('finance_taux')}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      signalsFilter === 'finance_taux' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    Finance, Taux & Devises
                  </button>
                </div>
              </div>

              <button
                onClick={() => fetchLiveSignals(true)}
                disabled={refreshing}
                className="cursor-pointer px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-[#F6F4EF] dark:bg-white/[0.06] hover:bg-stone-200/70 dark:hover:bg-white/[0.1] border border-stone-200 dark:border-white/[0.1] rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-700 dark:text-blue-400' : 'text-stone-500 dark:text-stone-400'}`} />
                <span>{refreshing ? 'Collecte en cours...' : 'Recharger les flux en direct'}</span>
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {sourceHealth.length > 0 && (
            <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">État des sources collectées</span>
                <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                  {sourceHealth.filter((s) => s.status === 'live').length} live ·{' '}
                  {sourceHealth.filter((s) => s.status === 'cache').length} cache ·{' '}
                  {sourceHealth.filter((s) => s.status === 'indisponible').length} indisponible
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {sourceHealth.map((src) => (
                  <div
                    key={src.id}
                    title={src.error || src.url}
                    className="px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-lg flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="text-stone-700 dark:text-stone-300 truncate">{src.name}</span>
                    <div className="flex items-center gap-2 font-mono shrink-0 tabular-nums">
                      <span className="text-stone-500 dark:text-stone-400">{src.signalCount}</span>
                      <span
                        className={
                          src.status === 'live'
                            ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                            : src.status === 'cache'
                            ? 'text-amber-700 dark:text-amber-400 font-medium'
                            : 'text-rose-700 dark:text-rose-400 font-medium'
                        }
                      >
                        {src.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signals Cards Feed */}
          <div className="space-y-4">
            {filteredSignals.length === 0 ? (
              <div className="p-10 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl text-center space-y-2 shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">Aucun signal trouvé pour ce filtre</div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Ajustez les filtres géographiques ou thématiques pour afficher les flux disponibles.
                </p>
              </div>
            ) : (
              filteredSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-5 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.16] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-4 transition-colors"
                >
                  {/* Top metadata strip: Unboxed inline text */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-stone-500 dark:text-stone-400">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">
                        {signal.sectorName}
                      </span>
                      {signal.countryCode && (
                        <>
                          <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                          <span className="font-mono font-medium text-stone-800 dark:text-stone-200">{signal.countryCode}</span>
                        </>
                      )}
                      <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                      <span
                        className={`font-mono font-medium ${
                          signal.status === 'live'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : signal.status === 'cache'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {signal.status}
                      </span>
                      <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                      <span className="font-mono font-medium text-teal-700 dark:text-teal-400">{signal.urgency}</span>
                      <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                      <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>Source : <strong className="text-stone-900 dark:text-stone-100 font-medium">{signal.sourceName}</strong></span>
                        <span className="text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                          ({signal.relativeTime ? signal.relativeTime : signal.timestamp})
                        </span>
                      </span>

                      {signal.sourceUrl && (
                        <>
                          <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
                          <a
                            href={signal.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2"
                            title="Vérifier la publication officielle"
                          >
                            <span>Voir la source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>

                    {signal.estimatedMarginImpact && (
                      <div className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums shrink-0">
                        Impact estimé : {signal.estimatedMarginImpact}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                      {signal.headline}
                    </h3>
                    {signal.context && (
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                        {signal.context}
                      </p>
                    )}
                  </div>

                  {/* Direct Action Footer (Hairline separated instead of nested box) */}
                  <div className="pt-3.5 border-t border-stone-200/80 dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {signal.immediateArbitragePlay ? (
                      <div className="text-xs">
                        <span className="font-semibold text-blue-700 dark:text-blue-400 block mb-0.5">
                          Piste d'arbitrage :
                        </span>
                        <span className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {signal.immediateArbitragePlay}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        Signal brut collecté · Exploitez-le via le module Opportunités ou le Simulateur.
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenSimulatorWithSectors([signal.sectorId])}
                        className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-[#F6F4EF] dark:bg-white/[0.06] hover:bg-stone-200/70 dark:hover:bg-white/[0.1] border border-stone-200 dark:border-white/[0.1] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Sliders className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <span>Simuler les gains</span>
                      </button>

                      {onLaunchCircuitForSignal && (
                        <button
                          onClick={() => onLaunchCircuitForSignal(signal.sectorId, signal.headline)}
                          className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Rocket className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>Lancer le Circuit</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (onTriggerBlueprintForSignal) {
                            onTriggerBlueprintForSignal(signal.sectorId, signal.headline);
                          }
                        }}
                        className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Générer Blueprint</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

