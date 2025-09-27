import React, { useState, useEffect } from "react";
import { getLedgerApi, downloadLedgerCsvApi } from "../api/ledgerApi";
//import { apiGet } from "../lib/api"; // for direct fetch (blob)
import { Search, Download, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import InputField from "../components/InputFields";
import DateField from "../components/DateField";
import { updatePaymentApi } from "../api/salesApi";
const LedgerPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", status: "", paymentStatus: "", search: "" });

  const load = async (p = 1) => {
    try {
      const res: any = await getLedgerApi({ ...filters, page: p, limit });
      if (res && res.data) {
        setRows(res.data);
        setTotal(res.meta?.total || 0);
        setPage(res.meta?.page || 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(1); }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = downloadLedgerCsvApi(filters);

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });

      if (!res.ok) throw new Error("Failed to download");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sales_ledger_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to download CSV");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') load(1);
  };

  const handleSave = async (saleId: string, payment_status: string, payment_notes: string, received_amount: number) => {
    try {
      await updatePaymentApi(saleId, payment_status, payment_notes, received_amount);
      alert("Changes saved successfully!");
      load(page);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Sales Ledger</h1>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4">

        {/* Search */}
        <div className="relative flex-1">
          <InputField
            type="text"
            placeholder="Search name/policy/plan"
            icon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
            value={filters.search}
            onChange={(val) => setFilters((f) => ({ ...f, search: val }))}
            onKeyDown={handleKeyDown}
            className="w-full"
            showValidation={false}
          />
        </div>

        {/* Start date */}
        <DateField
          placeholder="Start date"
          icon={<Calendar />}
          value={filters.startDate}
          onChange={(val) => setFilters((f) => ({ ...f, startDate: val }))}
          minDate="2020-01-01" // optional
          maxDate={filters.endDate || undefined}
        />

        {/* End date */}
        <DateField
          placeholder="End date"
          icon={<Calendar />}
          value={filters.endDate}
          onChange={(val) => setFilters((f) => ({ ...f, endDate: val }))}
          minDate={filters.startDate || undefined}
          maxDate={new Date().toISOString().split('T')[0]}
        />
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => load(1)}
            className="px-10 py-2 bg-white/20 border border-white/20 rounded-2xl text-white transition-colors cursor-pointer"
          >
            Apply
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 border border-white/20 rounded-2xl cursor-pointer text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full">
          <thead className="border-b border-white/20">
            <tr>
              <th className="px-4 py-3 text-white font-medium">Sale ID</th>
              <th className="px-4 py-3 text-white font-medium">Traveller</th>
              <th className="px-4 py-3 text-white font-medium">Plan</th>
              <th className="px-4 py-3 text-white font-medium">Total</th>
              <th className="px-4 py-3 text-white font-medium">Received Amount</th>
              <th className="px-4 py-3 text-white font-medium">Payment</th>
              <th className="px-4 py-3 text-white font-medium">Confirmed At</th>
              <th className="px-4 py-3 text-white font-medium">Payment Status</th>
              <th className="px-4 py-3 text-white font-medium">Notes</th>
              <th className="px-4 py-3 text-white font-medium">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map(r => (
              <tr key={r.sale_id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white">{r.sale_id}</td>
                <td className="px-4 py-3 text-white">
                  <div>{r.traveller_name}</div>
                  {/* <div className="text-sm text-white/70">({r.traveller_phone})</div> */}
                </td>
                <td className="px-4 py-3 text-white">{r.plan_name}</td>
                <td className="px-4 py-3 text-white font-medium">{Number(r.total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={r.received_amount || ""}
                    onChange={(e) => {
                      const updatedRows = rows.map(row =>
                        row.sale_id === r.sale_id ? { ...row, received_amount: parseFloat(e.target.value) || 0 } : row
                      );
                      setRows(updatedRows);
                    }}
                    className="w-24 p-1 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                  />
                </td>
                <td className="px-4 py-3 text-white">{r.payment_status}</td>
                <td className="px-4 py-3 text-white">
                  {r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : ""}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={r.payment_status}
                    onChange={(e) => {
                      const updatedRows = rows.map(row =>
                        row.sale_id === r.sale_id ? { ...row, payment_status: e.target.value } : row
                      );
                      setRows(updatedRows);
                    }}
                    className="bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <textarea
                    value={r.payment_notes || ""}
                    onChange={(e) => {
                      const updatedRows = rows.map(row =>
                        row.sale_id === r.sale_id ? { ...row, payment_notes: e.target.value } : row
                      );
                      setRows(updatedRows);
                    }}
                    rows={2}
                    className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSave(r.sale_id, r.payment_status, r.payment_notes, r.received_amount)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    Save
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-white/70 text-sm">
          Showing {rows.length} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="px-3 py-2 text-white">Page {page}</span>
          <button
            disabled={page * limit >= total}
            onClick={() => load(page + 1)}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 rounded-lg text-white transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LedgerPage;