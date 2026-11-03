/** Default GNA Retail-style validity tiers (days of cover purchased). */
export const VALIDITY_TIERS = [10, 45, 93, 180, 365];

export function parseDaysFromPricingLabel(label: string | undefined | null): number | null {
  if (label == null) return null;
  const match = String(label).match(/(\d+)\s*(?:Days|Jours|days|jours)/i);
  if (match) return parseInt(match[1], 10);
  if (/year|an/i.test(String(label))) return 365;
  return null;
}

/** Prefer the plan's own pricing-row durations; fall back to the GNA defaults. */
export function extractValidityTiersFromPricing(
  pricingTables?: { pricing?: { label: string }[] } | null
): number[] {
  if (!pricingTables?.pricing?.length) return [...VALIDITY_TIERS];
  const days = pricingTables.pricing
    .map((row) => parseDaysFromPricingLabel(row.label))
    .filter((d): d is number => d != null && d > 0);
  const unique = [...new Set(days)].sort((a, b) => a - b);
  return unique.length ? unique : [...VALIDITY_TIERS];
}

export function stayDaysToValidityTier(
  stayDays: number,
  tiers: number[] = VALIDITY_TIERS
): number {
  const list = tiers?.length ? tiers : VALIDITY_TIERS;
  const d = Math.max(1, Math.floor(Number(stayDays)) || 1);
  for (const tier of list) {
    if (d <= tier) return tier;
  }
  return list[list.length - 1];
}

function pickPriceFromRow(
  row: { columns: Record<string, number | null> },
  columns: string[]
): number | null {
  for (const col of columns) {
    const price = row.columns[col];
    if (price !== null && price !== undefined && !Number.isNaN(Number(price))) {
      return Number(price);
    }
  }
  return null;
}

export function getBasePremiumForValidityTier(
  pricingTables: { pricingColumns: string[]; pricing: { label: string; columns: Record<string, number | null> }[] } | undefined,
  validityDays: number
): number | null {
  if (!pricingTables?.pricing?.length) return null;
  const columns = pricingTables.pricingColumns || [];
  const target = pricingTables.pricing.find((row) => parseDaysFromPricingLabel(row.label) === validityDays);
  if (target) {
    const p = pickPriceFromRow(target, columns);
    if (p != null) return p;
  }

  const scored = pricingTables.pricing
    .map((row) => ({ row, days: parseDaysFromPricingLabel(row.label) }))
    .filter((x): x is { row: (typeof pricingTables.pricing)[0]; days: number } => x.days != null);
  if (!scored.length) return null;

  const ge = scored.filter((x) => x.days >= validityDays).sort((a, b) => a.days - b.days)[0];
  if (ge) {
    const p = pickPriceFromRow(ge.row, columns);
    if (p != null) return p;
  }
  const le = scored.filter((x) => x.days <= validityDays).sort((a, b) => b.days - a.days)[0];
  if (le) {
    const p = pickPriceFromRow(le.row, columns);
    if (p != null) return p;
  }
  const closest = scored.sort(
    (a, b) => Math.abs(a.days - validityDays) - Math.abs(b.days - validityDays)
  )[0];
  return pickPriceFromRow(closest.row, columns);
}

export function getAgeFromDateString(dobStr: string | undefined, refDate = new Date()): number | null {
  if (!dobStr || String(dobStr).trim() === "") return null;
  const d = new Date(dobStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date(refDate);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/**
 * A traveller younger than this is a minor: half premium, half commission.
 * Raised from 16 to 18 at the client's request (Nov 2026) — half price now
 * applies to travellers aged 17 and under.
 *
 * Mirrors MINOR_AGE_LIMIT in backend/utils/travelPricing.js. Change both together,
 * or the quote preview and the stored price will differ.
 */
export const MINOR_AGE_LIMIT = 18;

export function getAgePremiumMultiplier(age: number | null): {
  multiplier: number;
  eligible: boolean;
  band: string;
} {
  // Shared rules for every plan (existing and future):
  // • 1 day – 17 years: premium ÷ 2 (minor — see MINOR_AGE_LIMIT)
  // • 18 – 75: standard premium
  // • over 75 – 80: premium × 2
  // • 81 – 85: premium × 4 (senior surcharge; commission stays standard)
  // • over 85: not eligible — customer must request a specific exemption
  if (age === null || age === undefined) {
    return { multiplier: 1, eligible: true, band: "unknown" };
  }
  if (age < MINOR_AGE_LIMIT) return { multiplier: 0.5, eligible: true, band: "child" };
  if (age <= 75) return { multiplier: 1, eligible: true, band: "standard" };
  if (age <= 80) return { multiplier: 2, eligible: true, band: "senior76_80" };
  if (age <= 85) return { multiplier: 4, eligible: true, band: "senior81_85" };
  return { multiplier: 0, eligible: false, band: "ineligible" };
}

/**
 * Commission age factor (partner invoices):
 * • 17 and under (below MINOR_AGE_LIMIT) → commission ÷ 2
 * • all other eligible ages → standard commission (senior premium surcharges do NOT increase commission)
 */
export function getAgeCommissionMultiplier(age: number | null): number {
  if (age === null || age === undefined) return 1;
  if (age < MINOR_AGE_LIMIT) return 0.5;
  return 1;
}

export const AGE_EXEMPTION_MESSAGE =
  "The customer must request a specific exemption";

export function roundMoney(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}

/** Closest row / first price — for Bank, Health Evacuation, etc. (non–day-tier tables). */
export function getLegacyPricingTablePremium(
  pricingTables: { pricingColumns: string[]; pricing: { label: string; columns: Record<string, number | null> }[] },
  stayDays: number
): number | null {
  if (!pricingTables.pricing?.length) return null;
  const columns = pricingTables.pricingColumns || [];

  let bestMatch: (typeof pricingTables.pricing)[0] | null = null;
  let minDiff = Infinity;
  for (const row of pricingTables.pricing) {
    const rowDays = parseDaysFromPricingLabel(row.label);
    if (rowDays !== null) {
      const diff = Math.abs(rowDays - stayDays);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = row;
      }
    }
  }

  if (bestMatch) {
    const p = pickPriceFromRow(bestMatch, columns);
    if (p != null) return p;
  }

  for (const row of pricingTables.pricing) {
    const p = pickPriceFromRow(row, columns);
    if (p != null) return p;
  }
  return null;
}

export type ComputeTravelPremiumOptions = {
  /**
   * When true, duration tiers come from this plan's pricing rows and the premium
   * is printed on the certificate. Age multipliers still apply (same rules for all plans).
   */
  fixedDurationPremiums?: boolean;
};

export function computeTravelPlanPremium(
  pricingTables: { pricingColumns: string[]; pricing: { label: string; columns: Record<string, number | null> }[] } | undefined,
  stayDays: number,
  dateOfBirth: string | undefined,
  opts: ComputeTravelPremiumOptions = {}
): {
  error?: string;
  validityDays: number;
  basePremium?: number | null;
  age?: number | null;
  ageInfo?: ReturnType<typeof getAgePremiumMultiplier>;
  planPremium?: number | null;
  fixedDurationPremiums?: boolean;
} {
  const tiers = extractValidityTiersFromPricing(pricingTables);
  const validityDays = stayDaysToValidityTier(stayDays, tiers);
  const base = getBasePremiumForValidityTier(pricingTables, validityDays);
  if (base === null) {
    return {
      error: "no_price_for_tier",
      validityDays,
      planPremium: null,
      fixedDurationPremiums: !!opts.fixedDurationPremiums,
    };
  }

  const age = getAgeFromDateString(dateOfBirth);
  const ageInfo = getAgePremiumMultiplier(age);
  if (!ageInfo.eligible) {
    return {
      error: "age_ineligible",
      validityDays,
      basePremium: base,
      age,
      ageInfo,
      planPremium: null,
      fixedDurationPremiums: !!opts.fixedDurationPremiums,
    };
  }
  return {
    validityDays,
    basePremium: base,
    age,
    ageInfo,
    planPremium: roundMoney(base * ageInfo.multiplier),
    fixedDurationPremiums: !!opts.fixedDurationPremiums,
  };
}
