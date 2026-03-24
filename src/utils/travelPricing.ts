export const VALIDITY_TIERS = [10, 45, 93, 180, 365];

export function stayDaysToValidityTier(stayDays: number): number {
  const d = Math.max(1, Math.floor(Number(stayDays)) || 1);
  for (const tier of VALIDITY_TIERS) {
    if (d <= tier) return tier;
  }
  return VALIDITY_TIERS[VALIDITY_TIERS.length - 1];
}

export function parseDaysFromPricingLabel(label: string | undefined | null): number | null {
  if (label == null) return null;
  const match = String(label).match(/(\d+)\s*(?:Days|Jours|days|jours)/i);
  if (match) return parseInt(match[1], 10);
  if (/year|an/i.test(String(label))) return 365;
  return null;
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

export function getAgePremiumMultiplier(age: number | null): {
  multiplier: number;
  eligible: boolean;
  band: string;
} {
  if (age === null || age === undefined) {
    return { multiplier: 1, eligible: true, band: "unknown" };
  }
  if (age < 16) return { multiplier: 0.5, eligible: true, band: "child" };
  if (age <= 75) return { multiplier: 1, eligible: true, band: "standard" };
  if (age <= 80) return { multiplier: 2, eligible: true, band: "senior76_80" };
  if (age <= 85) return { multiplier: 4, eligible: true, band: "senior81_85" };
  return { multiplier: 0, eligible: false, band: "ineligible" };
}

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

  const parseDaysFromLabel = (label: string): number | null => {
    const match = label.match(/(\d+)\s*(?:Days|Jours|days|jours)/i);
    if (match) return parseInt(match[1], 10);
    if (label.toLowerCase().includes("year") || label.toLowerCase().includes("an")) return 365;
    return null;
  };

  let bestMatch: (typeof pricingTables.pricing)[0] | null = null;
  let minDiff = Infinity;
  for (const row of pricingTables.pricing) {
    const rowDays = parseDaysFromLabel(row.label);
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

export function computeTravelPlanPremium(
  pricingTables: { pricingColumns: string[]; pricing: { label: string; columns: Record<string, number | null> }[] } | undefined,
  stayDays: number,
  dateOfBirth: string | undefined
): {
  error?: string;
  validityDays: number;
  basePremium?: number | null;
  age?: number | null;
  ageInfo?: ReturnType<typeof getAgePremiumMultiplier>;
  planPremium?: number | null;
} {
  const validityDays = stayDaysToValidityTier(stayDays);
  const base = getBasePremiumForValidityTier(pricingTables, validityDays);
  if (base === null) return { error: "no_price_for_tier", validityDays, planPremium: null };
  const age = getAgeFromDateString(dateOfBirth);
  const ageInfo = getAgePremiumMultiplier(age);
  if (!ageInfo.eligible) {
    return {
      error: "age_ineligible",
      validityDays,
      basePremium: base,
      age,
      ageInfo,
      planPremium: null
    };
  }
  return {
    validityDays,
    basePremium: base,
    age,
    ageInfo,
    planPremium: roundMoney(base * ageInfo.multiplier)
  };
}
