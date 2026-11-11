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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Contrôle Strict · Règle d Approbation Préalable</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            File "À valider" & Journal d Actions
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            <strong className="text-white">Règle absolue :</strong> Rien n est envoyé, contacté ni publié sans votre validation formelle.
            Chaque prospection, offre ou formalité reste ici en attente, et chaque événement est consigné dans le journal d audit inaltérable.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="cursor-pointer px-3.5 py-2 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Primary SubTabs: Queue vs Audit */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'queue'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>File "À valider"</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700">
                {pendingCount} en attente
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'audit'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Journal de Toutes les Actions ({auditEntries.length})</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ===================== VIEW 1: FILE "À VALIDER" ===================== */}
      {activeSubTab === 'queue' && (
        <div className="space-y-6">
          {/* Status filter bar */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Filtrer les éléments :</span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800">
                <button
                  onClick={() => setStatusFilter('en_attente')}
                  className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    statusFilter === 'en_attente' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  En attente ({queueItems.filter((i) => i.status === 'en_attente').length})
                </button>
                <button
                  onClick={() => setStatusFilter('valide')}
                  className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    statusFilter === 'valide' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Validés ({queueItems.filter((i) => i.status === 'valide').length})
                </button>
                <button
                  onClick={() => setStatusFilter('rejete')}
                  className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    statusFilter === 'rejete' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rejetés ({queueItems.filter((i) => i.status === 'rejete').length})
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    statusFilter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous ({queueItems.length})
                </button>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:block">
              Aucun envoi automatisé sans clic "Valider"
            </span>
          </div>

          {/* Items List */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm">Chargement des éléments en file...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/30 border border-slate-800 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Aucun élément dans cette catégorie</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isPending
                        ? 'bg-slate-900 border-amber-700/50 hover:border-amber-600/70'
                        : isValidated
                        ? 'bg-slate-900/60 border-emerald-900/60'
                        : 'bg-slate-900/40 border-rose-900/60'
                    }`}
                  >
                    {/* Header Zone */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                              item.category === 'prospection_message'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : item.category === 'administrative_step'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            }`}
                          >
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-300">
                            Destinataire : <strong className="text-white">{item.targetRecipient || 'Non spécifié'}</strong>
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-[11px] text-slate-400">
                            Source : {item.sourceOpportunityTitle}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white pt-1">{item.title}</h3>
                      </div>

                      {/* Status indicator */}
                      <div className="shrink-0">
                        {isPending && (
                          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En attente de validation</span>
                          </span>
                        )}
                        {isValidated && (
                          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Validé par l utilisateur</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeté</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Payload */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.contentPayload}
                    </div>

                    {/* Review Notes & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Créé le {new Date(item.createdAt).toLocaleString('fr-FR')}
                        {item.reviewedAt && ` · Traité le ${new Date(item.reviewedAt).toLocaleString('fr-FR')}`}
                      </div>

                      {isPending ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'rejete')}
                            className="cursor-pointer px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rejeter l action</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'valide')}
                            className="cursor-pointer px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
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
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              Journal certifié enregistrant chaque collecte de signal, synthèse d opportunité, validation manuelle, vente réelle et modification d hypothèse.
            </span>
            <span className="font-mono text-indigo-400">{auditEntries.length} entrées</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3 px-4 font-semibold">Horodatage</th>
                  <th className="py-3 px-4 font-semibold">Acteur</th>
                  <th className="py-3 px-4 font-semibold">Type d Action</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Détails Provenance</th>
                  <th className="py-3 px-4 text-center font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Aucune entrée dans le journal d actions.
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{getActorBadge(entry.actor)}</td>
                      <td className="py-3 px-4 text-slate-300 font-semibold whitespace-nowrap">
                        {getActionBadge(entry.actionType)}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{entry.description}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {entry.provenanceDetails || '-'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            entry.status === 'success'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : entry.status === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
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
