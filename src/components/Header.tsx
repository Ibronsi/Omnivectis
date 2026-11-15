import React from 'react';
import { DollarSign, Lock, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { CountryCode } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';
import { useTheme } from '../hooks/useTheme';

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
  userEmail?: string | null;
  onSignOut?: () => void;
  onOpenMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onQuickAction,
  countryCode,
  isProtected,
  onLock,
  userEmail,
  onSignOut,
  onOpenMobileNav,
}) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-14 w-full border-b border-stone-200/80 dark:border-white/[0.08] bg-[#F8F7F4]/90 dark:bg-[#0B0D13]/90 backdrop-blur-md px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4 transition-colors duration-150">
      {/* Left: Mobile Menu Trigger + Contextual Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden cursor-pointer p-2 -ml-1 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-white/[0.08] transition-colors shrink-0"
            aria-label="Ouvrir la navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-[13.5px] min-w-0 truncate">
          <span className="text-stone-500 dark:text-stone-400 font-medium hidden sm:inline whitespace-nowrap">
            OmniVectis
          </span>
          <span className="text-stone-300 dark:text-stone-600 hidden sm:inline" aria-hidden="true">/</span>
          <span className="text-stone-900 dark:text-stone-100 font-semibold truncate">
            {TAB_LABELS[activeTab]}
          </span>
          <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">·</span>
          <span className="text-stone-500 dark:text-stone-400 font-mono text-xs whitespace-nowrap shrink-0">
            {currentProfile.countryName} ({currentProfile.currency})
          </span>
        </div>
      </div>

      {/* Right: Theme Switcher + Account & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Segmented Light / Dark Theme Switcher */}
        <div
          className="inline-flex items-center p-0.5 rounded-xl bg-[#EFECE6] dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.1] shrink-0"
          role="group"
          aria-label="Sélection du thème"
        >
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11.5px] font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              theme === 'light'
                ? 'bg-white text-stone-900 shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            title="Activer le thème clair"
            aria-pressed={theme === 'light'}
          >
            <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-700' : ''}`} />
            <span className="hidden sm:inline">Clair</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11.5px] font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
              theme === 'dark'
                ? 'bg-white/[0.12] text-stone-100 shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            title="Activer le thème sombre"
            aria-pressed={theme === 'dark'}
          >
            <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sombre</span>
          </button>
        </div>

        {userEmail && (
          <span
            className="hidden md:inline-block max-w-[170px] truncate text-xs font-medium text-stone-600 dark:text-stone-400"
            title={userEmail}
          >
            {userEmail}
          </span>
        )}

        {isProtected && onLock && (
          <button
            onClick={onLock}
            className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-[#141720] hover:bg-stone-100 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
            title="Verrouiller la session"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline">Verrouiller</span>
          </button>
        )}

        {userEmail && onSignOut && (
          <button
            onClick={onSignOut}
            className="cursor-pointer px-3 py-1.5 rounded-xl bg-white dark:bg-[#141720] hover:bg-stone-100 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
            title="Se déconnecter du compte Google"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        )}

        <button
          onClick={onQuickAction}
          className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(4,120,87,0.2)]"
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Saisir une Vente</span>
        </button>
      </div>
    </header>
  );
};
