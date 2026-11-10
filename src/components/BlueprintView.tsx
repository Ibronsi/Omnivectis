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
} from 'lucide-react';
import { AIExecutionBlueprint, EconomicSector, OpportunityNiche, SectorCategory } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';

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
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentSector = ECONOMIC_SECTORS.find((s) => s.id === selectedSectorId) || ECONOMIC_SECTORS[0];

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
      <div className="border-b border-slate-800 pb-6">
        <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
          Générateur de Stratégie d Exécution IA
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Concepteur de Plan d Action Commercial & Revenus
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Configurez vos objectifs de gains, votre secteur cible et vos ressources disponibles. Le moteur
          IA synthétise un plan d action opérationnel d élite pour atteindre vos premiers revenus récurrents en moins de 30 jours.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Paramètres du Business</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Modèle Gemini 3.8 Flash</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Sector Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Secteur économique principal
              </label>
              <select
                value={selectedSectorId}
                onChange={(e) => setSelectedSectorId(e.target.value as SectorCategory)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {ECONOMIC_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Marge : {s.averageMargin}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Niche or Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Niche ciblée (ou laisser vide pour la recommandation optimale)
              </label>
              <input
                type="text"
                placeholder={currentSector.niches[0]?.title || 'Ex: Agents IA B2B pour experts-comptables'}
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Revenue */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Objectif de revenu mensuel visé
              </label>
              <select
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="5 000 € / mois">5 000 € / mois (Premier palier liberté)</option>
                <option value="15 000 € / mois">15 000 € / mois (Rentabilité consolidée)</option>
                <option value="50 000 € / mois">50 000 € / mois (Échelle et équipe lean)</option>
                <option value="100 000 €+ / mois">100 000 €+ / mois (Leadership de niche)</option>
              </select>
            </div>

            {/* Business Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Modèle d affaires privilégié
              </label>
              <select
                value={businessModel}
                onChange={(e) => setBusinessModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="SaaS B2B & Abonnements Récurrents">SaaS B2B / Micro-SaaS (Récurrence MRR 80%+)</option>
                <option value="Agence Produitisée / Retainer B2B">Service Produitisé / Retainer B2B (Cash immédiat)</option>
                <option value="Arbitrage de Flux & Commission (Take-Rate)">Arbitrage de Flux & Courtage (Zéro stock)</option>
                <option value="Marketplace de Niche B2B">Marketplace / Centrale d achat de niche</option>
              </select>
            </div>

            {/* Starting Budget */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Budget de démarrage disponible
              </label>
              <select
                value={capitalBudget}
                onChange={(e) => setCapitalBudget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="0€ (Bootstrap total sans capital)">0 € (Bootstrap total / No-code)</option>
                <option value="1 000€ à 3 000€">1 000 € à 3 000 € (Outils pros & cold outbound)</option>
                <option value="5 000€ à 15 000€">5 000 € à 15 000 € (Amorçage accéléré)</option>
              </select>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Vos compétences clés / Atouts
              </label>
              <input
                type="text"
                value={userSkills}
                onChange={(e) => setUserSkills(e.target.value)}
                placeholder="Ex: Vente, automatisation, code, réseau relationnel..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full mt-4 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
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

          {/* Quick Preset Buttons */}
          <div className="pt-2 border-t border-slate-800/80">
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
                className="text-[11px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
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
                className="text-[11px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
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
                className="text-[11px] px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
              >
                CleanTech Arbitrage (50k€/m)
              </button>
            </div>
          </div>
        </div>

        {/* Blueprint Dossier Output (7 cols) */}
        <div className="lg:col-span-7">
          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-rose-300 text-xs mb-6">
              {error}
            </div>
          )}

          {!blueprint && !loading && (
            <div className="p-12 bg-slate-900/40 border border-slate-800 border-dashed rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">Prêt à configurer votre plan d action</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Sélectionnez vos critères à gauche et cliquez sur "Compiler la Stratégie d Exécution". L IA
                  analysera la dynamique du marché et produira un plan de monétisation, d acquisition et une roadmap chronologique J+30 à J+90.
                </p>
              </div>
              <button
                onClick={() => handleGenerate()}
                className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                Générer un exemple pour {currentSector.name}
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-white">Analyse des flux de valeur en cours...</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Modélisation de l asymétrie de marché, calibrage des prix et synthèse de la feuille de route 30-60-90 jours.
              </p>
            </div>
          )}

          {blueprint && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
              {/* Dossier Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs text-slate-400">
                    Plan d Exécution Stratégique · {currentSector.name}
                  </div>
                  <h2 className="text-xl font-extrabold text-white mt-0.5">
                    {customNiche || currentSector.niches[0]?.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="cursor-pointer px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
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
                    className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{savedSuccess ? 'Ajouté au Pipeline !' : 'Suivre dans Pipeline'}</span>
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                  Thèse d Opportunité & Asymétrie de Marché
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {blueprint.executiveSummary}
                </p>
              </div>

              {/* Revenue Mechanics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Pricing Conseillé</span>
                  <span className="text-xs font-bold font-mono text-white mt-0.5 block">
                    {blueprint.revenueMechanics.pricingModel}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Marge Brute Estimée</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block tabular-nums">
                    {blueprint.revenueMechanics.expectedGrossMargin}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Panier Moyen</span>
                  <span className="text-xs font-bold font-mono text-cyan-300 mt-0.5 block">
                    {blueprint.revenueMechanics.targetTicket}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Scalabilité</span>
                  <span className="text-xs font-bold font-mono text-amber-300 mt-0.5 block">
                    {blueprint.revenueMechanics.scalabilityGrade}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 p-3 bg-slate-800/30 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-white">Mécanique de Monétisation : </span>
                {blueprint.revenueMechanics.explanation}
              </div>

              {/* 3 Acquisition Strategies */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                  3 Canaux d Acquisition Client à Coût Zéro
                </span>
                <div className="space-y-2.5">
                  {blueprint.acquisitionStrategy.map((strat, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-indigo-400 font-semibold">
                        <span>{strat.channel}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Conversion : {strat.expectedConversion}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{strat.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-60-90 Day Roadmap */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                  Feuille de Route Chronologique (J+30 / J+60 / J+90)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>J+30 : Validation & Cash</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {blueprint.roadmap30_60_90.day30}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>J+60 : Automatisation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {blueprint.roadmap30_60_90.day60}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
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
              <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Synergies Cross-Secteur pour Démultiplier les Gains</span>
                </span>
                <div className="space-y-1.5">
                  {blueprint.crossSectorSynergies.map((syn, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{syn}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defense Moat */}
              <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-white">Barrière à l Entrée & Moat Défensif :</div>
                  <div className="text-slate-300 leading-relaxed">{blueprint.keyRisksAndMoat.defenseMoat}</div>
                  <div className="text-slate-500 text-[11px] pt-1">
                    Risque principal à contrôler : {blueprint.keyRisksAndMoat.primaryRisk}
                  </div>
                </div>
              </div>

              {/* Operational Stack */}
              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Stack opérationnelle recommandée (1 opérateur autonome) :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blueprint.operationalStack.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60 font-mono"
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
