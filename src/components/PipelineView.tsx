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
} from 'lucide-react';
import { PipelineItem, SectorCategory } from '../types/market';
import { ECONOMIC_SECTORS } from '../data/sectorsData';

interface PipelineViewProps {
  items: PipelineItem[];
  onUpdateItems: (items: PipelineItem[]) => void;
  onNavigateToBlueprint: (sectorId: SectorCategory, title: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  items,
  onUpdateItems,
  onNavigateToBlueprint,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSectorId, setNewSectorId] = useState<SectorCategory>('ai_deeptech');
  const [newTargetMrr, setNewTargetMrr] = useState<number>(5000);
  const [newNotes, setNewNotes] = useState<string>('');

  const stages: { key: PipelineItem['stage']; label: string; color: string }[] = [
    { key: 'discovery', label: '01. Découverte & Étude de Marché', color: 'border-white/[0.08]' },
    { key: 'validation', label: '02. Validation Commerciale', color: 'border-blue-500/30' },
    { key: 'building', label: '03. Lancement MVP & Automatisation', color: 'border-cyan-500/30' },
    { key: 'monetizing', label: '04. Encaissements & Cash Récurrent', color: 'border-emerald-500/30' },
  ];

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
      notes: newNotes.trim(),
      addedAt: new Date().toLocaleDateString('fr-FR'),
      checklists: [
        { text: 'Valider 10 entretiens avec des clients cibles', done: false },
        { text: 'Concevoir l offre irrésistible avec pricing clair', done: false },
        { text: 'Signer les 2 premiers contrats pilotes', done: false },
      ],
    };

    onUpdateItems([...items, newItem]);
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    onUpdateItems(items.filter((item) => item.id !== id));
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

  const totalTargetMrr = items.reduce((acc, curr) => acc + curr.targetMrr, 0);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-400">
            Exécution & Pilotage Opérationnel
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Mon Pipeline d Opportunités Multi-Secteurs
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Suivez l avancée de vos projets de revenus, de l étude de marché jusqu aux premiers encaissements
            récurrents. Vos opportunités sont sauvegardées automatiquement.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportJSON}
            className="cursor-pointer px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#11141C] hover:bg-white/[0.05] border border-white/[0.08] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Opportunité</span>
          </button>
        </div>
      </div>

      {/* Unified Pipeline KPI Ledger Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#11141C] border border-white/[0.08] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        <div className="p-4">
          <span className="text-xs text-slate-400 block">Opportunités Actives</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block tabular-nums">
            {items.length}
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-slate-400 block">Objectif de Revenu Global</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block tabular-nums">
            {totalTargetMrr.toLocaleString()} € / mois
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-slate-400 block">Potentiel Annuel Cumulé</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block tabular-nums">
            {(totalTargetMrr * 12).toLocaleString()} € / an
          </span>
        </div>

        <div className="p-4">
          <span className="text-xs text-slate-400 block">Phase de Monétisation</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block tabular-nums">
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
              className={`bg-[#11141C] border ${st.color} rounded-xl p-4 flex flex-col min-h-[460px] space-y-4`}
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-xs font-semibold text-white">
                  {st.label}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400 tabular-nums">
                  {stageItems.length}
                </span>
              </div>

              {stageItems.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs border border-dashed border-white/[0.08] rounded-lg">
                  <span>Aucun projet à cette étape</span>
                </div>
              )}

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-[#0D1017] border border-white/[0.08] rounded-lg space-y-3 hover:border-white/[0.16] transition-colors"
                  >
                    <div>
                      <div className="text-[11px] text-blue-400 font-medium">
                        {item.sectorName}
                      </div>
                      <h4 className="font-display text-sm font-semibold text-white mt-0.5">
                        {item.title}
                      </h4>
                      {item.notes && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono border-t border-white/[0.06] pt-2 text-slate-300 tabular-nums">
                      <span className="text-slate-500">Cible :</span>
                      <span className="text-emerald-400 font-semibold">
                        {item.targetMrr.toLocaleString()} € / mois
                      </span>
                    </div>

                    {/* Checklists */}
                    <div className="space-y-1.5 pt-1">
                      {item.checklists.map((check, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleToggleChecklist(item.id, cIdx)}
                          className="cursor-pointer flex items-start gap-2 text-[11px] text-slate-300 hover:text-white text-left w-full"
                        >
                          {check.done ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          <span className={check.done ? 'line-through text-slate-500' : ''}>
                            {check.text}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Actions on Item */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="cursor-pointer text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Supprimer l opportunité"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateToBlueprint(item.sectorId, item.title)}
                          className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300"
                        >
                          Plan IA
                        </button>
                        {st.key !== 'monetizing' && (
                          <button
                            onClick={() => handleMoveStage(item.id, 'next')}
                            className="cursor-pointer px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-slate-200 rounded flex items-center gap-1 transition-colors"
                          >
                            <span>Avancer</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090B10]/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#11141C] border border-white/[0.1] rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-white">Ajouter une Opportunité au Pipeline</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Titre ou Nom du Projet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Micro-SaaS d audit CSRD pour PME"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Secteur Économique</label>
                <select
                  value={newSectorId}
                  onChange={(e) => setNewSectorId(e.target.value as SectorCategory)}
                  className="w-full p-2.5 bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg focus:outline-none focus:border-blue-500/60 cursor-pointer"
                >
                  {ECONOMIC_SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Objectif de Revenu Mensuel (€)</label>
                <input
                  type="number"
                  min="500"
                  max="200000"
                  step="500"
                  value={newTargetMrr}
                  onChange={(e) => setNewTargetMrr(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg focus:outline-none focus:border-blue-500/60 font-mono tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Notes & Stratégie Initiale</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cibler les experts-comptables de ma région d abord..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#0D1017] border border-white/[0.1] text-xs text-white rounded-lg focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cursor-pointer px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
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
