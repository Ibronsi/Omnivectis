import { CurrencyCode, LiveFxRates } from '../types/market';

const FALLBACK_RATES_TO_EUR: Record<CurrencyCode, number> = {
  EUR: 1,
  XOF: 655.957,
  USD: 1.08,
};

export function getCurrencySymbol(currency: CurrencyCode): string {
  switch (currency) {
    case 'XOF':
      return 'FCFA';
    case 'USD':
      return '$';
    case 'EUR':
    default:
      return '€';
  }
}

export function getEffectiveFxRateToEur(
  currency: CurrencyCode,
  rates?: LiveFxRates | null
): { rate: number; status: 'live' | 'cache' | 'fallback'; lastUpdate?: string } {
  if (currency === 'EUR') {
    return {
      rate: 1,
      status: rates?.status || 'live',
      lastUpdate: rates?.lastUpdate,
    };
  }

  const liveVal = rates?.[currency];
  if (typeof liveVal === 'number' && Number.isFinite(liveVal) && liveVal > 0) {
    return {
      rate: liveVal,
      status: rates?.status || 'live',
      lastUpdate: rates?.lastUpdate,
    };
  }

  return {
    rate: FALLBACK_RATES_TO_EUR[currency],
    status: 'fallback',
    lastUpdate: rates?.lastUpdate,
  };
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates?: LiveFxRates | null
): number {
  const safeAmount = Number(amount) || 0;
  if (from === to) return safeAmount;

  const fromRate = getEffectiveFxRateToEur(from, rates).rate;
  const toRate = getEffectiveFxRateToEur(to, rates).rate;

  const amountInEur = safeAmount / fromRate;
  const converted = amountInEur * toRate;

  return to === 'XOF' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const safe = Number(amount) || 0;
  const formatted =
    currency === 'XOF'
      ? Math.round(safe).toLocaleString('fr-FR')
      : Math.round(safe).toLocaleString('fr-FR');
  return `${formatted} ${getCurrencySymbol(currency)}`;
}
