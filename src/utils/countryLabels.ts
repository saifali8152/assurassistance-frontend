import countries, { type LocaleData } from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import frLocale from "i18n-iso-countries/langs/fr.json";

countries.registerLocale(enLocale as LocaleData);
countries.registerLocale(frLocale as LocaleData);

/** Canonical English names in DB that don't resolve via getAlpha2Code */
const CANONICAL_TO_ALPHA2: Record<string, string> = {
  "Côte-d'Ivoire": "CI",
  Kosovo: "XK",
  Taiwan: "TW",
  Palestine: "PS",
  "North Korea": "KP",
  "South Korea": "KR",
  "Vatican City": "VA"
};

function resolveAlpha2(canonicalEnglish: string): string | undefined {
  const c = canonicalEnglish?.trim();
  if (!c) return undefined;
  let code = countries.getAlpha2Code(c, "en");
  if (!code) code = countries.getAlpha2Code(c.replace(/-/g, " "), "en");
  if (!code) code = CANONICAL_TO_ALPHA2[c];
  return code || undefined;
}

/** Localized label for display; value stored remains canonical English. */
export function getCountryLabel(canonicalEnglish: string, lang: string): string {
  if (!canonicalEnglish) return "";
  const l = lang?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const code = resolveAlpha2(canonicalEnglish);
  if (!code) return canonicalEnglish;
  const name = countries.getName(code, l);
  return name || countries.getName(code, "en") || canonicalEnglish;
}

export function filterCountriesByQuery(
  canonicalList: readonly string[],
  query: string,
  lang: string
): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...canonicalList];
  return canonicalList.filter((c) => {
    const label = getCountryLabel(c, lang).toLowerCase();
    return label.includes(q) || c.toLowerCase().includes(q);
  });
}
