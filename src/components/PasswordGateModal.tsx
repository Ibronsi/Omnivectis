import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { verifyPasswordOnServer } from '../utils/auth';
import { signInWithGoogle } from '../lib/firebase';

interface PasswordGateModalProps {
  isOpen: boolean;
  needsPassword: boolean;
  needsGoogleAuth: boolean;
  userEmail?: string | null;
  onPasswordSuccess: () => void;
  onGoogleSuccess: () => void;
}

export const PasswordGateModal: React.FC<PasswordGateModalProps> = ({
  isOpen,
  needsPassword,
  needsGoogleAuth,
  userEmail,
  onPasswordSuccess,
  onGoogleSuccess,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState<boolean>(false);
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoadingPassword(true);
    setErrorMsg(null);

    const result = await verifyPasswordOnServer(password.trim());

    if (result.success) {
      setLoadingPassword(false);
      setPassword('');
      onPasswordSuccess();
    } else {
      setLoadingPassword(false);
      setErrorMsg(result.error || 'Mot de passe incorrect.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      onGoogleSuccess();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('La fenêtre de connexion Google a été fermée avant la validation.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Le navigateur a bloqué la fenêtre Google. Autorisez les pop-ups puis réessayez.');
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMsg('Une autre tentative de connexion est déjà en cours.');
      } else {
        setErrorMsg(err?.message || 'Impossible de finaliser la connexion Google.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B10]/92 backdrop-blur-md">
      <div className="bg-[#11141C] border border-white/[0.1] rounded-xl max-w-md w-full p-8 space-y-6 shadow-2xl relative text-slate-100">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-11 h-11 rounded-lg bg-[#0D1017] border border-white/[0.1] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white tracking-tight">
              OmniVectis · Espace Personnel
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Connectez-vous pour retrouver vos opportunités, dossiers de lancement, encaissements et validations persistants sur tous vos appareils.
            </p>
          </div>
        </div>

        {/* Step 1: Optional APP_PASSWORD unlock */}
        {needsPassword && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loadingPassword || !password.trim()}
              className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loadingPassword ? 'Vérification...' : 'Déverrouiller le Terminal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Step 2: Google Sign-In */}
        {!needsPassword && needsGoogleAuth && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              className="cursor-pointer w-full py-2.5 px-4 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-60"
            >
              {loadingGoogle ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>{loadingGoogle ? 'Connexion en cours...' : 'Continuer avec Google'}</span>
            </button>

            <div className="p-3 rounded-lg bg-[#0D1017] border border-white/[0.06] text-[11px] text-slate-400 flex items-start gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Vos données métier restent strictement isolées par votre compte Google. Aucun message n est envoyé sans votre validation manuelle.
              </span>
            </div>
          </div>
        )}

        {!needsPassword && !needsGoogleAuth && userEmail && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Connecté en tant que {userEmail}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500 border-t border-white/[0.07] pt-4">
          <span>Session chiffrée · Accès privé à vos données</span>
        </div>
      </div>
    </div>
  );
};
