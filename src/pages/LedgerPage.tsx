// src/pages/LedgerPage.tsx
import React, { useState, useEffect } from "react";
import { getLedgerApi, downloadLedgerCsvApi } from "../api/ledgerApi";
import { apiGet } from "../lib/api"; // for direct fetch (blob)

const LedgerPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
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
      // Use token from localStorage
      const token = localStorage.getItem("token");
      const urlPath = downloadLedgerCsvApi(filters); // returns path like /api/ledger/export?... 
      const res = await fetch(urlPath, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_ledger_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download CSV");
    }
  };

  return (
    <div>
      <h1>Sales Ledger</h1>

      {/* Filters row (simplified) */}
      <div className="flex gap-2 mb-4">
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value}))} />
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({...f, endDate: e.target.value}))} />
        <input placeholder="Search name/policy/plan" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))} />
        <button onClick={() => load(1)}>Apply</button>
        <button onClick={handleExport}>Export CSV</button>
      </div>

      {/* Table */}
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Sale ID</th><th>Traveller</th><th>Plan</th><th>Total</th><th>Payment</th><th>Confirmed At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.sale_id}>
              <td>{r.sale_id}</td>
              <td>{r.traveller_name} ({r.traveller_phone})</td>
              <td>{r.plan_name}</td>
              <td>{Number(r.total).toFixed(2)}</td>
              <td>{r.payment_status}</td>
              <td>{r.confirmed_at ? new Date(r.confirmed_at).toLocaleString() : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4">
        <button disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
        <span> Page {page} </span>
        <button disabled={page * limit >= total} onClick={() => load(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default LedgerPage;
