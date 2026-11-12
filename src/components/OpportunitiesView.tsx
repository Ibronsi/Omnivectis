import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  CheckCircle2,
  AlertOctagon,
  Filter,
  Layers,
  ArrowRight,
  Database,
  Radio,
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
  onAddToPipeline,
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
    } catch (e: any) {
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

  const getStatusBadge = (status: 'live' | 'cache' | 'indisponible') => {
    switch (status) {
      case 'live':
        return (
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>live</span>
          </span>
        );
      case 'cache':
        return (
          <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>cache</span>
          </span>
        );
      case 'indisponible':
      default:
        return (
          <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>indisponible</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            Provenance Stricte · Aucune Donnée Inventée
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Module Opportunités · {currentProfile.countryName}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Opportunités dérivées <strong className="text-white">exclusivement</strong> des signaux collectés stockés dans la table.
            Chaque fait cite sa source officielle, sa date et son statut (<span className="text-emerald-400 font-mono">live</span>, <span className="text-amber-400 font-mono">cache</span>, <span className="text-rose-400 font-mono">indisponible</span>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSynthesize}
            disabled={synthesizing}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${synthesizing ? 'animate-spin' : 'text-indigo-200'}`} />
            <span>{synthesizing ? 'Synthèse Gemini en cours...' : 'Synthétiser depuis signaux stockés'}</span>
          </button>
        </div>
      </div>

      {/* Banner Rule Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Database className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Protocole d Intégrité OmniVectis : </span>
            <span>
              Gemini ne propose rien sans faits tangibles pré-enregistrés. S il n y a pas au moins 2 signaux tangibles, le système répond{' '}
              <code className="text-amber-300 font-mono">données insuffisantes</code>.
            </span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          Devise d exploitation : {currentProfile.currency} ({currentProfile.currencySymbol})
        </div>
      </div>

      {/* Error or Insufficient Notice */}
      {insufficientMsg && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-3">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong className="font-semibold">Alerte d intégrité : </strong>
            <span>{insufficientMsg}. Collectez davantage de sources RSS ou données macroéconomiques dans le Radar avant de régénérer.</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Type :</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                typeFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setTypeFilter('numérique')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                typeFilter === 'numérique' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Numérique
            </button>
            <button
              onClick={() => setTypeFilter('physique')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                typeFilter === 'physique' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Physique
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Confiance :</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setConfidenceFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                confidenceFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setConfidenceFilter('élevé')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                confidenceFilter === 'élevé' ? 'bg-emerald-950 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Élevé
            </button>
            <button
              onClick={() => setConfidenceFilter('moyen')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                confidenceFilter === 'moyen' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Moyen
            </button>
            <button
              onClick={() => setConfidenceFilter('faible')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                confidenceFilter === 'faible' ? 'bg-slate-800 text-slate-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Faible
            </button>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
          <p className="text-sm">Chargement des opportunités issues des signaux collectés...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 border border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Aucune opportunité active pour ce filtre</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Cliquez sur "Synthétiser depuis signaux stockés" pour générer les opportunités de marché à partir des signaux collectés en table.
            </p>
          </div>
          <button
            onClick={handleSynthesize}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            Lancer la synthèse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOpportunities.map((opp) => {
            const isDigital = opp.type === 'numérique';
            return (
              <div
                key={opp.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header Zone */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isDigital
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {opp.type}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-300">
                        Confiance :{' '}
                        <strong
                          className={
                            opp.confidenceLevel === 'élevé'
                              ? 'text-emerald-400 font-semibold'
                              : opp.confidenceLevel === 'moyen'
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-400 font-semibold'
                          }
                        >
                          {opp.confidenceLevel}
                        </strong>
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      Réf : {opp.id.slice(0, 14)}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">
                    {opp.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                {/* Why It Exists Section */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pourquoi elle existe (Fait Réel)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {opp.whyItExists}
                  </p>
                </div>

                {/* Financial Projections - Mandatory Label "Estimation indicative (non issue des sources)" */}
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Modèle Économique :</span>
                    <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
                      Estimation indicative (non issue des sources)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Objectif Mensuel</span>
                      <span className="text-white font-mono font-bold">{opp.targetRevenueLocal || 'Estimation non fournie'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Marge Brute Indicative</span>
                      <span className="text-emerald-400 font-mono font-bold">{opp.estimatedMargin || 'Estimation non fournie'}</span>
                    </div>
                  </div>
                </div>

                {/* Source Signals & Citations */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Signaux sources collectés</span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {opp.sourceSignals?.length || 0} source(s)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {opp.sourceSignals && opp.sourceSignals.length > 0 ? (
                      opp.sourceSignals.map((src, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 p-2 rounded bg-slate-950 border border-slate-800/60 text-[11px]"
                        >
                          <div className="truncate flex-1">
                            <span className="font-medium text-slate-200 block truncate">{src.sourceName}</span>
                            <span className="text-slate-400 truncate block text-[10px]">{src.headline}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {getStatusBadge(src.status || 'live')}
                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-indigo-400 hover:text-indigo-300 p-1"
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

                {/* Invalidation Triggers & Risks */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-rose-400/90 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ce qui l invaliderait</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {opp.invalidationTriggers && opp.invalidationTriggers.length > 0 ? (
                      opp.invalidationTriggers.map((t, idx) => (
                        <li key={idx} className="leading-tight text-slate-400">
                          <span className="text-slate-300">{t}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400">Changement soudain des régulations en vigueur.</li>
                    )}
                  </ul>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2 flex items-center gap-3">
                  {isDigital ? (
                    <button
                      onClick={() => onOpenDigitalKit(opp)}
                      className="cursor-pointer flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Générer Dossier de Lancement Numérique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenPhysicalPlan(opp)}
                      className="cursor-pointer flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Générer Plan d Exploitation Physique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
