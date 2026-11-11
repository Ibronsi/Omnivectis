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
  tamSource?: string;
  sourceType?: 'verified_public' | 'model_hypothesis';
  methodologyNote?: string;
}

export type CountryCode = 'NER' | 'SEN' | 'CIV' | 'FRA' | 'USA';
export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface GeoProfile {
  countryCode: CountryCode;
  countryName: string;
  currency: CurrencyCode;
  currencySymbol: string;
  fxRateToEur: number; // e.g. 655.957 for XOF, 1 for EUR, 1.12 for USD
  regionLabel: string;
  banks: string[];
  mobileMoney: string[];
  transferAgencies: string[];
  averageB2bTicket: number;
  standardTaxRate: number;
}

export interface SimulationInputs {
  selectedSectorIds: SectorCategory[];
  startingCapital: number;
  weeklyHours: number;
  timeHorizonMonths: number;
  automationLevel: number; // 0 to 100
  targetMonthlyExpense: number;
  countryCode?: CountryCode;
  currency?: CurrencyCode;
  churnRatePercent?: number;
  customerAcquisitionCost?: number;
  variableCostsPercent?: number;
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
  countryCode?: CountryCode;
  currency?: CurrencyCode;
  paymentMethod?: string;
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
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  relativeTime?: string;
  region: 'niger_uemoa' | 'europe' | 'global';
  isVerifiedSource: boolean;
  status: 'live' | 'cache' | 'indisponible';
  countryCode?: CountryCode;
}

export interface SourceCitation {
  signalId: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  status: 'live' | 'cache' | 'indisponible';
}

export interface StrictOpportunity {
  id: string;
  title: string;
  type: 'numérique' | 'physique';
  description: string;
  sourceSignals: SourceCitation[];
  whyItExists: string;
  confidenceLevel: 'faible' | 'moyen' | 'élevé';
  risks: string[];
  invalidationTriggers: string[];
  targetRevenueLocal: string;
  estimatedMargin: string;
  countryCode: CountryCode;
  createdAt: string;
  hasEnoughData: boolean;
  insufficientDataReason?: string;
}

export interface DigitalLaunchKit {
  opportunityId: string;
  opportunityTitle: string;
  offerAndPricing: {
    localPrice: string;
    currency: string;
    billingModel: string;
    deliverables: string[];
    guarantee: string;
  };
  htmlSalesPage: string;
  contentPack: {
    tagline: string;
    linkedinPost: string;
    whatsappTeaser: string;
    socialProofAngle: string;
  };
  outreachCopy: {
    directMessage: string;
    emailPitch: string;
    objectionHandling: { objection: string; reply: string }[];
  };
  followupSequence: {
    day3: string;
    day7: string;
    day14Breakup: string;
  };
  accountsChecklist: {
    id: string;
    accountName: string;
    description: string;
    status: 'todo' | 'done';
    link?: string;
  }[];
  automationActions: {
    title: string;
    tool: string;
    description: string;
    setupDifficulty: 'rapide' | 'moyen';
  }[];
}

export interface PhysicalHypothesis {
  id: string;
  category: string;
  label: string;
  amount: number;
  isEditable: boolean;
  note: string;
}

export interface PhysicalExploitationPlan {
  opportunityId: string;
  opportunityTitle: string;
  investmentBudget: {
    totalInitial: number;
    currency: string;
    hypotheses: PhysicalHypothesis[];
    workingCapitalReserve: number;
  };
  localSuppliersAndPartners: {
    name: string;
    role: string;
    location: string;
    contactGuide: string;
  }[];
  regulatoryAuthorizations: {
    stepNumber: number;
    authority: string;
    requirement: string;
    estimatedCost: string;
    delay: string;
  }[];
  supplyChainAndLogistics: {
    transportRoute: string;
    storageConditions: string;
    leadTimeDays: number;
    safetyStockUnits: number;
  };
  implementationTimeline: {
    week: string;
    milestone: string;
    criticalAction: string;
  }[];
  breakEvenAnalysis: {
    unitSalePrice: number;
    unitCost: number;
    unitGrossMargin: number;
    monthlyFixedCosts: number;
    breakEvenUnits: number;
    breakEvenRevenue: number;
  };
  risksAndMitigation: {
    risk: string;
    mitigationStrategy: string;
  }[];
}

export interface ValidationItem {
  id: string;
  title: string;
  category: 'prospection_message' | 'marketing_post' | 'contract_offer' | 'administrative_step' | 'order_placement';
  targetRecipient?: string;
  contentPayload: string;
  sourceOpportunityTitle: string;
  countryCode: CountryCode;
  createdAt: string;
  status: 'en_attente' | 'valide' | 'rejete';
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionType:
    | 'signal_harvested'
    | 'opportunity_generated'
    | 'kit_generated'
    | 'item_queued'
    | 'item_validated'
    | 'item_rejected'
    | 'sale_recorded'
    | 'hypothesis_updated'
    | 'api_error';
  actor: 'utilisateur' | 'agent_serveur' | 'gemini_api';
  description: string;
  provenanceDetails?: string;
  status: 'success' | 'warning' | 'error';
}

export interface RealSaleRecord {
  id: string;
  clientName: string;
  opportunityId?: string;
  opportunityTitle: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  status: 'encaisse' | 'en_attente' | 'annule';
  paymentMethod: string;
  notes?: string;
  reference?: string;
}

export interface UsageCounterStats {
  totalGeminiCalls: number;
  successfulCalls: number;
  failedCalls: number;
  signalsCollected: number;
  opportunitiesSynthesized: number;
  kitsGenerated: number;
  lastResponseTimeMs: number;
  lastGeminiError?: {
    message: string;
    timestamp: string;
    code?: string | number;
  };
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



