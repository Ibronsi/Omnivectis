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
    <div className="flex flex-col h-full bg-[#0D1017] border-r border-white/[0.08] w-64 select-none">
      {/* Brand Lockup */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-white/[0.07] shrink-0">
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
            className="shrink-0 text-blue-500"
          >
            <rect
              x="2"
              y="2"
              width="20"
              height="20"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path
              d="M7.5 15.5L11 9.5L13.5 13L16.5 8.5"
              stroke="#10B981"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
            OmniVectis
          </span>
        </button>

        <button
          onClick={onCloseMobile}
          className="lg:hidden cursor-pointer p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label="Navigation principale">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-medium text-slate-500 tracking-wide">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full cursor-pointer flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span className="truncate whitespace-nowrap">{item.label}</span>
                    </span>
                    {typeof item.trailing === 'number' && (
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
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
      <div className="p-3.5 border-t border-white/[0.07] space-y-3 shrink-0 bg-[#0B0E14]">
        <div className="space-y-1">
          <label
            htmlFor="sidebar-country-select"
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 px-1"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Marché & Devise</span>
          </label>
          <select
            id="sidebar-country-select"
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value as CountryCode)}
            className="w-full px-2.5 py-2 rounded-lg bg-[#11141C] border border-white/[0.09] text-xs font-medium text-slate-100 hover:border-white/[0.16] focus:border-blue-500 focus:outline-none cursor-pointer transition-colors"
          >
            <option value="NER" className="bg-[#11141C] text-white">Niger (FCFA · XOF)</option>
            <option value="SEN" className="bg-[#11141C] text-white">Sénégal (FCFA · XOF)</option>
            <option value="CIV" className="bg-[#11141C] text-white">Côte d Ivoire (FCFA · XOF)</option>
            <option value="FRA" className="bg-[#11141C] text-white">France (Euro · EUR)</option>
            <option value="USA" className="bg-[#11141C] text-white">Global (Dollar · USD)</option>
          </select>
        </div>

        <button
          onClick={() => setIsUsageModalOpen(true)}
          className="w-full cursor-pointer flex items-center justify-between px-2.5 py-2 rounded-lg bg-[#11141C] hover:bg-[#161B26] border border-white/[0.08] text-xs text-slate-300 transition-colors"
          title="Afficher le compteur d'utilisation et le diagnostic de l'API Gemini"
        >
          <span className="flex items-center gap-2 text-slate-300 whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Compteur IA</span>
          </span>
          <span className="font-mono text-[11px] text-slate-200 tabular-nums whitespace-nowrap">
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
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
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
