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
import { StrictOpportunity, CountryCode } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';

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

  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;

  const fetchOpportunities = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/opportunities?countryCode=${countryCode}`);
      const data = await res.json();
      if (data?.opportunities) {
        setOpportunities(data.opportunities);
      }
    } catch {
      setErrorMsg('Impossible de charger les opportunités locales.');
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
        return <span className="font-mono text-[11px] text-emerald-400">live</span>;
      case 'cache':
        return <span className="font-mono text-[11px] text-amber-400">cache</span>;
      case 'indisponible':
      default:
        return <span className="font-mono text-[11px] text-rose-400">indisponible</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400">
            Provenance Stricte · Aucune Donnée Inventée
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Module Opportunités · {currentProfile.countryName}
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Opportunités dérivées <strong className="text-slate-200 font-medium">exclusivement</strong> des signaux collectés stockés dans la table.
            Chaque fait cite sa source officielle, sa date et son statut (<span className="text-emerald-400 font-mono">live</span>, <span className="text-amber-400 font-mono">cache</span>, <span className="text-rose-400 font-mono">indisponible</span>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSynthesize}
            disabled={synthesizing}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${synthesizing ? 'animate-spin' : ''}`} />
            <span>{synthesizing ? 'Synthèse Gemini en cours...' : 'Synthétiser depuis signaux stockés'}</span>
          </button>
        </div>
      </div>

      {/* Integrity Protocol Strip */}
      <div className="p-4 rounded-xl bg-[#11141C] border border-white/[0.08] text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <span className="font-semibold text-white">Protocole d Intégrité : </span>
            Gemini ne propose aucune opportunité sans signaux collectés pré-enregistrés. En dessous de 2 signaux disponibles, le système répond{' '}
            <code className="text-amber-300 font-mono">données insuffisantes</code>.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
          Devise : {currentProfile.currency} ({currentProfile.currencySymbol})
        </div>
      </div>

      {/* Alerts */}
      {insufficientMsg && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong className="font-semibold">Données insuffisantes : </strong>
            <span>{insufficientMsg}. Collectez davantage de sources dans le Radar avant de relancer la synthèse.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Segmented Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Type</span>
          <div className="flex items-center gap-1 p-1 bg-[#11141C] rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'all' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setTypeFilter('numérique')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'numérique' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Numérique
            </button>
            <button
              onClick={() => setTypeFilter('physique')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                typeFilter === 'physique' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Physique
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Confiance</span>
          <div className="flex items-center gap-1 p-1 bg-[#11141C] rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setConfidenceFilter('all')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                confidenceFilter === 'all' ? 'bg-white/[0.1] text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setConfidenceFilter('élevé')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                confidenceFilter === 'élevé' ? 'bg-emerald-600/25 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Élevé
            </button>
            <button
              onClick={() => setConfidenceFilter('moyen')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                confidenceFilter === 'moyen' ? 'bg-amber-600/25 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Moyen
            </button>
            <button
              onClick={() => setConfidenceFilter('faible')}
              className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                confidenceFilter === 'faible' ? 'bg-white/[0.1] text-slate-200 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faible
            </button>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3 bg-[#11141C] border border-white/[0.08] rounded-xl">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-400" />
          <p className="text-sm">Chargement des opportunités issues des signaux collectés...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="py-16 px-6 text-center bg-[#11141C] border border-white/[0.08] rounded-xl space-y-4">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-white">
              Aucune opportunité active pour ce filtre
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Cliquez sur « Synthétiser depuis signaux stockés » pour générer des opportunités à partir des signaux collectés en table.
            </p>
          </div>
          <button
            onClick={handleSynthesize}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
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
                className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] hover:border-white/[0.15] transition-colors flex flex-col justify-between space-y-5"
              >
                {/* Header & Unboxed Metadata */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className={`font-medium capitalize ${isDigital ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {opp.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Confiance :{' '}
                        <strong
                          className={
                            opp.confidenceLevel === 'élevé'
                              ? 'text-emerald-400 font-semibold'
                              : opp.confidenceLevel === 'moyen'
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-300 font-semibold'
                          }
                        >
                          {opp.confidenceLevel}
                        </strong>
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {opp.id.slice(0, 14)}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-semibold text-white leading-snug">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                {/* Why It Exists (Hairline Separator) */}
                <div className="border-t border-white/[0.07] pt-4 space-y-1.5">
                  <div className="text-xs font-medium text-blue-400">
                    Pourquoi elle existe (Fait Réel)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.whyItExists}
                  </p>
                </div>

                {/* Financial Projections (Unboxed + Explicit Mandatory Disclaimer) */}
                <div className="border-t border-white/[0.07] pt-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-medium text-slate-300">Modèle Économique</span>
                    <span className="font-mono text-amber-400">
                      Estimation indicative (non issue des sources)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Objectif Mensuel</span>
                      <span className="text-white font-mono font-semibold tabular-nums mt-0.5 block">
                        {opp.targetRevenueLocal || 'Estimation non fournie'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Marge Brute Indicative</span>
                      <span className="text-emerald-400 font-mono font-semibold tabular-nums mt-0.5 block">
                        {opp.estimatedMargin || 'Estimation non fournie'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Source Signals Collected (Flat Hairline List) */}
                <div className="border-t border-white/[0.07] pt-4 space-y-2">
                  <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
                    <span>Signaux sources collectés</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {opp.sourceSignals?.length || 0} source(s)
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.06]">
                    {opp.sourceSignals && opp.sourceSignals.length > 0 ? (
                      opp.sourceSignals.map((src, i) => (
                        <div
                          key={i}
                          className="py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-3 text-[11px]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-200 block truncate">{src.sourceName}</span>
                            <span className="text-slate-400 truncate block">{src.headline}</span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {renderStatusText(src.status || 'live')}
                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-400 hover:text-blue-300 p-1 transition-colors"
                              title="Ouvrir la source officielle"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-rose-400">Aucune source associée</span>
                    )}
                  </div>
                </div>

                {/* Risks & Invalidation Triggers */}
                <div className="border-t border-white/[0.07] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {opp.risks && opp.risks.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-medium text-amber-400">Risques majeurs</div>
                      <ul className="space-y-1 list-disc list-inside text-slate-400">
                        {opp.risks.map((r, idx) => (
                          <li key={idx} className="leading-snug">
                            <span className="text-slate-300">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="font-medium text-rose-400">Ce qui l invaliderait</div>
                    <ul className="space-y-1 list-disc list-inside text-slate-400">
                      {opp.invalidationTriggers && opp.invalidationTriggers.length > 0 ? (
                        opp.invalidationTriggers.map((t, idx) => (
                          <li key={idx} className="leading-snug">
                            <span className="text-slate-300">{t}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-400">Changement soudain des régulations en vigueur.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Primary Action */}
                <div className="pt-2">
                  {isDigital ? (
                    <button
                      onClick={() => onOpenDigitalKit(opp)}
                      className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Générer Dossier de Lancement Numérique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenPhysicalPlan(opp)}
                      className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Générer Plan d Exploitation Physique</span>
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
