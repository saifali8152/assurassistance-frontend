// PartnerInvoicesPage.tsx
//
// Generate period invoices per partner (travel agency, corporate desk, …).
// Admins see every top-level partner; sub-administrators only the agencies
// under their supervision. The invoice lists every confirmed sale in the
// period with the commission tier applied, and the PDF follows the official
// Assur'Assistance format (logos, addresses, premium breakdown, commissions
// deducted from the premium total).
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
  type PartnerInvoiceData,
  type PartnerInvoiceSummary,
} from "../api/partnerInvoiceApi";
import { useCurrency } from "../context/CurrencyContext";

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

const PartnerInvoicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();

  const [partners, setPartners] = useState<InvoicePartner[]>([]);
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [periodMode, setPeriodMode] = useState<"month" | "custom">("month");
  const [month, setMonth] = useState(currentMonth());
  const [customStart, setCustomStart] = useState(monthRange(currentMonth()).startDate);
  const [customEnd, setCustomEnd] = useState(monthRange(currentMonth()).endDate);

  const [invoice, setInvoice] = useState<PartnerInvoiceData | null>(null);
  const [summary, setSummary] = useState<PartnerInvoiceSummary | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const period = useMemo(() => {
    if (periodMode === "month") return monthRange(month);
    return { startDate: customStart, endDate: customEnd };
  }, [periodMode, month, customStart, customEnd]);

  const periodValid = Boolean(period.startDate && period.endDate && period.startDate <= period.endDate);

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

  const loadPreview = useCallback(async () => {
    if (!partnerId || !periodValid) return;
    try {
      setLoadingPreview(true);
      const res = await getPartnerInvoiceApi(Number(partnerId), period.startDate, period.endDate);
      setInvoice(res?.data ?? null);
    } catch (e: any) {
      console.error(e);
      setInvoice(null);
      toast.error(
        e?.response?.data?.message ||
          t("partnerInvoices.previewError", "Failed to load the invoice preview.")
      );
    } finally {
      setLoadingPreview(false);
    }
  }, [partnerId, period.startDate, period.endDate, periodValid, t]);

  const downloadPdf = useCallback(async () => {
    if (!partnerId || !periodValid) return;
    try {
      setDownloading(true);
      const res = await downloadPartnerInvoicePdfApi(
        Number(partnerId),
        period.startDate,
        period.endDate,
        currency
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const p = partners.find((x) => x.id === Number(partnerId));
      const slug = (p?.company_name || p?.name || `partner-${partnerId}`).replace(/\s+/g, "-");
      link.download = `INV-${slug}-${period.startDate.slice(0, 7).replace("-", "")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t("partnerInvoices.pdfDownloaded", "Invoice PDF downloaded."));
    } catch (e) {
      console.error(e);
      toast.error(t("partnerInvoices.pdfError", "Failed to generate the invoice PDF."));
    } finally {
      setDownloading(false);
    }
  }, [partnerId, period.startDate, period.endDate, periodValid, partners, currency, t]);

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
            "Generate the periodic premium invoice for a partner (travel agency, corporate, …). Commissions are applied per coverage duration and deducted from the premium total."
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
                setInvoice(null);
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
              onChange={(e) => setPeriodMode(e.target.value as "month" | "custom")}
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
                onChange={(e) => setMonth(e.target.value)}
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
                  onChange={(e) => setCustomStart(e.target.value)}
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
                  onChange={(e) => setCustomEnd(e.target.value)}
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

          <button
            type="button"
            disabled={!partnerId || !periodValid || downloading}
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E4590F] px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#c94c0c]"
          >
            <Download className="w-4 h-4" />
            {downloading
              ? t("partnerInvoices.generating", "Generating…")
              : t("partnerInvoices.downloadPdf", "Download PDF")}
          </button>
        </div>
      </div>

      {/* Preview */}
      {invoice && (
        <div className="rounded-xl border border-[#D9D9D9] bg-white overflow-hidden">
          <div className="flex flex-col gap-1 border-b border-[#EEEEEE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-[#1A1A1A]">{invoice.invoiceNumber}</div>
              <div className="text-xs text-text-secondary">
                {invoice.partner.company_name || invoice.partner.name}
                {invoice.partner.address ? ` — ${invoice.partner.address}` : ""}
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              {t("partnerInvoices.periodLabel", "Period: {{start}} → {{end}}", {
                start: invoice.period.startDate,
                end: invoice.period.endDate,
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAFAFA] text-left text-text-secondary">
                <tr>
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
                    <td colSpan={11} className="px-4 py-10 text-center text-text-secondary">
                      {t("partnerInvoices.empty", "No confirmed sales in this period for this partner.")}
                    </td>
                  </tr>
                ) : (
                  invoice.lines.map((l) => (
                    <tr key={l.sale_id} className="border-t border-[#EEEEEE] hover:bg-[#FAFAFA]/80">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-medium">#{l.sale_id}</div>
                        <div className="text-xs text-text-secondary">
                          {t("partnerInvoices.caseRef", "Case {{id}}", { id: l.case_id })}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{l.traveller_name}</div>
                        <div className="text-xs text-text-secondary">{l.traveller_phone}</div>
                      </td>
                      <td className="px-3 py-2">{l.plan_name || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{l.certificate_number}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(l.plan_premium)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(l.tax)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{formatCurrency(l.total)}</td>
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
                        {formatCurrency(l.commission)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {invoice.lines.length > 0 && (
                <tfoot className="border-t border-[#D9D9D9] bg-[#FAFAFA] text-sm">
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-right font-medium">
                      {t("partnerInvoices.totalIssued", "Total policies issued")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                      {formatCurrency(invoice.totals.totalPremiums)}
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-right font-medium">
                      {t("partnerInvoices.totalCommissions", "Total commissions to deduct")}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-[#E4590F]">
                      {formatCurrency(invoice.totals.totalCommissions)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={10} className="px-3 py-2 text-right font-semibold">
                      {t("partnerInvoices.netToTransfer", "Net total to transfer")}
                    </td>
                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                      {formatCurrency(invoice.totals.netToTransfer)}
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
