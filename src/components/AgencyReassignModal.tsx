import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { History, UserCog, X } from "lucide-react";
import {
  listSubAdminsApi,
  reassignAgentSupervisorApi,
  getAgentSupervisionHistoryApi,
  type SupervisionHistoryItem,
} from "../api/agentApi";
import { useAuth } from "../context/AuthContext";

export type AgencyReassignTarget = {
  id: string | number;
  name: string;
  companyName?: string | null;
  currentSupervisorName?: string | null;
};

type Props = {
  open: boolean;
  agency: AgencyReassignTarget | null;
  /** When true, open on history tab; otherwise reassign form. */
  initialTab?: "reassign" | "history";
  onClose: () => void;
  onReassigned?: () => void;
};

function formatPeriodDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

function formatPeriodLabel(
  item: SupervisionHistoryItem,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string
): string {
  const from = formatPeriodDate(item.effective_from, locale);
  if (!item.effective_to) {
    return t("agencyReassign.periodFromOnward", { defaultValue: "From {{from}} onward", from });
  }
  const to = formatPeriodDate(item.effective_to, locale);
  return t("agencyReassign.periodRange", { defaultValue: "{{from}} – {{to}}", from, to });
}

const AgencyReassignModal: React.FC<Props> = ({
  open,
  agency,
  initialTab = "reassign",
  onClose,
  onReassigned,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<"reassign" | "history">(initialTab);
  const [subAdmins, setSubAdmins] = useState<{ id: number; name: string; email: string }[]>([]);
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<SupervisionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setReason("");
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setSupervisorId("");
  }, [open, agency?.id, initialTab]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingSubs(true);
      try {
        const rows = await listSubAdminsApi();
        if (!cancelled) {
          setSubAdmins(
            (rows || []).map((r) => ({ id: r.id, name: r.name, email: r.email }))
          );
        }
      } catch {
        if (!cancelled) toast.error(t("agencyReassign.loadSubAdminsFailed", "Could not load sub-administrators"));
      } finally {
        if (!cancelled) setLoadingSubs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const loadHistory = async () => {
    if (!agency) return;
    setLoadingHistory(true);
    try {
      const data = await getAgentSupervisionHistoryApi(String(agency.id));
      setHistory(data.history || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          t("agencyReassign.loadHistoryFailed", "Could not load management history")
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open && agency && tab === "history") {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agency?.id, tab]);

  if (!open || !agency) return null;

  const displayName = agency.companyName || agency.name;

  const handleSubmit = async () => {
    if (!supervisorId) {
      toast.error(t("agencyReassign.selectSupervisor", "Select a supervising account"));
      return;
    }
    if (!effectiveFrom) {
      toast.error(t("agencyReassign.effectiveFromRequired", "Effective from date is required"));
      return;
    }
    setSubmitting(true);
    try {
      await reassignAgentSupervisorApi(String(agency.id), {
        supervisor_user_id: Number(supervisorId),
        effective_from: effectiveFrom,
        reason: reason.trim() || undefined,
      });
      toast.success(
        t(
          "agencyReassign.success",
          "Agency reassigned. Policies and historical data were retained."
        )
      );
      onReassigned?.();
      setTab("history");
      await loadHistory();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          t("agencyReassign.failed", "Could not reassign agency")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = (role: string | null | undefined) => {
    if (role === "admin") return t("role.admin", "Admin");
    if (role === "sub_admin") return t("role.subAdmin", "Sub-administrator");
    return role || "—";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full my-8">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div>
            <h3 className="text-[#E4590F] text-xl font-semibold">
              {t("agencyReassign.title", "Agency supervision")}
            </h3>
            <p className="text-sm text-[#2B2B2B]/80 mt-1">{displayName}</p>
            {agency.currentSupervisorName ? (
              <p className="text-xs text-[#2B2B2B]/60 mt-0.5">
                {t("agencyReassign.currentSupervisor", "Currently managed by")}:{" "}
                {agency.currentSupervisorName}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white transition-colors"
            aria-label={t("common.close", "Close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-[#D9D9D9]">
          <button
            type="button"
            onClick={() => setTab("reassign")}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "reassign"
                ? "border-[#E4590F] text-[#E4590F]"
                : "border-transparent text-[#2B2B2B]/60 hover:text-[#2B2B2B]"
            }`}
          >
            <UserCog className="w-4 h-4" />
            {t("agencyReassign.tabReassign", "Reassign")}
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "history"
                ? "border-[#E4590F] text-[#E4590F]"
                : "border-transparent text-[#2B2B2B]/60 hover:text-[#2B2B2B]"
            }`}
          >
            <History className="w-4 h-4" />
            {t("agencyReassign.tabHistory", "Management history")}
          </button>
        </div>

        {tab === "reassign" ? (
          <div className="space-y-4">
            <p className="text-sm text-[#2B2B2B]/70">
              {t(
                "agencyReassign.help",
                "Transfer this partner to another supervising account. Issued policies, policy numbers, identifiers and agency codes are kept."
              )}
            </p>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B]/70 mb-1">
                {t("agencyReassign.newSupervisor", "New supervising account")} *
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                disabled={loadingSubs}
                className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E4590F] bg-white"
              >
                <option value="">
                  {loadingSubs
                    ? t("agencyReassign.loading", "Loading…")
                    : t("agencyReassign.selectPlaceholder", "Select…")}
                </option>
                {user?.role === "admin" && user.id != null ? (
                  <option value={String(user.id)}>
                    {user.name || t("role.admin", "Admin")} ({t("role.admin", "Admin")})
                  </option>
                ) : null}
                {subAdmins.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} — {s.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B]/70 mb-1">
                {t("agencyReassign.effectiveFrom", "Effective from")} *
              </label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E4590F]"
              />
              <p className="text-xs text-[#2B2B2B]/50 mt-1">
                {t(
                  "agencyReassign.effectiveFromHint",
                  "Previous management ends the day before this date. Example: set 2026-05-01 so April ends under the previous account."
                )}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2B2B2B]/70 mb-1">
                {t("agencyReassign.reason", "Reason / note (optional)")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E4590F] resize-none"
                placeholder={t(
                  "agencyReassign.reasonPlaceholder",
                  "e.g. Transfer IT Voyages to Esther Ahouman"
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium disabled:opacity-50"
              >
                {submitting
                  ? t("agencyReassign.submitting", "Reassigning…")
                  : t("agencyReassign.confirm", "Reassign")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {loadingHistory ? (
              <p className="text-sm text-[#2B2B2B]/60 py-6 text-center">
                {t("agencyReassign.loadingHistory", "Loading history…")}
              </p>
            ) : history.length === 0 ? (
              <p className="text-sm text-[#2B2B2B]/60 py-6 text-center">
                {t("agencyReassign.noHistory", "No management periods recorded yet.")}
              </p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {history.map((item) => (
                  <li
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      item.is_current
                        ? "border-[#E4590F]/40 bg-[#E4590F]/5"
                        : "border-[#D9D9D9] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {formatPeriodLabel(item, t, i18n.language)}
                    </div>
                    <div className="text-sm text-[#2B2B2B] mt-1">
                      {t("agencyReassign.managedBy", "Managed by")}:{" "}
                      <span className="font-medium">
                        {item.supervisor_name || t("agencyReassign.unassigned", "Unassigned")}
                      </span>
                      {item.supervisor_role ? (
                        <span className="text-[#2B2B2B]/60">
                          {" "}
                          ({roleLabel(item.supervisor_role)})
                        </span>
                      ) : null}
                    </div>
                    {item.changed_by_name ? (
                      <div className="text-xs text-[#2B2B2B]/55 mt-1">
                        {t("agencyReassign.modifiedBy", "Recorded by")} {item.changed_by_name}
                        {item.created_at
                          ? ` · ${formatPeriodDate(String(item.created_at).slice(0, 10), i18n.language)}`
                          : ""}
                      </div>
                    ) : null}
                    {item.reason ? (
                      <div className="text-xs text-[#2B2B2B]/70 mt-1 italic">{item.reason}</div>
                    ) : null}
                    {item.is_current ? (
                      <span className="inline-block mt-2 text-xs font-medium text-[#E4590F]">
                        {t("agencyReassign.currentPeriod", "Current period")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium"
              >
                {t("common.close", "Close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyReassignModal;
