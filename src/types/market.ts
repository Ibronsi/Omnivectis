export type SectorCategory =
  | 'ai_deeptech'
  | 'cleantech'
  | 'fintech'
  | 'health_longevity'
  | 'agritech'
  | 'proptech'
  | 'logistics'
  | 'b2b_services'
  | 'digital_commerce';

export interface OpportunityNiche {
  id: string;
  title: string;
  tagline: string;
  marketSize: string;
  cagr: string;
  grossMargin: number; // in %
  netMargin: number; // in %
  timeToFirstRevenue: string; // e.g. "14 jours"
  capitalRequired: '0 - 1k€' | '1k - 5k€' | '5k - 20k€' | '20k€+';
  capitalScore: 1 | 2 | 3 | 4; // 1 = bootstrap ultra-lean, 4 = heavy
  recurringRevenueShare: number; // % MRR vs one-off
  pricingModel: string;
  typicalTicket: string;
  fastestAcquisitionChannel: string;
  techStackKey: string[];
  executionSteps: string[];
  riskFactor: string;
  barrierToEntry: string;
}

export interface EconomicSector {
  id: SectorCategory;
  name: string;
  categoryName: string;
  tagline: string;
  globalTam: string;
  growthRate: string;
  averageMargin: number;
  cashFlowSpeed: 'Immédiat (<30j)' | 'Moyen terme (1-3m)' | 'Long terme (6m+)';
  volatilityIndex: 'Basse' | 'Moyenne' | 'Haute';
  iconName: string;
  description: string;
  niches: OpportunityNiche[];
  macroTailwinds: string[];
  arbitragePotential: string;
}

export interface SimulationInputs {
  selectedSectorIds: SectorCategory[];
  startingCapital: number;
  weeklyHours: number;
  timeHorizonMonths: number;
  automationLevel: number; // 0 to 100
  targetMonthlyExpense: number;
}

export interface SimulationResult {
  projectedMrr: number;
  projectedArr: number;
  projectedEbitda: number;
  breakEvenMonth: number;
  roiPercentage: number;
  diversificationScore: number; // 0 to 100
  sectorBreakdown: {
    sectorId: SectorCategory;
    name: string;
    monthlyRevenue: number;
    sharePercent: number;
  }[];
  monthlyTimeline: {
    month: number;
    revenue: number;
    costs: number;
    netProfit: number;
    cumulativeCash: number;
  }[];
}

export interface AIExecutionBlueprint {
  executiveSummary: string;
  revenueMechanics: {
    pricingModel: string;
    expectedGrossMargin: string;
    targetTicket: string;
    scalabilityGrade: string;
    explanation: string;
  };
  acquisitionStrategy: {
    channel: string;
    action: string;
    expectedConversion: string;
  }[];
  operationalStack: string[];
  roadmap30_60_90: {
    day30: string;
    day60: string;
    day90: string;
  };
  crossSectorSynergies: string[];
  keyRisksAndMoat: {
    primaryRisk: string;
    defenseMoat: string;
  };
}

export interface PipelineItem {
  id: string;
  title: string;
  sectorId: SectorCategory;
  sectorName: string;
  stage: 'discovery' | 'validation' | 'building' | 'monetizing';
  targetMrr: number;
  currentMrr: number;
  notes: string;
  addedAt: string;
  checklists: { text: string; done: boolean }[];
}

export interface MarketSignal {
  id: string;
  category: 'reglementaire' | 'energie_matiere' | 'ia_tech' | 'finance_taux' | 'supply_chain';
  headline: string;
  context: string;
  immediateArbitragePlay: string;
  sectorId: SectorCategory;
  sectorName: string;
  estimatedMarginImpact: string;
  urgency: 'Immédiat (<48h)' | 'Cette semaine' | 'Ce mois-ci';
  timestamp: string;
}

export interface LaunchpadCircuit {
  opportunityTitle: string;
  sectorName: string;
  tagline: string;
  commercialOffer: {
    heroPromise: string;
    targetPersona: string;
    riskReversalGuarantee: string;
    tiers: {
      name: string;
      price: string;
      billingCycle: string;
      deliverables: string[];
      stripeLinkParams: string;
    }[];
  };
  outreachSequence: {
    channel: string;
    targetFilters: string;
    email1Subject: string;
    email1Body: string;
    email2Followup: string;
    email3Breakup: string;
  };
  legalAgreement: {
    contractTitle: string;
    purposeClause: string;
    financialTerms: string;
    confidentialityAndIP: string;
    terminationClause: string;
  };
  landingPageWireframe: {
    heroHeadline: string;
    heroSubheadline: string;
    ctaButtonText: string;
    problemSection: string[];
    solutionFeatures: { title: string; desc: string }[];
    socialProofHook: string;
  };
  deliveryEngine: {
    inputTrigger: string;
    processingSteps: string[];
    aiPromptTemplate: string;
    outputDeliverableFormat: string;
    timeSavedHoursPerClient: number;
  };
}


