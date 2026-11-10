import React, { useState } from 'react';
import {
  ArrowLeftRight,
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle,
  ShieldCheck,
  Loader2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { EconomicSector, SectorCategory } from '../types/market';
import { CROSS_SECTOR_COMBINATIONS, ECONOMIC_SECTORS } from '../data/sectorsData';

interface ArbitrageViewProps {
  onOpenBlueprintForArbitrage: (sectorId: SectorCategory, customTitle: string) => void;
}

export const ArbitrageView: React.FC<ArbitrageViewProps> = ({
  onOpenBlueprintForArbitrage,
}) => {
  const [sectorAId, setSectorAId] = useState<SectorCategory>('ai_deeptech');
  const [sectorBId, setSectorBId] = useState<SectorCategory>('cleantech');
  const [riskTolerance, setRiskTolerance] = useState<string>('Équilibré (Risque modéré, cash récurrent)');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [customArbitrage, setCustomArbitrage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sectorA = ECONOMIC_SECTORS.find((s) => s.id === sectorAId) || ECONOMIC_SECTORS[0];
  const sectorB = ECONOMIC_SECTORS.find((s) => s.id === sectorBId) || ECONOMIC_SECTORS[1];

  const handleRunArbitrage = async () => {
    if (sectorAId === sectorBId) {
      setError('Veuillez sélectionner deux secteurs différents pour analyser l arbitrage.');
      return;
    }
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/arbitrage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorA: sectorA.name,
          sectorB: sectorB.name,
          riskTolerance,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l analyse d arbitrage.');
      }

      setCustomArbitrage(data.analysis);
    } catch (err: any) {
      setError(err?.message || 'Erreur de connexion.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
          Convergence Économique & Arbitrage de Flux
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Arbitrage Cross-Sectoriel Multi-Marchés
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Les plus grandes fortunes entrepreneuriales se créent à l intersection de deux mondes qui s ignorent.
          Combinez l agilité technologique d un secteur avec l appétence en cash d un secteur traditionnel.
        </p>
      </div>

      {/* Interactive Pair Generator */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            <span>Sélectionnez 2 Secteurs pour Déceler une Asymétrie</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Modélisation de Convergence IA</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Sector A */}
          <div className="space-y-1.5 p-4 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
              Secteur Pivot 1 (Levier d efficacité)
            </span>
            <select
              value={sectorAId}
              onChange={(e) => setSectorAId(e.target.value as SectorCategory)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              {ECONOMIC_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 pt-1">
              Marge moyenne : {sectorA.averageMargin}% · TAM : {sectorA.globalTam}
            </div>
          </div>

          {/* Plus / Exchange Icon */}
          <div className="flex flex-col items-center justify-center text-slate-400 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">Interconnexion</span>
          </div>

          {/* Sector B */}
          <div className="space-y-1.5 p-4 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Secteur Pivot 2 (Monétisation & Cash)
            </span>
            <select
              value={sectorBId}
              onChange={(e) => setSectorBId(e.target.value as SectorCategory)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              {ECONOMIC_SECTORS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 pt-1">
              Marge moyenne : {sectorB.averageMargin}% · TAM : {sectorB.globalTam}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400">
            Objectif : Détecter comment vendre la valeur de {sectorA.name} aux acteurs de {sectorB.name}.
          </div>
          <button
            onClick={handleRunArbitrage}
            disabled={analyzing}
            className="cursor-pointer px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyse d arbitrage en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Révéler l Opportunité d Arbitrage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Custom Generated Arbitrage Output */}
      {customArbitrage && (
        <div className="p-6 bg-slate-900 border border-indigo-500/50 rounded-xl space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Modèle d Arbitrage Découvert
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {customArbitrage.conceptName}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Potentiel de Cash-Flow Net</span>
              <span className="text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                {customArbitrage.estimatedMonthlyCashflow}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Mécanisme de l Asymétrie Exploitée :
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {customArbitrage.arbitrageMechanism}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                Flux 1 via {sectorA.name} :
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {customArbitrage.revenueStreamA}
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Flux 2 via {sectorB.name} :
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {customArbitrage.revenueStreamB}
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-white">Avantage Injuste (Pourquoi personne d autre ne le fait) :</span>
              <p className="text-slate-300 leading-relaxed">{customArbitrage.unfairAdvantage}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onOpenBlueprintForArbitrage(sectorAId, customArbitrage.conceptName)}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Générer le Dossier d Exécution pour cette Convergence</span>
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pre-calibrated Benchmark Synergies */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Exemples de Convergences Éprouvées à Fort Rendement
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Les 4 Modèles d Arbitrage les Plus Rentables
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CROSS_SECTOR_COMBINATIONS.map((combo) => (
            <div
              key={combo.id}
              className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-2">
                  <span className="font-mono text-indigo-400">{combo.synergyType}</span>
                  <span className="font-mono text-emerald-400 font-bold tabular-nums">
                    {combo.estimatedPotential}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{combo.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{combo.tagline}</p>

                <div className="my-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  {combo.description}
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-200">Avantage injuste : </span>
                  {combo.unfairAdvantage}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Déploiement estimé : <strong className="text-white font-mono">{combo.timeToDeploy}</strong>
                </span>
                <button
                  onClick={() => onOpenBlueprintForArbitrage(combo.sectorAId as SectorCategory, combo.title)}
                  className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Générer le Blueprint
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
