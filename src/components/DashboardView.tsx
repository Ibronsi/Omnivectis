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
} from 'recharts';
import {
  TrendingUp,
  ArrowRight,
  BookmarkCheck,
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
  const totalPipelineTargetMrr = pipelineItems.reduce((acc, curr) => acc + curr.targetMrr, 0);
  const totalPipelineCurrentMrr = pipelineItems.reduce((acc, curr) => acc + curr.currentMrr, 0);
  const pipelineAchievementRate =
    totalPipelineTargetMrr > 0 ? Math.round((totalPipelineCurrentMrr / totalPipelineTargetMrr) * 100) : 0;

  const allChecklists = pipelineItems.flatMap((item) => item.checklists);
  const completedChecklistsCount = allChecklists.filter((c) => c.done).length;
  const checklistCompletionRate =
    allChecklists.length > 0 ? Math.round((completedChecklistsCount / allChecklists.length) * 100) : 0;

  const timelineChartData = simulationResult.monthlyTimeline.map((item) => ({
    monthName: `M${item.month}`,
    month: item.month,
    revenue: item.revenue,
    costs: item.costs,
    netProfit: item.netProfit,
    cumulativeCash: item.cumulativeCash,
  }));

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

  const sectorPieColors = [
    '#3B82F6',
    '#10B981',
    '#06B6D4',
    '#F59E0B',
    '#EC4899',
    '#8B5CF6',
  ];

  const sectorChartData = simulationResult.sectorBreakdown.map((sec, idx) => ({
    name: sec.name.length > 22 ? sec.name.slice(0, 20) + '...' : sec.name,
    fullName: sec.name,
    value: sec.monthlyRevenue,
    sharePercent: sec.sharePercent,
    color: sectorPieColors[idx % sectorPieColors.length],
  }));

  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D1017] border border-white/[0.12] rounded-lg p-3 text-xs space-y-1.5 font-sans">
          <div className="font-semibold text-white border-b border-white/[0.08] pb-1">{label}</div>
          <div className="font-mono text-emerald-400 tabular-nums">
            Revenu Brut : {payload[0]?.value?.toLocaleString('fr-FR')} €
          </div>
          <div className="font-mono text-rose-400 tabular-nums">
            Coûts Opérationnels : {payload[1]?.value?.toLocaleString('fr-FR')} €
          </div>
          {payload[2] && (
            <div className="font-mono text-blue-300 tabular-nums pt-1 border-t border-white/[0.08]">
              Trésorerie Cumulée : {payload[2]?.value?.toLocaleString('fr-FR')} €
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400">
            Synthèse Exécutive
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Vue d Ensemble des Revenus & Pipeline
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Consolidation des projections du simulateur et de l avancement opérationnel de votre portefeuille actif.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('simulator')}
            className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-200 bg-[#11141C] hover:bg-[#171C28] border border-white/[0.1] rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ajuster la Simulation</span>
          </button>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Gérer le Pipeline</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Column KPI Ledger Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] bg-[#11141C] border border-white/[0.08] rounded-xl">
        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MRR Réalisé Actuel</span>
            <span className="font-mono text-[11px] text-emerald-400 tabular-nums">
              {pipelineAchievementRate}% cible
            </span>
          </div>
          <div className="text-2xl font-semibold font-mono text-white tabular-nums">
            {totalPipelineCurrentMrr.toLocaleString('fr-FR')} €<span className="text-xs text-slate-400 font-normal"> / mois</span>
          </div>
          <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, pipelineAchievementRate)}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            Cible : {totalPipelineTargetMrr.toLocaleString('fr-FR')} € / mois
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ARR Projeté (Simulateur)</span>
            <span className="font-mono text-[11px] text-blue-400 tabular-nums">
              MRR {simulationResult.projectedMrr.toLocaleString('fr-FR')} €
            </span>
          </div>
          <div className="text-2xl font-semibold font-mono text-white tabular-nums">
            {simulationResult.projectedArr.toLocaleString('fr-FR')} €<span className="text-xs text-slate-400 font-normal"> / an</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums pt-1">
            EBITDA estimé : <span className="text-slate-200 font-medium">{simulationResult.projectedEbitda.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Point Mort & ROI</span>
            <span className="font-mono text-[11px] text-emerald-400 tabular-nums">
              +{simulationResult.roiPercentage}%
            </span>
          </div>
          <div className="text-2xl font-semibold font-mono text-white tabular-nums">
            Mois {simulationResult.breakEvenMonth}
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums pt-1">
            Trésorerie : <span className="text-slate-200 font-medium">{simulationResult.monthlyTimeline[simulationResult.monthlyTimeline.length - 1]?.cumulativeCash.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avancement Opérationnel</span>
            <span className="font-mono text-[11px] text-amber-400 tabular-nums">
              {checklistCompletionRate}%
            </span>
          </div>
          <div className="text-2xl font-semibold font-mono text-white tabular-nums">
            {completedChecklistsCount} / {allChecklists.length}<span className="text-xs text-slate-400 font-normal"> jalons</span>
          </div>
          <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
            <div
              style={{ width: `${checklistCompletionRate}%` }}
              className="bg-amber-400 h-full transition-all duration-300"
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            {pipelineItems.length} projets actifs
          </div>
        </div>
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-[#11141C] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Trajectoire Financière (Simulation)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Évolution projetée des revenus bruts, coûts et trésorerie cumulée
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs inline-block" />
                Revenus
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
                Coûts
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-xs inline-block" />
                Trésorerie
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k€`}
                />
                <Tooltip content={<CustomTimelineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="costs"
                  stroke="#F43F5E"
                  strokeWidth={1.75}
                  fillOpacity={1}
                  fill="url(#colorCosts)"
                  name="Coûts"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeCash"
                  stroke="#10B981"
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

        {/* Sector Distribution Donut */}
        <div className="lg:col-span-4 bg-[#11141C] border border-white/[0.08] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">
              Répartition Sectorielle
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {simulationResult.diversificationScore}/100
            </span>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sectorChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#11141C" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0D1017] border border-white/[0.12] rounded-lg p-2.5 text-xs font-mono">
                          <div className="text-white font-semibold">{data.fullName}</div>
                          <div className="text-emerald-400 tabular-nums">{data.value.toLocaleString('fr-FR')} € / mois</div>
                          <div className="text-slate-400 tabular-nums">Part : {data.sharePercent}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute text-center pointer-events-none">
              <span className="text-[11px] text-slate-400 block">MRR cible</span>
              <span className="text-sm font-semibold font-mono text-white tabular-nums">
                {simulationResult.projectedMrr.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/[0.07]">
            {sectorChartData.map((sec, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: sec.color }} />
                  <span className="text-slate-300 truncate" title={sec.fullName}>
                    {sec.fullName}
                  </span>
                </div>
                <div className="font-mono text-right shrink-0 tabular-nums">
                  <span className="text-slate-100 font-medium">{sec.value.toLocaleString('fr-FR')} €</span>
                  <span className="text-slate-500 ml-1.5">{sec.sharePercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Analytics + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 bg-[#11141C] border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Valorisation du Pipeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparatif MRR cible vs encaissé par étape
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-xs inline-block" />
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
              <BarChart data={pipelineStagesChartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="stage"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickFormatter={(val) => `${val / 1000}k€`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0D1017] border border-white/[0.12] rounded-lg p-2.5 text-xs font-mono space-y-1">
                          <div className="text-white font-semibold">{label}</div>
                          <div className="text-blue-400 tabular-nums">
                            Cible : {payload[0]?.value?.toLocaleString('fr-FR')} € / mois
                          </div>
                          <div className="text-emerald-400 tabular-nums">
                            Encaissé : {payload[1]?.value?.toLocaleString('fr-FR')} € / mois
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="targetMrr" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Cible MRR" />
                <Bar dataKey="currentMrr" fill="#10B981" radius={[4, 4, 0, 0]} name="Encaissé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#11141C] border border-white/[0.08] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">
              Projets en Cours ({pipelineItems.length})
            </h2>
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="cursor-pointer text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>Tout voir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-white/[0.07] max-h-64 overflow-y-auto">
            {pipelineItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Aucun projet suivi dans votre pipeline.
              </div>
            ) : (
              pipelineItems.map((item) => {
                const itemDoneCount = item.checklists.filter((c) => c.done).length;
                return (
                  <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 text-xs hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="truncate">{item.sectorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-300 shrink-0">{stageLabels[item.stage]}</span>
                      </div>
                      <h4 className="font-semibold text-white truncate">{item.title}</h4>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {itemDoneCount}/{item.checklists.length} jalons complétés
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="font-mono text-emerald-400 font-semibold tabular-nums">
                        {item.targetMrr.toLocaleString('fr-FR')} € / mois
                      </div>
                      <button
                        onClick={() => onOpenBlueprintForSector(item.sectorId, item.title)}
                        className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Ouvrir le plan
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
