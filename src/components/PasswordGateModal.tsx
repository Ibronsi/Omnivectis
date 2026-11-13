import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { verifyPasswordOnServer } from '../utils/auth';

interface PasswordGateModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const PasswordGateModal: React.FC<PasswordGateModalProps> = ({ isOpen, onSuccess }) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const result = await verifyPasswordOnServer(password.trim());

    if (result.success) {
      setLoading(false);
      onSuccess();
    } else {
      setLoading(false);
      setErrorMsg(result.error || 'Mot de passe incorrect.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B10]/90 backdrop-blur-md">
      <div className="bg-[#11141C] border border-white/[0.1] rounded-xl max-w-md w-full p-8 space-y-6 shadow-2xl relative text-slate-100">
        {/* Geometric Brand Mark & Lock Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-11 h-11 rounded-lg bg-[#0D1017] border border-white/[0.1] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white tracking-tight">
              OmniVectis · Accès Sécurisé
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Ce terminal est strictement réservé à votre usage personnel. Saisissez le mot de passe défini dans{' '}
              <code className="text-blue-300 font-mono">APP_PASSWORD</code>.
            </p>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Mot de passe d accès *</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe..."
                className="w-full px-3.5 py-2.5 pr-10 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs font-mono focus:border-blue-500/60 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Vérification...' : 'Déverrouiller le Terminal'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 border-t border-white/[0.07] pt-4">
          <span>Protection active sur toutes les routes de l API</span>
        </div>
      </div>
    </div>
  );
};
