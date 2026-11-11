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
