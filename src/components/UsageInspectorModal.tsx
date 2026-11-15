import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { UsageCounterStats } from '../types/market';
import { subscribeLiveEvent } from '../utils/liveStream';

interface UsageInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageInspectorModal: React.FC<UsageInspectorModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<UsageCounterStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de charger les métriques API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStats();
    const unsub = subscribeLiveEvent<{ stats?: UsageCounterStats }>('usage_updated', (payload) => {
      if (payload?.stats) {
        setStats(payload.stats);
      }
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 dark:bg-black/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-6 shadow-xl relative text-stone-900 dark:text-stone-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-5 right-5 p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Compteur d'utilisation & Diagnostic IA</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-stone-900 dark:text-stone-100">Activité sans quota d'usage</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Aucune limitation artificielle de requêtes : ce panneau trace chaque appel aux modèles et signale clairement les anomalies éventuelles.
          </p>
        </div>

        {/* Error alert if usage endpoint failed */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Counter Stats Unified Ledger Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 bg-[#F8F7F4] dark:bg-[#0D1017] border border-stone-200/90 dark:border-white/[0.08] rounded-xl overflow-hidden divide-x divide-y divide-stone-200/80 dark:divide-white/[0.07]">
          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Total appels IA</span>
            <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              {stats?.totalGeminiCalls || 0}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-500 block">Requêtes exécutées</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Appels réussis</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {stats?.successfulCalls || 0}
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">Sans limitation</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Dernière latence</span>
            <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
              {stats?.lastResponseTimeMs ? `${stats.lastResponseTimeMs} ms` : '-'}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-500 block">Temps de réponse API</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Signaux collectés</span>
            <div className="text-xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
              {stats?.signalsCollected || 0}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-500 block">Stockés en base</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Opportunités créées</span>
            <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
              {stats?.opportunitiesSynthesized || 0}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-500 block">Depuis signaux réels</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-xs text-stone-500 dark:text-stone-400 block">Dossiers & Plans</span>
            <div className="text-xl font-bold font-mono text-stone-800 dark:text-stone-200 tabular-nums">
              {stats?.kitsGenerated || 0}
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-500 block">Numériques & Physiques</span>
          </div>
        </div>

        {/* Gemini API Transparent Error Box */}
        <div className="space-y-2.5 border-t border-stone-200/80 dark:border-white/[0.08] pt-4">
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span>État de l'API Gemini & Journal d'erreurs</span>
            <button
              onClick={fetchStats}
              className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Rafraîchir</span>
            </button>
          </div>

          {stats?.lastGeminiError ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-100 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Dernière anomalie signalée par l'API Gemini</span>
              </div>
              <p className="font-mono text-[11px] bg-white dark:bg-[#0D1017] p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200">
                {stats.lastGeminiError.message}
              </p>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-mono tabular-nums">
                Horodatage : {new Date(stats.lastGeminiError.timestamp).toLocaleString('fr-FR')}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>Aucune erreur d'API enregistrée. Tous les appels s'exécutent avec succès.</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-3 border-t border-stone-200/80 dark:border-white/[0.08]">
          <span className="font-mono">Modèle API : Gemini (serveur)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-white/[0.08] hover:bg-stone-200 dark:hover:bg-white/[0.14] border border-stone-200 dark:border-white/[0.1] text-stone-800 dark:text-stone-100 font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
