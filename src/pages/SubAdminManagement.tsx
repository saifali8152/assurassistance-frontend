import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Shield, Trash2, X, Save, Mail, Phone, Building2, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  listSubAdminsApi,
  createSubAdminApi,
  deleteSubAdminApi,
  type SubAdminItem
} from "../api/agentApi";
import { formatDateTime } from "../utils/dateUtils";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  whatsapp_phone: string;
  tempPassword: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  work_phone: "",
  whatsapp_phone: "",
  tempPassword: ""
};

const SubAdminManagement: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<SubAdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [lastTempPassword, setLastTempPassword] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listSubAdminsApi();
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(t("subAdmin.loadFailed", "Could not load sub-administrators"));
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
      emailLooksValid
    );
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setCreating(true);
    try {
      const res = await createSubAdminApi({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        work_phone: form.work_phone.trim() || undefined,
        whatsapp_phone: form.whatsapp_phone.trim() || undefined,
        tempPassword: form.tempPassword.trim() || undefined
      });
      const tempPwd = (res as any)?.data?.tempPassword as string | undefined;
      toast.success(t("subAdmin.createSuccess", "Sub-administrator created"));
      if (tempPwd) setLastTempPassword({ email: form.email.trim(), password: tempPwd });
      closeForm();
      await refresh();
    } catch (e: any) {
      toast.error(e?.message || t("subAdmin.createFailed", "Could not create sub-administrator"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (row: SubAdminItem) => {
    const ok = window.confirm(
      t(
        "subAdmin.deleteConfirm",
        "Remove this sub-administrator? The agencies they created will remain but will no longer be linked to anyone."
      )
    );
    if (!ok) return;
    try {
      await deleteSubAdminApi(row.id);
      toast.success(t("subAdmin.deleteSuccess", "Sub-administrator removed"));
      setItems((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: any) {
      toast.error(e?.message || t("subAdmin.deleteFailed", "Could not remove sub-administrator"));
    }
  };

  const copyTempPassword = async () => {
    if (!lastTempPassword) return;
    try {
      await navigator.clipboard.writeText(lastTempPassword.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("subAdmin.copyFailed", "Could not copy"));
    }
  };

  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full relative">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#E4590F] flex items-center gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            {t("subAdmin.title", "Sub-administrators")}
          </h1>
          <p className="text-[#2B2B2B]/70 text-sm mt-1 max-w-2xl">
            {t(
              "subAdmin.subtitle",
              "Field sales representatives who create travel-agency accounts. Each sub-administrator only sees and edits cases for the agencies they create."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white text-sm font-medium transition-colors"
        >
          {formOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {formOpen ? t("common.cancel", "Cancel") : t("subAdmin.addNew", "Add sub-administrator")}
        </button>
      </div>

      {lastTempPassword && (
        <div className="mb-6 p-4 border border-amber-500/40 bg-amber-50/70 rounded-xl flex flex-wrap items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-amber-700" />
          <span className="text-amber-900">
            {t("subAdmin.tempPasswordFor", "Temporary password for")}{" "}
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
              {t("subAdmin.firstName", "First name")} *
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
              {t("subAdmin.lastName", "Last name")} *
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
              {t("subAdmin.email", "Email")} *
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
              {t("subAdmin.workPhone", "Work phone")}
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
              {t("subAdmin.whatsappPhone", "WhatsApp")}
            </label>
            <input
              type="text"
              value={form.whatsapp_phone}
              onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2B2B2B]/80 mb-1">
              {t("subAdmin.tempPassword", "Temporary password (optional)")}
            </label>
            <input
              type="text"
              value={form.tempPassword}
              onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
              placeholder={t("subAdmin.tempPasswordPlaceholder", "Leave blank to auto-generate")}
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
              {t("subAdmin.create", "Create sub-administrator")}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-[#D9D9D9] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#D9D9D9]/30 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">{t("subAdmin.colName", "Name")}</th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">{t("subAdmin.colEmail", "Email")}</th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">{t("subAdmin.colPhones", "Phones")}</th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">
                {t("subAdmin.colAgencies", "Agencies")}
              </th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">{t("subAdmin.colStatus", "Status")}</th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B]">{t("subAdmin.colLastLogin", "Last login")}</th>
              <th className="px-4 py-3 font-semibold text-[#2B2B2B] w-16"></th>
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
                    "subAdmin.empty",
                    "No sub-administrators yet. Add one above to delegate agency creation to a field sales representative."
                  )}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t border-[#D9D9D9]/70 hover:bg-[#fafafa]">
                  <td className="px-4 py-3 text-[#2B2B2B] font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-[#2B2B2B]/80">{row.email}</td>
                  <td className="px-4 py-3 text-[#2B2B2B]/80 text-xs">
                    <div className="flex flex-col gap-1">
                      {row.work_phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {row.work_phone}
                        </span>
                      )}
                      {row.whatsapp_phone && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {row.whatsapp_phone}
                        </span>
                      )}
                      {!row.work_phone && !row.whatsapp_phone && (
                        <span className="text-[#2B2B2B]/40">—</span>
                      )}
                    </div>
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
                        ? t("subAdmin.statusActive", "Active")
                        : t("subAdmin.statusInactive", "Inactive")}
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
                      title={t("subAdmin.delete", "Delete sub-administrator")}
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

export default SubAdminManagement;
