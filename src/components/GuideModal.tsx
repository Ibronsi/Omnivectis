import React from 'react';
import {
  X,
  BookOpen,
  Radio,
  Sparkles,
  FileText,
  ShieldCheck,
  DollarSign,
  Sliders,
  BookmarkCheck,
  Compass,
  ArrowLeftRight,
  Rocket,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

interface ModuleGuideItem {
  id: ActiveTab;
  title: string;
  summary: string;
  icon: React.ReactNode;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  if (!isOpen) return null;

  const workflowSteps = [
    {
      step: '01',
      title: 'Détecter les signaux du marché',
      desc: 'Collectez les actualités et évolutions réelles (RSS vérifiés et veille marché) dans Radar & Signaux.',
      tab: 'radar' as ActiveTab,
    },
    {
      step: '02',
      title: 'Générer l’opportunité & le dossier',
      desc: 'Transformez les signaux en opportunités sourcées, puis générez un dossier numérique ou physique prêt à exécuter.',
      tab: 'opportunities' as ActiveTab,
    },
    {
      step: '03',
      title: 'Valider avant envoi réel',
      desc: 'Relisez et approuvez chaque message ou email dans À Valider & Journal avant toute expédition externe.',
      tab: 'validation' as ActiveTab,
    },
    {
      step: '04',
      title: 'Facturer & suivre les encaissements',
      desc: 'Configurez vos vraies coordonnées (RIB, Mobile Money, lien réel) dans Circuit de Lancement et suivez vos ventes.',
      tab: 'sales' as ActiveTab,
    },
  ];

  const modules: ModuleGuideItem[] = [
    {
      id: 'dashboard',
      title: 'Synthèse',
      summary: 'Vue d’ensemble des flux, taux de change en direct et raccourcis d’exécution.',
      icon: <LayoutDashboard className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
    },
    {
      id: 'radar',
      title: 'Radar & Signaux',
      summary: 'Agrégation de flux réels avec sources vérifiables et état des connecteurs.',
      icon: <Radio className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
    },
    {
      id: 'opportunities',
      title: 'Opportunités',
      summary: 'Synthèse d’offres adaptées au pays et passage vers les dossiers ou le pipeline.',
      icon: <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
    },
    {
      id: 'kits',
      title: 'Dossiers & Plans',
      summary: 'Plans numériques et plans d’exploitation physique (fournisseurs, marges, autorisations).',
      icon: <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />,
    },
    {
      id: 'blueprint',
      title: 'Plan Stratégique',
      summary: 'Feuille de route 30-60-90 jours, mécanique de revenus et stratégie d’acquisition.',
      icon: <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
    },
    {
      id: 'arbitrage',
      title: 'Matrice d’Arbitrage',
      summary: 'Croisement de deux secteurs pour créer des offres différenciantes à forte marge.',
      icon: <ArrowLeftRight className="w-4 h-4 text-blue-700 dark:text-blue-400" />,
    },
    {
      id: 'launchpad',
      title: 'Circuit de Lancement',
      summary: '6 engrenages de monétisation : offre, prospection, contrat, landing, livraison et encaissement.',
      icon: <Rocket className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
    },
    {
      id: 'validation',
      title: 'À Valider & Journal',
      summary: 'File d’approbation humaine, envoi réel (e-mail/WhatsApp/webhook) et journal d’audit.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
    },
    {
      id: 'sales',
      title: 'Encaissements Réels',
      summary: 'Registre des ventes (encaissement, modification, filtres et export comptable CSV).',
      icon: <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
    },
    {
      id: 'simulator',
      title: 'Simulateur',
      summary: 'Modélisation indicative des coûts, fiscalité locale et point mort financier.',
      icon: <Sliders className="w-4 h-4 text-blue-700 dark:text-blue-400" />,
    },
    {
      id: 'pipeline',
      title: 'Pipeline',
      summary: 'Suivi opérationnel des projets par étape avec checklists de lancement.',
      icon: <BookmarkCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
    },
  ];

  const handleGo = (tab: ActiveTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/55 dark:bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#F8F7F4] dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#11141C] border-b border-stone-200/80 dark:border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h2
                id="guide-modal-title"
                className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100"
              >
                Guide Rapide OmniVectis
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Parcours opérationnel complet, de la détection d’opportunité jusqu’à l’encaissement réel.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors"
            aria-label="Fermer le guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 4-step workflow */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Méthode Recommandée en 4 Étapes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workflowSteps.map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => handleGo(s.tab)}
                  className="cursor-pointer text-left p-4 rounded-xl bg-white dark:bg-[#0D1017] border border-stone-200/90 dark:border-white/[0.08] hover:border-amber-400 dark:hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-2 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        ÉTAPE {s.step}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {s.title}
                    </div>
                    <p className="text-[11.5px] text-stone-600 dark:text-stone-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* All 11 modules directory */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Modules Disponibles (cliquez pour ouvrir)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleGo(mod.id)}
                  className="cursor-pointer text-left p-3.5 rounded-xl bg-white dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.18] transition-colors flex items-start gap-3"
                >
                  <div className="mt-0.5 shrink-0">{mod.icon}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {mod.title}
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-snug">
                      {mod.summary}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rules & Tips */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-500/25 space-y-2">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Bonnes Pratiques & Garanties de Fiabilité</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-stone-700 dark:text-stone-300">
              <li>• Vos coordonnées entreprise (RIB, NIF, Mobile Money, lien réel) sont sauvegardées en base de données dans le Circuit de Lancement.</li>
              <li>• Aucun lien de paiement factice n’est généré : collez uniquement votre vrai lien prestataire ou numéro marchand.</li>
              <li>• Aucun e-mail ou message client n’est envoyé automatiquement sans votre approbation explicite dans À Valider & Journal.</li>
              <li>• Utilisez l’export CSV dans Encaissements Réels pour votre comptabilité Excel et changez de thème (Clair / Sombre) à tout moment en haut.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white dark:bg-[#11141C] border-t border-stone-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Données isolées par compte utilisateur et synchronisées en temps réel.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
