import { INTL_TAG, type Locale } from "./locale";

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_TAG[locale]).format(value);
}

/** The app only bills in EUR — this only changes the digit grouping and
 * decimal separator per locale (1 234,56 € vs 1,234.56 €), never the
 * currency itself. */
export function formatEuros(value: number, locale: Locale): string {
  const amount = new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${amount} €`;
}

export function formatDate(
  value: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(INTL_TAG[locale], options).format(date);
}
