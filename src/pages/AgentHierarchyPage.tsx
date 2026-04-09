import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, ChevronLeft, ChevronRight, Network } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAgentHierarchyApi,
  getAgentHierarchyExportUrl,
  type AgentHierarchyRow,
  type AgentHierarchyApiResponse,
} from "../api/adminApi";

const ITEMS_PER_PAGE = 25;

function RoleBadge({ role, t }: { role: string; t: (k: string) => string }) {
  const label =
    role === "supervisor"
      ? t("adminHierarchy.roleSupervisor")
      : role === "agent"
        ? t("adminHierarchy.roleAgent")
        : t("adminHierarchy.roleSubAgent");
  const cls =
    role === "supervisor"
      ? "bg-violet-500/15 text-violet-700 border-violet-300"
      : role === "agent"
        ? "bg-sky-500/15 text-sky-800 border-sky-300"
        : "bg-amber-500/15 text-amber-900 border-amber-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}
    >
      {label}
    </span>
  );
}

const AgentHierarchyPage: React.FC = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AgentHierarchyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = (await getAgentHierarchyApi({
        page,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      })) as AgentHierarchyApiResponse;
      const data = res?.data;
      setRows(data?.rows ?? []);
      const p = data?.pagination;
      if (p) {
        setTotalPages(p.totalPages);
        setTotalItems(p.totalItems);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("adminHierarchy.loadError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem("auth_token");
      const url = getAgentHierarchyExportUrl({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      });
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "export failed");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `agent-hierarchy_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(t("adminHierarchy.exportSuccess"));
    } catch (e) {
      console.error(e);
      toast.error(t("adminHierarchy.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const cell = "px-2 py-2 align-top text-xs text-[#2B2B2B] border-b border-[#D9D9D9] whitespace-nowrap max-w-[14rem] truncate";
  const head = "px-2 py-3 text-left text-xs font-semibold text-[#2B2B2B]/70 border-b border-[#D9D9D9] whitespace-nowrap bg-[#fafafa]";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-7 w-7 text-[#E4590F]" />
          <div>
            <h1 className="text-xl font-semibold text-[#E4590F]">{t("adminHierarchy.title")}</h1>
            <p className="text-sm text-[#2B2B2B]/70">{t("adminHierarchy.subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2 text-sm hover:bg-[#f8f8f8] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? t("adminHierarchy.exporting") : t("adminHierarchy.exportCsv")}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#D9D9D9] bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs text-[#2B2B2B]/60">{t("adminHierarchy.search")}</label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("adminHierarchy.searchPlaceholder")}
            className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full sm:w-44">
          <label className="mb-1 block text-xs text-[#2B2B2B]/60">{t("adminHierarchy.status")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2 text-sm"
          >
            <option value="">{t("adminHierarchy.statusAll")}</option>
            <option value="active">{t("adminHierarchy.statusActive")}</option>
            <option value="inactive">{t("adminHierarchy.statusInactive")}</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#2B2B2B]/70">
          <span>
            {t("adminHierarchy.showing", {
              from: totalItems === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1,
              to: totalItems === 0 ? 0 : Math.min(page * ITEMS_PER_PAGE, totalItems),
              total: totalItems,
            })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse">
            <thead>
              <tr>
                <th className={head}>{t("adminHierarchy.colRole")}</th>
                <th className={head}>{t("adminHierarchy.colId")}</th>
                <th className={head}>{t("adminHierarchy.colName")}</th>
                <th className={head}>{t("adminHierarchy.colEmail")}</th>
                <th className={head}>{t("adminHierarchy.colStatus")}</th>
                <th className={head}>{t("adminHierarchy.colCompany")}</th>
                <th className={head}>{t("adminHierarchy.colPartnership")}</th>
                <th className={head}>{t("adminHierarchy.colCountry")}</th>
                <th className={head}>{t("adminHierarchy.colPhones")}</th>
                <th className={head}>{t("adminHierarchy.colPlans")}</th>
                <th className={head}>{t("adminHierarchy.colSupervisor")}</th>
                <th className={head}>{t("adminHierarchy.colAgent")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-sm text-[#2B2B2B]/50">
                    {t("adminHierarchy.loading")}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-sm text-[#2B2B2B]/50">
                    {t("adminHierarchy.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.hierarchyRole}-${r.id}`} className="hover:bg-[#fafafa]">
                    <td className={cell}>
                      <RoleBadge role={r.hierarchyRole} t={t} />
                    </td>
                    <td className={cell}>{r.id}</td>
                    <td className={cell} title={r.name}>
                      {r.name}
                    </td>
                    <td className={cell} title={r.email}>
                      {r.email}
                    </td>
                    <td className={cell}>{r.status}</td>
                    <td className={cell} title={r.companyName ?? ""}>
                      {r.companyName ?? "—"}
                    </td>
                    <td className={cell} title={r.partnershipType ?? ""}>
                      {r.partnershipType ?? "—"}
                    </td>
                    <td className={cell}>{r.countryOfResidence ?? "—"}</td>
                    <td className={cell} title={[r.workPhone, r.whatsappPhone].filter(Boolean).join(" / ")}>
                      {[r.workPhone, r.whatsappPhone].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className={cell}>{(r.assignedPlanIds || []).join(", ") || "—"}</td>
                    <td className={cell} title={r.supervisor?.email ?? ""}>
                      {r.supervisor?.name ? (
                        <span>
                          #{r.supervisor.id} {r.supervisor.name}
                          <span className="block text-[10px] text-[#2B2B2B]/55">{r.supervisor.email}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={cell} title={r.agent?.email ?? ""}>
                      {r.agent?.name ? (
                        <span>
                          #{r.agent.id} {r.agent.name}
                          <span className="block text-[10px] text-[#2B2B2B]/55">{r.agent.email}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D9D9D9] px-3 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("adminHierarchy.prev")}
            </button>
            <span className="text-sm text-[#2B2B2B]/70">
              {t("adminHierarchy.pageOf", { page, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-[#D9D9D9] px-3 py-2 text-sm disabled:opacity-40"
            >
              {t("adminHierarchy.next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[#2B2B2B]/55">{t("adminHierarchy.footerNote")}</p>
    </div>
  );
};

export default AgentHierarchyPage;
