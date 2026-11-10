import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  PieChart,
  Bot,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { SectorCategory, SimulationInputs } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import { calculateSimulation } from '../utils/simulatorEngine';

interface SimulatorViewProps {
  initialSectors?: SectorCategory[];
  onTriggerBlueprint: (sectorId: SectorCategory, targetRevenue: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  initialSectors = ['ai_deeptech', 'b2b_services'],
  onTriggerBlueprint,
}) => {
  const [selectedSectorIds, setSelectedSectorIds] = useState<SectorCategory[]>(
    initialSectors.length > 0 ? initialSectors : ['ai_deeptech', 'b2b_services']
  );
  const [startingCapital, setStartingCapital] = useState<number>(3000);
  const [weeklyHours, setWeeklyHours] = useState<number>(25);
  const [timeHorizonMonths, setTimeHorizonMonths] = useState<number>(12);
  const [automationLevel, setAutomationLevel] = useState<number>(75);
  const [targetMonthlyExpense, setTargetMonthlyExpense] = useState<number>(600);
  const [scenarioMode, setScenarioMode] = useState<'conservative' | 'target' | 'aggressive'>('target');

  const toggleSector = (id: SectorCategory) => {
    if (selectedSectorIds.includes(id)) {
      if (selectedSectorIds.length > 1) {
        setSelectedSectorIds(selectedSectorIds.filter((s) => s !== id));
      }
    } else {
      if (selectedSectorIds.length < 5) {
        setSelectedSectorIds([...selectedSectorIds, id]);
      }
    }
  };

  const simulationInputs: SimulationInputs = useMemo(
    () => ({
      selectedSectorIds,
      startingCapital,
      weeklyHours,
      timeHorizonMonths,
      automationLevel,
      targetMonthlyExpense,
    }),
    [selectedSectorIds, startingCapital, weeklyHours, timeHorizonMonths, automationLevel, targetMonthlyExpense]
  );

  const rawResult = useMemo(() => calculateSimulation(simulationInputs), [simulationInputs]);

  // Adjust for scenario mode
  const result = useMemo(() => {
    let multiplier = 1.0;
    if (scenarioMode === 'conservative') multiplier = 0.7;
    if (scenarioMode === 'aggressive') multiplier = 1.45;

    return {
      ...rawResult,
      projectedMrr: Math.round(rawResult.projectedMrr * multiplier),
      projectedArr: Math.round(rawResult.projectedArr * multiplier),
      projectedEbitda: Math.round(rawResult.projectedEbitda * multiplier),
      sectorBreakdown: rawResult.sectorBreakdown.map((s) => ({
        ...s,
        monthlyRevenue: Math.round(s.monthlyRevenue * multiplier),
      })),
      monthlyTimeline: rawResult.monthlyTimeline.map((item) => ({
        ...item,
        revenue: Math.round(item.revenue * multiplier),
        netProfit: Math.round(item.revenue * multiplier - item.costs),
        cumulativeCash: Math.round(item.cumulativeCash * multiplier),
      })),
    };
  }, [rawResult, scenarioMode]);

  const maxTimelineRevenue = Math.max(...result.monthlyTimeline.map((m) => m.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Top Banner and Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            Moteur de Modélisation Financière Multi-Flux
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simulateur de Gains Multi-Sectoriels
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Combinez stratégiquement jusqu à 5 secteurs économiques pour construire un portefeuille de revenus
            diversifié, résilient et maximisant le cash-flow net grâce aux leviers d automatisation.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setScenarioMode('conservative')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              scenarioMode === 'conservative'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prudent (-30%)
          </button>
          <button
            onClick={() => setScenarioMode('target')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              scenarioMode === 'target'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cible Réaliste
          </button>
          <button
            onClick={() => setScenarioMode('aggressive')}
            className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              scenarioMode === 'aggressive'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agressif (+45%)
          </button>
        </div>
      </div>

      {/* Reactive Real-Time Calculation Indicator */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs text-indigo-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="font-semibold text-white">Calculateur Réactif Temps Réel :</span>
          <span>
            Les gains (MRR {result.projectedMrr.toLocaleString()} €, ARR {result.projectedArr.toLocaleString()} €) se recalculent instantanément sur vos ajustements.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Modèle d asymétrie de marges V2.4
        </span>
      </div>

      {/* Main Grid: Controls on Left, Metrics & Projections on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Parameters (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sector Multi-Selector */}
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Secteurs Sélectionnés ({selectedSectorIds.length}/5)</span>
              </span>
              <span className="text-[11px] text-slate-400">Cliquez pour ajouter/retirer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ECONOMIC_SECTORS.map((sector) => {
                const isSelected = selectedSectorIds.includes(sector.id);
                return (
                  <button
                    key={sector.id}
                    onClick={() => toggleSector(sector.id)}
                    className={`cursor-pointer p-2.5 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{sector.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>Marge {sector.averageMargin}%</span>
                      <span className="font-mono text-emerald-400">{sector.growthRate}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capital and Effort Sliders */}
          <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-5">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Paramètres d Investissement & Capacité
            </span>

            {/* Capital de départ */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Capital de démarrage disponible</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {startingCapital.toLocaleString()} €
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30000"
                step="500"
                value={startingCapital}
                onChange={(e) => setStartingCapital(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 € (Bootstrap total)</span>
                <span>15 000 €</span>
                <span>30 000 €</span>
              </div>
            </div>

            {/* Heures par semaine */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Temps d implication hebdomadaire</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {weeklyHours} h / semaine
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>5h (Side-project)</span>
                <span>35h (Plein temps)</span>
                <span>60h (Commando)</span>
              </div>
            </div>

            {/* Automatisation par IA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Levier d Automatisation & Agents IA</span>
                </span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {automationLevel}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={automationLevel}
                onChange={(e) => setAutomationLevel(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>10% (Manuel)</span>
                <span>50% (Workflows hybrides)</span>
                <span>95% (Agents autonomes)</span>
              </div>
            </div>

            {/* Horizon temporel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Horizon d exécution</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {timeHorizonMonths} mois
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[6, 12, 24, 36].map((months) => (
                  <button
                    key={months}
                    onClick={() => setTimeHorizonMonths(months)}
                    className={`cursor-pointer py-1.5 text-xs font-mono font-medium rounded border transition-colors ${
                      timeHorizonMonths === months
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {months}m
                  </button>
                ))}
              </div>
            </div>

            {/* Dépenses mensuelles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Budget outils & marketing mensuel</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {targetMonthlyExpense} € / mois
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={targetMonthlyExpense}
                onChange={(e) => setTargetMonthlyExpense(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Dashboards & Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* High-Impact Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Revenu Mensuel (MRR)</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums mt-1.5">
                {result.projectedMrr.toLocaleString()} €
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                À maturité mois {timeHorizonMonths}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chiffre Annuel (ARR)</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-indigo-300 tabular-nums mt-1.5">
                {result.projectedArr.toLocaleString()} €
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                EBITDA : {result.projectedEbitda.toLocaleString()} €
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Point Mort</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-cyan-400 tabular-nums mt-1.5">
                Mois {result.breakEvenMonth}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                ROI net : +{result.roiPercentage}%
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Diversification</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-amber-300 tabular-nums mt-1.5">
                {result.diversificationScore}/100
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Résilience anti-fragile
              </div>
            </div>
          </div>

          {/* Revenue Breakdown by Sector */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span>Contribution Estimée par Secteur Actif</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Total : {result.projectedMrr.toLocaleString()} € / mois
              </span>
            </div>

            {/* Visual segmented bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
              {result.sectorBreakdown.map((sec, idx) => {
                const colors = [
                  'bg-indigo-500',
                  'bg-emerald-500',
                  'bg-cyan-500',
                  'bg-amber-500',
                  'bg-pink-500',
                ];
                return (
                  <div
                    key={sec.sectorId}
                    style={{ width: `${sec.sharePercent}%` }}
                    className={`${colors[idx % colors.length]} h-full transition-all duration-300`}
                    title={`${sec.name} : ${sec.sharePercent}%`}
                  />
                );
              })}
            </div>

            {/* List with CTA per sector */}
            <div className="divide-y divide-slate-800/80">
              {result.sectorBreakdown.map((sec, idx) => {
                const colors = [
                  'text-indigo-400',
                  'text-emerald-400',
                  'text-cyan-400',
                  'text-amber-400',
                  'text-pink-400',
                ];
                return (
                  <div
                    key={sec.sectorId}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length].replace('text-', 'bg-')}`} />
                      <span className="font-medium text-slate-200">{sec.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="text-white font-bold tabular-nums">
                          {sec.monthlyRevenue.toLocaleString()} €
                        </span>
                        <span className="text-slate-500 ml-1.5">({sec.sharePercent}%)</span>
                      </div>
                      <button
                        onClick={() =>
                          onTriggerBlueprint(
                            sec.sectorId,
                            `${sec.monthlyRevenue.toLocaleString()} € / mois`
                          )
                        }
                        className="cursor-pointer text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        <span>Générer Blueprint</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trajectory Chart (Clean Tailwind Bars) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Trajectoire de Cash-Flow Mensuel (Mois 1 à {timeHorizonMonths})
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                  Revenu Brut
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-500/70 rounded-xs inline-block" />
                  Coûts Opérationnels
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800 overflow-x-auto">
              {result.monthlyTimeline.map((item) => {
                const revHeight = Math.max(8, Math.round((item.revenue / maxTimelineRevenue) * 100));
                const costHeight = Math.max(4, Math.round((item.costs / maxTimelineRevenue) * 100));
                return (
                  <div
                    key={item.month}
                    className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 bg-slate-950 border border-slate-700 text-slate-200 text-[10px] font-mono p-1.5 rounded shadow-lg whitespace-nowrap z-20 transition-opacity">
                      <div>Mois {item.month}</div>
                      <div className="text-emerald-400">Revenu : {item.revenue.toLocaleString()} €</div>
                      <div className="text-rose-400">Coûts : {item.costs.toLocaleString()} €</div>
                      <div className="text-cyan-300">Profit net : {item.netProfit.toLocaleString()} €</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-xs transition-all"
                      />
                      <div
                        style={{ height: `${costHeight}%` }}
                        className="w-1/2 bg-rose-500/60 hover:bg-rose-400 rounded-t-xs transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">
                      M{item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Trésorerie cumulée finale estimée :</span>
              <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                {result.monthlyTimeline[result.monthlyTimeline.length - 1]?.cumulativeCash.toLocaleString()} €
              </span>
            </div>
          </div>

          {/* Callout action to generate Master Plan */}
          <div className="p-5 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Prêt à exécuter ce portefeuille multi-sectoriel ?</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                L IA analyse vos {selectedSectorIds.length} secteurs choisis et compile un plan d action 30-60-90 jours sur-mesure.
              </p>
            </div>
            <button
              onClick={() =>
                onTriggerBlueprint(
                  selectedSectorIds[0],
                  `${result.projectedMrr.toLocaleString()} € / mois`
                )
              }
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors whitespace-nowrap shrink-0"
            >
              Générer le Master Plan d Exécution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
