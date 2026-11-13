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

interface UsageInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageInspectorModal: React.FC<UsageInspectorModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<UsageCounterStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B10]/85 backdrop-blur-sm">
      <div className="bg-[#11141C] border border-white/[0.1] rounded-xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pr-8">
          <div className="text-[11px] font-mono text-blue-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Compteur d Utilisation & Diagnostic Gemini</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-white">Activité Sans Quota d Usage</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            OmniVectis pour usage personnel : aucune bride artificielle ni limitation de requêtes.
            Ce panneau trace chaque interaction avec les modèles et affiche clairement les erreurs éventuelles.
          </p>
        </div>

        {/* Counter Stats Unified Ledger Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 bg-[#0D1017] border border-white/[0.08] rounded-xl overflow-hidden divide-x divide-y divide-white/[0.07]">
          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Total Appels IA</span>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {stats?.totalGeminiCalls || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Requêtes exécutées</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Appels Réussis</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {stats?.successfulCalls || 0}
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono block">Sans limitation</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Dernière Latence</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {stats?.lastResponseTimeMs ? `${stats.lastResponseTimeMs} ms` : '-'}
            </div>
            <span className="text-[10px] text-slate-500 block">Temps de réponse API</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Signaux Collectés</span>
            <div className="text-xl font-bold font-mono text-blue-400 tabular-nums">
              {stats?.signalsCollected || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Dans la table locale</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Opportunités Créées</span>
            <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {stats?.opportunitiesSynthesized || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Depuis signaux réels</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[11px] text-slate-400 block">Dossiers & Plans</span>
            <div className="text-xl font-bold font-mono text-slate-200 tabular-nums">
              {stats?.kitsGenerated || 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Numériques & Physiques</span>
          </div>
        </div>

        {/* Gemini API Transparent Error Box */}
        <div className="space-y-2.5 border-t border-white/[0.08] pt-4">
          <div className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>État de l API Gemini & Journal d Erreurs</span>
            <button
              onClick={fetchStats}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Rafraîchir</span>
            </button>
          </div>

          {stats?.lastGeminiError ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Dernière anomalie signalée par l API Gemini</span>
              </div>
              <p className="font-mono text-[11px] bg-[#0D1017] p-2.5 rounded-lg border border-rose-500/20 text-rose-300">
                {stats.lastGeminiError.message}
              </p>
              <div className="text-[10px] text-rose-400/80 font-mono tabular-nums">
                Horodatage : {new Date(stats.lastGeminiError.timestamp).toLocaleString('fr-FR')}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Aucune erreur d API enregistrée. Tous les appels s exécutent avec succès.</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/[0.08]">
          <span className="font-mono">Modèle API : Gemini (serveur)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white font-medium transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
