import { prisma } from "./db";
import { round2 } from "./money";
import { getNumericSetting } from "./settings";
import { HOME_COUNTRY, isDomestic } from "./countries";

/**
 * Shipping options. Rates come from the ShippingMethod table so the owner can
 * edit them in the admin; if the table is empty we fall back to a sensible
 * built-in set so checkout never dead-ends.
 *
 * Two rules govern which options a destination sees:
 *
 * 1. **Specificity wins.** A method naming the country explicitly beats a
 *    catch-all `*` method, so a French shopper sees "Europe Delivery" rather
 *    than both that and "International Delivery".
 * 2. **Free delivery is domestic only.** The store-wide free-shipping
 *    threshold applies to UK orders; sending a parcel to Australia for free
 *    because the basket passed £50 would lose money on every order. An
 *    international method can still offer free delivery by setting its own
 *    `freeThreshold`.
 */

export interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  carrier: string | null;
  price: number;
  /** Price after the free-shipping threshold is applied. */
  effectivePrice: number;
  isFree: boolean;
  /** Spend at or above which this method is free, if it offers that at all. */
  freeThreshold: number | null;
  minDays: number | null;
  maxDays: number | null;
  estimate: string;
}

const FALLBACK_METHODS = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Royal Mail Tracked 48",
    carrier: "ROYAL_MAIL",
    price: 3.95,
    freeThreshold: null as number | null,
    minDays: 2,
    maxDays: 4,
    countries: "GB",
    sortOrder: 0,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Royal Mail Tracked 24",
    carrier: "ROYAL_MAIL",
    price: 6.95,
    freeThreshold: null as number | null,
    minDays: 1,
    maxDays: 2,
    countries: "GB",
    sortOrder: 1,
  },
];

function describeEstimate(minDays: number | null, maxDays: number | null): string {
  if (minDays && maxDays && minDays !== maxDays) return `${minDays}–${maxDays} working days`;
  const single = minDays ?? maxDays;
  if (single === 1) return "Next working day";
  if (single) return `${single} working days`;
  return "";
}

function countryList(countries: string): string[] {
  return countries.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
}

/** Does this method name the country outright, rather than via a wildcard? */
function servesExplicitly(countries: string, country: string): boolean {
  return countryList(countries).includes(country.toUpperCase());
}

function servesViaWildcard(countries: string): boolean {
  return countryList(countries).includes("*");
}

/**
 * Options available for a destination, priced against the cart subtotal.
 * The free-shipping threshold zeroes the cheapest tier only — express stays
 * paid so a free upgrade can't be claimed by accident.
 */
export async function getShippingOptions(
  subtotal: number,
  country: string = HOME_COUNTRY
): Promise<ShippingOption[]> {
  const freeThreshold = await getNumericSetting("freeShippingThreshold");

  let methods: Array<{
    id: string;
    name: string;
    description: string | null;
    carrier: string | null;
    price: number;
    freeThreshold: number | null;
    minDays: number | null;
    maxDays: number | null;
    countries: string;
    sortOrder: number;
  }> = [];

  try {
    methods = await prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });
  } catch {
    methods = [];
  }

  if (methods.length === 0) methods = FALLBACK_METHODS;

  // Specificity wins: only fall back to catch-all methods when nothing names
  // this country directly.
  const explicit = methods.filter((m) => servesExplicitly(m.countries, country));
  const available = explicit.length > 0 ? explicit : methods.filter((m) => servesViaWildcard(m.countries));

  if (available.length === 0) return [];

  const domestic = isDomestic(country);
  const cheapestPrice = Math.min(...available.map((m) => m.price));

  return available.map((method) => {
    // The store-wide threshold only subsidises home-country delivery; abroad,
    // a method has to opt in with its own threshold.
    const storeThreshold = domestic && method.price === cheapestPrice ? freeThreshold : null;
    const threshold = method.freeThreshold ?? storeThreshold;
    const qualifiesForFree = threshold !== null && threshold > 0 && subtotal >= threshold;
    const effectivePrice = qualifiesForFree ? 0 : round2(method.price);

    return {
      id: method.id,
      name: method.name,
      description: method.description,
      carrier: method.carrier,
      price: round2(method.price),
      effectivePrice,
      isFree: effectivePrice === 0,
      freeThreshold: threshold,
      minDays: method.minDays,
      maxDays: method.maxDays,
      estimate: describeEstimate(method.minDays, method.maxDays),
    };
  });
}

/**
 * Resolve one option by id, or the cheapest available when the id is unknown —
 * which is what happens when a shopper changes country and their previously
 * chosen method no longer serves the destination.
 */
export async function resolveShippingOption(
  methodId: string | null | undefined,
  subtotal: number,
  country: string = HOME_COUNTRY
): Promise<ShippingOption | null> {
  const options = await getShippingOptions(subtotal, country);
  if (options.length === 0) return null;
  return options.find((o) => o.id === methodId) ?? options[0];
}

/**
 * How much more a shopper must spend to unlock free delivery. Returns 0 for
 * destinations where free delivery isn't offered, so the progress nudge stays
 * hidden rather than promising something that will never apply.
 */
export async function amountUntilFreeShipping(
  subtotal: number,
  country: string = HOME_COUNTRY
): Promise<number> {
  if (!isDomestic(country)) {
    // An international method can still offer free delivery on its own terms.
    const options = await getShippingOptions(subtotal, country);
    const eligible = options
      .map((o) => o.freeThreshold)
      .filter((t): t is number => typeof t === "number" && t > 0);

    if (eligible.length === 0) return 0;
    const lowest = Math.min(...eligible);
    return subtotal >= lowest ? 0 : round2(lowest - subtotal);
  }

  const threshold = await getNumericSetting("freeShippingThreshold");
  if (!threshold || subtotal >= threshold) return 0;
  return round2(threshold - subtotal);
}
