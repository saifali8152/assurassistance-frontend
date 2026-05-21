// InvoicesByRegionPage.tsx
//
// Paginated admin view of issued invoices, grouped/filterable by region.
// Mirrors the Sales Ledger UX (filter bar, pagination, CSV export) but anchors on
// the `invoices` table and adds a region summary strip at the top.
//
// Visibility is enforced by the backend:
//   - admin     → every invoice
//   - sub_admin → invoices created by the agencies they own (+ descendants)
//   - agent     → invoices for their own + sub-agents' cases (not currently linked
//                 in nav, but supported if the route is ever exposed to agents)
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  MapPin
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  getInvoiceLedgerApi,
  downloadInvoiceLedgerCsvUrl,
  type InvoiceLedgerRow,
  type InvoiceLedgerRegionSummaryRow,
  type RegionDimension
} from "../api/invoiceLedgerApi";
import { generateInvoiceApi } from "../api/salesApi";
import CountrySearchSelect from "../components/CountrySearchSelect";
import { getCountryLabel } from "../utils/countryLabels";

const ITEMS_PER_PAGE = 25;

const REGION_DIMENSIONS: { value: RegionDimension; tKey: string; fallback: string }[] = [
  { value: "residence", tKey: "invoicesByRegion.regionByResidence", fallback: "Country of residence" },
  { value: "destination", tKey: "invoicesByRegion.regionByDestination", fallback: "Destination" },
  { value: "agent", tKey: "invoicesByRegion.regionByAgent", fallback: "Agent country" }
];

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const InvoicesByRegionPage: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();

  const [rows, setRows] = useState<InvoiceLedgerRow[]>([]);
  const [summary, setSummary] = useState<InvoiceLedgerRegionSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [regionBy, setRegionBy] = useState<RegionDimension>("residence");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalEntries / ITEMS_PER_PAGE)),
    [totalEntries]
  );

  const fetchLedger = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        const res = await getInvoiceLedgerApi({
          page,
          limit: ITEMS_PER_PAGE,
          search: searchTerm,
          paymentStatus: paymentStatusFilter,
          startDate,
          endDate,
          region: regionFilter,
          regionBy
        });
        setRows(res.data || []);
        setSummary(res.regionSummary || []);
        setTotalEntries(res.meta?.total || 0);
      } catch (err) {
        console.error("Failed to load invoices by region:", err);
        toast.error(
          t("invoicesByRegion.loadError", "Failed to load invoices.")
        );
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, paymentStatusFilter, startDate, endDate, regionFilter, regionBy, t]
  );

  // Debounce filter changes — reset to page 1 each time the filter set changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLedger(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, paymentStatusFilter, startDate, endDate, regionFilter, regionBy]);

  // Page navigation
  useEffect(() => {
    fetchLedger(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleClear = () => {
    setSearchTerm("");
    setPaymentStatusFilter("");
    setStartDate("");
    setEndDate("");
    setRegionFilter("");
    setRegionBy("residence");
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const url = downloadInvoiceLedgerCsvUrl({
        search: searchTerm,
        paymentStatus: paymentStatusFilter,
        startDate,
        endDate,
        region: regionFilter,
        regionBy
      });
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to download");
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `invoices_by_region_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("invoicesByRegion.csvSuccess", "CSV downloaded."));
    } catch (err) {
      console.error(err);
      toast.error(t("invoicesByRegion.csvError", "Failed to download CSV."));
    }
  };

  const handleDownloadInvoice = async (row: InvoiceLedgerRow) => {
    try {
      setDownloadingId(row.invoice_id);
      const response = await generateInvoiceApi(row.sale_id);
      const blob = response.data as Blob;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const fileName = row.invoice_number
        ? `${row.invoice_number}.pdf`
        : `invoice_${row.sale_id}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error(
        t("invoicesByRegion.invoiceError", "Failed to download invoice.")
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // For region groups we localize the country name when the dimension is country-based.
  const renderRegionLabel = (raw: string): string => {
    if (!raw || raw === "Unknown") {
      return t("invoicesByRegion.unknownRegion", "Unknown");
    }
    if (regionBy === "destination") {
      // Destinations can be comma-separated; localize each token best-effort.
      return raw
        .split(",")
        .map((token) => {
          const trimmed = token.trim();
          return getCountryLabel(trimmed, i18n.language) || trimmed;
        })
        .join(", ");
    }
    return getCountryLabel(raw, i18n.language) || raw;
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-50 border border-green-200 text-green-600";
      case "Unpaid":
        return "bg-red-50 border border-red-200 text-red-600";
      case "Partial":
        return "bg-amber-50 border border-amber-200 text-amber-700";
      default:
        return "bg-[#D9D9D9]/30 border border-[#D9D9D9] text-[#2B2B2B]/70";
    }
  };

  const totals = useMemo(() => {
    let count = 0;
    let total = 0;
    let paid = 0;
    let unpaid = 0;
    for (const r of summary) {
      count += toNumber(r.invoice_count);
      total += toNumber(r.total_amount);
      paid += toNumber(r.paid_amount);
      unpaid += toNumber(r.unpaid_amount);
    }
    return { count, total, paid, unpaid };
  }, [summary]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E4590F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-[#E4590F] text-2xl font-semibold flex items-center gap-2">
              <Globe2 className="w-6 h-6" />
              {t("invoicesByRegion.title", "Invoices by region")}
            </h2>
            <p className="text-[#2B2B2B]/70 text-sm mt-1 font-normal">
              {user?.role === "sub_admin"
                ? t(
                    "invoicesByRegion.subtitleSubAdmin",
                    "Invoices issued through agencies you manage, grouped by region."
                  )
                : t(
                    "invoicesByRegion.subtitleAdmin",
                    "All invoices issued across the network, grouped by region."
                  )}
            </p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t(
                "invoicesByRegion.searchPlaceholder",
                "Search invoice / policy / name…"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal min-w-[220px]"
            />
            <select
              value={regionBy}
              onChange={(e) => setRegionBy(e.target.value as RegionDimension)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            >
              {REGION_DIMENSIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.tKey, opt.fallback)}
                </option>
              ))}
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            >
              <option value="">
                {t("ledger.allPaymentStatus", "All Payment Status")}
              </option>
              <option value="Paid">
                {t("ledger.paymentStatusPaid", "Paid")}
              </option>
              <option value="Unpaid">
                {t("ledger.paymentStatusUnpaid", "Unpaid")}
              </option>
              <option value="Partial">
                {t("ledger.paymentStatusPartial", "Partial")}
              </option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white rounded-xl transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              {t("ledger.export", "Export")}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("ledger.clear", "Clear")}
            </button>
          </div>
        </div>

        {/* Region dimension picker (only matters when there's an active region filter) */}
        {regionBy !== "destination" && (
          <div className="mb-6 max-w-md">
            <CountrySearchSelect
              value={regionFilter}
              onChange={setRegionFilter}
              placeholder={t(
                "invoicesByRegion.filterByRegionPlaceholder",
                "Filter by region / country (optional)"
              )}
              icon={<MapPin className="w-4 h-4" />}
              label={t("invoicesByRegion.filterByRegion", "Filter by region")}
            />
            {regionFilter && (
              <button
                type="button"
                onClick={() => setRegionFilter("")}
                className="mt-2 text-sm text-[#E4590F] hover:underline"
              >
                {t("invoicesByRegion.clearRegion", "Clear region filter")}
              </button>
            )}
          </div>
        )}
        {regionBy === "destination" && (
          <div className="mb-6 max-w-md">
            <label className="block text-sm font-normal text-[#2B2B2B] mb-2">
              {t("invoicesByRegion.filterByDestination", "Filter by destination")}
            </label>
            <input
              type="text"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              placeholder={t(
                "invoicesByRegion.filterByDestinationPlaceholder",
                "e.g. France"
              )}
              className="w-full px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <p className="text-xs text-[#2B2B2B]/60 mt-1">
              {t(
                "invoicesByRegion.destinationHint",
                "Match is on the comma-separated destination string of each case."
              )}
            </p>
          </div>
        )}

        {/* Aggregate cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-xl p-4">
            <div className="text-xs text-[#2B2B2B]/60 font-normal">
              {t("invoicesByRegion.totalInvoices", "Total invoices")}
            </div>
            <div className="text-xl font-semibold text-[#2B2B2B] mt-1">
              {totals.count.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-xl p-4">
            <div className="text-xs text-[#2B2B2B]/60 font-normal">
              {t("invoicesByRegion.grandTotal", "Total invoiced")}
            </div>
            <div className="text-xl font-semibold text-[#E4590F] mt-1">
              {formatCurrency(totals.total)}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="text-xs text-green-700 font-normal">
              {t("invoicesByRegion.paidTotal", "Paid")}
            </div>
            <div className="text-xl font-semibold text-green-700 mt-1">
              {formatCurrency(totals.paid)}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs text-red-700 font-normal">
              {t("invoicesByRegion.unpaidTotal", "Unpaid")}
            </div>
            <div className="text-xl font-semibold text-red-700 mt-1">
              {formatCurrency(totals.unpaid)}
            </div>
          </div>
        </div>

        {/* Region summary strip */}
        {summary.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#2B2B2B]">
                {t("invoicesByRegion.byRegion", "By region")}
                <span className="ml-2 text-[#2B2B2B]/60 font-normal">
                  (
                  {t(
                    REGION_DIMENSIONS.find((r) => r.value === regionBy)?.tKey || "",
                    REGION_DIMENSIONS.find((r) => r.value === regionBy)?.fallback || ""
                  )}
                  )
                </span>
              </h3>
              {regionFilter && (
                <span className="text-xs text-[#2B2B2B]/60">
                  {t("invoicesByRegion.filteredBy", "Filtered by")}:{" "}
                  <span className="font-medium">{renderRegionLabel(regionFilter)}</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {summary.map((g) => {
                const isActive =
                  regionFilter && regionFilter.toLowerCase() === g.region?.toLowerCase();
                return (
                  <button
                    key={g.region}
                    type="button"
                    onClick={() =>
                      setRegionFilter(isActive ? "" : g.region || "")
                    }
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      isActive
                        ? "bg-[#E4590F]/10 border-[#E4590F] text-[#2B2B2B]"
                        : "bg-white border-[#D9D9D9] hover:bg-[#D9D9D9]/30 text-[#2B2B2B]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        className={`w-4 h-4 ${isActive ? "text-[#E4590F]" : "text-[#2B2B2B]/50"}`}
                      />
                      <span className="font-semibold truncate">
                        {renderRegionLabel(g.region)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="text-xs text-[#2B2B2B]/60">
                        {toNumber(g.invoice_count).toLocaleString()}{" "}
                        {t("invoicesByRegion.invoicesShort", "inv.")}
                      </span>
                      <span className="text-sm font-semibold text-[#E4590F]">
                        {formatCurrency(toNumber(g.total_amount))}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-[#2B2B2B]">
                <div className="w-6 h-6 border-2 border-[#D9D9D9] border-t-[#E4590F] rounded-full animate-spin"></div>
                <span className="font-normal">
                  {t("invoicesByRegion.loading", "Loading invoices…")}
                </span>
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-[#2B2B2B]/40" />
              <h3 className="mt-2 text-sm font-semibold text-[#2B2B2B]">
                {t("invoicesByRegion.empty", "No invoices match the current filters.")}
              </h3>
              <p className="mt-1 text-sm text-[#2B2B2B]/60 font-normal">
                {t(
                  "invoicesByRegion.emptyHint",
                  "Try widening the date range or clearing the region filter."
                )}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("invoicesByRegion.invoice", "Invoice")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                      {t("invoicesByRegion.issueDate", "Issue Date")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("invoicesByRegion.region", "Region")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">
                      {t("invoicesByRegion.traveller", "Traveller")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden xl:table-cell">
                      {t("invoicesByRegion.plan", "Plan")}
                    </th>
                    <th className="text-right text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("invoicesByRegion.total", "Total")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("invoicesByRegion.paymentStatus", "Payment")}
                    </th>
                    {user?.role === "admin" && (
                      <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                        {t("invoicesByRegion.createdBy", "Created By")}
                      </th>
                    )}
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("invoicesByRegion.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.invoice_id}
                      className="border-b border-[#D9D9D9] hover:bg-[#D9D9D9]/30 transition-colors"
                    >
                      <td className="py-4 px-2">
                        <div className="text-[#2B2B2B] font-semibold">
                          {r.invoice_number || `#${r.invoice_id}`}
                        </div>
                        <div className="text-[#2B2B2B]/60 text-sm font-normal">
                          {t("invoicesByRegion.sale", "Sale")} #{r.sale_id}
                          {r.policy_number ? ` · ${r.policy_number}` : ""}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden md:table-cell">
                        <div className="text-sm">{formatDate(r.issue_date)}</div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]">
                        <div className="font-semibold">
                          {renderRegionLabel(r.region)}
                        </div>
                        {regionBy !== "destination" && r.destination && (
                          <div className="text-[#2B2B2B]/60 text-xs font-normal mt-1">
                            → {r.destination}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden lg:table-cell">
                        <div className="font-semibold">{r.traveller_name}</div>
                        {r.traveller_country && (
                          <div className="text-[#2B2B2B]/60 text-xs font-normal">
                            {getCountryLabel(r.traveller_country, i18n.language) ||
                              r.traveller_country}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden xl:table-cell">
                        <div className="font-semibold">{r.plan_name || "-"}</div>
                        {r.product_type && (
                          <div className="text-[#2B2B2B]/60 text-xs font-normal">
                            {r.product_type}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right text-[#2B2B2B]">
                        <div className="font-semibold">
                          {formatCurrency(toNumber(r.total))}
                        </div>
                        {toNumber(r.tax) > 0 && (
                          <div className="text-[#2B2B2B]/60 text-xs font-normal">
                            {t("invoicesByRegion.tax", "Tax")}:{" "}
                            {formatCurrency(toNumber(r.tax))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${getPaymentStatusColor(
                              r.payment_status
                            )}`}
                          >
                            {r.payment_status}
                          </span>
                        </div>
                      </td>
                      {user?.role === "admin" && (
                        <td className="py-4 px-2 text-[#2B2B2B] hidden md:table-cell">
                          <div className="text-sm">
                            {r.created_by_name || "—"}
                          </div>
                          {r.agent_country && (
                            <div className="text-[#2B2B2B]/60 text-xs font-normal">
                              {getCountryLabel(r.agent_country, i18n.language) ||
                                r.agent_country}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(r)}
                            disabled={downloadingId === r.invoice_id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#E4590F]/10 hover:bg-[#E4590F]/20 border border-[#E4590F]/20 text-[#E4590F] rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            title={t("invoicesByRegion.downloadInvoice", "Download invoice")}
                          >
                            {downloadingId === r.invoice_id ? (
                              <div className="w-3 h-3 border-2 border-[#E4590F]/40 border-t-[#E4590F] rounded-full animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            {t("invoicesByRegion.pdf", "PDF")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
                <div className="text-[#2B2B2B]/70 text-sm font-normal">
                  {t("ledger.showing", "Showing")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {totalEntries === 0
                      ? 0
                      : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  {t("ledger.to", "to")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalEntries)}
                  </span>{" "}
                  {t("ledger.of", "of")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {totalEntries}
                  </span>{" "}
                  {t("ledger.results", "results")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {(() => {
                    // Sliding window of up to 5 pages centered on the current page.
                    const window = 5;
                    const start = Math.max(
                      1,
                      Math.min(
                        totalPages - window + 1,
                        currentPage - Math.floor(window / 2)
                      )
                    );
                    const end = Math.min(totalPages, start + window - 1);
                    const pages: number[] = [];
                    for (let p = start; p <= end; p++) pages.push(p);
                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          page === currentPage
                            ? "bg-[#E4590F] text-white"
                            : "bg-[#D9D9D9] text-[#2B2B2B] hover:bg-[#B8B8B8]"
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesByRegionPage;
