// Payments.tsx
//
// Every mobile money payment, what happened to it, and why.
//
// WHY THIS EXISTS: until now the only way to answer "did that customer's
// payment go through?" was a SQL query, which made the answer "ask the
// developer". An insurance platform taking money has to let its own operators
// see a payment, understand a failure and chase a stuck one.
//
// WHAT IT DELIBERATELY DOES NOT SHOW: the payer's full number. The API masks it
// to the last four digits — enough to confirm a number with a customer on the
// phone, useless as a contact list for a screen several people can open.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import {
  listPaymentsApi,
  paymentStatsApi,
  getPaymentApi,
  getCallbackBodyApi,
  pollPaymentApi,
  PAYMENT_STATUSES,
  type PaymentDetail,
  type PaymentRow,
  type PaymentStats,
  type PaymentStatus,
} from "../api/paymentsApi";

/* ------------------------------------------------------------------ helpers */

const errorMessage = (e: unknown, fallback: string): string => {
  const anyErr = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return anyErr?.response?.data?.error?.message || anyErr?.response?.data?.message || fallback;
};

const money = (amount: string | number, currency: string) =>
  `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(amount) || 0))} ${currency || "XOF"}`;

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const inputClass =
  "w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F] transition";

/** Colour carries meaning here: settled, in flight, or over. */
const STATUS_CLASS: Record<PaymentStatus, string> = {
  pending: "border-gray-200 bg-gray-50 text-gray-600",
  initiated: "border-blue-200 bg-blue-50 text-blue-700",
  awaiting_confirmation: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  expired: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-gray-200 bg-gray-50 text-gray-600",
};

const StatusPill: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      {t(`payments.status.${status}`, status)}
    </span>
  );
};

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, actions, children }) => (
  <section className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm overflow-hidden">
    <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#D9D9D9] bg-secondary-light/40">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#E4590F]/10 text-[#E4590F]">
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

/* ------------------------------------------------------------ detail drawer */

const DetailDrawer: React.FC<{ id: number; onClose: () => void; onSettled: () => void }> = ({
  id,
  onClose,
  onSettled,
}) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [bodyFor, setBodyFor] = useState<number | null>(null);
  const [body, setBody] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentApi(id);
      setDetail(res.data);
    } catch (e) {
      toast.error(errorMessage(e, t("payments.loadOneFailed", "Could not load this payment.")));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [id, onClose, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPoll = async () => {
    setPolling(true);
    try {
      const res = await pollPaymentApi(id);
      if (res.data.settled) {
        toast.success(
          res.data.policyNumber
            ? t("payments.settledWithPolicy", "Settled as {{status}} — policy {{policy}}", {
                status: res.data.status,
                policy: res.data.policyNumber,
              })
            : t("payments.settled", "Settled as {{status}}", { status: res.data.status })
        );
        onSettled();
      } else {
        toast(
          res.data.reason === "already_final"
            ? t("payments.alreadyFinal", "This payment is already final.")
            : t("payments.stillWaiting", "The operator is still waiting for the customer.")
        );
      }
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t("payments.pollFailed", "Could not ask the operator.")));
    } finally {
      setPolling(false);
    }
  };

  const openBody = async (callbackId: number) => {
    try {
      const res = await getCallbackBodyApi(callbackId);
      setBodyFor(callbackId);
      setBody(res.data.raw_body);
    } catch (e) {
      toast.error(errorMessage(e, t("payments.bodyFailed", "Could not load the callback.")));
    }
  };

  const canPoll = detail && !["completed", "failed", "expired", "cancelled"].includes(detail.status);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-2xl border border-[#D9D9D9] bg-white shadow-xl overflow-hidden">
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#D9D9D9] bg-secondary-light/40">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#E4590F]/10 text-[#E4590F]">
              <Wallet className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 font-mono">
                {detail ? detail.reference : t("payments.loading", "Loading…")}
              </h3>
              {detail && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {detail.provider} · {money(detail.amount, detail.currency)} · {detail.msisdn_masked || "—"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canPoll && (
              <button
                type="button"
                onClick={onPoll}
                disabled={polling}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-60"
              >
                {polling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {t("payments.askOperator", "Ask the operator")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {loading || !detail ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#E4590F]" />
          </div>
        ) : (
          <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                <p className="text-[11px] text-gray-500">{t("payments.colStatus", "Status")}</p>
                <div className="mt-1"><StatusPill status={detail.status} /></div>
                {detail.failure_code && (
                  <p className="mt-1.5 text-[11px] text-red-600">
                    {t(`payments.failure.${detail.failure_code}`, detail.failure_code)}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                <p className="text-[11px] text-gray-500">{t("payments.policy", "Policy")}</p>
                <p className="mt-0.5 text-sm text-gray-900 font-mono">{detail.policy_number || "—"}</p>
                {detail.status === "completed" && !detail.policy_number && (
                  // Money in, nothing issued. The one line worth interrupting
                  // someone for, so it is said plainly rather than implied.
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {t("payments.paidNoPolicy", "Paid, but no policy was issued")}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                <p className="text-[11px] text-gray-500">{t("payments.operatorRef", "Operator reference")}</p>
                <p className="mt-0.5 text-[12px] text-gray-900 font-mono break-all">
                  {detail.provider_tx_id || "—"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-[12px]">
              <div><span className="text-gray-500">{t("payments.created", "Created")}:</span> {when(detail.created_at)}</div>
              <div><span className="text-gray-500">{t("payments.completed", "Completed")}:</span> {when(detail.completed_at)}</div>
              <div><span className="text-gray-500">{t("payments.expires", "Expires")}:</span> {when(detail.expires_at)}</div>
            </div>

            {/* ------------------------------------------------------- history */}
            <div>
              <h4 className="text-xs font-semibold text-gray-800 mb-2">
                {t("payments.history", "What happened, in order")}
              </h4>
              {detail.status_history?.length ? (
                <ol className="rounded-xl border border-[#D9D9D9] divide-y divide-[#EFEFEF] overflow-hidden">
                  {detail.status_history.map((h, i) => (
                    <li key={i} className="flex items-center gap-3 px-3.5 py-2 text-[12px]">
                      <span className="text-gray-500 whitespace-nowrap">{when(h.at)}</span>
                      <span className="font-mono text-gray-700">
                        {h.from} → <span className="font-semibold">{h.to}</span>
                      </span>
                      <span className="text-gray-500 truncate">{h.by}{h.note ? ` · ${h.note}` : ""}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-gray-500">{t("payments.noHistory", "No transitions recorded.")}</p>
              )}
            </div>

            {/* ----------------------------------------------------- callbacks */}
            <div>
              <h4 className="text-xs font-semibold text-gray-800 mb-2">
                {t("payments.callbacks", "What the operator sent us")}
              </h4>
              {detail.callbacks?.length ? (
                <div className="rounded-xl border border-[#D9D9D9] overflow-hidden">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-secondary-light/50">
                      <tr className="text-[11px] text-gray-600">
                        <th className="px-3 py-2 font-medium">{t("payments.cbWhen", "Received")}</th>
                        <th className="px-3 py-2 font-medium">{t("payments.cbSignature", "Signature")}</th>
                        <th className="px-3 py-2 font-medium">{t("payments.cbProcessed", "Acted on")}</th>
                        <th className="px-3 py-2 font-medium">{t("payments.cbError", "Problem")}</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFEFEF]">
                      {detail.callbacks.map((cb) => (
                        <tr key={cb.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{when(cb.received_at)}</td>
                          <td className="px-3 py-2">
                            {cb.signature_valid ? (
                              <span className="text-green-700">{t("payments.cbValid", "verified")}</span>
                            ) : (
                              <span className="text-red-600">{t("payments.cbInvalid", "not verified")}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {cb.duplicate
                              ? t("payments.cbDuplicate", "repeat, ignored")
                              : cb.processed
                                ? t("payments.cbYes", "yes")
                                : t("payments.cbNo", "no")}
                          </td>
                          <td className="px-3 py-2 text-red-600 truncate max-w-[220px]">{cb.process_error || ""}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => void openBody(cb.id)}
                              className="text-[11px] text-gray-600 hover:text-[#E4590F] transition"
                            >
                              {t("payments.cbView", "View")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {t("payments.noCallbacks", "The operator has not called back yet.")}
                </p>
              )}

              {bodyFor && (
                <div className="mt-3">
                  <p className="text-[11px] text-gray-500 mb-1">
                    {t("payments.cbBody", "Exactly what the operator sent (callback {{id}})", { id: bodyFor })}
                  </p>
                  <pre className="rounded-xl border border-[#D9D9D9] bg-secondary-light/40 p-3 text-[11px] text-gray-800 overflow-x-auto max-h-48">
{body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------- page */

const Payments: React.FC = () => {
  const { t } = useTranslation();

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [provider, setProvider] = useState("");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, figures] = await Promise.all([
        listPaymentsApi({ page, limit, status, provider, search }),
        paymentStatsApi(7),
      ]);
      setRows(list.data.rows);
      setTotal(list.data.total);
      setStats(figures.data);
    } catch (e) {
      toast.error(errorMessage(e, t("payments.loadFailed", "Could not load the payments.")));
    } finally {
      setLoading(false);
    }
  }, [page, status, provider, search, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));
  const byStatus = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const s of stats?.byStatus || []) map.set(s.status, { count: s.count, amount: s.amount });
    return map;
  }, [stats]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  return (
    <div className="pb-16">
      {/* ------------------------------------------------------------- header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">{t("payments.title", "Payments")}</h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "payments.subtitle",
              "Every mobile money payment, what happened to it and why. Payer numbers are shown masked."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t("payments.refresh", "Refresh")}
        </button>
      </div>

      {/* --------------------------------------------- the two urgent figures */}
      {stats && (stats.paidWithoutPolicy > 0 || stats.stuck > 0) && (
        <div className="mb-5 space-y-3">
          {stats.paidWithoutPolicy > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">
                  {t("payments.paidNoPolicyTitle", "{{count}} payment(s) taken with no policy issued", {
                    count: stats.paidWithoutPolicy,
                  })}
                </p>
                <p className="mt-1 text-red-700 leading-relaxed">
                  {t(
                    "payments.paidNoPolicyBody",
                    "Open each one and check why. Issuing the policy again is safe — a case can only ever hold one."
                  )}
                </p>
              </div>
            </div>
          )}
          {stats.stuck > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">
                  {t("payments.stuckTitle", "{{count}} payment(s) past their window", { count: stats.stuck })}
                </p>
                <p className="mt-1 text-amber-700">
                  {t("payments.stuckBody", "Open one and use “Ask the operator” to find out what really happened.")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------- last seven days */}
      {stats && (
        <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          {(["completed", "awaiting_confirmation", "failed", "expired"] as PaymentStatus[]).map((s) => (
            <div key={s} className="rounded-2xl border border-[#D9D9D9] bg-white px-4 py-3">
              <p className="text-[11px] text-gray-500">{t(`payments.status.${s}`, s)}</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900">{byStatus.get(s)?.count ?? 0}</p>
              <p className="text-[11px] text-gray-500">
                {money(byStatus.get(s)?.amount ?? 0, "XOF")} · {t("payments.sevenDays", "last 7 days")}
              </p>
            </div>
          ))}
        </div>
      )}

      <SectionCard
        icon={Wallet}
        title={t("payments.listTitle", "Transactions")}
        subtitle={t("payments.listSubtitle", "{{count}} matching", { count: total })}
        actions={
          <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
            <select
              className={`${inputClass} w-auto py-2`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PaymentStatus | "");
                setPage(1);
              }}
            >
              <option value="">{t("payments.allStatuses", "All statuses")}</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`payments.status.${s}`, s)}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} w-auto py-2`}
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("payments.allProviders", "All operators")}</option>
              {["orange", "mtn", "wave", "moov", "mock"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputClass} pl-8 py-2 w-56`}
                placeholder={t("payments.searchPlaceholder", "Reference or policy number")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>
        }
      >
        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#E4590F]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D9D9D9] px-4 py-12 text-center">
            <Wallet className="w-6 h-6 mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-600">{t("payments.emptyTitle", "No payments match")}</p>
            <p className="mt-1 text-xs text-gray-500">
              {t("payments.emptyBody", "Payments appear here as soon as a customer starts one in WhatsApp.")}
            </p>
          </div>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary-light/50 border-y border-[#D9D9D9]">
                <tr className="text-[11px] text-gray-600">
                  <th className="px-5 py-2.5 font-medium">{t("payments.colReference", "Reference")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("payments.colOperator", "Operator")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("payments.colAmount", "Amount")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("payments.colStatus", "Status")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("payments.policy", "Policy")}</th>
                  <th className="px-5 py-2.5 font-medium">{t("payments.created", "Created")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setDetailId(r.id)}
                    className="hover:bg-secondary-light/30 transition cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="font-mono text-[12px] text-gray-900">{r.reference}</p>
                      <p className="text-[11px] text-gray-500">{r.msisdn_masked || "—"}</p>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-gray-800">{r.provider}</td>
                    <td className="px-3 py-3 text-[13px] text-gray-900 whitespace-nowrap">
                      {money(r.amount, r.currency)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={r.status} />
                      {r.failure_code && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          {t(`payments.failure.${r.failure_code}`, r.failure_code)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px]">
                      {r.policy_number || (
                        <span className={r.status === "completed" ? "text-red-600" : "text-gray-400"}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-gray-600 whitespace-nowrap">{when(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t("payments.pageOf", "Page {{page}} of {{pages}}", { page, pages })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="grid place-items-center w-9 h-9 rounded-xl border border-[#D9D9D9] text-gray-600 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="grid place-items-center w-9 h-9 rounded-xl border border-[#D9D9D9] text-gray-600 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {detailId !== null && (
        <DetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onSettled={() => void load()}
        />
      )}
    </div>
  );
};

export default Payments;
