import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Send,
  FileText,
  Globe,
  Bot,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  Loader2,
  Lock,
  CreditCard,
  Building2,
  Wallet,
  Receipt,
  Banknote,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  PhoneCall,
  QrCode,
  MapPin,
} from 'lucide-react';
import { LaunchpadCircuit, SectorCategory, EconomicSector, CountryCode } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import { GEO_PROFILES } from '../data/geoProfiles';

interface LaunchpadViewProps {
  initialSectorId?: SectorCategory;
  initialOpportunityTitle?: string;
  onAddToPipeline: (title: string, sectorId: SectorCategory, targetMrr: number) => void;
  countryCode?: CountryCode;
}

function getDefaultCircuit(sectorName: string, opportunityTitle: string): LaunchpadCircuit {
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
          price: '490 € / mois',
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
      targetFilters: `Critères de ciblage précis : Titre = Gérant OU DAF OU Directeur Général, Secteur = ${sectorName}, Effectif = 20-200 personnes.`,
      email1Subject: `Question sur vos processus [Entreprise] & opportunité d optimisation`,
      email1Body: `Bonjour [Prénom],\n\nEn observant les récentes évolutions du secteur ${sectorName}, nous constatons que la majorité des dirigeants perdent entre 12 et 20 heures par semaine sur des tâches administratives et de contrôle qui pourraient être 100% fiabilisées.\n\nNous avons mis au point une solution opérationnelle qui permet à des entreprises comme [Exemple d Entreprise Similaire] de diviser ce temps par 4 tout en sécurisant leurs marges.\n\nSeriez-vous ouvert à un audit pilote gratuit de 15 minutes cette semaine pour évaluer le potentiel net chez [Entreprise] ?\n\nBien cordialement,\n[Votre Nom]\n[Votre Téléphone / Calendly]`,
      email2Followup: `Bonjour [Prénom],\n\nJe me permets de vous relancer suite à mon message de mardi.\n\nPour vous donner un exemple très concret : nous avons récemment permis à une structure de votre taille dans le domaine ${sectorName} d économiser 14 200 € dès son premier trimestre d utilisation, sans modifier ses logiciels existants.\n\nAvez-vous 10 minutes ce jeudi à 14h ou vendredi à 11h ?\n\nBien à vous,\n[Votre Nom]`,
      email3Breakup: `Bonjour [Prénom],\n\nJe comprends tout à fait que ce ne soit pas votre priorité du moment et je ne souhaite pas encombrer votre messagerie.\n\nJe clôture donc votre dossier pour l instant. Si le sujet redevient stratégique pour vos équipes, vous pouvez réserver un échange direct ici : [Lien Calendly].\n\nJe vous souhaite une excellente continuation dans vos projets.\n\nCordialement,\n[Votre Nom]`,
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

export const LaunchpadView: React.FC<LaunchpadViewProps> = ({
  initialSectorId = 'ai_deeptech',
  initialOpportunityTitle = 'Agents IA Spécialisés Conformité & Due Diligence B2B',
  onAddToPipeline,
  countryCode = 'NER',
}) => {
  const currentGeoProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const isAfricanUemoa = ['NER', 'SEN', 'CIV'].includes(countryCode);

  const [selectedSectorId, setSelectedSectorId] = useState<SectorCategory>(initialSectorId);
  const [opportunityTitle, setOpportunityTitle] = useState<string>(initialOpportunityTitle);
  const currentSector = ECONOMIC_SECTORS.find((s) => s.id === selectedSectorId) || ECONOMIC_SECTORS[0];
  const [circuit, setCircuit] = useState<LaunchpadCircuit>(() =>
    getDefaultCircuit(currentSector.name, initialOpportunityTitle)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<'offer' | 'outreach' | 'contract' | 'landing' | 'delivery' | 'cash_in'>('offer');

  // Cash-in interactive tool states
  const [activePaymentRail, setActivePaymentRail] = useState<'mobile_money' | 'bank_transfer' | 'transfer_agency' | 'stripe'>(
    isAfricanUemoa ? 'mobile_money' : 'stripe'
  );
  const [cashInType, setCashInType] = useState<'recurring' | 'oneoff'>('recurring');
  const [cashInAmount, setCashInAmount] = useState<number>(() => (isAfricanUemoa ? 650000 : 2500));
  const [clientCompanyName, setClientCompanyName] = useState<string>(
    isAfricanUemoa ? 'Société Sahélienne des Travaux & Logistique' : 'Groupe Horizon & Associés'
  );
  const [clientContactEmail, setClientContactEmail] = useState<string>(
    isAfricanUemoa ? 'direction@sahel-logistics.ne' : 'direction@groupe-horizon.fr'
  );
  const [userPhone, setUserPhone] = useState<string>('+227 90 24 58 12');
  const [selectedMobileOperator, setSelectedMobileOperator] = useState<string>('Airtel Money Niger (*400#)');
  const [selectedBank, setSelectedBank] = useState<string>('SONIBANK (Société Nigérienne de Banque)');
  const [selectedAgency, setSelectedAgency] = useState<string>('NITA Transfert d Argent');
  const [userIban, setUserIban] = useState<string>(
    isAfricanUemoa ? 'NE58 NE05 7010 0112 3456 7890 12' : 'FR76 1680 7000 4512 3456 7890 123'
  );
  const [userCompanyName, setUserCompanyName] = useState<string>('OmniVectis Solutions Niger');
  const [userNif, setUserNif] = useState<string>('NIF 48219/R · RCCM NI-NIA-2025-A-142');

  // Copy feedbacks
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerateCircuit = async (titleToUse?: string, sectorIdToUse?: SectorCategory) => {
    setLoading(true);
    const secId = sectorIdToUse || selectedSectorId;
    const resolvedSector = ECONOMIC_SECTORS.find((s) => s.id === secId) || currentSector;
    const finalTitle = titleToUse || opportunityTitle;

    try {
      const res = await fetch('/api/launchpad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectorId: secId,
          sectorName: resolvedSector.name,
          opportunityTitle: finalTitle,
        }),
      });
      const data = await res.json();
      if (data?.circuit) {
        setCircuit(data.circuit);
      }
    } catch (e) {
      console.info('Keeping synchronized local circuit on network delay:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Instantaneous initial data is already populated via getDefaultCircuit
  }, []);

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="text-xs font-medium text-emerald-400 mb-1.5">
          Circuit d Exécution & Encaissement Réel (0 à 10 000 € / mois)
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Launchpad de Monétisation Réelle
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Passez de la théorie à l encaissement bancaire. Cette suite génère automatiquement les 6 engrenages
          nécessaires pour vendre, contractualiser, facturer par Stripe, encaisser sur votre banque et délivrer sans travail manuel.
        </p>
      </div>

      {/* Target Business Selection & Switcher Bar */}
      <div className="p-5 bg-[#11141C] border border-white/[0.08] rounded-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Opportunité à Déployer & Monétiser
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <select
                value={selectedSectorId}
                onChange={(e) => {
                  const newId = e.target.value as SectorCategory;
                  setSelectedSectorId(newId);
                  const newSector = ECONOMIC_SECTORS.find((s) => s.id === newId);
                  const firstNiche = newSector?.niches[0]?.title || 'Service B2B de Niche';
                  setOpportunityTitle(firstNiche);
                  setCircuit(getDefaultCircuit(newSector?.name || 'Secteur B2B', firstNiche));
                }}
                className="bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {ECONOMIC_SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                placeholder="Nom du service ou niche..."
                className="bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerateCircuit()}
            disabled={loading}
            className="cursor-pointer px-4 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-950/60 disabled:text-slate-400 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-end"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Génération du circuit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Régénérer le Circuit Clé en Main</span>
              </>
            )}
          </button>
        </div>
      </div>

      {loading && !circuit && (
        <div className="p-12 bg-[#11141C] border border-white/[0.08] rounded-lg text-center space-y-4">
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
          <div className="font-display text-sm font-semibold text-white">Assemblage des engrenages d encaissement...</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Rédaction des offres Stripe, des emails d acquisition, du contrat juridique B2B et du prompt de délivrance.
          </p>
        </div>
      )}

      {circuit && (
        <div className="space-y-6">
          {/* Navigation Tabs across the 6 Gears */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#11141C] border border-white/[0.08] rounded-lg overflow-x-auto text-xs">
            <button
              onClick={() => setActiveStep('offer')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'offer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <DollarSign className={`w-3.5 h-3.5 ${activeStep === 'offer' ? 'text-white' : 'text-emerald-400'}`} />
              <span>1. L Offre & Tarifs Stripe</span>
            </button>

            <button
              onClick={() => setActiveStep('outreach')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'outreach' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${activeStep === 'outreach' ? 'text-white' : 'text-blue-400'}`} />
              <span>2. Scripts de Prospection</span>
            </button>

            <button
              onClick={() => setActiveStep('contract')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'contract' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeStep === 'contract' ? 'text-white' : 'text-amber-400'}`} />
              <span>3. Contrat B2B Juridique</span>
            </button>

            <button
              onClick={() => setActiveStep('landing')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'landing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${activeStep === 'landing' ? 'text-white' : 'text-slate-300'}`} />
              <span>4. Tunnel & Page de Vente</span>
            </button>

            <button
              onClick={() => setActiveStep('delivery')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'delivery' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${activeStep === 'delivery' ? 'text-white' : 'text-emerald-400'}`} />
              <span>5. Délivrance Automatisée IA</span>
            </button>

            <button
              onClick={() => setActiveStep('cash_in')}
              className={`cursor-pointer px-3.5 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'cash_in'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-400 hover:text-emerald-300 bg-[#0D1017] border border-emerald-500/25'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="font-semibold">6. Comment Encaisser l Argent (Stripe & Banque)</span>
            </button>
          </div>

          {/* ENGRENAGE 1: L'OFFRE & LES PRIX STRIPE */}
          {activeStep === 'offer' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                    Engrenage 01 · Positionnement Commercial & Encaissement
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    L Offre Irrésistible & Grille Tarifaire
                  </h3>
                </div>

                <button
                  onClick={() =>
                    onAddToPipeline(circuit.opportunityTitle, selectedSectorId, 15000)
                  }
                  className="cursor-pointer px-3.5 py-2 text-xs font-medium text-white bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.1] rounded-lg transition-colors flex items-center gap-2 shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enregistrer dans mon Pipeline</span>
                </button>
              </div>

              {/* Value Proposition & Risk Reversal */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.07] bg-[#0D1017]/50">
                <div className="p-6 space-y-1.5">
                  <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                    Promesse de Valeur Centrale
                  </span>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {circuit.commercialOffer.heroPromise}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Cible : {circuit.commercialOffer.targetPersona}
                  </div>
                </div>

                <div className="p-6 space-y-1.5">
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                    Garantie Anti-Risque (Élimine toute objection)
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {circuit.commercialOffer.riskReversalGuarantee}
                  </p>
                </div>
              </div>

              {/* 3 Stripe Pricing Tiers */}
              <div className="p-6 space-y-4">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Les 3 Paliers d Encaissement (Paramètres Stripe Directs)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {circuit.commercialOffer.tiers.map((tier: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.16] rounded-lg space-y-4 flex flex-col justify-between transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-sm font-semibold text-white">{tier.name}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">Tier 0{idx + 1}</span>
                        </div>

                        <div>
                          <div className="text-2xl font-semibold font-mono text-white tabular-nums">
                            {tier.price}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{tier.billingCycle}</div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-white/[0.07] text-xs">
                          {tier.deliverables.map((d: string, dIdx: number) => (
                            <div key={dIdx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/[0.07] space-y-2">
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          Params Stripe : {tier.stripeLinkParams}
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Prix : ${tier.price}\nCycle : ${tier.billingCycle}\nLivrables :\n- ${tier.deliverables.join('\n- ')}`,
                              `tier-${idx}`
                            )
                          }
                          className="cursor-pointer w-full py-2 text-xs font-medium text-slate-200 bg-[#11141C] hover:bg-white/[0.06] border border-white/[0.08] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>{copiedSection === `tier-${idx}` ? 'Copié !' : 'Copier l Offre'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 2: SCRIPTS DE PROSPECTION */}
          {activeStep === 'outreach' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                    Engrenage 02 · Acquisition Client Prévisible
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    Séquence Cold Outbound Multicanale (3 Étapes)
                  </h3>
                </div>

                <div className="text-xs text-slate-400">
                  Canal : <strong className="text-white font-medium">{circuit.outreachSequence.channel}</strong>
                </div>
              </div>

              {/* Targeting Filter Instructions */}
              <div className="p-6 bg-[#0D1017]/50 text-xs space-y-1.5">
                <span className="font-medium text-blue-400 uppercase tracking-wider text-[11px] block">
                  Filtres de Ciblage Sales Navigator / Apollo
                </span>
                <p className="text-slate-300 font-mono leading-relaxed">
                  {circuit.outreachSequence.targetFilters}
                </p>
              </div>

              {/* Emails Cadence */}
              <div className="p-6 space-y-4">
                {/* Email 1 */}
                <div className="p-5 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-blue-400">01</span>
                      <span>Email 1 · Accroche & Audit Pilote Offert (J+0)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Objet : ${circuit.outreachSequence.email1Subject}\n\n${circuit.outreachSequence.email1Body}`,
                          'email1'
                        )
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-[#11141C] hover:bg-white/[0.06] border border-white/[0.08] rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email1' ? 'Copié !' : 'Copier Email 1'}</span>
                    </button>
                  </div>

                  <div className="text-xs font-mono text-slate-400 border-b border-white/[0.07] pb-2">
                    Objet : <span className="text-slate-200">{circuit.outreachSequence.email1Subject}</span>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-[#11141C] border border-white/[0.06] p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email1Body}
                  </div>
                </div>

                {/* Email 2 */}
                <div className="p-5 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-amber-400">02</span>
                      <span>Email 2 · Relance avec Preuve Chiffrée (J+3)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(circuit.outreachSequence.email2Followup, 'email2')
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-[#11141C] hover:bg-white/[0.06] border border-white/[0.08] rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email2' ? 'Copié !' : 'Copier Email 2'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-[#11141C] border border-white/[0.06] p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email2Followup}
                  </div>
                </div>

                {/* Email 3 */}
                <div className="p-5 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-rose-400">03</span>
                      <span>Email 3 · Rupture Polie & Rareté (J+7)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(circuit.outreachSequence.email3Breakup, 'email3')
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-[#11141C] hover:bg-white/[0.06] border border-white/[0.08] rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email3' ? 'Copié !' : 'Copier Email 3'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-[#11141C] border border-white/[0.06] p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email3Breakup}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 3: CONTRAT B2B JURIDIQUE */}
          {activeStep === 'contract' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">
                    Engrenage 03 · Sécurisation Juridique & Facturation
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    Contrat Cadre & Bon de Commande B2B
                  </h3>
                </div>

                <button
                  onClick={() => {
                    const fullText = `${circuit.legalAgreement.contractTitle}\n\n` +
                      `1. OBJET DU CONTRAT :\n${circuit.legalAgreement.purposeClause}\n\n` +
                      `2. CONDITIONS FINANCIÈRES & PAIEMENT :\n${circuit.legalAgreement.financialTerms}\n\n` +
                      `3. CONFIDENTIALITÉ & PROPRIÉTÉ INTELLECTUELLE :\n${circuit.legalAgreement.confidentialityAndIP}\n\n` +
                      `4. DURÉE & RÉSILIATION :\n${circuit.legalAgreement.terminationClause}\n\n` +
                      `Fait en deux exemplaires originaux, pour servir et valoir ce que de droit.`;
                    copyToClipboard(fullText, 'contract');
                  }}
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSection === 'contract' ? 'Contrat Intégral Copié !' : 'Copier le Contrat (Yousign/DocuSign)'}</span>
                </button>
              </div>

              <div className="p-6">
                <div className="p-6 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-5 text-xs text-slate-300 leading-relaxed font-serif">
                  <div className="text-center font-semibold text-white text-sm font-display tracking-tight border-b border-white/[0.07] pb-3">
                    {circuit.legalAgreement.contractTitle}
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-white font-sans text-xs">ARTICLE 1 · OBJET DU CONTRAT</div>
                    <p>{circuit.legalAgreement.purposeClause}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-white font-sans text-xs">ARTICLE 2 · CONDITIONS FINANCIÈRES & RÈGLEMENT</div>
                    <p>{circuit.legalAgreement.financialTerms}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-white font-sans text-xs">ARTICLE 3 · CONFIDENTIALITÉ & PROPRIÉTÉ INTELLECTUELLE</div>
                    <p>{circuit.legalAgreement.confidentialityAndIP}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-white font-sans text-xs">ARTICLE 4 · DURÉE & RÉSILIATION</div>
                    <p>{circuit.legalAgreement.terminationClause}</p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.07] flex justify-between font-sans text-[11px] text-slate-500">
                    <div>Signature & Cachet du Client</div>
                    <div>Signature & Cachet du Prestataire</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 4: TUNNEL & LANDING PAGE */}
          {activeStep === 'landing' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                    Engrenage 04 · Tunnel de Conversion
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    Structure de Landing Page B2B Haute Conversion
                  </h3>
                </div>

                <button
                  onClick={() => {
                    const wireframeText = `=== WIREFRAME LANDING PAGE ===\n` +
                      `HERO : ${circuit.landingPageWireframe.heroHeadline}\n` +
                      `SOUS-TITRE : ${circuit.landingPageWireframe.heroSubheadline}\n` +
                      `CTA : ${circuit.landingPageWireframe.ctaButtonText}\n\n` +
                      `PROBLÈMES RÉSOLUS :\n- ${circuit.landingPageWireframe.problemSection.join('\n- ')}\n\n` +
                      `FONCTIONNALITÉS :\n` +
                      circuit.landingPageWireframe.solutionFeatures.map((f: any) => `- ${f.title} : ${f.desc}`).join('\n') +
                      `\n\nPREUVE SOCIALE : ${circuit.landingPageWireframe.socialProofHook}`;
                    copyToClipboard(wireframeText, 'landing');
                  }}
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-white bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.1] rounded-lg transition-colors flex items-center gap-2 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copiedSection === 'landing' ? 'Wireframe Copié !' : 'Copier le Wireframe'}</span>
                </button>
              </div>

              {/* Live Mockup Wireframe Preview */}
              <div className="p-6">
                <div className="p-8 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-8 text-center max-w-3xl mx-auto">
                  {/* Hero Section */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono font-medium text-blue-400 block">
                      {circuit.sectorName} · Solution Certifiée
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                      {circuit.landingPageWireframe.heroHeadline}
                    </h2>
                    <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                      {circuit.landingPageWireframe.heroSubheadline}
                    </p>
                    <div>
                      <button className="px-6 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                        {circuit.landingPageWireframe.ctaButtonText}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {circuit.landingPageWireframe.socialProofHook}
                    </div>
                  </div>

                  {/* 3 Problems Addressed */}
                  <div className="text-left p-6 bg-[#11141C] rounded-lg border border-white/[0.08] space-y-3">
                    <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider block">
                      Les 3 frictions que nous éliminons chez nos clients
                    </span>
                    <div className="space-y-2 text-xs text-slate-300">
                      {circuit.landingPageWireframe.problemSection.map((prob: string, pIdx: number) => (
                        <div key={pIdx} className="flex items-start gap-2.5">
                          <span className="text-rose-400 font-mono shrink-0">×</span>
                          <span className="leading-relaxed">{prob}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Solution Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#11141C] text-left">
                    {circuit.landingPageWireframe.solutionFeatures.map((feat: any, fIdx: number) => (
                      <div key={fIdx} className="p-4 space-y-1.5">
                        <div className="font-semibold text-white text-xs">{feat.title}</div>
                        <div className="text-xs text-slate-400 leading-relaxed">{feat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 5: DÉLIVRANCE AUTOMATISÉE */}
          {activeStep === 'delivery' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                    Engrenage 05 · Opérations & Marge Maximale (Zero-Code)
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white tracking-tight mt-0.5">
                    Moteur de Délivrance Automatisé (Gain : {circuit.deliveryEngine.timeSavedHoursPerClient}h / client)
                  </h3>
                </div>

                <div className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                  Marge Opérationnelle : &gt; 85%
                </div>
              </div>

              {/* Execution Pipeline Steps */}
              <div className="p-6 space-y-4">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Le Flux n8n / Make.com en 4 Échelons
                </span>

                <div className="p-4 bg-[#0D1017] border border-white/[0.08] rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-emerald-400">Événement Déclencheur (Trigger) : </span>
                  <span className="text-slate-300">{circuit.deliveryEngine.inputTrigger}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 border border-white/[0.08] rounded-lg bg-[#0D1017] overflow-hidden">
                  {circuit.deliveryEngine.processingSteps.map((step: string, sIdx: number) => (
                    <div
                      key={sIdx}
                      className={`p-4 text-xs text-slate-300 flex items-start gap-3 border-white/[0.07] ${
                        sIdx % 2 === 0 ? 'sm:border-r' : ''
                      } ${sIdx < 2 ? 'sm:border-b' : ''}`}
                    >
                      <span className="font-mono text-[11px] text-emerald-400 font-semibold shrink-0 pt-0.5 tabular-nums">
                        0{sIdx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Production AI Delivery Prompt */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    Prompt d Inférence IA de Délivrance (À intégrer dans votre webhook)
                  </span>

                  <button
                    onClick={() =>
                      copyToClipboard(circuit.deliveryEngine.aiPromptTemplate, 'prompt')
                    }
                    className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-[#0D1017] hover:bg-white/[0.06] border border-white/[0.08] rounded-md transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSection === 'prompt' ? 'Copié !' : 'Copier le Prompt'}</span>
                  </button>
                </div>

                <div className="p-4 bg-[#0D1017] border border-white/[0.08] rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {circuit.deliveryEngine.aiPromptTemplate}
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Format final délivré au client : <strong className="text-white font-medium">{circuit.deliveryEngine.outputDeliverableFormat}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 6: COMMENT ENCAISSER L'ARGENT (STRIPE, VIREMENT & BANQUE) */}
          {activeStep === 'cash_in' && (
            <div className="bg-[#11141C] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
              {/* Header */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                    Engrenage 06 · Circuit Financier & Encaissement Bancaire Réel
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-white tracking-tight mt-0.5">
                    Comment Vous Encaissez l Argent de Vos Clients
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    De l accord commercial jusqu au crédit réel sur votre compte bancaire. Voici le circuit technique,
                    contractuel et bancaire pour collecter les paiements sous 48h sans intermédiaire obscur.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Règlement Garanti J+2</span>
                  </span>
                </div>
              </div>

              {/* 1. Visuel du Circuit Financier (Timeline 4 Étapes Localisée) */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    1. Le Parcours Financier Complet (De la Signature au Retrait d Argent Réel)
                  </span>
                  <span className="text-[11px] text-blue-400 font-mono tabular-nums">
                    Profil Actif : {currentGeoProfile.countryName} ({currentGeoProfile.currencySymbol}) · 1 € = {currentGeoProfile.fxRateToEur} {currentGeoProfile.currencySymbol}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#0D1017]">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                      <span>ÉTAPE 01</span>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-white">Accord & Devis Signé</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le client valide le bon de commande, la facture pro-forma ou l accord contractuel OHADA/B2B par signature ou échange WhatsApp/Email d accord.
                    </p>
                    <div className="text-[11px] text-slate-500 font-mono">Délai : Immédiat</div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>ÉTAPE 02</span>
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-white">Choix du Rail de Règlement</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Vous transmettez soit vos coordonnées <strong className="text-slate-200 font-medium">Mobile Money (Airtel, Moov Flooz, Wave)</strong>, soit votre <strong className="text-slate-200 font-medium">RIB Banque (SONIBANK, ECOBANK)</strong>, soit un <strong className="text-slate-200 font-medium">Lien Stripe CB</strong>.
                    </p>
                    <div className="text-[11px] text-blue-400 font-mono">Mobile Money / Banque / CB</div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                      <span>ÉTAPE 03</span>
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-white">Validation & Notification Instantanée</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le client effectue le transfert. Vous recevez un <strong className="text-slate-200 font-medium">SMS officiel de confirmation opérateur</strong> (ex: Airtel Money ou Moov Flooz) ou un avis de crédit bancaire.
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono">Notification SMS immédiate</div>
                  </div>

                  <div className="p-4 bg-emerald-950/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-semibold">
                      <span>ÉTAPE 04</span>
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-white">Encaissement & Retrait Cash</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      L argent est disponible sur votre solde. Vous pouvez le retirer en espèces dans un point agréé (NITA, Al Izza, kiosque), l utiliser par carte ou le virer sur votre compte bancaire.
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono font-semibold">Argent réel disponible</div>
                  </div>
                </div>
              </div>

              {/* 2. Outil Interactif Multi-Rails : Mobile Money, Banques Locales, NITA/Al Izza, Stripe */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                      Générateur Multi-Rails d Encaissement Réel
                    </span>
                    <h4 className="font-display text-base font-semibold text-white">
                      Adaptez le Moyen d Encaissement à Votre Situation Géographique ({currentGeoProfile.countryName})
                    </h4>
                  </div>

                  {/* Mode Abonnement vs Forfait */}
                  <div className="flex items-center gap-1 p-1 bg-[#0D1017] border border-white/[0.08] rounded-lg shrink-0">
                    <button
                      onClick={() => setCashInType('recurring')}
                      className={`cursor-pointer px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        cashInType === 'recurring'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Abonnement Mensuel
                    </button>
                    <button
                      onClick={() => setCashInType('oneoff')}
                      className={`cursor-pointer px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        cashInType === 'oneoff'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Forfait Unique
                    </button>
                  </div>
                </div>

                {/* Rail Selection Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActivePaymentRail('mobile_money')}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition-colors ${
                      activePaymentRail === 'mobile_money'
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                        : 'bg-[#0D1017] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.16]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 mb-1.5" />
                    <div className="text-xs font-semibold">1. Mobile Money</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'Airtel Money, Moov Flooz, Wave' : 'Apple Pay, Google Pay'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('bank_transfer')}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition-colors ${
                      activePaymentRail === 'bank_transfer'
                        ? 'bg-blue-950/20 border-blue-500/40 text-white'
                        : 'bg-[#0D1017] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.16]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-400 mb-1.5" />
                    <div className="text-xs font-semibold">2. Banques Locales</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'SONIBANK, ECOBANK, BOA Niger' : 'Virement SEPA Direct'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('transfer_agency')}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition-colors ${
                      activePaymentRail === 'transfer_agency'
                        ? 'bg-amber-950/20 border-amber-500/40 text-white'
                        : 'bg-[#0D1017] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.16]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-400 mb-1.5" />
                    <div className="text-xs font-semibold">3. Agences & Cartes</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'NITA, Al Izza, Carte Visa NITA' : 'Cartes Virtuelles & Wise'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('stripe')}
                    className={`cursor-pointer p-3.5 rounded-lg border text-left transition-colors ${
                      activePaymentRail === 'stripe'
                        ? 'bg-blue-950/20 border-blue-500/40 text-white'
                        : 'bg-[#0D1017] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.16]'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-slate-300 mb-1.5" />
                    <div className="text-xs font-semibold">4. International / Stripe</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Paiement CB & Clients Mondiaux
                    </div>
                  </button>
                </div>

                {/* Common client & amount parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                      Montant ({currentGeoProfile.currencySymbol})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cashInAmount}
                        onChange={(e) => setCashInAmount(Math.max(100, Number(e.target.value) || 0))}
                        className="w-full bg-[#0D1017] border border-white/[0.1] text-white font-mono text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                        {currentGeoProfile.currencySymbol}
                      </span>
                    </div>
                    {isAfricanUemoa && (
                      <div className="text-[10px] text-slate-400 font-mono mt-1 tabular-nums">
                        ≈ {(cashInAmount / currentGeoProfile.fxRateToEur).toFixed(0)} € EUR (parité fixe 1€ = 655,957 F)
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                      Entreprise ou Client Facturé
                    </label>
                    <input
                      type="text"
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="w-full bg-[#0D1017] border border-white/[0.1] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                      Votre Raison Sociale ou Nom
                    </label>
                    <input
                      type="text"
                      value={userCompanyName}
                      onChange={(e) => setUserCompanyName(e.target.value)}
                      className="w-full bg-[#0D1017] border border-white/[0.1] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SPECIFIC RAIL VIEW 1: MOBILE MONEY (AIRTEL, MOOV FLOOZ, WAVE) */}
                {activePaymentRail === 'mobile_money' && (
                  <div className="p-5 bg-[#0D1017] border border-emerald-500/25 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                      <div>
                        <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                          Encaissement Direct par Mobile Money
                        </span>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Le canal le plus rapide et le plus universel au Niger et en zone UEMOA. 0 délai d attente.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 shrink-0 tabular-nums">
                        Frais de réception : 0% à 1%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Opérateur Mobile Money
                        </label>
                        <select
                          value={selectedMobileOperator}
                          onChange={(e) => setSelectedMobileOperator(e.target.value)}
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white text-xs rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-emerald-500"
                        >
                          {currentGeoProfile.mobileMoney.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Votre Numéro Mobile Money Récepteur
                        </label>
                        <input
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+227 90 00 00 00"
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white font-mono text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Ready to send WhatsApp & SMS template */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-300">
                          Message WhatsApp / SMS de Demande de Règlement Prêt à Transmettre
                        </span>
                        <button
                          onClick={() => {
                            const mmMsg = `Bonjour,\n\n` +
                              `Faisant suite à notre accord concernant : ${opportunityTitle},\n` +
                              `voici les coordonnées pour effectuer le règlement sécurisé par Mobile Money :\n\n` +
                              `📱 Opérateur : ${selectedMobileOperator}\n` +
                              `📞 Numéro récepteur : ${userPhone}\n` +
                              `👤 Titulaire du compte : ${userCompanyName}\n` +
                              `💰 Montant net à transférer : ${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol} (${cashInType === 'recurring' ? 'Abonnement mensuel' : 'Forfait complet'})\n` +
                              `📝 Référence obligatoire à inscrire : ACC-${Date.now().toString().slice(-4)}\n\n` +
                              `Dès confirmation de la transaction par SMS de l opérateur, nous activons immédiatement vos livrables.\n\n` +
                              `Merci pour votre confiance,\n${userCompanyName}`;
                            copyToClipboard(mmMsg, 'mmMessage');
                          }}
                          className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedSection === 'mmMessage' ? 'Message Copié !' : 'Copier le Message WhatsApp'}</span>
                        </button>
                      </div>

                      <div className="p-4 bg-[#11141C] border border-white/[0.07] rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {`Bonjour,

Faisant suite à notre accord concernant : ${opportunityTitle}, voici les coordonnées pour effectuer le règlement sécurisé par Mobile Money :

📱 Opérateur : ${selectedMobileOperator}
📞 Numéro récepteur : ${userPhone}
👤 Titulaire du compte : ${userCompanyName}
💰 Montant net à transférer : ${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol} (${cashInType === 'recurring' ? 'Abonnement mensuel renouvelable' : 'Forfait complet d intégration'})
📝 Référence obligatoire : ACC-${Date.now().toString().slice(-4)}

Dès réception du SMS de notification de l opérateur, vos accès et livrables sont déployés sous 2h.

Merci pour votre confiance,
${userCompanyName}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 2: BANQUES LOCALES & VIREMENT B2B */}
                {activePaymentRail === 'bank_transfer' && (
                  <div className="p-5 bg-[#0D1017] border border-blue-500/25 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                      <div>
                        <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                          Virement Bancaire Direct B2B (Compte Professionnel)
                        </span>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Recommandé pour les PME, institutions, ONG et grands comptes. 0% de frais d intermédiaire.
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const invoiceText = `=== FACTURE PRO-FORMA B2B N° FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)} ===\n` +
                            `ÉMETTEUR :\n` +
                            `Raison Sociale : ${userCompanyName}\n` +
                            `Identifiant Légal : ${userNif}\n` +
                            `Localisation : Niamey, Niger (Zone UEMOA)\n\n` +
                            `CLIENT :\n` +
                            `Raison Sociale : ${clientCompanyName}\n` +
                            `Email Contact : ${clientContactEmail}\n` +
                            `Date d émission : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
                            `DÉSIGNATION DE LA PRESTATION :\n` +
                            `- Service : ${opportunityTitle}\n` +
                            `- Nature : ${cashInType === 'recurring' ? 'Prestation mensuelle récurrente' : 'Déploiement opérationnel clé en main'}\n` +
                            `- Montant Net à Régler : ${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol}\n\n` +
                            `COORDONNÉES BANCAIRES POUR LE VIREMENT :\n` +
                            `Banque Domiciliataire : ${selectedBank}\n` +
                            `Titulaire : ${userCompanyName}\n` +
                            `RIB / IBAN UEMOA : ${userIban}\n` +
                            `Référence à inscrire impérativement : FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}\n\n` +
                            `Dispositions légales : Facture conforme aux règles de l OHADA et du Code Général des Impôts.`;
                          copyToClipboard(invoiceText, 'bankInvoice');
                        }}
                        className="cursor-pointer px-3.5 py-1.5 text-xs font-medium text-white bg-[#11141C] hover:bg-white/[0.06] border border-white/[0.1] rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Receipt className="w-3.5 h-3.5 text-blue-400" />
                        <span>{copiedSection === 'bankInvoice' ? 'Facture Copiée !' : 'Copier la Facture & RIB'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Votre Banque Locale
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white text-xs rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          {currentGeoProfile.banks.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Votre RIB / IBAN Professionnel
                        </label>
                        <input
                          type="text"
                          value={userIban}
                          onChange={(e) => setUserIban(e.target.value)}
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white font-mono text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Visual Pro-forma Card */}
                    <div className="p-4 bg-[#11141C] border border-white/[0.08] rounded-lg space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-start border-b border-white/[0.07] pb-2.5">
                        <div>
                          <div className="font-semibold text-white text-sm font-display">{userCompanyName}</div>
                          <div className="text-[11px] text-slate-400">{userNif}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">FACTURE PRO-FORMA</div>
                          <div className="text-[11px] text-slate-400 tabular-nums">Date : {new Date().toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs py-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Désignation :</span>
                          <strong className="text-white font-medium">{opportunityTitle}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Total Net à Payer :</span>
                          <strong className="text-base text-blue-400 font-semibold tabular-nums">
                            {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0D1017] border border-blue-500/20 rounded-md text-[11px] space-y-1">
                        <div className="text-blue-400 font-semibold uppercase">Coordonnées de Virement</div>
                        <div className="text-slate-300">Banque : <span className="text-white font-medium">{selectedBank}</span></div>
                        <div className="text-slate-300">RIB/IBAN : <span className="text-white font-mono">{userIban}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 3: TRANSFER AGENCIES & VIRTUAL CARDS */}
                {activePaymentRail === 'transfer_agency' && (
                  <div className="p-5 bg-[#0D1017] border border-amber-500/25 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                      <div>
                        <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">
                          Agences de Transfert (NITA, Al Izza, Amana) & Cartes Virtuelles
                        </span>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Encaissement physique en agence dans toutes les villes du Niger (Niamey, Zinder, Maradi, Tahoua, Agadez) ou chargement sur carte Visa prépayée.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 shrink-0">
                        Retrait Espèces Instantané
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Réseau d Agence ou Carte
                        </label>
                        <select
                          value={selectedAgency}
                          onChange={(e) => setSelectedAgency(e.target.value)}
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white text-xs rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-amber-500"
                        >
                          {currentGeoProfile.transferAgencies.map((agency) => (
                            <option key={agency} value={agency}>
                              {agency}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                          Nom & Prénoms du Bénéficiaire (Sur Pièce d Identité)
                        </label>
                        <input
                          type="text"
                          value={userCompanyName}
                          onChange={(e) => setUserCompanyName(e.target.value)}
                          className="w-full bg-[#11141C] border border-white/[0.1] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[#11141C] border border-white/[0.07] rounded-lg space-y-2 text-xs">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Procédure pour le Client</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Le client se présente à n importe quel guichet {selectedAgency} ou effectue un envoi depuis l application mobile {selectedAgency}.
                        Il mentionne votre nom complet et votre numéro de téléphone (<strong className="text-white font-mono">{userPhone}</strong>).
                        Vous recevez instantanément le code de retrait par SMS et pouvez retirer les espèces ou les créditer sur votre carte Visa NITA / Djamo.
                      </p>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 4: STRIPE & INTERNATIONAL */}
                {activePaymentRail === 'stripe' && (
                  <div className="p-5 bg-[#0D1017] border border-blue-500/25 rounded-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
                      <div>
                        <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                          Paiement en Ligne Sécurisé par Carte Bancaire (Clients Internationaux)
                        </span>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Permet d encaisser des clients en Europe, USA ou diaspora via Carte Bancaire, Apple Pay ou SEPA.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-blue-400 shrink-0">
                        Stripe Billing & Payout J+2
                      </div>
                    </div>

                    {/* Stripe Payment Link */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-300">
                          Lien de Paiement Stripe Sécurisé Généré
                        </span>
                        <button
                          onClick={() => {
                            const eurAmount = Math.round(cashInAmount / (isAfricanUemoa ? currentGeoProfile.fxRateToEur : 1));
                            const link = `https://buy.stripe.com/live_omni_${circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount=${eurAmount}&prefilled_email=${encodeURIComponent(clientContactEmail)}`;
                            copyToClipboard(link, 'stripelink');
                          }}
                          className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedSection === 'stripelink' ? 'Lien Copié !' : 'Copier le Lien Stripe'}</span>
                        </button>
                      </div>

                      <div className="p-3 bg-[#11141C] border border-white/[0.08] rounded-lg font-mono text-xs text-blue-300 truncate">
                        https://buy.stripe.com/live_omni_{circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount={Math.round(cashInAmount / (isAfricanUemoa ? currentGeoProfile.fxRateToEur : 1))}eur&client={encodeURIComponent(clientCompanyName)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Démarches Officielles Adaptées au Contexte Géographique */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    3. Les 3 Démarches Réelles pour Être en Règle & Prêt à Encaisser ({currentGeoProfile.countryName})
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAfricanUemoa
                      ? 'Formalisation simple au Niger et en Afrique de l Ouest : démarches à la Maison de l Entreprise, RCCM et compte bancaire professionnel.'
                      : 'Création en ligne sans apport de capital en moins de 30 minutes.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#0D1017]">
                  {/* Step A */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-blue-400">
                        DÉMARCHE 01
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-white">
                          {isAfricanUemoa ? 'RCCM & NIF au Guichet Unique' : 'Statut Juridique Gratuit (15 min)'}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isAfricanUemoa ? 'Maison de l Entreprise du Niger (CCIN Niamey)' : 'formalites.entreprises.gouv.fr'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Enregistrez votre Entreprise Individuelle (Établissement). Coût très faible, capital minimum : 0 FCFA. Vous obtenez votre N° RCCM et NIF en 48h à 72h.'
                          : 'Créez votre Micro-entreprise en BNC Prestation de services. 0 € de capital requis. SIRET délivré en 3 à 7 jours.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
                      {isAfricanUemoa
                        ? 'Régime de l Impôt Synthétique (ISF) : pas de comptabilité lourde pour démarrer.'
                        : 'Si 0 € encaissé = 0 € de cotisations à payer.'}
                    </div>
                  </div>

                  {/* Step B */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-amber-400">
                        DÉMARCHE 02
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-white">
                          {isAfricanUemoa ? 'Compte Bancaire Pro & Compte Marchand' : 'Compte Bancaire Pro en Ligne'}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isAfricanUemoa ? 'SONIBANK, ECOBANK Niger ou Airtel Business' : 'Qonto, Shine ou BoursoBank'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Ouvrez un compte professionnel à la SONIBANK, ECOBANK Niger ou BOA Niger avec votre RCCM et NIF, et activez une ligne Airtel Money Marchand pour encaisser vos clients.'
                          : 'Ouvrez un compte dédié en ligne. Vous obtenez un IBAN immédiatement avec carte Mastercard pro.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
                      Notifications SMS instantanées à chaque encaissement client reçu.
                    </div>
                  </div>

                  {/* Step C */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-emerald-400">
                        DÉMARCHE 03
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-white">
                          {isAfricanUemoa ? 'Cartes Visa Virtuelles & Passerelles' : 'Passerelle Stripe & Payouts Automatiques'}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isAfricanUemoa ? 'Carte NITA Visa, Djamo, FedaPay, PayTech' : 'Sur stripe.com (gratuit)'}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Obtenez une carte Visa virtuelle (NITA Transfert ou Djamo) pour lier vos outils internationaux ou utilisez un agrégateur de paiement UEMOA (FedaPay, CinetPay) pour encaisser en ligne.'
                          : 'Créez un compte Stripe gratuit et liez votre compte bancaire pour des virements quotidiens sous 48h.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
                      Permet d encaisser des fonds locaux et internationaux sans blocage géographique.
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Ce qu il Vous Reste Réellement Net en Poche */}
              <div className="p-6 space-y-3 bg-[#0D1017]/50">
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                  4. Combien d Argent Réel Vous Reste-t-il dans la Poche ? (Estimation indicative)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] border border-white/[0.08] rounded-lg bg-[#11141C] text-xs font-mono">
                  <div className="p-4">
                    <div className="text-[10px] text-slate-400 uppercase">Pour {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol} Encaissés</div>
                    <div className="text-lg font-semibold text-white tabular-nums mt-1">
                      {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-sans">Chiffre d affaires brut</div>
                  </div>

                  <div className="p-4">
                    <div className="text-[10px] text-slate-400 uppercase">Frais d Encaissement</div>
                    <div className="text-lg font-semibold text-rose-400 tabular-nums mt-1">
                      {activePaymentRail === 'bank_transfer'
                        ? '0 FCFA'
                        : `-${Math.round(cashInAmount * 0.015).toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol}`}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
                      {activePaymentRail === 'bank_transfer' ? 'Virement bancaire direct' : '1% à 1.5% opérateur'}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-[10px] text-slate-400 uppercase">Fiscalité Indicative ({currentGeoProfile.standardTaxRate}%)</div>
                    <div className="text-lg font-semibold text-rose-400 tabular-nums mt-1">
                      -{Math.round(cashInAmount * (currentGeoProfile.standardTaxRate / 100)).toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5 font-sans">
                      {isAfricanUemoa ? 'Régime ISF forfaitaire BNC' : 'Cotisations URSSAF'}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-950/15">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Net Direct Pour Vous</div>
                    <div className="text-lg font-semibold text-emerald-400 tabular-nums mt-1">
                      {Math.round(cashInAmount * (1 - (currentGeoProfile.standardTaxRate / 100) - (activePaymentRail === 'bank_transfer' ? 0 : 0.015))).toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-emerald-300/80 mt-0.5 font-sans">Net disponible sur votre compte</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
