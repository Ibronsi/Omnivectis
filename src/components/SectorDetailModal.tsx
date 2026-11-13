import React from 'react';
import { X, CheckCircle, ArrowRight, Sparkles, TrendingUp, DollarSign, Clock, ShieldAlert, Plus, Rocket } from 'lucide-react';
import { EconomicSector, OpportunityNiche } from '../types/market';

interface SectorDetailModalProps {
  sector: EconomicSector | null;
  selectedNiche: OpportunityNiche | null;
  onClose: () => void;
  onSelectForBlueprint: (sector: EconomicSector, niche: OpportunityNiche) => void;
  onAddToPipeline: (sector: EconomicSector, niche: OpportunityNiche) => void;
  onLaunchCircuit?: (sector: EconomicSector, niche: OpportunityNiche) => void;
}

export const SectorDetailModal: React.FC<SectorDetailModalProps> = ({
  sector,
  selectedNiche,
  onClose,
  onSelectForBlueprint,
  onAddToPipeline,
  onLaunchCircuit,
}) => {
  if (!sector) return null;

  const currentNiche = selectedNiche || sector.niches[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#090B10]/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#11141C] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-[#0D1017]">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-mono tabular-nums">
              <span>{sector.categoryName}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>TAM : {sector.globalTam}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium">{sector.growthRate}</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-white tracking-tight">
              {sector.name}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {sector.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Niche selector tabs if multiple */}
          {sector.niches.length > 1 && (
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">
                Niches à haute rentabilité analysées
              </div>
              <div className="flex flex-wrap gap-2">
                {sector.niches.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => {
                      // Handled by parent or state
                    }}
                    className={`cursor-pointer px-3.5 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      niche.id === currentNiche.id
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/40'
                        : 'bg-[#0D1017] text-slate-300 hover:border-white/[0.16] border border-white/[0.08]'
                    }`}
                  >
                    <div className="font-semibold">{niche.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                      Marge : {niche.grossMargin}% · Ticket : {niche.typicalTicket.split('/')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Niche Section */}
          <div className="p-5 bg-[#0D1017] border border-white/[0.08] rounded-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-blue-400">
                  Niche d arbitrage cible
                </span>
                <h3 className="font-display text-lg font-semibold text-white mt-0.5">
                  {currentNiche.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {currentNiche.tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => onAddToPipeline(sector, currentNiche)}
                  className="cursor-pointer px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Suivre Pipeline</span>
                </button>
                {onLaunchCircuit && (
                  <button
                    onClick={() => onLaunchCircuit(sector, currentNiche)}
                    className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Lancer Circuit Monétisation</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectForBlueprint(sector, currentNiche)}
                  className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plan Stratégique IA</span>
                </button>
              </div>
            </div>

            {/* Unified Metrics Ledger Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#11141C] border border-white/[0.08] rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
              <div className="p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Marge brute</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums mt-1">
                  {currentNiche.grossMargin}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                  Marge nette : {currentNiche.netMargin}%
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ticket Moyen</span>
                </div>
                <div className="text-sm font-bold font-mono text-white tabular-nums mt-1">
                  {currentNiche.typicalTicket}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                  {currentNiche.recurringRevenueShare}% MRR récurrent
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Premier Cash</span>
                </div>
                <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums mt-1">
                  {currentNiche.timeToFirstRevenue}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Capital départ : {currentNiche.capitalRequired}
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Moat Défensif</span>
                </div>
                <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-2">
                  {currentNiche.barrierToEntry}
                </div>
              </div>
            </div>

            {/* Acquisition & Revenue model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/[0.07]">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400 block">
                  Canal d acquisition client le plus rapide
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentNiche.fastestAcquisitionChannel}
                </p>
                <div className="pt-1 text-[11px] text-blue-300 font-medium">
                  Modèle tarifaire : {currentNiche.pricingModel}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-400 block">
                  Stack technologique & opérationnelle
                </span>
                <div className="text-xs text-slate-200 font-mono">
                  {currentNiche.techStackKey.join(' · ')}
                </div>
                <div className="text-[11px] text-slate-400">
                  Risque principal : {currentNiche.riskFactor}
                </div>
              </div>
            </div>

            {/* 4-Step Execution Blueprint */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.07]">
              <span className="text-xs font-medium text-slate-300 block">
                Plan d exécution pragmatique en 4 étapes
              </span>
              <div className="divide-y divide-white/[0.06] border border-white/[0.07] rounded-lg bg-[#11141C]">
                {currentNiche.executionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 text-xs text-slate-200"
                  >
                    <span className="font-mono text-blue-400 font-semibold shrink-0 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Macro tailwinds */}
          <div className="pt-2 space-y-2.5">
            <span className="text-xs font-medium text-slate-400 block">
              Moteurs macro-économiques favorables
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sector.macroTailwinds.map((tailwind, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{tailwind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0D1017] flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Potentiel d arbitrage : <span className="text-slate-200">{sector.arbitragePotential}</span>
          </div>
          <button
            onClick={() => onSelectForBlueprint(sector, currentNiche)}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>Lancer la stratégie IA pour cette opportunité</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
