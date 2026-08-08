// PartnerInvoicesPage.tsx
//
// Generate period invoices per partner (travel agency, corporate desk, …).
// Admins see every top-level partner; sub-administrators only the agencies
// under their supervision. After loading the period preview, operators can
// uncheck individual sales and apply a percentage discount to total premiums
// and total commissions before downloading the PDF.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Download, FileText, Landmark, Receipt, Wallet } from "lucide-react";
import {
  downloadPartnerInvoicePdfApi,
  getInvoicePartnersApi,
  getPartnerInvoiceApi,
  getPartnerInvoiceSummaryApi,
  type InvoicePartner,
  type PartnerDocumentType,
  type PartnerInvoiceData,
  type PartnerInvoiceSummary,
  type PartnerInvoiceTotals,
  type PartnerReceiptStamp,
} from "../api/partnerInvoiceApi";
import { useCurrency } from "../context/CurrencyContext";

function isPaidSelectable(line: { payment_status?: string; is_deleted?: boolean }): boolean {
  return String(line.payment_status || "").toLowerCase() === "paid" && !line.is_deleted;
}

function monthRange(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return { startDate: `${y}-${mm}-01`, endDate: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function round2(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}

function computeSelectedTotals(
  lines: PartnerInvoiceData["lines"],
  selectedIds: Set<number>,
  discountPct: number,
  convertLineAmount: (amount: number, fromCurrency: string) => number
): PartnerInvoiceTotals {
  let totalPremiumsGross = 0;
  let totalCommissionsGross = 0;
  let totalReceived = 0;
  for (const l of lines) {
    if (!selectedIds.has(l.sale_id)) continue;
    const from = l.currency || "XOF";
    totalPremiumsGross += convertLineAmount(Number(l.total) || 0, from);
    totalCommissionsGross += convertLineAmount(Number(l.commission) || 0, from);
    totalReceived += convertLineAmount(Number(l.received_amount) || 0, from);
  }
  let pct = Number(discountPct);
  if (!Number.isFinite(pct) || pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  const factor = 1 - pct / 100;
  const totalPremiums = round2(totalPremiumsGross * factor);
  const totalCommissions = round2(totalCommissionsGross * factor);
  return {
    discountPct: pct,
    totalPremiumsGross: round2(totalPremiumsGross),
    totalCommissionsGross: round2(totalCommissionsGross),
    totalPremiums,
    totalCommissions,
    totalReceived: round2(totalReceived),
    netToTransfer: round2(totalPremiums - totalCommissions),
  };
}

const PartnerInvoicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency, formatFrom, convertFrom, currency } = useCurrency();

  const [partners, setPartners] = useState<InvoicePartner[]>([]);
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [month, setMonth] = useState(currentMonth());
  const [customStart, setCustomStart] = useState(monthRange(currentMonth()).startDate);
  const [customEnd, setCustomEnd] = useState(monthRange(currentMonth()).endDate);

  const [invoice, setInvoice] = useState<PartnerInvoiceData | null>(null);
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<number>>(new Set());
  const [discountPct, setDiscountPct] = useState(0);
  const [documentType, setDocumentType] = useState<PartnerDocumentType>("invoice");
  const [stamp, setStamp] = useState<PartnerReceiptStamp>("none");
  const [summary, setSummary] = useState<PartnerInvoiceSummary | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const period = useMemo(() => {
    if (periodMode === "month") return monthRange(month);
    return { startDate: customStart, endDate: customEnd };
  }, [periodMode, month, customStart, customEnd]);

  const periodValid = Boolean(period.startDate && period.endDate && period.startDate <= period.endDate);

  const previewTotals = useMemo(() => {
    if (!invoice) return null;
    return computeSelectedTotals(invoice.lines, selectedSaleIds, discountPct, convertFrom);
  }, [invoice, selectedSaleIds, discountPct, convertFrom]);

  const selectableSaleIds = useMemo(() => {
    if (!invoice) return [] as number[];
    if (documentType === "receipt") {
      return invoice.lines.filter(isPaidSelectable).map((l) => l.sale_id);
    }
    return invoice.lines.filter((l) => !l.is_deleted).map((l) => l.sale_id);
  }, [invoice, documentType]);

  const selectedCount = selectedSaleIds.size;
  const allSelected =
    selectableSaleIds.length > 0 && selectableSaleIds.every((id) => selectedSaleIds.has(id));

  useEffect(() => {
    (async () => {
      try {
        const res = await getInvoicePartnersApi();
        setPartners(res?.data ?? []);
      } catch (e) {
        console.error(e);
        toast.error(t("partnerInvoices.partnersLoadError", "Failed to load partners."));
      }
    })();
  }, [t]);

  // Dashboard reminder: totals for the caller's whole scope over the period.
  useEffect(() => {
    if (!periodValid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getPartnerInvoiceSummaryApi(period.startDate, period.endDate);
        if (!cancelled) setSummary(res?.data ?? null);
      } catch (e) {
        console.error(e);
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period.startDate, period.endDate, periodValid]);

  const clearPreview = () => {
    setInvoice(null);
    setSelectedSaleIds(new Set());
    setDiscountPct(0);
    setDocumentType("invoice");
    setStamp("none");
  };

  const selectLinesForDocument = useCallback(
    (lines: PartnerInvoiceData["lines"], type: PartnerDocumentType) => {
      if (type === "receipt") {
        return new Set(lines.filter(isPaidSelectable).map((l) => l.sale_id));
      }
      return new Set(lines.filter((l) => !l.is_deleted).map((l) => l.sale_id));
    },
    []
  );

  const loadPreview = useCallback(async () => {
    if (!partnerId || !periodValid) return;
    try {
      setLoadingPreview(true);
      const res = await getPartnerInvoiceApi(Number(partnerId), period.startDate, period.endDate);
      const data = res?.data ?? null;
      setInvoice(data);
      setSelectedSaleIds(selectLinesForDocument(data?.lines ?? [], documentType));
      setDiscountPct(0);
    } catch (e: any) {
      console.error(e);
      clearPreview();
      toast.error(
        e?.response?.data?.message ||
          t("partnerInvoices.previewError", "Failed to load the invoice preview.")
      );
    } finally {
      setLoadingPreview(false);
    }
  }, [partnerId, period.startDate, period.endDate, periodValid, t, documentType, selectLinesForDocument]);

  const onDocumentTypeChange = (type: PartnerDocumentType) => {
    setDocumentType(type);
    if (type === "invoice") setStamp("none");
    else if (stamp === "none") setStamp("paid");
    if (invoice) setSelectedSaleIds(selectLinesForDocument(invoice.lines, type));
  };

  const downloadPdf = useCallback(async () => {
    if (!partnerId || !periodValid || !invoice) return;
    if (selectedSaleIds.size === 0) {
      toast.error(
        documentType === "receipt"
          ? t(
              "partnerInvoices.nonePaidSelected",
              "Select at least one Paid policy to generate a partner receipt."
            )
          : t("partnerInvoices.noneSelected", "Select at least one sale to include on the invoice.")
      );
      return;
    }
    if (documentType === "receipt") {
      const unpaid = (invoice.lines || []).filter(
        (l) => selectedSaleIds.has(l.sale_id) && !isPaidSelectable(l)
      );
      if (unpaid.length > 0) {
        toast.error(
          t(
            "partnerInvoices.receiptPaidOnly",
            "Partner receipts can only include policies marked as Paid."
          )
        );
        return;
      }
    }
    try {
      setDownloading(true);
      const saleIds = Array.from(selectedSaleIds);
      const res = await downloadPartnerInvoicePdfApi(
        Number(partnerId),
        period.startDate,
        period.endDate,
        currency,
        {
          saleIds,
          discountPct,
          documentType,
          stamp: documentType === "receipt" ? stamp : "none",
        }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const p = partners.find((x) => x.id === Number(partnerId));
      const slug = (p?.company_name || p?.name || `partner-${partnerId}`).replace(/\s+/g, "-");
      const prefix = documentType === "receipt" ? "RCP" : "INV";
      link.download = `${prefix}-${slug}-${period.startDate.slice(0, 7).replace("-", "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(
        documentType === "receipt"
          ? t("partnerInvoices.receiptDownloaded", "Partner receipt PDF downloaded.")
          : t("partnerInvoices.pdfDownloaded", "Invoice PDF downloaded.")
      );
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          t("partnerInvoices.pdfError", "Failed to generate the invoice PDF.")
      );
    } finally {
      setDownloading(false);
    }
  }, [
    partnerId,
    period.startDate,
    period.endDate,
    periodValid,
    partners,
    currency,
    t,
    invoice,
    selectedSaleIds,
    discountPct,
    documentType,
    stamp,
  ]);

  const toggleSale = (saleId: number) => {
    const line = invoice?.lines.find((l) => l.sale_id === saleId);
    if (!line || line.is_deleted) return;
    if (documentType === "receipt" && !isPaidSelectable(line)) {
      toast.error(
        t(
          "partnerInvoices.receiptPaidOnly",
          "Partner receipts can only include policies marked as Paid."
        )
      );
      return;
    }
    setSelectedSaleIds((prev) => {
      const next = new Set(prev);
      if (next.has(saleId)) next.delete(saleId);
      else next.add(saleId);
      return next;
    });
  };

  const toggleAll = () => {
    if (!invoice) return;
    if (allSelected) setSelectedSaleIds(new Set());
    else setSelectedSaleIds(selectLinesForDocument(invoice.lines, documentType));
  };

  const partnerLabel = (p: InvoicePartner) =>
    p.company_name ? `${p.company_name} (${p.name})` : p.name;

  const summaryCards = summary
    ? [
        {
          icon: Receipt,
          label: t("partnerInvoices.cardPremiums", "Total premiums"),
          value: formatCurrency(summary.totalPremiums),
          sub: t("partnerInvoices.cardSales", "{{count}} sales", { count: summary.totalSales }),
        },
        {
          icon: Wallet,
          label: t("partnerInvoices.cardCollected", "Premiums collected"),
          value: formatCurrency(summary.totalCollected),
          sub: null,
        },
        {
          icon: Landmark,
          label: t("partnerInvoices.cardCommissions", "Commissions to pay"),
          value: formatCurrency(summary.totalCommissions),
          sub: t("partnerInvoices.cardNet", "Net to transfer: {{amount}}", {
            amount: formatCurrency(summary.netToTransfer),
          }),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {t("partnerInvoices.title", "Partner invoices")}
        </h1>
        <p className="mt-1 text-sm text-text-secondary max-w-3xl">
          {t(
            "partnerInvoices.subtitle",
            "Generate the periodic premium invoice for a partner (travel agency, corporate, …). Preview the period, uncheck sales to exclude, and optionally apply a percentage discount to premiums and commissions."
          )}
        </p>
      </div>

      {/* Reminder cards: total premiums / collected / commissions over the period */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#D9D9D9] bg-white p-4">
              <div className="flex items-center gap-2 text-text-secondary">
                <card.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1A1A1A]">
                {card.value}
              </div>
              {card.sub && <div className="mt-0.5 text-xs text-text-secondary">{card.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Selection */}
      <div className="rounded-xl border border-[#D9D9D9] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t("partnerInvoices.partner", "Partner")}
            </label>
            <select
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value ? Number(e.target.value) : "");
                clearPreview();
              }}
              className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] bg-white"
            >
              <option value="">
                {t("partnerInvoices.selectPartner", "Select a partner…")}
              </option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {partnerLabel(p)}
                  {p.partnership_type ? ` — ${p.partnership_type}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t("partnerInvoices.periodMode", "Period")}
            </label>
            <select
              value={periodMode}
              onChange={(e) => {
                setPeriodMode(e.target.value as "month" | "custom");
                clearPreview();
              }}
              className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] bg-white"
            >
              <option value="month">{t("partnerInvoices.periodMonth", "Month")}</option>
              <option value="custom">{t("partnerInvoices.periodCustom", "Custom range")}</option>
            </select>
          </div>

          {periodMode === "month" ? (
            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {t("partnerInvoices.month", "Billing month")}
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  clearPreview();
                }}
                className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F]"
              />
            </div>
          ) : (
            <>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t("partnerInvoices.from", "From")}
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    clearPreview();
                  }}
                  className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F]"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {t("partnerInvoices.to", "To")}
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    clearPreview();
                  }}
                  className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F]"
                />
              </div>
            </>
          )}

          <button
            type="button"
            disabled={!partnerId || !periodValid || loadingPreview}
            onClick={loadPreview}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E4590F] bg-[#E4590F]/10 px-4 py-2 text-sm font-medium text-[#E4590F] disabled:opacity-40 hover:bg-[#E4590F]/20"
          >
            <FileText className="w-4 h-4" />
            {loadingPreview
              ? t("partnerInvoices.loading", "Loading…")
              : t("partnerInvoices.preview", "Preview invoice")}
          </button>

          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t("partnerInvoices.documentType", "Document")}
            </label>
            <select
              value={documentType}
              onChange={(e) => onDocumentTypeChange(e.target.value as PartnerDocumentType)}
              className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] bg-white"
            >
              <option value="invoice">{t("partnerInvoices.docInvoice", "Invoice")}</option>
              <option value="receipt">{t("partnerInvoices.docReceipt", "Receipt (Paid only)")}</option>
            </select>
          </div>

          {documentType === "receipt" && (
            <div className="w-full sm:w-44">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {t("partnerInvoices.stamp", "Stamp")}
              </label>
              <select
                value={stamp}
                onChange={(e) => setStamp(e.target.value as PartnerReceiptStamp)}
                className="w-full rounded-lg border border-[#D9D9D9] px-3 py-2 text-sm outline-none focus:border-[#E4590F] bg-white"
              >
                <option value="none">{t("partnerInvoices.stampNone", "No stamp")}</option>
                <option value="paid">{t("partnerInvoices.stampPaid", "PAID / PAYÉ")}</option>
                <option value="settled">{t("partnerInvoices.stampSettled", "SETTLED / PAYÉ")}</option>
              </select>
            </div>
          )}

          <button
            type="button"
            disabled={!invoice || selectedCount === 0 || downloading}
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E4590F] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#c94c0c]"
          >
            <Download className="w-4 h-4" />
            {downloading
              ? t("partnerInvoices.generating", "Generating…")
              : documentType === "receipt"
                ? t("partnerInvoices.downloadReceipt", "Download receipt")
                : t("partnerInvoices.downloadPdf", "Download PDF")}
          </button>
        </div>
        {documentType === "receipt" && (
          <p className="mt-2 text-xs text-text-secondary">
            {t(
              "partnerInvoices.receiptHint",
              "Receipts include only Paid policies and show Assur’Assistance + GNA logos. Optionally apply a PAID or SETTLED stamp (language follows the app locale)."
            )}
          </p>
        )}
      </div>

      {/* Preview */}
      {invoice && (
        <div className="rounded-xl border border-[#D9D9D9] bg-white overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#EEEEEE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-[#1A1A1A]">{invoice.invoiceNumber}</div>
              <div className="text-xs text-text-secondary">
                {invoice.partner.company_name || invoice.partner.name}
                {invoice.partner.address ? ` — ${invoice.partner.address}` : ""}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {t("partnerInvoices.periodLabel", "Period: {{start}} → {{end}}", {
                  start: invoice.period.startDate,
                  end: invoice.period.endDate,
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
                  {t("partnerInvoices.discountPct", "Discount (%)")}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={discountPct}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isFinite(v)) setDiscountPct(0);
                    else setDiscountPct(Math.min(100, Math.max(0, v)));
                  }}
                  className="w-24 rounded-lg border border-[#D9D9D9] px-2 py-1.5 text-sm outline-none focus:border-[#E4590F]"
                />
              </label>
              <div className="text-xs text-text-secondary">
                {t("partnerInvoices.selectedCount", "{{selected}} of {{total}} sales included", {
                  selected: selectedCount,
                  total: invoice.lines.length,
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedCount > 0 && selectedCount < selectableSaleIds.length;
                        }
                      }}
                      onChange={toggleAll}
                      aria-label={t("partnerInvoices.selectAll", "Select all")}
                      className="h-4 w-4 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colSale", "Sale")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colTraveller", "Traveller")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colPlan", "Plan")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colCertificate", "Certificate")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("partnerInvoices.colPremium", "Premium")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("partnerInvoices.colTax", "Tax")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("partnerInvoices.colTotal", "Total")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colPayment", "Payment")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colConfirmed", "Confirmed")}</th>
                  <th className="px-3 py-2 font-medium">{t("partnerInvoices.colCreatedBy", "Created by")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("partnerInvoices.colCommission", "Commission")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-text-secondary">
                      {t("partnerInvoices.empty", "No confirmed sales in this period for this partner.")}
                    </td>
                  </tr>
                ) : (
                  invoice.lines.map((l) => {
                    const checked = selectedSaleIds.has(l.sale_id);
                    const deleted = !!(l as any).is_deleted;
                    return (
                      <tr
                        key={l.sale_id}
                        className={`border-t border-[#EEEEEE] ${
                          deleted
                            ? "bg-gray-100 text-gray-400"
                            : checked
                              ? "hover:bg-[#FAFAFA]/80"
                              : "bg-[#FAFAFA] opacity-55"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={checked && !deleted}
                            disabled={
                              deleted || (documentType === "receipt" && !isPaidSelectable(l))
                            }
                            onChange={() => toggleSale(l.sale_id)}
                            aria-label={t("partnerInvoices.includeSale", "Include sale {{id}}", {
                              id: l.sale_id,
                            })}
                            className="h-4 w-4 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="font-medium">#{l.sale_id}</div>
                          <div className="text-xs text-text-secondary">
                            {t("partnerInvoices.caseRef", "Case {{id}}", { id: l.case_id })}
                          </div>
                          {deleted && (
                            <div className="text-[10px] uppercase text-gray-500 mt-0.5">
                              {t("ledger.deletedBadge", "Deleted")}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div>{l.traveller_name}</div>
                          <div className="text-xs text-text-secondary">{l.traveller_phone}</div>
                        </td>
                        <td className="px-3 py-2">{l.plan_name || "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">{l.certificate_number}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{formatFrom(l.plan_premium, l.currency)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{formatFrom(l.tax, l.currency)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{formatFrom(l.total, l.currency)}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              l.payment_status === "Paid"
                                ? "bg-green-500/15 text-green-700"
                                : l.payment_status === "Partial"
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-red-500/15 text-red-700"
                            }`}
                          >
                            {l.payment_status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{fmtDate(l.confirmed_at)}</td>
                        <td className="px-3 py-2">{l.created_by_name || "—"}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap font-medium text-[#E4590F]">
                          {formatFrom(l.commission, l.currency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {invoice.lines.length > 0 && previewTotals && (
                <tfoot className="border-t border-[#D9D9D9] bg-[#FAFAFA] text-sm">
                  {(previewTotals.discountPct ?? 0) > 0 && (
                    <tr>
                      <td colSpan={11} className="px-3 py-2 text-right font-medium text-text-secondary">
                        {t("partnerInvoices.discountApplied", "Discount applied: {{pct}}%", {
                          pct: previewTotals.discountPct,
                        })}
                      </td>
                      <td className="px-3 py-2" />
                    </tr>
                  )}
                  <tr>
                    <td colSpan={7} className="px-3 py-2 text-right font-medium">
                      {t("partnerInvoices.totalIssued", "Total policies issued")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {formatFrom(previewTotals.totalPremiums, currency)}
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">
                      {t("partnerInvoices.totalCommissions", "Total commissions to deduct")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-[#E4590F]">
                      {formatFrom(previewTotals.totalCommissions, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={11} className="px-3 py-2 text-right font-semibold">
                      {t("partnerInvoices.netToTransfer", "Net total to transfer")}
                    </td>
                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                      {formatFrom(previewTotals.netToTransfer, currency)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Commission tiers reference */}
      {invoice && (
        <div className="rounded-xl border border-[#D9D9D9] bg-white p-4">
          <div className="text-xs font-medium text-text-secondary mb-2">
            {t("partnerInvoices.tiersTitle", "Commission scale (per coverage duration)")}
          </div>
          <div className="flex flex-wrap gap-2">
            {invoice.commissionTiers.map((tier) => (
              <span
                key={tier.days}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D9D9] px-2.5 py-1 text-xs"
              >
                <span className="font-medium">
                  {t("partnerInvoices.tierDays", "{{days}} days", { days: tier.days })}
                </span>
                <span className="text-text-secondary">
                  {formatCurrency(tier.premium)} → {formatCurrency(tier.commission)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerInvoicesPage;
