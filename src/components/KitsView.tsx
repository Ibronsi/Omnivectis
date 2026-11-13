import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  Download,
  Send,
  Eye,
  Code,
  DollarSign,
  Building,
  Truck,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  CheckSquare,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  StrictOpportunity,
  DigitalLaunchKit,
  PhysicalExploitationPlan,
  PhysicalHypothesis,
  CountryCode,
} from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';

interface KitsViewProps {
  countryCode: CountryCode;
  selectedOpportunity?: StrictOpportunity | null;
  onNavigateToValidationQueue: () => void;
}

export const KitsView: React.FC<KitsViewProps> = ({
  countryCode,
  selectedOpportunity,
  onNavigateToValidationQueue,
}) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;

  const [activeKitType, setActiveKitType] = useState<'numérique' | 'physique'>('numérique');
  const [digitalKit, setDigitalKit] = useState<DigitalLaunchKit | null>(null);
  const [physicalPlan, setPhysicalPlan] = useState<PhysicalExploitationPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [htmlViewMode, setHtmlViewMode] = useState<'preview' | 'code'>('preview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);

  // Editable hypotheses for physical plan
  const [editableHypotheses, setEditableHypotheses] = useState<PhysicalHypothesis[]>([]);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [monthlyFixedCharges, setMonthlyFixedCharges] = useState<number>(0);
  const [savingHypotheses, setSavingHypotheses] = useState<boolean>(false);

  // Load existing kit if opportunity is selected
  useEffect(() => {
    if (selectedOpportunity) {
      setActiveKitType(selectedOpportunity.type);
      loadKitForOpportunity(selectedOpportunity.id);
    }
  }, [selectedOpportunity]);

  const loadKitForOpportunity = async (oppId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kits/${oppId}`);
      const data = await res.json();
      if (data?.kit) {
        if (data.kit.digital) setDigitalKit(data.kit.digital);
        if (data.kit.physical) {
          setPhysicalPlan(data.kit.physical);
          initPhysicalInputs(data.kit.physical);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initPhysicalInputs = (plan: PhysicalExploitationPlan) => {
    if (plan.investmentBudget?.hypotheses) {
      setEditableHypotheses(plan.investmentBudget.hypotheses);
    }
    if (plan.breakEvenAnalysis) {
      setSellingPrice(plan.breakEvenAnalysis.unitSalePrice || (countryCode === 'NER' ? 12500 : 25));
      setUnitCost(plan.breakEvenAnalysis.unitCost || (countryCode === 'NER' ? 7500 : 15));
      setMonthlyFixedCharges(plan.breakEvenAnalysis.monthlyFixedCosts || (countryCode === 'NER' ? 350000 : 800));
    }
  };

  const handleGenerateDigitalKit = async () => {
    if (!selectedOpportunity) return;
    setLoading(true);
    setQueuedNotice(null);
    try {
      const res = await fetch('/api/kits/generate-digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity: selectedOpportunity,
          countryCode,
        }),
      });
      const data = await res.json();
      if (data?.kit) {
        setDigitalKit(data.kit);
        setQueuedNotice('Dossier généré et messages de prospection ajoutés à la file "À valider" !');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePhysicalPlan = async () => {
    if (!selectedOpportunity) return;
    setLoading(true);
    setQueuedNotice(null);
    try {
      const res = await fetch('/api/kits/generate-physical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity: selectedOpportunity,
          countryCode,
        }),
      });
      const data = await res.json();
      if (data?.plan) {
        setPhysicalPlan(data.plan);
        initPhysicalInputs(data.plan);
        setQueuedNotice('Plan généré et formalités administratives ajoutées à la file "À valider" !');
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueItem = async (title: string, category: string, payload: string, target?: string) => {
    try {
      const res = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          targetRecipient: target || 'Prospect cible',
          contentPayload: payload,
          sourceOpportunityTitle: selectedOpportunity?.title || 'Dossier opérationnel',
          countryCode,
        }),
      });
      if (res.ok) {
        setQueuedNotice(`« ${title} » a été ajouté à la file "À valider" !`);
        setTimeout(() => setQueuedNotice(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadHtml = () => {
    if (!digitalKit?.htmlSalesPage) return;
    const blob = new Blob([digitalKit.htmlSalesPage], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `page_de_vente_${selectedOpportunity?.id || 'omnivectis'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Hypotheses calculations
  const totalCalculatedInitial = editableHypotheses.reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const calculatedUnitMargin = Math.max(0, sellingPrice - unitCost);
  const calculatedBreakEvenUnits = calculatedUnitMargin > 0 ? Math.ceil(monthlyFixedCharges / calculatedUnitMargin) : 0;
  const calculatedBreakEvenRevenue = calculatedBreakEvenUnits * sellingPrice;

  const handleHypothesisAmountChange = (id: string, newAmount: number) => {
    setEditableHypotheses((prev) =>
      prev.map((h) => (h.id === id ? { ...h, amount: newAmount } : h))
    );
  };

  const handleAddHypothesis = () => {
    const newHyp: PhysicalHypothesis = {
      id: `hyp-${Date.now()}`,
      category: 'Frais Complémentaires',
      label: 'Nouvelle dépense prévisionnelle',
      amount: countryCode === 'NER' ? 100000 : 500,
      isEditable: true,
      note: 'Hypothèse définie par l utilisateur',
    };
    setEditableHypotheses((prev) => [...prev, newHyp]);
  };

  const handleDeleteHypothesis = (id: string) => {
    setEditableHypotheses((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSavePhysicalHypotheses = async () => {
    if (!physicalPlan || !selectedOpportunity) return;
    setSavingHypotheses(true);
    const updatedPlan: PhysicalExploitationPlan = {
      ...physicalPlan,
      investmentBudget: {
        ...physicalPlan.investmentBudget,
        totalInitial: totalCalculatedInitial,
        hypotheses: editableHypotheses,
      },
      breakEvenAnalysis: {
        unitSalePrice: sellingPrice,
        unitCost: unitCost,
        unitGrossMargin: calculatedUnitMargin,
        monthlyFixedCosts: monthlyFixedCharges,
        breakEvenUnits: calculatedBreakEvenUnits,
        breakEvenRevenue: calculatedBreakEvenRevenue,
      },
    };

    try {
      await fetch(`/api/kits/${selectedOpportunity.id}/physical`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlan),
      });
      setPhysicalPlan(updatedPlan);
      setQueuedNotice('Hypothèses et point mort enregistrés avec succès !');
      setTimeout(() => setQueuedNotice(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingHypotheses(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400">
            Exécution Terrain & Déploiement Prêt à l Emploi
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Dossiers de Lancement & Plans d Exploitation
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Pour les opportunités <strong className="text-cyan-400 font-medium">numériques</strong> : tunnel complet en HTML, prospection, et relances.
            Pour les opportunités <strong className="text-amber-400 font-medium">physiques</strong> : budget avec <strong className="text-slate-200 font-medium">hypothèses 100% modifiables</strong>, partenaires locaux et démarches administratives.
          </p>
        </div>

        {/* Validation Queue Quick CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNavigateToValidationQueue}
            className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-200 bg-[#11141C] hover:bg-white/[0.05] rounded-lg border border-white/[0.08] transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ouvrir la File « À valider »</span>
          </button>
        </div>
      </div>

      {/* Selected Opportunity Header or Selector */}
      {selectedOpportunity ? (
        <div className="p-5 rounded-xl bg-[#11141C] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`font-mono font-medium ${
                  selectedOpportunity.type === 'numérique' ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                {selectedOpportunity.type}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">
                Pays : <strong className="text-slate-200 font-medium">{currentProfile.countryName} ({currentProfile.currency})</strong>
              </span>
            </div>
            <h2 className="font-display text-lg font-semibold text-white">{selectedOpportunity.title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{selectedOpportunity.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedOpportunity.type === 'numérique' ? (
              <button
                onClick={handleGenerateDigitalKit}
                disabled={loading}
                className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Génération...' : digitalKit ? 'Régénérer le dossier numérique' : 'Générer le dossier'}</span>
              </button>
            ) : (
              <button
                onClick={handleGeneratePhysicalPlan}
                disabled={loading}
                className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Génération...' : physicalPlan ? 'Régénérer le plan physique' : 'Générer le plan'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#11141C] border border-white/[0.08] text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sélectionnez une opportunité dans l onglet « Opportunités » pour générer ou consulter son dossier opérationnel.</span>
          </div>
          <div className="flex items-center gap-1 p-1 bg-[#0D1017] rounded-lg border border-white/[0.07] shrink-0">
            <button
              onClick={() => setActiveKitType('numérique')}
              className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                activeKitType === 'numérique' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Exemple Numérique
            </button>
            <button
              onClick={() => setActiveKitType('physique')}
              className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                activeKitType === 'physique' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Exemple Physique
            </button>
          </div>
        </div>
      )}

      {/* Queued Feedback Strip */}
      {queuedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{queuedNotice}</span>
          </div>
          <button
            onClick={onNavigateToValidationQueue}
            className="text-xs font-semibold text-emerald-300 hover:text-white underline cursor-pointer shrink-0"
          >
            Voir la file d attente
          </button>
        </div>
      )}

      {/* ===================== VIEW A: NUMÉRIQUE ===================== */}
      {(selectedOpportunity?.type === 'numérique' || (!selectedOpportunity && activeKitType === 'numérique')) && (
        <div className="space-y-6">
          {/* Section 1: Offre et Tarification Locale */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
              <div className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>1. Offre Commerciale & Prix en Devise Locale ({currentProfile.currency})</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">
                Estimation indicative
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 md:border-r md:border-white/[0.07] md:pr-6">
                <span className="text-[11px] text-slate-400 block">Tarif Recommandé</span>
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {digitalKit?.offerAndPricing.localPrice || (countryCode === 'NER' ? '650 000 FCFA / mois' : '1 200 € / mois')}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Modèle : {digitalKit?.offerAndPricing.billingModel || 'Abonnement mensuel B2B'}
                </span>
              </div>

              <div className="md:col-span-2 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Livrables Inclus</span>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  {(digitalKit?.offerAndPricing.deliverables || [
                    'Audit express et cartographie des flux d encaissement',
                    'Intégration des connecteurs WhatsApp / Mobile Money',
                    'Rapports hebdomadaires de conformité et réconciliation',
                    'Support technique direct sur Niamey et à distance',
                  ]).map((deliv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 2: Page de vente HTML5 */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>2. Page de Vente en HTML5 Autonome</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#0D1017] rounded-lg border border-white/[0.07] text-xs">
                  <button
                    onClick={() => setHtmlViewMode('preview')}
                    className={`cursor-pointer px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                      htmlViewMode === 'preview' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Aperçu</span>
                  </button>
                  <button
                    onClick={() => setHtmlViewMode('code')}
                    className={`cursor-pointer px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                      htmlViewMode === 'code' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Code Source</span>
                  </button>
                </div>

                <button
                  onClick={() =>
                    handleCopy(
                      digitalKit?.htmlSalesPage || '<h1>Page de vente OmniVectis</h1>',
                      'html_page'
                    )
                  }
                  className="cursor-pointer px-3 py-1.5 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08] flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'html_page' ? 'Copié !' : 'Copier'}</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger .html</span>
                </button>
              </div>
            </div>

            {htmlViewMode === 'preview' ? (
              <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-white">
                <iframe
                  title="Aperçu Page de Vente"
                  srcDoc={
                    digitalKit?.htmlSalesPage || `
                    <!DOCTYPE html>
                    <html lang="fr">
                    <head>
                      <meta charset="UTF-8">
                      <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body class="bg-slate-900 text-white p-8 font-sans">
                      <div class="max-w-2xl mx-auto text-center space-y-4">
                        <span class="text-xs uppercase tracking-wider text-cyan-400 font-bold">Solution d'arbitrage vérifiée</span>
                        <h1 class="text-3xl font-extrabold">${selectedOpportunity?.title || 'Offre Digitale Clé en Main'}</h1>
                        <p class="text-slate-300 text-sm">${selectedOpportunity?.description || 'Capturez la demande du marché avec un modèle récurrent éprouvé.'}</p>
                        <div class="p-6 bg-slate-800 rounded-xl mt-6 border border-slate-700">
                          <div class="text-2xl font-bold font-mono text-emerald-400">${currentProfile.countryCode === 'NER' ? '650 000 FCFA / mois' : '1 200 € / mois'}</div>
                          <button class="mt-4 px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg">Souscrire au Pilote</button>
                        </div>
                      </div>
                    </body>
                    </html>`
                  }
                  sandbox="allow-scripts"
                  className="w-full h-80 border-0"
                />
              </div>
            ) : (
              <pre className="p-4 rounded-lg bg-[#0D1017] border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 whitespace-pre-wrap">
                {digitalKit?.htmlSalesPage || '<!-- Code HTML complet généré automatiquement -->'}
              </pre>
            )}
          </div>

          {/* Section 3: Messages de Prospection & Séquence de Relance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages Outbound */}
            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-xs font-semibold text-cyan-400">3. Messages de Prospection Directe</span>
                <span className="text-[11px] text-slate-500">Rien n est envoyé sans validation</span>
              </div>

              <div className="divide-y divide-white/[0.07]">
                <div className="pb-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200">Message Direct LinkedIn / WhatsApp</span>
                    <button
                      onClick={() =>
                        handleQueueItem(
                          `Message Direct - ${selectedOpportunity?.title || 'Prospection'}`,
                          'prospection_message',
                          digitalKit?.outreachCopy?.directMessage || 'Bonjour...',
                          'Directeurs Généraux'
                        )
                      }
                      className="cursor-pointer text-[11px] text-blue-300 hover:text-white px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ajouter à « À valider »</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed bg-[#0D1017] p-3.5 rounded-lg border border-white/[0.06]">
                    "{digitalKit?.outreachCopy?.directMessage ||
                      `Bonjour [Nom], au vu des nouvelles réglementations sur ${selectedOpportunity?.title || 'votre secteur'}, nous avons mis en place une passerelle directe permettant d optimiser vos encaissements. Seriez-vous ouvert à 10 min d échange ?`}"
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200">Email de Pitch B2B Complet</span>
                    <button
                      onClick={() =>
                        handleQueueItem(
                          `Email Pitch B2B - ${selectedOpportunity?.title || 'Pitch Commercial'}`,
                          'prospection_message',
                          digitalKit?.outreachCopy?.emailPitch || 'Objet : Partenariat...',
                          'Direction Financière'
                        )
                      }
                      className="cursor-pointer text-[11px] text-blue-300 hover:text-white px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ajouter à « À valider »</span>
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-[#0D1017] p-3.5 rounded-lg border border-white/[0.06]">
                    {digitalKit?.outreachCopy?.emailPitch ||
                      `Objet : Optimisation immédiate de vos flux\n\nBonjour [Nom],\n\nNous accompagnons les décideurs sur le marché du Niger dans la digitalisation de leurs encaissements et la réduction de leurs délais de paiement.\n\nDiscutons-en cette semaine.`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Séquence de Relance */}
            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-xs font-semibold text-cyan-400">4. Séquence de Relance (J+3, J+7, J+14)</span>
                <span className="text-[11px] text-slate-500">Cadence structurée</span>
              </div>

              <div className="divide-y divide-white/[0.07]">
                <div className="pb-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-300">Relance J+3 (Valeur ajoutée)</span>
                    <button
                      onClick={() =>
                        handleQueueItem(
                          `Relance J+3 - ${selectedOpportunity?.title || 'Relance'}`,
                          'prospection_message',
                          digitalKit?.followupSequence?.day3 || 'Bonjour, je fais suite...',
                          'Prospect non-répondant'
                        )
                      }
                      className="text-[11px] text-blue-300 hover:text-white px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>File « À valider »</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{digitalKit?.followupSequence?.day3 || 'Bonjour, je me permets de remonter mon précédent message. Avez-vous eu l occasion d y jeter un œil ?'}"
                  </p>
                </div>

                <div className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-300">Relance J+7 (Preuve sociale)</span>
                    <button
                      onClick={() =>
                        handleQueueItem(
                          `Relance J+7 - ${selectedOpportunity?.title || 'Relance'}`,
                          'prospection_message',
                          digitalKit?.followupSequence?.day7 || 'Bonjour, un retour rapide...',
                          'Prospect non-répondant'
                        )
                      }
                      className="text-[11px] text-blue-300 hover:text-white px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>File « À valider »</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{digitalKit?.followupSequence?.day7 || 'Dernière relance rapide : seriez-vous disponible pour 10 minutes ce jeudi ?'}"
                  </p>
                </div>

                <div className="pt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-300">Rupture Polie J+14 (Breakup)</span>
                    <button
                      onClick={() =>
                        handleQueueItem(
                          `Breakup J+14 - ${selectedOpportunity?.title || 'Clôture'}`,
                          'prospection_message',
                          digitalKit?.followupSequence?.day14Breakup || 'Sans nouvelles...',
                          'Prospect non-répondant'
                        )
                      }
                      className="text-[11px] text-rose-300 hover:text-white px-2.5 py-1 rounded-md bg-rose-600/15 hover:bg-rose-600/30 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>File « À valider »</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{digitalKit?.followupSequence?.day14Breakup || 'Je constate que ce n est pas votre priorité actuelle. Je clôture votre dossier et vous souhaite plein succès.'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Checklist des Comptes & Automations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="text-xs font-semibold text-cyan-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
                <CheckSquare className="w-4 h-4" />
                <span>5. Checklist des Comptes Réels à Créer</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {(digitalKit?.accountsChecklist || [
                  { accountName: 'Compte Marchand Airtel Money / Moov Money Flooz Niger', description: 'Permet de recevoir les règlements locaux instantanés des clients particuliers et TPE.' },
                  { accountName: 'Compte Bancaire Pro B2B (SONIBANK, ECOBANK ou BOA)', description: 'Nécessaire pour les virements d entreprises et l émission de factures conformes.' },
                  { accountName: 'Carte Visa Virtuelle / Compte NITA ou Aminata', description: 'Pour régler les abonnements d outils digitaux internationaux sans blocage.' },
                  { accountName: 'Nom de domaine (.com / .ne) & Adresse mail professionnelle', description: 'Essentiel pour la délivrabilité des emails de prospection et la crédibilité.' },
                  { accountName: 'Passerelle d encaissement FedaPay ou Stripe', description: 'Pour encaisser les paiements par carte bancaire locale et internationale.' },
                ]).map((acc, i) => (
                  <div key={i} className="py-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`chk-${i}`}
                      className="mt-0.5 rounded border-white/20 bg-[#0D1017] text-blue-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor={`chk-${i}`} className="text-xs text-slate-300 cursor-pointer">
                      <strong className="text-white block font-medium">{acc.accountName}</strong>
                      <span className="text-slate-400 text-[11px]">{acc.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="text-xs font-semibold text-cyan-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
                <Sparkles className="w-4 h-4" />
                <span>6. Actions d Automatisation Proposées</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {(digitalKit?.automationActions || [
                  { title: 'Alerte WhatsApp de Nouvelle Demande', tool: 'Webhook n8n / Make', description: 'Envoi d un message instantané sur votre mobile dès qu un prospect remplit la page de vente.' },
                  { title: 'Génération Automatique de Facture Pro-Forma', tool: 'Template PDF auto', description: 'Émission immédiate du devis/facture en FCFA conforme OHADA dès validation du panier.' },
                  { title: 'Réconciliation d Encaissement Mobile Money', tool: 'Notification SMS / Webhook', description: 'Vérification automatique du numéro de quittance Airtel/Flooz avant déblocage de l accès.' },
                ]).map((auto, i) => (
                  <div key={i} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{auto.title}</span>
                      <span className="text-[11px] font-mono text-cyan-400 shrink-0">
                        {auto.tool}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{auto.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW B: PHYSIQUE ===================== */}
      {(selectedOpportunity?.type === 'physique' || (!selectedOpportunity && activeKitType === 'physique')) && (
        <div className="space-y-6">
          {/* Section 1: Budget d'Investissement avec Hypothèses 100% Modifiables */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>1. Budget d Investissement & Hypothèses Modifiables en Direct</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Modifiez directement les montants dans le tableau : le total et le point mort se recalculent automatiquement.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-amber-400">
                  Estimation indicative
                </span>
                <button
                  onClick={handleSavePhysicalHypotheses}
                  disabled={savingHypotheses}
                  className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingHypotheses ? 'Enregistrement...' : 'Sauvegarder Hypothèses'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Hypotheses Table */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0D1017]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="py-2.5 px-4 font-semibold">Poste de Dépense</th>
                    <th className="py-2.5 px-4 font-semibold">Catégorie</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Montant ({currentProfile.currency})</th>
                    <th className="py-2.5 px-4 font-semibold">Remarques & Terrain</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {editableHypotheses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Aucune hypothèse saisie. Cliquez sur « Ajouter une ligne » ci-dessous.
                      </td>
                    </tr>
                  ) : (
                    editableHypotheses.map((hyp) => (
                      <tr key={hyp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-medium text-white">{hyp.label}</td>
                        <td className="py-2.5 px-4 text-slate-400">{hyp.category}</td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            value={hyp.amount}
                            onChange={(e) => handleHypothesisAmountChange(hyp.id, Number(e.target.value))}
                            className="w-32 px-2.5 py-1 bg-[#11141C] border border-white/[0.1] rounded text-right text-white font-mono font-semibold tabular-nums focus:border-amber-400 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 text-[11px]">{hyp.note}</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteHypothesis(hyp.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.1] bg-[#11141C] font-semibold">
                    <td colSpan={2} className="py-3 px-4 text-white">
                      TOTAL INVESTISSEMENT INITIAL REQUIS
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-base text-amber-400 tabular-nums">
                      {totalCalculatedInitial.toLocaleString('fr-FR')} {currentProfile.currency}
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-[11px] text-slate-400 font-normal">
                      Fonds propres ou financement de démarrage requis
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <button
              onClick={handleAddHypothesis}
              className="cursor-pointer px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une ligne de dépense au budget</span>
            </button>
          </div>

          {/* Section 2: Seuil de Rentabilité Interactif (Point Mort) */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>2. Analyse du Seuil de Rentabilité Dynamique (Point Mort)</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">
                Estimation indicative
              </span>
            </div>

            {/* Inputs for Breakeven */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Prix de Vente Unitaire Moyen</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white font-mono font-semibold tabular-nums focus:border-amber-400 focus:outline-none text-sm"
                  />
                  <span className="text-xs text-slate-400 font-mono">{currentProfile.currency}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Coût de Revient Unitaire Moyen</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white font-mono font-semibold tabular-nums focus:border-amber-400 focus:outline-none text-sm"
                  />
                  <span className="text-xs text-slate-400 font-mono">{currentProfile.currency}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Charges Fixes Mensuelles Estimées</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={monthlyFixedCharges}
                    onChange={(e) => setMonthlyFixedCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white font-mono font-semibold tabular-nums focus:border-amber-400 focus:outline-none text-sm"
                  />
                  <span className="text-xs text-slate-400 font-mono">{currentProfile.currency}</span>
                </div>
              </div>
            </div>

            {/* Calculated Output KPI Hairline Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 bg-[#0D1017] border border-white/[0.08] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
              <div className="p-4">
                <span className="text-[11px] text-slate-400 block">Marge Brute par Unité</span>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                  {calculatedUnitMargin.toLocaleString('fr-FR')} {currentProfile.currency}
                </div>
                <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                  Soit {sellingPrice > 0 ? Math.round((calculatedUnitMargin / sellingPrice) * 100) : 0}% du prix
                </span>
              </div>

              <div className="p-4">
                <span className="text-[11px] text-slate-400 block">Point Mort en Volume</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
                  {calculatedBreakEvenUnits.toLocaleString('fr-FR')} unités / mois
                </div>
                <span className="text-[10px] text-slate-500">Ventes pour couvrir les charges fixes</span>
              </div>

              <div className="p-4">
                <span className="text-[11px] text-slate-400 block">Chiffre d Affaires au Point Mort</span>
                <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
                  {calculatedBreakEvenRevenue.toLocaleString('fr-FR')} {currentProfile.currency}
                </div>
                <span className="text-[10px] text-slate-500">Seuil de bénéfice net positif</span>
              </div>
            </div>
          </div>

          {/* Section 3: Fournisseurs et Partenaires Locaux */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <Building className="w-4 h-4" />
              <span>3. Fournisseurs et Partenaires Locaux à Contacter</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 divide-y md:divide-y-0 md:divide-x divide-white/[0.07]">
              {(physicalPlan?.localSuppliersAndPartners || [
                {
                  name: 'Négociants Grossistes du Marché de Katako & Grand Marché',
                  role: 'Approvisionnement matières premières & emballages',
                  location: 'Niamey, Niger',
                  contactGuide: 'Prendre contact physiquement aux hangars avec un échantillon ou cahier des charges.',
                },
                {
                  name: 'Groupements d Intérêt Économique Maraîchers de Maradi & Dosso',
                  role: 'Fournisseurs de production agricole directe',
                  location: 'Régions de Maradi / Dosso',
                  contactGuide: 'Contrat d achat d avance avec acompte de 20% à la récolte.',
                },
                {
                  name: 'Syndicat des Transporteurs Routiers et Transitaires',
                  role: 'Fret routier, convoyage et dédouanement',
                  location: 'Axe Cotonou-Niamey',
                  contactGuide: 'Lettre de voiture officielle et bordereau de déchargement.',
                },
              ]).map((partner, idx) => (
                <div key={idx} className="pt-4 first:pt-0 md:pt-0 md:pl-5 md:first:pl-0 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-amber-400 block">{partner.role}</span>
                    <h4 className="font-display text-sm font-semibold text-white leading-snug">{partner.name}</h4>
                    <span className="text-[11px] text-slate-400 block">{partner.location}</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-300">
                    <span className="text-slate-500 block">Protocole terrain :</span>
                    {partner.contactGuide}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Démarches Administratives & Autorisations */}
          <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                <span>4. Autorisations & Démarches Administratives ({currentProfile.countryName})</span>
              </div>
              <span className="text-[11px] text-slate-500">Rien n est envoyé sans validation</span>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {(physicalPlan?.regulatoryAuthorizations || [
                {
                  stepNumber: 1,
                  authority: 'Maison de l Entreprise du Niger (CCIN Niamey)',
                  requirement: 'Immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM) et délivrance du NIF.',
                  estimatedCost: '50 000 FCFA',
                  delay: '48h à 72h',
                },
                {
                  stepNumber: 2,
                  authority: 'Direction Générale des Impôts (DGI Niamey)',
                  requirement: 'Déclaration d existence et choix du régime synthétique simplifié (ISF).',
                  estimatedCost: '0 FCFA',
                  delay: '2 jours',
                },
                {
                  stepNumber: 3,
                  authority: 'Direction de la Normalisation et de la Qualité (DNQM / Ministère Commerce)',
                  requirement: 'Certificat de conformité des produits et autorisations sanitaires d exploitation.',
                  estimatedCost: '35 000 FCFA',
                  delay: '5 jours',
                },
                {
                  stepNumber: 4,
                  authority: 'Ville de Niamey / Délégation Spéciale',
                  requirement: 'Taxe d occupation du domaine commercial et patente locale.',
                  estimatedCost: '25 000 FCFA / an',
                  delay: '1 semaine',
                },
              ]).map((auth, idx) => (
                <div
                  key={idx}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-amber-400 font-bold tabular-nums">
                        0{auth.stepNumber}.
                      </span>
                      <strong className="text-sm font-semibold text-white">{auth.authority}</strong>
                    </div>
                    <p className="text-xs text-slate-300">{auth.requirement}</p>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2.5 pt-0.5 tabular-nums">
                      <span>Coût estimé : {auth.estimatedCost}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>Délai : {auth.delay}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleQueueItem(
                        `Formalité ${auth.authority} - ${selectedOpportunity?.title || 'Démarche'}`,
                        'administrative_step',
                        `Dossier d immatriculation et déclaration : ${auth.requirement}. Coût prévu : ${auth.estimatedCost}. Délai : ${auth.delay}.`,
                        auth.authority
                      )
                    }
                    className="cursor-pointer shrink-0 px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-600/15 hover:bg-amber-600/30 border border-amber-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ajouter à « À valider »</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Logistique & Calendrier d'Exécution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
                <Truck className="w-4 h-4" />
                <span>5. Logistique & Chaîne d Approvisionnement</span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Itinéraire & Corridor</span>
                  <p className="text-slate-200 leading-relaxed">
                    {physicalPlan?.supplyChainAndLogistics?.transportRoute ||
                      'Axe principal Cotonou-Malanville-Gaya-Dosso-Niamey avec relais sécurisé.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Conditions de Stockage</span>
                  <p className="text-slate-200 leading-relaxed">
                    {physicalPlan?.supplyChainAndLogistics?.storageConditions ||
                      'Entrepôt aéré, palettes bois traitées, température contrôlée par ventilation solaire.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 pt-3 border-t border-white/[0.06] divide-x divide-white/[0.07]">
                  <div className="pr-4">
                    <span className="text-[11px] text-slate-400 block">Délai d Acheminement</span>
                    <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                      {physicalPlan?.supplyChainAndLogistics?.leadTimeDays || 4} jours
                    </div>
                  </div>
                  <div className="pl-4">
                    <span className="text-[11px] text-slate-400 block">Stock de Sécurité Minimal</span>
                    <div className="text-lg font-bold font-mono text-white mt-0.5 tabular-nums">
                      {physicalPlan?.supplyChainAndLogistics?.safetyStockUnits || 150} unités
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
                <Calendar className="w-4 h-4" />
                <span>6. Calendrier d Exécution (Semaines 1 à 8)</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {(physicalPlan?.implementationTimeline || [
                  { week: 'Semaine 1-2', milestone: 'Légal & Local commercial', criticalAction: 'Dépôt des statuts à la Maison de l Entreprise et bail du dépôt.' },
                  { week: 'Semaine 3-4', milestone: 'Contrats Fournisseurs', criticalAction: 'Paiement acompte premier lot et sécurisation du fret routier.' },
                  { week: 'Semaine 5-6', milestone: 'Réception & Lancement Ventes', criticalAction: 'Déchargement stock, contrôle qualité et prospection des premiers clients.' },
                  { week: 'Semaine 7-8', milestone: 'Atteinte du Point Mort', criticalAction: 'Recouvrement des premières ventes et réapprovisionnement régulier.' },
                ]).map((step, idx) => (
                  <div key={idx} className="py-3 first:pt-1 last:pb-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-amber-400">{step.week}</span>
                      <span className="text-slate-200 font-medium">{step.milestone}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{step.criticalAction}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
