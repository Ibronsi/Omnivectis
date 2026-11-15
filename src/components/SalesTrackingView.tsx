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
  Search,
  Download,
  Pencil,
  Check,
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
import { RealSaleRecord, CountryCode, CurrencyCode, LiveFxRates } from '../types/market';
import { GEO_PROFILES } from '../data/geoProfiles';
import { convertCurrency, getEffectiveFxRateToEur } from '../utils/currency';
import { subscribeLiveEvent } from '../utils/liveStream';
import { useTheme } from '../hooks/useTheme';

interface SalesTrackingViewProps {
  countryCode: CountryCode;
  liveRates?: LiveFxRates | null;
}

export const SalesTrackingView: React.FC<SalesTrackingViewProps> = ({ countryCode, liveRates }) => {
  const { isDark } = useTheme();
  const currentProfile = GEO_PROFILES[countryCode] || GEO_PROFILES.NER;
  const fxInfo = getEffectiveFxRateToEur(currentProfile.currency, liveRates);

  const [sales, setSales] = useState<RealSaleRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'encaisse' | 'en_attente'>('all');
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

  const resetForm = () => {
    setEditingSaleId(null);
    setClientName('');
    setAmount(countryCode === 'NER' || countryCode === 'SEN' || countryCode === 'CIV' ? 150000 : 500);
    setCurrency(currentProfile.currency);
    setOpportunityTitle('Vente directe B2B');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setStatus('encaisse');
    setPaymentMethod(currentProfile.mobileMoney[0] || currentProfile.banks[0] || 'Mobile Money');
    setReference('');
    setNotes('');
  };

  const fetchSales = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      if (data?.sales) {
        setSales(data.sales);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de charger les encaissements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    setCurrency(currentProfile.currency);
    setPaymentMethod(currentProfile.mobileMoney[0] || currentProfile.banks[0] || 'Mobile Money');
    setIndicativeMonthlyTarget(countryCode === 'NER' || countryCode === 'SEN' || countryCode === 'CIV' ? 2500000 : 4000);
  }, [countryCode]);

  useEffect(() => {
    const unsub = subscribeLiveEvent<{ sales?: RealSaleRecord[] }>('sales_updated', (payload) => {
      if (Array.isArray(payload?.sales)) {
        setSales(payload.sales);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;
    setErrorMsg(null);

    try {
      if (editingSaleId) {
        setUpdatingId(editingSaleId);
        const res = await fetch(`/api/sales/${editingSaleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName,
            amount,
            currency,
            opportunityTitle,
            date: saleDate,
            status,
            paymentMethod,
            reference,
            notes,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
        }
        if (data?.sale) {
          setSales((prev) => prev.map((s) => (s.id === data.sale.id ? data.sale : s)));
          setIsAdding(false);
          resetForm();
        }
      } else {
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
        if (!res.ok) {
          throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
        }
        if (data?.sale) {
          setSales((prev) => [data.sale, ...prev.filter((s) => s.id !== data.sale.id)]);
          setIsAdding(false);
          resetForm();
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Erreur lors de l’enregistrement de la vente.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartEdit = (sale: RealSaleRecord) => {
    setEditingSaleId(sale.id);
    setClientName(sale.clientName);
    setAmount(sale.amount);
    setCurrency(sale.currency);
    setOpportunityTitle(sale.opportunityTitle);
    setSaleDate(sale.date);
    setStatus(sale.status === 'en_attente' ? 'en_attente' : 'encaisse');
    setPaymentMethod(sale.paymentMethod);
    setReference(sale.reference || '');
    setNotes(sale.notes || '');
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkAsPaid = async (sale: RealSaleRecord) => {
    setErrorMsg(null);
    setUpdatingId(sale.id);
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'encaisse' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erreur serveur HTTP ${res.status}`);
      }
      if (data?.sale) {
        setSales((prev) => prev.map((s) => (s.id === data.sale.id ? data.sale : s)));
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de confirmer l’encaissement.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSale = async (id: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || data?.status === 'error') {
        throw new Error(data?.error || `Erreur suppression HTTP ${res.status}`);
      }
      setSales((prev) => prev.filter((s) => s.id !== id));
      if (editingSaleId === id) {
        setIsAdding(false);
        resetForm();
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de supprimer cette écriture.');
    }
  };

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.clientName.toLowerCase().includes(q) ||
        s.opportunityTitle.toLowerCase().includes(q) ||
        (s.reference || '').toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
      );
    });
  }, [sales, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    const escapeCell = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };
    const headers = [
      'Date',
      'Client / Entreprise',
      'Opportunité / Offre',
      'Moyen de paiement',
      'Référence',
      'Montant',
      'Devise',
      'Statut',
      'Notes',
    ];
    const rows = filteredSales.map((s) => [
      escapeCell(s.date),
      escapeCell(s.clientName),
      escapeCell(s.opportunityTitle),
      escapeCell(s.paymentMethod),
      escapeCell(s.reference || ''),
      escapeCell(s.amount),
      escapeCell(s.currency),
      escapeCell(s.status === 'encaisse' ? 'Encaissé' : 'En attente'),
      escapeCell(s.notes || ''),
    ]);
    const csvContent = '\uFEFF' + [headers.map(escapeCell).join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `omnivectis_encaissements_${countryCode}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Aggregated Statistics (normalized into active country currency via live FX)
  const totalReceived = useMemo(() => {
    return sales
      .filter((s) => s.status === 'encaisse')
      .reduce(
        (sum, s) =>
          sum + convertCurrency(Number(s.amount || 0), s.currency || 'XOF', currentProfile.currency, liveRates),
        0
      );
  }, [sales, currentProfile.currency, liveRates]);

  const totalPending = useMemo(() => {
    return sales
      .filter((s) => s.status === 'en_attente')
      .reduce(
        (sum, s) =>
          sum + convertCurrency(Number(s.amount || 0), s.currency || 'XOF', currentProfile.currency, liveRates),
        0
      );
  }, [sales, currentProfile.currency, liveRates]);

  const totalInvoiced = totalReceived + totalPending;

  const targetAchievementRate = indicativeMonthlyTarget > 0
    ? Math.round((totalReceived / indicativeMonthlyTarget) * 100)
    : 0;

  const recoveryRate = totalInvoiced > 0
    ? Math.round((totalReceived / totalInvoiced) * 100)
    : 100;

  // Breakdown by Payment Method (converted via live FX)
  const paymentBreakdownData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const key = s.paymentMethod || 'Autre';
      const converted = convertCurrency(
        Number(s.amount || 0),
        s.currency || 'XOF',
        currentProfile.currency,
        liveRates
      );
      map[key] = (map[key] || 0) + converted;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales, currentProfile.currency, liveRates]);

  const COLORS = ['#047857', '#1D4ED8', '#B45309', '#0F766E', '#BE185D', '#6D28D9'];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Réalité Terrain · Enregistrement & Réconciliation des Ventes</span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Module Encaissements Réels vs Prévisions
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
            Saisissez vos encaissements réels (clients, montants, opérateurs Mobile Money ou banques du pays).
            L'application compare vos chiffres effectifs aux projections sans aucune donnée inventée.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredSales.length === 0}
            className="cursor-pointer px-3.5 py-2.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-[#141720] hover:bg-stone-100 dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            title="Exporter le registre en fichier CSV compatible Excel"
          >
            <Download className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                resetForm();
              } else {
                resetForm();
                setIsAdding(true);
              }
            }}
            className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Fermer le formulaire' : 'Saisir une Vente Réelle'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mandatory Legal & Model Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(28,25,23,0.04)] text-xs text-stone-700 dark:text-stone-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-stone-900 dark:text-stone-100">Mention Méthodologique : </span>
            <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold mr-1.5">
              Estimation indicative
            </span>
            · Les prévisions et objectifs sont des modélisations. Seules les ventes enregistrées ici constituent des encaissements réels.
          </p>
        </div>
        <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 shrink-0 tabular-nums">
          FX {fxInfo.status === 'live' ? 'live' : fxInfo.status === 'cache' ? 'cache' : 'secours'} : 1 EUR ={' '}
          {(liveRates?.XOF || 655.957).toFixed(2)} XOF · {(liveRates?.USD || 1.08).toFixed(4)} USD
        </span>
      </div>

      {/* Real Sales Input / Edit Form Collapsible */}
      {isAdding && (
        <form
          onSubmit={handleSaveSale}
          className="p-6 rounded-2xl bg-white dark:bg-[#141720] border border-emerald-200 dark:border-emerald-500/30 shadow-sm space-y-4"
        >
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center justify-between gap-2 border-b border-stone-200/80 dark:border-white/[0.08] pb-3">
            <span className="flex items-center gap-2">
              {editingSaleId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingSaleId ? 'Modifier une Écriture de Vente' : 'Saisie d\'un Encaissement Réel'}</span>
            </span>
            {editingSaleId && (
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Modification en cours
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Nom du Client / Société *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Entreprise Sahel SARL, Dr. Moussa"
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Montant Réel & Devise *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 font-mono font-semibold text-xs tabular-nums focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="px-2.5 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 font-mono font-semibold text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="XOF">XOF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Statut d'Encaissement</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'encaisse' | 'en_attente')}
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="encaisse">Encaissé (Fonds reçus)</option>
                <option value="en_attente">En attente de règlement (Facturé)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Moyen de Paiement Réel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none cursor-pointer"
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
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Date de l'opération</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 text-xs font-mono focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Référence / Reçu</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: AIRTEL-TX-993821, FACT-2026-04"
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Opportunité / Offre Facturée</label>
              <input
                type="text"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                placeholder="Ex: Agent IA Conformité, Installation Solaire..."
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-stone-600 dark:text-stone-400 font-medium block">Notes internes (optionnel)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Acompte 50% reçu, solde à la livraison"
                className="w-full px-3 py-2 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 text-xs focus:bg-white dark:focus:bg-[#161A24] focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetForm();
              }}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updatingId !== null}
              className="cursor-pointer px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 rounded-xl transition-colors shadow-xs"
            >
              {editingSaleId ? 'Enregistrer les modifications' : 'Enregistrer l\'encaissement'}
            </button>
          </div>
        </form>
      )}

      {/* Unified KPI Hairline Ledger Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] rounded-2xl shadow-[0_1px_3px_rgba(28,25,23,0.04)] divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80 dark:divide-white/[0.07]">
        {/* KPI 1: Real Received */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs">
            <span className="font-medium">Encaissé Réel (Fonds reçus)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            {totalReceived.toLocaleString('fr-FR')} {currentProfile.currency}
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-mono tabular-nums">
            {sales.filter((s) => s.status === 'encaisse').length} transaction(s) certifiée(s)
          </span>
        </div>

        {/* KPI 2: Pending Receivables */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs">
            <span className="font-medium">En Attente de Règlement</span>
            <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
            {totalPending.toLocaleString('fr-FR')} {currentProfile.currency}
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
            Factures en cours de recouvrement
          </span>
        </div>

        {/* KPI 3: Target Objective (Editable) */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs">
            <span className="font-medium">Objectif Mensuel</span>
            <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400">
              Estimation indicative
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={indicativeMonthlyTarget}
              onChange={(e) => setIndicativeMonthlyTarget(Number(e.target.value))}
              className="w-full text-lg font-bold font-mono text-stone-900 dark:text-stone-100 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.1] rounded-xl px-2.5 py-1 tabular-nums focus:bg-white dark:focus:bg-[#161A24] focus:border-blue-600 dark:focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs font-mono text-stone-600 dark:text-stone-400">{currentProfile.currency}</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
            Hypothèse modifiable
          </span>
        </div>

        {/* KPI 4: Achievement Rate */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs">
            <span className="font-medium">Taux de Réalisation</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
            {targetAchievementRate}%
          </div>
          <div className="w-full bg-stone-200 dark:bg-white/[0.1] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-700 dark:bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, targetAchievementRate)}%` }}
            />
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-mono tabular-nums">
            Recouvrement : {recoveryRate}%
          </span>
        </div>
      </div>

      {/* Charts Zone: Real vs Projections & Payment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Visual Comparison */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(28,25,23,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Comparaison : Réel vs En attente vs Objectif</span>
            </div>
            <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-400">Estimation indicative</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Encaissé Réel', montant: totalReceived, fill: isDark ? '#10B981' : '#047857' },
                  { name: 'En Attente', montant: totalPending, fill: isDark ? '#F59E0B' : '#B45309' },
                  { name: 'Objectif Indicatif', montant: indicativeMonthlyTarget, fill: isDark ? '#3B82F6' : '#1D4ED8' },
                ]}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? '#D6D3D1' : '#57534E', fontSize: 11 }}
                  axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : '#E7E5E4' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: isDark ? '#A8A29E' : '#78716C', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} ${currentProfile.currency}`, 'Montant']}
                  contentStyle={{
                    backgroundColor: isDark ? '#141720' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E7E5E4',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#F5F5F4' : '#1C1917',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                  }}
                />
                <Bar dataKey="montant" radius={[5, 5, 0, 0]}>
                  <Cell fill={isDark ? '#10B981' : '#047857'} />
                  <Cell fill={isDark ? '#F59E0B' : '#B45309'} />
                  <Cell fill={isDark ? '#3B82F6' : '#1D4ED8'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Rail Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(28,25,23,0.04)] space-y-4">
          <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Répartition par Moyen d'Encaissement Réel</span>
          </div>

          {paymentBreakdownData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-500 dark:text-stone-400">
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
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke={isDark ? '#141720' : '#FFFFFF'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} ${currentProfile.currency}`, 'Volume']}
                    contentStyle={{
                      backgroundColor: isDark ? '#141720' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E7E5E4',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#F5F5F4' : '#1C1917',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Real Sales Ledger Table (Single-Elevation Card) */}
      <div className="rounded-2xl bg-white dark:bg-[#141720] border border-stone-200/90 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(28,25,23,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200/80 dark:border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Registre des Ventes Réelles Enregistrées ({filteredSales.length}
              {filteredSales.length !== sales.length ? ` / ${sales.length}` : ''})
            </span>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 hidden sm:inline">
              · Base synchronisée
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher client, offre, réf..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F6F4EF] dark:bg-[#0D1017] border border-stone-200 dark:border-white/[0.08] rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500"
              />
            </div>

            {/* Status filter segmented control */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-[#EFECE6] dark:bg-[#0D1017] border border-stone-200/80 dark:border-white/[0.08]">
              {(
                [
                  { id: 'all', label: 'Tous' },
                  { id: 'encaisse', label: 'Encaissés' },
                  { id: 'en_attente', label: 'En attente' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    statusFilter === opt.id
                      ? 'bg-white dark:bg-white/[0.12] text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/[0.08] text-stone-600 dark:text-stone-400 bg-[#F6F4EF] dark:bg-[#0D1017]">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Client / Entreprise</th>
                <th className="py-3 px-4 font-semibold">Opportunité / Offre</th>
                <th className="py-3 px-4 font-semibold">Moyen de Paiement</th>
                <th className="py-3 px-4 font-semibold">Référence</th>
                <th className="py-3 px-4 font-semibold text-right">Montant</th>
                <th className="py-3 px-4 text-center font-semibold">Statut</th>
                <th className="py-3 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 dark:divide-white/[0.06] font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500 dark:text-stone-400">
                    Chargement des encaissements...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500 dark:text-stone-400">
                    {sales.length === 0
                      ? 'Aucune vente enregistrée pour le moment. Cliquez sur « Saisir une Vente Réelle » ci-dessus pour ajouter votre premier encaissement.'
                      : 'Aucune vente ne correspond à votre filtre actuel.'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-stone-50/70 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4 text-stone-500 dark:text-stone-400 font-mono text-[11px] tabular-nums whitespace-nowrap">{sale.date}</td>
                    <td className="py-2.5 px-4 font-semibold text-stone-900 dark:text-stone-100">
                      <div>{sale.clientName}</div>
                      {sale.notes && (
                        <div className="text-[11px] font-normal text-stone-500 dark:text-stone-400 truncate max-w-[200px]">
                          {sale.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-stone-700 dark:text-stone-300 text-xs">{sale.opportunityTitle}</td>
                    <td className="py-2.5 px-4 text-stone-700 dark:text-stone-300">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                        <span>{sale.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-stone-500 dark:text-stone-400">{sale.reference || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-stone-900 dark:text-stone-100 tabular-nums whitespace-nowrap">
                      <div>{sale.amount.toLocaleString('fr-FR')} {sale.currency}</div>
                      {sale.currency !== currentProfile.currency && (
                        <div className="text-[10px] font-normal text-stone-500 dark:text-stone-400">
                          ≈ {convertCurrency(sale.amount, sale.currency, currentProfile.currency, liveRates).toLocaleString('fr-FR')} {currentProfile.currency}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          sale.status === 'encaisse' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {sale.status === 'encaisse' ? 'Encaissé' : 'En attente'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {sale.status === 'en_attente' && (
                          <button
                            type="button"
                            disabled={updatingId === sale.id}
                            onClick={() => handleMarkAsPaid(sale)}
                            className="cursor-pointer px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            title="Confirmer la réception des fonds"
                          >
                            <Check className="w-3 h-3" />
                            <span>Encaisser</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(sale)}
                          className="p-1 text-stone-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Modifier cette vente"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-1 text-stone-400 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Supprimer la vente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
