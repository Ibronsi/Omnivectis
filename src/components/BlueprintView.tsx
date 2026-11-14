import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle,
  Copy,
  Plus,
  Loader2,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Trash2,
  History,
} from 'lucide-react';
import {
  AIExecutionBlueprint,
  EconomicSector,
  SectorCategory,
  SavedBlueprintRecord,
} from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import { subscribeLiveEvent } from '../utils/liveStream';

interface BlueprintViewProps {
  initialSectorId?: SectorCategory;
  initialTargetRevenue?: string;
  onSaveToPipeline: (blueprint: AIExecutionBlueprint, sector: EconomicSector, nicheTitle: string) => void;
}

export const BlueprintView: React.FC<BlueprintViewProps> = ({
  initialSectorId = 'ai_deeptech',
  initialTargetRevenue = '15 000 € / mois',
  onSaveToPipeline,
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<SectorCategory>(initialSectorId);
  const [targetRevenue, setTargetRevenue] = useState<string>(initialTargetRevenue);
  const [capitalBudget, setCapitalBudget] = useState<string>('0€ à 1 500€ (Amorçage Lean)');
  const [businessModel, setBusinessModel] = useState<string>('SaaS B2B & Abonnements Récurrents');
  const [userSkills, setUserSkills] = useState<string>('Automatisation no-code, outils IA, prospection B2B directe');
  const [customNiche, setCustomNiche] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<AIExecutionBlueprint | null>(null);
  const [savedBlueprints, setSavedBlueprints] = useState<SavedBlueprintRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentSector = ECONOMIC_SECTORS.find((s) => s.id === selectedSectorId) || ECONOMIC_SECTORS[0];

  const loadBlueprintRecord = (record: SavedBlueprintRecord) => {
    setActiveRecordId(record.id);
    setSelectedSectorId(record.sectorId || 'ai_deeptech');
    setCustomNiche(record.niche || '');
    setTargetRevenue(record.targetRevenue || initialTargetRevenue);
    setCapitalBudget(record.capitalBudget || '0€ à 1 500€ (Amorçage Lean)');
    setBusinessModel(record.businessModel || 'SaaS B2B & Abonnements Récurrents');
    setUserSkills(record.userSkills || '');
    setBlueprint(record.blueprint);
    setError(null);
  };

  React.useEffect(() => {
    fetch('/api/blueprints')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.blueprints) && data.blueprints.length > 0) {
          setSavedBlueprints(data.blueprints);
          setBlueprint((prev) => {
            if (prev) return prev;
            const first = data.blueprints[0] as SavedBlueprintRecord;
            setActiveRecordId(first.id);
            return first.blueprint;
          });
        }
      })
      .catch(() => {});

    const unsub = subscribeLiveEvent<{ kind?: string; blueprints?: SavedBlueprintRecord[] }>(
      'workspace_updated',
      (payload) => {
        if (payload?.kind === 'blueprint' && Array.isArray(payload.blueprints)) {
          setSavedBlueprints(payload.blueprints);
        }
      }
    );
    return () => unsub();
  }, []);

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/blueprints/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.blueprints)) {
        setSavedBlueprints(data.blueprints);
        if (activeRecordId === id) {
          if (data.blueprints.length > 0) {
            loadBlueprintRecord(data.blueprints[0]);
          } else {
            setActiveRecordId(null);
            setBlueprint(null);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: selectedSectorId,
          sectorName: currentSector.name,
          niche: customNiche.trim() ? customNiche : currentSector.niches[0]?.title,
          targetRevenue,
          capitalBudget,
          userSkills,
          businessModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Impossible de générer le plan stratégique.');
      }

      setBlueprint(data.blueprint);
      if (data.record) {
        setActiveRecordId(data.record.id);
        setSavedBlueprints((prev) => [data.record, ...prev.filter((b) => b.id !== data.record.id)]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la génération. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!blueprint) return;
    const text = `=== PLAN STRATÉGIQUE MULTI-SECTEUR : ${currentSector.name} ===\n\n` +
      `RÉSUMÉ EXÉCUTIF :\n${blueprint.executiveSummary}\n\n` +
      `MÉCANIQUE DE REVENUS :\n- Modèle : ${blueprint.revenueMechanics.pricingModel}\n- Marge brute : ${blueprint.revenueMechanics.expectedGrossMargin}\n- Ticket cible : ${blueprint.revenueMechanics.targetTicket}\n- Scalabilité : ${blueprint.revenueMechanics.scalabilityGrade}\n\n` +
      `FEUILLE DE ROUTE 30-60-90 JOURS :\n- J+30 : ${blueprint.roadmap30_60_90.day30}\n- J+60 : ${blueprint.roadmap30_60_90.day60}\n- J+90 : ${blueprint.roadmap30_60_90.day90}\n\n` +
      `DÉFENSE & MOAT :\n${blueprint.keyRisksAndMoat.defenseMoat}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-1.5">
        <p className="text-xs font-medium text-blue-400">
          Générateur de Stratégie d Exécution IA
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Concepteur de Plan d Action Commercial & Revenus
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Configurez vos objectifs de gains, votre secteur cible et vos ressources disponibles. Le moteur
          IA synthétise un plan d action opérationnel pour atteindre vos premiers revenus récurrents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-[#11141C] border border-white/[0.08] rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Paramètres du Business</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Gemini API</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Secteur économique principal
              </label>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value as SectorCategory)}
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
              >
                {ECONOMIC_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Marge : {s.averageMargin}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Niche ciblée (ou laisser vide pour la recommandation optimale)
              </label>
              <input
                type="text"
                placeholder={currentSector.niches[0]?.title || 'Ex: Agents IA B2B pour experts-comptables'}
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Objectif de revenu mensuel visé
              </label>
              <select
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(e.target.value)}
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
              >
                <option value="5 000 € / mois">5 000 € / mois (Premier palier)</option>
                <option value="15 000 € / mois">15 000 € / mois (Rentabilité consolidée)</option>
                <option value="50 000 € / mois">50 000 € / mois (Échelle et équipe lean)</option>
                <option value="100 000 €+ / mois">100 000 €+ / mois (Leadership de niche)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Modèle d affaires privilégié
              </label>
              <select
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
              >
                <option value="SaaS B2B & Abonnements Récurrents">SaaS B2B / Micro-SaaS (Récurrence MRR 80%+)</option>
                <option value="Agence Produitisée / Retainer B2B">Service Produitisé / Retainer B2B (Cash immédiat)</option>
                <option value="Arbitrage de Flux & Commission (Take-Rate)">Arbitrage de Flux & Courtage (Zéro stock)</option>
                <option value="Marketplace de Niche B2B">Marketplace / Centrale d achat de niche</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Budget de démarrage disponible
              </label>
              <select
                value={capitalBudget}
                onChange={(e) => setCapitalBudget(e.target.value)}
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500/60 cursor-pointer"
              >
                <option value="0€ (Bootstrap total sans capital)">0 € (Bootstrap total / No-code)</option>
                <option value="1 000€ à 3 000€">1 000 € à 3 000 € (Outils pros & cold outbound)</option>
                <option value="5 000€ à 15 000€">5 000 € à 15 000 € (Amorçage accéléré)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Vos compétences clés / Atouts
              </label>
              <input
                type="text"
                value={userSkills}
                onChange={(e) => setUserSkills(e.target.value)}
                placeholder="Ex: Vente, automatisation, code, réseau relationnel..."
                className="w-full bg-[#0D1017] border border-white/[0.1] text-slate-200 text-xs rounded-lg px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full mt-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération de la stratégie en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Compiler la Stratégie d Exécution</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-white/[0.07]">
            <span className="text-[11px] text-slate-400 block mb-2">Exemples de requêtes rapides :</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedSectorId('ai_deeptech');
                  setTargetRevenue('15 000 € / mois');
                  setBusinessModel('SaaS B2B & Abonnements Récurrents');
                  setCustomNiche('Agents IA B2B pour audits comptables');
                }}
                className="cursor-pointer text-[11px] px-2.5 py-1 bg-[#0D1017] hover:bg-white/[0.06] text-slate-300 rounded-md border border-white/[0.08] transition-colors"
              >
                Audit IA B2B (15k€/m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSectorId('b2b_services');
                  setTargetRevenue('25 000 € / mois');
                  setBusinessModel('Agence Produitisée / Retainer B2B');
                  setCustomNiche('Agence Prospection Multicanale B2B');
                }}
                className="cursor-pointer text-[11px] px-2.5 py-1 bg-[#0D1017] hover:bg-white/[0.06] text-slate-300 rounded-md border border-white/[0.08] transition-colors"
              >
                RevOps Agency (25k€/m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSectorId('cleantech');
                  setTargetRevenue('50 000 € / mois');
                  setBusinessModel('Arbitrage de Flux & Commission (Take-Rate)');
                  setCustomNiche('Courtage d effacement électrique industriel');
                }}
                className="cursor-pointer text-[11px] px-2.5 py-1 bg-[#0D1017] hover:bg-white/[0.06] text-slate-300 rounded-md border border-white/[0.08] transition-colors"
              >
                CleanTech Arbitrage (50k€/m)
              </button>
            </div>
          </div>

          {savedBlueprints.length > 0 && (
            <div className="pt-4 border-t border-white/[0.07] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Plans persistés ({savedBlueprints.length})</span>
                </span>
                <span className="font-mono text-slate-500">Sauvegarde serveur</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedBlueprints.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => loadBlueprintRecord(rec)}
                    className={`cursor-pointer p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-colors ${
                      activeRecordId === rec.id
                        ? 'bg-blue-600/15 border-blue-500/40 text-white'
                        : 'bg-[#0D1017] border-white/[0.07] text-slate-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{rec.niche}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {rec.sectorName} · {new Date(rec.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSaved(rec.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 shrink-0 cursor-pointer"
                      title="Supprimer ce plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Blueprint Dossier Output (7 cols) */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 bg-[#11141C] border border-rose-500/30 rounded-lg text-rose-400 text-xs mb-6">
              {error}
            </div>
          )}

          {!blueprint && !loading && (
            <div className="p-12 bg-[#11141C] border border-white/[0.08] border-dashed rounded-lg text-center space-y-4">
              <div className="w-11 h-11 rounded-lg bg-[#0D1017] border border-white/[0.08] flex items-center justify-center mx-auto text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-display text-base font-semibold text-white">Prêt à configurer votre plan d action</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Sélectionnez vos critères à gauche et cliquez sur "Compiler la Stratégie d Exécution". L IA
                  analysera la dynamique du marché et produira un plan de monétisation, d acquisition et une roadmap chronologique J+30 à J+90.
                </p>
              </div>
              <button
                onClick={() => handleGenerate()}
                className="cursor-pointer px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                Générer un exemple pour {currentSector.name}
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 bg-[#11141C] border border-white/[0.08] rounded-lg text-center space-y-4">
              <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
              <div className="font-display text-sm font-semibold text-white">Analyse des flux de valeur en cours...</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Modélisation de l asymétrie de marché, calibrage des prix et synthèse de la feuille de route 30-60-90 jours.
              </p>
            </div>
          )}

          {blueprint && !loading && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              {/* Dossier Header and Controls */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-blue-400 font-medium">
                    Plan d Exécution Stratégique · {currentSector.name}
                  </div>
                  <h2 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    {customNiche || currentSector.niches[0]?.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="cursor-pointer px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSaveToPipeline(
                        blueprint,
                        currentSector,
                        customNiche || currentSector.niches[0]?.title || 'Projet Spécial'
                      );
                      setSavedSuccess(true);
                      setTimeout(() => setSavedSuccess(false), 3000);
                    }}
                    className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{savedSuccess ? 'Ajouté au Pipeline !' : 'Suivre dans Pipeline'}</span>
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-6 space-y-1.5 bg-[#0D1017]/50">
                <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                  Thèse d Opportunité & Asymétrie de Marché
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {blueprint.executiveSummary}
                </p>
              </div>

              {/* Revenue Mechanics Unified Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07]">
                <div className="p-4">
                  <span className="text-[11px] text-slate-400 block">Pricing Conseillé</span>
                  <span className="text-xs font-semibold font-mono text-white mt-1 block">
                    {blueprint.revenueMechanics.pricingModel}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] text-slate-400 block">Marge Brute Estimée</span>
                  <span className="text-sm font-semibold font-mono text-emerald-400 mt-1 block tabular-nums">
                    {blueprint.revenueMechanics.expectedGrossMargin}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] text-slate-400 block">Panier Moyen</span>
                  <span className="text-xs font-semibold font-mono text-blue-300 mt-1 block tabular-nums">
                    {blueprint.revenueMechanics.targetTicket}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-[11px] text-slate-400 block">Scalabilité</span>
                  <span className="text-xs font-semibold font-mono text-amber-400 mt-1 block">
                    {blueprint.revenueMechanics.scalabilityGrade}
                  </span>
                </div>
              </div>

              <div className="px-6 py-3.5 text-xs text-slate-300 bg-[#0D1017]/40 leading-relaxed">
                <span className="font-semibold text-white">Mécanique de Monétisation : </span>
                {blueprint.revenueMechanics.explanation}
              </div>

              {/* 3 Acquisition Strategies */}
              <div className="p-6 space-y-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  3 Canaux d Acquisition Client à Coût Zéro
                </span>
                <div className="divide-y divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#0D1017]/60">
                  {blueprint.acquisitionStrategy.map((strat, idx) => (
                    <div key={idx} className="p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-blue-400 font-semibold">{strat.channel}</span>
                        <span className="text-slate-400 font-mono text-[11px] tabular-nums shrink-0">
                          Conversion : {strat.expectedConversion}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{strat.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-60-90 Day Roadmap */}
              <div className="p-6 space-y-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Feuille de Route Chronologique (J+30 / J+60 / J+90)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#0D1017]/60">
                  <div className="p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>J+30 : Validation & Cash</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {blueprint.roadmap30_60_90.day30}
                    </p>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>J+60 : Automatisation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {blueprint.roadmap30_60_90.day60}
                    </p>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>J+90 : Échelle & Marge</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {blueprint.roadmap30_60_90.day90}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cross-sector synergies */}
              <div className="p-6 space-y-2.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Synergies Cross-Secteur pour Démultiplier les Gains</span>
                </span>
                <div className="space-y-1.5">
                  {blueprint.crossSectorSynergies.map((syn, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{syn}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Moat */}
              <div className="p-6 bg-[#0D1017]/50 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-white">Barrière à l Entrée & Moat Défensif</div>
                  <div className="text-slate-300 leading-relaxed">{blueprint.keyRisksAndMoat.defenseMoat}</div>
                  <div className="text-slate-500 text-[11px] pt-1">
                    Risque principal à contrôler : {blueprint.keyRisksAndMoat.primaryRisk}
                  </div>
                </div>
              </div>

              {/* Operational Stack */}
              <div className="p-6 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Stack opérationnelle recommandée (1 opérateur autonome)
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300 font-mono">
                  {blueprint.operationalStack.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#0D1017] rounded border border-white/[0.08]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
