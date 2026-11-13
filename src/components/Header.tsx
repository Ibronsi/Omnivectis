import React from 'react';
import { DollarSign, Lock, Menu } from 'lucide-react';
import { CountryCode } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';

export type ActiveTab =
  | 'dashboard'
  | 'radar'
  | 'opportunities'
  | 'kits'
  | 'validation'
  | 'sales'
  | 'simulator'
  | 'pipeline'
  | 'launchpad'
  | 'blueprint'
  | 'arbitrage';

const TAB_LABELS: Record<ActiveTab, string> = {
  dashboard: 'Synthèse Exécutive',
  radar: 'Radar & Signaux',
  opportunities: 'Opportunités',
  kits: 'Dossiers & Plans',
  validation: 'À Valider & Journal',
  sales: 'Encaissements Réels',
  simulator: 'Simulateur',
  pipeline: 'Pipeline',
  launchpad: 'Circuit de Lancement',
  blueprint: 'Plan Stratégique',
  arbitrage: 'Matrice d Arbitrage',
};

interface HeaderProps {
  activeTab: ActiveTab;
  onQuickAction: () => void;
  countryCode: CountryCode;
  isProtected?: boolean;
  onLock?: () => void;
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onQuickAction,
  countryCode,
  isProtected,
  onLock,
  onOpenMobileNav,
}) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;

  return (
    <header className="sticky top-0 z-30 h-14 w-full border-b border-white/[0.08] bg-[#090B10]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Trigger + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden cursor-pointer p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
            aria-label="Ouvrir la navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-[13px] min-w-0 truncate">
          <span className="text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
            OmniVectis
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-slate-100 font-semibold truncate">
            {TAB_LABELS[activeTab]}
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400 font-mono text-xs whitespace-nowrap shrink-0">
            {currentProfile.countryName} ({currentProfile.currency})
          </span>
        </div>
      </div>

      {/* Right: 1-2 Clean Single-Line Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isProtected && onLock && (
          <button
            onClick={onLock}
            className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#11141C] hover:bg-[#171C28] border border-white/[0.09] text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Verrouiller la session"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Verrouiller</span>
          </button>
        )}

        <button
          onClick={onQuickAction}
          className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Saisir une Vente</span>
        </button>
      </div>
    </header>
  );
};
