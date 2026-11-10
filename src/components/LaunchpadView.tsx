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
} from 'lucide-react';
import { LaunchpadCircuit, SectorCategory, EconomicSector } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';

interface LaunchpadViewProps {
  initialSectorId?: SectorCategory;
  initialOpportunityTitle?: string;
  onAddToPipeline: (title: string, sectorId: SectorCategory, targetMrr: number) => void;
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
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<SectorCategory>(initialSectorId);
  const [opportunityTitle, setOpportunityTitle] = useState<string>(initialOpportunityTitle);
  const currentSector = ECONOMIC_SECTORS.find((s) => s.id === selectedSectorId) || ECONOMIC_SECTORS[0];
  const [circuit, setCircuit] = useState<LaunchpadCircuit>(() =>
    getDefaultCircuit(currentSector.name, initialOpportunityTitle)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<'offer' | 'outreach' | 'contract' | 'landing' | 'delivery' | 'cash_in'>('offer');

  // Cash-in interactive tool states
  const [cashInType, setCashInType] = useState<'recurring' | 'oneoff'>('recurring');
  const [cashInAmount, setCashInAmount] = useState<number>(2500);
  const [clientCompanyName, setClientCompanyName] = useState<string>('Groupe Horizon & Associés');
  const [clientContactEmail, setClientContactEmail] = useState<string>('direction@groupe-horizon.fr');
  const [userIban, setUserIban] = useState<string>('FR76 1680 7000 4512 3456 7890 123');
  const [userCompanyName, setUserCompanyName] = useState<string>('Studio OmniVectis Solutions');

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
      <div className="border-b border-slate-800 pb-6">
        <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-1">
          Circuit d Exécution & Encaissement Réel (0 à 10 000 € / mois)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Launchpad de Monétisation Réelle
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
          Passez de la théorie à l encaissement bancaire. Cette suite génère automatiquement les 6 engrenages
          nécessaires pour vendre, contractualiser, facturer par Stripe, encaisser sur votre banque et délivrer sans travail manuel.
        </p>
      </div>

      {/* Target Business Selection & Switcher Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Opportunité à Déployer & Monétiser :
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 cursor-pointer focus:outline-none focus:border-indigo-500"
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
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerateCircuit()}
            disabled={loading}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/60 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-end"
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
        <div className="p-12 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-white">Assemblage des engrenages d encaissement...</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Rédaction des offres Stripe, des emails d acquisition, du contrat juridique B2B et du prompt de délivrance.
          </p>
        </div>
      )}

      {circuit && (
        <div className="space-y-6">
          {/* Navigation Tabs across the 5 Gears */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveStep('offer')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'offer' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. L Offre & Tarifs Stripe</span>
            </button>

            <button
              onClick={() => setActiveStep('outreach')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'outreach' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Scripts de Prospection</span>
            </button>

            <button
              onClick={() => setActiveStep('contract')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'contract' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Contrat B2B Juridique</span>
            </button>

            <button
              onClick={() => setActiveStep('landing')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'landing' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span>4. Tunnel & Page de Vente</span>
            </button>

            <button
              onClick={() => setActiveStep('delivery')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'delivery' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-teal-400" />
              <span>5. Délivrance Automatisée IA</span>
            </button>

            <button
              onClick={() => setActiveStep('cash_in')}
              className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'cash_in'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-emerald-400 bg-slate-950/60 border border-emerald-500/30'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">6. Comment Encaisser l Argent (Stripe & Banque)</span>
            </button>
          </div>

          {/* ENGRENAGE 1: L'OFFRE & LES PRIX STRIPE */}
          {activeStep === 'offer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Engrenage 01 · Positionnement Commercial & Encaissement
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    L Offre Irrésistible & Grille Tarifaire
                  </h3>
                </div>

                <button
                  onClick={() =>
                    onAddToPipeline(circuit.opportunityTitle, selectedSectorId, 15000)
                  }
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Enregistrer dans mon Pipeline</span>
                </button>
              </div>

              {/* Value Proposition & Risk Reversal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                    Promesse de Valeur Centrale :
                  </span>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {circuit.commercialOffer.heroPromise}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Cible : {circuit.commercialOffer.targetPersona}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Garantie Anti-Risque (Élimine toute objection) :
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {circuit.commercialOffer.riskReversalGuarantee}
                  </p>
                </div>
              </div>

              {/* 3 Stripe Pricing Tiers */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Les 3 Paliers d Encaissement (Paramètres Stripe Directs)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {circuit.commercialOffer.tiers.map((tier: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                          <span className="text-[11px] text-slate-500 font-mono">Tier 0{idx + 1}</span>
                        </div>

                        <div>
                          <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
                            {tier.price}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{tier.billingCycle}</div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                          {tier.deliverables.map((d: string, dIdx: number) => (
                            <div key={dIdx} className="flex items-start gap-2 text-slate-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 space-y-2">
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
                          className="cursor-pointer w-full py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3 h-3" />
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
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
                    Engrenage 02 · Acquisition Client Prévisible
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Séquence Cold Outbound Multicanale (3 Étapes)
                  </h3>
                </div>

                <div className="text-xs text-slate-400">
                  Canal : <strong className="text-white">{circuit.outreachSequence.channel}</strong>
                </div>
              </div>

              {/* Targeting Filter Instructions */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[11px] block">
                  Filtres de Ciblage Sales Navigator / Apollo :
                </span>
                <p className="text-slate-300 font-mono leading-relaxed">
                  {circuit.outreachSequence.targetFilters}
                </p>
              </div>

              {/* Emails Cadence */}
              <div className="space-y-4">
                {/* Email 1 */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono flex items-center justify-center text-[11px]">
                        1
                      </span>
                      <span>Email 1 · Accroche & Audit Pilote Offert (J+0)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(
                          `Objet : ${circuit.outreachSequence.email1Subject}\n\n${circuit.outreachSequence.email1Body}`,
                          'email1'
                        )
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email1' ? 'Copié !' : 'Copier Email 1'}</span>
                    </button>
                  </div>

                  <div className="text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                    Objet : <span className="text-slate-200">{circuit.outreachSequence.email1Subject}</span>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-slate-900/60 p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email1Body}
                  </div>
                </div>

                {/* Email 2 */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono flex items-center justify-center text-[11px]">
                        2
                      </span>
                      <span>Email 2 · Relance avec Preuve Chiffrée (J+3)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(circuit.outreachSequence.email2Followup, 'email2')
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email2' ? 'Copié !' : 'Copier Email 2'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-slate-900/60 p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email2Followup}
                  </div>
                </div>

                {/* Email 3 */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 font-mono flex items-center justify-center text-[11px]">
                        3
                      </span>
                      <span>Email 3 · Rupture Polie & Rareté (J+7)</span>
                    </span>

                    <button
                      onClick={() =>
                        copyToClipboard(circuit.outreachSequence.email3Breakup, 'email3')
                      }
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'email3' ? 'Copié !' : 'Copier Email 3'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-line font-mono bg-slate-900/60 p-4 rounded-lg leading-relaxed">
                    {circuit.outreachSequence.email3Breakup}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 3: CONTRAT B2B JURIDIQUE */}
          {activeStep === 'contract' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                    Engrenage 03 · Sécurisation Juridique & Facturation
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
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
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedSection === 'contract' ? 'Contrat Intégral Copié !' : 'Copier le Contrat (Yousign/DocuSign)'}</span>
                </button>
              </div>

              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5 text-xs text-slate-300 leading-relaxed font-serif">
                <div className="text-center font-bold text-white text-sm font-sans tracking-tight border-b border-slate-800 pb-3">
                  {circuit.legalAgreement.contractTitle}
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-white font-sans text-xs">ARTICLE 1 · OBJET DU CONTRAT</div>
                  <p>{circuit.legalAgreement.purposeClause}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-white font-sans text-xs">ARTICLE 2 · CONDITIONS FINANCIÈRES & RÈGLEMENT</div>
                  <p>{circuit.legalAgreement.financialTerms}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-white font-sans text-xs">ARTICLE 3 · CONFIDENTIALITÉ & PROPRIÉTÉ INTELLECTUELLE</div>
                  <p>{circuit.legalAgreement.confidentialityAndIP}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-white font-sans text-xs">ARTICLE 4 · DURÉE & RÉSILIATION</div>
                  <p>{circuit.legalAgreement.terminationClause}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between font-sans text-[11px] text-slate-500">
                  <div>Signature & Cachet du Client</div>
                  <div>Signature & Cachet du Prestataire</div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 4: TUNNEL & LANDING PAGE */}
          {activeStep === 'landing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider block">
                    Engrenage 04 · Tunnel de Conversion
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
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
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedSection === 'landing' ? 'Wireframe Copié !' : 'Copier le Wireframe'}</span>
                </button>
              </div>

              {/* Live Mockup Wireframe Preview */}
              <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl space-y-8 text-center max-w-3xl mx-auto">
                {/* Hero Section */}
                <div className="space-y-4">
                  <span className="text-[11px] font-mono font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                    {circuit.sectorName} · Solution Certifiée
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {circuit.landingPageWireframe.heroHeadline}
                  </h2>
                  <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    {circuit.landingPageWireframe.heroSubheadline}
                  </p>
                  <div>
                    <button className="px-6 py-3 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 transition-colors">
                      {circuit.landingPageWireframe.ctaButtonText}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {circuit.landingPageWireframe.socialProofHook}
                  </div>
                </div>

                {/* 3 Problems Addressed */}
                <div className="text-left p-6 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                    Les 3 frictions que nous éliminons chez nos clients :
                  </span>
                  <div className="space-y-2 text-xs text-slate-300">
                    {circuit.landingPageWireframe.problemSection.map((prob: string, pIdx: number) => (
                      <div key={pIdx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold shrink-0">✕</span>
                        <span>{prob}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Solution Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                  {circuit.landingPageWireframe.solutionFeatures.map((feat: any, fIdx: number) => (
                    <div key={fIdx} className="p-4 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="font-bold text-white text-xs">{feat.title}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{feat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 5: DÉLIVRANCE AUTOMATISÉE */}
          {activeStep === 'delivery' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
                    Engrenage 05 · Opérations & Marge Maximale (Zero-Code)
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Moteur de Délivrance Automatisé (Gain : {circuit.deliveryEngine.timeSavedHoursPerClient}h / client)
                  </h3>
                </div>

                <div className="text-xs font-mono text-emerald-400 font-bold">
                  Marge Opérationnelle : &gt; 85%
                </div>
              </div>

              {/* Execution Pipeline Steps */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Le Flux n8n / Make.com en 4 Échelons
                </span>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg text-xs space-y-1 mb-3">
                  <span className="font-semibold text-teal-300">Événement Déclencheur (Trigger) : </span>
                  <span className="text-slate-300">{circuit.deliveryEngine.inputTrigger}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {circuit.deliveryEngine.processingSteps.map((step: string, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {sIdx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Production AI Delivery Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Prompt d Inférence IA de Délivrance (À intégrer dans votre webhook) :
                  </span>

                  <button
                    onClick={() =>
                      copyToClipboard(circuit.deliveryEngine.aiPromptTemplate, 'prompt')
                    }
                    className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSection === 'prompt' ? 'Copié !' : 'Copier le Prompt'}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {circuit.deliveryEngine.aiPromptTemplate}
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Format final délivré au client : <strong className="text-white">{circuit.deliveryEngine.outputDeliverableFormat}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 6: COMMENT ENCAISSER L'ARGENT (STRIPE, VIREMENT & BANQUE) */}
          {activeStep === 'cash_in' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Engrenage 06 · Circuit Financier & Encaissement Bancaire Réel
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    Comment Vous Encaissez l Argent de Vos Clients
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    De l accord commercial jusqu au crédit réel sur votre compte bancaire. Voici le circuit technique,
                    contractuel et bancaire pour collecter les paiements sous 48h sans intermédiaire obscur.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Règlement Garanti J+2</span>
                  </span>
                </div>
              </div>

              {/* 1. Visuel du Circuit Financier (Timeline 4 Étapes) */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  1. Le Parcours Financier Complet (De la Signature au Compte en Banque)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                      <span>ÉTAPE 01</span>
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Accord & Signature</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le client signe le contrat généré (étape 3) ou valide le devis/bon de commande par e-mail avec mention d accord.
                    </p>
                    <div className="text-[11px] text-slate-500 font-mono">Délai : Immédiat</div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-indigo-400">
                      <span>ÉTAPE 02</span>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Émission du Paiement</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Vous envoyez soit votre <strong>Lien Stripe Payment Link</strong> (CB, Apple Pay) soit une <strong>Facture avec votre IBAN</strong> pour virement direct.
                    </p>
                    <div className="text-[11px] text-indigo-400 font-mono">Lien direct ou IBAN</div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                      <span>ÉTAPE 03</span>
                      <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Validation Sécurisée</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le client règle. Les fonds sont validés et séquestrés immédiatement par Stripe ou reçus par virement SEPA instantané.
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono">Notification push directe</div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-emerald-500/30 bg-emerald-950/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
                      <span>ÉTAPE 04</span>
                      <Wallet className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Virement sur Votre Banque</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Stripe transfère automatiquement les fonds sur votre IBAN professionnel sous <strong>48 heures</strong> (Payouts quotidiens programmés).
                    </p>
                    <div className="text-[11px] text-emerald-400 font-mono font-bold">Argent réel disponible</div>
                  </div>
                </div>
              </div>

              {/* 2. Outil Interactif : Générateur de Lien Stripe & Email de Facturation */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                      Outil 1 · Générateur de Lien de Règlement Stripe & Email Client
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Configurer l Encaissement pour {opportunityTitle}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCashInType('recurring')}
                      className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        cashInType === 'recurring'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Abonnement Mensuel (MRR)
                    </button>
                    <button
                      onClick={() => setCashInType('oneoff')}
                      className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        cashInType === 'oneoff'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Acompte / Forfait Unique
                    </button>
                  </div>
                </div>

                {/* Configuration form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Montant à Encaisser (€ HT) :
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cashInAmount}
                        onChange={(e) => setCashInAmount(Math.max(100, Number(e.target.value) || 0))}
                        className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 tabular-nums"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
                        {cashInType === 'recurring' ? '€ / mois' : '€ net'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Entreprise Cliente :
                    </label>
                    <input
                      type="text"
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Email Destinataire (Comptabilité Client) :
                    </label>
                    <input
                      type="email"
                      value={clientContactEmail}
                      onChange={(e) => setClientContactEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Financial Breakdown (Gross -> Stripe Fee -> Net Bank Payout) */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider">Montant Facturé</div>
                      <div className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                        {cashInAmount.toLocaleString('fr-FR')} € {cashInType === 'recurring' && <span className="text-xs text-slate-400">/ mois</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider">Frais Stripe UE (1,5% + 0,25€)</div>
                      <div className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-0.5">
                        -{(cashInAmount * 0.015 + 0.25).toFixed(2)} €
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">Net Viré sur Votre Banque (J+2)</div>
                      <div className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums mt-0.5">
                        {(cashInAmount - (cashInAmount * 0.015 + 0.25)).toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Stripe Payment Link */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Lien de Paiement Stripe Sécurisé Généré :
                    </span>
                    <button
                      onClick={() => {
                        const link = `https://buy.stripe.com/live_omni_${circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount=${cashInAmount}&prefilled_email=${encodeURIComponent(clientContactEmail)}`;
                        copyToClipboard(link, 'stripelink');
                      }}
                      className="cursor-pointer px-3 py-1 text-xs text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'stripelink' ? 'Lien Copié !' : 'Copier le Lien Stripe'}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-cyan-300 truncate">
                    https://buy.stripe.com/live_omni_{circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount={cashInAmount}&prefilled_email={clientContactEmail}
                  </div>
                </div>

                {/* Ready to send Email with Payment Link */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Email de Demande de Règlement Prêt à Envoyer au Client :
                    </span>
                    <button
                      onClick={() => {
                        const emailContent = `Objet : Règlement de votre accès - ${opportunityTitle} (${clientCompanyName})\n\n` +
                          `Bonjour,\n\n` +
                          `Faisant suite à notre accord concernant le déploiement de : ${opportunityTitle},\n` +
                          `vous trouverez ci-dessous le lien de règlement sécurisé par carte bancaire professionnelle ou prélèvement SEPA :\n\n` +
                          `Lien de paiement sécurisé Stripe : https://buy.stripe.com/live_omni_${circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount=${cashInAmount}&prefilled_email=${clientContactEmail}\n\n` +
                          `Montant : ${cashInAmount.toLocaleString('fr-FR')} € HT (${cashInType === 'recurring' ? 'Abonnement mensuel renouvelable' : 'Règlement forfaitaire'})\n` +
                          `Une facture acquittée vous sera automatiquement transmise dès validation.\n\n` +
                          `Dès confirmation, vos accès et les livrables opérationnels seront immédiatement déployés.\n\n` +
                          `Bien cordialement,\n` +
                          `${userCompanyName}`;
                        copyToClipboard(emailContent, 'emailpayment');
                      }}
                      className="cursor-pointer px-3 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSection === 'emailpayment' ? 'Email Copié !' : 'Copier l Email de Paiement'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {`Objet : Règlement de votre accès - ${opportunityTitle} (${clientCompanyName})

Bonjour,

Faisant suite à notre accord concernant le déploiement de : ${opportunityTitle}, vous trouverez ci-dessous le lien de règlement sécurisé par carte bancaire ou prélèvement SEPA :

🔗 Lien de paiement sécurisé Stripe : https://buy.stripe.com/live_omni_${circuit.opportunityTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}?amount=${cashInAmount}&prefilled_email=${clientContactEmail}

Montant : ${cashInAmount.toLocaleString('fr-FR')} € HT (${cashInType === 'recurring' ? 'Abonnement mensuel renouvelable sans engagement' : 'Règlement forfaitaire complet'})
Une facture acquittée avec TVA vous sera transmise automatiquement dès validation.

Dès confirmation, vos accès et livrables sont immédiatement déployés.

Bien cordialement,
${userCompanyName}`}
                  </div>
                </div>
              </div>

              {/* 3. Outil 2 : Générateur de Facture B2B & Virement Bancaire Direct (0% de Frais) */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                      Outil 2 · Facture B2B & Virement Bancaire Direct (IBAN)
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Pour les Clients Préférant le Virement Direct (0% de Frais)
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      const invoiceText = `=== FACTURE B2B N° FAC-2025-014 ===\n` +
                        `Émetteur : ${userCompanyName}\n` +
                        `Client : ${clientCompanyName} (${clientContactEmail})\n` +
                        `Date d émission : ${new Date().toLocaleDateString('fr-FR')}\n` +
                        `Délai de règlement : À réception (Virement sous 48h)\n\n` +
                        `DÉSIGNATION :\n` +
                        `- Prestation : ${opportunityTitle}\n` +
                        `- Modalité : ${cashInType === 'recurring' ? 'Abonnement mensuel' : 'Forfait de déploiement'}\n` +
                        `- Total Net à Payer : ${cashInAmount.toLocaleString('fr-FR')} €\n\n` +
                        `COORDONNÉES BANCAIRES POUR VIREMENT :\n` +
                        `Titulaire : ${userCompanyName}\n` +
                        `IBAN : ${userIban}\n` +
                        `BIC : TRWFR21XXX\n` +
                        `Banque : Qonto / Revolut Business\n` +
                        `Motif du virement obligatoire : FAC-2025-014\n\n` +
                        `Mentions légales : Dispensé d immatriculation en application de l article L 123-1-1 du code de commerce. TVA non applicable, art. 293 B du CGI (ou TVA 20%). Pénalités de retard : 3 fois le taux légal + indemnité forfaitaire pour frais de recouvrement de 40€.`;
                      copyToClipboard(invoiceText, 'invoice');
                    }}
                    className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>{copiedSection === 'invoice' ? 'Facture & IBAN Copiés !' : 'Copier la Facture & IBAN'}</span>
                  </button>
                </div>

                {/* Invoice inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Votre Entreprise ou Nom Commercial :
                    </label>
                    <input
                      type="text"
                      value={userCompanyName}
                      onChange={(e) => setUserCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Votre IBAN Professionnel :
                    </label>
                    <input
                      type="text"
                      value={userIban}
                      onChange={(e) => setUserIban(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Visual Invoice Card */}
                <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-4 font-mono text-xs text-slate-300">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <div className="font-bold text-white text-sm">{userCompanyName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Prestataire de Services B2B & Solutions Numériques</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">FACTURE N° FAC-2025-014</div>
                      <div className="text-[11px] text-slate-400">Date : {new Date().toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px]">
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider block">Facturé à :</span>
                      <strong className="text-white text-xs">{clientCompanyName}</strong>
                      <div className="text-slate-400">{clientContactEmail}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 uppercase tracking-wider block">Modalité de paiement :</span>
                      <strong className="text-emerald-400">Virement bancaire SEPA sous 48h</strong>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-950 px-3 py-2 text-[11px] font-bold text-slate-300 flex justify-between">
                      <span>DÉSIGNATION DE LA PRESTATION</span>
                      <span>TOTAL HT</span>
                    </div>
                    <div className="p-3 bg-slate-900/40 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-white font-semibold">{opportunityTitle}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {cashInType === 'recurring' ? 'Mensualité récurrente M+1' : 'Déploiement complet & intégration'}
                        </div>
                      </div>
                      <div className="font-bold text-white font-mono text-sm tabular-nums">
                        {cashInAmount.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>

                  {/* Banking coordinates box */}
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1 text-[11px]">
                    <div className="text-emerald-400 font-bold uppercase tracking-wider">
                      Coordonnées pour le virement bancaire :
                    </div>
                    <div className="text-slate-200">
                      IBAN : <strong className="font-mono text-white">{userIban}</strong>
                    </div>
                    <div className="text-slate-400">
                      BIC : <span className="font-mono text-slate-300">TRWFR21XXX</span> · Banque : <span className="text-slate-300">Qonto / Revolut Pro</span>
                    </div>
                    <div className="text-[10px] text-emerald-300/80">
                      Indiquer impérativement en référence du virement : <strong>FAC-2025-014</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Les 3 Démarches Officielles pour Démarrer à 0 € (Sans Capital) */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    3. Les 3 Démarches Gratuites pour Être en Règle & Prêt à Encaisser
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Aucun apport financier requis. Tout se fait en ligne depuis votre ordinateur en moins de 30 minutes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step A */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-sm">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Statut Juridique Gratuit (15 min)</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">Sur formalites.entreprises.gouv.fr</div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Créez votre <strong>Micro-entreprise</strong> (BNC Prestation de services).
                      Coût : <strong>0 €</strong>. Capital requis : <strong>0 €</strong>.
                      Vous obtenez votre numéro SIRET officiel en 3 à 7 jours.
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800/80">
                      <strong className="text-white">Règle d or :</strong> Si vous encaissez 0 €, vous payez 0 € de charges sociales ou d impôt. Aucun risque financier.
                    </div>
                  </div>

                  {/* Step B */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center justify-center text-sm">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Compte Bancaire Pro en Ligne (10 min)</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">Qonto, Shine, Revolut Pro ou BoursoBank</div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ouvrez un compte dédié avec votre pièce d identité. Vous obtenez un <strong>IBAN français (FR76)</strong> immédiatement et une carte Mastercard.
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800/80">
                      Notifications push en temps réel sur smartphone à chaque paiement client reçu.
                    </div>
                  </div>

                  {/* Step C */}
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Compte Stripe & Virements Automatiques</h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">Sur stripe.com (gratuit, sans abonnement)</div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Créez un compte Stripe gratuit et liez votre IBAN. Activez les <strong>Payment Links</strong>.
                      Stripe vire automatiquement les encaissements sur votre banque sous 48h.
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 border border-slate-800/80">
                      Vous pouvez accepter Carte Bancaire, Apple Pay, Google Pay et Prélèvement SEPA dans 135 pays.
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Comparateur : Quel Moyen pour Quel Montant ? */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  4. Quel Moyen d Encaissement Choisir Selon le Montant ?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Lien Stripe CB (500 € à 3 000 €)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Recommandé pour les PME et indépendants. Conversion instantanée, aucune barrière, paiement par carte d entreprise en 10 secondes.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Virement SEPA Direct (&gt; 3 000 €)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Recommandé pour les ETI, grands comptes et forfaits annuels. 0% de frais Stripe. Le client effectue un virement direct sur votre IBAN.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Prélèvement SEPA Stripe (MRR)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Recommandé pour les abonnements mensuels récurrents sans risque d expiration de carte bancaire. Débit automatique chaque mois.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Ce qu il Vous Reste Réellement Net en Poche */}
              <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  5. Combien d Argent Réel Vous Reste-t-il dans la Poche ?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Pour 5 000 € Encaissés</div>
                    <div className="text-lg font-bold text-white tabular-nums mt-0.5">5 000 €</div>
                    <div className="text-[10px] text-slate-500">Chiffre d affaires brut</div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Frais Stripe (1.5%)</div>
                    <div className="text-lg font-bold text-rose-400 tabular-nums mt-0.5">-75 €</div>
                    <div className="text-[10px] text-slate-500">Ou 0€ si virement direct</div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Cotisations URSSAF (21.1%)</div>
                    <div className="text-lg font-bold text-rose-400 tabular-nums mt-0.5">-1 055 €</div>
                    <div className="text-[10px] text-emerald-400/80">-530 € la 1ère année avec ACRE</div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Net Direct Pour Vous</div>
                    <div className="text-lg font-extrabold text-emerald-400 tabular-nums mt-0.5">3 870 € à 4 395 €</div>
                    <div className="text-[10px] text-emerald-300">Net disponible sur votre compte</div>
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
