import { Settings } from '../types';

// Display helper: show ₹ whenever the stored symbol is a "Rs" variant.
export function displayCurrency(settings: Pick<Settings, 'currencySymbol'>): string {
  const raw = (settings.currencySymbol || '').trim();
  if (/^rs\.?$/i.test(raw)) return '₹';
  return settings.currencySymbol;
}

export function formatPrice(settings: Pick<Settings, 'currencySymbol'>, value: number): string {
  return `${displayCurrency(settings)}${Number(value || 0).toFixed(2)}`;
}
