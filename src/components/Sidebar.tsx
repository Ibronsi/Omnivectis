import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  FileText,
  ShieldCheck,
  DollarSign,
  Sliders,
  LayoutDashboard,
  BookmarkCheck,
  Globe,
  Activity,
  X,
  Compass,
  ArrowLeftRight,
  Rocket,
} from 'lucide-react';
import { CountryCode, UsageCounterStats, ValidationItem } from '../types/market';
import { ActiveTab } from './Header';
import { UsageInspectorModal } from './UsageInspectorModal';
import { subscribeLiveEvent } from '../utils/liveStream';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  savedCount: number;
  countryCode: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  label: string;
  items: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    trailing?: string | number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  savedCount,
  countryCode,
  onCountryChange,
  mobileOpen,
  onCloseMobile,
}) => {
  const [usageStats, setUsageStats] = useState<UsageCounterStats | null>(null);
  const [pendingValidationCount, setPendingValidationCount] = useState<number>(0);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.stats) setUsageStats(data.stats);
      })
      .catch(() => {});

    fetch('/api/validation')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.items)) {
          setPendingValidationCount(
            data.items.filter((i: ValidationItem) => i.status === 'en_attente').length
          );
        }
      })
      .catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    const unsubUsage = subscribeLiveEvent<{ stats?: UsageCounterStats }>('usage_updated', (payload) => {
      if (payload?.stats) setUsageStats(payload.stats);
    });
    const unsubVal = subscribeLiveEvent<{ items?: ValidationItem[] }>('validation_updated', (payload) => {
      if (Array.isArray(payload?.items)) {
        setPendingValidationCount(
          payload.items.filter((i) => i.status === 'en_attente').length
        );
      }
    });
    return () => {
      unsubUsage();
      unsubVal();
    };
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: 'Intelligence & Marchés',
      items: [
        {
          id: 'dashboard',
          label: 'Synthèse',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'radar',
          label: 'Radar & Signaux',
          icon: <Radio className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'opportunities',
          label: 'Opportunités',
          icon: <Sparkles className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'kits',
          label: 'Dossiers & Plans',
          icon: <FileText className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      label: 'Stratégie & Lancement',
      items: [
        {
          id: 'blueprint',
          label: 'Plan Stratégique',
          icon: <Compass className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'arbitrage',
          label: 'Matrice d’Arbitrage',
          icon: <ArrowLeftRight className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'launchpad',
          label: 'Circuit de Lancement',
          icon: <Rocket className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      label: 'Exécution & Contrôle',
      items: [
        {
          id: 'validation',
          label: 'À Valider & Journal',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
          trailing: pendingValidationCount > 0 ? pendingValidationCount : undefined,
        },
        {
          id: 'sales',
          label: 'Encaissements Réels',
          icon: <DollarSign className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'simulator',
          label: 'Simulateur',
          icon: <Sliders className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'pipeline',
          label: 'Pipeline',
          icon: <BookmarkCheck className="w-4 h-4 shrink-0" />,
          trailing: savedCount,
        },
      ],
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#F2EFE9] dark:bg-[#11141C] border-r border-stone-200/90 dark:border-white/[0.08] w-64 select-none transition-colors duration-150">
      {/* Brand Lockup */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-stone-200/80 dark:border-white/[0.08] shrink-0">
        <button
          onClick={() => handleSelect('dashboard')}
          className="cursor-pointer flex items-center gap-2.5 text-left group"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-amber-700 dark:text-amber-400"
          >
            <rect
              x="2"
              y="2"
              width="20"
              height="20"
              rx="6"
              className="fill-white dark:fill-[#161A24]"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M7.5 15.5L11 9.5L13.5 13L16.5 8.5"
              className="stroke-emerald-700 dark:stroke-emerald-400"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors whitespace-nowrap">
            OmniVectis
          </span>
        </button>

        <button
          onClick={onCloseMobile}
          className="lg:hidden cursor-pointer p-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-white/[0.08] transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label="Navigation principale">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-wide">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full cursor-pointer flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-150 ${
                      isActive
                        ? 'bg-white dark:bg-white/[0.09] text-stone-900 dark:text-stone-100 font-semibold border border-stone-200/80 dark:border-white/[0.12] shadow-[0_1px_2px_rgba(28,25,23,0.05)]'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-white/[0.05] font-medium border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'}>
                        {item.icon}
                      </span>
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </span>
                    {typeof item.trailing === 'number' && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isActive ? 'text-amber-800 dark:text-amber-300 font-semibold' : 'text-stone-500 dark:text-stone-500'
                        }`}
                      >
                        {item.trailing}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Workspace Controls Footer: Country & Gemini Usage */}
      <div className="p-3.5 border-t border-stone-200/80 dark:border-white/[0.08] space-y-3 shrink-0 bg-[#ECE8E0]/70 dark:bg-[#0D1017]/80">
        <div className="space-y-1.5">
          <label
            htmlFor="sidebar-country-select"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 dark:text-stone-400 px-1"
          >
            <Globe className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span>Marché & Devise</span>
          </label>
          <select
            id="sidebar-country-select"
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value as CountryCode)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] text-xs font-medium text-stone-900 dark:text-stone-100 hover:border-stone-300 dark:hover:border-white/20 focus:border-amber-700 dark:focus:border-amber-500 focus:outline-none cursor-pointer transition-colors shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
          >
            <option value="NER">Niger (FCFA · XOF)</option>
            <option value="SEN">Sénégal (FCFA · XOF)</option>
            <option value="CIV">Côte d'Ivoire (FCFA · XOF)</option>
            <option value="FRA">France (Euro · EUR)</option>
            <option value="USA">Global (Dollar · USD)</option>
          </select>
        </div>

        <button
          onClick={() => setIsUsageModalOpen(true)}
          className="w-full cursor-pointer flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] text-xs text-stone-700 dark:text-stone-200 transition-colors shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
          title="Afficher le compteur d'utilisation et le diagnostic de l'API Gemini"
        >
          <span className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-medium whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Compteur IA</span>
          </span>
          <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400 tabular-nums whitespace-nowrap">
            {usageStats?.totalGeminiCalls || 0} appels
            {usageStats?.lastGeminiError ? ' · Erreur' : ''}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen print:hidden">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarBody}</div>
        </div>
      )}

      <UsageInspectorModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />
    </>
  );
};
