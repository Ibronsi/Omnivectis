import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ListFilter,
  FileText,
  User,
  Bot,
  Terminal,
  RefreshCw,
  Send,
  AlertCircle,
  Check,
  X,
  History,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { ValidationItem, AuditLogEntry, CountryCode } from '../types/market';

interface ValidationQueueViewProps {
  countryCode: CountryCode;
}

export const ValidationQueueView: React.FC<ValidationQueueViewProps> = ({ countryCode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'audit'>('queue');
  const [queueItems, setQueueItems] = useState<ValidationItem[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'en_attente' | 'valide' | 'rejete'>('en_attente');
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        fetch('/api/validation'),
        fetch('/api/audit'),
      ]);
      const qData = await qRes.json();
      const aData = await aRes.json();
      if (qData?.items) setQueueItems(qData.items);
      if (aData?.entries) setAuditEntries(aData.entries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'valide' | 'rejete') => {
    const note = actionNotes[id] || '';
    try {
      const res = await fetch(`/api/validation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewNotes: note }),
      });
      const data = await res.json();
      if (data?.item) {
        setQueueItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
        setFeedbackMsg(
          newStatus === 'valide'
            ? 'Action validée avec succès ! Enregistrée dans le journal.'
            : 'Action rejetée. Enregistrée dans le journal.'
        );
        setTimeout(() => setFeedbackMsg(null), 4000);
        // Refresh audit log
        fetch('/api/audit')
          .then((r) => r.json())
          .then((d) => {
            if (d?.entries) setAuditEntries(d.entries);
          });
      }
    } catch (e) {
      console.error(e);
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
            <span>Contrôle Strict · Règle d Approbation Préalable</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            File « À valider » & Journal d Actions
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            <strong className="text-slate-200 font-medium">Règle absolue :</strong> Rien n est envoyé, contacté ni publié sans votre validation formelle.
            Chaque prospection, offre ou formalité reste ici en attente, et chaque événement est consigné dans le journal d audit inaltérable.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#11141C] hover:bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

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
              Aucun envoi automatisé sans clic « Valider »
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
                Lorsque vous générez un dossier de lancement ou plan physique, les messages et formalités s affichent ici pour approbation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((item) => {
                const isPending = item.status === 'en_attente';
                const isValidated = item.status === 'valide';
                const isRejected = item.status === 'rejete';

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
                            Destinataire : <strong className="text-slate-200 font-medium">{item.targetRecipient || 'Non spécifié'}</strong>
                          </span>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-[11px] text-slate-500">
                            Source : {item.sourceOpportunityTitle}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
                      </div>

                      {/* Unboxed Semantic Status */}
                      <div className="shrink-0">
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

                    {/* Content Payload (Recessed monospace/sans surface, hairline separated) */}
                    <div className="p-4 rounded-lg bg-[#0D1017] border border-white/[0.06] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.contentPayload}
                    </div>

                    {/* Review Notes & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.07]">
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        Créé le {new Date(item.createdAt).toLocaleString('fr-FR')}
                        {item.reviewedAt && ` · Traité le ${new Date(item.reviewedAt).toLocaleString('fr-FR')}`}
                      </div>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'rejete')}
                            className="cursor-pointer px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeter l action</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'valide')}
                            className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider & Autoriser l exécution</span>
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
              Journal certifié enregistrant chaque collecte de signal, synthèse d opportunité, validation manuelle, vente réelle et modification d hypothèse.
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
