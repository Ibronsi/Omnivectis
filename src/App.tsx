import React, { useState, useEffect, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
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
  EconomicSector,
  OpportunityNiche,
  PipelineItem,
  SectorCategory,
  AIExecutionBlueprint,
  CountryCode,
  StrictOpportunity,
} from './types/market';
import { ECONOMIC_SECTORS } from './data/sectorsData';
import { calculateSimulation } from './utils/simulatorEngine';

const STORAGE_KEY = 'omnivectis_pipeline_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [countryCode, setCountryCode] = useState<CountryCode>('NER');
  const [selectedSectorForModal, setSelectedSectorForModal] = useState<EconomicSector | null>(null);
  const [selectedNicheForModal, setSelectedNicheForModal] = useState<OpportunityNiche | null>(null);
  const [selectedOpportunityForKit, setSelectedOpportunityForKit] = useState<StrictOpportunity | null>(null);

  // Authentication barrier state (APP_PASSWORD)
  const [isAuthRequired, setIsAuthRequired] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);

  useEffect(() => {
    checkAuthStatus().then((status) => {
      setIsAuthRequired(status.required);
      if (status.required && !status.authenticated) {
        setIsAuthenticated(false);
        setShowPasswordModal(true);
      }
    });

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setShowPasswordModal(true);
    };

    window.addEventListener('omnivectis:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('omnivectis:unauthorized', handleUnauthorized);
  }, []);

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

  // Pipeline items state with server persistence + localStorage fallback
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Default starter items for instant discovery
    return [
      {
        id: 'init-1',
        title: 'Micro-SaaS d Audit de Conformité CSRD Automatisée',
        sectorId: 'cleantech',
        sectorName: 'Énergie & Transition Climat (CleanTech)',
        stage: 'validation',
        targetMrr: 12000,
        currentMrr: 1500,
        notes: 'Partenariat avec 2 cabinets d experts-comptables pour la distribution marque blanche.',
        addedAt: '12/11/2026',
        checklists: [
          { text: 'Finaliser la grille de questions ESRS avec citations', done: true },
          { text: 'Tester avec 3 PME pilotes du secteur agroalimentaire', done: true },
          { text: 'Signer 5 abonnements annuels payants à 7 500€', done: false },
        ],
      },
      {
        id: 'init-2',
        title: 'Agence RevOps IA B2B - Génération de Leads Qualifiés',
        sectorId: 'b2b_services',
        sectorName: 'B2B Services & Agences Produitisées (Cash Rapide)',
        stage: 'monetizing',
        targetMrr: 18000,
        currentMrr: 9000,
        notes: '3 clients sous retainers mensuels à 3 000€/mois signés.',
        addedAt: '05/11/2026',
        checklists: [
          { text: 'Configurer 10 domaines de cold email en warm-up', done: true },
          { text: 'Automatiser le flux de qualification via Gemini API', done: true },
          { text: 'Recruter 2 clients supplémentaires pour atteindre 15k€/mois', done: false },
        ],
      },
    ];
  });

  // Fetch persistent pipeline from server on mount
  useEffect(() => {
    fetch('/api/pipeline')
      .then((res) => res.json())
      .then((data) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          setPipelineItems(data.items);
        }
      })
      .catch((err) => {
        console.info('Using local pipeline cache:', err);
      });
  }, []);

  // Save to localStorage and sync to server
  useEffect(() => {
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
  }, [pipelineItems]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Strict Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAction={() => {
          setActiveTab('sales');
        }}
        savedCount={pipelineItems.length}
        countryCode={countryCode}
        onCountryChange={setCountryCode}
        isProtected={isAuthRequired}
        onLock={() => {
          clearStoredPassword();
          setIsAuthenticated(false);
          setShowPasswordModal(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <SalesTrackingView countryCode={countryCode} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            simulationResult={activeSimulationResult}
            pipelineItems={pipelineItems}
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

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">OmniVectis</span>
            <span aria-hidden="true">·</span>
            <span>Usage Personnel · Données Vérifiées sans Simulation</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={() => setActiveTab('radar')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Radar
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Opportunités
            </button>
            <button
              onClick={() => setActiveTab('kits')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Dossiers & Plans
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className="hover:text-slate-300 transition-colors cursor-pointer text-emerald-400"
            >
              À Valider
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className="hover:text-slate-300 transition-colors cursor-pointer text-emerald-400"
            >
              Encaissements
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Simulateur
            </button>
          </div>

          <div>
            <span>Statut : <span className="text-emerald-400 font-mono">live</span> · Sources certifiées</span>
          </div>
        </div>
      </footer>

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
