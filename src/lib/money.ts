/**
 * Money helpers.
 *
 * Prices are stored as Float pounds, but every arithmetic result is snapped
 * back to 2dp before it is persisted or sent to Square. Square itself only
 * speaks minor units (pence), so conversion goes through `toMinorUnits`,
 * which rounds off float drift (e.g. 3.995 * 100 = 399.49999…) before
 * truncating to an integer.
 */

export const CURRENCY = "GBP";

/** Round to 2dp the way a till would: half away from zero. */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
}

/** Pounds → pence, as a BigInt for the Square SDK. */
export function toMinorUnits(pounds: number): bigint {
  return BigInt(Math.round(round2(pounds) * 100));
}

/** Pence → pounds. */
export function fromMinorUnits(minor: bigint | number): number {
  return round2(Number(minor) / 100);
}

export function formatMoney(value: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(round2(value));
}

/** Sum a list of amounts without accumulating float error. */
export function sumMoney(values: number[]): number {
  return round2(values.reduce((total, v) => total + v, 0));
}
