// ApiKeys.tsx
//
// Superadmin management of third-party API keys.
//
// The endpoints behind this page already existed; what was missing was any way
// to reach them without a REST client, which meant every partner key had to be
// issued by a developer. This page closes that gap.
//
// SECRETS: the server stores only a SHA-256 hash, so the full key exists for
// exactly one render — the modal shown after a create or a rotate. Everything
// else in the UI works off `key_prefix`.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  Clock,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  listApiKeyScopesApi,
  listApiKeysApi,
  getApiKeyApi,
  createApiKeyApi,
  updateApiKeyApi,
  rotateApiKeyApi,
  revokeApiKeyApi,
  type ApiKey,
  type ApiKeyDetail,
  type IssuedApiKey,
} from "../api/apiKeysApi";
import {
  listAttributionCandidatesApi,
  type AttributionCandidate,
} from "../api/whatsappSettingsApi";

/* ------------------------------------------------------------------ helpers */

const errorMessage = (e: unknown, fallback: string): string => {
  const anyErr = e as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    anyErr?.response?.data?.error?.message ||
    anyErr?.response?.data?.message ||
    fallback
  );
};

/**
 * Scopes are grouped for the picker only. The list itself comes from the server
 * so a scope added in the backend still appears here — under "Other" if it does
 * not match a known prefix.
 */
const SCOPE_GROUPS: { id: string; fallback: string; prefixes: string[] }[] = [
  { id: "catalogue", fallback: "Catalogue", prefixes: ["catalogue"] },
  { id: "cases", fallback: "Cases", prefixes: ["cases"] },
  { id: "sales", fallback: "Sales", prefixes: ["sales"] },
  { id: "reports", fallback: "Reports", prefixes: ["ledger", "invoices"] },
  { id: "agents", fallback: "Agents", prefixes: ["agents"] },
  { id: "quotes", fallback: "Quotes", prefixes: ["quotes"] },
  { id: "zones", fallback: "Destination zones", prefixes: ["zones"] },
  { id: "whatsapp", fallback: "WhatsApp", prefixes: ["whatsapp"] },
];

const groupForScope = (scope: string): string => {
  const family = scope.split(":")[0];
  const hit = SCOPE_GROUPS.find((g) => g.prefixes.includes(family));
  return hit ? hit.id : "other";
};

type EffectiveStatus = "active" | "revoked" | "expired";

const effectiveStatus = (k: ApiKey): EffectiveStatus => {
  if (k.status === "revoked") return "revoked";
  if (k.expires_at && new Date(k.expires_at).getTime() <= Date.now()) return "expired";
  return "active";
};

/** Days until expiry, or null when the key never expires. Negative when past. */
const daysUntil = (iso: string | null): number | null => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
};

const toDateInput = (iso: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

/* ------------------------------------------------------------- UI primitives */

const inputClass =
  "w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F] transition disabled:bg-secondary-light/60 disabled:text-gray-500";

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, children, actions }) => (
  <section className="rounded-2xl border border-[#D9D9D9] bg-white shadow-sm overflow-hidden">
    <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#D9D9D9] bg-secondary-light/40">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#E4590F]/10 text-[#E4590F]">
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      {actions}
    </header>
    <div className="p-5 space-y-5">{children}</div>
  </section>
);

const Field: React.FC<{
  label: string;
  hint?: string | null;
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ label, hint, htmlFor, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-gray-500 leading-relaxed">{hint}</p>}
  </div>
);

const CopyButton: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("apiKeys.copyFailed", "Could not copy to the clipboard."));
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#D9D9D9] px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? t("apiKeys.copied", "Copied") : label || t("apiKeys.copy", "Copy")}
    </button>
  );
};

const StatusPill: React.FC<{ status: EffectiveStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const map: Record<EffectiveStatus, { cls: string; label: string }> = {
    active: {
      cls: "border-green-200 bg-green-50 text-green-700",
      label: t("apiKeys.statusActive", "Active"),
    },
    expired: {
      cls: "border-amber-200 bg-amber-50 text-amber-700",
      label: t("apiKeys.statusExpired", "Expired"),
    },
    revoked: {
      cls: "border-gray-200 bg-gray-50 text-gray-600",
      label: t("apiKeys.statusRevoked", "Revoked"),
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
};

const ScopeBadge: React.FC<{ scope: string }> = ({ scope }) => (
  <span className="inline-flex items-center rounded-lg border border-[#D9D9D9] bg-secondary-light/50 px-2 py-0.5 font-mono text-[11px] text-gray-700">
    {scope}
  </span>
);

/**
 * Grouped scope checkboxes. Each group header toggles the whole group, which is
 * what an operator actually wants when handing a partner "all of sales".
 */
const ScopePicker: React.FC<{
  all: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}> = ({ all, selected, onChange, disabled }) => {
  const { t } = useTranslation();
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const grouped = useMemo(() => {
    const byGroup = new Map<string, string[]>();
    all.forEach((scope) => {
      const g = groupForScope(scope);
      byGroup.set(g, [...(byGroup.get(g) || []), scope]);
    });
    const ordered = [...SCOPE_GROUPS.map((g) => g.id), "other"];
    return ordered
      .filter((id) => byGroup.has(id))
      .map((id) => ({
        id,
        label:
          id === "other"
            ? t("apiKeys.scopeGroup.other", "Other")
            : t(
                `apiKeys.scopeGroup.${id}`,
                SCOPE_GROUPS.find((g) => g.id === id)?.fallback || id
              ),
        scopes: byGroup.get(id) as string[],
      }));
  }, [all, t]);

  const toggleScope = (scope: string) => {
    onChange(
      selectedSet.has(scope) ? selected.filter((s) => s !== scope) : [...selected, scope]
    );
  };

  const toggleGroup = (scopes: string[]) => {
    const allOn = scopes.every((s) => selectedSet.has(s));
    onChange(
      allOn
        ? selected.filter((s) => !scopes.includes(s))
        : [...selected, ...scopes.filter((s) => !selectedSet.has(s))]
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {t("apiKeys.scopesSelected", "{{count}} of {{total}} selected", {
            count: selected.length,
            total: all.length,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([...all])}
            className="text-[11px] font-medium text-gray-600 hover:text-[#E4590F] transition disabled:opacity-50"
          >
            {t("apiKeys.selectAll", "Select all")}
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([])}
            className="text-[11px] font-medium text-gray-600 hover:text-[#E4590F] transition disabled:opacity-50"
          >
            {t("apiKeys.clearAll", "Clear")}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {grouped.map((group) => {
          const allOn = group.scopes.every((s) => selectedSet.has(s));
          const someOn = !allOn && group.scopes.some((s) => selectedSet.has(s));
          return (
            <div
              key={group.id}
              className="rounded-xl border border-[#D9D9D9] bg-white overflow-hidden"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleGroup(group.scopes)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-secondary-light/40 border-b border-[#D9D9D9] text-left disabled:opacity-60"
              >
                <span className="text-xs font-semibold text-gray-800">{group.label}</span>
                <span
                  className={`grid place-items-center w-4 h-4 rounded border transition ${
                    allOn
                      ? "bg-[#E4590F] border-[#E4590F] text-white"
                      : someOn
                        ? "bg-[#E4590F]/20 border-[#E4590F]/50"
                        : "border-[#D9D9D9] bg-white"
                  }`}
                >
                  {allOn && <Check className="w-3 h-3" />}
                </span>
              </button>
              <div className="p-2 space-y-1">
                {group.scopes.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary-light/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={selectedSet.has(scope)}
                      onChange={() => toggleScope(scope)}
                      className="w-3.5 h-3.5 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]/30"
                    />
                    <span className="font-mono text-[12px] text-gray-700">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * The one and only time the full secret is visible. Deliberately modal and
 * dismiss-on-purpose: closing it by accident means rotating the key.
 */
const SecretModal: React.FC<{ issued: IssuedApiKey; rotated: boolean; onClose: () => void }> = ({
  issued,
  rotated,
  onClose,
}) => {
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#D9D9D9] bg-white shadow-xl overflow-hidden">
        <header className="flex items-start gap-3 px-5 py-4 border-b border-[#D9D9D9] bg-secondary-light/40">
          <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#E4590F]/10 text-[#E4590F]">
            <KeyRound className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {rotated
                ? t("apiKeys.rotatedTitle", "Key rotated")
                : t("apiKeys.createdTitle", "Key created")}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">{issued.name}</p>
          </div>
        </header>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              {rotated
                ? t(
                    "apiKeys.rotatedWarning",
                    "The previous secret stopped working immediately. Copy the new one now — it cannot be shown again."
                  )
                : t(
                    "apiKeys.createdWarning",
                    "Copy this secret now. Only a hash is stored, so it cannot be shown again. If it is lost, rotate the key."
                  )}
            </p>
          </div>

          <Field label={t("apiKeys.secret", "API key")}>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 rounded-xl border border-[#D9D9D9] bg-secondary-light/50 px-3 py-2.5 font-mono text-[12px] text-gray-900 break-all">
                {issued.secret}
              </code>
              <CopyButton value={issued.secret} />
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("apiKeys.prefix", "Prefix")}>
              <p className="rounded-xl border border-[#D9D9D9] px-3 py-2.5 font-mono text-[12px] text-gray-700">
                {issued.key_prefix}
              </p>
            </Field>
            <Field label={t("apiKeys.expiry", "Expires")}>
              <p className="rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-[12px] text-gray-700">
                {issued.expires_at
                  ? new Date(issued.expires_at).toLocaleDateString()
                  : t("apiKeys.never", "Never")}
              </p>
            </Field>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {issued.scopes.map((s) => (
              <ScopeBadge key={s} scope={s} />
            ))}
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-[#D9D9D9] px-3.5 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-[#D9D9D9] text-[#E4590F] focus:ring-[#E4590F]/30"
            />
            <span className="text-xs text-gray-700 leading-relaxed">
              {t("apiKeys.acknowledge", "I have copied the key and stored it securely.")}
            </span>
          </label>
        </div>

        <footer className="flex justify-end gap-2 px-5 py-4 border-t border-[#D9D9D9] bg-secondary-light/30">
          <button
            type="button"
            disabled={!acknowledged}
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c74c0d] transition disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {t("apiKeys.done", "Done")}
          </button>
        </footer>
      </div>
    </div>
  );
};

/** Small blocking confirmation, used for the two destructive actions. */
const ConfirmDialog: React.FC<{
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, body, confirmLabel, danger, busy, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#D9D9D9] bg-white shadow-xl overflow-hidden">
        <div className="flex items-start gap-3 p-5">
          <span
            className={`shrink-0 grid place-items-center w-9 h-9 rounded-xl ${
              danger ? "bg-red-50 text-red-600" : "bg-[#E4590F]/10 text-[#E4590F]"
            }`}
          >
            <ShieldAlert className="w-4.5 h-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">{body}</p>
          </div>
        </div>
        <footer className="flex justify-end gap-2 px-5 py-4 border-t border-[#D9D9D9] bg-secondary-light/30">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-60"
          >
            {t("apiKeys.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-[#E4590F] hover:bg-[#c74c0d]"
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
};

/** Details, editable metadata and the recent request log for one key. */
const DetailModal: React.FC<{
  keyId: number;
  allScopes: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ keyId, allScopes, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<ApiKeyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApiKeyApi(keyId);
      const d = res.data;
      setDetail(d);
      setName(d.name);
      setScopes(d.scopes);
      setIpAllowlist(d.ip_allowlist || "");
      setRateLimit(d.rate_limit_per_min ? String(d.rate_limit_per_min) : "");
      setExpiresAt(toDateInput(d.expires_at));
    } catch (e) {
      toast.error(errorMessage(e, t("apiKeys.loadOneFailed", "Could not load this key.")));
      onClose();
    } finally {
      setLoading(false);
    }
  }, [keyId, onClose, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty =
    !!detail &&
    (name.trim() !== detail.name ||
      ipAllowlist !== (detail.ip_allowlist || "") ||
      rateLimit !== (detail.rate_limit_per_min ? String(detail.rate_limit_per_min) : "") ||
      expiresAt !== toDateInput(detail.expires_at) ||
      scopes.slice().sort().join(",") !== detail.scopes.slice().sort().join(","));

  const onSave = async () => {
    if (!detail) return;
    if (!name.trim()) {
      toast.error(t("apiKeys.nameRequired", "A name is required."));
      return;
    }
    if (scopes.length === 0) {
      toast.error(t("apiKeys.scopeRequired", "Select at least one scope."));
      return;
    }
    setSaving(true);
    try {
      await updateApiKeyApi(detail.id, {
        name: name.trim(),
        scopes,
        ip_allowlist: ipAllowlist.trim() ? ipAllowlist.trim() : null,
        rate_limit_per_min: rateLimit ? Number(rateLimit) : null,
        expires_at: expiresAt ? expiresAt : null,
      });
      toast.success(t("apiKeys.saved", "Key updated."));
      onSaved();
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t("apiKeys.saveFailed", "Could not update the key.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-2xl border border-[#D9D9D9] bg-white shadow-xl overflow-hidden">
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#D9D9D9] bg-secondary-light/40">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-[#E4590F]/10 text-[#E4590F]">
              <KeyRound className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {detail ? detail.name : t("apiKeys.loading", "Loading…")}
              </h3>
              {detail && (
                <p className="mt-0.5 font-mono text-xs text-gray-500">{detail.key_prefix}…</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {loading || !detail ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#E4590F]" />
          </div>
        ) : (
          <>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* ------------------------------------------------- read-only facts */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                  <p className="text-[11px] text-gray-500">{t("apiKeys.owner", "Owner")}</p>
                  <p className="mt-0.5 text-sm text-gray-900 truncate">
                    {detail.owner.name || detail.owner.email || `#${detail.owner.id}`}
                  </p>
                  <p className="text-[11px] text-gray-500">{detail.owner.role}</p>
                </div>
                <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                  <p className="text-[11px] text-gray-500">{t("apiKeys.lastUsed", "Last used")}</p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {detail.last_used_at
                      ? new Date(detail.last_used_at).toLocaleString()
                      : t("apiKeys.neverUsed", "Never")}
                  </p>
                  {detail.last_used_ip && (
                    <p className="font-mono text-[11px] text-gray-500">{detail.last_used_ip}</p>
                  )}
                </div>
                <div className="rounded-xl border border-[#D9D9D9] px-3.5 py-3">
                  <p className="text-[11px] text-gray-500">{t("apiKeys.created", "Created")}</p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {new Date(detail.created_at).toLocaleDateString()}
                  </p>
                  {detail.created_by.email && (
                    <p className="text-[11px] text-gray-500 truncate">{detail.created_by.email}</p>
                  )}
                </div>
              </div>

              {/* ------------------------------------------------------ editable bits */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("apiKeys.name", "Name")}>
                  <input
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={detail.status === "revoked"}
                  />
                </Field>
                <Field
                  label={t("apiKeys.expiry", "Expires")}
                  hint={t("apiKeys.expiryHint", "Leave empty for a key that never expires.")}
                >
                  <input
                    type="date"
                    className={inputClass}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={detail.status === "revoked"}
                  />
                </Field>
                <Field
                  label={t("apiKeys.ipAllowlist", "IP allowlist")}
                  hint={t(
                    "apiKeys.ipAllowlistHint",
                    "Comma-separated addresses. Empty means any IP may use the key."
                  )}
                >
                  <input
                    className={inputClass}
                    placeholder="203.0.113.4, 198.51.100.7"
                    value={ipAllowlist}
                    onChange={(e) => setIpAllowlist(e.target.value)}
                    disabled={detail.status === "revoked"}
                  />
                </Field>
                <Field
                  label={t("apiKeys.rateLimit", "Rate limit (requests/minute)")}
                  hint={t("apiKeys.rateLimitHint", "Empty uses the server default.")}
                >
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    className={inputClass}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    disabled={detail.status === "revoked"}
                  />
                </Field>
              </div>

              <Field label={t("apiKeys.scopes", "Scopes")}>
                <ScopePicker
                  all={allScopes}
                  selected={scopes}
                  onChange={setScopes}
                  disabled={detail.status === "revoked"}
                />
              </Field>

              {/* -------------------------------------------------------- usage log */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <h4 className="text-xs font-semibold text-gray-800">
                    {t("apiKeys.recentUsage", "Recent requests")}
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    {t("apiKeys.recentUsageCount", "{{count}} logged", {
                      count: detail.recent_usage.length,
                    })}
                  </span>
                </div>
                {detail.recent_usage.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#D9D9D9] px-3.5 py-6 text-center text-xs text-gray-500">
                    {t("apiKeys.noUsage", "This key has not made any requests yet.")}
                  </p>
                ) : (
                  <div className="rounded-xl border border-[#D9D9D9] overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="bg-secondary-light/50 sticky top-0">
                          <tr className="text-[11px] text-gray-600">
                            <th className="px-3 py-2 font-medium">
                              {t("apiKeys.usageWhen", "When")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("apiKeys.usageRequest", "Request")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("apiKeys.usageStatus", "Status")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("apiKeys.usageTime", "Time")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFEFEF]">
                          {detail.recent_usage.map((row) => (
                            <tr key={row.id} className="text-[12px] text-gray-700">
                              <td className="px-3 py-2 whitespace-nowrap">
                                {new Date(row.created_at).toLocaleString()}
                              </td>
                              <td className="px-3 py-2 font-mono truncate max-w-[280px]">
                                <span className="text-gray-500">{row.method}</span> {row.path}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={
                                    row.status_code >= 500
                                      ? "text-red-600"
                                      : row.status_code >= 400
                                        ? "text-amber-600"
                                        : "text-green-600"
                                  }
                                >
                                  {row.status_code}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {row.elapsed_ms != null ? `${row.elapsed_ms} ms` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#D9D9D9] bg-secondary-light/30">
              <p className="text-[11px] text-gray-500">
                {detail.status === "revoked"
                  ? t("apiKeys.revokedNote", "This key is revoked and can no longer be changed.")
                  : dirty
                    ? t("apiKeys.unsaved", "Unsaved changes")
                    : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                >
                  {t("apiKeys.close", "Close")}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!dirty || saving || detail.status === "revoked"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c74c0d] transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t("apiKeys.save", "Save changes")}
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------- page */

const EXPIRY_WARNING_DAYS = 14;

const defaultExpiry = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const ApiKeys: React.FC = () => {
  const { t } = useTranslation();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [allScopes, setAllScopes] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<AttributionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState<string>("");
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [newIpAllowlist, setNewIpAllowlist] = useState("");
  const [newRateLimit, setNewRateLimit] = useState("120");
  const [newExpiry, setNewExpiry] = useState(defaultExpiry);

  const [issued, setIssued] = useState<{ key: IssuedApiKey; rotated: boolean } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "revoke" | "rotate"; key: ApiKey } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      try {
        const [scopesRes, keysRes] = await Promise.all([
          listApiKeyScopesApi(),
          listApiKeysApi(),
        ]);
        setAllScopes(scopesRes.data);
        setKeys(keysRes.data);
      } catch (e) {
        toast.error(errorMessage(e, t("apiKeys.loadFailed", "Could not load the API keys.")));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void load();
    listAttributionCandidatesApi()
      .then((res) => setCandidates(res.data))
      .catch(() => {
        /* the owner list is a convenience; the page still works without it */
      });
  }, [load]);

  const expiringSoon = useMemo(
    () =>
      keys.filter((k) => {
        if (effectiveStatus(k) !== "active") return false;
        const d = daysUntil(k.expires_at);
        return d !== null && d <= EXPIRY_WARNING_DAYS;
      }),
    [keys]
  );

  const resetCreateForm = () => {
    setNewName("");
    setNewOwner("");
    setNewScopes([]);
    setNewIpAllowlist("");
    setNewRateLimit("120");
    setNewExpiry(defaultExpiry());
  };

  const onCreate = async () => {
    if (!newName.trim()) {
      toast.error(t("apiKeys.nameRequired", "A name is required."));
      return;
    }
    if (!newOwner) {
      toast.error(t("apiKeys.ownerRequired", "Choose the account this key belongs to."));
      return;
    }
    if (newScopes.length === 0) {
      toast.error(t("apiKeys.scopeRequired", "Select at least one scope."));
      return;
    }
    setCreating(true);
    try {
      const res = await createApiKeyApi({
        name: newName.trim(),
        owner_user_id: Number(newOwner),
        scopes: newScopes,
        ip_allowlist: newIpAllowlist.trim() ? newIpAllowlist.trim() : null,
        rate_limit_per_min: newRateLimit ? Number(newRateLimit) : null,
        expires_at: newExpiry ? newExpiry : null,
      });
      setIssued({ key: res.data, rotated: false });
      setShowCreate(false);
      resetCreateForm();
      await load(true);
    } catch (e) {
      toast.error(errorMessage(e, t("apiKeys.createFailed", "Could not create the key.")));
    } finally {
      setCreating(false);
    }
  };

  const onConfirmAction = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.kind === "revoke") {
        await revokeApiKeyApi(confirm.key.id);
        toast.success(t("apiKeys.revoked", "Key revoked."));
        setConfirm(null);
      } else {
        const res = await rotateApiKeyApi(confirm.key.id);
        setConfirm(null);
        setIssued({ key: res.data, rotated: true });
      }
      await load(true);
    } catch (e) {
      toast.error(errorMessage(e, t("apiKeys.actionFailed", "The action could not be completed.")));
    } finally {
      setActing(false);
    }
  };

  /* ------------------------------------------------------------------ render */

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-[#E4590F]" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* ------------------------------------------------------------- header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("apiKeys.title", "API keys")}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "apiKeys.subtitle",
              "Keys that let a partner call the platform API. Only a hash is stored, so a secret is shown once at creation and once at each rotation."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("apiKeys.refresh", "Refresh")}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c74c0d] transition"
          >
            {showCreate ? <ChevronDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {t("apiKeys.newKey", "New key")}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------- expiring soon notice */}
      {expiringSoon.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 min-w-0">
            <p className="font-medium">
              {t("apiKeys.expiringTitle", "Keys expiring soon")}
            </p>
            <p className="mt-1 text-amber-700 leading-relaxed">
              {t(
                "apiKeys.expiringBody",
                "These keys stop working on the dates below. Rotate or extend them before the integration starts returning 401:"
              )}
            </p>
            <ul className="mt-2 space-y-1">
              {expiringSoon.map((k) => (
                <li key={k.id} className="text-[13px] text-amber-800">
                  <span className="font-medium">{k.name}</span>{" "}
                  <span className="font-mono text-amber-700">{k.key_prefix}…</span>{" "}
                  —{" "}
                  {t("apiKeys.expiringIn", "{{count}} day(s) left", {
                    count: Math.max(0, daysUntil(k.expires_at) ?? 0),
                  })}{" "}
                  ({new Date(k.expires_at as string).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- create a key */}
      {showCreate && (
        <div className="mb-6">
          <SectionCard
            icon={Plus}
            title={t("apiKeys.createTitle", "Issue a new key")}
            subtitle={t(
              "apiKeys.createSubtitle",
              "Grant only the scopes the partner actually calls. Scopes can be changed later without reissuing the secret."
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("apiKeys.name", "Name")}
                hint={t("apiKeys.nameHint", "How this key is identified in the list, e.g. the partner's name.")}
              >
                <input
                  className={inputClass}
                  placeholder={t("apiKeys.namePlaceholder", "Partner production key")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Field>

              <Field
                label={t("apiKeys.owner", "Owner")}
                hint={t(
                  "apiKeys.ownerHint",
                  "The account every sale made with this key is attributed to."
                )}
              >
                <select
                  className={inputClass}
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                >
                  <option value="">{t("apiKeys.ownerPlaceholder", "Select an account")}</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.email} ({c.role})
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={t("apiKeys.expiry", "Expires")}
                hint={t("apiKeys.expiryHint", "Leave empty for a key that never expires.")}
              >
                <input
                  type="date"
                  className={inputClass}
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </Field>

              <Field
                label={t("apiKeys.rateLimit", "Rate limit (requests/minute)")}
                hint={t("apiKeys.rateLimitHint", "Empty uses the server default.")}
              >
                <input
                  type="number"
                  min={1}
                  max={10000}
                  className={inputClass}
                  value={newRateLimit}
                  onChange={(e) => setNewRateLimit(e.target.value)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  label={t("apiKeys.ipAllowlist", "IP allowlist")}
                  hint={t(
                    "apiKeys.ipAllowlistHint",
                    "Comma-separated addresses. Empty means any IP may use the key."
                  )}
                >
                  <input
                    className={inputClass}
                    placeholder="203.0.113.4, 198.51.100.7"
                    value={newIpAllowlist}
                    onChange={(e) => setNewIpAllowlist(e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <Field label={t("apiKeys.scopes", "Scopes")}>
              <ScopePicker all={allScopes} selected={newScopes} onChange={setNewScopes} />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
                className="rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
              >
                {t("apiKeys.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={onCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#c74c0d] transition disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                {t("apiKeys.createSubmit", "Create key")}
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* --------------------------------------------------------- the key list */}
      <SectionCard
        icon={KeyRound}
        title={t("apiKeys.listTitle", "Issued keys")}
        subtitle={t("apiKeys.listSubtitle", "{{count}} key(s) on this platform", {
          count: keys.length,
        })}
      >
        {keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D9D9D9] px-4 py-12 text-center">
            <KeyRound className="w-6 h-6 mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-600">
              {t("apiKeys.emptyTitle", "No API keys yet")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t("apiKeys.emptyBody", "Issue one to let a partner call the platform API.")}
            </p>
          </div>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary-light/50 border-y border-[#D9D9D9]">
                <tr className="text-[11px] text-gray-600">
                  <th className="px-5 py-2.5 font-medium">{t("apiKeys.colKey", "Key")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("apiKeys.owner", "Owner")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("apiKeys.scopes", "Scopes")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("apiKeys.colStatus", "Status")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("apiKeys.lastUsed", "Last used")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("apiKeys.expiry", "Expires")}</th>
                  <th className="px-5 py-2.5 font-medium text-right">
                    {t("apiKeys.colActions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEF]">
                {keys.map((k) => {
                  const status = effectiveStatus(k);
                  const left = daysUntil(k.expires_at);
                  return (
                    <tr key={k.id} className="hover:bg-secondary-light/30 transition">
                      <td className="px-5 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setDetailId(k.id)}
                          className="text-sm font-medium text-gray-900 hover:text-[#E4590F] transition text-left"
                        >
                          {k.name}
                        </button>
                        <p className="mt-0.5 font-mono text-[11px] text-gray-500">
                          {k.key_prefix}…
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="text-[13px] text-gray-800 truncate max-w-[180px]">
                          {k.owner.name || k.owner.email || `#${k.owner.id}`}
                        </p>
                        <p className="text-[11px] text-gray-500">{k.owner.role}</p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {k.scopes.slice(0, 3).map((s) => (
                            <ScopeBadge key={s} scope={s} />
                          ))}
                          {k.scopes.length > 3 && (
                            <span className="text-[11px] text-gray-500 self-center">
                              +{k.scopes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <StatusPill status={status} />
                      </td>
                      <td className="px-3 py-3 align-top text-[12px] text-gray-700 whitespace-nowrap">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString()
                          : t("apiKeys.neverUsed", "Never")}
                      </td>
                      <td className="px-3 py-3 align-top text-[12px] whitespace-nowrap">
                        {k.expires_at ? (
                          <span
                            className={
                              status === "active" && left !== null && left <= EXPIRY_WARNING_DAYS
                                ? "text-amber-700 font-medium"
                                : "text-gray-700"
                            }
                          >
                            {new Date(k.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-500">{t("apiKeys.never", "Never")}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailId(k.id)}
                            title={t("apiKeys.details", "Details")}
                            className="grid place-items-center w-8 h-8 rounded-lg border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={k.status === "revoked"}
                            onClick={() => setConfirm({ kind: "rotate", key: k })}
                            title={t("apiKeys.rotate", "Rotate")}
                            className="grid place-items-center w-8 h-8 rounded-lg border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-40 disabled:hover:text-gray-500 disabled:hover:border-[#D9D9D9]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={k.status === "revoked"}
                            onClick={() => setConfirm({ kind: "revoke", key: k })}
                            title={t("apiKeys.revoke", "Revoke")}
                            className="grid place-items-center w-8 h-8 rounded-lg border border-[#D9D9D9] text-gray-500 hover:text-red-600 hover:border-red-300 transition disabled:opacity-40 disabled:hover:text-gray-500 disabled:hover:border-[#D9D9D9]"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* --------------------------------------------------------------- modals */}
      {issued && (
        <SecretModal
          issued={issued.key}
          rotated={issued.rotated}
          onClose={() => setIssued(null)}
        />
      )}

      {detailId !== null && (
        <DetailModal
          keyId={detailId}
          allScopes={allScopes}
          onClose={() => setDetailId(null)}
          onSaved={() => void load(true)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          danger={confirm.kind === "revoke"}
          busy={acting}
          title={
            confirm.kind === "revoke"
              ? t("apiKeys.revokeTitle", "Revoke this key?")
              : t("apiKeys.rotateTitle", "Rotate this key?")
          }
          body={
            confirm.kind === "revoke"
              ? t(
                  "apiKeys.revokeBody",
                  "Every request made with this key will fail immediately. This cannot be undone — a new key would have to be issued."
                )
              : t(
                  "apiKeys.rotateBody",
                  "A new secret is issued with the same name and scopes, and the current secret stops working at once. The partner must be given the new secret."
                )
          }
          confirmLabel={
            confirm.kind === "revoke"
              ? t("apiKeys.revokeConfirm", "Revoke key")
              : t("apiKeys.rotateConfirm", "Rotate key")
          }
          onConfirm={onConfirmAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
};

export default ApiKeys;
