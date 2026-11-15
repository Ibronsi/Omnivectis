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
  AlertTriangle,
  History,
  Trash2,
  Save,
  Printer,
} from 'lucide-react';
import {
  LaunchpadCircuit,
  SectorCategory,
  CountryCode,
  LiveFxRates,
  SavedLaunchpadRecord,
  CompanyProfile,
} from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import { GEO_PROFILES } from '../data/geoProfiles';
import { getEffectiveFxRateToEur, convertCurrency } from '../utils/currency';
import { subscribeLiveEvent } from '../utils/liveStream';
import { ActiveTab } from './Header';

interface LaunchpadViewProps {
  initialSectorId?: SectorCategory;
  initialOpportunityTitle?: string;
  onAddToPipeline: (title: string, sectorId: SectorCategory, targetMrr: number) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  countryCode?: CountryCode;
  liveRates?: LiveFxRates | null;
}

export const LaunchpadView: React.FC<LaunchpadViewProps> = ({
  initialSectorId = 'ai_deeptech',
  initialOpportunityTitle = 'Agents IA Spécialisés Conformité & Due Diligence B2B',
  onAddToPipeline,
  onNavigateTab,
  countryCode = 'NER',
  liveRates,
}) => {
  const currentGeoProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const isAfricanUemoa = ['NER', 'SEN', 'CIV'].includes(countryCode);
  const fxInfo = getEffectiveFxRateToEur(currentGeoProfile.currency, liveRates);

  const [selectedSectorId, setSelectedSectorId] = useState<SectorCategory>(initialSectorId);
  const [opportunityTitle, setOpportunityTitle] = useState<string>(initialOpportunityTitle);
  const currentSector = ECONOMIC_SECTORS.find((s) => s.id === selectedSectorId) || ECONOMIC_SECTORS[0];
  const [circuit, setCircuit] = useState<LaunchpadCircuit | null>(null);
  const [savedLaunchpads, setSavedLaunchpads] = useState<SavedLaunchpadRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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
  const [customPaymentLink, setCustomPaymentLink] = useState<string>(() => {
    try {
      return localStorage.getItem('launchpad_custom_payment_link') || '';
    } catch {
      return '';
    }
  });

  // Copy & Save feedbacks
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState<'saved' | 'error' | null>(null);
  const [queueingEmailKey, setQueueingEmailKey] = useState<string | null>(null);
  const [queuedNotice, setQueuedNotice] = useState<string | null>(null);
  const [creatingSale, setCreatingSale] = useState<boolean>(false);
  const [saleCreatedNotice, setSaleCreatedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('launchpad_custom_payment_link', customPaymentLink);
    } catch {
      // ignore storage quota errors
    }
  }, [customPaymentLink]);

  const applyProfileFromServer = (p?: CompanyProfile | null) => {
    if (!p) return;
    if (p.companyName) setUserCompanyName(p.companyName);
    if (p.nif) setUserNif(p.nif);
    if (p.phone) setUserPhone(p.phone);
    if (p.iban) setUserIban(p.iban);
    if (p.selectedBank) setSelectedBank(p.selectedBank);
    if (p.selectedMobileOperator) setSelectedMobileOperator(p.selectedMobileOperator);
    if (p.selectedAgency) setSelectedAgency(p.selectedAgency);
    if (typeof p.customPaymentLink === 'string' && p.customPaymentLink.trim() !== '') {
      setCustomPaymentLink(p.customPaymentLink);
    }
  };

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile) {
          applyProfileFromServer(data.profile);
        }
      })
      .catch(() => {});

    fetch('/api/launchpads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.launchpads)) {
          setSavedLaunchpads(data.launchpads);
          const matching = data.launchpads.find(
            (l: SavedLaunchpadRecord) =>
              l.opportunityTitle.toLowerCase() === initialOpportunityTitle.toLowerCase()
          );
          const initialRec = matching || data.launchpads[0];
          if (initialRec) {
            setActiveRecordId(initialRec.id);
            setCircuit(initialRec.circuit);
            setSelectedSectorId(initialRec.sectorId);
            setOpportunityTitle(initialRec.opportunityTitle);
          }
        }
      })
      .catch(() => {});

    const unsub = subscribeLiveEvent<{
      kind?: string;
      launchpads?: SavedLaunchpadRecord[];
      profile?: CompanyProfile;
    }>('workspace_updated', (payload) => {
      if (payload?.kind === 'launchpad' && Array.isArray(payload.launchpads)) {
        setSavedLaunchpads(payload.launchpads);
      }
      if (payload?.kind === 'profile' && payload.profile) {
        applyProfileFromServer(payload.profile);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveCompanyProfile = async () => {
    setSavingProfile(true);
    setProfileSaveStatus(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: userCompanyName,
          nif: userNif,
          phone: userPhone,
          iban: userIban,
          selectedBank,
          selectedMobileOperator,
          selectedAgency,
          customPaymentLink,
        }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde profil');
      setProfileSaveStatus('saved');
      setTimeout(() => setProfileSaveStatus(null), 3000);
    } catch {
      setProfileSaveStatus('error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleQueueOutreach = async (key: string, label: string, subject: string, body: string) => {
    setQueueingEmailKey(key);
    setError(null);
    setQueuedNotice(null);
    try {
      const res = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${label} — ${opportunityTitle}`,
          category: 'prospection_message',
          targetRecipient: clientContactEmail || undefined,
          contentPayload: `Objet : ${subject}\n\n${body}`,
          sourceOpportunityTitle: opportunityTitle,
          countryCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      setQueuedNotice(`« ${label} » ajouté à la file À Valider pour révision et envoi réel.`);
    } catch (e: any) {
      setError(e?.message || 'Impossible d’envoyer ce message vers la file de validation.');
    } finally {
      setQueueingEmailKey(null);
    }
  };

  const handleCreatePendingSale = async () => {
    setCreatingSale(true);
    setError(null);
    setSaleCreatedNotice(null);
    const methodLabel =
      activePaymentRail === 'mobile_money'
        ? selectedMobileOperator
        : activePaymentRail === 'bank_transfer'
        ? selectedBank
        : activePaymentRail === 'transfer_agency'
        ? selectedAgency
        : 'Lien de paiement / Carte';
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientCompanyName || 'Client B2B',
          opportunityTitle,
          amount: cashInAmount,
          currency: currentGeoProfile.currency,
          date: new Date().toISOString().split('T')[0],
          status: 'en_attente',
          paymentMethod: methodLabel,
          notes: cashInType === 'recurring' ? 'Abonnement mensuel (Launchpad)' : 'Forfait unique (Launchpad)',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      setSaleCreatedNotice(
        `Vente En attente enregistrée (${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currency} · ${clientCompanyName}).`
      );
    } catch (e: any) {
      setError(e?.message || 'Impossible d’enregistrer la vente dans Encaissements Réels.');
    } finally {
      setCreatingSale(false);
    }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/launchpads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.launchpads)) {
        setSavedLaunchpads(data.launchpads);
        if (activeRecordId === id) {
          if (data.launchpads.length > 0) {
            setActiveRecordId(data.launchpads[0].id);
            setCircuit(data.launchpads[0].circuit);
            setSelectedSectorId(data.launchpads[0].sectorId);
            setOpportunityTitle(data.launchpads[0].opportunityTitle);
          } else {
            setActiveRecordId(null);
            setCircuit(null);
          }
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression.');
    }
  };

  const handleGenerateCircuit = async (titleToUse?: string, sectorIdToUse?: SectorCategory) => {
    setLoading(true);
    setError(null);
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
      if (!res.ok || !data?.success || !data?.circuit) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      setCircuit(data.circuit);
      if (data.record) {
        setActiveRecordId(data.record.id);
        setSavedLaunchpads((prev) => [data.record, ...prev.filter((l) => l.id !== data.record.id)]);
      }
    } catch (e: any) {
      setError(e?.message || 'Impossible de générer le circuit via Gemini.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSectorId(initialSectorId);
    setOpportunityTitle(initialOpportunityTitle);
    setError(null);
    const matching = savedLaunchpads.find(
      (l) => l.opportunityTitle.toLowerCase() === initialOpportunityTitle.toLowerCase()
    );
    if (matching) {
      setActiveRecordId(matching.id);
      setCircuit(matching.circuit);
    } else {
      setActiveRecordId(null);
      setCircuit(null);
    }
  }, [initialSectorId, initialOpportunityTitle]);

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1.5">
          Circuit d'Exécution & Encaissement Réel (0 à 10 000 € / mois)
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          Launchpad de Monétisation Réelle
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-3xl leading-relaxed">
          Passez de la théorie à l'encaissement bancaire. Cette suite génère automatiquement les 6 engrenages
          nécessaires pour vendre, contractualiser, facturer, encaisser sur votre compte et délivrer sans travail manuel.
        </p>
      </div>

      {/* Target Business Selection & Switcher Bar */}
      <div className="p-5 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block">
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
                  setCircuit(null);
                  setError(null);
                }}
                className="bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-xs text-stone-900 dark:text-stone-100 rounded-xl p-2.5 cursor-pointer focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500"
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
                className="bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => handleGenerateCircuit()}
            disabled={loading}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-stone-200 dark:disabled:bg-white/[0.08] disabled:text-stone-500 dark:disabled:text-stone-500 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-end"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Génération du circuit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{circuit ? 'Régénérer le Circuit Clé en Main' : 'Générer le Circuit Clé en Main'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {savedLaunchpads.length > 0 && (
        <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300">
            <span className="flex items-center gap-2 font-medium">
              <History className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Circuits persistés ({savedLaunchpads.length})</span>
            </span>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">Sauvegarde serveur</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedLaunchpads.map((rec) => (
              <div
                key={rec.id}
                onClick={() => {
                  setActiveRecordId(rec.id);
                  setSelectedSectorId(rec.sectorId);
                  setOpportunityTitle(rec.opportunityTitle);
                  setCircuit(rec.circuit);
                }}
                className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                  activeRecordId === rec.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/40 text-stone-900 dark:text-stone-100 font-medium'
                    : 'bg-[#F6F4EF] dark:bg-[#0D1017] border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-white/[0.16]'
                }`}
              >
                <span className="truncate max-w-[260px]">{rec.opportunityTitle}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSaved(rec.id, e)}
                  className="text-stone-400 dark:text-stone-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                  title="Supprimer ce circuit"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !circuit && (
        <div className="p-12 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] text-center space-y-4">
          <Loader2 className="w-7 h-7 text-blue-700 dark:text-blue-400 animate-spin mx-auto" />
          <div className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">Assemblage des engrenages d'encaissement...</div>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
            Rédaction des offres, des emails d'acquisition, du contrat juridique B2B et du prompt de délivrance via Gemini.
          </p>
        </div>
      )}

      {!loading && !circuit && (
        <div className="p-10 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.12] border-dashed rounded-2xl text-center space-y-4">
          <Sparkles className="w-6 h-6 text-blue-700 dark:text-blue-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
              Aucun circuit généré pour cette opportunité
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
              Aucun modèle statique n'est pré-rempli. Cliquez sur « Générer le Circuit Clé en Main » pour produire l'offre indicative, la séquence outbound, le contrat et le moteur de délivrance via Gemini.
            </p>
          </div>
          <button
            onClick={() => handleGenerateCircuit()}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Générer le Circuit Clé en Main</span>
          </button>
        </div>
      )}

      {circuit && (
        <div className="space-y-6">
          {/* Navigation Tabs across the 6 Gears */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[#F2EFE9] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] rounded-2xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveStep('offer')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'offer' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <DollarSign className={`w-3.5 h-3.5 ${activeStep === 'offer' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
              <span>1. L'Offre & Tarifs</span>
            </button>

            <button
              onClick={() => setActiveStep('outreach')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'outreach' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${activeStep === 'outreach' ? 'text-white' : 'text-blue-700 dark:text-blue-400'}`} />
              <span>2. Scripts de Prospection</span>
            </button>

            <button
              onClick={() => setActiveStep('contract')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'contract' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeStep === 'contract' ? 'text-white' : 'text-amber-700 dark:text-amber-400'}`} />
              <span>3. Contrat B2B Juridique</span>
            </button>

            <button
              onClick={() => setActiveStep('landing')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'landing' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${activeStep === 'landing' ? 'text-white' : 'text-stone-600 dark:text-stone-400'}`} />
              <span>4. Tunnel & Page de Vente</span>
            </button>

            <button
              onClick={() => setActiveStep('delivery')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'delivery' ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs' : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-white/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${activeStep === 'delivery' ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`} />
              <span>5. Délivrance Automatisée IA</span>
            </button>

            <button
              onClick={() => setActiveStep('cash_in')}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeStep === 'cash_in'
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="font-semibold">6. Comment Encaisser l'Argent (Mobile Money & Banque)</span>
            </button>
          </div>

          {/* ENGRENAGE 1: L'OFFRE & LES PRIX */}
          {activeStep === 'offer' && (
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
                    Engrenage 01 · Positionnement Commercial & Encaissement
                  </span>
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                    L'Offre Irrésistible & Grille Tarifaire
                  </h3>
                </div>

                <button
                  onClick={() =>
                    onAddToPipeline(circuit.opportunityTitle, selectedSectorId, 15000)
                  }
                  className="cursor-pointer px-3.5 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 bg-[#F6F4EF] dark:bg-[#0D1017] hover:bg-[#EAE5DC] dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Enregistrer dans mon Pipeline</span>
                </button>
              </div>

              {/* Value Proposition & Risk Reversal */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 dark:divide-white/[0.07] bg-[#F6F4EF]/60 dark:bg-[#0D1017]/60">
                <div className="p-6 space-y-1.5">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">
                    Promesse de Valeur Centrale
                  </span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-relaxed">
                    {circuit.commercialOffer.heroPromise}
                  </p>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                    Cible : {circuit.commercialOffer.targetPersona}
                  </div>
                </div>

                <div className="p-6 space-y-1.5">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Garantie Anti-Risque (Élimine toute objection)
                  </span>
                  <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                    {circuit.commercialOffer.riskReversalGuarantee}
                  </p>
                </div>
              </div>

              {/* 3 Pricing Tiers */}
              <div className="p-6 space-y-4">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Les 3 Paliers d'Encaissement
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {circuit.commercialOffer.tiers.map((tier: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.16] rounded-xl space-y-4 flex flex-col justify-between transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">{tier.name}</h4>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">Tier 0{idx + 1}</span>
                        </div>

                        <div>
                          <div className="text-2xl font-semibold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                            {tier.price}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{tier.billingCycle}</div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-stone-200/80 dark:border-white/[0.07] text-xs">
                          {tier.deliverables.map((d: string, dIdx: number) => (
                            <div key={dIdx} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-200/80 dark:border-white/[0.07] space-y-2">
                        <div className="text-[10px] font-mono text-stone-500 dark:text-stone-400 truncate">
                          Params paiement : {tier.stripeLinkParams}
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Prix : ${tier.price}\nCycle : ${tier.billingCycle}\nLivrables :\n- ${tier.deliverables.join('\n- ')}`,
                              `tier-${idx}`
                            )
                          }
                          className="cursor-pointer w-full py-2 text-xs font-medium text-stone-800 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                          <span>{copiedSection === `tier-${idx}` ? 'Copié !' : "Copier l'Offre"}</span>
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
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400 block">
                    Engrenage 02 · Acquisition Client Prévisible
                  </span>
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                    Séquence Cold Outbound Multicanale (3 Étapes)
                  </h3>
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-400">
                  Canal : <strong className="text-stone-900 dark:text-stone-100 font-semibold">{circuit.outreachSequence.channel}</strong>
                </div>
              </div>

              {/* Targeting Filter Instructions */}
              <div className="p-6 bg-[#F6F4EF]/70 dark:bg-[#0D1017]/60 text-xs space-y-1.5">
                <span className="font-semibold text-blue-700 dark:text-blue-400 text-xs block">
                  Filtres de Ciblage Sales Navigator / Apollo
                </span>
                <p className="text-stone-700 dark:text-stone-300 font-mono leading-relaxed">
                  {circuit.outreachSequence.targetFilters}
                </p>
              </div>

              {/* Emails Cadence */}
              <div className="p-6 space-y-4">
                {queuedNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>{queuedNotice}</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('validation')}
                        className="cursor-pointer text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline hover:text-emerald-950 dark:hover:text-emerald-100 shrink-0"
                      >
                        Ouvrir À Valider & Journal →
                      </button>
                    )}
                  </div>
                )}

                {/* Email 1 */}
                <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-blue-700 dark:text-blue-400">01</span>
                      <span>Email 1 · Accroche & Audit Pilote Offert (J+0)</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={queueingEmailKey === 'email1'}
                        onClick={() =>
                          handleQueueOutreach(
                            'email1',
                            'Email 1 (Prospection J+0)',
                            circuit.outreachSequence.email1Subject,
                            circuit.outreachSequence.email1Body
                          )
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>{queueingEmailKey === 'email1' ? 'Envoi...' : 'Envoyer à À Valider'}</span>
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Objet : ${circuit.outreachSequence.email1Subject}\n\n${circuit.outreachSequence.email1Body}`,
                            'email1'
                          )
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSection === 'email1' ? 'Copié !' : 'Copier Email 1'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-stone-600 dark:text-stone-400 border-b border-stone-200/80 dark:border-white/[0.07] pb-2">
                    Objet : <span className="text-stone-900 dark:text-stone-100 font-medium">{circuit.outreachSequence.email1Subject}</span>
                  </div>

                  <div className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line font-mono bg-white dark:bg-[#141720] border border-stone-200/80 dark:border-white/[0.08] p-4 rounded-xl leading-relaxed">
                    {circuit.outreachSequence.email1Body}
                  </div>
                </div>

                {/* Email 2 */}
                <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">02</span>
                      <span>Email 2 · Relance avec Preuve Chiffrée (J+3)</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={queueingEmailKey === 'email2'}
                        onClick={() =>
                          handleQueueOutreach(
                            'email2',
                            'Email 2 (Relance J+3)',
                            `Re : ${circuit.outreachSequence.email1Subject}`,
                            circuit.outreachSequence.email2Followup
                          )
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>{queueingEmailKey === 'email2' ? 'Envoi...' : 'Envoyer à À Valider'}</span>
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(circuit.outreachSequence.email2Followup, 'email2')
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSection === 'email2' ? 'Copié !' : 'Copier Email 2'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line font-mono bg-white dark:bg-[#141720] border border-stone-200/80 dark:border-white/[0.08] p-4 rounded-xl leading-relaxed">
                    {circuit.outreachSequence.email2Followup}
                  </div>
                </div>

                {/* Email 3 */}
                <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400">03</span>
                      <span>Email 3 · Rupture Polie & Rareté (J+7)</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={queueingEmailKey === 'email3'}
                        onClick={() =>
                          handleQueueOutreach(
                            'email3',
                            'Email 3 (Clôture J+7)',
                            `Dernier suivi : ${circuit.outreachSequence.email1Subject}`,
                            circuit.outreachSequence.email3Breakup
                          )
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>{queueingEmailKey === 'email3' ? 'Envoi...' : 'Envoyer à À Valider'}</span>
                      </button>

                      <button
                        onClick={() =>
                          copyToClipboard(circuit.outreachSequence.email3Breakup, 'email3')
                        }
                        className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSection === 'email3' ? 'Copié !' : 'Copier Email 3'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-line font-mono bg-white dark:bg-[#141720] border border-stone-200/80 dark:border-white/[0.08] p-4 rounded-xl leading-relaxed">
                    {circuit.outreachSequence.email3Breakup}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 3: CONTRAT B2B JURIDIQUE */}
          {activeStep === 'contract' && (
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 block">
                    Engrenage 03 · Sécurisation Juridique & Facturation
                  </span>
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
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
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSection === 'contract' ? 'Contrat Intégral Copié !' : 'Copier le Contrat (Yousign/DocuSign)'}</span>
                </button>
              </div>

              <div className="p-6">
                <div className="p-7 bg-[#FCFBF8] dark:bg-[#0D1017] border border-stone-200/90 dark:border-white/[0.1] rounded-xl space-y-5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-serif shadow-xs">
                  <div className="text-center font-semibold text-stone-900 dark:text-stone-100 text-base font-display tracking-tight border-b border-stone-200 dark:border-white/[0.08] pb-3">
                    {circuit.legalAgreement.contractTitle}
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 font-sans text-xs">ARTICLE 1 · OBJET DU CONTRAT</div>
                    <p>{circuit.legalAgreement.purposeClause}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 font-sans text-xs">ARTICLE 2 · CONDITIONS FINANCIÈRES & RÈGLEMENT</div>
                    <p>{circuit.legalAgreement.financialTerms}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 font-sans text-xs">ARTICLE 3 · CONFIDENTIALITÉ & PROPRIÉTÉ INTELLECTUELLE</div>
                    <p>{circuit.legalAgreement.confidentialityAndIP}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 font-sans text-xs">ARTICLE 4 · DURÉE & RÉSILIATION</div>
                    <p>{circuit.legalAgreement.terminationClause}</p>
                  </div>

                  <div className="pt-4 border-t border-stone-200 dark:border-white/[0.08] flex justify-between font-sans text-[11px] text-stone-500 dark:text-stone-400">
                    <div>Signature & Cachet du Client</div>
                    <div>Signature & Cachet du Prestataire</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 4: TUNNEL & LANDING PAGE */}
          {activeStep === 'landing' && (
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400 block">
                    Engrenage 04 · Tunnel de Conversion
                  </span>
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
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
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-stone-800 dark:text-stone-200 bg-[#F6F4EF] dark:bg-[#0D1017] hover:bg-[#EAE5DC] dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>{copiedSection === 'landing' ? 'Wireframe Copié !' : 'Copier le Wireframe'}</span>
                </button>
              </div>

              {/* Live Mockup Wireframe Preview */}
              <div className="p-6">
                <div className="p-8 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl space-y-8 text-center max-w-3xl mx-auto">
                  {/* Hero Section */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-mono font-medium text-blue-700 dark:text-blue-400 block">
                      {circuit.sectorName} · Solution Certifiée
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
                      {circuit.landingPageWireframe.heroHeadline}
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
                      {circuit.landingPageWireframe.heroSubheadline}
                    </p>
                    <div>
                      <button className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors">
                        {circuit.landingPageWireframe.ctaButtonText}
                      </button>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      {circuit.landingPageWireframe.socialProofHook}
                    </div>
                  </div>

                  {/* 3 Problems Addressed */}
                  <div className="text-left p-6 bg-white dark:bg-[#141720] rounded-xl border border-stone-200 dark:border-white/[0.08] space-y-3">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block">
                      Les 3 frictions que nous éliminons chez nos clients
                    </span>
                    <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
                      {circuit.landingPageWireframe.problemSection.map((prob: string, pIdx: number) => (
                        <div key={pIdx} className="flex items-start gap-2.5">
                          <span className="text-rose-700 dark:text-rose-400 font-mono font-bold shrink-0">×</span>
                          <span className="leading-relaxed">{prob}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Solution Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07] border border-stone-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#141720] text-left">
                    {circuit.landingPageWireframe.solutionFeatures.map((feat: any, fIdx: number) => (
                      <div key={fIdx} className="p-4 space-y-1.5">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 text-xs">{feat.title}</div>
                        <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{feat.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 5: DÉLIVRANCE AUTOMATISÉE */}
          {activeStep === 'delivery' && (
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
                    Engrenage 05 · Opérations & Marge Maximale (Zero-Code)
                  </span>
                  <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                    Moteur de Délivrance Automatisé (Gain : {circuit.deliveryEngine.timeSavedHoursPerClient}h / client)
                  </h3>
                </div>

                <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                  Marge Opérationnelle : &gt; 85%
                </div>
              </div>

              {/* Execution Pipeline Steps */}
              <div className="p-6 space-y-4">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Le Flux n8n / Make.com en 4 Échelons
                </span>

                <div className="p-4 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Événement Déclencheur (Trigger) : </span>
                  <span className="text-stone-700 dark:text-stone-300">{circuit.deliveryEngine.inputTrigger}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 border border-stone-200/80 dark:border-white/[0.08] rounded-xl bg-[#F6F4EF] dark:bg-[#0D1017] overflow-hidden">
                  {circuit.deliveryEngine.processingSteps.map((step: string, sIdx: number) => (
                    <div
                      key={sIdx}
                      className={`p-4 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-3 border-stone-200/80 dark:border-white/[0.07] ${
                        sIdx % 2 === 0 ? 'sm:border-r' : ''
                      } ${sIdx < 2 ? 'sm:border-b' : ''}`}
                    >
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 pt-0.5 tabular-nums">
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
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Prompt d'Inférence IA de Délivrance (À intégrer dans votre webhook)
                  </span>

                  <button
                    onClick={() =>
                      copyToClipboard(circuit.deliveryEngine.aiPromptTemplate, 'prompt')
                    }
                    className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white bg-[#F6F4EF] dark:bg-[#0D1017] hover:bg-[#EAE5DC] dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSection === 'prompt' ? 'Copié !' : 'Copier le Prompt'}</span>
                  </button>
                </div>

                <div className="p-4 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                  {circuit.deliveryEngine.aiPromptTemplate}
                </div>

                <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  Format final délivré au client : <strong className="text-stone-900 dark:text-stone-100 font-medium">{circuit.deliveryEngine.outputDeliverableFormat}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ENGRENAGE 6: COMMENT ENCAISSER L'ARGENT (MOBILE MONEY, VIREMENT & LIEN) */}
          {activeStep === 'cash_in' && (
            <div className="bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y divide-stone-200/80 dark:divide-white/[0.07]">
              {/* Header */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
                    Engrenage 06 · Circuit Financier & Encaissement Bancaire Réel
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
                    Comment Vous Encaissez l'Argent de Vos Clients
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                    De l'accord commercial jusqu'au crédit réel sur votre compte bancaire. Voici le circuit technique,
                    contractuel et bancaire pour collecter les paiements sous 48h sans intermédiaire obscur.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Règlement Garanti J+2</span>
                  </span>
                </div>
              </div>

              {/* 1. Visuel du Circuit Financier (Timeline 4 Étapes Localisée) */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    1. Le Parcours Financier Complet (De la Signature au Retrait d'Argent Réel)
                  </span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-mono tabular-nums">
                    Profil Actif : {currentGeoProfile.countryName} ({currentGeoProfile.currencySymbol}) · 1 € = {fxInfo.rate.toFixed(currentGeoProfile.currency === 'XOF' ? 2 : 4)} {currentGeoProfile.currencySymbol} ({fxInfo.status === 'live' ? 'FX live' : fxInfo.status === 'cache' ? 'FX cache' : 'FX secours'})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 dark:divide-white/[0.07] border border-stone-200/80 dark:border-white/[0.08] rounded-xl bg-[#F6F4EF] dark:bg-[#0D1017] overflow-hidden">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-blue-700 dark:text-blue-400 font-semibold">
                      <span>ÉTAPE 01</span>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">Accord & Devis Signé</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Le client valide le bon de commande, la facture pro-forma ou l'accord contractuel OHADA/B2B par signature ou échange WhatsApp/Email d'accord.
                    </p>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">Délai : Immédiat</div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-stone-700 dark:text-stone-300 font-semibold">
                      <span>ÉTAPE 02</span>
                      <CreditCard className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">Choix du Rail de Règlement</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Vous transmettez soit vos coordonnées <strong className="text-stone-900 dark:text-stone-100 font-medium">Mobile Money (Airtel, Moov Flooz, Wave)</strong>, soit votre <strong className="text-stone-900 dark:text-stone-100 font-medium">RIB Banque (SONIBANK, ECOBANK)</strong>, soit un <strong className="text-stone-900 dark:text-stone-100 font-medium">Lien de Paiement</strong>.
                    </p>
                    <div className="text-[11px] text-blue-700 dark:text-blue-400 font-mono">Mobile Money / Banque / CB</div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                      <span>ÉTAPE 03</span>
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">Validation & Notification Instantanée</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Le client effectue le transfert. Vous recevez un <strong className="text-stone-900 dark:text-stone-100 font-medium">SMS officiel de confirmation opérateur</strong> (ex: Airtel Money ou Moov Flooz) ou un avis de crédit bancaire.
                    </p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">Notification SMS immédiate</div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>ÉTAPE 04</span>
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">Encaissement & Retrait Cash</h4>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      L'argent est disponible sur votre solde. Vous pouvez le retirer en espèces dans un point agréé (NITA, Al Izza, kiosque), l'utiliser par carte ou le virer sur votre compte bancaire.
                    </p>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">Argent réel disponible</div>
                  </div>
                </div>
              </div>

              {/* 2. Outil Interactif Multi-Rails : Mobile Money, Banques Locales, NITA/Al Izza, Lien de Paiement */}
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-white/[0.08] pb-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block">
                      Générateur Multi-Rails d'Encaissement Réel
                    </span>
                    <h4 className="font-display text-base font-semibold text-stone-900 dark:text-stone-100">
                      Adaptez le Moyen d'Encaissement à Votre Situation Géographique ({currentGeoProfile.countryName})
                    </h4>
                  </div>

                  {/* Mode Abonnement vs Forfait + Sauvegarde Profil + Vente En attente */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
                    <button
                      type="button"
                      onClick={handleCreatePendingSale}
                      disabled={creatingSale}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60"
                      title="Créer directement une écriture En attente dans Encaissements Réels avec ce client et ce montant"
                    >
                      {creatingSale ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Receipt className="w-3.5 h-3.5" />
                      )}
                      <span>Enregistrer en vente En attente</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCompanyProfile}
                      disabled={savingProfile}
                      className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60"
                      title="Enregistrer durablement vos coordonnées entreprise, RIB, Mobile Money et lien de paiement"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : profileSaveStatus === 'saved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {profileSaveStatus === 'saved'
                          ? 'Profil sauvegardé'
                          : profileSaveStatus === 'error'
                          ? 'Erreur sauvegarde'
                          : 'Sauvegarder mon profil'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] rounded-xl">
                      <button
                        onClick={() => setCashInType('recurring')}
                        className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                          cashInType === 'recurring'
                            ? 'bg-blue-700 dark:bg-blue-600 text-white'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        Abonnement Mensuel
                      </button>
                      <button
                        onClick={() => setCashInType('oneoff')}
                        className={`cursor-pointer px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                          cashInType === 'oneoff'
                            ? 'bg-blue-700 dark:bg-blue-600 text-white'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        Forfait Unique
                      </button>
                    </div>
                  </div>
                </div>

                {saleCreatedNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>{saleCreatedNotice}</span>
                    </div>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('sales')}
                        className="cursor-pointer text-xs font-semibold text-emerald-800 dark:text-emerald-300 underline hover:text-emerald-950 dark:hover:text-emerald-100 shrink-0"
                      >
                        Ouvrir Encaissements Réels →
                      </button>
                    )}
                  </div>
                )}

                {/* Rail Selection Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActivePaymentRail('mobile_money')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left transition-colors ${
                      activePaymentRail === 'mobile_money'
                        ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-500/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'bg-[#F6F4EF] dark:bg-[#0D1017] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-white/[0.16]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mb-1.5" />
                    <div className="text-xs font-semibold">1. Mobile Money</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'Airtel Money, Moov Flooz, Wave' : 'Apple Pay, Google Pay'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('bank_transfer')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left transition-colors ${
                      activePaymentRail === 'bank_transfer'
                        ? 'bg-blue-50 dark:bg-blue-950/35 border-blue-400 dark:border-blue-500/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'bg-[#F6F4EF] dark:bg-[#0D1017] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-white/[0.16]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400 mb-1.5" />
                    <div className="text-xs font-semibold">2. Banques Locales</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'SONIBANK, ECOBANK, BOA Niger' : 'Virement SEPA Direct'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('transfer_agency')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left transition-colors ${
                      activePaymentRail === 'transfer_agency'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'bg-[#F6F4EF] dark:bg-[#0D1017] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-white/[0.16]'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-700 dark:text-amber-400 mb-1.5" />
                    <div className="text-xs font-semibold">3. Agences & Cartes</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      {isAfricanUemoa ? 'NITA, Al Izza, Carte Visa NITA' : 'Cartes Virtuelles & Wise'}
                    </div>
                  </button>

                  <button
                    onClick={() => setActivePaymentRail('stripe')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-left transition-colors ${
                      activePaymentRail === 'stripe'
                        ? 'bg-blue-50 dark:bg-blue-950/35 border-blue-400 dark:border-blue-500/40 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'bg-[#F6F4EF] dark:bg-[#0D1017] border-stone-200/80 dark:border-white/[0.08] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-white/[0.16]'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-stone-700 dark:text-stone-300 mb-1.5" />
                    <div className="text-xs font-semibold">4. Lien de Paiement</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      Mobile Money, Prestataire ou CB
                    </div>
                  </button>
                </div>

                {/* Common client & amount parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                      Montant ({currentGeoProfile.currencySymbol})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={cashInAmount}
                        onChange={(e) => setCashInAmount(Math.max(100, Number(e.target.value) || 0))}
                        className="w-full bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-600 dark:focus:border-emerald-500 tabular-nums"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-stone-500 dark:text-stone-400 font-mono">
                        {currentGeoProfile.currencySymbol}
                      </span>
                    </div>
                    {currentGeoProfile.currency !== 'EUR' && (
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-1 tabular-nums">
                        ≈ {convertCurrency(cashInAmount, currentGeoProfile.currency, 'EUR', liveRates).toLocaleString('fr-FR')} € EUR ({fxInfo.status === 'live' ? 'taux live' : fxInfo.status === 'cache' ? 'taux cache' : 'taux secours'} 1€ = {fxInfo.rate.toFixed(currentGeoProfile.currency === 'XOF' ? 2 : 4)} {currentGeoProfile.currencySymbol})
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                      Entreprise ou Client Facturé
                    </label>
                    <input
                      type="text"
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="w-full bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                      Votre Raison Sociale ou Nom
                    </label>
                    <input
                      type="text"
                      value={userCompanyName}
                      onChange={(e) => setUserCompanyName(e.target.value)}
                      className="w-full bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                      Identifiant Légal (NIF / RCCM / SIRET)
                    </label>
                    <input
                      type="text"
                      value={userNif}
                      onChange={(e) => setUserNif(e.target.value)}
                      placeholder="Ex: NIF 48219/R · RCCM..."
                      className="w-full bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-600 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SPECIFIC RAIL VIEW 1: MOBILE MONEY (AIRTEL, MOOV FLOOZ, WAVE) */}
                {activePaymentRail === 'mobile_money' && (
                  <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-emerald-200 dark:border-emerald-500/30 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
                      <div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                          Encaissement Direct par Mobile Money
                        </span>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          Le canal le plus rapide et le plus universel au Niger et en zone UEMOA. 0 délai d'attente.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 tabular-nums">
                        Frais de réception : 0% à 1%
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Opérateur Mobile Money
                        </label>
                        <select
                          value={selectedMobileOperator}
                          onChange={(e) => setSelectedMobileOperator(e.target.value)}
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl p-2.5 cursor-pointer focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                        >
                          {currentGeoProfile.mobileMoney.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Votre Numéro Mobile Money Récepteur
                        </label>
                        <input
                          type="text"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="+227 90 00 00 00"
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Ready to send WhatsApp & SMS template */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
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
                              `Dès confirmation de la transaction par SMS de l'opérateur, nous activons immédiatement vos livrables.\n\n` +
                              `Merci pour votre confiance,\n${userCompanyName}`;
                            copyToClipboard(mmMsg, 'mmMessage');
                          }}
                          className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedSection === 'mmMessage' ? 'Message Copié !' : 'Copier le Message WhatsApp'}</span>
                        </button>
                      </div>

                      <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] rounded-xl font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                        {`Bonjour,

Faisant suite à notre accord concernant : ${opportunityTitle}, voici les coordonnées pour effectuer le règlement sécurisé par Mobile Money :

📱 Opérateur : ${selectedMobileOperator}
📞 Numéro récepteur : ${userPhone}
👤 Titulaire du compte : ${userCompanyName}
💰 Montant net à transférer : ${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol} (${cashInType === 'recurring' ? 'Abonnement mensuel renouvelable' : "Forfait complet d'intégration"})
📝 Référence obligatoire : ACC-${Date.now().toString().slice(-4)}

Dès réception du SMS de notification de l'opérateur, vos accès et livrables sont déployés sous 2h.

Merci pour votre confiance,
${userCompanyName}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 2: BANQUES LOCALES & VIREMENT B2B */}
                {activePaymentRail === 'bank_transfer' && (
                  <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-blue-200 dark:border-blue-500/30 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">
                          Virement Bancaire Direct B2B (Compte Professionnel)
                        </span>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          Recommandé pour les PME, institutions, ONG et grands comptes. 0% de frais d'intermédiaire.
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 print:hidden">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="cursor-pointer px-3 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center gap-1.5"
                          title="Imprimer ou exporter la facture pro-forma en PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                          <span>Imprimer / PDF</span>
                        </button>

                        <button
                          onClick={() => {
                            const invoiceText = `=== FACTURE PRO-FORMA B2B N° FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)} ===\n` +
                              `ÉMETTEUR :\n` +
                              `Raison Sociale : ${userCompanyName}\n` +
                              `Identifiant Légal : ${userNif}\n` +
                              `Pays / Zone : ${currentGeoProfile.countryName} (${currentGeoProfile.currency})\n\n` +
                              `CLIENT :\n` +
                              `Raison Sociale : ${clientCompanyName}\n` +
                              `Email Contact : ${clientContactEmail}\n` +
                              `Date d'émission : ${new Date().toLocaleDateString('fr-FR')}\n\n` +
                              `DÉSIGNATION DE LA PRESTATION :\n` +
                              `- Service : ${opportunityTitle}\n` +
                              `- Nature : ${cashInType === 'recurring' ? 'Prestation mensuelle récurrente' : 'Déploiement opérationnel clé en main'}\n` +
                              `- Montant Net à Régler : ${cashInAmount.toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol}\n\n` +
                              `COORDONNÉES BANCAIRES POUR LE VIREMENT :\n` +
                              `Banque Domiciliataire : ${selectedBank}\n` +
                              `Titulaire : ${userCompanyName}\n` +
                              `RIB / IBAN UEMOA : ${userIban}\n` +
                              `Référence à inscrire impérativement : FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}\n\n` +
                              `Dispositions légales : Facture conforme aux règles de l'OHADA et du Code Général des Impôts.`;
                            copyToClipboard(invoiceText, 'bankInvoice');
                          }}
                          className="cursor-pointer px-3.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>{copiedSection === 'bankInvoice' ? 'Facture Copiée !' : 'Copier la Facture & RIB'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Votre Banque Locale
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl p-2.5 cursor-pointer focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                        >
                          {currentGeoProfile.banks.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Votre RIB / IBAN Professionnel
                        </label>
                        <input
                          type="text"
                          value={userIban}
                          onChange={(e) => setUserIban(e.target.value)}
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 font-mono text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Visual Pro-forma Card */}
                    <div className="p-5 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] rounded-xl space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-start border-b border-stone-200/80 dark:border-white/[0.07] pb-2.5">
                        <div>
                          <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm font-display">{userCompanyName}</div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">{userNif}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-stone-900 dark:text-stone-100 font-semibold">FACTURE PRO-FORMA</div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">Date : {new Date().toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs py-1">
                        <div>
                          <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Désignation :</span>
                          <strong className="text-stone-900 dark:text-stone-100 font-medium">{opportunityTitle}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Total Net à Payer :</span>
                          <strong className="text-base text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                            {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                          </strong>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50/70 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-500/30 rounded-lg text-[11px] space-y-1">
                        <div className="text-blue-700 dark:text-blue-400 font-semibold">Coordonnées de Virement</div>
                        <div className="text-stone-700 dark:text-stone-300">Banque : <span className="text-stone-900 dark:text-stone-100 font-medium">{selectedBank}</span></div>
                        <div className="text-stone-700 dark:text-stone-300">RIB/IBAN : <span className="text-stone-900 dark:text-stone-100 font-mono font-medium">{userIban}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 3: TRANSFER AGENCIES & VIRTUAL CARDS */}
                {activePaymentRail === 'transfer_agency' && (
                  <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-amber-200 dark:border-amber-500/30 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
                      <div>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block">
                          Agences de Transfert (NITA, Al Izza, Amana) & Cartes Virtuelles
                        </span>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          Encaissement physique en agence dans toutes les villes du Niger (Niamey, Zinder, Maradi, Tahoua, Agadez) ou chargement sur carte Visa prépayée.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold shrink-0">
                        Retrait Espèces Instantané
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Réseau d'Agence ou Carte
                        </label>
                        <select
                          value={selectedAgency}
                          onChange={(e) => setSelectedAgency(e.target.value)}
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl p-2.5 cursor-pointer focus:outline-none focus:border-amber-600 dark:focus:border-amber-500"
                        >
                          {currentGeoProfile.transferAgencies.map((agency) => (
                            <option key={agency} value={agency}>
                              {agency}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Nom & Prénoms du Bénéficiaire (Sur Pièce d'Identité)
                        </label>
                        <input
                          type="text"
                          value={userCompanyName}
                          onChange={(e) => setUserCompanyName(e.target.value)}
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] rounded-xl space-y-2 text-xs">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>Procédure pour le Client</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                        Le client se présente à n'importe quel guichet {selectedAgency} ou effectue un envoi depuis l'application mobile {selectedAgency}.
                        Il mentionne votre nom complet et votre numéro de téléphone (<strong className="text-stone-900 dark:text-stone-100 font-mono">{userPhone}</strong>).
                        Vous recevez instantanément le code de retrait par SMS et pouvez retirer les espèces ou les créditer sur votre carte Visa NITA / Djamo.
                      </p>
                    </div>
                  </div>
                )}

                {/* SPECIFIC RAIL VIEW 4: LIEN DE PAIEMENT OU NUMÉRO PRESTATAIRE RÉEL */}
                {activePaymentRail === 'stripe' && (
                  <div className="p-5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-blue-200 dark:border-blue-500/30 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 block">
                          Votre Lien ou Numéro de Paiement Réel
                        </span>
                        <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                          Collez votre lien de paiement prestataire (Stripe, FedaPay, CinetPay, PayTech, Wave) ou votre numéro marchand Mobile Money.
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-stone-600 dark:text-stone-400 shrink-0">
                        {customPaymentLink.trim() ? 'Configuré' : 'Non configuré'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 block mb-1.5">
                          Lien de paiement ou numéro de paiement réel
                        </label>
                        <input
                          type="text"
                          value={customPaymentLink}
                          onChange={(e) => setCustomPaymentLink(e.target.value)}
                          placeholder="Collez ici votre vrai lien (https://...) ou numéro Mobile Money..."
                          className="w-full bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] text-stone-900 dark:text-stone-100 font-mono text-xs rounded-xl px-3 py-2.5 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                          Référence transmise au client
                        </span>
                        <button
                          type="button"
                          disabled={!customPaymentLink.trim()}
                          onClick={() => copyToClipboard(customPaymentLink.trim(), 'stripelink')}
                          className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-stone-200 dark:disabled:bg-white/[0.08] disabled:text-stone-500 dark:disabled:text-stone-500 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedSection === 'stripelink' ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.08] rounded-xl font-mono text-xs break-all">
                        {customPaymentLink.trim() ? (
                          <span className="text-blue-700 dark:text-blue-400 font-medium">{customPaymentLink.trim()}</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">Lien de paiement non configuré</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Démarches Officielles Adaptées au Contexte Géographique */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    3. Les 3 Démarches Réelles pour Être en Règle & Prêt à Encaisser ({currentGeoProfile.countryName})
                  </span>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    {isAfricanUemoa
                      ? "Formalisation simple au Niger et en Afrique de l'Ouest : démarches à la Maison de l'Entreprise, RCCM et compte bancaire professionnel."
                      : 'Création en ligne sans apport de capital en moins de 30 minutes.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 dark:divide-white/[0.07] border border-stone-200/80 dark:border-white/[0.08] rounded-xl bg-[#F6F4EF] dark:bg-[#0D1017]">
                  {/* Step A */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                        DÉMARCHE 01
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {isAfricanUemoa ? 'RCCM & NIF au Guichet Unique' : 'Statut Juridique Gratuit (15 min)'}
                        </h4>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {isAfricanUemoa ? "Maison de l'Entreprise du Niger (CCIN Niamey)" : 'formalites.entreprises.gouv.fr'}
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Enregistrez votre Entreprise Individuelle (Établissement). Coût très faible, capital minimum : 0 FCFA. Vous obtenez votre N° RCCM et NIF en 48h à 72h.'
                          : 'Créez votre Micro-entreprise en BNC Prestation de services. 0 € de capital requis. SIRET délivré en 3 à 7 jours.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-stone-200/80 dark:border-white/[0.07] text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      {isAfricanUemoa
                        ? "Régime de l'Impôt Synthétique (ISF) : pas de comptabilité lourde pour démarrer."
                        : 'Si 0 € encaissé = 0 € de cotisations à payer.'}
                    </div>
                  </div>

                  {/* Step B */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
                        DÉMARCHE 02
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {isAfricanUemoa ? 'Compte Bancaire Pro & Compte Marchand' : 'Compte Bancaire Pro en Ligne'}
                        </h4>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {isAfricanUemoa ? 'SONIBANK, ECOBANK Niger ou Airtel Business' : 'Qonto, Shine ou BoursoBank'}
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Ouvrez un compte professionnel à la SONIBANK, ECOBANK Niger ou BOA Niger avec votre RCCM et NIF, et activez une ligne Airtel Money Marchand pour encaisser vos clients.'
                          : 'Ouvrez un compte dédié en ligne. Vous obtenez un IBAN immédiatement avec carte Mastercard pro.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-stone-200/80 dark:border-white/[0.07] text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Notifications SMS instantanées à chaque encaissement client reçu.
                    </div>
                  </div>

                  {/* Step C */}
                  <div className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        DÉMARCHE 03
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {isAfricanUemoa ? 'Cartes Visa Virtuelles & Passerelles' : 'Passerelle de Paiement & Payouts Automatiques'}
                        </h4>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {isAfricanUemoa ? 'Carte NITA Visa, Djamo, FedaPay, PayTech' : 'Prestataire agréé'}
                        </div>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                        {isAfricanUemoa
                          ? 'Obtenez une carte Visa virtuelle (NITA Transfert ou Djamo) pour lier vos outils internationaux ou utilisez un agrégateur de paiement UEMOA (FedaPay, CinetPay) pour encaisser en ligne.'
                          : 'Créez un compte marchand et liez votre compte bancaire pour des virements quotidiens sous 48h.'}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-stone-200/80 dark:border-white/[0.07] text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                      Permet d'encaisser des fonds locaux et internationaux sans blocage géographique.
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Ce qu'il Vous Reste Réellement Net en Poche */}
              <div className="p-6 space-y-3 bg-[#F6F4EF]/70 dark:bg-[#0D1017]/60">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                  4. Combien d'Argent Réel Vous Reste-t-il dans la Poche ? (Estimation indicative)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07] border border-stone-200/80 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#141720] text-xs font-mono overflow-hidden">
                  <div className="p-4">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">Pour {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol} Encaissés</div>
                    <div className="text-lg font-semibold text-stone-900 dark:text-stone-100 tabular-nums mt-1">
                      {cashInAmount.toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-sans">Chiffre d'affaires brut</div>
                  </div>

                  <div className="p-4">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">Frais d'Encaissement</div>
                    <div className="text-lg font-semibold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
                      {activePaymentRail === 'bank_transfer'
                        ? '0 FCFA'
                        : `-${Math.round(cashInAmount * 0.015).toLocaleString('fr-FR')} ${currentGeoProfile.currencySymbol}`}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 font-sans">
                      {activePaymentRail === 'bank_transfer' ? 'Virement bancaire direct' : '1% à 1.5% opérateur'}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">Fiscalité Indicative ({currentGeoProfile.standardTaxRate}%)</div>
                    <div className="text-lg font-semibold text-rose-700 dark:text-rose-400 tabular-nums mt-1">
                      -{Math.round(cashInAmount * (currentGeoProfile.standardTaxRate / 100)).toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-sans">
                      {isAfricanUemoa ? 'Régime ISF forfaitaire BNC' : 'Cotisations URSSAF'}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/35">
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-sans font-semibold">Net Direct Pour Vous</div>
                    <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
                      {Math.round(cashInAmount * (1 - (currentGeoProfile.standardTaxRate / 100) - (activePaymentRail === 'bank_transfer' ? 0 : 0.015))).toLocaleString('fr-FR')} {currentGeoProfile.currencySymbol}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-sans">Net disponible sur votre compte</div>
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
