import React from 'react';
import { Sparkles, Layers, Sliders, ArrowLeftRight, BookmarkCheck, LayoutDashboard, Rocket } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'radar' | 'simulator' | 'blueprint' | 'launchpad' | 'arbitrage' | 'pipeline';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAction: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onQuickAction,
  savedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-sm tracking-wider">OV</span>
          </div>
          <button
            onClick={() => onTabChange('dashboard')}
            className="text-left cursor-pointer group"
          >
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap">
              OmniVectis
            </span>
            <span className="block text-[11px] text-slate-400 tracking-normal -mt-0.5 whitespace-nowrap">
              Market Arbitrage & Revenue Engine
            </span>
          </button>
        </div>

        {/* Zone 2: 5 Clean single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('radar')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Radar Marchés</span>
          </button>

          <button
            onClick={() => onTabChange('simulator')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Simulateur</span>
          </button>

          <button
            onClick={() => onTabChange('launchpad')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'launchpad'
                ? 'text-white border-b-2 border-emerald-400 font-semibold text-emerald-300'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Rocket className="w-4 h-4 text-emerald-400" />
            <span>Circuit Monétisation</span>
          </button>

          <button
            onClick={() => onTabChange('blueprint')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'blueprint'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Stratège IA</span>
          </button>

          <button
            onClick={() => onTabChange('pipeline')}
            className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Pipeline</span>
            {savedCount > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickAction}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-2"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Lancer un Circuit d Encaissement</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar fallback */}
      <div className="lg:hidden flex items-center justify-between gap-1 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('radar')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'radar' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Radar
        </button>
        <button
          onClick={() => onTabChange('simulator')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'simulator' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Simulateur
        </button>
        <button
          onClick={() => onTabChange('launchpad')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'launchpad' ? 'bg-emerald-700 text-white font-semibold' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          Monétisation
        </button>
        <button
          onClick={() => onTabChange('blueprint')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'blueprint' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Stratège IA
        </button>
        <button
          onClick={() => onTabChange('arbitrage')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'arbitrage' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Arbitrage
        </button>
        <button
          onClick={() => onTabChange('pipeline')}
          className={`px-2.5 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'pipeline' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
          }`}
        >
          Pipeline ({savedCount})
        </button>
      </div>
    </header>
  );
};
