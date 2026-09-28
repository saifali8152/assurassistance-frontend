// WhatsAppSettings.tsx
//
// Superadmin configuration for the WhatsApp Business API integration.
//
// Everything on this page used to live in .env, which meant a developer and a
// server restart for every change. Values are now stored in `app_settings`
// (credentials AES-256-GCM encrypted) and take effect without a redeploy.
//
// SECRETS: the API returns a mask, never the stored value. A secret field is
// therefore only submitted when the admin explicitly chooses to replace it, so
// saving the phone number id can never blank out the access token.
//
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  MessageSquare,
  Megaphone,
  Plug,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  ShieldAlert,
  UserCog,
  Webhook,
  X,
} from "lucide-react";
import {
  getWhatsAppSettingsApi,
  updateWhatsAppSettingsApi,
  testWhatsAppConnectionApi,
  regenerateVerifyTokenApi,
  revealVerifyTokenApi,
  listAttributionCandidatesApi,
  type AttributionCandidate,
  type ConnectionTestResult,
  type WhatsAppSetting,
  type WhatsAppSettingsPayload,
} from "../api/whatsappSettingsApi";

/* ------------------------------------------------------------------ helpers */

type FormValue = string | number | boolean | null;

const K = {
  enabled: "whatsapp.enabled",
  phoneNumberId: "whatsapp.phone_number_id",
  wabaId: "whatsapp.waba_id",
  businessNumber: "whatsapp.business_number",
  apiVersion: "whatsapp.api_version",
  accessToken: "whatsapp.access_token",
  appSecret: "whatsapp.app_secret",
  verifyToken: "whatsapp.verify_token",
  defaultLanguage: "whatsapp.default_language",
  sessionTimeout: "whatsapp.session_timeout_hours",
  retentionDays: "whatsapp.message_retention_days",
  maxRetries: "whatsapp.max_field_retries",
  escalationNumber: "whatsapp.escalation_number",
  attributionUserId: "whatsapp.attribution_user_id",
  templateLanguage: "whatsapp.template_language",
  templatePaymentReceived: "whatsapp.template_payment_received",
  templateCertificateReady: "whatsapp.template_certificate_ready",
  templateQuoteReminder: "whatsapp.template_quote_reminder",
} as const;

const errorMessage = (e: unknown, fallback: string): string => {
  const anyErr = e as { response?: { data?: { error?: { message?: string }; message?: string } } };
  return (
    anyErr?.response?.data?.error?.message ||
    anyErr?.response?.data?.message ||
    fallback
  );
};

/* ------------------------------------------------------------- UI primitives */

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
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{subtitle}</p>}
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

const inputClass =
  "w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#E4590F]/30 focus:border-[#E4590F] transition disabled:bg-secondary-light/60 disabled:text-gray-500";

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => (
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
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[#E4590F]" : "bg-secondary-dark"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

/**
 * A stored credential. Shows the mask until the admin chooses to replace it —
 * that one extra click is what stops a careless save from wiping a token.
 */
const SecretField: React.FC<{
  label: string;
  hint?: string | null;
  masked: string | null;
  isSet: boolean;
  draft: string | null;
  onDraftChange: (v: string | null) => void;
  placeholder?: string;
}> = ({ label, hint, masked, isSet, draft, onDraftChange, placeholder }) => {
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
            placeholder={placeholder}
            onChange={(e) => onDraftChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => onDraftChange(null)}
            className="shrink-0 grid place-items-center w-10 h-10 rounded-xl border border-[#D9D9D9] text-gray-500 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
            title={t("whatsappSettings.cancelChange", "Cancel change")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-secondary-light/50 px-3 py-2.5">
            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600 font-mono truncate">
              {isSet ? masked : t("whatsappSettings.notSet", "Not set")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onDraftChange("")}
            className="shrink-0 rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
          >
            {isSet
              ? t("whatsappSettings.replace", "Replace")
              : t("whatsappSettings.set", "Set")}
          </button>
        </div>
      )}
    </Field>
  );
};

const CopyButton: React.FC<{ value: string; label?: string }> = ({ value, label }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("whatsappSettings.copyFailed", "Could not copy to the clipboard."));
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#D9D9D9] px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? t("whatsappSettings.copied", "Copied") : label || t("whatsappSettings.copy", "Copy")}
    </button>
  );
};

/* ------------------------------------------------------------------ the page */

const WhatsAppSettings: React.FC = () => {
  const { t } = useTranslation();

  const [payload, setPayload] = useState<WhatsAppSettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  /** Plain (non-secret) field values, edited in place. */
  const [form, setForm] = useState<Record<string, FormValue>>({});
  /** Secret fields: null = untouched, string = a replacement the admin typed. */
  const [secretDrafts, setSecretDrafts] = useState<Record<string, string | null>>({});

  const [candidates, setCandidates] = useState<AttributionCandidate[]>([]);
  const [revealedVerifyToken, setRevealedVerifyToken] = useState<string | null>(null);

  const byKey = useMemo(() => {
    const m = new Map<string, WhatsAppSetting>();
    (payload?.settings || []).forEach((s) => m.set(s.key, s));
    return m;
  }, [payload]);

  const hydrate = useCallback((data: WhatsAppSettingsPayload) => {
    const next: Record<string, FormValue> = {};
    const secrets: Record<string, string | null> = {};
    data.settings.forEach((s) => {
      if (s.secret) secrets[s.key] = null;
      else next[s.key] = s.value ?? (s.type === "boolean" ? false : "");
    });
    setForm(next);
    setSecretDrafts(secrets);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWhatsAppSettingsApi();
      setPayload(res.data);
      hydrate(res.data);
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappSettings.loadError", "Could not load the WhatsApp settings.")));
    } finally {
      setLoading(false);
    }
  }, [hydrate, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listAttributionCandidatesApi()
      .then((res) => setCandidates(res.data || []))
      .catch(() => setCandidates([]));
  }, []);

  /* --------------------------------------------------------------- dirty state */

  const dirtyKeys = useMemo(() => {
    const keys: string[] = [];
    byKey.forEach((setting, key) => {
      if (setting.secret) {
        const draft = secretDrafts[key];
        if (draft !== null && draft !== undefined && draft !== "") keys.push(key);
        return;
      }
      const current = form[key];
      const original = setting.value ?? (setting.type === "boolean" ? false : "");
      if (String(current ?? "") !== String(original ?? "")) keys.push(key);
    });
    return keys;
  }, [byKey, form, secretDrafts]);

  const isDirty = dirtyKeys.length > 0;

  const setField = (key: string, value: FormValue) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setSecretDraft = (key: string, value: string | null) =>
    setSecretDrafts((prev) => ({ ...prev, [key]: value }));

  /* ------------------------------------------------------------------ actions */

  const onSave = async () => {
    if (!isDirty) return;

    const body: Record<string, unknown> = {};
    dirtyKeys.forEach((key) => {
      const setting = byKey.get(key);
      if (!setting) return;
      if (setting.secret) {
        body[key] = secretDrafts[key];
        return;
      }
      const v = form[key];
      // An emptied optional field is an intentional clear, expressed as null.
      body[key] = v === "" ? null : v;
    });

    try {
      setSaving(true);
      const res = await updateWhatsAppSettingsApi(body);
      toast.success(res.message || t("whatsappSettings.saved", "Settings saved."));
      setTestResult(null);
      setRevealedVerifyToken(null);
      await load();
    } catch (e) {
      const fields = (e as { response?: { data?: { error?: { fields?: { key: string; message: string }[] } } } })
        ?.response?.data?.error?.fields;
      if (fields?.length) {
        fields.forEach((f) => toast.error(`${f.key}: ${f.message}`));
      } else {
        toast.error(errorMessage(e, t("whatsappSettings.saveError", "Could not save the settings.")));
      }
    } finally {
      setSaving(false);
    }
  };

  const onDiscard = () => {
    if (payload) hydrate(payload);
    toast.success(t("whatsappSettings.discarded", "Changes discarded."));
  };

  const onTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await testWhatsAppConnectionApi();
      setTestResult(res.data);
      toast.success(res.message || t("whatsappSettings.testOk", "Connection to Meta confirmed."));
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappSettings.testError", "The connection test failed.")));
    } finally {
      setTesting(false);
    }
  };

  const onRegenerateVerifyToken = async () => {
    try {
      const res = await regenerateVerifyTokenApi();
      setRevealedVerifyToken(res.data.verifyToken);
      toast.success(
        res.message ||
          t("whatsappSettings.verifyTokenGenerated", "New verify token generated. Copy it into Meta.")
      );
      await load();
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappSettings.verifyTokenError", "Could not generate a verify token.")));
    }
  };

  const onRevealVerifyToken = async () => {
    try {
      const res = await revealVerifyTokenApi();
      setRevealedVerifyToken(res.data.verifyToken);
    } catch (e) {
      toast.error(errorMessage(e, t("whatsappSettings.revealError", "Could not read the verify token.")));
    }
  };

  /* -------------------------------------------------------------------- render */

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#E4590F]" />
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="max-w-md mx-auto mt-16 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {t("whatsappSettings.loadError", "Could not load the WhatsApp settings.")}
      </div>
    );
  }

  const status = payload.status;
  const enabled = Boolean(form[K.enabled]);

  const statusPill = (() => {
    if (!status.enabled) {
      return {
        label: t("whatsappSettings.statusDisabled", "Disabled"),
        cls: "bg-secondary-light text-gray-600 border-[#D9D9D9]",
      };
    }
    if (!status.ready) {
      return {
        label: t("whatsappSettings.statusIncomplete", "Incomplete"),
        cls: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return {
      label: t("whatsappSettings.statusLive", "Live"),
      cls: "bg-green-50 text-green-700 border-green-200",
    };
  })();

  const missingLabels: Record<string, string> = {
    phone_number_id: t("whatsappSettings.fieldPhoneNumberId", "Phone number ID"),
    access_token: t("whatsappSettings.fieldAccessToken", "Access token"),
    app_secret: t("whatsappSettings.fieldAppSecret", "App secret"),
    verify_token: t("whatsappSettings.fieldVerifyToken", "Verify token"),
  };

  return (
    <div className="pb-28">
      {/* ---------------------------------------------------------- page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("whatsappSettings.title", "WhatsApp Business settings")}
            </h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusPill.cls}`}>
              {statusPill.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl leading-relaxed">
            {t(
              "whatsappSettings.subtitle",
              "Credentials and conversation defaults for the WhatsApp purchase flow. Changes take effect without restarting the server, and credentials are stored encrypted."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-60"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
          {t("whatsappSettings.testConnection", "Test connection")}
        </button>
      </div>

      {/* ------------------------------------------------------------- warnings */}
      {!status.encryptionAvailable && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 min-w-0">
            <p className="font-medium">
              {t("whatsappSettings.noEncryptionKeyTitle", "Encryption key missing on the server")}
            </p>
            <p className="mt-1 text-red-700 leading-relaxed">
              {t(
                "whatsappSettings.noEncryptionKeyBody",
                "Credentials cannot be saved until SETTINGS_ENCRYPTION_KEY is set in the server environment. Generate one and restart the service:"
              )}
            </p>
            <code className="mt-2 inline-block rounded-lg bg-red-100 px-2 py-1 font-mono text-[12px] text-red-900">
              openssl rand -hex 32
            </code>
          </div>
        </div>
      )}

      {status.decryptionErrors.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {t("whatsappSettings.decryptErrorTitle", "Some credentials could not be read")}
            </p>
            <p className="mt-1 text-amber-700 leading-relaxed">
              {t(
                "whatsappSettings.decryptErrorBody",
                "These values were encrypted with a different key and must be entered again:"
              )}{" "}
              <span className="font-mono">{status.decryptionErrors.join(", ")}</span>
            </p>
          </div>
        </div>
      )}

      {status.enabled && !status.ready && status.missing.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">
              {t("whatsappSettings.incompleteTitle", "The flow is switched on but not yet operational")}
            </p>
            <p className="mt-1 text-amber-700">
              {t("whatsappSettings.incompleteBody", "Still required:")}{" "}
              {status.missing.map((m) => missingLabels[m] || m).join(", ")}
            </p>
          </div>
        </div>
      )}

      {testResult && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
          <BadgeCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">
              {t("whatsappSettings.testResultTitle", "Meta confirmed this number")}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-4">
              <div>
                <dt className="text-green-700/70">{t("whatsappSettings.testNumber", "Number")}</dt>
                <dd className="font-medium">{testResult.displayPhoneNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-green-700/70">{t("whatsappSettings.testName", "Verified name")}</dt>
                <dd className="font-medium">{testResult.verifiedName || "—"}</dd>
              </div>
              <div>
                <dt className="text-green-700/70">{t("whatsappSettings.testQuality", "Quality")}</dt>
                <dd className="font-medium">{testResult.qualityRating || "—"}</dd>
              </div>
              <div>
                <dt className="text-green-700/70">{t("whatsappSettings.testApi", "API version")}</dt>
                <dd className="font-medium">{testResult.apiVersion}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- cards */}
      <div className="grid gap-5 xl:grid-cols-2 items-start">
        <div className="space-y-5">
          <SectionCard
            icon={Settings2}
            title={t("whatsappSettings.statusSection", "Availability")}
            subtitle={t(
              "whatsappSettings.statusSectionHint",
              "Nothing is sent or answered on WhatsApp while this is off, even with valid credentials saved."
            )}
          >
            <Toggle
              label={t("whatsappSettings.enabledLabel", "WhatsApp purchase flow")}
              description={t(
                "whatsappSettings.enabledHint",
                "Turn on once the credentials below are saved and the connection test passes."
              )}
              checked={enabled}
              onChange={(v) => setField(K.enabled, v)}
            />
          </SectionCard>

          <SectionCard
            icon={KeyRound}
            title={t("whatsappSettings.connectionSection", "Meta connection")}
            subtitle={t(
              "whatsappSettings.connectionSectionHint",
              "From your Meta app dashboard. Credentials are encrypted before they are stored and are never displayed again."
            )}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("whatsappSettings.fieldPhoneNumberId", "Phone number ID")}
                hint={t("whatsappSettings.phoneNumberIdHint", "WhatsApp > API Setup > Phone number ID")}
                htmlFor="wa-phone-id"
              >
                <input
                  id="wa-phone-id"
                  className={inputClass}
                  value={String(form[K.phoneNumberId] ?? "")}
                  placeholder="123456789012345"
                  onChange={(e) => setField(K.phoneNumberId, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldWabaId", "Business account ID")}
                hint={t("whatsappSettings.wabaIdHint", "WhatsApp Business Account (WABA) ID")}
                htmlFor="wa-waba-id"
              >
                <input
                  id="wa-waba-id"
                  className={inputClass}
                  value={String(form[K.wabaId] ?? "")}
                  placeholder="987654321098765"
                  onChange={(e) => setField(K.wabaId, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldBusinessNumber", "Display number")}
                hint={t("whatsappSettings.businessNumberHint", "Shown to customers, e.g. +225 07 18 92 31 94")}
                htmlFor="wa-business-number"
              >
                <input
                  id="wa-business-number"
                  className={inputClass}
                  value={String(form[K.businessNumber] ?? "")}
                  placeholder="+225 07 18 92 31 94"
                  onChange={(e) => setField(K.businessNumber, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldApiVersion", "Graph API version")}
                hint={t("whatsappSettings.apiVersionHint", "Leave as-is unless Meta deprecates it")}
                htmlFor="wa-api-version"
              >
                <input
                  id="wa-api-version"
                  className={inputClass}
                  value={String(form[K.apiVersion] ?? "")}
                  placeholder="v21.0"
                  onChange={(e) => setField(K.apiVersion, e.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 pt-1">
              <SecretField
                label={t("whatsappSettings.fieldAccessToken", "Access token")}
                hint={t("whatsappSettings.accessTokenHint", "Permanent system-user token, not a temporary one")}
                masked={byKey.get(K.accessToken)?.masked ?? null}
                isSet={Boolean(byKey.get(K.accessToken)?.isSet)}
                draft={secretDrafts[K.accessToken] ?? null}
                onDraftChange={(v) => setSecretDraft(K.accessToken, v)}
                placeholder="EAAG…"
              />
              <SecretField
                label={t("whatsappSettings.fieldAppSecret", "App secret")}
                hint={t("whatsappSettings.appSecretHint", "Used to verify that incoming webhooks really came from Meta")}
                masked={byKey.get(K.appSecret)?.masked ?? null}
                isSet={Boolean(byKey.get(K.appSecret)?.isSet)}
                draft={secretDrafts[K.appSecret] ?? null}
                onDraftChange={(v) => setSecretDraft(K.appSecret, v)}
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            icon={Webhook}
            title={t("whatsappSettings.webhookSection", "Webhook")}
            subtitle={t(
              "whatsappSettings.webhookSectionHint",
              "Paste both values into Meta > WhatsApp > Configuration. The URL must be reachable over HTTPS."
            )}
          >
            <Field
              label={t("whatsappSettings.callbackUrl", "Callback URL")}
              hint={t("whatsappSettings.callbackUrlHint", "Derived from the server's public URL")}
            >
              <div className="flex items-center gap-2">
                <input readOnly className={`${inputClass} font-mono text-[13px]`} value={payload.webhook.url} />
                <CopyButton value={payload.webhook.url} />
              </div>
            </Field>

            <Field
              label={t("whatsappSettings.fieldVerifyToken", "Verify token")}
              hint={t(
                "whatsappSettings.verifyTokenHint",
                "Meta echoes this back when it verifies the webhook. Generate one here, then paste the same value into Meta."
              )}
            >
              {revealedVerifyToken ? (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    className={`${inputClass} font-mono text-[13px]`}
                    value={revealedVerifyToken}
                  />
                  <CopyButton value={revealedVerifyToken} />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[180px] flex items-center gap-2 rounded-xl border border-[#D9D9D9] bg-secondary-light/50 px-3 py-2.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600 font-mono truncate">
                      {payload.webhook.verifyTokenSet
                        ? byKey.get(K.verifyToken)?.masked
                        : t("whatsappSettings.notSet", "Not set")}
                    </span>
                  </div>
                  {payload.webhook.verifyTokenSet && (
                    <button
                      type="button"
                      onClick={onRevealVerifyToken}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-xs font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("whatsappSettings.reveal", "Reveal")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onRegenerateVerifyToken}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#E4590F] px-3 py-2.5 text-xs font-medium text-white hover:bg-[#C94A0D] transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {payload.webhook.verifyTokenSet
                      ? t("whatsappSettings.regenerate", "Regenerate")
                      : t("whatsappSettings.generate", "Generate")}
                  </button>
                </div>
              )}
            </Field>

            <p className="rounded-xl bg-secondary-light/50 px-3.5 py-3 text-[11px] leading-relaxed text-gray-600">
              {t(
                "whatsappSettings.revealNote",
                "Revealing or regenerating the verify token is recorded in the activity log. Regenerating it breaks the connection until the new value is saved in Meta as well."
              )}
            </p>
          </SectionCard>

          <SectionCard
            icon={MessageSquare}
            title={t("whatsappSettings.conversationSection", "Conversation")}
            subtitle={t(
              "whatsappSettings.conversationSectionHint",
              "How the assistant behaves during a purchase conversation."
            )}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("whatsappSettings.fieldDefaultLanguage", "Default language")}
                hint={t("whatsappSettings.defaultLanguageHint", "Used until the customer switches language")}
                htmlFor="wa-language"
              >
                <select
                  id="wa-language"
                  className={inputClass}
                  value={String(form[K.defaultLanguage] ?? "fr")}
                  onChange={(e) => setField(K.defaultLanguage, e.target.value)}
                >
                  <option value="fr">{t("whatsappSettings.french", "French")}</option>
                  <option value="en">{t("whatsappSettings.english", "English")}</option>
                </select>
              </Field>

              <Field
                label={t("whatsappSettings.fieldSessionTimeout", "Session timeout (hours)")}
                hint={t("whatsappSettings.sessionTimeoutHint", "Inactivity before a conversation is closed. 1–168.")}
                htmlFor="wa-timeout"
              >
                <input
                  id="wa-timeout"
                  type="number"
                  min={1}
                  max={168}
                  className={inputClass}
                  value={String(form[K.sessionTimeout] ?? 24)}
                  onChange={(e) => setField(K.sessionTimeout, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldRetention", "Transcript retention (days)")}
                hint={t(
                  "whatsappSettings.retentionHint",
                  "Transcripts contain personal data. Keep the shortest period support can work with. 7–3650."
                )}
                htmlFor="wa-retention"
              >
                <input
                  id="wa-retention"
                  type="number"
                  min={7}
                  max={3650}
                  className={inputClass}
                  value={String(form[K.retentionDays] ?? 180)}
                  onChange={(e) => setField(K.retentionDays, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldMaxRetries", "Retries per question")}
                hint={t("whatsappSettings.maxRetriesHint", "After this many invalid answers, simpler prompts are used. 1–10.")}
                htmlFor="wa-retries"
              >
                <input
                  id="wa-retries"
                  type="number"
                  min={1}
                  max={10}
                  className={inputClass}
                  value={String(form[K.maxRetries] ?? 3)}
                  onChange={(e) => setField(K.maxRetries, e.target.value)}
                />
              </Field>
            </div>

            <Field
              label={t("whatsappSettings.fieldEscalation", "Human agent number")}
              hint={t(
                "whatsappSettings.escalationHint",
                "Offered when a customer asks for a person. Leave empty to only log the request."
              )}
              htmlFor="wa-escalation"
            >
              <input
                id="wa-escalation"
                className={inputClass}
                value={String(form[K.escalationNumber] ?? "")}
                placeholder="+225 27 22 22 82 60"
                onChange={(e) => setField(K.escalationNumber, e.target.value)}
              />
            </Field>
          </SectionCard>

          <SectionCard
            icon={UserCog}
            title={t("whatsappSettings.attributionSection", "Sales attribution")}
            subtitle={t(
              "whatsappSettings.attributionSectionHint",
              "A WhatsApp customer has no agent, but commissions, partner invoices and the ledger are all keyed to an account. Choose which account owns this business."
            )}
          >
            <Field
              label={t("whatsappSettings.fieldAttribution", "Owning account")}
              hint={t(
                "whatsappSettings.attributionHint",
                "Cases and policies created through WhatsApp are recorded against this account."
              )}
              htmlFor="wa-attribution"
            >
              <select
                id="wa-attribution"
                className={inputClass}
                value={String(form[K.attributionUserId] ?? "")}
                onChange={(e) => setField(K.attributionUserId, e.target.value)}
              >
                <option value="">{t("whatsappSettings.attributionNone", "Not selected")}</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.email} ({c.role})
                  </option>
                ))}
              </select>
            </Field>
          </SectionCard>

          <SectionCard
            icon={Megaphone}
            title={t("whatsappSettings.templatesSection", "Message templates")}
            subtitle={t(
              "whatsappSettings.templatesSectionHint",
              "Meta only allows free-form messages within 24 hours of the customer's last message. Anything sent after that — a payment confirmation, a certificate notice — must be a template approved in WhatsApp Manager. Enter the approved names here."
            )}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("whatsappSettings.fieldTemplateLanguage", "Template locale")}
                hint={t("whatsappSettings.templateLanguageHint", "The locale the templates were approved under")}
                htmlFor="wa-template-lang"
              >
                <select
                  id="wa-template-lang"
                  className={inputClass}
                  value={String(form[K.templateLanguage] ?? "fr")}
                  onChange={(e) => setField(K.templateLanguage, e.target.value)}
                >
                  {["fr", "en", "fr_FR", "en_GB", "en_US"].map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </Field>

              <Field
                label={t("whatsappSettings.fieldTemplatePayment", "Payment confirmed")}
                hint={t("whatsappSettings.templatePaymentHint", "Sent once a payment is recorded")}
                htmlFor="wa-tpl-payment"
              >
                <input
                  id="wa-tpl-payment"
                  className={inputClass}
                  placeholder="payment_received"
                  value={String(form[K.templatePaymentReceived] ?? "")}
                  onChange={(e) => setField(K.templatePaymentReceived, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldTemplateCertificate", "Certificate ready")}
                hint={t("whatsappSettings.templateCertificateHint", "Sent once the certificate has been issued")}
                htmlFor="wa-tpl-cert"
              >
                <input
                  id="wa-tpl-cert"
                  className={inputClass}
                  placeholder="certificate_ready"
                  value={String(form[K.templateCertificateReady] ?? "")}
                  onChange={(e) => setField(K.templateCertificateReady, e.target.value)}
                />
              </Field>

              <Field
                label={t("whatsappSettings.fieldTemplateReminder", "Quote reminder")}
                hint={t("whatsappSettings.templateReminderHint", "Follow-up on a quote that was never paid")}
                htmlFor="wa-tpl-reminder"
              >
                <input
                  id="wa-tpl-reminder"
                  className={inputClass}
                  placeholder="quote_reminder"
                  value={String(form[K.templateQuoteReminder] ?? "")}
                  onChange={(e) => setField(K.templateQuoteReminder, e.target.value)}
                />
              </Field>
            </div>

            <p className="rounded-xl bg-secondary-light/50 px-3.5 py-3 text-[11px] leading-relaxed text-gray-600">
              {t(
                "whatsappSettings.templatesNote",
                "Templates are created and approved in Meta's WhatsApp Manager, which takes 24 to 48 hours. Leave a field empty until its template is approved — that notification is simply not sent."
              )}
            </p>
          </SectionCard>
        </div>
      </div>

      {/* --------------------------------------------------------- sticky footer */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9D9D9] bg-white/95 backdrop-blur px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              {t("whatsappSettings.unsavedCount", "{{count}} unsaved change(s)", { count: dirtyKeys.length })}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onDiscard}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D9D9] px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#E4590F] hover:border-[#E4590F]/40 transition disabled:opacity-60"
              >
                <RotateCcw className="w-4 h-4" />
                {t("whatsappSettings.discard", "Discard")}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E4590F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#C94A0D] transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("whatsappSettings.save", "Save changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;
