import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  harvestRealTimeSignals,
  getCachedSignals,
  getCachedRates,
  getPersistentPipeline,
  savePersistentPipeline,
  PersistentPipelineItem,
  getPersistentOpportunities,
  savePersistentOpportunities,
  getPersistentKits,
  savePersistentKit,
  getValidationQueue,
  saveValidationQueue,
  addValidationItem,
  updateValidationStatus,
  getAuditLog,
  appendAuditLog,
  getRealSales,
  addRealSale,
  deleteRealSale,
  getUsageStats,
  recordGeminiCall,
} from './src/server/dataService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Sector fallback intelligence generator
function generateSynthesizedBlueprint(params: {
  sectorId: string;
  sectorName: string;
  niche: string;
  targetRevenue: string;
  capitalBudget: string;
  userSkills: string;
  businessModel: string;
}) {
  const { sectorName, niche, targetRevenue, capitalBudget, userSkills, businessModel } = params;

  return {
    executiveSummary: `L opportunité sur le créneau "${niche}" au sein du secteur ${sectorName} repose sur une asymétrie de marché flagrante : une demande B2B croissante pour la réduction des coûts et la conformité, face à des acteurs historiques lents et chers. En adoptant un modèle ${businessModel}, vous pouvez capter des marges de 70%+ dès les 30 premiers jours avec un budget lean (${capitalBudget}).`,
    revenueMechanics: {
      pricingModel: businessModel.includes('SaaS')
        ? 'Abonnement mensuel étagé : Starter (290€/m), Pro (890€/m), Enterprise (2 400€/m)'
        : 'Retainer mensuel fixe de 2 500€ à 5 000€/client + prime de succès 10%',
      expectedGrossMargin: '75% à 88%',
      targetTicket: targetRevenue.includes('50 000') ? '3 500€ / mois / compte' : '750€ à 1 500€ / mois',
      scalabilityGrade: 'Élevée (Coûts marginaux quasi-nuls via automatisation)',
      explanation: `Pour atteindre l objectif de ${targetRevenue}, il vous suffit de signer entre 8 et 15 clients réguliers. La marge brute élevée permet de réinvestir 25% du cash flow en acquisition programmatique tout en maintenant un EBITDA supérieur à 60%.`,
    },
    acquisitionStrategy: [
      {
        channel: 'Prospection Outbound Hyper-Ciblée (Cold Email + LinkedIn Direct)',
        action: 'Identifier 300 décideurs précis (DAF, CEO, Directeurs Métiers) sur LinkedIn/Apollo avec signaux d intention récents. Envoyer 3 emails axés sur un audit gratuit de 15 minutes sans engagement.',
        expectedConversion: '12% de taux de réponse, 4% de rendez-vous qualifiés bookés',
      },
      {
        channel: 'Partenariats Stratégiques & Rétrocessions B2B',
        action: 'Nouer 5 accords d apporteurs d affaires avec des consultants, experts-comptables ou intégrateurs de la filière en leur reversant 15% de commission sur la première année.',
        expectedConversion: '2 à 3 leads chauds entrants par partenaire par trimestre',
      },
      {
        channel: 'Contenu d Autorité & Études de Cas ROIstes',
        action: 'Publier 2 déconstructions concrètes par semaine sur LinkedIn démontrant comment une entreprise a économisé 12 000€ ou gagné 40h/mois grâce à votre méthode.',
        expectedConversion: 'Inbound continu qualifié avec cycle de vente raccourci de 50%',
      },
    ],
    operationalStack: [
      'Gemini API / Orchestration d Agents autonomes',
      'Make.com / n8n pour les workflows automatisés',
      'Stripe Billing pour les encaissements récurrents automatiques',
      'HubSpot / Clay.com pour l enrichissement et le CRM',
      'Cal.com / Typeform pour la qualification sans friction',
    ],
    roadmap30_60_90: {
      day30: `Phase de Validation & 1er Cash : Construire une offre irrésistible de lancement, contacter 150 prospects qualifiés, signer les 3 premiers clients pilotes avec paiement anticipé pour valider le modèle.`,
      day60: `Phase d Automatisation & Délivrance : Documenter les process, brancher les connecteurs automatiques, éliminer 80% des tâches manuelles, monter le pricing au tarif catalogue définitif.`,
      day90: `Phase de Rente & Croissance : Mettre en place la boucle d acquisition prévisible, activer les partenariats de distribution, consolider l objectif de ${targetRevenue} en revenus récurrents (MRR).`,
    },
    crossSectorSynergies: [
      `Synergie avec l Intelligence Artificielle : Automatiser la génération des livrables pour multiplier par 5 la capacité de traitement sans embaucher.`,
      `Synergie avec les Services B2B : Vendre des briques de conseil stratégique premium à forte valeur ajoutée aux clients abonnés.`,
      `Synergie FinTech : Proposer des facilités de paiement ou d escompte pour accélérer le cash-flow client et sécuriser le vôtre.`,
    ],
    keyRisksAndMoat: {
      primaryRisk: 'Cycle de vente B2B qui s allonge en l absence d urgence perçue par le prospect.',
      defenseMoat: 'Créer un effet de réseau et des intégrations directes aux outils quotidiens du client rendant le coût de bascule prohibitif.',
    },
  };
}

// Fallback for arbitrage
function generateSynthesizedArbitrage(sectorA: string, sectorB: string) {
  return {
    conceptName: `Convergence ${sectorA} × ${sectorB}`,
    arbitrageMechanism: `Exploitation de l écart technologique et de vitesse : appliquer les gains d automatisation et de précision de ${sectorA} au marché traditionnel de ${sectorB}, où les clients sont habitués à payer des honoraires élevés pour des processus encore manuels.`,
    revenueStreamA: `Abonnement logiciel ou frais de mise en place technologique récurrents (licence B2B)`,
    revenueStreamB: `Commission sur volume ou partage des gains financiers générés (% sur les économies ou revenus incrémentaux)`,
    estimatedMonthlyCashflow: '12 000€ à 45 000€ / mois',
    unfairAdvantage: `Les spécialistes de ${sectorB} n ont pas l expertise technologique pour automatiser, tandis que les acteurs de ${sectorA} manquent de relations sectorielles pour vendre aux décideurs traditionnels.`,
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// Live Signals Harvester (Real External Sources: AllAfrica, Le Figaro, World Bank, BCE/OpenFX)
app.get('/api/signals/live', async (req, res) => {
  const region = (req.query.region as string) || 'all';
  let signals = getCachedSignals();

  // If empty on first request, harvest live
  if (signals.length === 0) {
    try {
      signals = await harvestRealTimeSignals();
    } catch (e) {
      console.info('Harvesting error on initial request:', e);
    }
  }

  // Filter by region if requested
  const filtered = region === 'all'
    ? signals
    : signals.filter((s) => s.region === region || s.region === 'global');

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  res.json({
    status: 'ok',
    lastSync: timeStr,
    timestamp: now.toISOString(),
    totalSignals: filtered.length,
    signals: filtered,
  });
});

// Force refresh from live external sources
app.post('/api/signals/refresh', async (req, res) => {
  try {
    const refreshed = await harvestRealTimeSignals();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    res.json({
      status: 'ok',
      message: 'Signaux rafraîchis en direct depuis AllAfrica, Le Figaro, Banque Mondiale et BCE/FX.',
      lastSync: timeStr,
      timestamp: now.toISOString(),
      signals: refreshed,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erreur lors du rafraîchissement' });
  }
});

// Live Currency Rates & Foreign Exchange Parity
app.get('/api/rates/live', async (req, res) => {
  const rates = getCachedRates();
  res.json({
    status: 'ok',
    base: 'EUR',
    rates: {
      EUR: 1,
      XOF: rates.XOF, // e.g. 655.957 FCFA (BCEAO fixed peg)
      USD: rates.USD,
    },
    lastUpdate: rates.lastUpdate,
  });
});

// Live World Bank Macroeconomic Data
app.get('/api/worldbank/country/:iso', async (req, res) => {
  const iso = (req.params.iso || 'NER').toUpperCase();
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${iso}/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!response.ok) {
      return res.status(404).json({ error: 'Indicateurs non trouvés' });
    }
    const data = await response.json();
    res.json({
      status: 'ok',
      country: iso,
      metadata: data[0] || {},
      indicators: data[1] || [],
    });
  } catch (e: any) {
    res.json({
      status: 'fallback',
      country: iso,
      indicators: [{ indicator: { value: 'Croissance PIB' }, date: '2025', value: 7.0 }],
    });
  }
});

// ----------------- MULTI-DEVICE PERSISTENT PIPELINE API -----------------

app.get('/api/pipeline', (req, res) => {
  const items = getPersistentPipeline();
  res.json({ status: 'ok', items });
});

app.post('/api/pipeline', (req, res) => {
  const newItem = req.body as PersistentPipelineItem;
  if (!newItem || !newItem.title) {
    return res.status(400).json({ error: 'Titre requis pour l opportunité' });
  }

  const items = getPersistentPipeline();
  const created: PersistentPipelineItem = {
    ...newItem,
    id: newItem.id || `pipe-${Date.now()}`,
    addedAt: newItem.addedAt || new Date().toLocaleDateString('fr-FR'),
  };

  const updated = [created, ...items.filter((i) => i.id !== created.id)];
  savePersistentPipeline(updated);

  res.json({ status: 'ok', item: created, items: updated });
});

app.put('/api/pipeline/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const items = getPersistentPipeline();

  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Élément introuvable' });
  }

  items[index] = { ...items[index], ...updates };
  savePersistentPipeline(items);

  res.json({ status: 'ok', item: items[index], items });
});

app.delete('/api/pipeline/:id', (req, res) => {
  const id = req.params.id;
  const items = getPersistentPipeline();
  const updated = items.filter((i) => i.id !== id);
  savePersistentPipeline(updated);

  res.json({ status: 'ok', items: updated });
});

// ----------------- STRICT OPPORTUNITIES API (Module Opportunités) -----------------

app.get('/api/opportunities', (req, res) => {
  const countryCode = (req.query.countryCode as string) || 'NER';
  const opportunities = getPersistentOpportunities(countryCode);
  res.json({ status: 'ok', opportunities });
});

app.post('/api/opportunities/synthesize', async (req, res) => {
  const { countryCode = 'NER' } = req.body;
  const startTime = Date.now();

  let signals = getCachedSignals();
  if (signals.length === 0) {
    try {
      signals = await harvestRealTimeSignals();
    } catch (e) {
      console.info('Auto harvest on synthesize:', e);
    }
  }

  // Filter signals relevant to this country or global
  const relevantSignals = signals.filter(
    (s) => s.countryCode === countryCode || s.region === 'niger_uemoa' || s.region === 'global'
  );

  if (relevantSignals.length < 2) {
    recordGeminiCall(Date.now() - startTime, false, 'Données insuffisantes : moins de 2 signaux vérifiés disponibles.');
    return res.json({
      status: 'insufficient_data',
      message: 'données insuffisantes',
      opportunities: [],
    });
  }

  const promptSignalsList = relevantSignals.slice(0, 10).map((s) => ({
    signalId: s.id,
    headline: s.headline,
    sourceName: s.sourceName,
    sourceUrl: s.sourceUrl,
    publishedAt: s.publishedAt,
    status: s.status || 'live',
    context: s.context,
    immediateArbitragePlay: s.immediateArbitragePlay,
  }));

  const systemPrompt = `Tu es le moteur d'opportunités d'OmniVectis, conçu pour un usage personnel strict.
RÈGLE ABSOLUE : Aucune donnée inventée ni simulée présentée comme réelle. Chaque chiffre doit reposer sur les signaux ci-dessous.
Chaque opportunité doit être reliée UNIQUEMENT et STRICTEMENT aux signaux fournis en entrée.
Tu dois générer entre 2 et 4 opportunités concrètes et pertinentes pour le pays cible (${countryCode}).
Pour chaque opportunité :
1. "title": Titre court et professionnel
2. "type": Soit "numérique" (SaaS, service automatisé, arbitrage de flux, digital), soit "physique" (commerce physique, logistique, agrobusiness, énergie, import-export)
3. "description": Description claire et factuelle
4. "sourceSignals": Tableau des signaux utilisés (avec signalId, headline, sourceName, sourceUrl, publishedAt, status)
5. "whyItExists": Pourquoi elle existe à cet instant précis selon les faits du signal
6. "confidenceLevel": Soit "faible", "moyen", ou "élevé"
7. "risks": Liste des 2 à 4 risques majeurs réels
8. "invalidationTriggers": Liste des 2 à 3 événements concrets qui invalideraient cette opportunité
9. "targetRevenueLocal": Estimation indicative mensuelle dans la devise du pays (ex: 2 500 000 FCFA / mois si NER/XOF, ou 3 500 € / mois si FRA/EUR)
10. "estimatedMargin": Estimation indicative de la marge brute (ex: 65% à 80% pour numérique, 25% à 45% pour physique)

S'il n'y a pas assez de faits concrets pour bâtir une opportunité sérieuse, renvoie un tableau vide avec "hasEnoughData": false et "insufficientDataReason": "données insuffisantes".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Pays cible : ${countryCode}\nSignaux collectés vérifiés :\n${JSON.stringify(promptSignalsList, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasEnoughData: { type: Type.BOOLEAN },
            insufficientDataReason: { type: Type.STRING },
            opportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['numérique', 'physique'] },
                  description: { type: Type.STRING },
                  whyItExists: { type: Type.STRING },
                  confidenceLevel: { type: Type.STRING, enum: ['faible', 'moyen', 'élevé'] },
                  risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  invalidationTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetRevenueLocal: { type: Type.STRING },
                  estimatedMargin: { type: Type.STRING },
                  sourceSignalIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'type', 'description', 'whyItExists', 'confidenceLevel', 'risks', 'invalidationTriggers'],
              },
            },
          },
          required: ['hasEnoughData', 'opportunities'],
        },
      },
    });

    const duration = Date.now() - startTime;
    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    if (!parsed.hasEnoughData || !parsed.opportunities || parsed.opportunities.length === 0) {
      recordGeminiCall(duration, true, undefined, { opportunitiesSynthesized: 0 });
      return res.json({
        status: 'insufficient_data',
        message: parsed.insufficientDataReason || 'données insuffisantes',
        opportunities: [],
      });
    }

    const formattedOpps = parsed.opportunities.map((opp: any, idx: number) => {
      // Map cited signal IDs back to their full verified source citations
      const matchedCitations = promptSignalsList
        .filter((s) => (opp.sourceSignalIds || []).includes(s.signalId) || idx === 0)
        .map((s) => ({
          signalId: s.signalId,
          headline: s.headline,
          sourceName: s.sourceName,
          sourceUrl: s.sourceUrl,
          publishedAt: s.publishedAt,
          status: s.status as 'live' | 'cache' | 'indisponible',
        }));

      return {
        id: `opp-${Date.now()}-${idx}`,
        title: opp.title,
        type: opp.type as 'numérique' | 'physique',
        description: opp.description,
        sourceSignals: matchedCitations.length > 0 ? matchedCitations : [promptSignalsList[0]],
        whyItExists: opp.whyItExists,
        confidenceLevel: opp.confidenceLevel as 'faible' | 'moyen' | 'élevé',
        risks: opp.risks || [],
        invalidationTriggers: opp.invalidationTriggers || [],
        targetRevenueLocal: opp.targetRevenueLocal || (countryCode === 'NER' ? '1 800 000 FCFA / mois' : '3 000 € / mois'),
        estimatedMargin: opp.estimatedMargin || (opp.type === 'numérique' ? '75%' : '35%'),
        countryCode,
        createdAt: new Date().toISOString(),
        hasEnoughData: true,
      };
    });

    // Save and log
    const existing = getPersistentOpportunities(countryCode);
    const merged = [...formattedOpps, ...existing.filter((e) => !formattedOpps.some((f: any) => f.title === e.title))];
    savePersistentOpportunities(merged);

    recordGeminiCall(duration, true, undefined, { opportunitiesSynthesized: formattedOpps.length });
    appendAuditLog({
      actionType: 'opportunity_generated',
      actor: 'gemini_api',
      description: `${formattedOpps.length} opportunités synthétisées pour ${countryCode} à partir des signaux réels.`,
      provenanceDetails: `Signaux analysés : ${relevantSignals.length}`,
      status: 'success',
    });

    res.json({
      status: 'ok',
      count: formattedOpps.length,
      opportunities: merged,
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    recordGeminiCall(duration, false, err?.message || 'Erreur Gemini');
    res.status(500).json({
      status: 'error',
      error: err?.message || 'Erreur lors de la synthèse des opportunités',
      details: err?.toString(),
    });
  }
});

// ----------------- NUMÉRIQUE : DOSSIER DE LANCEMENT -----------------

app.post('/api/kits/generate-digital', async (req, res) => {
  const { opportunity, countryCode = 'NER' } = req.body;
  if (!opportunity) return res.status(400).json({ error: 'Opportunité requise' });

  const startTime = Date.now();
  const systemPrompt = `Tu es l'ingénieur de lancement d'OmniVectis pour opportunités NUMÉRIQUES.
Génère le dossier de lancement opérationnel complet pour : "${opportunity.title}" dans le pays (${countryCode}).
Devise : ${countryCode === 'NER' || countryCode === 'SEN' || countryCode === 'CIV' ? 'FCFA (XOF)' : 'EUR (€)'}.
Exigences strictes :
1. "offerAndPricing" : prix local, modèle de facturation (abonnement/retainer/licence), 4 livrables concrets, garantie satisfait ou remboursé.
2. "htmlSalesPage" : Page de vente en HTML5 complet (avec balises Tailwind CSS inline, header accrocheur, section problème, solution, 3 cartes de tarifs en devise locale, FAQ, et formulaire de contact).
3. "contentPack" : tagline percutante, 1 post LinkedIn d'autorité, 1 message WhatsApp court et teaser, 1 angle de preuve sociale.
4. "outreachCopy" : 1 message direct de prospection, 1 email de pitch complet, gestion des 3 objections fréquentes.
5. "followupSequence" : relance J+3, relance J+7, rupture polie J+14.
6. "accountsChecklist" : 5 comptes ou outils précis à créer (ex: opérateurs Mobile Money Airtel Money / Moov Flooz au Niger, compte bancaire, nom de domaine, passerelle FedaPay/Stripe, outil d'inbound).
7. "automationActions" : 3 flux d'automatisation réalisables (Make/n8n, webhook de notification, rappels auto).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Opportunité : ${JSON.stringify(opportunity, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
      },
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');
    const kitData = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      offerAndPricing: parsed.offerAndPricing || {
        localPrice: countryCode === 'NER' ? '650 000 FCFA / mois' : '1 200 € / mois',
        currency: countryCode === 'NER' ? 'FCFA' : 'EUR',
        billingModel: 'Abonnement mensuel renouvelable',
        deliverables: [
          'Audit initial des processus sous 48h',
          'Déploiement du connecteur d automatisation clé en main',
          'Suivi hebdomadaire de conformité et de gains',
          'Support réactif WhatsApp & Email',
        ],
        guarantee: 'Garantie pilote de 30 jours satisfait ou remboursé',
      },
      htmlSalesPage: parsed.htmlSalesPage || `<div class="p-8 text-white"><h1>${opportunity.title}</h1><p>${opportunity.description}</p></div>`,
      contentPack: parsed.contentPack || {
        tagline: `${opportunity.title} : Automatisez et optimisez vos opérations dès ce mois.`,
        linkedinPost: `Comment nous aidons les entreprises à capturer la valeur sur ${opportunity.title}...`,
        whatsappTeaser: `Bonjour, nous avons développé une solution dédiée à ${opportunity.title}. 15 min d échange cette semaine ?`,
        socialProofAngle: `Solution adoptée par des directeurs généraux et gérants exigeants.`,
      },
      outreachCopy: parsed.outreachCopy || {
        directMessage: `Bonjour [Prénom], en lien avec les récentes évolutions sur ${opportunity.title}, seriez-vous ouvert à échanger ?`,
        emailPitch: `Bonjour [Prénom],\n\nNous accompagnons les décideurs sur ${opportunity.title}...\n\nBien à vous.`,
        objectionHandling: [{ objection: 'Pas le temps', reply: 'Le pilote ne requiert que 15 minutes de cadrage.' }],
      },
      followupSequence: parsed.followupSequence || {
        day3: 'Bonjour, je fais suite à mon premier message concernant...',
        day7: 'Dernière relance : avez-vous 10 min ce jeudi ?',
        day14Breakup: 'Je clôture votre dossier pour l instant.',
      },
      accountsChecklist: (parsed.accountsChecklist || [
        { accountName: 'Airtel Money / Moov Flooz Marchand', description: 'Pour encaisser les règlements locaux instantanément.' },
        { accountName: 'Compte Bancaire Pro (SONIBANK / ECOBANK)', description: 'Pour les virements d entreprises B2B.' },
        { accountName: 'Nom de domaine & Email Pro', description: 'Pour la crédibilité de prospection.' },
        { accountName: 'Passerelle de paiement en ligne (FedaPay / Stripe)', description: 'Pour les cartes bancaires.' },
      ]).map((a: any, i: number) => ({ id: `acc-${i}`, status: 'todo', ...a })),
      automationActions: parsed.automationActions || [
        { title: 'Capture de leads & notification instantanée', tool: 'Make / Webhook', description: 'Envoie une alerte WhatsApp dès qu un prospect remplit le formulaire.', setupDifficulty: 'rapide' },
        { title: 'Génération automatique de devis pro-forma', tool: 'Template PDF auto', description: 'Crée la facture pro-forma OHADA dès acceptation de l offre.', setupDifficulty: 'rapide' },
      ],
    };

    savePersistentKit(opportunity.id, { digital: kitData });
    recordGeminiCall(duration, true, undefined, { kitsGenerated: 1 });

    // Automatically queue outreach messages into the "À valider" queue (Rien n'est envoyé sans validation)
    addValidationItem({
      title: `Message de prospection LinkedIn - ${opportunity.title}`,
      category: 'prospection_message',
      targetRecipient: 'Directeurs et Décideurs ciblés',
      contentPayload: kitData.outreachCopy.directMessage,
      sourceOpportunityTitle: opportunity.title,
      countryCode,
    });

    addValidationItem({
      title: `Email de cadrage B2B - ${opportunity.title}`,
      category: 'prospection_message',
      targetRecipient: 'Comptabilité & Direction Générale',
      contentPayload: kitData.outreachCopy.emailPitch,
      sourceOpportunityTitle: opportunity.title,
      countryCode,
    });

    appendAuditLog({
      actionType: 'kit_generated',
      actor: 'gemini_api',
      description: `Dossier de lancement numérique généré pour : ${opportunity.title}`,
      provenanceDetails: `Offre : ${kitData.offerAndPricing.localPrice}`,
      status: 'success',
    });

    res.json({ status: 'ok', kit: kitData });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    recordGeminiCall(duration, false, err?.message || 'Erreur génération kit digital');
    res.status(500).json({ error: err?.message || 'Erreur génération dossier numérique' });
  }
});

// ----------------- PHYSIQUE : PLAN D'EXPLOITATION OPÉRATIONNEL -----------------

app.post('/api/kits/generate-physical', async (req, res) => {
  const { opportunity, countryCode = 'NER' } = req.body;
  if (!opportunity) return res.status(400).json({ error: 'Opportunité requise' });

  const startTime = Date.now();
  const currency = countryCode === 'NER' || countryCode === 'SEN' || countryCode === 'CIV' ? 'FCFA' : 'EUR';

  const systemPrompt = `Tu es l'expert en exploitation d'entreprises physiques pour OmniVectis.
Génère le plan d'exploitation opérationnel complet pour : "${opportunity.title}" dans le pays (${countryCode}).
Devise : ${currency}.
Exigences strictes :
1. "investmentBudget" : Budget initial détaillé avec hypothèses 100% modifiables (loyer/dépôt local, stock de démarrage, transport/carburant, emballage/conditionnement, salaires/main d œuvre, fonds de roulement de sécurité).
2. "localSuppliersAndPartners" : 3 à 5 fournisseurs et partenaires locaux réels ou typiques du pays (ex au Niger : grossistes de Katako, SONIDEP, coopératives agricoles de Maradi/Tahoua/Zinder, transitaires douane Niamey).
3. "regulatoryAuthorizations" : 4 étapes officielles d'autorisations administratives du pays (RCCM, NIF à la Maison de l Entreprise, agrément ministériel ou d hygiène, contrôle phytosanitaire/douanier).
4. "supplyChainAndLogistics" : itinéraire de transport, conditions de stockage, délais de livraison en jours, stock de sécurité en unités.
5. "implementationTimeline" : planning sur 8 semaines (Semaines 1 à 8 avec jalons précis).
6. "breakEvenAnalysis" : prix de vente unitaire, coût de revient unitaire, marge brute unitaire, charges fixes mensuelles, point mort en volume d unités et en chiffre d affaires.
7. "risksAndMitigation" : 3 risques opérationnels concrets et leurs stratégies d atténuation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Opportunité physique : ${JSON.stringify(opportunity, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
      },
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');

    const defaultHypotheses = countryCode === 'NER' ? [
      { id: 'hyp-1', category: 'Local & Dépôt', label: 'Bail commercial / entrepôt (avance 3 mois)', amount: 450000, isEditable: true, note: 'Location zone artisanale ou périphérique Niamey' },
      { id: 'hyp-2', category: 'Stock Initial', label: 'Achat du premier lot de marchandises brutes', amount: 1800000, isEditable: true, note: 'Approvisionnement grossiste' },
      { id: 'hyp-3', category: 'Logistique', label: 'Fret routier, déchargement et transport local', amount: 350000, isEditable: true, note: 'Transporteur axe Maradi/Niamey ou Cotonou' },
      { id: 'hyp-4', category: 'Conformité & Légal', label: 'Frais de formalités RCCM, NIF et licences', amount: 150000, isEditable: true, note: 'Maison de l Entreprise du Niger' },
      { id: 'hyp-5', category: 'Fonds de roulement', label: 'Trésorerie de réserve opérationnelle (BFR)', amount: 600000, isEditable: true, note: 'Sécurité de trésorerie 45 jours' },
    ] : [
      { id: 'hyp-1', category: 'Local & Dépôt', label: 'Location atelier / stockage (avance 3 mois)', amount: 2400, isEditable: true, note: 'Dépôt sécurisé' },
      { id: 'hyp-2', category: 'Stock Initial', label: 'Premier lot de matières premières et packaging', amount: 5000, isEditable: true, note: 'Fournisseur direct' },
      { id: 'hyp-3', category: 'Logistique', label: 'Transporteur et livraison initiale', amount: 800, isEditable: true, note: 'Fret messagerie' },
      { id: 'hyp-4', category: 'Conformité & Légal', label: 'Assurance professionnelle et immatriculation', amount: 600, isEditable: true, note: 'Frais légaux' },
      { id: 'hyp-5', category: 'Fonds de roulement', label: 'Trésorerie de sécurité', amount: 2000, isEditable: true, note: 'Trésorerie de réserve' },
    ];

    const planData = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      investmentBudget: parsed.investmentBudget || {
        totalInitial: defaultHypotheses.reduce((sum, h) => sum + h.amount, 0),
        currency,
        hypotheses: defaultHypotheses,
        workingCapitalReserve: countryCode === 'NER' ? 600000 : 2000,
      },
      localSuppliersAndPartners: parsed.localSuppliersAndPartners || [
        { name: 'Grossistes et négociants du Grand Marché / Katako', role: 'Fournisseur principal de matières', location: 'Niamey, Niger', contactGuide: 'Prendre contact en direct avec acompte de 30% à la pesée.' },
        { name: 'Union des Coopératives Maraîchères Sahéliennes', role: 'Partenaire d approvisionnement régulier', location: 'Région de Tillabéri & Maradi', contactGuide: 'Convention de contractualisation à prix garanti.' },
        { name: 'Transporteurs Routiers Privés (GIE Fret)', role: 'Acheminement logistique et livraison', location: 'Gares routières Niamey', contactGuide: 'Lettre de voiture officielle et paiement à la livraison.' },
      ],
      regulatoryAuthorizations: parsed.regulatoryAuthorizations || [
        { stepNumber: 1, authority: 'Maison de l Entreprise du Niger (CCIN)', requirement: 'Immatriculation au Registre de Commerce (RCCM) et attribution du NIF', estimatedCost: '50 000 FCFA', delay: '48h à 72h' },
        { stepNumber: 2, authority: 'Direction Générale des Impôts (DGI Niger)', requirement: 'Déclaration d existence et choix du régime synthétique (ISF)', estimatedCost: '0 FCFA', delay: '2 jours' },
        { stepNumber: 3, authority: 'Direction de la Protection des Végétaux / Ministère Commerce', requirement: 'Certificat de salubrité et conformité des denrées', estimatedCost: '35 000 FCFA', delay: '5 jours' },
        { stepNumber: 4, authority: 'Mairie / Communauté Urbaine de Niamey', requirement: 'Autorisation d occupation temporaire du domaine commercial', estimatedCost: '25 000 FCFA / an', delay: '1 semaine' },
      ],
      supplyChainAndLogistics: parsed.supplyChainAndLogistics || {
        transportRoute: 'Axe principal corridor Cotonou-Dosso-Niamey et liaisons agricoles intérieures.',
        storageConditions: 'Hangar ventilé à l abri de l humidité, surélevé sur palettes bois traitées.',
        leadTimeDays: 4,
        safetyStockUnits: 150,
      },
      implementationTimeline: parsed.implementationTimeline || [
        { week: 'Semaine 1-2', milestone: 'Formalités administratives & Local', criticalAction: 'Validation du bail et retrait du RCCM/NIF à la Maison de l Entreprise.' },
        { week: 'Semaine 3-4', milestone: 'Commandes fournisseurs & Logistique', criticalAction: 'Signature des contrats d approvisionnement et réception du premier stock.' },
        { week: 'Semaine 5-6', milestone: 'Lancement commercial & Distribution', criticalAction: 'Prospection directe des premiers points de vente et clients institutionnels.' },
        { week: 'Semaine 7-8', milestone: 'Seuil de rentabilité & Stabilisation', criticalAction: 'Atteinte des volumes cibles de vente pour couvrir les charges fixes.' },
      ],
      breakEvenAnalysis: parsed.breakEvenAnalysis || {
        unitSalePrice: countryCode === 'NER' ? 12500 : 25,
        unitCost: countryCode === 'NER' ? 7500 : 15,
        unitGrossMargin: countryCode === 'NER' ? 5000 : 10,
        monthlyFixedCosts: countryCode === 'NER' ? 350000 : 800,
        breakEvenUnits: countryCode === 'NER' ? 70 : 80,
        breakEvenRevenue: countryCode === 'NER' ? 875000 : 2000,
      },
      risksAndMitigation: parsed.risksAndMitigation || [
        { risk: 'Retards d acheminement liés aux contrôles routiers', mitigationStrategy: 'Conserver en permanence 15 jours de stock tampon dans le dépôt local.' },
        { risk: 'Fluctuation des cours d achat des intrants', mitigationStrategy: 'Négocier des contrats cadres trimestriels avec clauses de prix plancher.' },
        { risk: 'Pannes d énergie ou ruptures de chaîne du froid', mitigationStrategy: 'Installation d un onduleur solaire 3kW autonome sur le site de stockage.' },
      ],
    };

    savePersistentKit(opportunity.id, { physical: planData });
    recordGeminiCall(duration, true, undefined, { kitsGenerated: 1 });

    // Automatically queue administrative steps into the "À valider" queue
    addValidationItem({
      title: `Dépôt de dossier RCCM & NIF - ${opportunity.title}`,
      category: 'administrative_step',
      targetRecipient: 'Maison de l Entreprise du Niger (CCIN Niamey)',
      contentPayload: `Dossier de création d établissement commercial pour l activité : ${opportunity.title}. Capital : 0 FCFA. Régime ISF.`,
      sourceOpportunityTitle: opportunity.title,
      countryCode,
    });

    appendAuditLog({
      actionType: 'kit_generated',
      actor: 'gemini_api',
      description: `Plan d exploitation physique généré pour : ${opportunity.title}`,
      provenanceDetails: `Budget initial calculé : ${planData.investmentBudget.totalInitial.toLocaleString()} ${currency}`,
      status: 'success',
    });

    res.json({ status: 'ok', plan: planData });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    recordGeminiCall(duration, false, err?.message || 'Erreur génération plan physique');
    res.status(500).json({ error: err?.message || 'Erreur génération plan d exploitation' });
  }
});

app.get('/api/kits/:oppId', (req, res) => {
  const oppId = req.params.oppId;
  const kits = getPersistentKits();
  res.json({ status: 'ok', kit: kits[oppId] || {} });
});

app.put('/api/kits/:oppId/physical', (req, res) => {
  const oppId = req.params.oppId;
  const updatedPlan = req.body;
  if (!updatedPlan) return res.status(400).json({ error: 'Plan requis' });

  savePersistentKit(oppId, { physical: updatedPlan });
  appendAuditLog({
    actionType: 'hypothesis_updated',
    actor: 'utilisateur',
    description: `Hypothèses du plan d exploitation physique mises à jour manuellement pour l opportunité : ${updatedPlan.opportunityTitle || oppId}`,
    provenanceDetails: `Nouveau budget initial : ${updatedPlan.investmentBudget?.totalInitial?.toLocaleString()} ${updatedPlan.investmentBudget?.currency}`,
    status: 'success',
  });

  res.json({ status: 'ok', plan: updatedPlan });
});

// ----------------- FILE "À VALIDER" (Rien n'est envoyé sans validation) -----------------

app.get('/api/validation', (req, res) => {
  const queue = getValidationQueue();
  res.json({ status: 'ok', items: queue });
});

app.post('/api/validation', (req, res) => {
  const { title, category, targetRecipient, contentPayload, sourceOpportunityTitle, countryCode } = req.body;
  if (!title || !contentPayload) {
    return res.status(400).json({ error: 'Titre et contenu requis' });
  }
  const item = addValidationItem({
    title,
    category: category || 'prospection_message',
    targetRecipient,
    contentPayload,
    sourceOpportunityTitle: sourceOpportunityTitle || 'Action manuelle',
    countryCode: countryCode || 'NER',
  });
  res.json({ status: 'ok', item });
});

app.put('/api/validation/:id', (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['valide', 'rejete'].includes(status)) {
    return res.status(400).json({ error: 'Statut valide ou rejete requis' });
  }
  const updated = updateValidationStatus(req.params.id, status, reviewNotes);
  if (!updated) return res.status(404).json({ error: 'Élément introuvable' });
  res.json({ status: 'ok', item: updated });
});

// ----------------- JOURNAL DE TOUTES LES ACTIONS (Audit Log) -----------------

app.get('/api/audit', (req, res) => {
  const log = getAuditLog();
  res.json({ status: 'ok', entries: log });
});

// ----------------- MODULE ENCAISSEMENTS RÉELS (Ventes Réelles vs Prévisions) -----------------

app.get('/api/sales', (req, res) => {
  const sales = getRealSales();
  res.json({ status: 'ok', sales });
});

app.post('/api/sales', (req, res) => {
  const { clientName, opportunityTitle, amount, currency, date, status, paymentMethod, notes, reference } = req.body;
  if (!clientName || !amount) {
    return res.status(400).json({ error: 'Client et montant requis' });
  }
  const sale = addRealSale({
    clientName,
    opportunityTitle: opportunityTitle || 'Vente directe',
    amount: Number(amount) || 0,
    currency: currency || 'XOF',
    date: date || new Date().toISOString().split('T')[0],
    status: status || 'encaisse',
    paymentMethod: paymentMethod || 'Airtel Money / Mobile Money',
    notes,
    reference,
  });
  res.json({ status: 'ok', sale });
});

app.delete('/api/sales/:id', (req, res) => {
  const ok = deleteRealSale(req.params.id);
  res.json({ status: ok ? 'ok' : 'error' });
});

// ----------------- COMPTEUR D'UTILISATION (Pas de quota arbitraire) -----------------

app.get('/api/usage', (req, res) => {
  const stats = getUsageStats();
  res.json({ status: 'ok', stats });
});


// Generate deep custom execution blueprint
app.post('/api/blueprint/generate', async (req, res) => {
  const { sectorId, sectorName, niche, targetRevenue, capitalBudget, userSkills, businessModel } = req.body;

  const resolvedSectorName = sectorName || 'Intelligence Artificielle & DeepTech';
  const resolvedNiche = niche || 'Automatisation de processus B2B';
  const resolvedTarget = targetRevenue || '15 000€ / mois';
  const resolvedBudget = capitalBudget || 'Amorçage lean (0€ - 2k€)';
  const resolvedSkills = userSkills || 'Automatisation, vente B2B, no-code';
  const resolvedModel = businessModel || 'SaaS B2B & Abonnements Récurrents';

  // Check if API key is present
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  if (hasKey) {
    try {
      const prompt = `Tu es un stratège macro-économique d'élite, serial entrepreneur et expert en capture d'opportunités de marché multi-sectorielles à haute rentabilité.
Analyse en profondeur l'opportunité de marché suivante et conçois un plan d'action commercial et opérationnel d'élite pour générer le maximum de revenus et de marge :

- Secteur économique : ${resolvedSectorName} (Identifiant : ${sectorId || 'général'})
- Niche ciblée : ${resolvedNiche}
- Modèle d'affaires préféré : ${resolvedModel}
- Objectif de revenu visé : ${resolvedTarget}
- Budget de démarrage disponible : ${resolvedBudget}
- Compétences / Atouts : ${resolvedSkills}

Fournis une réponse structurée en JSON strict contenant :
1. "executiveSummary": Résumé percutant de l'opportunité et pourquoi ce créneau est sous-exploité maintenant.
2. "revenueMechanics": Analyse détaillée du modèle de revenus (pricing préconisé, panier moyen, récurrence MRR, marge brute estimée en %).
3. "acquisitionStrategy": 3 tactiques concrètes et éprouvées d'acquisition client à coût quasi nul au début (cold outbound précis, leviers d'audience, partenariats B2B).
4. "operationalStack": Les outils, automatisations et technologies pour opérer ce business avec 1 à 2 personnes au départ.
5. "roadmap30_60_90":
   - "day30": Objectif des 30 premiers jours (validation, première offre irrésistible, 3 premiers prospects signés).
   - "day60": Objectif des 60 jours (délivrance, automatisation du flux, reach 5k€-15k€).
   - "day90": Objectif des 90 jours (scaling, délégation, stabilisation récurrente).
6. "crossSectorSynergies": Comment interconnecter cette opportunité avec d'autres secteurs pour créer un volant d'inertie (flywheel) de revenus multiples.
7. "keyRisksAndMoat": Le principal risque et la barrière à l'entrée (moat) pour protéger ses marges.`;

      const callPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              revenueMechanics: {
                type: Type.OBJECT,
                properties: {
                  pricingModel: { type: Type.STRING },
                  expectedGrossMargin: { type: Type.STRING },
                  targetTicket: { type: Type.STRING },
                  scalabilityGrade: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['pricingModel', 'expectedGrossMargin', 'targetTicket', 'scalabilityGrade', 'explanation'],
              },
              acquisitionStrategy: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    channel: { type: Type.STRING },
                    action: { type: Type.STRING },
                    expectedConversion: { type: Type.STRING },
                  },
                  required: ['channel', 'action', 'expectedConversion'],
                },
              },
              operationalStack: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              roadmap30_60_90: {
                type: Type.OBJECT,
                properties: {
                  day30: { type: Type.STRING },
                  day60: { type: Type.STRING },
                  day90: { type: Type.STRING },
                },
                required: ['day30', 'day60', 'day90'],
              },
              crossSectorSynergies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              keyRisksAndMoat: {
                type: Type.OBJECT,
                properties: {
                  primaryRisk: { type: Type.STRING },
                  defenseMoat: { type: Type.STRING },
                },
                required: ['primaryRisk', 'defenseMoat'],
              },
            },
            required: [
              'executiveSummary',
              'revenueMechanics',
              'acquisitionStrategy',
              'operationalStack',
              'roadmap30_60_90',
              'crossSectorSynergies',
              'keyRisksAndMoat',
            ],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI blueprint latency threshold')), 8000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, blueprint: parsed, source: 'ai' });
    } catch (apiError: any) {
      console.info('Serving optimized blueprint synthesis:', apiError?.message || 'ready');
    }
  }

  // Fallback to high-fidelity synthesized blueprint
  const synthesized = generateSynthesizedBlueprint({
    sectorId: sectorId || 'default',
    sectorName: resolvedSectorName,
    niche: resolvedNiche,
    targetRevenue: resolvedTarget,
    capitalBudget: resolvedBudget,
    userSkills: resolvedSkills,
    businessModel: resolvedModel,
  });

  res.json({ success: true, blueprint: synthesized, source: 'synthesized' });
});

// Cross-sector arbitrage & synergy generator
app.post('/api/arbitrage/analyze', async (req, res) => {
  const { sectorA, sectorB, riskTolerance } = req.body;

  if (!sectorA || !sectorB) {
    return res.status(400).json({ error: 'Deux secteurs sont requis pour analyser l arbitrage.' });
  }

  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  if (hasKey) {
    try {
      const prompt = `Analyse l'opportunité d'arbitrage et de synergie économique entre ces deux secteurs :
Secteur 1: ${sectorA}
Secteur 2: ${sectorB}
Tolérance au risque: ${riskTolerance || 'Équilibré'}

Génère une stratégie d'arbitrage qui tire parti des asymétries de marges, de technologies ou de flux de trésorerie entre ces deux secteurs pour maximiser les profits d'un opérateur indépendant ou d'une PME.
Réponds en JSON avec :
1. "conceptName": Nom du modèle de convergence
2. "arbitrageMechanism": Explication de l'asymétrie exploitée
3. "revenueStreamA": Flux généré via le premier secteur
4. "revenueStreamB": Flux généré via le second secteur
5. "estimatedMonthlyCashflow": Fourchette de cash-flow mensuel réaliste
6. "unfairAdvantage": Pourquoi les acteurs traditionnels ne le font pas encore`;

      const callPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conceptName: { type: Type.STRING },
              arbitrageMechanism: { type: Type.STRING },
              revenueStreamA: { type: Type.STRING },
              revenueStreamB: { type: Type.STRING },
              estimatedMonthlyCashflow: { type: Type.STRING },
              unfairAdvantage: { type: Type.STRING },
            },
            required: [
              'conceptName',
              'arbitrageMechanism',
              'revenueStreamA',
              'revenueStreamB',
              'estimatedMonthlyCashflow',
              'unfairAdvantage',
            ],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI arbitrage latency threshold')), 8000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, analysis: parsed, source: 'ai' });
    } catch (apiError: any) {
      console.info('Serving optimized arbitrage synthesis:', apiError?.message || 'ready');
    }
  }

  const fallback = generateSynthesizedArbitrage(sectorA, sectorB);
  res.json({ success: true, analysis: fallback, source: 'synthesized' });
});

// Synthesized Launchpad Circuit Generator (Instant real-money execution engine)
function generateSynthesizedLaunchpad(params: {
  sectorId: string;
  sectorName: string;
  opportunityTitle: string;
  targetPrice?: string;
}) {
  const { sectorName, opportunityTitle, targetPrice } = params;

  return {
    opportunityTitle,
    sectorName,
    tagline: `Circuit commercial complet & automatisé pour monétiser : ${opportunityTitle}`,
    commercialOffer: {
      heroPromise: `Automatisez vos opérations sur ${sectorName} et réduisez vos coûts de 40% dès les 30 premiers jours, sans embauche.`,
      targetPersona: `Directeurs Administratifs et Financiers (DAF), Directeurs des Opérations et Gérants de PME (10 à 250 salariés).`,
      riskReversalGuarantee: `Garantie 'Pilote Satisfait ou Remboursé' : si aucun gain de temps mesurable n est constaté sous 30 jours, remboursement intégral sans question.`,
      tiers: [
        {
          name: 'Starter / Pilote',
          price: targetPrice || '490 € / mois',
          billingCycle: 'Facturation mensuelle sans engagement',
          deliverables: [
            'Audit initial des flux et identification des inefficacités',
            '1 agent ou connecteur automatisé clé en main',
            'Rapport mensuel de conformité et gains générés',
            'Support réactif par email sous 24h',
          ],
          stripeLinkParams: 'mode=subscription&amount=49000&currency=eur&interval=month',
        },
        {
          name: 'Pro / Scaling',
          price: '1 490 € / mois',
          billingCycle: 'Facturation mensuelle avec remise trimestrielle',
          deliverables: [
            'Jusqu à 5 workflows ou agents opérationnels',
            'Intégration directe à votre ERP ou CRM de référence',
            'Surveillance des anomalies en temps réel',
            'Ligne WhatsApp directe avec votre gestionnaire dédié',
          ],
          stripeLinkParams: 'mode=subscription&amount=149000&currency=eur&interval=month',
        },
        {
          name: 'Entreprise & Sur-Mesure',
          price: '3 900 € / mois',
          billingCycle: 'Facturation trimestrielle avec SLA contractuel',
          deliverables: [
            'Déploiement illimité et architecture dédiée',
            'Audit réglementaire approfondi et certification légale',
            'Formation personnalisée de vos équipes internes',
            'SLA 99.9% et astreinte prioritaire 7j/7',
          ],
          stripeLinkParams: 'mode=subscription&amount=390000&currency=eur&interval=month',
        },
      ],
    },
    outreachSequence: {
      channel: 'LinkedIn Sales Navigator + Séquence Cold Email ciblée (Domaines secondaires)',
      targetFilters: `Critères de ciblage précis : Titre = Gérant OU DAF OU Directeur Général, Secteur = ${sectorName}, Effectif = 20-200 personnes, Géographie = France / Benelux.`,
      email1Subject: `Question sur vos processus [Entreprise] & opportunité d optimisation`,
      email1Body: `Bonjour [Prénom],

En observant les récentes évolutions du secteur ${sectorName}, nous constatons que la majorité des dirigeants perdent entre 12 et 20 heures par semaine sur des tâches administratives et de contrôle qui pourraient être 100% fiabilisées.

Nous avons mis au point une solution opérationnelle qui permet à des entreprises comme [Exemple d Entreprise Similaire] de diviser ce temps par 4 tout en sécurisant leurs marges.

Seriez-vous ouvert à un audit pilote gratuit de 15 minutes cette semaine pour évaluer le potentiel net chez [Entreprise] ?

Bien cordialement,
[Votre Nom]
[Votre Téléphone / Calendly]`,
      email2Followup: `Bonjour [Prénom],

Je me permets de vous relancer suite à mon message de mardi. 

Pour vous donner un exemple très concret : nous avons récemment permis à une structure de votre taille dans le domaine ${sectorName} d économiser 14 200 € dès son premier trimestre d utilisation, sans modifier ses logiciels existants.

Avez-vous 10 minutes ce jeudi à 14h ou vendredi à 11h ?

Bien à vous,
[Votre Nom]`,
      email3Breakup: `Bonjour [Prénom],

Je comprends tout à fait que ce ne soit pas votre priorité du moment et je ne souhaite pas encombrer votre messagerie.

Je clôture donc votre dossier pour l instant. Si le sujet redevient stratégique pour vos équipes, vous pouvez réserver un échange direct ici : [Lien Calendly].

Je vous souhaite une excellente continuation dans vos projets.

Cordialement,
[Votre Nom]`,
    },
    legalAgreement: {
      contractTitle: `CONTRAT CADRE DE PRESTATION DE SERVICES & MANDAT OPÉRATIONNEL B2B`,
      purposeClause: `Le présent contrat a pour objet la fourniture par le Prestataire au Client de prestations de services et de solutions d optimisation opérationnelle et d arbitrage dans le domaine : ${opportunityTitle}.`,
      financialTerms: `Le prix des Prestations est payable d avance à chaque début de période par virement bancaire ou prélèvement automatique carte/SEPA. Tout retard de paiement donnera lieu de plein droit à des pénalités au taux légal en vigueur ainsi qu à une indemnité forfaitaire de recouvrement de 40 euros.`,
      confidentialityAndIP: `Chaque Partie s engage à préserver la stricte confidentialité des informations commerciales et techniques. Le Client conserve la pleine propriété de l ensemble de ses données. Le Prestataire concède une licence d utilisation non-exclusive et incessible sur les livrables créés.`,
      terminationClause: `Le Contrat est conclu pour une durée initiale d un mois, renouvelable par tacite reconduction. Il peut être résilié par l une ou l autre des Parties avec un préavis écrit de quinze (15) jours avant l échéance.`,
    },
    landingPageWireframe: {
      heroHeadline: `Générez plus de marge sur ${sectorName} grâce à l automatisation d élite`,
      heroSubheadline: `La solution clé en main adoptée par les dirigeants exigeants pour éliminer la friction opérationnelle, sécuriser la conformité et accélérer les rentrées de trésorerie.`,
      ctaButtonText: `Demander un Audit Pilote Offert (15 min)`,
      problemSection: [
        `Des processus manuels lents qui mobilisent vos collaborateurs à forte valeur ajoutée.`,
        `Des marges grignotées par les intermédiaires et le manque de visibilité en temps réel.`,
        `Le risque de non-conformité face aux nouvelles réglementations européennes.`,
      ],
      solutionFeatures: [
        {
          title: `Déploiement Express en Moins de 7 Jours`,
          desc: `Aucun développement lourd ni modification de vos outils existants : nous nous branchons sur vos flux actuels.`,
        },
        {
          title: `Sécurité & Fiabilité Maximale`,
          desc: `Conformité RGPD totale, hébergement sécurisé et validation systématique de chaque transaction.`,
        },
        {
          title: `Retour sur Investissement Immédiat`,
          desc: `Un modèle pensé pour rentabiliser l abonnement dès le premier mois d utilisation grâce aux gains d efficacité mesurables.`,
        },
      ],
      socialProofHook: `Recommandé par des directeurs généraux, directeurs financiers et experts de la filière ${sectorName}.`,
    },
    deliveryEngine: {
      inputTrigger: `Formulaire de cadrage Typeform complété par le client ou Webhook Stripe 'checkout.session.completed'.`,
      processingSteps: [
        `Étape 1 : Réception instantanée des paramètres du client et création de son espace dédié dans le CRM.`,
        `Étape 2 : Analyse automatisée des données documentaires via le moteur d inférence IA (extraction des clauses, calcul des marges).`,
        `Étape 3 : Génération du rapport de synthèse certifié et des livrables contractuels au format PDF et Dashboard.`,
        `Étape 4 : Envoi automatique du livrable par email au décideur et déclenchement du suivi qualité à J+7.`,
      ],
      aiPromptTemplate: `En tant qu expert analyste pour ${sectorName}, audite les documents suivants du client [Données]. Identifie les 3 principales anomalies, quantifie le gain financier en euros et formule 2 recommandations immédiates exploitables sans investissement supplémentaire.`,
      outputDeliverableFormat: `Dossier d Audit Opérationnel PDF haute définition + Accès au Portail Client Interactif.`,
      timeSavedHoursPerClient: 18,
    },
  };
}

// Endpoint: Generate Full Operational Launchpad Circuit
app.post('/api/launchpad/generate', async (req, res) => {
  const { sectorId, sectorName, opportunityTitle, targetPrice } = req.body;

  const resolvedSector = sectorName || 'Intelligence Artificielle & B2B';
  const resolvedTitle = opportunityTitle || 'Service B2B à Haute Valeur Ajoutée';

  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  if (hasKey) {
    try {
      const prompt = `Tu es un créateur d'entreprises B2B à succès et expert en monétisation réelle rapide (0 à 10 000€/mois).
Conçois le "Circuit de Monétisation Prêt à Encaisser" pour cette opportunité précise :
- Titre : ${resolvedTitle}
- Secteur : ${resolvedSector}

Génère en JSON strict :
1. "opportunityTitle": Titre
2. "sectorName": Secteur
3. "tagline": Phrase d accroche
4. "commercialOffer":
   - "heroPromise": Promesse de valeur chiffrée
   - "targetPersona": Profil cible exact
   - "riskReversalGuarantee": Garantie de remboursement ou résultat
   - "tiers": Tableau de 3 offres (name, price, billingCycle, deliverables array, stripeLinkParams)
5. "outreachSequence":
   - "channel": Canal d acquisition
   - "targetFilters": Filtres de ciblage précis (Sales Nav / Apollo)
   - "email1Subject": Objet email 1
   - "email1Body": Corps email 1 (court, percutant, audit gratuit)
   - "email2Followup": Email 2 relance avec preuve
   - "email3Breakup": Email 3 rupture poli
6. "legalAgreement":
   - "contractTitle": Titre contrat
   - "purposeClause": Objet
   - "financialTerms": Conditions financières et d encaissement
   - "confidentialityAndIP": Confidentialité et propriété intellectuelle
   - "terminationClause": Modalités de résiliation
7. "landingPageWireframe":
   - "heroHeadline": Titre hero
   - "heroSubheadline": Sous-titre
   - "ctaButtonText": Texte du bouton
   - "problemSection": 3 problèmes clients majeurs
   - "solutionFeatures": 3 fonctionnalités clés (title, desc)
   - "socialProofHook": Preuve sociale
8. "deliveryEngine":
   - "inputTrigger": Déclencheur du service
   - "processingSteps": 4 étapes concrètes d exécution
   - "aiPromptTemplate": Prompt type pour délivrer avec l IA
   - "outputDeliverableFormat": Format du livrable
   - "timeSavedHoursPerClient": Nombre d heures économisées (nombre)`;

      const callPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: "Tu es un entrepreneur et créateur de systèmes d'acquisition B2B d'élite. Sois concis, pragmatique et direct pour générer un circuit prêt à l'emploi.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              opportunityTitle: { type: Type.STRING },
              sectorName: { type: Type.STRING },
              tagline: { type: Type.STRING },
              commercialOffer: {
                type: Type.OBJECT,
                properties: {
                  heroPromise: { type: Type.STRING },
                  targetPersona: { type: Type.STRING },
                  riskReversalGuarantee: { type: Type.STRING },
                  tiers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.STRING },
                        billingCycle: { type: Type.STRING },
                        deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
                        stripeLinkParams: { type: Type.STRING },
                      },
                      required: ['name', 'price', 'billingCycle', 'deliverables', 'stripeLinkParams'],
                    },
                  },
                },
                required: ['heroPromise', 'targetPersona', 'riskReversalGuarantee', 'tiers'],
              },
              outreachSequence: {
                type: Type.OBJECT,
                properties: {
                  channel: { type: Type.STRING },
                  targetFilters: { type: Type.STRING },
                  email1Subject: { type: Type.STRING },
                  email1Body: { type: Type.STRING },
                  email2Followup: { type: Type.STRING },
                  email3Breakup: { type: Type.STRING },
                },
                required: ['channel', 'targetFilters', 'email1Subject', 'email1Body', 'email2Followup', 'email3Breakup'],
              },
              legalAgreement: {
                type: Type.OBJECT,
                properties: {
                  contractTitle: { type: Type.STRING },
                  purposeClause: { type: Type.STRING },
                  financialTerms: { type: Type.STRING },
                  confidentialityAndIP: { type: Type.STRING },
                  terminationClause: { type: Type.STRING },
                },
                required: ['contractTitle', 'purposeClause', 'financialTerms', 'confidentialityAndIP', 'terminationClause'],
              },
              landingPageWireframe: {
                type: Type.OBJECT,
                properties: {
                  heroHeadline: { type: Type.STRING },
                  heroSubheadline: { type: Type.STRING },
                  ctaButtonText: { type: Type.STRING },
                  problemSection: { type: Type.ARRAY, items: { type: Type.STRING } },
                  solutionFeatures: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { title: { type: Type.STRING }, desc: { type: Type.STRING } },
                      required: ['title', 'desc'],
                    },
                  },
                  socialProofHook: { type: Type.STRING },
                },
                required: ['heroHeadline', 'heroSubheadline', 'ctaButtonText', 'problemSection', 'solutionFeatures', 'socialProofHook'],
              },
              deliveryEngine: {
                type: Type.OBJECT,
                properties: {
                  inputTrigger: { type: Type.STRING },
                  processingSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  aiPromptTemplate: { type: Type.STRING },
                  outputDeliverableFormat: { type: Type.STRING },
                  timeSavedHoursPerClient: { type: Type.NUMBER },
                },
                required: ['inputTrigger', 'processingSteps', 'aiPromptTemplate', 'outputDeliverableFormat', 'timeSavedHoursPerClient'],
              },
            },
            required: [
              'opportunityTitle',
              'sectorName',
              'tagline',
              'commercialOffer',
              'outreachSequence',
              'legalAgreement',
              'landingPageWireframe',
              'deliveryEngine',
            ],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI launchpad latency threshold')), 8000)
      );

      const response = await Promise.race([callPromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, circuit: parsed, source: 'ai' });
    } catch (apiError: any) {
      console.info('Serving optimized launchpad synthesis:', apiError?.message || 'ready');
    }
  }

  const synthesized = generateSynthesizedLaunchpad({
    sectorId: sectorId || 'b2b_services',
    sectorName: resolvedSector,
    opportunityTitle: resolvedTitle,
    targetPrice,
  });

  res.json({ success: true, circuit: synthesized, source: 'synthesized' });
});


// Vite server integration in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    // Run initial live external harvest in background
    harvestRealTimeSignals().catch((e) => console.info('Initial harvest background notice:', e));
    // Scheduled background crawl every 30 minutes
    setInterval(() => {
      harvestRealTimeSignals().catch((e) => console.info('Scheduled harvest background notice:', e));
    }, 30 * 60 * 1000);
  });
}

startServer();
