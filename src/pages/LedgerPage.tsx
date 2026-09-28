// LedgerPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getLedgerApi, downloadLedgerCsvApi } from "../api/ledgerApi";
import {
  updatePaymentApi,
  softDeleteSaleApi,
  POLICY_DELETION_REASONS,
  type PolicyDeletionReason,
} from "../api/salesApi";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Receipt,
  Landmark,
  Wallet,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface LedgerEntry {
  sale_id: number;
  case_id: number;
  agent_id: number;
  created_by_name: string;
  first_name?: string;
  last_name?: string;
  traveller_name: string;
  traveller_phone: string;
  date_of_birth?: string | null;
  destination?: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  plan_name: string;
  product_type: string;
  policy_number: string;
  certificate_number: string;
  plan_price?: number | null;
  plan_premium?: number;
  premium_amount: number;
  tax: number;
  total: number;
  premium_including_tax?: number;
  commission?: number;
  agency_commission?: number;
  net_to_transfer?: number;
  currency?: string;
  received_amount: number;
  payment_notes: string;
  payment_status: string;
  confirmed_at: string;
  payment_reverse_count?: number;
  payment_reverses_remaining?: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deletion_reason?: string | null;
}

interface LedgerSummary {
  totalPolicies: number;
  totalPremiums: number;
  totalCollected: number;
  totalCommissions: number;
  netToTransfer: number;
}

/** Amount due: plan premium rate + tax (matches partner invoice line total). */
function billableTotal(entry: LedgerEntry): number {
  if (entry.plan_premium != null && Number.isFinite(Number(entry.plan_premium))) {
    return Number(entry.plan_premium) + (Number(entry.tax) || 0);
  }
  const pp = Number(entry.plan_price);
  if (Number.isFinite(pp) && pp > 0) {
    return pp + (Number(entry.tax) || 0);
  }
  return Number(entry.total) || 0;
}

const LedgerPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency, formatFrom } = useCurrency();
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"markPaid" | "reversePaid">("markPaid");
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; entry: LedgerEntry | null }>({
    open: false,
    entry: null,
  });
  const [deletionReason, setDeletionReason] = useState<PolicyDeletionReason | "">("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const itemsPerPage = 25;
  const isAdmin = user?.role === "admin";
  const showCreatedBy = user?.role === "admin" || user?.role === "sub_admin" || user?.role === "insurer_supervisor";

  const titleKey =
    user?.role === "admin"
      ? "ledger.allSales"
      : user?.role === "sub_admin"
        ? "ledger.networkSales"
        : user?.role === "insurer_supervisor"
          ? "ledger.insurerSales"
          : "ledger.mySales";
  const titleDefault =
    user?.role === "admin"
      ? "All Sales"
      : user?.role === "sub_admin"
        ? "Network sales"
        : user?.role === "insurer_supervisor"
          ? "Insurer plan sales"
          : "My Sales";

  const fetchLedger = async (
    page: number = 1,
    search: string = "",
    paymentStatus: string = "",
    start: string = "",
    end: string = ""
  ) => {
    try {
      setLoading(true);
      const response = await getLedgerApi({
        page,
        limit: itemsPerPage,
        search,
        paymentStatus,
        startDate: start,
        endDate: end,
      });

      const data = response as any;
      setRows(data.data || []);
      setTotalEntries(data.meta?.total || 0);
      setTotalPages(Math.ceil((data.meta?.total || 0) / itemsPerPage));
      setSummary(data.meta?.summary || null);
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
      toast.error(t("ledger.loadFailed", "Failed to load ledger entries"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchLedger(1, searchTerm, paymentStatusFilter, startDate, endDate);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, paymentStatusFilter, startDate, endDate]);

  useEffect(() => {
    fetchLedger(
      currentPage,
      searchTerm,
      paymentStatusFilter,
      startDate,
      endDate
    );
  }, [currentPage]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const url = downloadLedgerCsvApi({
        search: searchTerm,
        paymentStatus: paymentStatusFilter,
        startDate,
        endDate,
      });

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "Failed to download");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sales_ledger_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("ledger.exportSuccess", "CSV downloaded successfully"));
    } catch (err) {
      console.error(err);
      toast.error(t("ledger.exportFailed", "Failed to download CSV"));
    }
  };

  const handlePaymentStatusChange = (entry: LedgerEntry, newStatus: string) => {
    if (entry.is_deleted) {
      toast.error(t("ledger.deletedNoPayment", "Cannot change payment on a deleted policy"));
      return;
    }
    if (newStatus === "Paid" && entry.payment_status === "Unpaid") {
      const due = billableTotal(entry);
      setSelectedEntry({ ...entry, received_amount: due });
      setConfirmMode("markPaid");
      setShowConfirmModal(true);
      return;
    }
    if (newStatus === "Unpaid" && entry.payment_status === "Paid") {
      const remaining = entry.payment_reverses_remaining ?? 0;
      if (remaining <= 0) {
        toast.error(
          t(
            "ledger.reverseLimitReached",
            "This policy has already been reversed the maximum of 2 times"
          )
        );
        return;
      }
      setSelectedEntry(entry);
      setConfirmMode("reversePaid");
      setShowConfirmModal(true);
      return;
    }
    handleSave(
      entry.sale_id.toString(),
      newStatus,
      entry.payment_notes,
      entry.received_amount
    );
  };

  const confirmPaymentStatusChange = async () => {
    if (!selectedEntry) return;
    if (confirmMode === "reversePaid") {
      await handleSave(
        selectedEntry.sale_id.toString(),
        "Unpaid",
        selectedEntry.payment_notes,
        0
      );
    } else {
      await handleSave(
        selectedEntry.sale_id.toString(),
        "Paid",
        selectedEntry.payment_notes,
        selectedEntry.received_amount
      );
    }
    setShowConfirmModal(false);
    setSelectedEntry(null);
  };

  const confirmSoftDelete = async () => {
    if (!deleteModal.entry || !deletionReason) {
      toast.error(t("ledger.deleteReasonRequired", "Select a deletion reason"));
      return;
    }
    setIsDeleting(true);
    try {
      await softDeleteSaleApi(deleteModal.entry.sale_id, deletionReason);
      toast.success(
        t(
          "ledger.deleteSuccess",
          "Policy deleted. It remains visible with premium and commission at 0."
        )
      );
      setDeleteModal({ open: false, entry: null });
      setDeletionReason("");
      await fetchLedger(
        currentPage,
        searchTerm,
        paymentStatusFilter,
        startDate,
        endDate
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          t("ledger.deleteFailed", "Could not delete policy")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (
    saleId: string,
    payment_status: string,
    payment_notes: string,
    received_amount: number
  ) => {
    try {
      setActionLoading(parseInt(saleId));
      await updatePaymentApi(
        saleId,
        payment_status,
        payment_notes,
        received_amount
      );
      toast.success(t("ledger.paymentUpdated", "Payment status updated successfully"));
      await fetchLedger(
        currentPage,
        searchTerm,
        paymentStatusFilter,
        startDate,
        endDate
      );
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          t("ledger.paymentUpdateFailed", "Failed to update payment status")
      );
      await fetchLedger(
        currentPage,
        searchTerm,
        paymentStatusFilter,
        startDate,
        endDate
      );
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-50 border border-green-200 text-green-600";
      case "Unpaid":
        return "bg-red-50 border border-red-200 text-red-600";
      default:
        return "bg-[#D9D9D9]/30 border border-[#D9D9D9] text-[#2B2B2B]/70";
    }
  };

  const amount = (value: number, currency?: string) =>
    formatFrom(value, currency || "XOF");

  const summaryCards = summary
    ? [
        {
          icon: Receipt,
          label: t("ledger.summaryPolicies", "Total policies issued"),
          value: String(summary.totalPolicies),
          sub: t("ledger.summaryPremiums", "Premiums (incl. tax): {{amount}}", {
            amount: formatCurrency(summary.totalPremiums),
          }),
        },
        {
          icon: Landmark,
          label: t("ledger.summaryCommissions", "Total commissions"),
          value: formatCurrency(summary.totalCommissions),
          sub: t("ledger.summaryCollected", "Collected: {{amount}}", {
            amount: formatCurrency(summary.totalCollected),
          }),
        },
        {
          icon: Wallet,
          label: t("ledger.summaryNet", "Total net amount to be transferred"),
          value: formatCurrency(summary.netToTransfer),
          sub: t(
            "ledger.summaryNetHint",
            "Premiums − commissions (same as partner invoices)"
          ),
        },
      ]
    : [];

  if (loading && rows.length === 0 && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E4590F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {t("ledger.title", "Sales Ledger")}
        </h1>
        <p className="mt-1 text-sm text-[#2B2B2B]/70 max-w-3xl">
          {t(
            "ledger.subtitle",
            "Financial consolidation view aligned with partner invoices: premiums, commissions and net amount to transfer."
          )}
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[#D9D9D9] bg-white p-4"
            >
              <div className="flex items-center gap-2 text-[#2B2B2B]/70">
                <card.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1A1A1A]">
                {card.value}
              </div>
              {card.sub && (
                <div className="mt-0.5 text-xs text-[#2B2B2B]/60">{card.sub}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-[#E4590F] text-2xl font-semibold">
            {t(titleKey, titleDefault)}
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t("ledger.search", "Search sales...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
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
              onClick={() => {
                setCurrentPage(1);
                fetchLedger(
                  1,
                  searchTerm,
                  paymentStatusFilter,
                  startDate,
                  endDate
                );
              }}
              className="px-4 py-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white rounded-xl transition-colors font-medium"
            >
              {t("ledger.search", "Search")}
            </button>
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
              onClick={() => {
                setSearchTerm("");
                setPaymentStatusFilter("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
                fetchLedger(1, "", "", "", "");
              }}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("ledger.clear", "Clear")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-[#2B2B2B]">
                <div className="w-6 h-6 border-2 border-[#D9D9D9] border-t-[#E4590F] rounded-full animate-spin"></div>
                <span className="font-normal">
                  {t("ledger.loading", "Loading sales...")}
                </span>
              </div>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-[#2B2B2B]/40" />
              <h3 className="mt-2 text-sm font-semibold text-[#2B2B2B]">
                {t("ledger.noSales", "No sales found")}
              </h3>
              <p className="mt-1 text-sm text-[#2B2B2B]/60 font-normal">
                {user?.role === "admin"
                  ? t("ledger.noSalesAdmin", "No sales have been recorded yet.")
                  : t("ledger.noSalesAgent", "You don't have any sales yet.")}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.saleId", "Sale")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.lastName", "Last name")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">
                      {t("ledger.firstName", "First name")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                      {t("ledger.dateOfBirth", "Date of birth")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">
                      {t("ledger.travelDates", "Travel dates")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden xl:table-cell">
                      {t("ledger.destination", "Destination(s)")}
                    </th>
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">
                      {t("ledger.plan", "Plan")}
                    </th>
                    <th className="text-right text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                      {t("ledger.premiumInclTax", "Premium incl. tax")}
                    </th>
                    <th className="text-right text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.agencyCommission", "Agency commission")}
                    </th>
                    <th className="text-right text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.netToTransfer", "Net to transfer")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.paymentStatus", "Payment")}
                    </th>
                    {showCreatedBy && (
                      <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                        {t("ledger.createdBy", "Created By")}
                      </th>
                    )}
                    {isAdmin && (
                      <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                        {t("ledger.actions", "Actions")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => {
                    const currency = entry.currency || "XOF";
                    const commission =
                      Number(entry.agency_commission ?? entry.commission) || 0;
                    const net =
                      entry.net_to_transfer != null
                        ? Number(entry.net_to_transfer)
                        : billableTotal(entry) - commission;
                    const deleted = !!entry.is_deleted;
                    const canReverse =
                      entry.payment_status === "Paid" &&
                      (entry.payment_reverses_remaining ?? 0) > 0 &&
                      !deleted;
                    const rowMuted = deleted
                      ? "text-gray-400 bg-gray-50/80"
                      : "text-[#2B2B2B]";
                    const lastName =
                      entry.last_name ||
                      entry.traveller_name?.split(/\s+/).slice(-1)[0] ||
                      "—";
                    const firstName =
                      entry.first_name ||
                      entry.traveller_name?.split(/\s+/).slice(0, -1).join(" ") ||
                      "—";
                    return (
                      <tr
                        key={entry.sale_id}
                        className={`border-b border-[#D9D9D9] transition-colors ${
                          deleted
                            ? "bg-gray-100/90 text-gray-400"
                            : "hover:bg-[#D9D9D9]/30"
                        }`}
                      >
                        <td className={`py-4 px-2 ${rowMuted}`}>
                          <div className={`font-semibold ${deleted ? "text-gray-400" : "text-[#2B2B2B]"}`}>
                            #{entry.sale_id}
                          </div>
                          <div className="text-xs font-normal opacity-80">
                            {entry.policy_number || `Case #${entry.case_id}`}
                          </div>
                          {deleted && (
                            <div className="text-[10px] uppercase tracking-wide mt-1 text-gray-500">
                              {t("ledger.deletedBadge", "Deleted")}
                              {entry.deletion_reason
                                ? ` · ${entry.deletion_reason}`
                                : ""}
                            </div>
                          )}
                        </td>
                        <td className={`py-4 px-2 font-semibold ${rowMuted}`}>{lastName}</td>
                        <td className={`py-4 px-2 hidden sm:table-cell ${rowMuted}`}>{firstName}</td>
                        <td className={`py-4 px-2 hidden md:table-cell text-xs ${rowMuted}`}>
                          {entry.date_of_birth
                            ? formatDate(entry.date_of_birth)
                            : "—"}
                        </td>
                        <td className={`py-4 px-2 hidden lg:table-cell text-xs ${rowMuted}`}>
                          {entry.start_date || entry.end_date ? (
                            <>
                              <div>{entry.start_date ? formatDate(entry.start_date) : "—"}</div>
                              <div className="opacity-70">
                                → {entry.end_date ? formatDate(entry.end_date) : "—"}
                              </div>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`py-4 px-2 hidden xl:table-cell text-xs max-w-[10rem] truncate ${rowMuted}`}
                          title={entry.destination || ""}
                        >
                          {entry.destination || "—"}
                        </td>
                        <td className={`py-4 px-2 hidden lg:table-cell ${rowMuted}`}>
                          <div className="font-semibold">{entry.plan_name}</div>
                          <div className="text-xs opacity-80">{entry.product_type}</div>
                        </td>
                        <td className={`py-4 px-2 text-right hidden md:table-cell font-semibold ${rowMuted}`}>
                          {amount(
                            entry.premium_including_tax != null
                              ? Number(entry.premium_including_tax)
                              : billableTotal(entry),
                            currency
                          )}
                        </td>
                        <td
                          className={`py-4 px-2 text-right font-semibold ${
                            deleted ? "text-gray-400" : "text-[#E4590F]"
                          }`}
                        >
                          {amount(commission, currency)}
                        </td>
                        <td className={`py-4 px-2 text-right font-semibold ${rowMuted}`}>
                          {amount(net, currency)}
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex justify-center">
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${
                                deleted
                                  ? "bg-gray-200 text-gray-500 border border-gray-300"
                                  : getPaymentStatusColor(entry.payment_status)
                              }`}
                            >
                              {entry.payment_status}
                            </span>
                          </div>
                        </td>
                        {showCreatedBy && (
                          <td className={`py-4 px-2 hidden md:table-cell ${rowMuted}`}>
                            {entry.created_by_name || "—"}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!deleted && (
                                <>
                                  <select
                                    value={entry.payment_status}
                                    onChange={(e) => {
                                      handlePaymentStatusChange(
                                        entry,
                                        e.target.value
                                      );
                                    }}
                                    disabled={
                                      entry.payment_status === "Paid" && !canReverse
                                    }
                                    className="px-2 py-1 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] text-sm focus:outline-none focus:ring-2 focus:ring-[#E4590F] disabled:opacity-50 font-normal"
                                    title={
                                      entry.payment_status === "Paid"
                                        ? t(
                                            "ledger.reverseRemaining",
                                            "{{count}} reverse(s) remaining",
                                            {
                                              count:
                                                entry.payment_reverses_remaining ?? 0,
                                            }
                                          )
                                        : undefined
                                    }
                                  >
                                    <option value="Unpaid">
                                      {t("ledger.paymentStatusUnpaid", "Unpaid")}
                                    </option>
                                    <option value="Paid">
                                      {t("ledger.paymentStatusPaid", "Paid")}
                                    </option>
                                  </select>
                                  {entry.payment_status === "Paid" && (
                                    <span className="text-[10px] text-[#2B2B2B]/50 whitespace-nowrap">
                                      {t(
                                        "ledger.reverseRemaining",
                                        "{{count}} reverse(s) remaining",
                                        {
                                          count:
                                            entry.payment_reverses_remaining ?? 0,
                                        }
                                      )}
                                    </span>
                                  )}
                                  {entry.payment_status !== "Paid" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSave(
                                          entry.sale_id.toString(),
                                          entry.payment_status,
                                          entry.payment_notes,
                                          entry.received_amount
                                        )
                                      }
                                      disabled={actionLoading === entry.sale_id}
                                      className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 text-sm rounded-lg"
                                    >
                                      {actionLoading === entry.sale_id ? (
                                        <div className="w-3 h-3 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                                      ) : (
                                        <CheckCircle className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                              {!deleted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletionReason("");
                                    setDeleteModal({ open: true, entry });
                                  }}
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors"
                                  title={t("ledger.deletePolicy", "Delete policy")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {summary && (
                <div className="mt-4 rounded-xl border border-[#E4590F]/25 bg-[#E4590F]/5 px-4 py-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-8">
                    <div className="flex justify-between sm:gap-3">
                      <span className="text-[#2B2B2B]/70">
                        {t("ledger.summaryPolicies", "Total policies issued")}
                      </span>
                      <span className="font-semibold">{summary.totalPolicies}</span>
                    </div>
                    <div className="flex justify-between sm:gap-3">
                      <span className="text-[#2B2B2B]/70">
                        {t("ledger.summaryCommissions", "Total commissions")}
                      </span>
                      <span className="font-semibold text-[#E4590F]">
                        {formatCurrency(summary.totalCommissions)}
                      </span>
                    </div>
                    <div className="flex justify-between sm:gap-3">
                      <span className="text-[#2B2B2B]/70">
                        {t("ledger.summaryNet", "Total net amount to be transferred")}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(summary.netToTransfer)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
                <div className="text-[#2B2B2B]/70 text-sm font-normal">
                  {t("ledger.showing", "Showing")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  {t("ledger.to", "to")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {Math.min(currentPage * itemsPerPage, totalEntries)}
                  </span>{" "}
                  {t("ledger.of", "of")}{" "}
                  <span className="font-semibold text-[#2B2B2B]">
                    {totalEntries}
                  </span>{" "}
                  {t("ledger.results", "results")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        type="button"
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
                    );
                  })}

                  <button
                    type="button"
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

      {showConfirmModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">
                {confirmMode === "reversePaid"
                  ? t("ledger.confirmReverse", "Reverse paid status")
                  : t("ledger.confirmPayment", "Confirm Payment")}
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-lg bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-[#E4590F]" />
                <div>
                  <p className="text-[#2B2B2B] font-semibold">
                    {confirmMode === "reversePaid"
                      ? t(
                          "ledger.confirmReverseTitle",
                          "Mark this policy as Unpaid? This counts toward the limit of 2 reverses."
                        )
                      : t(
                          "ledger.confirmPaymentTitle",
                          "Are you sure you want to mark this sale as paid?"
                        )}
                  </p>
                  <p className="text-[#2B2B2B]/70 text-sm mt-1 font-normal">
                    Sale #{selectedEntry.sale_id} · Case #{selectedEntry.case_id} —{" "}
                    {selectedEntry.traveller_name}
                  </p>
                  {confirmMode === "reversePaid" && (
                    <p className="text-[#2B2B2B]/60 text-xs mt-1">
                      {t(
                        "ledger.reverseRemaining",
                        "{{count}} reverse(s) remaining",
                        {
                          count: selectedEntry.payment_reverses_remaining ?? 0,
                        }
                      )}
                    </p>
                  )}
                </div>
              </div>
              {confirmMode === "markPaid" && (
                <div className="bg-[#D9D9D9]/30 border border-[#D9D9D9] rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#2B2B2B]/70 text-sm font-normal">
                      {t("ledger.total", "Total")}
                    </span>
                    <span className="text-[#2B2B2B] font-semibold">
                      {amount(
                        billableTotal(selectedEntry),
                        selectedEntry.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2B2B2B]/70 text-sm font-normal">
                      {t("ledger.receivedAmount", "Received Amount")}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {amount(
                        selectedEntry.received_amount,
                        selectedEntry.currency
                      )}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[#2B2B2B]/60 text-sm font-normal">
                {confirmMode === "reversePaid"
                  ? t(
                      "ledger.confirmReverseMessage",
                      "The change is recorded in the audit log. Maximum two reverses per policy."
                    )
                  : t(
                      "ledger.confirmPaymentMessage",
                      "This action cannot be undone. The payment status will be permanently changed to 'Paid'."
                    )}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#D9D9D9]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
              >
                {t("ledger.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmPaymentStatusChange}
                className={`px-4 py-2 text-white rounded-xl transition-colors font-medium ${
                  confirmMode === "reversePaid"
                    ? "bg-[#E4590F] hover:bg-[#C94A0D]"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {t("ledger.confirm", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && deleteModal.entry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#E4590F] text-xl font-semibold">
                {t("ledger.deletePolicy", "Delete policy")}
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, entry: null })}
                className="p-2 rounded-lg bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#2B2B2B]/80 mb-2">
              Sale #{deleteModal.entry.sale_id} · Case #{deleteModal.entry.case_id}
            </p>
            <p className="text-sm text-[#2B2B2B]/60 mb-4">
              {t(
                "ledger.deleteHelp",
                "The policy stays visible (gray) with premium and commission set to 0 FCFA. Choose a reason:"
              )}
            </p>
            <label className="block text-xs font-medium text-[#2B2B2B]/70 mb-1">
              {t("ledger.deleteReason", "Reason")} *
            </label>
            <select
              value={deletionReason}
              onChange={(e) =>
                setDeletionReason(e.target.value as PolicyDeletionReason | "")
              }
              className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-[#E4590F]"
            >
              <option value="">
                {t("ledger.deleteReasonPlaceholder", "Select a reason…")}
              </option>
              {POLICY_DELETION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r === "Test policy"
                    ? t("ledger.reason.test", "Test policy")
                    : r === "Customer desistement"
                      ? t("ledger.reason.desistement", "Customer desistement")
                      : r === "Error or duplicate"
                        ? t("ledger.reason.duplicate", "Error or duplicate")
                        : t("ledger.reason.cancellation", "Cancellation before reversal")}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, entry: null })}
                className="px-4 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium"
              >
                {t("ledger.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmSoftDelete}
                disabled={isDeleting || !deletionReason}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {isDeleting
                  ? t("ledger.deleting", "Deleting…")
                  : t("ledger.confirmDelete", "Delete policy")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;
