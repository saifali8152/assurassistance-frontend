// PaymentSettings.tsx
//
// Everything the insurer supplies, in one place: mobile money credentials,
// company identity, certificate wording and document number formats.
//
// WHY A SCREEN AND NOT .env — the provider credentials belong to the insurer,
// they arrive one market at a time as each merchant account clears, and they
// are rotated on the insurer's schedule, not on ours. A value that changes
// without a deploy does not belong in an environment variable.
//
// SECRETS: the API returns a mask, never the stored value. A secret field is
// therefore submitted only when the admin chooses to replace it, so saving a
// country list cannot blank out an API key.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Building2,
  FileSignature,
  Hash,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldAlert,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import {
  getPlatformSettingsApi,
  updatePlatformSettingsApi,
  PROVIDER_ORDER,
  type PlatformSetting,
  type PlatformSettingsPayload,
  type ProviderStatus,
} from "../api/platformSettingsApi";

/* ------------------------------------------------------------------ helpers */

type FormValue = string | number | boolean | null;

const errorMessage = (e: unknown, fallback: string): string => {
  const anyErr = e as {
    response?: { data?: { error?: { message?: string; fields?: { key: string; message: string }[] }; message?: string } };
  };
  const fields = anyErr?.response?.data?.error?.fields;
  if (fields?.length) return fields.map((f) => f.message).join(" · ");
  return anyErr?.response?.data?.error?.message || anyErr?.response?.data?.message || fallback;
};

/* ------------------------------------------------------------- UI primitives */

const inputClass =
  "w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F] transition disabled:bg-secondary-light/60 disabled:text-gray-500";

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
    <div className="p-5 space-y-5">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; hint?: string | null; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-gray-700">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-500 leading-relaxed">{hint}</p>}
  </div>
);

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}> = ({ checked, onChange, label, description }) => (
  <div className="flex items-start justify-between gap-4 rounded-xl border border-[#D9D9D9] bg-white px-4 py-3.5">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#E4590F]" : "bg-secondary-dark"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

/** A stored credential: masked until the admin chooses to replace it. */
const SecretField: React.FC<{
  label: string;
  hint?: string | null;
  masked: string | null;
  isSet: boolean;
  draft: string | null;
  onDraftChange: (v: string | null) => void;
}> = ({ label, hint, masked, isSet, draft, onDraftChange }) => {
  const { t } = useTranslation();
  const editing = draft !== null;

  return (
    <Field label={label} hint={hint}>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onDraftChange(null)}
            className="shrink-0 grid place-items-center w-10 h-10 rounded-xl border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
            title={t("paymentSettings.cancelChange", "Cancel change")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-secondary-light/50 px-3 py-2.5">
            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600 font-mono truncate">
              {isSet ? masked : t("paymentSettings.notSet", "Not set")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onDraftChange("")}
            className="shrink-0 rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
          >
            {isSet ? t("paymentSettings.replace", "Replace") : t("paymentSettings.set", "Set")}
          </button>
        </div>
      )}
    </Field>
  );
};

const ReadyPill: React.FC<{ provider: ProviderStatus }> = ({ provider }) => {
  const { t } = useTranslation();
  const cls = !provider.enabled
    ? "border-gray-200 bg-gray-50 text-gray-600"
    : provider.ready
      ? "border-green-200 bg-green-50 text-green-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const label = !provider.enabled
    ? t("paymentSettings.off", "Off")
    : provider.ready
      ? t("paymentSettings.ready", "Ready")
      : t("paymentSettings.incomplete", "Incomplete");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
};

/* --------------------------------------------------------------------- page */

const PaymentSettings: React.FC = () => {
  const { t } = useTranslation();

  const [payload, setPayload] = useState<PlatformSettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Edited values, keyed by setting key. A secret's draft of null means untouched. */
  const [form, setForm] = useState<Record<string, FormValue>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlatformSettingsApi();
      setPayload(res.data);
      const next: Record<string, FormValue> = {};
      for (const s of res.data.settings) {
        next[s.key] = s.secret ? null : ((s.value ?? "") as FormValue);
      }
      setForm(next);
    } catch (e) {
      toast.error(errorMessage(e, t("paymentSettings.loadFailed", "Could not load the settings.")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKey = useMemo(() => {
    const map = new Map<string, PlatformSetting>();
    for (const s of payload?.settings || []) map.set(s.key, s);
    return map;
  }, [payload]);

  const setValue = (key: string, value: FormValue) => setForm((f) => ({ ...f, [key]: value }));

  /** Only what actually changed, so a save cannot rewrite fields nobody touched. */
  const dirtyEntries = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const s of payload?.settings || []) {
      const current = form[s.key];
      if (s.secret) {
        if (current !== null && current !== undefined && current !== "") out[s.key] = current;
        continue;
      }
      const original = s.value ?? "";
      if (String(current ?? "") !== String(original)) out[s.key] = current;
    }
    return out;
  }, [form, payload]);

  const dirtyCount = Object.keys(dirtyEntries).length;

  const onSave = async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    try {
      const res = await updatePlatformSettingsApi(dirtyEntries);
      toast.success(
        res.message ||
          t("paymentSettings.saved", "{{count}} setting(s) saved", { count: res.data.changed.length })
      );
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t("paymentSettings.saveFailed", "Could not save the settings.")));
    } finally {
      setSaving(false);
    }
  };

  /** Render one setting from its registry metadata, so the screen holds no second copy of it. */
  const renderSetting = (key: string, labelOverride?: string, placeholder?: string) => {
    const s = byKey.get(key);
    if (!s) return null;
    const label = labelOverride || t(`paymentSettings.keys.${key}`, s.description || key);

    if (s.secret) {
      return (
        <SecretField
          key={key}
          label={label}
          hint={s.description}
          masked={s.masked}
          isSet={s.isSet}
          draft={(form[key] as string | null) ?? null}
          onDraftChange={(v) => setValue(key, v)}
        />
      );
    }

    if (s.type === "boolean") {
      return (
        <Toggle
          key={key}
          label={label}
          description={s.description || undefined}
          checked={Boolean(form[key])}
          onChange={(v) => setValue(key, v)}
        />
      );
    }

    if (s.allowed?.length) {
      return (
        <Field key={key} label={label} hint={s.description}>
          <select className={inputClass} value={String(form[key] ?? "")} onChange={(e) => setValue(key, e.target.value)}>
            {s.allowed.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
      );
    }

    return (
      <Field key={key} label={label} hint={s.description}>
        <input
          type={s.type === "number" ? "number" : "text"}
          className={inputClass}
          placeholder={placeholder}
          value={String(form[key] ?? "")}
          min={s.min ?? undefined}
          max={s.max ?? undefined}
          onChange={(e) => setValue(key, s.type === "number" ? e.target.value : e.target.value)}
        />
      </Field>
    );
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-[#E4590F]" />
      </div>
    );
  }

  if (!payload) return null;

  const providers = PROVIDER_ORDER.map((code) =>
    payload.payment.providers.find((p) => p.code === code)
  ).filter(Boolean) as ProviderStatus[];

  return (
    <div className="pb-28">
      {/* ------------------------------------------------------------- header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("paymentSettings.title", "Payment and company settings")}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                payload.payment.ready
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {payload.payment.ready
                ? t("paymentSettings.paymentsReady", "Payments ready")
                : t("paymentSettings.paymentsNotReady", "Payments not ready")}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "paymentSettings.subtitle",
              "Mobile money credentials, company identity and certificate wording. Changes take effect without restarting the server, and credentials are stored encrypted."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
        >
          <RefreshCw className="w-4 h-4" />
          {t("paymentSettings.refresh", "Refresh")}
        </button>
      </div>

      {/* ------------------------------------------------------------ warnings */}
      {!payload.encryptionAvailable && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 min-w-0">
            <p className="font-medium">
              {t("paymentSettings.noKeyTitle", "Encryption key missing on the server")}
            </p>
            <p className="mt-1 text-red-700 leading-relaxed">
              {t(
                "paymentSettings.noKeyBody",
                "Provider credentials cannot be saved until SETTINGS_ENCRYPTION_KEY is set in the server environment. Generate one and restart the service:"
              )}
            </p>
            <code className="mt-2 inline-block rounded-lg bg-red-100 px-2 py-1 font-mono text-[12px] text-red-900">
              openssl rand -hex 32
            </code>
          </div>
        </div>
      )}

      {payload.decryptionErrors.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {t("paymentSettings.decryptTitle", "Some credentials could not be read")}
            </p>
            <p className="mt-1 text-amber-700 leading-relaxed">
              {t("paymentSettings.decryptBody", "These were encrypted with a different key and must be entered again:")}{" "}
              <span className="font-mono">{payload.decryptionErrors.join(", ")}</span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* ------------------------------------------------------- payments */}
        <SectionCard
          icon={Wallet}
          title={t("paymentSettings.generalTitle", "Payments")}
          subtitle={t(
            "paymentSettings.generalSubtitle",
            "The master switch and the rules that apply to every provider."
          )}
        >
          {renderSetting("payment.enabled")}
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSetting("payment.currency")}
            {renderSetting("payment.timeout_minutes")}
            {renderSetting("payment.countries", undefined, "CI, SN, ML, BF")}
            {renderSetting("payment.settlement_note")}
          </div>
        </SectionCard>

        {/* ------------------------------------------------------ providers */}
        {providers.map((p) => (
          <SectionCard
            key={p.code}
            icon={Smartphone}
            title={p.label}
            subtitle={
              p.ready
                ? t("paymentSettings.providerReady", "Configured and offered to customers.")
                : p.missing.length
                  ? t("paymentSettings.providerMissing", "Still needed: {{fields}}", {
                      fields: p.missing.join(", "),
                    })
                  : t("paymentSettings.providerOff", "Switch it on once the credentials are in.")
            }
            actions={<ReadyPill provider={p} />}
          >
            {renderSetting(`payment.${p.code}.enabled`)}
            <div className="grid gap-4 sm:grid-cols-2">
              {renderSetting(`payment.${p.code}.label`)}
              {renderSetting(`payment.${p.code}.countries`, undefined, "CI, SN")}
              {renderSetting(`payment.${p.code}.msisdn_prefixes`, undefined, "07, 08, 09")}
              {renderSetting(`payment.${p.code}.base_url`, undefined, "https://api.provider.com")}
              {renderSetting(`payment.${p.code}.merchant_id`)}
              {renderSetting(`payment.${p.code}.api_user`)}
              {renderSetting(`payment.${p.code}.settlement_account`)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {renderSetting(`payment.${p.code}.api_key`)}
              {renderSetting(`payment.${p.code}.subscription_key`)}
              {renderSetting(`payment.${p.code}.callback_secret`)}
            </div>
          </SectionCard>
        ))}

        {/* -------------------------------------------------------- company */}
        <SectionCard
          icon={Building2}
          title={t("paymentSettings.companyTitle", "Company identity")}
          subtitle={t(
            "paymentSettings.companySubtitle",
            "Printed on every certificate and invoice. These were hardcoded until now."
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSetting("company.legal_name")}
            {renderSetting("company.address")}
            {renderSetting("company.phone")}
            {renderSetting("company.email")}
            {renderSetting("company.website")}
          </div>
        </SectionCard>

        {/* ---------------------------------------------------- certificate */}
        <SectionCard
          icon={FileSignature}
          title={t("paymentSettings.certificateTitle", "Certificate wording")}
          subtitle={t(
            "paymentSettings.certificateSubtitle",
            "The insurer's own wording, in both languages. Leaving a field empty keeps the built-in text."
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSetting("certificate.footer_fr")}
            {renderSetting("certificate.footer_en")}
            {renderSetting("certificate.terms_fr")}
            {renderSetting("certificate.terms_en")}
            {renderSetting("certificate.signature_name")}
            {renderSetting("certificate.signature_title")}
          </div>
        </SectionCard>

        {/* ------------------------------------------------------ numbering */}
        <SectionCard
          icon={Hash}
          title={t("paymentSettings.numberingTitle", "Document numbering")}
          subtitle={t(
            "paymentSettings.numberingSubtitle",
            "Tokens: {{tokens}}. A format must contain a sequence token, and changing one does not renumber documents already issued."
          , { tokens: "{YYYY} {YY} {MM} {SEQ:n}" })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {renderSetting("policy.number_format")}
            {renderSetting("policy.invoice_format")}
            {renderSetting("policy.certificate_format")}
          </div>
        </SectionCard>
      </div>

      {/* ------------------------------------------------------------ save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#D9D9D9] bg-white/95 backdrop-blur px-5 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {dirtyCount === 0
              ? t("paymentSettings.noChanges", "No unsaved changes")
              : t("paymentSettings.pending", "{{count}} unsaved change(s)", { count: dirtyCount })}
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={dirtyCount === 0 || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E4590F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#c74c0d] transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("paymentSettings.save", "Save changes")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
