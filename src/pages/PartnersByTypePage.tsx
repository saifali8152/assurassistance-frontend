// PartnersByTypePage.tsx
//
// Superadmin view: each partner (travel agency, corporate desk, broker, …) appears
// once, regardless of how many agent logins act on its behalf. Filter by
// partnership type via the summary chips; open a partner to see its agent tree.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users
} from "lucide-react";
import {
  getPartnersApi,
  type PartnerRow,
  type PartnerTypeSummary
} from "../api/adminApi";
import { getCountryLabel } from "../utils/countryLabels";

const ITEMS_PER_PAGE = 25;

/** Canonical types from CreateUser — always shown as chips even when count is 0. */
const KNOWN_PARTNERSHIP_TYPES = [
  "Insurance company",
  "Broker",
  "Travel agency",
  "Corporate desk",
  "Independent Agent"
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const PartnersByTypePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [typeSummary, setTypeSummary] = useState<PartnerTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPartnersApi({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        partnership_type: typeFilter || undefined
      });
      const data = res?.data;
      setPartners(data?.partners ?? []);
      setTypeSummary(data?.typeSummary ?? []);
      const p = data?.pagination;
      if (p) {
        setTotalPages(p.totalPages);
        setTotalItems(p.totalItems);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("partnersByType.loadError", "Failed to load partners."));
      setPartners([]);
      setTypeSummary([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const totalAllTypes = useMemo(
    () => typeSummary.reduce((sum, row) => sum + (row.partner_count || 0), 0),
    [typeSummary]
  );

  const countForType = (type: string) => {
    const row = typeSummary.find((r) => r.partnership_type === type);
    return row?.partner_count ?? 0;
  };

  /** Extra types present in DB but not in the canonical dropdown. */
  const extraTypes = useMemo(
    () =>
      typeSummary
        .map((r) => r.partnership_type)
        .filter(
          (type) =>
            type !== "Unspecified" &&
            !KNOWN_PARTNERSHIP_TYPES.includes(type)
        ),
    [typeSummary]
  );

  const unspecifiedCount = countForType("Unspecified");

  const typeLabel = (type: string) => {
    if (type === "Unspecified") {
      return t("partnersByType.unspecified", "Unspecified");
    }
    const keyMap: Record<string, string> = {
      "Insurance company": "partnersByType.typeInsurance",
      Broker: "partnersByType.typeBroker",
      "Travel agency": "partnersByType.typeTravelAgency",
      "Corporate desk": "partnersByType.typeCorporate",
      "Independent Agent": "partnersByType.typeIndependent"
    };
    return t(keyMap[type] || type, type);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {t("partnersByType.title", "Partners by type")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary max-w-3xl">
          {t(
            "partnersByType.subtitle",
            "Each partner (travel agency, corporate desk, broker, …) appears once, regardless of how many agents use its account. Open a partner to manage the agents under it."
          )}
        </p>
      </div>

      {/* Type summary chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter("")}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            typeFilter === ""
              ? "border-[#E4590F] bg-[#E4590F]/10 text-[#E4590F]"
              : "border-[#D9D9D9] bg-white text-[#1A1A1A] hover:border-[#E4590F]/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t("partnersByType.allTypes", "All types")}
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium">
            {totalAllTypes}
          </span>
        </button>

        {KNOWN_PARTNERSHIP_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              typeFilter === type
                ? "border-[#E4590F] bg-[#E4590F]/10 text-[#E4590F]"
                : "border-[#D9D9D9] bg-white text-[#1A1A1A] hover:border-[#E4590F]/50"
            }`}
          >
            {typeLabel(type)}
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium">
              {countForType(type)}
            </span>
          </button>
        ))}

        {extraTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              typeFilter === type
                ? "border-[#E4590F] bg-[#E4590F]/10 text-[#E4590F]"
                : "border-[#D9D9D9] bg-white text-[#1A1A1A] hover:border-[#E4590F]/50"
            }`}
          >
            {type}
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium">
              {countForType(type)}
            </span>
          </button>
        ))}

        {unspecifiedCount > 0 && (
          <button
            type="button"
            onClick={() =>
              setTypeFilter(typeFilter === "Unspecified" ? "" : "Unspecified")
            }
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              typeFilter === "Unspecified"
                ? "border-[#E4590F] bg-[#E4590F]/10 text-[#E4590F]"
                : "border-[#D9D9D9] bg-white text-[#1A1A1A] hover:border-[#E4590F]/50"
            }`}
          >
            {typeLabel("Unspecified")}
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium">
              {unspecifiedCount}
            </span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t("partnersByType.search", "Search")}
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(
              "partnersByType.searchPlaceholder",
              "Company, contact name, email, IATA…"
            )}
            className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F]"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-medium text-text-secondary mb-1">
            {t("partnersByType.status", "Status")}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] bg-white"
          >
            <option value="">{t("partnersByType.statusAll", "All statuses")}</option>
            <option value="active">{t("partnersByType.statusActive", "Active")}</option>
            <option value="inactive">{t("partnersByType.statusInactive", "Inactive")}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-[#D9D9D9] px-4 py-2 text-sm text-text-secondary hover:bg-secondary/20"
        >
          {t("partnersByType.clear", "Clear")}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#D9D9D9] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] text-left text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colCompany", "Partner / company")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colType", "Type")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colContact", "Primary contact")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colCountry", "Country")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colAccounts", "Agent accounts")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colCases", "Cases")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colStatus", "Status")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colCreated", "Created")}</th>
                <th className="px-4 py-3 font-medium">{t("partnersByType.colActions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-secondary">
                    {t("partnersByType.loading", "Loading partners…")}
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-text-secondary">
                    <p>{t("partnersByType.empty", "No partners match the current filters.")}</p>
                    <p className="mt-1 text-xs">
                      {t(
                        "partnersByType.emptyHint",
                        "Partners are the top-level agency accounts. Create them from Agents."
                      )}
                    </p>
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="border-t border-[#EEEEEE] hover:bg-[#FAFAFA]/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1A1A1A]">
                        {p.company_name || t("partnersByType.noCompany", "— No company name —")}
                      </div>
                      {p.iata_number ? (
                        <div className="text-xs text-text-secondary mt-0.5">
                          IATA {p.iata_number}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-[#D9D9D9] bg-white px-2.5 py-0.5 text-xs">
                        {p.partnership_type
                          ? typeLabel(p.partnership_type)
                          : typeLabel("Unspecified")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.name}</div>
                      <div className="text-xs text-text-secondary">{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {p.country_of_residence
                        ? getCountryLabel(p.country_of_residence, i18n.language)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-medium">{p.account_count}</span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {t("partnersByType.directAgents", "{{count}} direct", {
                          count: p.direct_agent_count
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.total_cases}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.status === "active"
                            ? "bg-green-500/15 text-green-700"
                            : "bg-red-500/15 text-red-700"
                        }`}
                      >
                        {p.status === "active"
                          ? t("partnersByType.statusActive", "Active")
                          : t("partnersByType.statusInactive", "Inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/supervisors/${p.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D9D9] px-2.5 py-1.5 text-xs hover:border-[#E4590F] hover:text-[#E4590F]"
                        title={t("partnersByType.viewPartner", "View partner & agents")}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("partnersByType.view", "View")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-[#EEEEEE] px-4 py-3 text-sm">
            <span className="text-text-secondary">
              {t("partnersByType.showing", "Showing {{count}} of {{total}} partners", {
                count: partners.length,
                total: totalItems
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D9D9D9] px-2.5 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("partnersByType.previous", "Previous")}
              </button>
              <span className="text-text-secondary">
                {t("partnersByType.page", "Page {{page}} / {{total}}", {
                  page,
                  total: totalPages
                })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D9D9D9] px-2.5 py-1.5 disabled:opacity-40"
              >
                {t("partnersByType.next", "Next")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnersByTypePage;
