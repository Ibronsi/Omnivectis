import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RadarView } from './components/RadarView';
import { OpportunitiesView } from './components/OpportunitiesView';
import { KitsView } from './components/KitsView';
import { ValidationQueueView } from './components/ValidationQueueView';
import { SalesTrackingView } from './components/SalesTrackingView';
import { SimulatorView } from './components/SimulatorView';
import { BlueprintView } from './components/BlueprintView';
import { LaunchpadView } from './components/LaunchpadView';
import { ArbitrageView } from './components/ArbitrageView';
import { PipelineView } from './components/PipelineView';
import { SectorDetailModal } from './components/SectorDetailModal';
import { PasswordGateModal } from './components/PasswordGateModal';
import { checkAuthStatus, clearStoredPassword } from './utils/auth';
import {
  restartLiveStream,
  stopLiveStream,
  subscribeLiveEvent,
} from './utils/liveStream';
import {
  EconomicSector,
  OpportunityNiche,
  PipelineItem,
  SectorCategory,
  AIExecutionBlueprint,
  CountryCode,
  StrictOpportunity,
  LiveFxRates,
  SignalsSnapshotPayload,
} from './types/market';
import { ECONOMIC_SECTORS } from './data/sectorsData';
import { calculateSimulation } from './utils/simulatorEngine';

const STORAGE_KEY = 'omnivectis_pipeline_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [countryCode, setCountryCode] = useState<CountryCode>('NER');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [selectedSectorForModal, setSelectedSectorForModal] = useState<EconomicSector | null>(null);
  const [selectedNicheForModal, setSelectedNicheForModal] = useState<OpportunityNiche | null>(null);
  const [selectedOpportunityForKit, setSelectedOpportunityForKit] = useState<StrictOpportunity | null>(null);

  // Authentication barrier state (APP_PASSWORD)
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [liveRates, setLiveRates] = useState<LiveFxRates | null>(null);

  useEffect(() => {
    checkAuthStatus()
      .then((status) => {
        setIsAuthRequired(status.required);
        if (status.required && !status.authenticated) {
          setIsAuthenticated(false);
          setShowPasswordModal(true);
        } else {
          setIsAuthenticated(true);
        }
      })
      .finally(() => {
        setAuthChecked(true);
      });

    const handleUnauthorized = () => {
      stopLiveStream();
      setIsAuthenticated(false);
      setShowPasswordModal(true);
    };

    window.addEventListener('omnivectis:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('omnivectis:unauthorized', handleUnauthorized);
  }, []);

  // Unified real-time SSE lifecycle + Live FX rates sync
  useEffect(() => {
    if (!authChecked || !isAuthenticated) {
      stopLiveStream();
      return;
    }

    restartLiveStream();

    fetch('/api/rates/live')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rates) {
          setLiveRates(data.rates);
        }
      })
      .catch(() => {});

    const applySignalsFx = (payload: SignalsSnapshotPayload) => {
      if (payload?.rates) {
        setLiveRates(payload.rates);
      }
    };

    const unsubSnap = subscribeLiveEvent<SignalsSnapshotPayload>('signals_snapshot', applySignalsFx);
    const unsubUpd = subscribeLiveEvent<SignalsSnapshotPayload>('signals_updated', applySignalsFx);

    return () => {
      unsubSnap();
      unsubUpd();
    };
  }, [authChecked, isAuthenticated]);

  // Cross-view state transfer
  const [blueprintSectorId, setBlueprintSectorId] = useState<SectorCategory>('ai_deeptech');
  const [blueprintTargetRevenue, setBlueprintTargetRevenue] = useState<string>('15 000 € / mois');
  const [launchpadSectorId, setLaunchpadSectorId] = useState<SectorCategory>('ai_deeptech');
  const [launchpadTitle, setLaunchpadTitle] = useState<string>('Agents IA Spécialisés Conformité & Due Diligence B2B');
  const [simulatorSectors, setSimulatorSectors] = useState<SectorCategory[]>([
    'ai_deeptech',
    'b2b_services',
  ]);

  const activeSimulationResult = useMemo(() => {
    return calculateSimulation({
      selectedSectorIds: simulatorSectors,
      startingCapital: 3000,
      weeklyHours: 25,
      timeHorizonMonths: 12,
      automationLevel: 75,
      targetMonthlyExpense: 600,
    });
  }, [simulatorSectors]);

  // Pipeline items state with server persistence + localStorage cache
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [pipelineHydrated, setPipelineHydrated] = useState<boolean>(false);
  const skipNextPipelineSyncRef = useRef<boolean>(false);

  // Fetch persistent pipeline from server on mount and after authentication
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    let cancelled = false;
    fetch('/api/pipeline')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.items)) {
          skipNextPipelineSyncRef.current = true;
          setPipelineItems(data.items);
          setPipelineHydrated(true);
        }
      })
      .catch((err) => {
        console.info('Impossible de synchroniser le pipeline depuis le serveur:', err);
      });

    const unsubPipeline = subscribeLiveEvent<{ items?: PipelineItem[] }>('pipeline_updated', (payload) => {
      if (Array.isArray(payload?.items)) {
        const incomingSerialized = JSON.stringify(payload.items);
        setPipelineItems((prev) => {
          if (JSON.stringify(prev) === incomingSerialized) return prev;
          skipNextPipelineSyncRef.current = true;
          return payload.items!;
        });
      }
    });

    return () => {
      cancelled = true;
      unsubPipeline();
    };
  }, [authChecked, isAuthenticated]);

  // Save to localStorage and sync to server once hydrated
  useEffect(() => {
    if (!pipelineHydrated) return;
    if (skipNextPipelineSyncRef.current) {
      skipNextPipelineSyncRef.current = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pipelineItems));
      } catch (e) {
        console.error(e);
      }
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pipelineItems));
      fetch('/api/pipeline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pipelineItems }),
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  }, [pipelineItems, pipelineHydrated]);

  // Handlers for interactions between views
  const handleSelectSector = (sector: EconomicSector, niche?: OpportunityNiche) => {
    setSelectedSectorForModal(sector);
    setSelectedNicheForModal(niche || sector.niches[0] || null);
  };

  const handleOpenSimulatorWithSectors = (sectorIds: string[]) => {
    setSimulatorSectors(sectorIds as SectorCategory[]);
    setActiveTab('simulator');
  };

  const handleSelectForBlueprint = (sector: EconomicSector, niche: OpportunityNiche) => {
    setBlueprintSectorId(sector.id);
    setBlueprintTargetRevenue('20 000 € / mois');
    setSelectedSectorForModal(null);
    setActiveTab('blueprint');
  };

  const handleAddToPipeline = (sector: EconomicSector, niche: OpportunityNiche) => {
    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      title: niche.title,
      sectorId: sector.id,
      sectorName: sector.name,
      stage: 'discovery',
      targetMrr: 10000,
      currentMrr: 0,
      notes: `${niche.tagline} · Ticket moyen : ${niche.typicalTicket}`,
      addedAt: new Date().toLocaleDateString('fr-FR'),
      checklists: [
        { text: 'Conduire 10 entretiens de découverte de douleur avec la cible', done: false },
        { text: 'Construire la page d atterrissage et l offre irrésistible', done: false },
        { text: 'Obtenir la première pré-commande payante', done: false },
      ],
    };
    setPipelineItems((prev) => [newItem, ...prev]);
    setSelectedSectorForModal(null);
    setActiveTab('pipeline');
  };

  const handleSaveBlueprintToPipeline = (
    blueprint: AIExecutionBlueprint,
    sector: EconomicSector,
    nicheTitle: string
  ) => {
    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      title: nicheTitle,
      sectorId: sector.id,
      sectorName: sector.name,
      stage: 'validation',
      targetMrr: 15000,
      currentMrr: 0,
      notes: blueprint.executiveSummary.slice(0, 140) + '...',
      addedAt: new Date().toLocaleDateString('fr-FR'),
      checklists: [
        { text: `J+30 : ${blueprint.roadmap30_60_90.day30.slice(0, 60)}...`, done: false },
        { text: `J+60 : ${blueprint.roadmap30_60_90.day60.slice(0, 60)}...`, done: false },
        { text: `J+90 : ${blueprint.roadmap30_60_90.day90.slice(0, 60)}...`, done: false },
      ],
    };
    setPipelineItems((prev) => [newItem, ...prev]);
  };

  const handleTriggerBlueprintFromSimulator = (sectorId: SectorCategory, targetRevenue: string) => {
    setBlueprintSectorId(sectorId);
    setBlueprintTargetRevenue(targetRevenue);
    setActiveTab('blueprint');
  };

  const handleOpenBlueprintForArbitrage = (sectorId: SectorCategory, customTitle: string) => {
    setBlueprintSectorId(sectorId);
    setBlueprintTargetRevenue('25 000 € / mois');
    setActiveTab('blueprint');
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={pipelineItems.length}
        countryCode={countryCode}
        onCountryChange={setCountryCode}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Strict Top Bar Contract Header */}
        <Header
          activeTab={activeTab}
          onQuickAction={() => {
            setActiveTab('sales');
          }}
          countryCode={countryCode}
          isProtected={isAuthRequired}
          onLock={() => {
            stopLiveStream();
            clearStoredPassword();
            setIsAuthenticated(false);
            setShowPasswordModal(true);
          }}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'opportunities' && (
          <OpportunitiesView
            countryCode={countryCode}
            onOpenDigitalKit={(opp) => {
              setSelectedOpportunityForKit(opp);
              setActiveTab('kits');
            }}
            onOpenPhysicalPlan={(opp) => {
              setSelectedOpportunityForKit(opp);
              setActiveTab('kits');
            }}
            onAddToPipeline={(opp) => {
              const newItem: PipelineItem = {
                id: `pipe-${Date.now()}`,
                title: opp.title,
                sectorId: 'b2b_services',
                sectorName: opp.type === 'numérique' ? 'Services Numériques' : 'Exploitation Physique',
                stage: 'validation',
                targetMrr: 10000,
                currentMrr: 0,
                notes: opp.description,
                addedAt: new Date().toLocaleDateString('fr-FR'),
                checklists: [
                  { text: 'Vérifier la faisabilité terrain', done: true },
                  { text: 'Générer le dossier d exécution', done: false },
                  { text: 'Encaisser la première vente', done: false },
                ],
              };
              setPipelineItems((prev) => [newItem, ...prev]);
              setActiveTab('pipeline');
            }}
          />
        )}

        {activeTab === 'kits' && (
          <KitsView
            countryCode={countryCode}
            selectedOpportunity={selectedOpportunityForKit}
            onNavigateToValidationQueue={() => setActiveTab('validation')}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationQueueView countryCode={countryCode} />
        )}

        {activeTab === 'sales' && (
          <SalesTrackingView countryCode={countryCode} liveRates={liveRates} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            simulationResult={activeSimulationResult}
            pipelineItems={pipelineItems}
            countryCode={countryCode}
            liveRates={liveRates}
            onNavigateTab={setActiveTab}
            onOpenBlueprintForSector={(sectorId) => {
              setBlueprintSectorId(sectorId);
              setBlueprintTargetRevenue('20 000 € / mois');
              setActiveTab('blueprint');
            }}
          />
        )}

        {activeTab === 'radar' && (
          <RadarView
            onSelectSector={handleSelectSector}
            onOpenSimulatorWithSectors={handleOpenSimulatorWithSectors}
            onLaunchCircuitForSignal={(sectorId, headline) => {
              setLaunchpadSectorId(sectorId);
              setLaunchpadTitle(headline);
              setActiveTab('launchpad');
            }}
            onTriggerBlueprintForSignal={(sectorId) => {
              setBlueprintSectorId(sectorId);
              setBlueprintTargetRevenue('20 000 € / mois');
              setActiveTab('blueprint');
            }}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            initialSectors={simulatorSectors}
            onTriggerBlueprint={handleTriggerBlueprintFromSimulator}
            countryCode={countryCode}
            liveRates={liveRates}
          />
        )}

        {activeTab === 'blueprint' && (
          <BlueprintView
            initialSectorId={blueprintSectorId}
            initialTargetRevenue={blueprintTargetRevenue}
            onSaveToPipeline={handleSaveBlueprintToPipeline}
          />
        )}

        {activeTab === 'launchpad' && (
          <LaunchpadView
            initialSectorId={launchpadSectorId}
            initialOpportunityTitle={launchpadTitle}
            countryCode={countryCode}
            liveRates={liveRates}
            onAddToPipeline={(title, sectorId, targetMrr) => {
              const secObj = ECONOMIC_SECTORS.find((s) => s.id === sectorId) || ECONOMIC_SECTORS[0];
              const newItem: PipelineItem = {
                id: `pipe-${Date.now()}`,
                title,
                sectorId,
                sectorName: secObj.name,
                stage: 'building',
                targetMrr,
                currentMrr: 0,
                notes: 'Circuit de monétisation et tunnel généré prêt à encaisser.',
                addedAt: new Date().toLocaleDateString('fr-FR'),
                checklists: [
                  { text: 'Configurer le compte de paiement', done: false },
                  { text: 'Envoyer la prospection validée', done: false },
                  { text: 'Encaisser le premier règlement', done: false },
                ],
              };
              setPipelineItems((prev) => [newItem, ...prev]);
              setActiveTab('pipeline');
            }}
          />
        )}

        {activeTab === 'arbitrage' && (
          <ArbitrageView
            onOpenBlueprintForArbitrage={handleOpenBlueprintForArbitrage}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineView
            items={pipelineItems}
            onUpdateItems={setPipelineItems}
            onNavigateToBlueprint={(sectorId) => {
              setBlueprintSectorId(sectorId);
              setActiveTab('blueprint');
            }}
          />
        )}
        </main>

        {/* Quiet Editorial Footer */}
        <footer className="border-t border-white/[0.07] bg-[#090B10] py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-slate-300">OmniVectis</span>
              <span aria-hidden="true">·</span>
              <span>Usage Personnel · Provenance Stricte</span>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <button
                onClick={() => setActiveTab('radar')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Radar
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Opportunités
              </button>
              <button
                onClick={() => setActiveTab('kits')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Dossiers & Plans
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                À Valider
              </button>
              <button
                onClick={() => setActiveTab('sales')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Encaissements
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Simulateur
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Detail Modal */}
      <SectorDetailModal
        sector={selectedSectorForModal}
        selectedNiche={selectedNicheForModal}
        onClose={() => {
          setSelectedSectorForModal(null);
          setSelectedNicheForModal(null);
        }}
        onSelectForBlueprint={handleSelectForBlueprint}
        onAddToPipeline={handleAddToPipeline}
        onLaunchCircuit={(sector, niche) => {
          setLaunchpadSectorId(sector.id);
          setLaunchpadTitle(niche.title);
          setSelectedSectorForModal(null);
          setSelectedNicheForModal(null);
          setActiveTab('launchpad');
        }}
      />

      {/* Password Protection Barrier (APP_PASSWORD) */}
      <PasswordGateModal
        isOpen={showPasswordModal}
        onSuccess={() => {
          setIsAuthenticated(true);
          setShowPasswordModal(false);
        }}
      />
    </div>
  );
}
