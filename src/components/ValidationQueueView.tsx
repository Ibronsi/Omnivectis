import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Bot,
  Terminal,
  RefreshCw,
  Send,
  AlertCircle,
  Check,
  X,
  History,
  Lock,
  Mail,
  MessageSquare,
  Webhook,
  Plus,
} from 'lucide-react';
import {
  ValidationItem,
  AuditLogEntry,
  CountryCode,
  DeliveryChannelStatus,
} from '../types/market';
import { subscribeLiveEvent } from '../utils/liveStream';

interface ValidationQueueViewProps {
  countryCode: CountryCode;
}

type DraftChannel = 'none' | 'email' | 'whatsapp' | 'webhook';

interface ItemDraft {
  channel: DraftChannel;
  target: string;
  subject: string;
  reviewNotes: string;
}

function getInitialDraft(item: ValidationItem): ItemDraft {
  const existingChannel = item.deliveryChannel;
  const target = (item.deliveryTarget || item.targetRecipient || '').trim();
  let defaultChannel: DraftChannel = 'none';
  if (existingChannel) {
    defaultChannel = existingChannel;
  } else if (target.includes('@') || item.category === 'prospection_message') {
    defaultChannel = 'email';
  }

  return {
    channel: defaultChannel,
    target,
    subject: item.deliverySubject || item.title,
    reviewNotes: item.reviewNotes || '',
  };
}

export const ValidationQueueView: React.FC<ValidationQueueViewProps> = ({ countryCode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'audit'>('queue');
  const [queueItems, setQueueItems] = useState<ValidationItem[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [deliveryChannels, setDeliveryChannels] = useState<DeliveryChannelStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'valide' | 'rejete'>('en_attente');
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual message composer (for testing or custom outreach)
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newRecipient, setNewRecipient] = useState<string>('');
  const [newPayload, setNewPayload] = useState<string>('');
  const [creatingManual, setCreatingManual] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [qRes, aRes, dRes] = await Promise.all([
        fetch('/api/validation'),
        fetch('/api/audit'),
        fetch('/api/delivery/status'),
      ]);
      const qData = await qRes.json();
      const aData = await aRes.json();
      const dData = await dRes.json().catch(() => ({}));

      if (!qRes.ok) throw new Error(qData?.error || `Erreur serveur HTTP ${qRes.status}`);
      if (!aRes.ok) throw new Error(aData?.error || `Erreur serveur HTTP ${aRes.status}`);

      if (qData?.items) setQueueItems(qData.items);
      if (aData?.entries) setAuditEntries(aData.entries);
      if (dData?.channels) setDeliveryChannels(dData.channels);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de charger la file de validation ou le journal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const unsubVal = subscribeLiveEvent<{ items?: ValidationItem[] }>('validation_updated', (payload) => {
      if (Array.isArray(payload?.items)) {
        setQueueItems(payload.items);
      }
    });
    const unsubAudit = subscribeLiveEvent<{ entries?: AuditLogEntry[] }>('audit_updated', (payload) => {
      if (Array.isArray(payload?.entries)) {
        setAuditEntries(payload.entries);
      }
    });

    return () => {
      unsubVal();
      unsubAudit();
    };
  }, []);

  const getDraft = (item: ValidationItem): ItemDraft => {
    return drafts[item.id] || getInitialDraft(item);
  };

  const updateDraft = (item: ValidationItem, patch: Partial<ItemDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || getInitialDraft(item)),
        ...patch,
      },
    }));
  };

  const refreshAudit = () => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((d) => {
        if (d?.entries) setAuditEntries(d.entries);
      })
      .catch(() => {});
  };

  const handleUpdateStatus = async (
    item: ValidationItem,
    newStatus: 'valide' | 'rejete',
    sendNow: boolean
  ) => {
    const draft = getDraft(item);
    setSubmittingId(item.id);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/validation/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes: draft.reviewNotes,
          sendNow,
          deliveryChannel: sendNow ? draft.channel : undefined,
          deliveryTarget: sendNow ? draft.target : undefined,
          deliverySubject: sendNow ? draft.subject : undefined,
        }),
      });
      const data = await res.json();

      if (data?.item) {
        setQueueItems((prev) => prev.map((entry) => (entry.id === item.id ? data.item : entry)));
      }

      if (!res.ok) {
        refreshAudit();
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }

      if (sendNow && draft.channel !== 'none') {
        const providerLabel = data?.delivery?.provider ? ` (${data.delivery.provider})` : '';
        setFeedbackMsg(
          `Action validée et envoyée réellement via ${draft.channel}${providerLabel} à ${draft.target || 'destinataire'}.`
        );
      } else {
        setFeedbackMsg(
          newStatus === 'valide'
            ? 'Action validée sans envoi externe. Enregistrée dans le journal.'
            : 'Action rejetée. Enregistrée dans le journal.'
        );
      }
      setTimeout(() => setFeedbackMsg(null), 5000);
      refreshAudit();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur lors de la validation / envoi.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSendValidatedItem = async (item: ValidationItem) => {
    const draft = getDraft(item);
    if (draft.channel === 'none') {
      setErrorMsg('Sélectionnez un canal d’envoi (E-mail, WhatsApp ou Webhook) avant d’envoyer.');
      return;
    }

    setSubmittingId(item.id);
    setErrorMsg(null);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/validation/${item.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryChannel: draft.channel,
          deliveryTarget: draft.target,
          deliverySubject: draft.subject,
          reviewNotes: draft.reviewNotes,
        }),
      });
      const data = await res.json();

      if (data?.item) {
        setQueueItems((prev) => prev.map((entry) => (entry.id === item.id ? data.item : entry)));
      }

      if (!res.ok) {
        refreshAudit();
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }

      const providerLabel = data?.delivery?.provider ? ` (${data.delivery.provider})` : '';
      setFeedbackMsg(
        `Envoi réel réussi via ${draft.channel}${providerLabel} à ${draft.target || 'destinataire'}.`
      );
      setTimeout(() => setFeedbackMsg(null), 5000);
      refreshAudit();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Échec de l’envoi réel.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCreateManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPayload.trim()) return;
    setCreatingManual(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: 'prospection_message',
          targetRecipient: newRecipient.trim() || undefined,
          contentPayload: newPayload.trim(),
          sourceOpportunityTitle: 'Rédaction manuelle',
          countryCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      if (data?.item) {
        setQueueItems((prev) => [data.item, ...prev.filter((i) => i.id !== data.item.id)]);
      }
      setNewTitle('');
      setNewRecipient('');
      setNewPayload('');
      setShowComposer(false);
      setStatusFilter('en_attente');
      setFeedbackMsg('Élément ajouté à la file « À valider ».');
      setTimeout(() => setFeedbackMsg(null), 4000);
      refreshAudit();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de créer l’élément.');
    } finally {
      setCreatingManual(false);
    }
  };

  const filteredQueue = queueItems.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const pendingCount = queueItems.filter((i) => i.status === 'en_attente').length;

  const getActorBadge = (actor: string) => {
    switch (actor) {
      case 'utilisateur':
        return (
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>Utilisateur</span>
          </span>
        );
      case 'gemini_api':
        return (
          <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span>Gemini API</span>
          </span>
        );
      case 'agent_serveur':
      default:
        return (
          <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
            <Terminal className="w-3 h-3" />
            <span>Serveur</span>
          </span>
        );
    }
  };

  const getActionBadge = (actionType: string) => {
    const labels: Record<string, string> = {
      signal_harvested: 'Collecte Signal',
      opportunity_generated: 'Synthèse Opportunité',
      kit_generated: 'Génération Dossier',
      item_queued: 'Mise en File',
      item_validated: 'Validation Manuelle',
      item_rejected: 'Rejet Manuel',
      email_sent: 'E-mail Envoyé',
      message_sent: 'Message Envoyé',
      delivery_failed: 'Échec d’Envoi',
      sale_recorded: 'Vente Encaissée',
      hypothesis_updated: 'Hypothèse Modifiée',
      api_error: 'Erreur API',
    };
    return labels[actionType] || actionType;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Contrôle Strict · Envoi Réel Après Approbation</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            File « À valider » & Journal d Actions
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            <strong className="text-slate-200 font-medium">Règle absolue :</strong> Rien n est envoyé ni exécuté sans votre validation formelle.
            Choisissez le canal réel (E-mail, WhatsApp Cloud API ou Webhook) au moment d approuver, et suivez le statut exact d acheminement.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowComposer((prev) => !prev)}
            className="cursor-pointer px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Rédiger un message</span>
          </button>

          <button
            onClick={fetchData}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#11141C] hover:bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Delivery Channels Readiness Strip */}
      {deliveryChannels && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#11141C] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">E-mail (SMTP / Resend)</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {deliveryChannels.email.configured
                    ? deliveryChannels.email.fromAddress || deliveryChannels.email.providers.join(', ')
                    : 'Définissez RESEND_API_KEY ou SMTP_*'}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono font-medium shrink-0 ${
                deliveryChannels.email.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {deliveryChannels.email.configured ? 'Prêt' : 'Non configuré'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#11141C] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">WhatsApp Cloud API</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {deliveryChannels.whatsapp.configured
                    ? 'Meta Graph API actif'
                    : 'Définissez WHATSAPP_ACCESS_TOKEN'}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono font-medium shrink-0 ${
                deliveryChannels.whatsapp.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {deliveryChannels.whatsapp.configured ? 'Prêt' : 'Non configuré'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#11141C] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Webhook className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200">Webhook sortant</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {deliveryChannels.webhook.configured
                    ? 'Relais HTTP actif (n8n / Make / API)'
                    : 'Définissez OUTBOUND_WEBHOOK_URL'}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-mono font-medium shrink-0 ${
                deliveryChannels.webhook.configured ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {deliveryChannels.webhook.configured ? 'Prêt' : 'Non configuré'}
            </span>
          </div>
        </div>
      )}

      {/* Manual Composer */}
      {showComposer && (
        <form
          onSubmit={handleCreateManualItem}
          className="p-5 rounded-xl bg-[#11141C] border border-blue-500/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white">
              Nouveau message à soumettre à la file de validation
            </h3>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Fermer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Objet / Titre *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex. Proposition de partenariat B2B"
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.09] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Destinataire (e-mail ou numéro WhatsApp)
              </label>
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Ex. contact@entreprise.com ou +22790123456"
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.09] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Contenu du message *</label>
            <textarea
              required
              rows={4}
              value={newPayload}
              onChange={(e) => setNewPayload(e.target.value)}
              placeholder="Rédigez le message exact qui sera envoyé après validation..."
              className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.09] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creatingManual}
              className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
            >
              {creatingManual ? 'Ajout en cours...' : 'Ajouter en file « À valider »'}
            </button>
          </div>
        </form>
      )}

      {/* Primary SubTabs: Queue vs Audit */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1 p-1 bg-[#11141C] border border-white/[0.08] rounded-lg">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
              activeSubTab === 'queue'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>File « À valider »</span>
            {pendingCount > 0 && (
              <span className="font-mono text-[11px] opacity-90 tabular-nums">
                ({pendingCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
              activeSubTab === 'audit'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Journal de Toutes les Actions ({auditEntries.length})</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ===================== VIEW 1: FILE "À VALIDER" ===================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* Status filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#11141C] border border-white/[0.08] rounded-xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-slate-400 font-medium pl-1">Filtrer :</span>
              <div className="flex items-center gap-1 p-1 bg-[#0D1017] rounded-lg border border-white/[0.07]">
                <button
                  onClick={() => setStatusFilter('en_attente')}
                  className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'en_attente' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  En attente ({queueItems.filter((i) => i.status === 'en_attente').length})
                </button>
                <button
                  onClick={() => setStatusFilter('valide')}
                  className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'valide' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Validés ({queueItems.filter((i) => i.status === 'valide').length})
                </button>
                <button
                  onClick={() => setStatusFilter('rejete')}
                  className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'rejete' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rejetés ({queueItems.filter((i) => i.status === 'rejete').length})
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`cursor-pointer px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === 'all' ? 'bg-white/[0.08] text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous ({queueItems.length})
                </button>
              </div>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:block pr-1">
              Aucun envoi sans validation explicite
            </span>
          </div>

          {/* Items List */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm">Chargement des éléments en file...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-16 text-center bg-[#11141C] border border-white/[0.08] rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-white">Aucun élément dans cette catégorie</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Lorsque vous générez un dossier de lancement, un plan physique ou rédigez un message manuel, il apparaît ici pour validation et envoi réel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((item) => {
                const isPending = item.status === 'en_attente';
                const isValidated = item.status === 'valide';
                const isRejected = item.status === 'rejete';
                const draft = getDraft(item);
                const isSubmitting = submittingId === item.id;
                const channelConfigured =
                  draft.channel === 'none' ||
                  (deliveryChannels ? Boolean(deliveryChannels[draft.channel]?.configured) : true);

                return (
                  <div
                    key={item.id}
                    className={`p-6 rounded-xl bg-[#11141C] border transition-colors space-y-4 ${
                      isPending
                        ? 'border-amber-500/30 hover:border-amber-500/50'
                        : isValidated
                        ? 'border-emerald-500/25'
                        : 'border-rose-500/25'
                    }`}
                  >
                    {/* Header Zone */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span
                            className={`font-mono font-medium ${
                              item.category === 'prospection_message'
                                ? 'text-cyan-400'
                                : item.category === 'administrative_step'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {item.category.replace('_', ' ')}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-400">
                            Cible : <strong className="text-slate-200 font-medium">{item.deliveryTarget || item.targetRecipient || 'Non spécifié'}</strong>
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-[11px] text-slate-500">
                            Source : {item.sourceOpportunityTitle}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
                      </div>

                      {/* Semantic Status */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isPending && (
                          <span className="text-xs font-mono font-medium text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En attente</span>
                          </span>
                        )}
                        {isValidated && (
                          <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validé</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-xs font-mono font-medium text-rose-400 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeté</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Payload */}
                    <div className="p-4 rounded-lg bg-[#0D1017] border border-white/[0.06] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.contentPayload}
                    </div>

                    {/* Delivery Outcome Banner if already attempted */}
                    {item.deliveryStatus === 'sent' && (
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            Envoyé réellement via <strong className="uppercase">{item.deliveryChannel}</strong>
                            {item.deliveryProvider ? ` (${item.deliveryProvider})` : ''} à{' '}
                            <strong className="font-mono">{item.deliveryTarget || 'Webhook'}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400/90 tabular-nums">
                          {item.deliveredAt ? new Date(item.deliveredAt).toLocaleString('fr-FR') : ''}
                          {item.deliveryMessageId ? ` · ID ${item.deliveryMessageId}` : ''}
                        </span>
                      </div>
                    )}

                    {item.deliveryStatus === 'failed' && item.deliveryError && (
                      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-rose-300">Échec de l envoi réel ({item.deliveryChannel})</p>
                          <p className="text-rose-200/90 mt-0.5">{item.deliveryError}</p>
                        </div>
                      </div>
                    )}

                    {/* Real Dispatch Controls (Available for Pending OR Validated not-yet-sent/failed) */}
                    {!isRejected && item.deliveryStatus !== 'sent' && (
                      <div className="p-4 rounded-lg bg-[#0D1017] border border-white/[0.06] space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Canal d envoi réel
                            </label>
                            <select
                              value={draft.channel}
                              onChange={(e) =>
                                updateDraft(item, { channel: e.target.value as DraftChannel })
                              }
                              className="w-full px-3 py-2 bg-[#11141C] border border-white/[0.1] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
                            >
                              <option value="none">Aucun (Validation interne seule)</option>
                              <option value="email">E-mail (SMTP / Resend)</option>
                              <option value="whatsapp">WhatsApp (Cloud API)</option>
                              <option value="webhook">Webhook sortant</option>
                            </select>
                          </div>

                          {draft.channel !== 'none' && (
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                {draft.channel === 'email'
                                  ? 'Adresse e-mail du destinataire *'
                                  : draft.channel === 'whatsapp'
                                  ? 'Numéro WhatsApp (+indicatif) *'
                                  : 'Destinataire / Référence (optionnel)'}
                              </label>
                              <input
                                type={draft.channel === 'email' ? 'email' : 'text'}
                                value={draft.target}
                                onChange={(e) => updateDraft(item, { target: e.target.value })}
                                placeholder={
                                  draft.channel === 'email'
                                    ? 'client@entreprise.com'
                                    : draft.channel === 'whatsapp'
                                    ? '+22790123456'
                                    : 'crm-prospect-01'
                                }
                                className="w-full px-3 py-2 bg-[#11141C] border border-white/[0.1] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
                              />
                            </div>
                          )}

                          {draft.channel === 'email' && (
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">
                                Objet de l e-mail
                              </label>
                              <input
                                type="text"
                                value={draft.subject}
                                onChange={(e) => updateDraft(item, { subject: e.target.value })}
                                placeholder="Objet du message..."
                                className="w-full px-3 py-2 bg-[#11141C] border border-white/[0.1] rounded-lg text-xs text-white focus:border-blue-500/60 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>

                        {draft.channel !== 'none' && !channelConfigured && (
                          <p className="text-[11px] text-amber-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Ce canal n a pas encore ses identifiants serveur configurés ; l envoi retournera une erreur explicite tant qu ils ne sont pas renseignés.
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Review Notes & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.07]">
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        Créé le {new Date(item.createdAt).toLocaleString('fr-FR')}
                        {item.reviewedAt && ` · Traité le ${new Date(item.reviewedAt).toLocaleString('fr-FR')}`}
                      </div>

                      {isPending ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            disabled={isSubmitting}
                            onClick={() => handleUpdateStatus(item, 'rejete', false)}
                            className="cursor-pointer px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeter</span>
                          </button>

                          <button
                            disabled={isSubmitting}
                            onClick={() => handleUpdateStatus(item, 'valide', false)}
                            className="cursor-pointer px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#171C28] hover:bg-white/[0.08] border border-white/[0.1] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider sans envoyer</span>
                          </button>

                          {draft.channel !== 'none' && (
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleUpdateStatus(item, 'valide', true)}
                              className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Valider & Envoyer réellement</span>
                            </button>
                          )}
                        </div>
                      ) : isValidated && item.deliveryStatus !== 'sent' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {item.reviewNotes && (
                            <span className="text-xs text-slate-400 mr-2">Note : {item.reviewNotes}</span>
                          )}
                          <button
                            disabled={isSubmitting || draft.channel === 'none'}
                            onClick={() => handleSendValidatedItem(item)}
                            className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {item.deliveryStatus === 'failed'
                                ? 'Réessayer l envoi réel'
                                : 'Envoyer réellement'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          {item.reviewNotes ? `Note : ${item.reviewNotes}` : 'Action clôturée'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 2: JOURNAL DE TOUTES LES ACTIONS (AUDIT LOG) ===================== */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#11141C] border border-white/[0.08] text-xs text-slate-300 flex items-center justify-between gap-4">
            <span>
              Journal certifié enregistrant chaque collecte de signal, synthèse d opportunité, validation manuelle, envoi réel, vente et modification d hypothèse.
            </span>
            <span className="font-mono text-blue-400 shrink-0 tabular-nums">{auditEntries.length} entrées</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#11141C]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 bg-[#0D1017]">
                  <th className="py-2.5 px-4 font-semibold">Horodatage</th>
                  <th className="py-2.5 px-4 font-semibold">Acteur</th>
                  <th className="py-2.5 px-4 font-semibold">Type d Action</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                  <th className="py-2.5 px-4 font-semibold">Détails Provenance</th>
                  <th className="py-2.5 px-4 text-center font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-sans">
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucune entrée dans le journal d actions.
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap tabular-nums">
                        {new Date(entry.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">{getActorBadge(entry.actor)}</td>
                      <td className="py-2.5 px-4 text-slate-200 font-medium whitespace-nowrap">
                        {getActionBadge(entry.actionType)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{entry.description}</td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {entry.provenanceDetails || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[11px] font-mono font-medium ${
                            entry.status === 'success'
                              ? 'text-emerald-400'
                              : entry.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
