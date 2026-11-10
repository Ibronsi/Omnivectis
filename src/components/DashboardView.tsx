import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookmarkCheck,
  Target,
  Clock,
} from 'lucide-react';
import { PipelineItem, SimulationResult, SectorCategory } from '../types/market';
import { ActiveTab } from './Header';

interface DashboardViewProps {
  simulationResult: SimulationResult;
  pipelineItems: PipelineItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenBlueprintForSector: (sectorId: SectorCategory, nicheTitle: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  simulationResult,
  pipelineItems,
  onNavigateTab,
  onOpenBlueprintForSector,
}) => {
  // Aggregate Pipeline Metrics
  const totalPipelineTargetMrr = pipelineItems.reduce((acc, curr) => acc + curr.targetMrr, 0);
  const totalPipelineCurrentMrr = pipelineItems.reduce((acc, curr) => acc + curr.currentMrr, 0);
  const pipelineAchievementRate =
    totalPipelineTargetMrr > 0 ? Math.round((totalPipelineCurrentMrr / totalPipelineTargetMrr) * 100) : 0;

  // Calculate checklists completion rate across all items
  const allChecklists = pipelineItems.flatMap((item) => item.checklists);
  const completedChecklistsCount = allChecklists.filter((c) => c.done).length;
  const checklistCompletionRate =
    allChecklists.length > 0 ? Math.round((completedChecklistsCount / allChecklists.length) * 100) : 0;

  // Prepare monthly timeline data for Recharts AreaChart
  const timelineChartData = simulationResult.monthlyTimeline.map((item) => ({
    monthName: `Mois ${item.month}`,
    month: item.month,
    revenue: item.revenue,
    costs: item.costs,
    netProfit: item.netProfit,
    cumulativeCash: item.cumulativeCash,
  }));

  // Prepare Pipeline stage distribution data for BarChart
  const stageLabels: Record<PipelineItem['stage'], string> = {
    discovery: '01. Découverte',
    validation: '02. Validation',
    building: '03. MVP & Setup',
    monetizing: '04. Monétisation',
  };

  const stageDataMap = {
    discovery: { stage: stageLabels.discovery, targetMrr: 0, currentMrr: 0, count: 0 },
    validation: { stage: stageLabels.validation, targetMrr: 0, currentMrr: 0, count: 0 },
    building: { stage: stageLabels.building, targetMrr: 0, currentMrr: 0, count: 0 },
    monetizing: { stage: stageLabels.monetizing, targetMrr: 0, currentMrr: 0, count: 0 },
  };

  pipelineItems.forEach((item) => {
    if (stageDataMap[item.stage]) {
      stageDataMap[item.stage].targetMrr += item.targetMrr;
      stageDataMap[item.stage].currentMrr += item.currentMrr;
      stageDataMap[item.stage].count += 1;
    }
  });

  const pipelineStagesChartData = Object.values(stageDataMap);

  // Prepare Sector distribution data for PieChart
  const sectorPieColors = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Purple
  ];

  const sectorChartData = simulationResult.sectorBreakdown.map((sec, idx) => ({
    name: sec.name.length > 22 ? sec.name.slice(0, 20) + '...' : sec.name,
    fullName: sec.name,
    value: sec.monthlyRevenue,
    sharePercent: sec.sharePercent,
    color: sectorPieColors[idx % sectorPieColors.length],
  }));

  // Custom Tooltip for Recharts
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl text-xs space-y-1.5 font-sans">
          <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
          <div className="font-mono text-emerald-400 tabular-nums">
            Revenu Brut : {payload[0]?.value?.toLocaleString()} €
          </div>
          <div className="font-mono text-rose-400 tabular-nums">
            Coûts Opérationnels : {payload[1]?.value?.toLocaleString()} €
          </div>
          {payload[2] && (
            <div className="font-mono text-cyan-300 tabular-nums pt-1 border-t border-slate-800/60">
              Trésorerie Cumulée : {payload[2]?.value?.toLocaleString()} €
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Top Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">
            Tableau de Bord Exécutif & Synthèse
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Vue d Ensemble des Revenus & Pipeline
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Consolidation en temps réel des projections financières du Simulateur et de l avancement opérationnel
            de votre portefeuille d opportunités actives.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Ajuster la Simulation</span>
          </button>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Gérer le Pipeline</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pipeline Cash In hand vs Target */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>MRR Réalisé Actuel</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-400 font-semibold">
              {pipelineAchievementRate}% de la cible
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {totalPipelineCurrentMrr.toLocaleString()} € / mois
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, pipelineAchievementRate)}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Cible Pipeline : {totalPipelineTargetMrr.toLocaleString()} € / mois
          </div>
        </div>

        {/* Projected Simulation ARR */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>ARR Projeté (Simulateur)</span>
            </span>
            <span className="font-mono text-[11px] text-indigo-300">
              MRR : {simulationResult.projectedMrr.toLocaleString()} €
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 tabular-nums">
            {simulationResult.projectedArr.toLocaleString()} € / an
          </div>
          <div className="text-[11px] text-slate-400">
            EBITDA estimé : <strong className="text-white font-mono">{simulationResult.projectedEbitda.toLocaleString()} €</strong>
          </div>
        </div>

        {/* Break-even & ROI */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Point Mort & ROI</span>
            </span>
            <span className="font-mono text-[11px] text-cyan-300 font-bold">
              +{simulationResult.roiPercentage}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
            Mois {simulationResult.breakEvenMonth}
          </div>
          <div className="text-[11px] text-slate-400">
            Trésorerie finale : <span className="font-mono font-semibold text-slate-200">{simulationResult.monthlyTimeline[simulationResult.monthlyTimeline.length - 1]?.cumulativeCash.toLocaleString()} €</span>
          </div>
        </div>

        {/* Execution & Checklists */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Avancement Opérationnel</span>
            </span>
            <span className="font-mono text-[11px] text-amber-300 font-bold">
              {checklistCompletionRate}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {completedChecklistsCount} / {allChecklists.length} jalons
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${checklistCompletionRate}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {pipelineItems.length} projets suivis dans le pipeline
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid with Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Chart: Trajectoire Financière Prévisionnelle (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Trajectoire Financière Prévisionnelle (Simulateur)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Évolution projetée des revenus bruts, coûts fixes/variables et trésorerie cumulée
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-xs inline-block" />
                Revenus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-500/80 rounded-xs inline-block" />
                Coûts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-cyan-400 rounded-xs inline-block" />
                Trésorerie
              </span>
            </div>
          </div>

          {/* Recharts AreaChart */}
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCosts)"
                  name="Coûts"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCash"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorCash)"
                  name="Trésorerie"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Visual: Sector Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Répartition Sectorielle des Gains
            </span>
            <span className="text-xs text-indigo-400 font-mono font-semibold">
              {simulationResult.diversificationScore}/100 diversifié
            </span>
          </div>

          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono shadow-xl">
                          <div className="text-white font-bold">{data.fullName}</div>
                          <div className="text-emerald-400">{data.value.toLocaleString()} € / mois</div>
                          <div className="text-slate-400">Part : {data.sharePercent}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label inside Donut */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-xs text-slate-400 block">Total MRR</span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {simulationResult.projectedMrr.toLocaleString()} €
              </span>
            </div>
          </div>

          {/* Legend and Share breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {sectorChartData.map((sec, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate max-w-[180px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                  <span className="text-slate-300 truncate" title={sec.fullName}>
                    {sec.fullName}
                  </span>
                </div>
                <div className="font-mono text-right shrink-0">
                  <span className="text-white font-semibold tabular-nums">{sec.value.toLocaleString()} €</span>
                  <span className="text-slate-500 ml-1.5">({sec.sharePercent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Status Breakdown with Recharts BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stage Comparison Chart (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Valorisation du Pipeline par Étape
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparatif entre MRR Cible et MRR Actuellement Encaissé
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-xs inline-block" />
                Cible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                Encaissé
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStagesChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="stage"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `${val / 1000}k€`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono shadow-xl space-y-1">
                          <div className="text-white font-bold">{label}</div>
                          <div className="text-indigo-400">
                            Cible : {payload[0]?.value?.toLocaleString()} € / mois
                          </div>
                          <div className="text-emerald-400">
                            Encaissé : {payload[1]?.value?.toLocaleString()} € / mois
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="targetMrr" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cible MRR" />
                <Bar dataKey="currentMrr" fill="#10b981" radius={[4, 4, 0, 0]} name="Encaissé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Pipeline Items Table (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Opportunités en Cours d Exécution ({pipelineItems.length})
            </span>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>Voir tout le pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto">
            {pipelineItems.map((item) => {
              const itemDoneCount = item.checklists.filter((c) => c.done).length;
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400 font-medium text-[11px] truncate">
                        {item.sectorName}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {stageLabels[item.stage]}
                      </span>
                    </div>
                    <h4 className="font-bold text-white truncate mt-0.5">{item.title}</h4>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                      <span>{itemDoneCount}/{item.checklists.length} tâches validées</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="font-mono text-emerald-400 font-bold tabular-nums">
                      {item.targetMrr.toLocaleString()} € / mois
                    </div>
                    <button
                      onClick={() => onOpenBlueprintForSector(item.sectorId, item.title)}
                      className="cursor-pointer text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Blueprint IA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
