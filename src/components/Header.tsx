import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Sliders,
  BookmarkCheck,
  LayoutDashboard,
  Rocket,
  Globe,
  Radio,
  FileText,
  ShieldCheck,
  DollarSign,
  Activity,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { CountryCode, UsageCounterStats } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';
import { UsageInspectorModal } from './UsageInspectorModal';

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

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAction: () => void;
  savedCount: number;
  countryCode: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  isProtected?: boolean;
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onQuickAction,
  savedCount,
  countryCode,
  onCountryChange,
  isProtected,
  onLock,
}) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const [usageStats, setUsageStats] = useState<UsageCounterStats | null>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => res.json())
      .then((data) => {
        if (data?.stats) setUsageStats(data.stats);
      })
      .catch(() => {});
  }, [activeTab]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-sm tracking-wider">OV</span>
            </div>
            <button
              onClick={() => onTabChange('radar')}
              className="text-left cursor-pointer group"
            >
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors whitespace-nowrap">
                OmniVectis
              </span>
              <span className="block text-[11px] text-slate-400 tracking-normal -mt-0.5 whitespace-nowrap">
                Usage Personnel · Provenance Stricte
              </span>
            </button>
          </div>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-300">
            <button
              onClick={() => onTabChange('radar')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'text-white border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Radar & Signaux</span>
            </button>

            <button
              onClick={() => onTabChange('opportunities')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'opportunities'
                  ? 'text-white border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Opportunités</span>
            </button>

            <button
              onClick={() => onTabChange('kits')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'kits'
                  ? 'text-white border-b-2 border-cyan-400 font-semibold text-cyan-300'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dossiers & Plans</span>
            </button>

            <button
              onClick={() => onTabChange('validation')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'validation'
                  ? 'text-white border-b-2 border-emerald-400 font-semibold text-emerald-300'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>À Valider & Journal</span>
            </button>

            <button
              onClick={() => onTabChange('sales')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'sales'
                  ? 'text-white border-b-2 border-emerald-400 font-semibold text-emerald-300'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encaissements Réels</span>
            </button>

            <button
              onClick={() => onTabChange('simulator')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'simulator'
                  ? 'text-white border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulateur</span>
            </button>

            <button
              onClick={() => onTabChange('dashboard')}
              className={`cursor-pointer pb-0.5 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'text-white border-b-2 border-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Synthèse</span>
            </button>
          </nav>

          {/* Zone 3: Country/Currency Selector + Usage Counter + 1 Primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Country Selector */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <select
                value={countryCode}
                onChange={(e) => onCountryChange(e.target.value as CountryCode)}
                aria-label="Sélectionner le pays et la devise"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="NER" className="bg-slate-900 text-white">🇳🇪 Niger (FCFA)</option>
                <option value="SEN" className="bg-slate-900 text-white">🇸🇳 Sénégal (FCFA)</option>
                <option value="CIV" className="bg-slate-900 text-white">🇨🇮 Côte d Ivoire (FCFA)</option>
                <option value="FRA" className="bg-slate-900 text-white">🇫🇷 France (EUR €)</option>
                <option value="USA" className="bg-slate-900 text-white">🌐 Global (USD $)</option>
              </select>
            </div>

            {/* Usage Counter Badge (Requirement 7: Sans quota, compteur visible, erreurs transparentes) */}
            <button
              onClick={() => setIsUsageModalOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
              title="Afficher le compteur d'utilisation et le diagnostic de l'API Gemini"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-white text-[11px] font-bold">
                {usageStats?.totalGeminiCalls || 0}
              </span>
              <span className="text-[10px] text-slate-400 hidden md:inline">appels IA</span>
              {usageStats?.lastGeminiError && (
                <span className="w-2 h-2 rounded-full bg-rose-500" title="Dernière erreur enregistrée" />
              )}
            </button>

            {/* Lock Terminal Button (if APP_PASSWORD is configured) */}
            {isProtected && onLock && (
              <button
                onClick={onLock}
                className="cursor-pointer p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Verrouiller la session (Mot de passe APP_PASSWORD requis)"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={onQuickAction}
              className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Saisir une Vente</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet scrollable nav */}
        <div className="xl:hidden flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800/80 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => onTabChange('radar')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'radar' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Radar & Signaux
          </button>
          <button
            onClick={() => onTabChange('opportunities')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'opportunities' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Opportunités
          </button>
          <button
            onClick={() => onTabChange('kits')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'kits' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Dossiers & Plans
          </button>
          <button
            onClick={() => onTabChange('validation')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'validation' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            À Valider
          </button>
          <button
            onClick={() => onTabChange('sales')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'sales' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Encaissements
          </button>
          <button
            onClick={() => onTabChange('simulator')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'simulator' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Simulateur
          </button>
          <button
            onClick={() => onTabChange('pipeline')}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === 'pipeline' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
            }`}
          >
            Pipeline ({savedCount})
          </button>
        </div>
      </header>

      {/* Usage & Gemini Diagnostics Inspector Modal */}
      <UsageInspectorModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </>
  );
};
