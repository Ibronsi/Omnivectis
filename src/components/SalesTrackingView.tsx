import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Smartphone,
  Wallet,
  Calendar,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { RealSaleRecord, CountryCode, CurrencyCode } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';

interface SalesTrackingViewProps {
  countryCode: CountryCode;
}

export const SalesTrackingView: React.FC<SalesTrackingViewProps> = ({ countryCode }) => {
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;

  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [indicativeMonthlyTarget, setIndicativeMonthlyTarget] = useState<number>(
    countryCode === 'NER' ? 2500000 : 4000
  );

  // Form State
  const [clientName, setClientName] = useState<string>('');
  const [amount, setAmount] = useState<number>(countryCode === 'NER' ? 150000 : 500);
  const [currency, setCurrency] = useState<CurrencyCode>(currentProfile.currency);
  const [opportunityTitle, setOpportunityTitle] = useState<string>('Vente directe B2B');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'encaisse' | 'en_attente'>('encaisse');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    currentProfile.mobileMoney[0] || currentProfile.banks[0] || 'Airtel Money Niger'
  );
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (data?.sales) {
        setSales(data.sales);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    setCurrency(currentProfile.currency);
    setPaymentMethod(currentProfile.mobileMoney[0] || currentProfile.banks[0] || 'Mobile Money');
    setIndicativeMonthlyTarget(countryCode === 'NER' ? 2500000 : 4000);
  }, [countryCode]);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          amount,
          currency,
          opportunityTitle,
          date: saleDate,
          status,
          paymentMethod,
          reference: reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          notes,
        }),
      });
      const data = await res.json();
      if (data?.sale) {
        setSales((prev) => [data.sale, ...prev]);
        setIsAdding(false);
        // Reset form
        setClientName('');
        setReference('');
        setNotes('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Aggregated Statistics
  const totalReceived = useMemo(() => {
    return sales
      .filter((s) => s.status === 'encaisse')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }, [sales]);

  const totalPending = useMemo(() => {
    return sales
      .filter((s) => s.status === 'en_attente')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }, [sales]);

  const totalInvoiced = totalReceived + totalPending;

  const targetAchievementRate = indicativeMonthlyTarget > 0
    ? Math.round((totalReceived / indicativeMonthlyTarget) * 100)
    : 0;

  const recoveryRate = totalInvoiced > 0
    ? Math.round((totalReceived / totalInvoiced) * 100)
    : 100;

  // Breakdown by Payment Method
  const paymentBreakdownData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const key = s.paymentMethod || 'Autre';
      map[key] = (map[key] || 0) + Number(s.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Réalité Terrain · Enregistrement & Réconciliation des Ventes</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Module Encaissements Réels vs Prévisions
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            Saisissez vos encaissements réels (clients, montants, opérateurs Mobile Money ou banques du pays).
            L application compare vos chiffres effectifs aux projections sans aucune donnée inventée.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Fermer le formulaire' : 'Saisir une Vente Réelle'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Legal & Model Strip */}
      <div className="p-4 rounded-xl bg-[#11141C] border border-white/[0.08] text-xs text-slate-300 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-semibold text-white">Mention Méthodologique : </span>
          <span className="font-mono text-amber-400 font-medium mr-1.5">
            Estimation indicative
          </span>
          · Les prévisions et objectifs financiers sont des modélisations établies à partir d hypothèses d activité révisables.
          Seules les ventes enregistrées dans ce module constituent des données réelles certifiées.
        </p>
      </div>

      {/* Real Sales Input Form Collapsible */}
      {isAdding && (
        <form
          onSubmit={handleAddSale}
          className="p-6 rounded-xl bg-[#11141C] border border-emerald-500/30 space-y-4"
        >
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2 border-b border-white/[0.07] pb-3">
            <Plus className="w-4 h-4" />
            <span>Saisie d un Encaissement Réel</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Nom du Client / Société *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Entreprise Sahel SARL, Dr. Moussa"
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Montant Réel *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white font-mono font-semibold text-xs tabular-nums focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-xs font-mono font-semibold text-slate-400">{currency}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Statut d Encaissement</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'encaisse' | 'en_attente')}
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="encaisse">Encaissé (Fonds reçus)</option>
                <option value="en_attente">En attente de règlement (Facturé)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Moyen de Paiement Réel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                {currentProfile.mobileMoney.map((m) => (
                  <option key={m} value={m}>
                    {m} (Mobile Money)
                  </option>
                ))}
                {currentProfile.banks.map((b) => (
                  <option key={b} value={b}>
                    {b} (Virement bancaire)
                  </option>
                ))}
                {currentProfile.transferAgencies.map((t) => (
                  <option key={t} value={t}>
                    {t} (Transfert / Carte)
                  </option>
                ))}
                <option value="Espèces / Cash">Espèces / Règlement direct</option>
                <option value="Stripe / Carte Internationale">Stripe / Carte bancaire</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Date de l opération</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium block">Référence / Reçu</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: AIRTEL-TX-993821, FACT-2026-04"
                className="w-full px-3 py-2 bg-[#0D1017] border border-white/[0.1] rounded-lg text-white text-xs focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="cursor-pointer px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              Enregistrer l encaissement
            </button>
          </div>
        </form>
      )}

      {/* Unified KPI Hairline Ledger Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#11141C] border border-white/[0.08] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        {/* KPI 1: Real Received */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Encaissé Réel (Fonds reçus)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {totalReceived.toLocaleString('fr-FR')} {currentProfile.currency}
          </div>
          <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
            {sales.filter((s) => s.status === 'encaisse').length} transaction(s) certifiée(s)
          </span>
        </div>

        {/* KPI 2: Pending Receivables */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>En Attente de Règlement</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {totalPending.toLocaleString('fr-FR')} {currentProfile.currency}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Factures en cours de recouvrement
          </span>
        </div>

        {/* KPI 3: Target Objective (Editable) */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Objectif Mensuel</span>
            <span className="text-[10px] font-mono text-amber-400">
              Estimation indicative
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={indicativeMonthlyTarget}
              onChange={(e) => setIndicativeMonthlyTarget(Number(e.target.value))}
              className="w-full text-lg font-bold font-mono text-white bg-[#0D1017] border border-white/[0.1] rounded-lg px-2.5 py-1 tabular-nums focus:border-blue-500/60 focus:outline-none"
            />
            <span className="text-xs font-mono text-slate-400">{currentProfile.currency}</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            Hypothèse modifiable
          </span>
        </div>

        {/* KPI 4: Achievement Rate */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Taux de Réalisation</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 tabular-nums">
            {targetAchievementRate}%
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, targetAchievementRate)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
            Recouvrement : {recoveryRate}%
          </span>
        </div>
      </div>

      {/* Charts Zone: Real vs Projections & Payment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Visual Comparison */}
        <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Comparaison : Réel vs En attente vs Objectif</span>
            </div>
            <span className="text-[11px] font-mono text-amber-400">Estimation indicative</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Encaissé Réel', montant: totalReceived, fill: '#10B981' },
                  { name: 'En Attente', montant: totalPending, fill: '#F59E0B' },
                  { name: 'Objectif Indicatif', montant: indicativeMonthlyTarget, fill: '#3B82F6' },
                ]}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} ${currentProfile.currency}`, 'Montant']}
                  contentStyle={{ backgroundColor: '#0D1017', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="montant" radius={[5, 5, 0, 0]}>
                  <Cell fill="#10B981" />
                  <Cell fill="#F59E0B" />
                  <Cell fill="#3B82F6" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Rail Distribution */}
        <div className="p-6 rounded-xl bg-[#11141C] border border-white/[0.08] space-y-4">
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span>Répartition par Moyen d Encaissement Réel</span>
          </div>

          {paymentBreakdownData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Aucune vente enregistrée pour afficher la répartition.
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {paymentBreakdownData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} ${currentProfile.currency}`, 'Volume']}
                    contentStyle={{ backgroundColor: '#0D1017', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Real Sales Ledger Table (Single-Elevation Card) */}
      <div className="rounded-xl bg-[#11141C] border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Registre des Ventes Réelles Enregistrées ({sales.length})
          </span>
          <span className="text-[11px] font-mono text-slate-500">Persisté localement</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 bg-[#0D1017]">
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Client / Entreprise</th>
                <th className="py-2.5 px-4 font-semibold">Opportunité / Offre</th>
                <th className="py-2.5 px-4 font-semibold">Moyen de Paiement</th>
                <th className="py-2.5 px-4 font-semibold">Référence</th>
                <th className="py-2.5 px-4 font-semibold text-right">Montant</th>
                <th className="py-2.5 px-4 text-center font-semibold">Statut</th>
                <th className="py-2.5 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-sans">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Aucune vente enregistrée pour le moment. Cliquez sur « Saisir une Vente Réelle » ci-dessus pour ajouter votre premier encaissement.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap">{sale.date}</td>
                    <td className="py-2.5 px-4 font-semibold text-white">{sale.clientName}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{sale.opportunityTitle}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{sale.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{sale.reference || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-white tabular-nums whitespace-nowrap">
                      {sale.amount.toLocaleString('fr-FR')} {sale.currency}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          sale.status === 'encaisse' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {sale.status === 'encaisse' ? 'Encaissé' : 'En attente'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteSale(sale.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Supprimer la vente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
