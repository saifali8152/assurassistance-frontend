import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Landmark, Trash2, X, Save, Mail, Building2, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  listInsurerSupervisorsApi,
  createInsurerSupervisorApi,
  deleteInsurerSupervisorApi,
  listPartnerInsurersApi,
  checkEmailAvailableApi,
  type InsurerSupervisorItem
} from "../api/agentApi";
import { formatDateTime } from "../utils/dateUtils";
import { isValidLoginEmail, normalizeLoginEmail } from "../utils/loginEmail";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  whatsapp_phone: string;
  tempPassword: string;
  partner_insurer: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  work_phone: "",
  whatsapp_phone: "",
  tempPassword: "",
  partner_insurer: ""
};

const InsurerSupervisorManagement: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<InsurerSupervisorItem[]>([]);
  const [insurerKeys, setInsurerKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lastTempPassword, setLastTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, keys] = await Promise.all([
        listInsurerSupervisorsApi(),
        listPartnerInsurersApi()
      ]);
      setItems(Array.isArray(rows) ? rows : []);
      setInsurerKeys(Array.isArray(keys) ? keys : []);
    } catch {
      toast.error(t("insurerSupervisor.loadFailed", "Could not load insurer supervisors"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const closeForm = () => {
    setFormOpen(false);
    setForm(EMPTY_FORM);
  };

  const valid = useMemo(() => {
    const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    return (
      form.first_name.trim().length > 0 &&
      form.last_name.trim().length > 0 &&
      emailLooksValid &&
      form.partner_insurer.trim().length > 0
    );
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    if (!isValidLoginEmail(form.email)) {
      toast.error(t("agent.invalidEmail", "Enter a valid email address."));
      return;
    }
    setCreating(true);
    try {
      const createEmail = normalizeLoginEmail(form.email);
      const check = await checkEmailAvailableApi(createEmail);
      if (!check.available) {
        toast.error(
          check.message ||
            t("agent.emailTaken", "This email is already used by another account.")
        );
        setCreating(false);
        return;
      }
      const res = await createInsurerSupervisorApi({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: createEmail,
        partner_insurer: form.partner_insurer.trim().toLowerCase(),
        work_phone: form.work_phone.trim() || undefined,
        whatsapp_phone: form.whatsapp_phone.trim() || undefined,
        tempPassword: form.tempPassword.trim() || undefined
      });
      const tempPwd = (res as any)?.data?.tempPassword as string | undefined;
      toast.success(t("insurerSupervisor.createSuccess", "Insurer supervisor created"));
      if (tempPwd) setLastTempPassword({ email: form.email.trim(), password: tempPwd });
      closeForm();
      await refresh();
    } catch (err: any) {
      toast.error(
        err?.message || t("insurerSupervisor.createFailed", "Could not create insurer supervisor")
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row: InsurerSupervisorItem) => {
    const ok = window.confirm(
      t(
        "insurerSupervisor.deleteConfirm",
        "Remove this insurer supervisor? Agencies they created will remain but will no longer be linked to them."
      )
    );
    if (!ok) return;
    try {
      await deleteInsurerSupervisorApi(row.id);
      toast.success(t("insurerSupervisor.deleteSuccess", "Insurer supervisor removed"));
      setItems((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err: any) {
      toast.error(
        err?.message || t("insurerSupervisor.deleteFailed", "Could not remove insurer supervisor")
      );
    }
  };

  const copyTempPassword = async () => {
    if (!lastTempPassword) return;
    try {
      await navigator.clipboard.writeText(lastTempPassword.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("insurerSupervisor.copyFailed", "Could not copy"));
    }
  };

  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full relative">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#E4590F] flex items-center gap-3">
            <Landmark className="w-6 h-6 sm:w-8 sm:h-8" />
            {t("insurerSupervisor.title", "Insurer supervisors")}
          </h1>
          <p className="text-[#2B2B2B]/70 text-sm mt-1 max-w-2xl">
            {t(
              "insurerSupervisor.subtitle",
              "Coordinate with country insurers. Each account may issue policies, create agencies/subaccounts, and report only on plans linked to that insurer (e.g. GNA → GNA Retail, Inbound, Road)."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white text-sm font-medium transition-colors"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {formOpen
            ? t("common.cancel", "Cancel")
            : t("insurerSupervisor.addNew", "Add insurer supervisor")}
        </button>
      </div>

      {lastTempPassword && (
        <div className="mb-6 p-4 border border-amber-500/40 bg-amber-50/70 rounded-xl flex flex-wrap items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-amber-700" />
          <span className="text-amber-900">
            {t("insurerSupervisor.tempPasswordFor", "Temporary password for")}{" "}
            <span className="font-semibold">{lastTempPassword.email}</span>:
          </span>
          <code className="px-2 py-1 rounded bg-white border border-amber-300 text-amber-900 font-mono">
            {lastTempPassword.password}
          </code>
          <button
            type="button"
            onClick={copyTempPassword}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-600/10 hover:bg-amber-600/20 text-amber-900 text-xs"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
          </button>
          <button
            type="button"
            onClick={() => setLastTempPassword(null)}
            className="ml-auto text-amber-700 hover:text-amber-900 text-xs underline"
          >
            {t("common.dismiss", "Dismiss")}
          </button>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 border border-[#D9D9D9] rounded-2xl bg-[#fafafa]/60 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.firstName", "First name")} *
            </label>
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.lastName", "Last name")} *
            </label>
            <input
              type="text"
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.email", "Email")} *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.partnerInsurer", "Partner insurer")} *
            </label>
            {insurerKeys.length > 0 ? (
              <select
                required
                value={form.partner_insurer}
                onChange={(e) => setForm({ ...form, partner_insurer: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
              >
                <option value="">{t("insurerSupervisor.selectInsurer", "Select insurer…")}</option>
                {insurerKeys.map((k) => (
                  <option key={k} value={k}>
                    {k.toUpperCase()}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={form.partner_insurer}
                onChange={(e) => setForm({ ...form, partner_insurer: e.target.value })}
                placeholder={t("insurerSupervisor.partnerInsurerPlaceholder", "e.g. gna, agico")}
                className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
              />
            )}
            <p className="text-[11px] text-[#2B2B2B]/55 mt-1">
              {t(
                "insurerSupervisor.partnerInsurerHint",
                "Must match the partner insurer key set on catalogue plans. Set keys on Create Plan if the list is empty."
              )}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.workPhone", "Work phone")}
            </label>
            <input
              type="text"
              value={form.work_phone}
              onChange={(e) => setForm({ ...form, work_phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.whatsappPhone", "WhatsApp")}
            </label>
            <input
              type="text"
              value={form.whatsapp_phone}
              onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("insurerSupervisor.tempPassword", "Temporary password (optional)")}
            </label>
            <input
              type="text"
              value={form.tempPassword}
              onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
              placeholder={t("insurerSupervisor.tempPasswordPlaceholder", "Leave blank to auto-generate")}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] text-sm font-medium"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={!valid || creating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:bg-[#E4590F]/50 disabled:cursor-not-allowed text-white text-sm font-medium"
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t("insurerSupervisor.create", "Create insurer supervisor")}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-[#D9D9D9] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#D9D9D9]/30 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colName", "Name")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colEmail", "Email")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colInsurer", "Insurer")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colAgencies", "Agencies")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colStatus", "Status")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("insurerSupervisor.colLastLogin", "Last login")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B] w-16" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#2B2B2B]/60">
                  <div className="inline-block w-5 h-5 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin mr-2 align-middle" />
                  {t("common.loading", "Loading...")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#2B2B2B]/60">
                  {t(
                    "insurerSupervisor.empty",
                    "No insurer supervisors yet. Add one to give a country insurer coordinator scoped access to their plans."
                  )}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t border-[#D9D9D9]/70 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-[#2B2B2B] font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-[#2B2B2B]/80">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#E4590F]/10 text-[#E4590F] text-xs font-semibold uppercase border border-[#E4590F]/20">
                      {row.partner_insurer || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#E4590F]/10 text-[#E4590F] text-xs font-medium border border-[#E4590F]/20">
                      <Building2 className="w-3 h-3" />
                      {row.owned_agency_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === "active"
                          ? "bg-green-500/15 text-green-700 border border-green-500/30"
                          : "bg-red-500/15 text-red-700 border border-red-500/30"
                      }`}
                    >
                      {row.status === "active"
                        ? t("insurerSupervisor.statusActive", "Active")
                        : t("insurerSupervisor.statusInactive", "Inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#2B2B2B]/70 text-xs">
                    {row.last_login ? formatDateTime(row.last_login) : t("common.never", "Never")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/25 transition-colors"
                      title={t("insurerSupervisor.delete", "Delete insurer supervisor")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InsurerSupervisorManagement;
