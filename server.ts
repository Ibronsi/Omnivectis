import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import {
  harvestRealTimeSignals,
  getCachedSignals,
  getCachedRates,
  getSourceHealth,
  onSignalsUpdated,
  onWorkspaceEvent,
  getPersistentPipeline,
  savePersistentPipeline,
  PersistentPipelineItem,
  getPersistentOpportunities,
  savePersistentOpportunities,
  getPersistentKits,
  savePersistentKit,
  getSavedBlueprints,
  saveBlueprintRecord,
  deleteSavedBlueprint,
  getSavedArbitrages,
  saveArbitrageRecord,
  deleteSavedArbitrage,
  getSavedLaunchpads,
  saveLaunchpadRecord,
  deleteSavedLaunchpad,
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

function hasConfiguredGeminiKey(): boolean {
  const k = process.env.GEMINI_API_KEY?.trim() || '';
  return Boolean(k && k !== 'MY_GEMINI_API_KEY');
}

async function generateGeminiJson(contents: string, config: any) {
  try {
    return await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });
  } catch (e: any) {
    if (e?.message?.includes('503') || e?.status === 503 || e?.toString().includes('high demand')) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents,
        config,
      });
    }
    throw e;
  }
}

// SSE connected clients registry
const sseClients = new Set<express.Response>();

function broadcastSseEvent(eventName: string, payload: unknown) {
  const serialized = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(serialized);
    } catch {
      sseClients.delete(client);
    }
  }
}

onSignalsUpdated((payload) => {
  broadcastSseEvent('signals_updated', {
    status: 'ok',
    lastSync: payload.lastSync,
    timestamp: payload.timestamp,
    totalSignals: payload.signals.length,
    signals: payload.signals,
    sourceHealth: payload.sourceHealth,
    rates: payload.rates,
  });
});

onWorkspaceEvent((eventName, payload) => {
  broadcastSseEvent(eventName, payload);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

// ----------------- ACCESS PASSWORD PROTECTION (APP_PASSWORD) -----------------

app.get('/api/auth/status', (req, res) => {
  const configuredPassword = process.env.APP_PASSWORD ? process.env.APP_PASSWORD.trim() : '';
  if (!configuredPassword || configuredPassword === 'MY_APP_PASSWORD') {
    return res.json({ status: 'ok', required: false, authenticated: true });
  }

  const provided =
    (req.headers['x-app-password'] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    (req.query.token as string);

  const isMatch = Boolean(provided && provided.trim() === configuredPassword);
  res.json({ status: 'ok', required: true, authenticated: isMatch });
});

app.post('/api/auth/verify', (req, res) => {
  const configuredPassword = process.env.APP_PASSWORD ? process.env.APP_PASSWORD.trim() : '';
  if (!configuredPassword || configuredPassword === 'MY_APP_PASSWORD') {
    return res.json({ status: 'ok', required: false, authenticated: true });
  }

  const { password } = req.body || {};
  if (password && password.trim() === configuredPassword) {
    return res.json({ status: 'ok', required: true, authenticated: true });
  }

  return res.status(401).json({
    status: 'error',
    error: 'Mot de passe incorrect.',
    authenticated: false,
  });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/auth/status' || req.path === '/auth/verify') {
    return next();
  }

  const configuredPassword = process.env.APP_PASSWORD ? process.env.APP_PASSWORD.trim() : '';
  if (!configuredPassword || configuredPassword === 'MY_APP_PASSWORD') {
    return next();
  }

  const provided =
    (req.headers['x-app-password'] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    (req.query.token as string);

  if (provided && provided.trim() === configuredPassword) {
    return next();
  }

  return res.status(401).json({
    error: 'Accès protégé : mot de passe requis ou invalide.',
    authenticated: false,
    code: 'UNAUTHORIZED',
  });
});

// Live Signals Harvester (Multi-country Real External Sources + Health Tracking)
app.get('/api/signals/live', async (req, res) => {
  const region = (req.query.region as string) || 'all';
  let signals = getCachedSignals();

  if (signals.length === 0) {
    try {
      signals = await harvestRealTimeSignals();
    } catch (e) {
      console.info('Harvesting error on initial request:', e);
    }
  }

  const filtered = region === 'all'
    ? signals
    : signals.filter((s) => s.region === region || (s.region === 'global' && s.isGlobal));

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  res.json({
    status: 'ok',
    lastSync: timeStr,
    timestamp: now.toISOString(),
    totalSignals: filtered.length,
    signals: filtered,
    sourceHealth: getSourceHealth(),
    rates: getCachedRates(),
  });
});

// Real-Time Server-Sent Events Stream for Signals & FX
app.get('/api/signals/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sseClients.add(res);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const currentSignals = getCachedSignals();

  res.write(
    `event: signals_snapshot\ndata: ${JSON.stringify({
      status: 'ok',
      lastSync: timeStr,
      timestamp: now.toISOString(),
      totalSignals: currentSignals.length,
      signals: currentSignals,
      sourceHealth: getSourceHealth(),
      rates: getCachedRates(),
    })}\n\n`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
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
      message: 'Signaux rafraîchis en direct depuis les sources multi-pays.',
      lastSync: timeStr,
      timestamp: now.toISOString(),
      signals: refreshed,
      sourceHealth: getSourceHealth(),
      rates: getCachedRates(),
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
    sourceStatus: rates.status || 'fallback',
    rates: {
      EUR: 1,
      XOF: rates.XOF,
      USD: rates.USD,
      lastUpdate: rates.lastUpdate,
      status: rates.status || 'fallback',
    },
    lastUpdate: rates.lastUpdate,
  });
});

// Live World Bank Macroeconomic Data (strict, no fake value fallback)
app.get('/api/worldbank/country/:iso', async (req, res) => {
  const iso = (req.params.iso || 'NER').toUpperCase();
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${iso}/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!response.ok) {
      return res.status(response.status).json({
        status: 'indisponible',
        country: iso,
        indicators: [],
        error: `Source Banque Mondiale HTTP ${response.status}`,
      });
    }
    const data = await response.json();
    res.json({
      status: 'live',
      country: iso,
      metadata: data[0] || {},
      indicators: Array.isArray(data[1]) ? data[1].filter((i: any) => i?.value !== null) : [],
    });
  } catch (e: any) {
    res.status(503).json({
      status: 'indisponible',
      country: iso,
      indicators: [],
      error: e?.message || 'Source Banque Mondiale inaccessible',
    });
  }
});

// ----------------- MULTI-DEVICE PERSISTENT PIPELINE API -----------------

app.get('/api/pipeline', (req, res) => {
  const items = getPersistentPipeline();
  res.json({ status: 'ok', items });
});

app.post('/api/pipeline/sync', (req, res) => {
  const items = req.body?.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Tableau items requis pour la synchronisation.' });
  }
  const ok = savePersistentPipeline(items as PersistentPipelineItem[]);
  if (!ok) {
    return res.status(500).json({ error: 'Erreur lors de l enregistrement du pipeline.' });
  }
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

  // 4. Filtre par pays réel (countryCode) ou par région du pays choisi
  // N'ajoute les signaux "global" que s'ils sont clairement marqués globaux
  const getRegionForCountry = (code: string): 'niger_uemoa' | 'europe' | 'global' => {
    if (['NER', 'SEN', 'CIV'].includes(code)) return 'niger_uemoa';
    if (['FRA', 'DEU', 'ESP', 'ITA', 'GBR'].includes(code)) return 'europe';
    return 'global';
  };

  const countryRegion = getRegionForCountry(countryCode);
  const relevantSignals = signals.filter((s) => {
    if (s.countryCode && s.countryCode === countryCode) return true;
    if (countryRegion !== 'global' && s.region && s.region === countryRegion) return true;
    if (s.region === 'global' && s.isGlobal === true) return true;
    return false;
  });

  if (relevantSignals.length < 2) {
    recordGeminiCall(Date.now() - startTime, false, 'Données insuffisantes : moins de 2 signaux collectés disponibles.');
    return res.json({
      status: 'insufficient_data',
      message: 'données insuffisantes',
      opportunities: [],
    });
  }

  // 3. N'envoie à Gemini que le titre, la source, le lien, la date et l'extrait réel de l'article
  // Supprime les champs "context" et "immediateArbitragePlay" écrits à la main
  const promptSignalsList = relevantSignals.slice(0, 10).map((s) => ({
    signalId: s.id,
    title: s.headline,
    source: s.sourceName,
    link: s.sourceUrl,
    date: s.publishedAt,
    realArticleExcerpt: s.context || '',
    status: s.status || 'live',
  }));

  const systemPrompt = `Tu es le moteur d'opportunités d'OmniVectis, conçu pour un usage personnel strict.
RÈGLE ABSOLUE : Aucune donnée inventée ni simulée présentée comme réelle. Chaque chiffre doit reposer sur les signaux ci-dessous.
Chaque opportunité doit être reliée UNIQUEMENT et STRICTEMENT aux signaux collectés fournis en entrée.
Tu dois générer entre 2 et 4 opportunités concrètes et pertinentes pour le pays cible (${countryCode}).
Pour chaque opportunité :
1. "title": Titre court et professionnel
2. "type": Soit "numérique" (SaaS, service automatisé, arbitrage de flux, digital), soit "physique" (commerce physique, logistique, agrobusiness, énergie, import-export)
3. "description": Description claire et factuelle
4. "whyItExists": Pourquoi elle existe à cet instant précis selon les faits du signal
5. "confidenceLevel": Soit "faible", "moyen", ou "élevé"
6. "risks": Liste des 2 à 4 risques majeurs réels
7. "invalidationTriggers": Liste des 2 à 3 événements concrets qui invalideraient cette opportunité
8. "targetRevenueLocal": Estimation indicative mensuelle dans la devise du pays, ou laisser vide / null s'il n'y a pas assez d'éléments
9. "estimatedMargin": Estimation indicative de la marge brute, ou laisser vide / null s'il n'y a pas assez d'éléments
10. "sourceSignalIds": Tableau contenant les "signalId" EXACTS des signaux collectés dont cette opportunité est issue. Toute opportunité sans au moins un signalId valide fourni sera rejetée.

S'il n'y a pas assez de faits concrets pour bâtir une opportunité sérieuse, renvoie un tableau vide avec "hasEnoughData": false et "insufficientDataReason": "données insuffisantes".`;

  const genConfig = {
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
  };

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Pays cible : ${countryCode}\nSignaux collectés :\n${JSON.stringify(promptSignalsList, null, 2)}`,
        config: genConfig,
      });
    } catch (e: any) {
      if (e?.message?.includes('503') || e?.status === 503 || e?.toString().includes('high demand')) {
        console.info('Transient 503 on gemini-3.8-flash, waiting 1500ms before retry...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: `Pays cible : ${countryCode}\nSignaux collectés :\n${JSON.stringify(promptSignalsList, null, 2)}`,
            config: genConfig,
          });
        } catch {
          // Final retry with gemini-3.8-flash
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Pays cible : ${countryCode}\nSignaux collectés :\n${JSON.stringify(promptSignalsList, null, 2)}`,
            config: genConfig,
          });
        }
      } else {
        throw e;
      }
    }

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

    const validOpps: any[] = [];
    const promptSignalIds = new Set(promptSignalsList.map((s) => s.signalId));

    for (let idx = 0; idx < parsed.opportunities.length; idx++) {
      const opp = parsed.opportunities[idx];
      const citedIds: string[] = Array.isArray(opp.sourceSignalIds) ? opp.sourceSignalIds : [];

      // 1. Ne garde comme sources que les signaux dont l'identifiant est dans sourceSignalIds ET existe dans les signaux fournis
      const matchedCitations = promptSignalsList
        .filter((s) => citedIds.includes(s.signalId) && promptSignalIds.has(s.signalId))
        .map((s) => ({
          signalId: s.signalId,
          headline: s.title,
          sourceName: s.source,
          sourceUrl: s.link,
          publishedAt: s.date,
          status: (s.status as 'live' | 'cache' | 'indisponible') || 'live',
        }));

      // Si une opportunité n'a aucune source valide, rejette-la
      if (matchedCitations.length === 0) {
        continue;
      }

      // 2. Supprime les valeurs de secours de targetRevenueLocal et estimatedMargin. S'ils manquent, affiche "Estimation non fournie".
      const targetRevenue = (typeof opp.targetRevenueLocal === 'string' && opp.targetRevenueLocal.trim().length > 0)
        ? opp.targetRevenueLocal.trim()
        : 'Estimation non fournie';

      const estMargin = (typeof opp.estimatedMargin === 'string' && opp.estimatedMargin.trim().length > 0)
        ? opp.estimatedMargin.trim()
        : 'Estimation non fournie';

      validOpps.push({
        id: `opp-${Date.now()}-${idx}`,
        title: opp.title,
        type: opp.type as 'numérique' | 'physique',
        description: opp.description,
        sourceSignals: matchedCitations,
        whyItExists: opp.whyItExists,
        confidenceLevel: opp.confidenceLevel as 'faible' | 'moyen' | 'élevé',
        risks: opp.risks || [],
        invalidationTriggers: opp.invalidationTriggers || [],
        targetRevenueLocal: targetRevenue,
        estimatedMargin: estMargin,
        countryCode,
        createdAt: new Date().toISOString(),
        hasEnoughData: true,
      });
    }

    if (validOpps.length === 0) {
      recordGeminiCall(duration, true, undefined, { opportunitiesSynthesized: 0 });
      return res.json({
        status: 'insufficient_data',
        message: 'données insuffisantes',
        opportunities: [],
      });
    }

    // Save and log (preserve opportunities for other countries)
    const existing = getPersistentOpportunities(countryCode);
    const otherCountries = getPersistentOpportunities('all').filter((e) => e.countryCode !== countryCode);
    const merged = [...validOpps, ...existing.filter((e) => !validOpps.some((f: any) => f.title === e.title))];
    savePersistentOpportunities([...merged, ...otherCountries]);

    recordGeminiCall(duration, true, undefined, { opportunitiesSynthesized: validOpps.length });
    appendAuditLog({
      actionType: 'opportunity_generated',
      actor: 'gemini_api',
      description: `${validOpps.length} opportunités synthétisées pour ${countryCode} à partir des signaux réels collectés.`,
      provenanceDetails: `Signaux analysés : ${relevantSignals.length}`,
      status: 'success',
    });

    res.json({
      status: 'ok',
      count: validOpps.length,
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

  if (!hasConfiguredGeminiKey()) {
    return res.status(503).json({ error: 'Clé GEMINI_API_KEY manquante pour générer le dossier numérique.' });
  }

  const startTime = Date.now();
  const currency = ['NER', 'SEN', 'CIV'].includes(countryCode) ? 'FCFA' : countryCode === 'USA' ? 'USD' : 'EUR';
  const systemPrompt = `Tu es l'ingénieur de lancement d'OmniVectis pour opportunités NUMÉRIQUES.
Génère le dossier de lancement opérationnel complet pour : "${opportunity.title}" dans le pays (${countryCode}).
Devise : ${currency}.
RÈGLE DE PROVENANCE : les tarifs proposés doivent être clairement présentés comme une estimation indicative adaptée au pays cible, sans inventer de statistiques clients passées.
Exigences strictes :
1. "offerAndPricing" : prix local indicatif (ou "Estimation non fournie" si impossible), devise, modèle de facturation, 4 livrables concrets, garantie.
2. "htmlSalesPage" : Page de vente complète en HTML5 avec Tailwind CSS CDN et formulaire de contact.
3. "contentPack" : tagline, post LinkedIn, teaser WhatsApp, angle de preuve.
4. "outreachCopy" : message direct, email de pitch complet, 3 objections et réponses.
5. "followupSequence" : relance J+3, relance J+7, rupture polie J+14.
6. "accountsChecklist" : 4 à 5 comptes/outils réels adaptés à ${countryCode}.
7. "automationActions" : 3 flux d'automatisation réalisables.`;

  try {
    const response = await generateGeminiJson(`Opportunité : ${JSON.stringify(opportunity, null, 2)}`, {
      systemInstruction: systemPrompt,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          offerAndPricing: {
            type: Type.OBJECT,
            properties: {
              localPrice: { type: Type.STRING },
              currency: { type: Type.STRING },
              billingModel: { type: Type.STRING },
              deliverables: { type: Type.ARRAY, items: { type: Type.STRING } },
              guarantee: { type: Type.STRING },
            },
            required: ['localPrice', 'currency', 'billingModel', 'deliverables', 'guarantee'],
          },
          htmlSalesPage: { type: Type.STRING },
          contentPack: {
            type: Type.OBJECT,
            properties: {
              tagline: { type: Type.STRING },
              linkedinPost: { type: Type.STRING },
              whatsappTeaser: { type: Type.STRING },
              socialProofAngle: { type: Type.STRING },
            },
            required: ['tagline', 'linkedinPost', 'whatsappTeaser', 'socialProofAngle'],
          },
          outreachCopy: {
            type: Type.OBJECT,
            properties: {
              directMessage: { type: Type.STRING },
              emailPitch: { type: Type.STRING },
              objectionHandling: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    objection: { type: Type.STRING },
                    reply: { type: Type.STRING },
                  },
                  required: ['objection', 'reply'],
                },
              },
            },
            required: ['directMessage', 'emailPitch', 'objectionHandling'],
          },
          followupSequence: {
            type: Type.OBJECT,
            properties: {
              day3: { type: Type.STRING },
              day7: { type: Type.STRING },
              day14Breakup: { type: Type.STRING },
            },
            required: ['day3', 'day7', 'day14Breakup'],
          },
          accountsChecklist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                accountName: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['accountName', 'description'],
            },
          },
          automationActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tool: { type: Type.STRING },
                description: { type: Type.STRING },
                setupDifficulty: { type: Type.STRING, enum: ['rapide', 'moyen'] },
              },
              required: ['title', 'tool', 'description', 'setupDifficulty'],
            },
          },
        },
        required: [
          'offerAndPricing',
          'htmlSalesPage',
          'contentPack',
          'outreachCopy',
          'followupSequence',
          'accountsChecklist',
          'automationActions',
        ],
      },
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');

    if (!parsed?.offerAndPricing || !parsed?.htmlSalesPage || !parsed?.outreachCopy) {
      throw new Error('Réponse Gemini incomplète pour le dossier numérique.');
    }

    const kitData = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      offerAndPricing: {
        localPrice: parsed.offerAndPricing.localPrice?.trim() || 'Estimation non fournie',
        currency: parsed.offerAndPricing.currency?.trim() || currency,
        billingModel: parsed.offerAndPricing.billingModel?.trim() || 'Estimation non fournie',
        deliverables: Array.isArray(parsed.offerAndPricing.deliverables) ? parsed.offerAndPricing.deliverables : [],
        guarantee: parsed.offerAndPricing.guarantee?.trim() || 'Non spécifiée',
      },
      htmlSalesPage: parsed.htmlSalesPage,
      contentPack: parsed.contentPack,
      outreachCopy: parsed.outreachCopy,
      followupSequence: parsed.followupSequence,
      accountsChecklist: (Array.isArray(parsed.accountsChecklist) ? parsed.accountsChecklist : []).map((a: any, i: number) => ({
        id: `acc-${i}`,
        status: 'todo',
        ...a,
      })),
      automationActions: Array.isArray(parsed.automationActions) ? parsed.automationActions : [],
    };

    savePersistentKit(opportunity.id, { digital: kitData });
    recordGeminiCall(duration, true, undefined, { kitsGenerated: 1 });

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
      provenanceDetails: `Offre indicative : ${kitData.offerAndPricing.localPrice}`,
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

  if (!hasConfiguredGeminiKey()) {
    return res.status(503).json({ error: 'Clé GEMINI_API_KEY manquante pour générer le plan physique.' });
  }

  const startTime = Date.now();
  const currency = ['NER', 'SEN', 'CIV'].includes(countryCode) ? 'FCFA' : countryCode === 'USA' ? 'USD' : 'EUR';

  const systemPrompt = `Tu es l'expert en exploitation d'entreprises physiques pour OmniVectis.
Génère le plan d'exploitation opérationnel complet pour : "${opportunity.title}" dans le pays (${countryCode}).
Devise : ${currency}.
RÈGLE DE PROVENANCE : Les montants budgétaires sont des estimations indicatives modifiables par l'utilisateur. N'invente pas de faux fournisseurs précis si tu ne les connais pas ; indique plutôt le type de partenaire ou pôle commercial réel du pays.
Exigences strictes :
1. "investmentBudget" : Budget initial détaillé avec hypothèses modifiables (id, category, label, amount, isEditable=true, note), workingCapitalReserve et totalInitial.
2. "localSuppliersAndPartners" : 3 à 5 types de fournisseurs/partenaires du pays cible.
3. "regulatoryAuthorizations" : 4 étapes d'autorisations administratives du pays.
4. "supplyChainAndLogistics" : itinéraire de transport, conditions de stockage, leadTimeDays, safetyStockUnits.
5. "implementationTimeline" : planning sur 8 semaines (4 jalons).
6. "breakEvenAnalysis" : unitSalePrice, unitCost, unitGrossMargin, monthlyFixedCosts, breakEvenUnits, breakEvenRevenue.
7. "risksAndMitigation" : 3 risques opérationnels concrets et atténuation.`;

  try {
    const response = await generateGeminiJson(`Opportunité physique : ${JSON.stringify(opportunity, null, 2)}`, {
      systemInstruction: systemPrompt,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          investmentBudget: {
            type: Type.OBJECT,
            properties: {
              totalInitial: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              workingCapitalReserve: { type: Type.NUMBER },
              hypotheses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING },
                    label: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    isEditable: { type: Type.BOOLEAN },
                    note: { type: Type.STRING },
                  },
                  required: ['id', 'category', 'label', 'amount', 'isEditable', 'note'],
                },
              },
            },
            required: ['totalInitial', 'currency', 'workingCapitalReserve', 'hypotheses'],
          },
          localSuppliersAndPartners: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                location: { type: Type.STRING },
                contactGuide: { type: Type.STRING },
              },
              required: ['name', 'role', 'location', 'contactGuide'],
            },
          },
          regulatoryAuthorizations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                authority: { type: Type.STRING },
                requirement: { type: Type.STRING },
                estimatedCost: { type: Type.STRING },
                delay: { type: Type.STRING },
              },
              required: ['stepNumber', 'authority', 'requirement', 'estimatedCost', 'delay'],
            },
          },
          supplyChainAndLogistics: {
            type: Type.OBJECT,
            properties: {
              transportRoute: { type: Type.STRING },
              storageConditions: { type: Type.STRING },
              leadTimeDays: { type: Type.NUMBER },
              safetyStockUnits: { type: Type.NUMBER },
            },
            required: ['transportRoute', 'storageConditions', 'leadTimeDays', 'safetyStockUnits'],
          },
          implementationTimeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                week: { type: Type.STRING },
                milestone: { type: Type.STRING },
                criticalAction: { type: Type.STRING },
              },
              required: ['week', 'milestone', 'criticalAction'],
            },
          },
          breakEvenAnalysis: {
            type: Type.OBJECT,
            properties: {
              unitSalePrice: { type: Type.NUMBER },
              unitCost: { type: Type.NUMBER },
              unitGrossMargin: { type: Type.NUMBER },
              monthlyFixedCosts: { type: Type.NUMBER },
              breakEvenUnits: { type: Type.NUMBER },
              breakEvenRevenue: { type: Type.NUMBER },
            },
            required: ['unitSalePrice', 'unitCost', 'unitGrossMargin', 'monthlyFixedCosts', 'breakEvenUnits', 'breakEvenRevenue'],
          },
          risksAndMitigation: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                risk: { type: Type.STRING },
                mitigationStrategy: { type: Type.STRING },
              },
              required: ['risk', 'mitigationStrategy'],
            },
          },
        },
        required: [
          'investmentBudget',
          'localSuppliersAndPartners',
          'regulatoryAuthorizations',
          'supplyChainAndLogistics',
          'implementationTimeline',
          'breakEvenAnalysis',
          'risksAndMitigation',
        ],
      },
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');

    if (!parsed?.investmentBudget || !parsed?.breakEvenAnalysis) {
      throw new Error('Réponse Gemini incomplète pour le plan d exploitation physique.');
    }

    const hypotheses = Array.isArray(parsed.investmentBudget.hypotheses)
      ? parsed.investmentBudget.hypotheses.map((h: any, idx: number) => ({
          id: h.id || `hyp-${idx + 1}`,
          category: h.category || 'Poste budgétaire',
          label: h.label || 'Estimation',
          amount: Number(h.amount) || 0,
          isEditable: true,
          note: h.note || 'Estimation indicative modifiable',
        }))
      : [];

    const totalInitial = hypotheses.reduce((sum: number, h: any) => sum + Number(h.amount || 0), 0);

    const planData = {
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      investmentBudget: {
        totalInitial,
        currency: parsed.investmentBudget.currency || currency,
        hypotheses,
        workingCapitalReserve: Number(parsed.investmentBudget.workingCapitalReserve) || 0,
      },
      localSuppliersAndPartners: Array.isArray(parsed.localSuppliersAndPartners) ? parsed.localSuppliersAndPartners : [],
      regulatoryAuthorizations: Array.isArray(parsed.regulatoryAuthorizations) ? parsed.regulatoryAuthorizations : [],
      supplyChainAndLogistics: parsed.supplyChainAndLogistics,
      implementationTimeline: Array.isArray(parsed.implementationTimeline) ? parsed.implementationTimeline : [],
      breakEvenAnalysis: parsed.breakEvenAnalysis,
      risksAndMitigation: Array.isArray(parsed.risksAndMitigation) ? parsed.risksAndMitigation : [],
    };

    savePersistentKit(opportunity.id, { physical: planData });
    recordGeminiCall(duration, true, undefined, { kitsGenerated: 1 });

    if (planData.regulatoryAuthorizations.length > 0) {
      const firstStep = planData.regulatoryAuthorizations[0];
      addValidationItem({
        title: `Démarche administrative : ${firstStep.authority} - ${opportunity.title}`,
        category: 'administrative_step',
        targetRecipient: firstStep.authority,
        contentPayload: `${firstStep.requirement} (Coût indicatif : ${firstStep.estimatedCost}, Délai : ${firstStep.delay})`,
        sourceOpportunityTitle: opportunity.title,
        countryCode,
      });
    }

    appendAuditLog({
      actionType: 'kit_generated',
      actor: 'gemini_api',
      description: `Plan d exploitation physique généré pour : ${opportunity.title}`,
      provenanceDetails: `Budget indicatif calculé : ${planData.investmentBudget.totalInitial.toLocaleString()} ${currency}`,
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


// Generate deep custom execution blueprint (strict Gemini, no fake fallback)
app.post('/api/blueprint/generate', async (req, res) => {
  const { sectorId, sectorName, niche, targetRevenue, capitalBudget, userSkills, businessModel } = req.body;

  if (!hasConfiguredGeminiKey()) {
    return res.status(503).json({
      success: false,
      error: 'Clé GEMINI_API_KEY manquante côté serveur pour générer le plan stratégique.',
    });
  }

  const startTime = Date.now();
  const resolvedSectorName = sectorName || 'Intelligence Artificielle & DeepTech';
  const resolvedNiche = niche || 'Automatisation de processus B2B';
  const resolvedTarget = targetRevenue || '15 000€ / mois';
  const resolvedBudget = capitalBudget || 'Amorçage lean (0€ - 2k€)';
  const resolvedSkills = userSkills || 'Automatisation, vente B2B, no-code';
  const resolvedModel = businessModel || 'SaaS B2B & Abonnements Récurrents';

  try {
    const prompt = `Tu es un stratège macro-économique et expert en exécution commerciale.
Analyse l'opportunité suivante et conçois un plan d'action opérationnel (les montants et conversions sont des estimations indicatives) :

- Secteur économique : ${resolvedSectorName} (Identifiant : ${sectorId || 'général'})
- Niche ciblée : ${resolvedNiche}
- Modèle d'affaires préféré : ${resolvedModel}
- Objectif de revenu visé : ${resolvedTarget}
- Budget de démarrage disponible : ${resolvedBudget}
- Compétences / Atouts : ${resolvedSkills}

Fournis une réponse structurée en JSON strict contenant :
1. "executiveSummary": Résumé percutant de l'opportunité.
2. "revenueMechanics": Analyse du modèle de revenus (pricing conseillé, panier moyen indicatif, marge brute estimée, scalabilité, explication).
3. "acquisitionStrategy": 3 tactiques concrètes d'acquisition client.
4. "operationalStack": Outils et technologies pour opérer en équipe réduite.
5. "roadmap30_60_90": day30, day60, day90.
6. "crossSectorSynergies": Synergies cross-sectorielles concrètes.
7. "keyRisksAndMoat": primaryRisk et defenseMoat.`;

    const response = await generateGeminiJson(prompt, {
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
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');
    const savedRecord = saveBlueprintRecord({
      sectorId: sectorId || 'ai_deeptech',
      sectorName: resolvedSectorName,
      niche: resolvedNiche,
      targetRevenue: resolvedTarget,
      capitalBudget: resolvedBudget,
      userSkills: resolvedSkills,
      businessModel: resolvedModel,
      blueprint: parsed,
    });
    recordGeminiCall(duration, true);
    return res.json({ success: true, blueprint: parsed, record: savedRecord, source: 'ai' });
  } catch (apiError: any) {
    const duration = Date.now() - startTime;
    const message = apiError?.message || 'Erreur lors de la génération du blueprint via Gemini.';
    recordGeminiCall(duration, false, message);
    return res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/blueprints', (req, res) => {
  res.json({ status: 'ok', blueprints: getSavedBlueprints() });
});

app.delete('/api/blueprints/:id', (req, res) => {
  const remaining = deleteSavedBlueprint(req.params.id);
  res.json({ status: 'ok', blueprints: remaining });
});

// Cross-sector arbitrage & synergy generator (strict Gemini, no fake fallback)
app.post('/api/arbitrage/analyze', async (req, res) => {
  const { sectorA, sectorB, riskTolerance } = req.body;

  if (!sectorA || !sectorB) {
    return res.status(400).json({ success: false, error: 'Deux secteurs sont requis pour analyser l arbitrage.' });
  }

  if (!hasConfiguredGeminiKey()) {
    return res.status(503).json({
      success: false,
      error: 'Clé GEMINI_API_KEY manquante côté serveur pour l analyse d arbitrage.',
    });
  }

  const startTime = Date.now();
  try {
    const prompt = `Analyse l'opportunité d'arbitrage et de synergie économique entre ces deux secteurs :
Secteur 1: ${sectorA}
Secteur 2: ${sectorB}
Tolérance au risque: ${riskTolerance || 'Équilibré'}

Génère une stratégie d'arbitrage qui tire parti des asymétries de marges, de technologies ou de flux de trésorerie entre ces deux secteurs.
Réponds en JSON avec :
1. "conceptName": Nom du modèle de convergence
2. "arbitrageMechanism": Explication de l'asymétrie exploitée
3. "revenueStreamA": Flux généré via le premier secteur
4. "revenueStreamB": Flux généré via le second secteur
5. "estimatedMonthlyCashflow": Estimation indicative réaliste de cash-flow mensuel
6. "unfairAdvantage": Pourquoi les acteurs traditionnels ne le font pas encore`;

    const response = await generateGeminiJson(prompt, {
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
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');
    const savedRecord = saveArbitrageRecord({
      sectorA,
      sectorB,
      riskTolerance: riskTolerance || 'Équilibré',
      analysis: parsed,
    });
    recordGeminiCall(duration, true);
    return res.json({ success: true, analysis: parsed, record: savedRecord, source: 'ai' });
  } catch (apiError: any) {
    const duration = Date.now() - startTime;
    const message = apiError?.message || 'Erreur lors de l analyse d arbitrage via Gemini.';
    recordGeminiCall(duration, false, message);
    return res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/arbitrages', (req, res) => {
  res.json({ status: 'ok', arbitrages: getSavedArbitrages() });
});

app.delete('/api/arbitrages/:id', (req, res) => {
  const remaining = deleteSavedArbitrage(req.params.id);
  res.json({ status: 'ok', arbitrages: remaining });
});

// Endpoint: Generate Full Operational Launchpad Circuit (strict Gemini, no fake fallback)
app.post('/api/launchpad/generate', async (req, res) => {
  const { sectorName, opportunityTitle } = req.body;

  if (!hasConfiguredGeminiKey()) {
    return res.status(503).json({
      success: false,
      error: 'Clé GEMINI_API_KEY manquante côté serveur pour générer le circuit Launchpad.',
    });
  }

  const startTime = Date.now();
  const resolvedSector = sectorName || 'Intelligence Artificielle & B2B';
  const resolvedTitle = opportunityTitle || 'Service B2B à Haute Valeur Ajoutée';

  try {
    const prompt = `Tu es un créateur d'entreprises B2B et expert en monétisation opérationnelle.
Conçois le "Circuit de Monétisation Prêt à Encaisser" pour cette opportunité précise :
- Titre : ${resolvedTitle}
- Secteur : ${resolvedSector}

Génère en JSON strict :
1. "opportunityTitle": Titre
2. "sectorName": Secteur
3. "tagline": Phrase d accroche
4. "commercialOffer":
   - "heroPromise": Promesse de valeur
   - "targetPersona": Profil cible exact
   - "riskReversalGuarantee": Garantie de résultat ou remboursement
   - "tiers": Tableau de 3 offres (name, price, billingCycle, deliverables array, stripeLinkParams)
5. "outreachSequence":
   - "channel": Canal d acquisition
   - "targetFilters": Filtres de ciblage précis
   - "email1Subject": Objet email 1
   - "email1Body": Corps email 1 (court, percutant, sans statistiques inventées)
   - "email2Followup": Email 2 relance
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
   - "socialProofHook": Preuve ou garantie crédible sans faux chiffres clients
8. "deliveryEngine":
   - "inputTrigger": Déclencheur du service
   - "processingSteps": 4 étapes concrètes d exécution
   - "aiPromptTemplate": Prompt type pour délivrer avec l IA
   - "outputDeliverableFormat": Format du livrable
   - "timeSavedHoursPerClient": Nombre d heures indicatif économisées (nombre)`;

    const response = await generateGeminiJson(prompt, {
      systemInstruction: "Tu es un architecte de systèmes d'acquisition B2B pragmatique. Ne fabrique aucun faux témoignage ou chiffre client inventé.",
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
    });

    const duration = Date.now() - startTime;
    const parsed = JSON.parse(response.text || '{}');
    const savedRecord = saveLaunchpadRecord({
      sectorId: req.body?.sectorId || 'ai_deeptech',
      sectorName: resolvedSector,
      opportunityTitle: resolvedTitle,
      circuit: parsed,
    });
    recordGeminiCall(duration, true);
    return res.json({ success: true, circuit: parsed, record: savedRecord, source: 'ai' });
  } catch (apiError: any) {
    const duration = Date.now() - startTime;
    const message = apiError?.message || 'Erreur lors de la génération du circuit Launchpad via Gemini.';
    recordGeminiCall(duration, false, message);
    return res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/launchpads', (req, res) => {
  res.json({ status: 'ok', launchpads: getSavedLaunchpads() });
});

app.delete('/api/launchpads/:id', (req, res) => {
  const remaining = deleteSavedLaunchpad(req.params.id);
  res.json({ status: 'ok', launchpads: remaining });
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
