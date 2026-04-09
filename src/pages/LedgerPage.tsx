// LedgerPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getLedgerApi, downloadLedgerCsvApi } from "../api/ledgerApi";
import { updatePaymentApi } from "../api/salesApi";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface LedgerEntry {
  sale_id: number;
  case_id: number;
  agent_id: number;
  created_by_name: string;
  traveller_name: string;
  traveller_phone: string;
  plan_name: string;
  product_type: string;
  policy_number: string;
  certificate_number: string;
  plan_price?: number;
  premium_amount: number;
  tax: number;
  total: number;
  received_amount: number;
  payment_notes: string;
  payment_status: string;
  confirmed_at: string;
}

/** Amount due: plan premium rate + tax (not sums of coverage limits). */
function billableTotal(entry: LedgerEntry): number {
  const pp = Number(entry.plan_price);
  if (Number.isFinite(pp) && pp > 0) {
    return pp + (Number(entry.tax) || 0);
  }
  return Number(entry.total) || 0;
}

const LedgerPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const itemsPerPage = 25;

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
    } catch (error) {
      console.error("Failed to fetch ledger:", error);
      toast.error("Failed to load ledger entries");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Always call API when any filter changes, including when filters are cleared
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
      toast.success("CSV downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download CSV");
    }
  };

  const handlePaymentStatusChange = (entry: LedgerEntry, newStatus: string) => {
    if (newStatus === "Paid" && entry.payment_status === "Unpaid") {
      const due = billableTotal(entry);
      const updatedEntry = { ...entry, received_amount: due };
      setSelectedEntry(updatedEntry);
      setShowConfirmModal(true);
    } else {
      handleSave(
        entry.sale_id.toString(),
        newStatus,
        entry.payment_notes,
        entry.received_amount
      );
    }
  };

  const confirmPaymentStatusChange = async () => {
    if (selectedEntry) {
      await handleSave(
        selectedEntry.sale_id.toString(),
        "Paid",
        selectedEntry.payment_notes,
        selectedEntry.received_amount
      );
      setShowConfirmModal(false);
      setSelectedEntry(null);
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
      toast.success("Payment status updated successfully");
      await fetchLedger(
        currentPage,
        searchTerm,
        paymentStatusFilter,
        startDate,
        endDate
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update payment status");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#E4590F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* --- Sales Ledger Table Section --- */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-[#E4590F] text-2xl font-semibold">
            {user?.role === "admin"
              ? t("ledger.allSales", "All Sales")
              : t("ledger.mySales", "My Sales")}
          </h2>

          {/* Search and Filter Controls */}
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
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <input
              type="date"
              placeholder="End Date"
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
                <span className="font-normal">{t("ledger.loading", "Loading sales...")}</span>
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.saleId", "Sale ID")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">
                      {t("ledger.traveller", "Traveller")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">
                      {t("ledger.plan", "Plan")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">
                      {t("ledger.total", "Total")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">
                      {t("ledger.confirmedAt", "Confirmed At")}
                    </th>
                    <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2">
                      {t("ledger.paymentStatus", "Payment Status")}
                    </th>
                    {user?.role === "admin" && (
                      <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden md:table-cell">
                        {t("ledger.createdBy", "Created By")}
                      </th>
                    )}
                    {user?.role === "admin" && (
                      <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">
                        {t("ledger.actions", "Actions")}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr
                      key={entry.sale_id}
                      className="border-b border-[#D9D9D9] hover:bg-[#D9D9D9]/30 transition-colors"
                    >
                      <td className="py-4 px-2">
                        <div className="text-[#2B2B2B] font-semibold">
                          Sale #{entry.sale_id}
                        </div>
                        <div className="text-[#2B2B2B]/60 text-sm font-normal">
                          Case #{entry.case_id}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden sm:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] font-semibold">
                            {entry.traveller_name}
                          </div>
                          <div className="text-[#2B2B2B]/60 text-sm font-normal">
                            {entry.traveller_phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden lg:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] font-semibold">
                            {entry.plan_name}
                          </div>
                          <div className="text-[#2B2B2B]/60 text-sm font-normal">
                            {entry.product_type}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden sm:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] font-semibold">
                            {formatCurrency(billableTotal(entry))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B] hidden sm:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] text-sm font-normal">
                            {entry.confirmed_at
                              ? formatDate(entry.confirmed_at)
                              : "-"}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-lg ${getPaymentStatusColor(
                              entry.payment_status
                            )}`}
                          >
                            {entry.payment_status}
                          </span>
                        </div>
                      </td>
                      {user?.role === "admin" && (
                        <td className="py-4 px-2 text-[#2B2B2B] hidden md:table-cell">
                          <div className="text-center">
                            <div className="text-[#2B2B2B] font-semibold">
                              {entry.created_by_name || "Unknown"}
                            </div>
                          </div>
                        </td>
                      )}
                      {user?.role === "admin" && (
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={entry.payment_status}
                              onChange={(e) => {
                                const updatedRows = rows.map((row) =>
                                  row.sale_id === entry.sale_id
                                    ? { ...row, payment_status: e.target.value }
                                    : row
                                );
                                setRows(updatedRows);
                                handlePaymentStatusChange(
                                  entry,
                                  e.target.value
                                );
                              }}
                              disabled={entry.payment_status === "Paid"}
                              className="px-2 py-1 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] text-sm focus:outline-none focus:ring-2 focus:ring-[#E4590F] disabled:opacity-50 font-normal"
                            >
                              <option value="Unpaid">
                                {t("ledger.paymentStatusUnpaid", "Unpaid")}
                              </option>
                              <option value="Paid">
                                {t("ledger.paymentStatusPaid", "Paid")}
                              </option>
                            </select>
                            {entry.payment_status != "Paid" && (
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
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
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
                  <span className="font-semibold text-[#2B2B2B]">{totalEntries}</span>{" "}
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

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
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
                    );
                  })}

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

      {/* Confirmation Modal */}
      {showConfirmModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">
                {t("ledger.confirmPayment", "Confirm Payment")}
              </h3>
              <button
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
                    {t(
                      "ledger.confirmPaymentTitle",
                      "Are you sure you want to mark this sale as paid?"
                    )}
                  </p>
                  <p className="text-[#2B2B2B]/70 text-sm mt-1 font-normal">
                    Sale #{selectedEntry.sale_id} -{" "}
                    {selectedEntry.traveller_name}
                  </p>
                </div>
              </div>
              <div className="bg-[#D9D9D9]/30 border border-[#D9D9D9] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#2B2B2B]/70 text-sm font-normal">Total Amount:</span>
                  <span className="text-[#2B2B2B] font-semibold">
                    {formatCurrency(billableTotal(selectedEntry))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#2B2B2B]/70 text-sm font-normal">
                    Received Amount:
                  </span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(selectedEntry.received_amount)}
                  </span>
                </div>
              </div>
              <p className="text-[#2B2B2B]/60 text-sm font-normal">
                {t(
                  "ledger.confirmPaymentMessage",
                  "This action cannot be undone. The payment status will be permanently changed to 'Paid'."
                )}
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#D9D9D9]">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
              >
                {t("ledger.cancel", "Cancel")}
              </button>
              <button
                onClick={confirmPaymentStatusChange}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
              >
                {t("ledger.confirm", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;
