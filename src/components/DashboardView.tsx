import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  Wallet,
  ShieldCheck,
  Radio,
  RefreshCw,
} from 'lucide-react';
import {
  CountryCode,
  LiveFxRates,
  MarketSignal,
  PipelineItem,
  RealSaleRecord,
  SectorCategory,
  SignalsSnapshotPayload,
  SimulationResult,
  SourceHealthItem,
  StrictOpportunity,
  ValidationItem,
} from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';
import {
  convertCurrency,
  formatCurrencyAmount,
  getCurrencySymbol,
  getEffectiveFxRateToEur,
} from '../utils/currency';
import {
  getLastSignalsSnapshot,
  SseConnectionStatus,
  subscribeLiveEvent,
  subscribeSseStatus,
} from '../utils/liveStream';
import { ActiveTab } from './Header';
import { useTheme } from '../hooks/useTheme';

interface DashboardViewProps {
  simulationResult: SimulationResult;
  pipelineItems: PipelineItem[];
  countryCode?: CountryCode;
  liveRates?: LiveFxRates | null;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenBlueprintForSector: (sectorId: SectorCategory, nicheTitle: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  simulationResult,
  pipelineItems,
  countryCode = 'NER',
  liveRates,
  onNavigateTab,
  onOpenBlueprintForSector,
}) => {
  const { isDark } = useTheme();
  const chartGridStroke = isDark ? 'rgba(255,255,255,0.08)' : '#E7E5E4';
  const chartAxisColor = isDark ? '#A8A29E' : '#78716C';
  const pieStrokeColor = isDark ? '#141720' : '#FFFFFF';
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const activeCurrency = currentProfile.currency;
  const currencySymbol = getCurrencySymbol(activeCurrency);
  const fxInfo = getEffectiveFxRateToEur(activeCurrency, liveRates);

  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [validationItems, setValidationItems] = useState<ValidationItem[]>([]);
  const [opportunities, setOpportunities] = useState<StrictOpportunity[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>(
    () => getLastSignalsSnapshot()?.signals || []
  );
  const [sourceHealth, setSourceHealth] = useState<SourceHealthItem[]>(
    () => getLastSignalsSnapshot()?.sourceHealth || []
  );
  const [sseStatus, setSseStatus] = useState<SseConnectionStatus>('idle');
  const [loadingOps, setLoadingOps] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoadingOps(true);
    setErrorMsg(null);
    const errors: string[] = [];

    const [salesRes, valRes, oppRes, sigRes] = await Promise.allSettled([
      fetch('/api/sales'),
      fetch('/api/validation'),
      fetch(`/api/opportunities?countryCode=${encodeURIComponent(countryCode)}`),
      fetch('/api/signals/live'),
    ]);

    if (salesRes.status === 'fulfilled') {
      if (salesRes.value.ok) {
        const data = await salesRes.value.json();
        if (Array.isArray(data.sales)) setSales(data.sales);
      } else {
        errors.push(`Ventes (HTTP ${salesRes.value.status})`);
      }
    } else {
      errors.push('Ventes (réseau)');
    }

    if (valRes.status === 'fulfilled') {
      if (valRes.value.ok) {
        const data = await valRes.value.json();
        if (Array.isArray(data.items)) setValidationItems(data.items);
      } else {
        errors.push(`Validation (HTTP ${valRes.value.status})`);
      }
    } else {
      errors.push('Validation (réseau)');
    }

    if (oppRes.status === 'fulfilled') {
      if (oppRes.value.ok) {
        const data = await oppRes.value.json();
        if (Array.isArray(data.opportunities)) setOpportunities(data.opportunities);
      } else {
        errors.push(`Opportunités (HTTP ${oppRes.value.status})`);
      }
    } else {
      errors.push('Opportunités (réseau)');
    }

    if (sigRes.status === 'fulfilled') {
      if (sigRes.value.ok) {
        const data = await sigRes.value.json();
        if (Array.isArray(data.signals)) setSignals(data.signals);
        if (Array.isArray(data.sourceHealth)) setSourceHealth(data.sourceHealth);
      } else {
        errors.push(`Signaux (HTTP ${sigRes.value.status})`);
      }
    } else {
      errors.push('Signaux (réseau)');
    }

    if (errors.length > 0) {
      setErrorMsg(`Certaines données temps réel n'ont pas pu être chargées : ${errors.join(', ')}.`);
    }
    setLoadingOps(false);
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [countryCode]);

  useEffect(() => {
    const unsubSse = subscribeSseStatus(setSseStatus);
    const unsubSales = subscribeLiveEvent<{ sales?: RealSaleRecord[] }>(
      'sales_updated',
      (payload) => {
        if (Array.isArray(payload?.sales)) {
          setSales(payload.sales);
        }
      }
    );
    const unsubValidation = subscribeLiveEvent<{ items?: ValidationItem[] }>(
      'validation_updated',
      (payload) => {
        if (Array.isArray(payload?.items)) {
          setValidationItems(payload.items);
        }
      }
    );
    const unsubOpps = subscribeLiveEvent<{
      countryCode?: CountryCode;
      opportunities?: StrictOpportunity[];
    }>('opportunities_updated', (payload) => {
      if (Array.isArray(payload?.opportunities)) {
        if (!payload.countryCode || payload.countryCode === countryCode) {
          setOpportunities(payload.opportunities);
        }
      }
    });
    const unsubSignalsSnap = subscribeLiveEvent<SignalsSnapshotPayload>(
      'signals_snapshot',
      (payload) => {
        if (Array.isArray(payload?.signals)) setSignals(payload.signals);
        if (Array.isArray(payload?.sourceHealth)) setSourceHealth(payload.sourceHealth);
      }
    );
    const unsubSignalsUpd = subscribeLiveEvent<SignalsSnapshotPayload>(
      'signals_updated',
      (payload) => {
        if (Array.isArray(payload?.signals)) setSignals(payload.signals);
        if (Array.isArray(payload?.sourceHealth)) setSourceHealth(payload.sourceHealth);
      }
    );

    return () => {
      unsubSse();
      unsubSales();
      unsubValidation();
      unsubOpps();
      unsubSignalsSnap();
      unsubSignalsUpd();
    };
  }, [countryCode]);

  // Real operational metrics normalized into active country currency
  const realSalesEncaisse = useMemo(() => {
    return sales
      .filter((s) => s.status === 'encaisse')
      .reduce((acc, s) => acc + convertCurrency(s.amount, s.currency, activeCurrency, liveRates), 0);
  }, [sales, activeCurrency, liveRates]);

  const realSalesPending = useMemo(() => {
    return sales
      .filter((s) => s.status === 'en_attente')
      .reduce((acc, s) => acc + convertCurrency(s.amount, s.currency, activeCurrency, liveRates), 0);
  }, [sales, activeCurrency, liveRates]);

  const encaisseCount = useMemo(
    () => sales.filter((s) => s.status === 'encaisse').length,
    [sales]
  );

  const pendingValidations = useMemo(
    () => validationItems.filter((v) => v.status === 'en_attente'),
    [validationItems]
  );
  const validatedCount = useMemo(
    () => validationItems.filter((v) => v.status === 'valide').length,
    [validationItems]
  );

  const signalsForCountryCount = useMemo(() => {
    return signals.filter(
      (s) =>
        s.countryCode === countryCode ||
        s.isGlobal ||
        ((countryCode === 'NER' || countryCode === 'SEN' || countryCode === 'CIV') &&
          s.region === 'niger_uemoa') ||
        (countryCode === 'FRA' && s.region === 'europe')
    ).length;
  }, [signals, countryCode]);

  const healthCounts = useMemo(() => {
    const live = sourceHealth.filter((s) => s.status === 'live').length;
    const cache = sourceHealth.filter((s) => s.status === 'cache').length;
    const down = sourceHealth.filter((s) => s.status === 'indisponible').length;
    return { live, cache, down, total: sourceHealth.length };
  }, [sourceHealth]);

  // Pipeline calculations normalized into active currency
  const totalPipelineTargetMrr = useMemo(
    () =>
      pipelineItems.reduce(
        (acc, curr) =>
          acc + convertCurrency(curr.targetMrr, curr.currency || 'EUR', activeCurrency, liveRates),
        0
      ),
    [pipelineItems, activeCurrency, liveRates]
  );

  const totalPipelineCurrentMrr = useMemo(
    () =>
      pipelineItems.reduce(
        (acc, curr) =>
          acc + convertCurrency(curr.currentMrr, curr.currency || 'EUR', activeCurrency, liveRates),
        0
      ),
    [pipelineItems, activeCurrency, liveRates]
  );

  const pipelineAchievementRate =
    totalPipelineTargetMrr > 0
      ? Math.round((totalPipelineCurrentMrr / totalPipelineTargetMrr) * 100)
      : 0;

  const allChecklists = pipelineItems.flatMap((item) => item.checklists);
  const completedChecklistsCount = allChecklists.filter((c) => c.done).length;
  const checklistCompletionRate =
    allChecklists.length > 0
      ? Math.round((completedChecklistsCount / allChecklists.length) * 100)
      : 0;

  const stageLabels: Record<PipelineItem['stage'], string> = {
    discovery: '01. Découverte',
    validation: '02. Validation',
    building: '03. MVP & Setup',
    monetizing: '04. Monétisation',
  };

  const pipelineStagesChartData = useMemo(() => {
    const stageDataMap = {
      discovery: { stage: stageLabels.discovery, targetMrr: 0, currentMrr: 0, count: 0 },
      validation: { stage: stageLabels.validation, targetMrr: 0, currentMrr: 0, count: 0 },
      building: { stage: stageLabels.building, targetMrr: 0, currentMrr: 0, count: 0 },
      monetizing: { stage: stageLabels.monetizing, targetMrr: 0, currentMrr: 0, count: 0 },
    };

    pipelineItems.forEach((item) => {
      if (stageDataMap[item.stage]) {
        stageDataMap[item.stage].targetMrr += convertCurrency(
          item.targetMrr,
          item.currency || 'EUR',
          activeCurrency,
          liveRates
        );
        stageDataMap[item.stage].currentMrr += convertCurrency(
          item.currentMrr,
          item.currency || 'EUR',
          activeCurrency,
          liveRates
        );
        stageDataMap[item.stage].count += 1;
      }
    });

    return Object.values(stageDataMap);
  }, [pipelineItems, activeCurrency, liveRates]);

  // Simulator model figures (strictly labeled as non-certified model estimates)
  const simProjectedMrrLocal = convertCurrency(
    simulationResult.projectedMrr,
    'EUR',
    activeCurrency,
    liveRates
  );
  const simProjectedArrLocal = convertCurrency(
    simulationResult.projectedArr,
    'EUR',
    activeCurrency,
    liveRates
  );
  const simProjectedEbitdaLocal = convertCurrency(
    simulationResult.projectedEbitda,
    'EUR',
    activeCurrency,
    liveRates
  );
  const simLastCumulativeCashLocal = convertCurrency(
    simulationResult.monthlyTimeline[simulationResult.monthlyTimeline.length - 1]
      ?.cumulativeCash || 0,
    'EUR',
    activeCurrency,
    liveRates
  );

  const timelineChartData = useMemo(
    () =>
      simulationResult.monthlyTimeline.map((item) => ({
        monthName: `M${item.month}`,
        month: item.month,
        revenue: convertCurrency(item.revenue, 'EUR', activeCurrency, liveRates),
        costs: convertCurrency(item.costs, 'EUR', activeCurrency, liveRates),
        netProfit: convertCurrency(item.netProfit, 'EUR', activeCurrency, liveRates),
        cumulativeCash: convertCurrency(item.cumulativeCash, 'EUR', activeCurrency, liveRates),
      })),
    [simulationResult.monthlyTimeline, activeCurrency, liveRates]
  );

  const sectorPieColors = [
    '#1D4ED8',
    '#047857',
    '#0F766E',
    '#B45309',
    '#BE185D',
    '#6D28D9',
  ];

  const sectorChartData = useMemo(
    () =>
      simulationResult.sectorBreakdown.map((sec, idx) => ({
        name: sec.name.length > 22 ? sec.name.slice(0, 20) + '...' : sec.name,
        fullName: sec.name,
        value: convertCurrency(sec.monthlyRevenue, 'EUR', activeCurrency, liveRates),
        sharePercent: sec.sharePercent,
        color: sectorPieColors[idx % sectorPieColors.length],
      })),
    [simulationResult.sectorBreakdown, activeCurrency, liveRates]
  );

  const formatAxisTick = (val: number) => {
    if (activeCurrency === 'XOF') {
      if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
      return `${Math.round(val / 1000)}k`;
    }
    return `${Math.round(val / 1000)}k${currencySymbol}`;
  };

  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.12] rounded-xl shadow-lg p-3 text-xs space-y-1.5 font-sans">
          <div className="font-semibold text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-white/[0.08] pb-1">
            {label} · Modèle indicatif
          </div>
          <div className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            Revenu Brut : {formatCurrencyAmount(payload[0]?.value || 0, activeCurrency)}
          </div>
          <div className="font-mono text-rose-700 dark:text-rose-400 tabular-nums">
            Coûts Opérationnels : {formatCurrencyAmount(payload[1]?.value || 0, activeCurrency)}
          </div>
          {payload[2] && (
            <div className="font-mono text-blue-700 dark:text-blue-400 tabular-nums pt-1 border-t border-stone-200 dark:border-white/[0.08]">
              Trésorerie Cumulée : {formatCurrencyAmount(payload[2]?.value || 0, activeCurrency)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const fxStatusLabel =
    fxInfo.status === 'live'
      ? 'FX live'
      : fxInfo.status === 'cache'
      ? 'FX cache'
      : 'FX secours';

  const sseLabel =
    sseStatus === 'live'
      ? 'Flux temps réel actif'
      : sseStatus === 'connecting'
      ? 'Connexion au flux…'
      : sseStatus === 'error'
      ? 'Reconnexion flux…'
      : 'Flux en veille';

  const recentSales = sales.slice(0, 4);
  const topPendingValidations = pendingValidations.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Editorial Header + Live Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-semibold text-blue-700 dark:text-blue-400">Synthèse Opérationnelle</span>
            <span className="text-stone-400 dark:text-stone-600" aria-hidden="true">
              /
            </span>
            <span className="text-stone-700 dark:text-stone-300 font-medium">{currentProfile.countryName}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] font-mono text-[11px] text-stone-700 dark:text-stone-200 tabular-nums shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
              {liveRates
                ? `1 EUR = ${Math.round(liveRates.XOF).toLocaleString('fr-FR')} FCFA · ${liveRates.USD.toFixed(3)} USD`
                : `1 EUR = ${fxInfo.rate.toLocaleString('fr-FR')} ${currencySymbol}`}
              <span className="text-stone-500 dark:text-stone-400 ml-1.5">({fxStatusLabel})</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] text-[11px] text-stone-700 dark:text-stone-200 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
              <Radio
                className={`w-3 h-3 ${
                  sseStatus === 'live'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : sseStatus === 'error'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-stone-400 dark:text-stone-500'
                }`}
              />
              <span>{sseLabel}</span>
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Données Réelles, Pipeline & Projections
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Séparation stricte entre vos encaissements certifiés, files de validation, signaux collectés et les projections indicatives du simulateur converties en {activeCurrency}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => void fetchDashboardData()}
            disabled={loadingOps}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-[0_1px_2px_rgba(28,25,23,0.03)] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 dark:text-stone-400 ${loadingOps ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => onNavigateTab('sales')}
            className="cursor-pointer px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-100 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Journal des Ventes</span>
          </button>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Gérer le Pipeline</span>
          </button>
        </div>
      </div>

      {/* Explicit API Error Banner */}
      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => void fetchDashboardData()}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-medium shrink-0 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Section 1: Real Operations & Control Ledger (Certified Data) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h2 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
              Opérations Réelles & Contrôle (Données Certifiées)
            </h2>
          </div>
          <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
            Devise active : {activeCurrency} ({currencySymbol})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07] bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
          {/* KPI 1: Encaissé Réel */}
          <div className="p-5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-medium">Encaissé Réel</span>
                <span className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {encaisseCount} vente{encaisseCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-2xl font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {formatCurrencyAmount(realSalesEncaisse, activeCurrency)}
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                En attente d'encaissement :{' '}
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  {formatCurrencyAmount(realSalesPending, activeCurrency)}
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 pt-1 w-fit"
            >
              <span>Enregistrer / voir les ventes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* KPI 2: File À Valider */}
          <div className="p-5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-medium">File « À Valider »</span>
                <span className="font-mono text-[11px] font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                  {validatedCount} validée{validatedCount > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-2xl font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {pendingValidations.length}
                <span className="text-xs text-stone-500 dark:text-stone-400 font-normal ml-1.5">
                  en attente
                </span>
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Messages, offres et étapes terrain soumis à contrôle humain.
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('validation')}
              className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 pt-1 w-fit"
            >
              <span>Traiter la file</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* KPI 3: Opportunités & Signaux Actifs */}
          <div className="p-5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-medium">Opportunités ({countryCode})</span>
                <span className="font-mono text-[11px] font-medium text-teal-700 dark:text-teal-400 tabular-nums">
                  {signalsForCountryCount} signaux
                </span>
              </div>
              <div className="text-2xl font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {opportunities.length}
                <span className="text-xs text-stone-500 dark:text-stone-400 font-normal ml-1.5">
                  synthétisée{opportunities.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                Sources :{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{healthCounts.live} live</span> ·{' '}
                <span className="text-amber-700 dark:text-amber-400 font-medium">{healthCounts.cache} cache</span> ·{' '}
                <span className="text-rose-700 dark:text-rose-400 font-medium">{healthCounts.down} HS</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => onNavigateTab('opportunities')}
                className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <span>Opportunités</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onNavigateTab('radar')}
                className="cursor-pointer text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
              >
                <span>Radar RSS</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* KPI 4: Pipeline Actif */}
          <div className="p-5 space-y-2.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-medium">Pipeline Actif (MRR)</span>
                <span className="font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {pipelineAchievementRate}% cible
                </span>
              </div>
              <div className="text-2xl font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {formatCurrencyAmount(totalPipelineCurrentMrr, activeCurrency)}
                <span className="text-xs text-stone-500 dark:text-stone-400 font-normal"> / mois</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-white/[0.1] h-1.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, pipelineAchievementRate)}%` }}
                  className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300 rounded-full"
                />
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                Cible : {formatCurrencyAmount(totalPipelineTargetMrr, activeCurrency)} ·{' '}
                {completedChecklistsCount}/{allChecklists.length} jalons ({checklistCompletionRate}%)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Recent Real Activity & Pipeline */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Derniers Encaissements & Actions À Valider */}
        <div className="lg:col-span-6 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Activité Terrain Récente
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Derniers encaissements saisis et éléments en attente de validation
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <span>Ventes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Encaissements */}
            <div className="bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">Derniers encaissements</span>
                <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                  {sales.length} total
                </span>
              </div>
              {recentSales.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Aucune vente enregistrée pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-stone-200/80 dark:divide-white/[0.07]">
                  {recentSales.map((sale) => {
                    const converted = convertCurrency(
                      sale.amount,
                      sale.currency,
                      activeCurrency,
                      liveRates
                    );
                    return (
                      <div key={sale.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-stone-900 dark:text-stone-100 truncate">{sale.clientName}</span>
                          <span
                            className={`font-mono text-[11px] font-medium shrink-0 ${
                              sale.status === 'encaisse'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : sale.status === 'en_attente'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {sale.status === 'encaisse'
                              ? 'Encaissé'
                              : sale.status === 'en_attente'
                              ? 'En attente'
                              : 'Annulé'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                          <span className="truncate">{sale.opportunityTitle}</span>
                          <span className="font-mono text-stone-900 dark:text-stone-100 font-medium tabular-nums shrink-0">
                            {formatCurrencyAmount(converted, activeCurrency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* File À Valider */}
            <div className="bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800 dark:text-stone-200">En attente de validation</span>
                <button
                  onClick={() => onNavigateTab('validation')}
                  className="cursor-pointer font-mono text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 tabular-nums"
                >
                  {pendingValidations.length} à traiter
                </button>
              </div>
              {topPendingValidations.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Aucun élément en attente dans la file.
                </div>
              ) : (
                <div className="divide-y divide-stone-200/80 dark:divide-white/[0.07]">
                  {topPendingValidations.map((item) => (
                    <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-xs">
                      <div className="font-medium text-stone-900 dark:text-stone-100 truncate">{item.title}</div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-stone-600 dark:text-stone-400">
                        <span className="truncate">{item.sourceOpportunityTitle}</span>
                        <span className="font-mono font-medium text-amber-700 dark:text-amber-400 shrink-0">
                          {item.countryCode}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Projects Summary */}
          <div className="pt-3 border-t border-stone-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Projets en cours ({pipelineItems.length})
              </h3>
              <button
                onClick={() => onNavigateTab('pipeline')}
                className="cursor-pointer text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <span>Tout voir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-stone-200/80 dark:divide-white/[0.07] max-h-48 overflow-y-auto">
              {pipelineItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
                  Aucun projet suivi dans votre pipeline.
                </div>
              ) : (
                pipelineItems.map((item) => {
                  const itemDoneCount = item.checklists.filter((c) => c.done).length;
                  const targetLocal = convertCurrency(
                    item.targetMrr,
                    item.currency || 'EUR',
                    activeCurrency,
                    liveRates
                  );
                  return (
                    <div
                      key={item.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="truncate">{item.sectorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-stone-700 dark:text-stone-300 shrink-0">
                            {stageLabels[item.stage]}
                          </span>
                        </div>
                        <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate">{item.title}</h4>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
                          {itemDoneCount}/{item.checklists.length} jalons complétés
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                          {formatCurrencyAmount(targetLocal, activeCurrency)} / mois
                        </div>
                        <button
                          onClick={() => onOpenBlueprintForSector(item.sectorId, item.title)}
                          className="cursor-pointer text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
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

        {/* Right: Valorisation du Pipeline */}
        <div className="lg:col-span-6 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Valorisation du Pipeline ({activeCurrency})
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Comparatif MRR cible vs encaissé par étape (converti au taux {fxStatusLabel})
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-xs inline-block" />
                Cible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs inline-block" />
                Encaissé
              </span>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineStagesChartData}
                margin={{ top: 10, right: 10, left: -4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="stage"
                  stroke={chartAxisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: chartGridStroke }}
                />
                <YAxis
                  stroke={chartAxisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: chartGridStroke }}
                  tickFormatter={formatAxisTick}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.12] rounded-xl shadow-lg p-3 text-xs font-mono space-y-1">
                          <div className="text-stone-900 dark:text-stone-100 font-semibold font-sans">{label}</div>
                          <div className="text-blue-700 dark:text-blue-400 tabular-nums">
                            Cible : {formatCurrencyAmount(Number(payload[0]?.value || 0), activeCurrency)} / mois
                          </div>
                          <div className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                            Encaissé : {formatCurrencyAmount(Number(payload[1]?.value || 0), activeCurrency)} / mois
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="targetMrr" fill={isDark ? '#3B82F6' : '#1D4ED8'} radius={[4, 4, 0, 0]} name="Cible MRR" />
                <Bar dataKey="currentMrr" fill={isDark ? '#10B981' : '#047857'} radius={[4, 4, 0, 0]} name="Encaissé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Section 3: Simulator Projections (Strictly Marked Indicative / Non-Real) */}
      <section className="space-y-4">
        <div className="bg-amber-50/90 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-500/30 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
              <TrendingUp className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Modèle de Simulation Indicatif — Non réel (non issu des ventes certifiées)</span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/80">
              Estimation mathématique basée sur vos hypothèses de capital, temps et secteurs, convertie en {activeCurrency} (1 EUR = {fxInfo.rate.toLocaleString('fr-FR')} {currencySymbol}).
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-white dark:bg-[#141720] hover:bg-amber-100/70 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 w-fit"
          >
            <span>Ajuster les hypothèses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicative Simulator Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07] bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
          <div className="p-4 space-y-1">
            <div className="text-xs text-stone-600 dark:text-stone-400">MRR Projeté (Estimation indicative)</div>
            <div className="text-lg font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              {formatCurrencyAmount(simProjectedMrrLocal, activeCurrency)}
              <span className="text-xs text-stone-500 dark:text-stone-400 font-normal"> / mois</span>
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-stone-600 dark:text-stone-400">ARR Projeté (Estimation indicative)</div>
            <div className="text-lg font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              {formatCurrencyAmount(simProjectedArrLocal, activeCurrency)}
              <span className="text-xs text-stone-500 dark:text-stone-400 font-normal"> / an</span>
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-stone-600 dark:text-stone-400">EBITDA Estimé (Modèle)</div>
            <div className="text-lg font-semibold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatCurrencyAmount(simProjectedEbitdaLocal, activeCurrency)}
            </div>
          </div>
          <div className="p-4 space-y-1">
            <div className="text-xs text-stone-600 dark:text-stone-400">Point Mort & Trésorerie Finale</div>
            <div className="text-lg font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              Mois {simulationResult.breakEvenMonth}{' '}
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                (+{simulationResult.roiPercentage}%)
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono tabular-nums">
              Fin d'horizon : {formatCurrencyAmount(simLastCumulativeCashLocal, activeCurrency)}
            </div>
          </div>
        </div>

        {/* Simulator Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] p-6 flex flex-col justify-between space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Trajectoire Financière ({activeCurrency} — Estimation indicative)
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Évolution simulée des revenus bruts, coûts et trésorerie cumulée
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-700 dark:bg-blue-500 rounded-xs inline-block" />
                  Revenus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-600 dark:bg-rose-500 rounded-xs inline-block" />
                  Coûts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-700 dark:bg-emerald-500 rounded-xs inline-block" />
                  Trésorerie
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineChartData}
                  margin={{ top: 10, right: 10, left: -4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridStroke}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="monthName"
                    stroke={chartAxisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: chartGridStroke }}
                  />
                  <YAxis
                    stroke={chartAxisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: chartGridStroke }}
                    tickFormatter={formatAxisTick}
                  />
                  <Tooltip content={<CustomTimelineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={isDark ? '#3B82F6' : '#1D4ED8'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenus"
                  />
                  <Area
                    type="monotone"
                    dataKey="costs"
                    stroke={isDark ? '#F43F5E' : '#BE123C'}
                    strokeWidth={1.75}
                    fillOpacity={1}
                    fill="url(#colorCosts)"
                    name="Coûts"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCash"
                    stroke={isDark ? '#10B981' : '#047857'}
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
          <div className="lg:col-span-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
                Répartition Sectorielle (Modèle)
              </h3>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums">
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
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={pieStrokeColor}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.12] rounded-xl shadow-lg p-3 text-xs font-mono">
                            <div className="text-stone-900 dark:text-stone-100 font-semibold font-sans">{data.fullName}</div>
                            <div className="text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                              {formatCurrencyAmount(data.value, activeCurrency)} / mois
                            </div>
                            <div className="text-stone-500 dark:text-stone-400 tabular-nums">
                              Part : {data.sharePercent}% (indicatif)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute text-center pointer-events-none px-4">
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block">MRR indicatif</span>
                <span className="text-xs font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                  {formatCurrencyAmount(simProjectedMrrLocal, activeCurrency)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-stone-200/80 dark:border-white/[0.08]">
              {sectorChartData.map((sec, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: sec.color }}
                    />
                    <span className="text-stone-700 dark:text-stone-300 truncate" title={sec.fullName}>
                      {sec.fullName}
                    </span>
                  </div>
                  <div className="font-mono text-right shrink-0 tabular-nums">
                    <span className="text-stone-900 dark:text-stone-100 font-medium">
                      {formatCurrencyAmount(sec.value, activeCurrency)}
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 ml-1.5">{sec.sharePercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
