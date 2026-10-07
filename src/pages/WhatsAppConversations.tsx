// WhatsAppConversations.tsx
//
// Support view over the WhatsApp purchase channel.
//
// Two questions this screen exists to answer:
//   "A customer says the bot stopped replying — what happened?"  → open the
//   conversation and read the transcript, including sends that FAILED, which is
//   the part a customer cannot tell you about.
//   "Are we hitting the message budget?"                          → the tiles.
//
// Read-only on purpose. Replying by hand from here would put a human halfway
// into a state machine that assumes it owns the conversation.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import {
  listWhatsAppSessionsApi,
  getWhatsAppMessagesApi,
  getWhatsAppStatsApi,
  getWhatsAppStatusApi,
  type Pagination,
  type SessionStatus,
  type WhatsAppMessage,
  type WhatsAppSession,
  type WhatsAppStats,
} from "../api/whatsappApi";

const STATUSES: SessionStatus[] = ["active", "completed", "expired", "cancelled", "escalated"];

const statusStyle: Record<SessionStatus, string> = {
  active: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  expired: "bg-secondary-light text-gray-600 border-[#D9D9D9]",
  cancelled: "bg-secondary-light text-gray-600 border-[#D9D9D9]",
  escalated: "bg-amber-50 text-amber-700 border-amber-200",
};

const errorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return err?.response?.data?.error?.message || err?.response?.data?.message || fallback;
};

function formatWhen(value: string | null, lang: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function formatNumber(wa: string): string {
  return wa.startsWith("+") ? wa : `+${wa}`;
}

/* ------------------------------------------------------------------ tiles */

const Tile: React.FC<{ label: string; value: string; hint?: string; tone?: "ok" | "warn" | "plain" }> = ({
  label, value, hint, tone = "plain",
}) => (
  <div className="rounded-2xl border border-[#D9D9D9] bg-white p-4">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p
      className={`mt-1 text-2xl font-semibold ${
        tone === "ok" ? "text-green-600" : tone === "warn" ? "text-amber-600" : "text-gray-900"
      }`}
    >
      {value}
    </p>
    {hint && <p className="mt-0.5 text-[11px] text-gray-500">{hint}</p>}
  </div>
);

/* ------------------------------------------------------------- transcript */

const Bubble: React.FC<{ message: WhatsAppMessage; lang: string }> = ({ message, lang }) => {
  const { t } = useTranslation();
  const inbound = message.direction === "inbound";
  const failed = message.status === "failed";

  return (
    <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[78%] ${inbound ? "" : "text-right"}`}>
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap text-left ${
            inbound
              ? "bg-secondary-light text-gray-900 rounded-tl-sm"
              : failed
              ? "bg-red-50 text-red-900 border border-red-200 rounded-tr-sm"
              : "bg-[#E4590F]/10 text-gray-900 rounded-tr-sm"
          }`}
        >
          {message.body || <span className="text-gray-400 italic">{t("whatsappConversations.noBody", "(no text)")}</span>}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 justify-start">
          {!inbound && <span className="ml-auto" />}
          <span>{formatWhen(message.createdAt, lang)}</span>
          {message.messageType !== "text" && <span className="uppercase">{message.messageType}</span>}
          {message.stepKey && <span className="font-mono">{message.stepKey}</span>}
          {failed && (
            <span className="text-red-600 font-medium">
              {t("whatsappConversations.failed", "failed")}
              {message.errorCode ? ` (${message.errorCode})` : ""}
            </span>
          )}
          {!inbound && !failed && message.status && <span>{message.status}</span>}
        </div>
        {failed && message.errorMessage && (
          <p className="mt-0.5 text-[10px] text-red-600">{message.errorMessage}</p>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- page */

const WhatsAppConversations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";

  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [channelReady, setChannelReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");

  const [selected, setSelected] = useState<WhatsAppSession | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listWhatsAppSessionsApi({ page, limit: 25, status: status || undefined, search: search || undefined });
      setSessions(res.data || []);
      setPagination(res.pagination || null);
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappConversations.loadError", "Could not load the conversations.")));
    } finally {
      setLoading(false);
    }
  }, [page, status, search, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getWhatsAppStatsApi(30).then((r) => setStats(r.data)).catch(() => setStats(null));
    getWhatsAppStatusApi().then((r) => setChannelReady(r.data.ready)).catch(() => setChannelReady(null));
  }, []);

  const openSession = async (session: WhatsAppSession) => {
    setSelected(session);
    setMessages([]);
    try {
      setLoadingMessages(true);
      const res = await getWhatsAppMessagesApi(session.id);
      setMessages(res.data || []);
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappConversations.transcriptError", "Could not load the transcript.")));
    } finally {
      setLoadingMessages(false);
    }
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const averageTone = useMemo<"ok" | "warn" | "plain">(() => {
    const avg = stats?.averageCustomerMessages;
    if (avg === null || avg === undefined) return "plain";
    return avg <= (stats?.target.max ?? 8) ? "ok" : "warn";
  }, [stats]);

  const collected = (selected?.collectedData || {}) as Record<string, unknown>;
  const collectedRows = Object.entries(collected)
    // Keys prefixed with __ are engine bookkeeping, not customer data.
    .filter(([k, v]) => !k.startsWith("__") && v !== null && v !== undefined && v !== "")
    .slice(0, 24);

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {t("whatsappConversations.title", "WhatsApp conversations")}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "whatsappConversations.subtitle",
              "Every purchase conversation, with the full transcript — including messages that failed to send, which a customer cannot report."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
        >
          <RefreshCw className="w-4 h-4" />
          {t("whatsappConversations.refresh", "Refresh")}
        </button>
      </div>

      {channelReady === false && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            {t(
              "whatsappConversations.notReady",
              "The WhatsApp channel is not fully configured, so no new conversations can start. Check the WhatsApp settings page."
            )}
          </p>
        </div>
      )}

      {/* tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <Tile
          label={t("whatsappConversations.tileCompleted", "Completed (30 days)")}
          value={stats ? String(stats.completedSessions) : "—"}
        />
        <Tile
          label={t("whatsappConversations.tileAverage", "Avg customer messages")}
          value={stats?.averageCustomerMessages != null ? String(stats.averageCustomerMessages) : "—"}
          hint={stats ? t("whatsappConversations.tileTarget", "Target {{min}}–{{max}}", { min: stats.target.min, max: stats.target.max }) : undefined}
          tone={averageTone}
        />
        <Tile
          label={t("whatsappConversations.tileBest", "Fewest messages")}
          value={stats?.minCustomerMessages != null ? String(stats.minCustomerMessages) : "—"}
        />
        <Tile
          label={t("whatsappConversations.tileWorst", "Most messages")}
          value={stats?.maxCustomerMessages != null ? String(stats.maxCustomerMessages) : "—"}
        />
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={t("whatsappConversations.searchPlaceholder", "Number, name or quote reference")}
              className="w-72 rounded-xl border border-[#D9D9D9] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F]"
            />
          </div>
          <button type="submit" className="rounded-xl bg-[#E4590F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#C94A0D] transition">
            {t("whatsappConversations.search", "Search")}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => { setStatus(""); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
              status === "" ? "bg-[#E4590F]/10 text-[#E4590F] border-[#E4590F]/30" : "border-[#D9D9D9] text-gray-600 hover:text-[#E4590F]"
            }`}
          >
            {t("whatsappConversations.statusAll", "All")}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition ${
                status === s ? "bg-[#E4590F]/10 text-[#E4590F] border-[#E4590F]/30" : "border-[#D9D9D9] text-gray-600 hover:text-[#E4590F]"
              }`}
            >
              {t(`whatsappConversations.status_${s}`, s)}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="rounded-2xl border border-[#D9D9D9] bg-white overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-5 h-5 animate-spin text-[#E4590F]" /></div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            {t("whatsappConversations.empty", "No conversations yet.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-light/40 text-left">
                <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">{t("whatsappConversations.colCustomer", "Customer")}</th>
                  <th className="px-4 py-3 font-medium">{t("whatsappConversations.colStatus", "Status")}</th>
                  <th className="px-4 py-3 font-medium">{t("whatsappConversations.colStep", "Step")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("whatsappConversations.colMessages", "Msgs")}</th>
                  <th className="px-4 py-3 font-medium">{t("whatsappConversations.colQuote", "Quote")}</th>
                  <th className="px-4 py-3 font-medium">{t("whatsappConversations.colActivity", "Last activity")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => openSession(s)}
                    className="cursor-pointer hover:bg-secondary-light/30 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.profileName || t("whatsappConversations.unknownName", "Unknown")}</div>
                      <div className="text-xs text-gray-500 font-mono">{formatNumber(s.waNumber)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyle[s.status]}`}>
                        {t(`whatsappConversations.status_${s.status}`, s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">{s.currentStep || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{s.customerMessageCount}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{s.quoteReference || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatWhen(s.lastActivityAt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {t("whatsappConversations.pageOf", "Page {{page}} of {{pages}} · {{total}} conversations", {
              page: pagination.page, pages: pagination.pages, total: pagination.total,
            })}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-[#D9D9D9] px-3 py-2 text-xs disabled:opacity-40 hover:text-[#E4590F] transition"
            >
              {t("whatsappConversations.prev", "Previous")}
            </button>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-[#D9D9D9] px-3 py-2 text-xs disabled:opacity-40 hover:text-[#E4590F] transition"
            >
              {t("whatsappConversations.next", "Next")}
            </button>
          </div>
        </div>
      )}

      {/* transcript drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setSelected(null)} aria-hidden />
          <aside className="w-full max-w-xl bg-white h-full shadow-xl flex flex-col">
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#D9D9D9]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900 truncate">
                    {selected.profileName || t("whatsappConversations.unknownName", "Unknown")}
                  </h2>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyle[selected.status]}`}>
                    {t(`whatsappConversations.status_${selected.status}`, selected.status)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 font-mono">{formatNumber(selected.waNumber)}</p>
                <p className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1"><MessageSquare className="w-3 h-3" />{selected.customerMessageCount}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{formatWhen(selected.lastActivityAt, lang)}</span>
                  <span className="uppercase">{selected.language}</span>
                  {selected.quoteReference && (
                    <span className="inline-flex items-center gap-1 text-green-700"><CheckCheck className="w-3 h-3" />{selected.quoteReference}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] transition"
                aria-label={t("whatsappConversations.close", "Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            {collectedRows.length > 0 && (
              <div className="px-5 py-3 border-b border-[#D9D9D9] bg-secondary-light/30">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  {t("whatsappConversations.collected", "Collected so far")}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {collectedRows.map(([k, v]) => (
                    <div key={k} className="flex gap-1.5 min-w-0">
                      <dt className="text-gray-500 shrink-0">{k}</dt>
                      <dd className="text-gray-900 truncate">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMessages ? (
                <div className="grid place-items-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#E4590F]" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-12">
                  {t("whatsappConversations.noMessages", "No messages in this conversation.")}
                </p>
              ) : (
                messages.map((m) => <Bubble key={m.id} message={m} lang={lang} />)
              )}
            </div>

            <footer className="px-5 py-3 border-t border-[#D9D9D9] text-[11px] text-gray-500 flex items-center gap-2">
              <ArrowLeft className="w-3 h-3" />
              {t("whatsappConversations.readOnly", "Read-only. Replying by hand would interrupt the automated flow.")}
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConversations;
