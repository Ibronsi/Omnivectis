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
} from 'lucide-react';
import { EconomicSector, OpportunityNiche, MarketSignal, SectorCategory } from '../types/market';
import { ECONOMIC_SECTORS, LIVE_MARKET_SIGNALS } from '../data/sectorsData';

interface RadarViewProps {
  onSelectSector: (sector: EconomicSector, niche?: OpportunityNiche) => void;
  onOpenSimulatorWithSectors: (sectorIds: string[]) => void;
  onTriggerBlueprintForSignal?: (sectorId: SectorCategory, headline: string) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  onSelectSector,
  onOpenSimulatorWithSectors,
  onTriggerBlueprintForSignal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sectors' | 'live_signals'>('sectors');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'margin' | 'speed' | 'tam'>('margin');

  // Live signals state
  const [signals, setSignals] = useState<MarketSignal[]>(LIVE_MARKET_SIGNALS);
  const [signalsFilter, setSignalsFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('En direct');

  const fetchLiveSignals = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/signals/live');
      const data = await res.json();
      if (data?.signals) {
        setSignals(data.signals);
        setLastSyncTime(data.lastSync || 'En direct');
      }
    } catch (e) {
      console.warn('Using local signals cache:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveSignals();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'BadgeEuro':
        return <BadgeEuro className="w-5 h-5 text-emerald-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'Building':
        return <Building className="w-5 h-5 text-purple-400" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-orange-400" />;
      case 'Sprout':
        return <Sprout className="w-5 h-5 text-teal-400" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-pink-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-indigo-400" />;
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
    if (signalsFilter === 'all') return true;
    return sig.category === signalsFilter;
  });

  return (
    <div className="space-y-8">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            Intelligence Macro-Économique & Signaux de Marché
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Radar des Opportunités Sectorielles
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Analysez les asymétries de rentabilité par secteur économique et suivez les catalyseurs de marché
            qui créent des fenêtres d arbitrage à haute valeur ajoutée.
          </p>
        </div>

        {/* View Switcher: Sectors vs Live Signals */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('sectors')}
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeSubTab === 'sectors'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matrice Sectorielle ({ECONOMIC_SECTORS.length})
            </button>
            <button
              onClick={() => setActiveSubTab('live_signals')}
              className={`cursor-pointer px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === 'live_signals'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-300" />
              <span>Signaux en Direct ({signals.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explanation Banner on Real-Time vs Structural Data */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-cyan-400 font-semibold uppercase tracking-wider text-[11px]">
            Mode de Données :
          </span>
          <span>
            {activeSubTab === 'live_signals'
              ? 'Catalyseurs macro et spreads d arbitrage actualisés en direct avec horodatage.'
              : 'Données structurelles vérifiées (TAM, CAGR, marges brutes observées) combinées à la simulation réactive en temps réel.'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono shrink-0">
          Dernière synchronisation : {lastSyncTime}
        </div>
      </div>

      {/* VIEW 1: SECTORS GRID */}
      {activeSubTab === 'sectors' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            {/* Category Filter Segments */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto">
              <button
                onClick={() => setFilterCategory('all')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tous les secteurs ({ECONOMIC_SECTORS.length})
              </button>
              <button
                onClick={() => setFilterCategory('tech')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterCategory === 'tech'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IA & Services B2B
              </button>
              <button
                onClick={() => setFilterCategory('finance_infra')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterCategory === 'finance_infra'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Finance, Climat & PropTech
              </button>
              <button
                onClick={() => setFilterCategory('operations')}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterCategory === 'operations'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Santé, Logistique & Commerce
              </button>
            </div>

            {/* Search and Sort */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher secteur, niche, mot-clé..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span>Trier :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="margin">Marge brute la plus forte</option>
                  <option value="speed">Vitesse de cash-flow (rapide)</option>
                  <option value="tam">Taille du marché</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid of Sector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSectors.map((sector) => {
              const leadNiche = sector.niches[0];
              return (
                <div
                  key={sector.id}
                  className="group bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5"
                >
                  <div>
                    {/* Header row with Icon and Unboxed Metadata */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                        {getIcon(sector.iconName)}
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <span className="font-mono text-emerald-400 font-semibold">{sector.growthRate}</span>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="font-mono tabular-nums">{sector.globalTam}</span>
                      </div>
                    </div>

                    {/* Sector Title and Pitch */}
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {sector.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {sector.tagline}
                    </p>

                    {/* Unit Economics Highlight Strip */}
                    <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Marge brute moyenne</span>
                        <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                          {sector.averageMargin}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Vitesse premier cash</span>
                        <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{sector.cashFlowSpeed}</span>
                        </span>
                      </div>
                    </div>

                    {/* Featured Niche preview */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        Niche phare recommandée :
                      </span>
                      <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs">
                        <div className="font-semibold text-slate-200">{leadNiche.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Ticket : {leadNiche.typicalTicket.split('/')[0]}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-indigo-300">{leadNiche.timeToFirstRevenue} pour encaisser</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      {sector.niches.length} {sector.niches.length > 1 ? 'niches analysées' : 'niche analysée'}
                    </span>
                    <button
                      onClick={() => onSelectSector(sector, leadNiche)}
                      className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all flex items-center gap-1.5"
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
          {/* Controls Bar for Live Signals */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto text-xs">
              <button
                onClick={() => setSignalsFilter('all')}
                className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  signalsFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous les signaux ({signals.length})
              </button>
              <button
                onClick={() => setSignalsFilter('reglementaire')}
                className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  signalsFilter === 'reglementaire' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Réglementation & Lois
              </button>
              <button
                onClick={() => setSignalsFilter('energie_matiere')}
                className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  signalsFilter === 'energie_matiere' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Énergie & Spreads
              </button>
              <button
                onClick={() => setSignalsFilter('ia_tech')}
                className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  signalsFilter === 'ia_tech' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                IA & Inférence
              </button>
              <button
                onClick={() => setSignalsFilter('finance_taux')}
                className={`cursor-pointer px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  signalsFilter === 'finance_taux' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Finance & BFR
              </button>
            </div>

            <button
              onClick={fetchLiveSignals}
              disabled={refreshing}
              className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Actualiser les signaux</span>
            </button>
          </div>

          {/* Signals Cards Feed */}
          <div className="space-y-4">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px]">
                      {signal.sectorName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-cyan-300">{signal.urgency}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">{signal.timestamp}</span>
                  </div>

                  <div className="font-mono text-emerald-400 font-bold tabular-nums">
                    Impact estimé : {signal.estimatedMarginImpact}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {signal.headline}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {signal.context}
                  </p>
                </div>

                {/* Direct Action Arbitrage Strip */}
                <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold text-indigo-300 block mb-0.5">
                      Opportunité d Arbitrage Immédiate :
                    </span>
                    <span className="text-slate-200 leading-relaxed">
                      {signal.immediateArbitragePlay}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => onOpenSimulatorWithSectors([signal.sectorId])}
                      className="cursor-pointer px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Simuler les gains</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onTriggerBlueprintForSignal) {
                          onTriggerBlueprintForSignal(signal.sectorId, signal.headline);
                        }
                      }}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Générer le Blueprint</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
