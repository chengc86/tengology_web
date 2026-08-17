/**
 * Destinations the shop can sell to.
 *
 * `postcode: "optional"` marks countries that genuinely don't use postal codes
 * (or where they're rarely written), so checkout doesn't demand one that
 * doesn't exist. Regions drive the grouping in the country picker and the
 * shipping zones in the seed.
 */

export type Region =
  | "United Kingdom"
  | "Europe"
  | "North America"
  | "Asia Pacific"
  | "Middle East & Africa"
  | "Latin America";

export interface Country {
  code: string;
  name: string;
  region: Region;
  postcode: "required" | "optional";
  /** In the EU customs union — relevant for IOSS and duty messaging. */
  eu?: boolean;
}

/** The shop's home country: domestic VAT and free-delivery rules apply here. */
export const HOME_COUNTRY = "GB";

export const COUNTRIES: Country[] = [
  { code: "GB", name: "United Kingdom", region: "United Kingdom", postcode: "required" },

  // ─── Europe ───────────────────────────────────────
  { code: "IE", name: "Ireland", region: "Europe", postcode: "optional", eu: true },
  { code: "AT", name: "Austria", region: "Europe", postcode: "required", eu: true },
  { code: "BE", name: "Belgium", region: "Europe", postcode: "required", eu: true },
  { code: "BG", name: "Bulgaria", region: "Europe", postcode: "required", eu: true },
  { code: "HR", name: "Croatia", region: "Europe", postcode: "required", eu: true },
  { code: "CY", name: "Cyprus", region: "Europe", postcode: "required", eu: true },
  { code: "CZ", name: "Czechia", region: "Europe", postcode: "required", eu: true },
  { code: "DK", name: "Denmark", region: "Europe", postcode: "required", eu: true },
  { code: "EE", name: "Estonia", region: "Europe", postcode: "required", eu: true },
  { code: "FI", name: "Finland", region: "Europe", postcode: "required", eu: true },
  { code: "FR", name: "France", region: "Europe", postcode: "required", eu: true },
  { code: "DE", name: "Germany", region: "Europe", postcode: "required", eu: true },
  { code: "GR", name: "Greece", region: "Europe", postcode: "required", eu: true },
  { code: "HU", name: "Hungary", region: "Europe", postcode: "required", eu: true },
  { code: "IS", name: "Iceland", region: "Europe", postcode: "required" },
  { code: "IT", name: "Italy", region: "Europe", postcode: "required", eu: true },
  { code: "LV", name: "Latvia", region: "Europe", postcode: "required", eu: true },
  { code: "LI", name: "Liechtenstein", region: "Europe", postcode: "required" },
  { code: "LT", name: "Lithuania", region: "Europe", postcode: "required", eu: true },
  { code: "LU", name: "Luxembourg", region: "Europe", postcode: "required", eu: true },
  { code: "MT", name: "Malta", region: "Europe", postcode: "required", eu: true },
  { code: "MC", name: "Monaco", region: "Europe", postcode: "required" },
  { code: "NL", name: "Netherlands", region: "Europe", postcode: "required", eu: true },
  { code: "NO", name: "Norway", region: "Europe", postcode: "required" },
  { code: "PL", name: "Poland", region: "Europe", postcode: "required", eu: true },
  { code: "PT", name: "Portugal", region: "Europe", postcode: "required", eu: true },
  { code: "RO", name: "Romania", region: "Europe", postcode: "required", eu: true },
  { code: "SK", name: "Slovakia", region: "Europe", postcode: "required", eu: true },
  { code: "SI", name: "Slovenia", region: "Europe", postcode: "required", eu: true },
  { code: "ES", name: "Spain", region: "Europe", postcode: "required", eu: true },
  { code: "SE", name: "Sweden", region: "Europe", postcode: "required", eu: true },
  { code: "CH", name: "Switzerland", region: "Europe", postcode: "required" },

  // ─── North America ────────────────────────────────
  { code: "US", name: "United States", region: "North America", postcode: "required" },
  { code: "CA", name: "Canada", region: "North America", postcode: "required" },
  { code: "MX", name: "Mexico", region: "North America", postcode: "required" },

  // ─── Asia Pacific ─────────────────────────────────
  { code: "AU", name: "Australia", region: "Asia Pacific", postcode: "required" },
  { code: "NZ", name: "New Zealand", region: "Asia Pacific", postcode: "required" },
  { code: "JP", name: "Japan", region: "Asia Pacific", postcode: "required" },
  { code: "KR", name: "South Korea", region: "Asia Pacific", postcode: "required" },
  { code: "SG", name: "Singapore", region: "Asia Pacific", postcode: "required" },
  { code: "HK", name: "Hong Kong", region: "Asia Pacific", postcode: "optional" },
  { code: "MO", name: "Macau", region: "Asia Pacific", postcode: "optional" },
  { code: "TW", name: "Taiwan", region: "Asia Pacific", postcode: "required" },
  { code: "MY", name: "Malaysia", region: "Asia Pacific", postcode: "required" },
  { code: "TH", name: "Thailand", region: "Asia Pacific", postcode: "required" },
  { code: "PH", name: "Philippines", region: "Asia Pacific", postcode: "required" },
  { code: "ID", name: "Indonesia", region: "Asia Pacific", postcode: "required" },
  { code: "IN", name: "India", region: "Asia Pacific", postcode: "required" },
  { code: "CN", name: "China", region: "Asia Pacific", postcode: "required" },
  { code: "VN", name: "Vietnam", region: "Asia Pacific", postcode: "required" },

  // ─── Middle East & Africa ─────────────────────────
  { code: "AE", name: "United Arab Emirates", region: "Middle East & Africa", postcode: "optional" },
  { code: "SA", name: "Saudi Arabia", region: "Middle East & Africa", postcode: "required" },
  { code: "QA", name: "Qatar", region: "Middle East & Africa", postcode: "optional" },
  { code: "KW", name: "Kuwait", region: "Middle East & Africa", postcode: "required" },
  { code: "BH", name: "Bahrain", region: "Middle East & Africa", postcode: "optional" },
  { code: "IL", name: "Israel", region: "Middle East & Africa", postcode: "required" },
  { code: "TR", name: "Türkiye", region: "Middle East & Africa", postcode: "required" },
  { code: "ZA", name: "South Africa", region: "Middle East & Africa", postcode: "required" },
  { code: "NG", name: "Nigeria", region: "Middle East & Africa", postcode: "optional" },
  { code: "KE", name: "Kenya", region: "Middle East & Africa", postcode: "required" },
  { code: "GH", name: "Ghana", region: "Middle East & Africa", postcode: "optional" },
  { code: "EG", name: "Egypt", region: "Middle East & Africa", postcode: "required" },
  { code: "MU", name: "Mauritius", region: "Middle East & Africa", postcode: "optional" },

  // ─── Latin America ────────────────────────────────
  { code: "BR", name: "Brazil", region: "Latin America", postcode: "required" },
  { code: "AR", name: "Argentina", region: "Latin America", postcode: "required" },
  { code: "CL", name: "Chile", region: "Latin America", postcode: "required" },
  { code: "CO", name: "Colombia", region: "Latin America", postcode: "required" },
  { code: "PE", name: "Peru", region: "Latin America", postcode: "required" },
  { code: "UY", name: "Uruguay", region: "Latin America", postcode: "required" },
  { code: "CR", name: "Costa Rica", region: "Latin America", postcode: "required" },
  { code: "PA", name: "Panama", region: "Latin America", postcode: "optional" },
  { code: "JM", name: "Jamaica", region: "Latin America", postcode: "optional" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}

/** Human-readable name, falling back to the raw code for unknown values. */
export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return getCountry(code)?.name ?? code.toUpperCase();
}

export function isSupportedCountry(code: string | null | undefined): boolean {
  return Boolean(getCountry(code));
}

export function isPostcodeRequired(code: string | null | undefined): boolean {
  return getCountry(code)?.postcode !== "optional";
}

export function isDomestic(code: string | null | undefined): boolean {
  return (code ?? HOME_COUNTRY).toUpperCase() === HOME_COUNTRY;
}

export function isEuCountry(code: string | null | undefined): boolean {
  return Boolean(getCountry(code)?.eu);
}

export const REGION_ORDER: Region[] = [
  "United Kingdom",
  "Europe",
  "North America",
  "Asia Pacific",
  "Middle East & Africa",
  "Latin America",
];

/** Countries grouped for the checkout picker, each region alphabetised. */
export function countriesByRegion(): Array<{ region: Region; countries: Country[] }> {
  return REGION_ORDER.map((region) => ({
    region,
    countries: COUNTRIES.filter((c) => c.region === region).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  })).filter((group) => group.countries.length > 0);
}

/** ISO codes for a region — used to build shipping zones. */
export function codesInRegion(region: Region): string[] {
  return COUNTRIES.filter((c) => c.region === region).map((c) => c.code);
}
