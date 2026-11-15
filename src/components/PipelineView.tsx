import React, { useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  DollarSign,
  Download,
  Upload,
  Layers,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { CountryCode, LiveFxRates, PipelineItem, SectorCategory } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';
import { GEO_PROFILES } from '../data/geoProfiles';
import { convertCurrency } from '../utils/currency';

interface PipelineViewProps {
  items: PipelineItem[];
  onUpdateItems: (items: PipelineItem[]) => void;
  onNavigateToBlueprint: (sectorId: SectorCategory, title: string) => void;
  countryCode?: CountryCode;
  liveRates?: LiveFxRates | null;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  items,
  onUpdateItems,
  onNavigateToBlueprint,
  countryCode = 'NER',
  liveRates,
}) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const activeCurrency = currentProfile.currency;
  const currencySymbol = currentProfile.currencySymbol;

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSectorId, setNewSectorId] = useState<SectorCategory>('ai_deeptech');
  const [newTargetMrr, setNewTargetMrr] = useState<number>(activeCurrency === 'XOF' ? 1500000 : 5000);
  const [newNotes, setNewNotes] = useState<string>('');

  // Inline card edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTargetMrr, setEditTargetMrr] = useState<number>(0);
  const [editCurrentMrr, setEditCurrentMrr] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  const stages: { key: PipelineItem['stage']; label: string; color: string }[] = [
    { key: 'discovery', label: '01. Découverte & Étude de Marché', color: 'border-stone-200/90 dark:border-white/[0.08]' },
    { key: 'validation', label: '02. Validation Commerciale', color: 'border-blue-200 dark:border-blue-500/30' },
    { key: 'building', label: '03. Lancement MVP & Automatisation', color: 'border-teal-200 dark:border-teal-500/30' },
    { key: 'monetizing', label: '04. Encaissements & Cash Récurrent', color: 'border-emerald-200 dark:border-emerald-500/30' },
  ];

  const toActiveCurrency = (amount: number, itemCurrency?: string) => {
    return convertCurrency(Number(amount || 0), (itemCurrency as any) || 'EUR', activeCurrency, liveRates);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sectorObj = ECONOMIC_SECTORS.find((s) => s.id === newSectorId) || ECONOMIC_SECTORS[0];

    const newItem: PipelineItem = {
      id: `pipe-${Date.now()}`,
      title: newTitle.trim(),
      sectorId: newSectorId,
      sectorName: sectorObj.name,
      stage: 'discovery',
      targetMrr: newTargetMrr,
      currentMrr: 0,
      countryCode,
      currency: activeCurrency,
      notes: newNotes.trim(),
      addedAt: new Date().toLocaleDateString('fr-FR'),
      checklists: [
        { text: 'Valider 10 entretiens avec des clients cibles', done: false },
        { text: "Concevoir l'offre irrésistible avec pricing clair", done: false },
        { text: 'Signer les 2 premiers contrats pilotes', done: false },
      ],
    };

    onUpdateItems([...items, newItem]);
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleStartEdit = (item: PipelineItem) => {
    setEditingId(item.id);
    setEditTargetMrr(toActiveCurrency(item.targetMrr, item.currency));
    setEditCurrentMrr(toActiveCurrency(item.currentMrr, item.currency));
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              targetMrr: Number(editTargetMrr) || 0,
              currentMrr: Number(editCurrentMrr) || 0,
              currency: activeCurrency,
              countryCode,
              notes: editNotes.trim(),
            }
          : item
      )
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleMoveStage = (id: string, direction: 'next' | 'prev') => {
    const stageOrder: PipelineItem['stage'][] = ['discovery', 'validation', 'building', 'monetizing'];
    onUpdateItems(
      items.map((item) => {
        if (item.id === id) {
          const currentIndex = stageOrder.indexOf(item.stage);
          const nextIndex = direction === 'next' ? Math.min(3, currentIndex + 1) : Math.max(0, currentIndex - 1);
          return { ...item, stage: stageOrder[nextIndex] };
        }
        return item;
      })
    );
  };

  const handleToggleChecklist = (itemId: string, checkIdx: number) => {
    onUpdateItems(
      items.map((item) => {
        if (item.id === itemId) {
          const updated = [...item.checklists];
          updated[checkIdx].done = !updated[checkIdx].done;
          return { ...item, checklists: updated };
        }
        return item;
      })
    );
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnivectis-pipeline-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTargetMrr = items.reduce((acc, curr) => acc + toActiveCurrency(curr.targetMrr, curr.currency), 0);
  const totalCurrentMrr = items.reduce((acc, curr) => acc + toActiveCurrency(curr.currentMrr, curr.currency), 0);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            Exécution & Pilotage Opérationnel
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Mon Pipeline d'Opportunités Multi-Secteurs
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Suivez l'avancée de vos projets de revenus, de l'étude de marché jusqu'aux premiers encaissements
            récurrents. Vos opportunités sont sauvegardées automatiquement.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportJSON}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-50 dark:hover:bg-white/[0.06] border border-stone-200 dark:border-white/[0.1] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Opportunité</span>
          </button>
        </div>
      </div>

      {/* Unified Pipeline KPI Ledger Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07]">
        <div className="p-4">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Opportunités Actives</span>
          <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1 block tabular-nums">
            {items.length}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Objectif Mensuel Global</span>
          <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 block tabular-nums">
            {totalTargetMrr.toLocaleString('fr-FR')} {currencySymbol} / mois
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Revenu Actuel Déclaré</span>
          <span className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1 block tabular-nums">
            {totalCurrentMrr.toLocaleString('fr-FR')} {currencySymbol} / mois
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-stone-500 dark:text-stone-400 block">Phase de Monétisation</span>
          <span className="text-2xl font-bold font-mono text-teal-700 dark:text-teal-400 mt-1 block tabular-nums">
            {items.filter((i) => i.stage === 'monetizing').length} en cours
          </span>
        </div>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {stages.map((st) => {
          const stageItems = items.filter((i) => i.stage === st.key);
          return (
            <div
              key={st.key}
              className={`bg-white dark:bg-[#141720] border ${st.color} rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] p-4 flex flex-col min-h-[460px] space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
                <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                  {st.label}
                </span>
                <span className="text-xs font-mono font-semibold text-stone-500 dark:text-stone-400 tabular-nums">
                  {stageItems.length}
                </span>
              </div>

              {stageItems.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-stone-500 dark:text-stone-400 text-xs border border-dashed border-stone-200 dark:border-white/[0.1] bg-[#F6F4EF]/60 dark:bg-[#0D1017]/60 rounded-xl">
                  <span>Aucun projet à cette étape</span>
                </div>
              )}

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageItems.map((item) => {
                  const isEditing = editingId === item.id;
                  const displayTarget = toActiveCurrency(item.targetMrr, item.currency);
                  const displayCurrent = toActiveCurrency(item.currentMrr, item.currency);

                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08] rounded-xl space-y-3 hover:border-stone-300 dark:hover:border-white/[0.16] transition-colors"
                    >
                      <div>
                        <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                          {item.sectorName}
                        </div>
                        <h4 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                          {item.title}
                        </h4>
                        {!isEditing && item.notes && (
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2.5 pt-2 border-t border-stone-200/80 dark:border-white/[0.08]">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
                                Cible ({currencySymbol}/m)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editTargetMrr}
                                onChange={(e) => setEditTargetMrr(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] rounded-lg text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
                                Actuel ({currencySymbol}/m)
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editCurrentMrr}
                                onChange={(e) => setEditCurrentMrr(Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] rounded-lg text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-500 dark:text-stone-400 block mb-0.5">
                              Notes
                            </label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="cursor-pointer px-2 py-1 text-[11px] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Annuler</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.id)}
                              className="cursor-pointer px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Valider</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 border-t border-stone-200/80 dark:border-white/[0.08] pt-2 text-xs font-mono tabular-nums">
                          <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                            <span className="text-stone-500 dark:text-stone-400">Cible :</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {displayTarget.toLocaleString('fr-FR')} {currencySymbol} / mois
                            </span>
                          </div>
                          {displayCurrent > 0 && (
                            <div className="flex items-center justify-between text-stone-700 dark:text-stone-300 text-[11px]">
                              <span className="text-stone-500 dark:text-stone-400">Actuel :</span>
                              <span className="text-blue-700 dark:text-blue-400 font-semibold">
                                {displayCurrent.toLocaleString('fr-FR')} {currencySymbol} / mois
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checklists */}
                      <div className="space-y-1.5 pt-1">
                        {item.checklists.map((check, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => handleToggleChecklist(item.id, cIdx)}
                            className="cursor-pointer flex items-start gap-2 text-[11px] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 text-left w-full"
                          >
                            {check.done ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                            )}
                            <span className={check.done ? 'line-through text-stone-400 dark:text-stone-500' : ''}>
                              {check.text}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Actions on Item */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/80 dark:border-white/[0.08] text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="cursor-pointer text-stone-400 dark:text-stone-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 transition-colors"
                            title="Supprimer l'opportunité"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => (isEditing ? setEditingId(null) : handleStartEdit(item))}
                            className="cursor-pointer text-stone-400 dark:text-stone-500 hover:text-blue-700 dark:hover:text-blue-400 p-1 transition-colors"
                            title="Modifier objectif, revenu actuel ou notes"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigateToBlueprint(item.sectorId, item.title)}
                            className="cursor-pointer text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            Plan IA
                          </button>
                          {st.key !== 'monetizing' && (
                            <button
                              onClick={() => handleMoveStage(item.id, 'next')}
                              className="cursor-pointer px-2.5 py-1 bg-white dark:bg-white/[0.06] hover:bg-stone-50 dark:hover:bg-white/[0.12] border border-stone-200 dark:border-white/[0.1] text-[11px] font-medium text-stone-700 dark:text-stone-200 rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <span>Avancer</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#141720] border border-stone-200 dark:border-white/[0.1] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-100">Ajouter une Opportunité au Pipeline</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Titre ou Nom du Projet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Micro-SaaS d'audit CSRD pour PME"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Secteur Économique</label>
                <select
                  value={newSectorId}
                  onChange={(e) => setNewSectorId(e.target.value as SectorCategory)}
                  className="w-full p-2.5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] text-xs text-stone-900 dark:text-stone-100 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500 cursor-pointer"
                >
                  {ECONOMIC_SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Objectif de Revenu Mensuel ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step={activeCurrency === 'XOF' ? '50000' : '500'}
                  value={newTargetMrr}
                  onChange={(e) => setNewTargetMrr(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] text-xs text-stone-900 dark:text-stone-100 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500 font-mono tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Notes & Stratégie Initiale</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cibler les experts-comptables de ma région d'abord..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
