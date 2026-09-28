// DestinationZones.tsx
//
// The country → pricing-zone map.
//
// A country's zone selects which column of a plan's rate table is used, so this
// screen is what makes "France costs more than Senegal" true. Every country
// ships in a single zone called Worldwide, which is the column existing plans
// already use — so until someone changes something here, pricing behaves exactly
// as it always has.
//
// Reassigning is an update of one column. No country is created or removed, and
// a plan that has no column for the zone you pick simply falls back to its first
// column, which is its current price.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Globe2, Info, Loader2, RefreshCw, Search } from "lucide-react";
import {
  listZonesApi,
  listZoneCountriesApi,
  assignZoneApi,
  type Zone,
  type ZoneCountry,
} from "../api/zonesApi";

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message || err?.response?.data?.message || fallback;
};

const DestinationZones: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "fr";

  const [zones, setZones] = useState<Zone[]>([]);
  const [countries, setCountries] = useState<ZoneCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetZone, setTargetZone] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [z, c] = await Promise.all([listZonesApi(), listZoneCountriesApi()]);
      setZones(z.data || []);
      setCountries(c.data || []);
    } catch (e) {
      toast.error(errorMessage(e, t("zones.loadError", "Could not load the zone map.")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const label = useCallback((c: ZoneCountry) => (lang === "en" ? c.name_en : c.name_fr), [lang]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return countries
      .filter((c) => (zoneFilter ? c.zone === zoneFilter : true))
      .filter((c) =>
        !q
          ? true
          : c.name_en.toLowerCase().includes(q) ||
            c.name_fr.toLowerCase().includes(q) ||
            c.country_code.toLowerCase() === q
      )
      .sort((a, b) => label(a).localeCompare(label(b), lang));
  }, [countries, filter, zoneFilter, label, lang]);

  const toggle = (code: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const allSelected = visible.length > 0 && visible.every((c) => prev.has(c.country_code));
      const next = new Set(prev);
      visible.forEach((c) => (allSelected ? next.delete(c.country_code) : next.add(c.country_code)));
      return next;
    });

  const onAssign = async () => {
    const zone = targetZone.trim();
    if (!zone) {
      toast.error(t("zones.zoneRequired", "Enter or choose a zone name first."));
      return;
    }
    if (selected.size === 0) {
      toast.error(t("zones.selectionRequired", "Select at least one country."));
      return;
    }
    try {
      setSaving(true);
      const res = await assignZoneApi({ country_codes: [...selected], zone });
      toast.success(res.message || t("zones.assigned", "Zone updated."));
      if (res.data.unknown?.length) {
        toast.error(t("zones.unknownCodes", "Not recognised: {{codes}}", { codes: res.data.unknown.join(", ") }));
      }
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t("zones.assignError", "Could not update the zones.")));
    } finally {
      setSaving(false);
    }
  };

  const allVisibleSelected = visible.length > 0 && visible.every((c) => selected.has(c.country_code));

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {t("zones.title", "Destination zones")}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "zones.subtitle",
              "A country's zone selects which column of a plan's rate table is used. Every country starts in one zone, so pricing stays exactly as it is until you change something here."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
        >
          <RefreshCw className="w-4 h-4" />
          {t("zones.refresh", "Refresh")}
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#D9D9D9] bg-secondary-light/40 p-4">
        <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-600 leading-relaxed">
          {t(
            "zones.explainer",
            "A zone name only has an effect when a plan defines a pricing column with the same name. A plan without that column keeps charging its current price, so moving a country here can never break an existing plan."
          )}
        </p>
      </div>

      {/* zone summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {zones.map((z) => (
          <button
            key={z.zone}
            type="button"
            onClick={() => setZoneFilter(zoneFilter === z.zone ? "" : z.zone)}
            className={`text-left rounded-2xl border p-4 transition ${
              zoneFilter === z.zone
                ? "border-[#E4590F]/40 bg-[#E4590F]/5"
                : "border-[#D9D9D9] bg-white hover:border-[#E4590F]/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#E4590F]" />
              <p className="text-sm font-medium text-gray-900 truncate">{z.zone}</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{z.countryCount}</p>
            <p className="text-[11px] text-gray-500">
              {t("zones.activeCount", "{{n}} offered as destinations", { n: z.activeCount })}
            </p>
          </button>
        ))}
      </div>

      {/* filter */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("zones.filterPlaceholder", "Filter by country or ISO code")}
            className="w-72 rounded-xl border border-[#D9D9D9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F]"
          />
        </div>
        {zoneFilter && (
          <button
            type="button"
            onClick={() => setZoneFilter("")}
            className="rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-xs text-gray-600 hover:text-[#E4590F] transition"
          >
            {t("zones.clearZoneFilter", "Showing {{zone}} — show all", { zone: zoneFilter })}
          </button>
        )}
        <span className="ml-auto text-xs text-gray-500">
          {t("zones.countShown", "{{shown}} of {{total}} countries", { shown: visible.length, total: countries.length })}
        </span>
      </div>

      {/* table */}
      <div className="rounded-2xl border border-[#D9D9D9] bg-white overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#E4590F]" /></div>
        ) : (
          <div className="max-h-[540px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-light/40 text-left sticky top-0">
                <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label={t("zones.selectAll", "Select all shown")}
                      className="h-4 w-4 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">{t("zones.colCountry", "Country")}</th>
                  <th className="px-4 py-3 font-medium">{t("zones.colCode", "Code")}</th>
                  <th className="px-4 py-3 font-medium">{t("zones.colZone", "Zone")}</th>
                  <th className="px-4 py-3 font-medium">{t("zones.colActive", "Destination")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {visible.map((c) => (
                  <tr
                    key={c.country_code}
                    onClick={() => toggle(c.country_code)}
                    className={`cursor-pointer transition ${
                      selected.has(c.country_code) ? "bg-[#E4590F]/5" : "hover:bg-secondary-light/30"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(c.country_code)}
                        onChange={() => toggle(c.country_code)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-900">{label(c)}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{c.country_code}</td>
                    <td className="px-4 py-2.5 text-gray-700">{c.zone}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs ${c.active ? "text-green-700" : "text-gray-400"}`}>
                        {c.active ? t("zones.offered", "Offered") : t("zones.notOffered", "Not offered")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* assign bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9D9D9] bg-white/95 backdrop-blur px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-gray-600">
              {t("zones.selectedCount", "{{n}} country/countries selected", { n: selected.size })}
            </p>
            <input
              list="zone-names"
              value={targetZone}
              onChange={(e) => setTargetZone(e.target.value)}
              placeholder={t("zones.zonePlaceholder", "Zone name, e.g. Zone A")}
              className="w-56 rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F]"
            />
            <datalist id="zone-names">
              {zones.map((z) => <option key={z.zone} value={z.zone} />)}
            </datalist>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-xl border border-[#D9D9D9] px-4 py-2.5 text-sm text-gray-700 hover:text-[#E4590F] transition"
              >
                {t("zones.clearSelection", "Clear")}
              </button>
              <button
                type="button"
                onClick={onAssign}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#C94A0D] transition disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("zones.assign", "Assign zone")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationZones;
