import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  FileText,
  AlertOctagon,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { StrictOpportunity, CountryCode, MarketSignal, SourceHealthItem, SignalsSnapshotPayload } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';
import {
  getLastSignalsSnapshot,
  subscribeLiveEvent,
  subscribeSseStatus,
} from '../utils/liveStream';

interface OpportunitiesViewProps {
  countryCode: CountryCode;
  onOpenDigitalKit: (opp: StrictOpportunity) => void;
  onOpenPhysicalPlan: (opp: StrictOpportunity) => void;
  onAddToPipeline?: (opp: StrictOpportunity) => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  countryCode,
  onOpenDigitalKit,
  onOpenPhysicalPlan,
}) => {
  const [opportunities, setOpportunities] = useState<StrictOpportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'numérique' | 'physique'>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'élevé' | 'moyen' | 'faible'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [insufficientMsg, setInsufficientMsg] = useState<string | null>(null);
  const [liveSignals, setLiveSignals] = useState<MarketSignal[]>([]);
  const [sourceHealth, setSourceHealth] = useState<SourceHealthItem[]>([]);
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;

  const getRegionForCountry = (code: CountryCode): 'niger_uemoa' | 'europe' | 'global' => {
    if (['NER', 'SEN', 'CIV'].includes(code)) return 'niger_uemoa';
    if (code === 'FRA') return 'europe';
    return 'global';
  };

  const countryRegion = getRegionForCountry(countryCode);
  const relevantSignalsCount = liveSignals.filter((s) => {
    if (s.countryCode && s.countryCode === countryCode) return true;
    if (countryRegion !== 'global' && s.region && s.region === countryRegion) return true;
    if (s.region === 'global' && s.isGlobal === true) return true;
    return false;
  }).length;

  useEffect(() => {
    const cached = getLastSignalsSnapshot();
    if (cached) {
      if (Array.isArray(cached.signals)) setLiveSignals(cached.signals);
      if (Array.isArray(cached.sourceHealth)) setSourceHealth(cached.sourceHealth);
    }

    const handlePayload = (data: SignalsSnapshotPayload) => {
      if (Array.isArray(data?.signals)) setLiveSignals(data.signals);
      if (Array.isArray(data?.sourceHealth)) setSourceHealth(data.sourceHealth);
    };

    const unsubSnap = subscribeLiveEvent<SignalsSnapshotPayload>('signals_snapshot', handlePayload);
    const unsubUpd = subscribeLiveEvent<SignalsSnapshotPayload>('signals_updated', handlePayload);
    const unsubStatus = subscribeSseStatus((status) => {
      setSseConnected(status === 'live');
    });

    fetch('/api/signals/live')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.signals)) setLiveSignals(data.signals);
        if (Array.isArray(data?.sourceHealth)) setSourceHealth(data.sourceHealth);
      })
      .catch(() => {});

    return () => {
      unsubSnap();
      unsubUpd();
      unsubStatus();
    };
  }, []);

  useEffect(() => {
    const unsubOpp = subscribeLiveEvent<{ opportunities?: StrictOpportunity[] }>(
      'opportunities_updated',
      (payload) => {
        if (Array.isArray(payload?.opportunities)) {
          setOpportunities(
            payload.opportunities.filter((o) => o.countryCode === countryCode)
          );
        }
      }
    );
    return () => unsubOpp();
  }, [countryCode]);

  const fetchOpportunities = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/opportunities?countryCode=${countryCode}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      if (data?.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de charger les opportunités locales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [countryCode]);

  const handleSynthesize = async () => {
    setSynthesizing(true);
    setErrorMsg(null);
    setInsufficientMsg(null);
    try {
      const res = await fetch('/api/opportunities/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      if (data?.status === 'insufficient_data') {
        setInsufficientMsg(data.message || 'données insuffisantes');
      } else if (data?.opportunities) {
        setOpportunities(data.opportunities);
      } else if (data?.error) {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur lors de la synthèse des opportunités.');
    } finally {
      setSynthesizing(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (typeFilter !== 'all' && opp.type !== typeFilter) return false;
    if (confidenceFilter !== 'all' && opp.confidenceLevel !== confidenceFilter) return false;
    return true;
  });

  const renderStatusText = (status: 'live' | 'cache' | 'indisponible') => {
    switch (status) {
      case 'live':
        return <span className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400">live</span>;
      case 'cache':
        return <span className="font-mono text-[11px] font-medium text-amber-700 dark:text-amber-400">cache</span>;
      case 'indisponible':
      default:
        return <span className="font-mono text-[11px] font-medium text-rose-700 dark:text-rose-400">indisponible</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Provenance Stricte · Aucune Donnée Inventée
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Module Opportunités · {currentProfile.countryName}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Opportunités dérivées <strong className="text-stone-900 dark:text-stone-100 font-semibold">exclusivement</strong> des signaux collectés stockés dans la table.
            Chaque fait cite sa source officielle, sa date et son statut (<span className="text-emerald-700 dark:text-emerald-400 font-mono font-medium">live</span>, <span className="text-amber-700 dark:text-amber-400 font-mono font-medium">cache</span>, <span className="text-rose-700 dark:text-rose-400 font-mono font-medium">indisponible</span>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSynthesize}
            disabled={synthesizing}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${synthesizing ? 'animate-spin' : ''}`} />
            <span>{synthesizing ? 'Synthèse Gemini en cours...' : 'Synthétiser depuis signaux stockés'}</span>
          </button>
        </div>
      </div>

      {/* Integrity Protocol Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] text-xs text-stone-700 dark:text-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <Database className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-stone-900 dark:text-stone-100">Protocole d'Intégrité : </span>
            Gemini ne propose aucune opportunité sans signaux collectés pré-enregistrés. En dessous de 2 signaux disponibles, le système répond{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono">données insuffisantes</code>.
          </p>
        </div>
        <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0 tabular-nums flex flex-wrap items-center gap-2">
          <span className={`font-medium ${relevantSignalsCount >= 2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {relevantSignalsCount} signal(aux) {countryCode}
          </span>
          {sourceHealth.length > 0 && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
              <span>
                {sourceHealth.filter((s) => s.status === 'live').length} live / {sourceHealth.length} sources
              </span>
            </>
          )}
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
          <span className={`font-medium ${sseConnected ? 'text-teal-700 dark:text-teal-400' : 'text-stone-500 dark:text-stone-400'}`}>
            {sseConnected ? 'SSE actif' : 'SSE hors ligne'}
          </span>
          <span aria-hidden="true" className="text-stone-300 dark:text-stone-600">·</span>
          <span>
            {currentProfile.currency} ({currentProfile.currencySymbol})
          </span>
        </div>
      </div>

      {/* Alerts */}
      {insufficientMsg && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <div>
            <strong className="font-semibold">Données insuffisantes : </strong>
            <span>{insufficientMsg}. Collectez davantage de sources dans le Radar avant de relancer la synthèse.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Segmented Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">Type</span>
          <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] dark:bg-[#0D1017] rounded-xl border border-stone-200 dark:border-white/[0.08] text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'all' ? 'bg-blue-700 dark:bg-blue-600 text-white font-medium shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setTypeFilter('numérique')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'numérique' ? 'bg-blue-700 dark:bg-blue-600 text-white font-medium shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Numérique
            </button>
            <button
              onClick={() => setTypeFilter('physique')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'physique' ? 'bg-blue-700 dark:bg-blue-600 text-white font-medium shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Physique
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">Confiance</span>
          <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] dark:bg-[#0D1017] rounded-xl border border-stone-200 dark:border-white/[0.08] text-xs">
            <button
              onClick={() => setConfidenceFilter('all')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                confidenceFilter === 'all' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setConfidenceFilter('élevé')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                confidenceFilter === 'élevé' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Élevé
            </button>
            <button
              onClick={() => setConfidenceFilter('moyen')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                confidenceFilter === 'moyen' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Moyen
            </button>
            <button
              onClick={() => setConfidenceFilter('faible')}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                confidenceFilter === 'faible' ? 'bg-white dark:bg-white/[0.1] text-stone-900 dark:text-stone-100 font-semibold shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              Faible
            </button>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-600 dark:text-stone-400 space-y-3 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-700 dark:text-blue-400" />
          <p className="text-sm">Chargement des opportunités issues des signaux collectés...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-blue-700 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Aucune opportunité active pour ce filtre
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              Cliquez sur « Synthétiser depuis signaux stockés » pour générer des opportunités à partir des signaux collectés en table.
            </p>
          </div>
          <button
            onClick={handleSynthesize}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors"
          >
            Lancer la synthèse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.map((opp) => {
            const isDigital = opp.type === 'numérique';
            return (
              <article
                key={opp.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.16] shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-colors flex flex-col justify-between space-y-5"
              >
                {/* Header & Unboxed Metadata */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <span className={`font-semibold capitalize ${isDigital ? 'text-teal-700 dark:text-teal-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {opp.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Confiance :{' '}
                        <strong
                          className={
                            opp.confidenceLevel === 'élevé'
                              ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              : opp.confidenceLevel === 'moyen'
                              ? 'text-amber-700 dark:text-amber-400 font-semibold'
                              : 'text-stone-700 dark:text-stone-300 font-semibold'
                          }
                        >
                          {opp.confidenceLevel}
                        </strong>
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 tabular-nums">
                      {opp.id.slice(0, 14)}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                    {opp.title}
                  </h3>

                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                {/* Why It Exists (Hairline Separator) */}
                <div className="border-t border-stone-200/80 dark:border-white/[0.08] pt-4 space-y-1.5">
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Pourquoi elle existe (Fait Réel)
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {opp.whyItExists}
                  </p>
                </div>

                {/* Financial Projections (Unboxed + Explicit Mandatory Disclaimer) */}
                <div className="border-t border-stone-200/80 dark:border-white/[0.08] pt-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">Modèle Économique</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400 font-medium">
                      Estimation indicative (non issue des sources)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Objectif Mensuel</span>
                      <span className="text-stone-900 dark:text-stone-100 font-mono font-semibold tabular-nums mt-0.5 block">
                        {opp.targetRevenueLocal || 'Estimation non fournie'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Marge Brute Indicative</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold tabular-nums mt-0.5 block">
                        {opp.estimatedMargin || 'Estimation non fournie'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Source Signals Collected (Flat Hairline List) */}
                <div className="border-t border-stone-200/80 dark:border-white/[0.08] pt-4 space-y-2">
                  <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                    <span>Signaux sources collectés</span>
                    <span className="font-mono text-[11px] font-normal text-stone-500 dark:text-stone-400 tabular-nums">
                      {opp.sourceSignals?.length || 0} source(s)
                    </span>
                  </div>

                  <div className="divide-y divide-stone-200/70 dark:divide-white/[0.06]">
                    {opp.sourceSignals && opp.sourceSignals.length > 0 ? (
                      opp.sourceSignals.map((src, i) => (
                        <div
                          key={i}
                          className="py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-3 text-[11px]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-stone-800 dark:text-stone-200 block truncate">{src.sourceName}</span>
                            <span className="text-stone-600 dark:text-stone-400 truncate block">{src.headline}</span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {renderStatusText(src.status || 'live')}
                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 transition-colors"
                              title="Ouvrir la source officielle"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-rose-700 dark:text-rose-400">Aucune source associée</span>
                    )}
                  </div>
                </div>

                {/* Risks & Invalidation Triggers */}
                <div className="border-t border-stone-200/80 dark:border-white/[0.08] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {opp.risks && opp.risks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-semibold text-amber-700 dark:text-amber-400">Risques majeurs</div>
                      <ul className="space-y-1 list-disc list-inside text-stone-500 dark:text-stone-400">
                        {opp.risks.map((r, idx) => (
                          <li key={idx} className="leading-snug">
                            <span className="text-stone-700 dark:text-stone-300">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="font-semibold text-rose-700 dark:text-rose-400">Ce qui l'invaliderait</div>
                    <ul className="space-y-1 list-disc list-inside text-stone-500 dark:text-stone-400">
                      {opp.invalidationTriggers && opp.invalidationTriggers.length > 0 ? (
                        opp.invalidationTriggers.map((t, idx) => (
                          <li key={idx} className="leading-snug">
                            <span className="text-stone-700 dark:text-stone-300">{t}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-stone-600 dark:text-stone-400">Changement soudain des régulations en vigueur.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Primary Action */}
                <div className="pt-2">
                  {isDigital ? (
                    <button
                      onClick={() => onOpenDigitalKit(opp)}
                      className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Générer Dossier de Lancement Numérique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenPhysicalPlan(opp)}
                      className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Générer Plan d'Exploitation Physique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
