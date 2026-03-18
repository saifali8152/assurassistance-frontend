import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Check, Clock, Lock, Unlock, Key, Shield, ShieldCheck, ChevronDown, Edit3, ArrowLeft, X } from "lucide-react";
import InputField from "../components/InputFields";
import {
  getAgentApi,
  updateAgentApi,
  createSubAgentApi,
  updateUserStatusApi,
  sendPasswordResetLinkApi,
  type AgentProfile,
  type SubAgentItem,
} from "../api/agentApi";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getPasswordChangeStatus } from "../utils/dateUtils";

const PARTNERSHIP_TYPES = [
  "Insurance company",
  "Broker",
  "Travel agency",
  "Corporate desk",
  "Independent Agent",
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
  "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Côte-d'Ivoire", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela",
  "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

type SubAgentWithChildren = SubAgentItem & { sub_agents?: SubAgentItem[] };

const StatusBadge = ({ status }: { status: "active" | "inactive" }) => {
  const { t } = useTranslation();
  const statusConfig = {
    active: { icon: Check, text: t("user.statusActive", "Active"), bgClass: "bg-green-500/20", textClass: "text-green-600", iconClass: "text-green-600" },
    inactive: { icon: Clock, text: t("user.statusInactive", "Inactive"), bgClass: "bg-red-500/20", textClass: "text-red-600", iconClass: "text-red-600" },
  };
  const config = statusConfig[status];
  const IconComponent = config.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgClass}`}>
      <IconComponent className={`w-4 h-4 ${config.iconClass}`} />
      <span className={`text-sm font-normal ${config.textClass}`}>{config.text}</span>
    </div>
  );
};

const PasswordChangeBadge = ({ forcePasswordChange }: { forcePasswordChange?: boolean | number }) => {
  const passwordStatus = getPasswordChangeStatus(forcePasswordChange);
  const IconComponent = passwordStatus.status === "changed" ? ShieldCheck : Shield;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${passwordStatus.bgColor}`}>
      <IconComponent className={`w-4 h-4 ${passwordStatus.color}`} />
      <span className={`text-sm font-normal ${passwordStatus.color}`}>{passwordStatus.text}</span>
    </div>
  );
};

console.log(PasswordChangeBadge({ forcePasswordChange: true }));

const SupervisorView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [supervisor, setSupervisor] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<{ id: number; name: string }[]>([]);

  const [editSupervisorOpen, setEditSupervisorOpen] = useState(false);
  const [supervisorForm, setSupervisorForm] = useState({
    firstName: "", lastName: "", email: "", companyName: "", partnershipType: "", countryOfResidence: "",
    iataNumber: "", geographicalLocation: "", workPhone: "", whatsappPhone: "", assignedPlanIds: [] as number[],
  });
  const [partnershipOpen, setPartnershipOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const partnershipRef = useRef<HTMLDivElement>(null);
  const countryRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const [savingSupervisor, setSavingSupervisor] = useState(false);

  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addChildParentId, setAddChildParentId] = useState<number | null>(null);
  const [addChildType, setAddChildType] = useState<"agent" | "sub_agent">("sub_agent");
  const [childForm, setChildForm] = useState({
    firstName: "", lastName: "", email: "", workPhone: "", whatsappPhone: "", assignedPlanIds: [] as number[],
  });
  const [childPlansOpen, setChildPlansOpen] = useState(false);
  const childPlansRef = useRef<HTMLDivElement>(null);
  const [creatingChild, setCreatingChild] = useState(false);
  const [childPasswordModal, setChildPasswordModal] = useState<{ open: boolean; password: string; userEmail: string }>({ open: false, password: "", userEmail: "" });

  const [editChildOpen, setEditChildOpen] = useState(false);
  const [editChildTarget, setEditChildTarget] = useState<{ id: number; name: string; work_phone?: string | null; whatsapp_phone?: string | null; assigned_plan_ids?: number[] } | null>(null);
  const [editChildForm, setEditChildForm] = useState({ name: "", workPhone: "", whatsappPhone: "", assignedPlanIds: [] as number[] });
  const [editChildPlansOpen, setEditChildPlansOpen] = useState(false);
  const editChildPlansRef = useRef<HTMLDivElement>(null);
  const [savingChild, setSavingChild] = useState(false);

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [confirmStatusTarget, setConfirmStatusTarget] = useState<{ id: string; current: "active" | "inactive" } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; password: string; userEmail: string }>({ open: false, password: "", userEmail: "" });

  const loadSupervisor = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAgentApi(id);
      if (data.type !== "supervisor") {
        toast.error(t("agent.failedFetch", "Not a supervisor"));
        navigate("/admin/users");
        return;
      }
      setSupervisor(data);
    } catch (e) {
      toast.error(t("agent.failedFetch", "Failed to load supervisor"));
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisor();
  }, [id]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await getAllCataloguesApi();
        const data = (res as any)?.data ?? res;
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setPlans(list.map((p: any) => ({ id: p.id, name: p.name || `Plan ${p.id}` })));
      } catch (_) {}
    };
    loadPlans();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (partnershipRef.current && !partnershipRef.current.contains(e.target as Node)) setPartnershipOpen(false);
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false);
      if (plansRef.current && !plansRef.current.contains(e.target as Node)) setPlansOpen(false);
      if (childPlansRef.current && !childPlansRef.current.contains(e.target as Node)) setChildPlansOpen(false);
      if (editChildPlansRef.current && !editChildPlansRef.current.contains(e.target as Node)) setEditChildPlansOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openEditSupervisor = () => {
    if (!supervisor) return;
    const [first = "", ...rest] = (supervisor.name || "").split(" ");
    setSupervisorForm({
      firstName: first,
      lastName: rest.join(" ") || "",
      email: supervisor.email || "",
      companyName: supervisor.company_name || "",
      partnershipType: supervisor.partnership_type || "",
      countryOfResidence: supervisor.country_of_residence || "",
      iataNumber: supervisor.iata_number || "",
      geographicalLocation: supervisor.geographical_location || "",
      workPhone: supervisor.work_phone || "",
      whatsappPhone: supervisor.whatsapp_phone || "",
      assignedPlanIds: supervisor.assigned_plan_ids || [],
    });
    setEditSupervisorOpen(true);
  };

  const saveSupervisor = async () => {
    if (!supervisor) return;
    const name = `${supervisorForm.firstName} ${supervisorForm.lastName}`.trim();
    if (!name || !supervisorForm.email?.trim()) {
      toast.error(t("agent.allFieldsRequired", "Name and email are required!"));
      return;
    }
    if (!supervisorForm.companyName?.trim() || !supervisorForm.partnershipType || !supervisorForm.countryOfResidence?.trim() || !supervisorForm.whatsappPhone?.trim()) {
      toast.error(t("agent.requiredFields", "Company name, type of partnership, country of residence and WhatsApp phone are required."));
      return;
    }
    setSavingSupervisor(true);
    try {
      await updateAgentApi(String(supervisor.id), {
        name,
        company_name: supervisorForm.companyName.trim(),
        partnership_type: supervisorForm.partnershipType,
        country_of_residence: supervisorForm.countryOfResidence.trim(),
        whatsapp_phone: supervisorForm.whatsappPhone.trim(),
        iata_number: supervisorForm.iataNumber.trim() || undefined,
        geographical_location: supervisorForm.geographicalLocation.trim() || undefined,
        work_phone: supervisorForm.workPhone.trim() || undefined,
        assigned_plan_ids: supervisorForm.assignedPlanIds,
      });
      toast.success(t("agent.updated", "Supervisor updated successfully"));
      setEditSupervisorOpen(false);
      await loadSupervisor();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedUpdate", "Failed to update"));
    } finally {
      setSavingSupervisor(false);
    }
  };

  const openAddChild = (parentId: number, type: "agent" | "sub_agent") => {
    setAddChildParentId(parentId);
    setAddChildType(type);
    setChildForm({ firstName: "", lastName: "", email: "", workPhone: "", whatsappPhone: "", assignedPlanIds: [] });
    setAddChildOpen(true);
  };

  const submitAddChild = async () => {
    if (addChildParentId == null) return;
    const { firstName, lastName, email, workPhone, whatsappPhone, assignedPlanIds } = childForm;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !whatsappPhone?.trim()) {
      toast.error(t("agent.subAgentRequired", "First name, last name, email and WhatsApp phone are required."));
      return;
    }
    if (!assignedPlanIds.length) {
      toast.error(t("agent.subAgentPlansRequired", "At least one assigned plan is required."));
      return;
    }
    setCreatingChild(true);
    try {
      const res = await createSubAgentApi(String(addChildParentId), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        work_phone: workPhone?.trim() || undefined,
        whatsapp_phone: whatsappPhone.trim(),
        assigned_plan_ids: assignedPlanIds,
      });
      setChildPasswordModal({
        open: true,
        password: (res as any).data?.tempPassword || "",
        userEmail: email.trim(),
      });
      setChildForm({ firstName: "", lastName: "", email: "", workPhone: "", whatsappPhone: "", assignedPlanIds: [] });
      setAddChildOpen(false);
      await loadSupervisor();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedCreateSubAgent", "Failed to create"));
    } finally {
      setCreatingChild(false);
    }
  };

  const openEditChild = (target: SubAgentItem | (SubAgentItem & { sub_agents?: SubAgentItem[] })) => {
    const [_first = "", ..._rest] = (target.name || "").split(" ");
    setEditChildTarget({
      id: target.id,
      name: target.name || "",
      work_phone: target.work_phone,
      whatsapp_phone: target.whatsapp_phone,
      assigned_plan_ids: target.assigned_plan_ids || [],
    });
    setEditChildForm({
      name: target.name || "",
      workPhone: target.work_phone || "",
      whatsappPhone: target.whatsapp_phone || "",
      assignedPlanIds: target.assigned_plan_ids || [],
    });
    setEditChildOpen(true);
  };

  const saveEditChild = async () => {
    if (!editChildTarget) return;
    const name = editChildForm.name.trim();
    if (!name) {
      toast.error(t("agent.subAgentRequired", "Name is required."));
      return;
    }
    setSavingChild(true);
    try {
      await updateAgentApi(String(editChildTarget.id), {
        name,
        work_phone: editChildForm.workPhone.trim() || undefined,
        whatsapp_phone: editChildForm.whatsappPhone.trim() || undefined,
        assigned_plan_ids: editChildForm.assignedPlanIds,
      });
      toast.success(t("agent.updated", "Updated successfully"));
      setEditChildOpen(false);
      setEditChildTarget(null);
      await loadSupervisor();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedUpdate", "Failed to update"));
    } finally {
      setSavingChild(false);
    }
  };

  const toggleStatus = (userId: string, current: "active" | "inactive") => {
    setConfirmStatusTarget({ id: userId, current });
    setConfirmStatusOpen(true);
  };

  const confirmStatus = async () => {
    if (!confirmStatusTarget) return;
    const newStatus = confirmStatusTarget.current === "active" ? "inactive" : "active";
    setUpdatingStatus(true);
    try {
      await updateUserStatusApi(confirmStatusTarget.id, newStatus);
      toast.success(t("agent.statusUpdated", "Status updated"));
      setConfirmStatusOpen(false);
      setConfirmStatusTarget(null);
      await loadSupervisor();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedUpdateStatus", "Failed to update status"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getEmailForUser = (userId: string): string => {
    if (supervisor && String(supervisor.id) === userId) return supervisor.email || "";
    const agents = (supervisor?.sub_agents || []) as SubAgentWithChildren[];
    for (const a of agents) {
      if (String(a.id) === userId) return a.email || "";
      for (const s of a.sub_agents || []) {
        if (String(s.id) === userId) return s.email || "";
      }
    }
    return "";
  };

  const handleSendReset = async (userId: string) => {
    setResettingPasswordFor(userId);
    try {
      const response = await sendPasswordResetLinkApi(userId);
      setPasswordModal({
        open: true,
        password: response.tempPassword,
        userEmail: getEmailForUser(userId),
      });
      toast.success(t("agent.newPasswordSent", "New temporary password sent"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedSendReset", "Failed to send reset link"));
    } finally {
      setResettingPasswordFor(null);
    }
  };

  if (loading || !supervisor) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin" />
      </div>
    );
  }

  const agents = (supervisor.sub_agents || []) as SubAgentWithChildren[];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-[#2B2B2B]/80 hover:text-[#E4590F] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("common.back", "Back")}
        </Link>
      </div>

      {/* Supervisor card */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <h2 className="text-[#E4590F] text-xl sm:text-2xl font-semibold">{t("agent.supervisorDetails", "Supervisor details")}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openEditSupervisor}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              {t("common.edit", "Edit")}
            </button>
            <button
              onClick={() => handleSendReset(String(supervisor.id))}
              disabled={resettingPasswordFor !== null}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] font-medium transition-colors disabled:opacity-50"
            >
              {resettingPasswordFor ? <div className="w-4 h-4 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
              {t("agent.sendResetLink", "Send Password Reset Link")}
            </button>
            <button
              onClick={() => toggleStatus(String(supervisor.id), (supervisor.status as "active" | "inactive") || "active")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                supervisor.status === "active"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-600"
                  : "bg-green-500/20 hover:bg-green-500/30 text-green-600"
              }`}
            >
              {supervisor.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {supervisor.status === "active" ? t("agent.lockAgent", "Lock") : t("agent.unlockAgent", "Unlock")}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[#2B2B2B]">
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.name", "Name")}</div>
          <div>{supervisor.name || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.email", "Email")}</div>
          <div>{supervisor.email || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.companyName", "Partner's company name")}</div>
          <div>{supervisor.company_name || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.partnershipType", "Type of partnership")}</div>
          <div>{supervisor.partnership_type || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.countryOfResidence", "Country of residence")}</div>
          <div>{supervisor.country_of_residence || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.iataNumber", "N° IATA")}</div>
          <div>{supervisor.iata_number || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.geographicalLocation", "Geographical location")}</div>
          <div>{supervisor.geographical_location || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.workPhone", "Work phone number")}</div>
          <div>{supervisor.work_phone || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.whatsappPhone", "WhatsApp phone number")}</div>
          <div>{supervisor.whatsapp_phone || "—"}</div>
          <div className="font-medium text-[#2B2B2B]/80">{t("agent.status", "Status")}</div>
          <div>
            <StatusBadge status={(supervisor.status as "active" | "inactive") || "active"} />
          </div>
          <div className="font-medium text-[#2B2B2B]/80 sm:col-span-2">{t("agent.assignedPlans", "Assigned plans")}</div>
          <div className="sm:col-span-2">
            {supervisor.assigned_plan_ids?.length
              ? plans.filter((p) => supervisor.assigned_plan_ids!.includes(p.id)).map((p) => p.name).join(", ")
              : "—"}
          </div>
        </div>
      </div>

      {/* Agents & Sub-agents */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-[#E4590F] text-xl font-semibold">{t("agent.agentsUnder", "Agents")}</h2>
          <button
            onClick={() => openAddChild(supervisor.id, "agent")}
            className="px-4 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors"
          >
            {t("agent.addAgent", "Add Agent")}
          </button>
        </div>
        {agents.length === 0 ? (
          <p className="text-[#2B2B2B]/60">{t("agent.noAgentsYet", "No agents yet.")}</p>
        ) : (
          <ul className="space-y-4">
            {agents.map((agent) => (
              <li key={agent.id} className="rounded-xl border border-[#D9D9D9] overflow-hidden">
                <div className="flex flex-wrap justify-between items-center gap-2 py-3 px-4 bg-[#D9D9D9]/20">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#2B2B2B]">{agent.name}</span>
                    <span className="text-sm text-[#2B2B2B]/80">{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={(agent.status as "active" | "inactive") || "active"} />
                    <button
                      onClick={() => openEditChild(agent)}
                      className="p-2 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] transition-colors"
                      title={t("common.edit", "Edit")}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openAddChild(agent.id, "sub_agent")}
                      className="px-3 py-1.5 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] text-sm font-medium"
                    >
                      {t("agent.addSubAgent", "Add sub-agent")}
                    </button>
                    <button
                      onClick={() => handleSendReset(String(agent.id))}
                      disabled={resettingPasswordFor !== null}
                      className="p-2 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] transition-colors disabled:opacity-50"
                      title={t("agent.sendResetLink", "Send Password Reset Link")}
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(String(agent.id), (agent.status as "active" | "inactive") || "active")}
                      className={`p-2 rounded-lg transition-colors ${agent.status === "active" ? "bg-red-500/20 text-red-600" : "bg-green-500/20 text-green-600"}`}
                    >
                      {agent.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {agent.sub_agents && agent.sub_agents.length > 0 && (
                  <ul className="pl-4 pr-4 py-3 space-y-2 bg-white border-t border-[#D9D9D9]/50">
                    <li className="text-xs font-medium text-[#2B2B2B]/60 uppercase tracking-wide">{t("agent.subAgents", "Sub-agents")}</li>
                    {agent.sub_agents.map((sub) => (
                      <li
                        key={sub.id}
                        className="flex flex-wrap justify-between items-center gap-2 py-2 px-3 rounded-lg bg-[#D9D9D9]/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-[#2B2B2B]">{sub.name}</span>
                          <span className="text-sm text-[#2B2B2B]/80">{sub.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={(sub.status as "active" | "inactive") || "active"} />
                          <button
                            onClick={() => openEditChild(sub)}
                            className="p-2 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendReset(String(sub.id))}
                            disabled={resettingPasswordFor !== null}
                            className="p-2 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] transition-colors disabled:opacity-50"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(String(sub.id), (sub.status as "active" | "inactive") || "active")}
                            className={`p-2 rounded-lg transition-colors ${sub.status === "active" ? "bg-red-500/20 text-red-600" : "bg-green-500/20 text-green-600"}`}
                          >
                            {sub.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Supervisor Dialog */}
      {editSupervisorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto z-50 flex justify-center items-start p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">{t("agent.editSupervisor", "Edit Supervisor")}</h3>
              <button type="button" onClick={() => setEditSupervisorOpen(false)} className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField type="text" placeholder={t("agent.firstName", "First Name") + " *"} value={supervisorForm.firstName} onChange={(v) => setSupervisorForm((p) => ({ ...p, firstName: v }))} />
              <InputField type="text" placeholder={t("agent.lastName", "Last Name") + " *"} value={supervisorForm.lastName} onChange={(v) => setSupervisorForm((p) => ({ ...p, lastName: v }))} />
              <InputField type="email" placeholder={t("agent.email", "Email") + " *"} value={supervisorForm.email} onChange={(v) => setSupervisorForm((p) => ({ ...p, email: v }))} readOnly />
              <InputField type="text" placeholder={t("agent.companyName", "Partner's company name") + " *"} value={supervisorForm.companyName} onChange={(v) => setSupervisorForm((p) => ({ ...p, companyName: v }))} />
              <div className="relative" ref={partnershipRef}>
                <button type="button" onClick={() => setPartnershipOpen(!partnershipOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D9D9D9] rounded-xl text-left">
                  <span className={supervisorForm.partnershipType ? "text-[#2B2B2B]" : "text-[#2B2B2B]/50"}>{supervisorForm.partnershipType || t("agent.partnershipType", "Type of partnership")}</span>
                  <ChevronDown className={`w-4 h-4 ${partnershipOpen ? "rotate-180" : ""}`} />
                </button>
                {partnershipOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg max-h-48 overflow-auto">
                    {PARTNERSHIP_TYPES.map((opt) => (
                      <button key={opt} type="button" onClick={() => { setSupervisorForm((p) => ({ ...p, partnershipType: opt })); setPartnershipOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#E4590F]/10 ${supervisorForm.partnershipType === opt ? "bg-[#E4590F]/10 text-[#E4590F]" : ""}`}>{opt}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={countryRef}>
                <button type="button" onClick={() => setCountryOpen(!countryOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D9D9D9] rounded-xl text-left">
                  <span className={supervisorForm.countryOfResidence ? "text-[#2B2B2B]" : "text-[#2B2B2B]/50"}>{supervisorForm.countryOfResidence || t("agent.countryOfResidence", "Country of residence")}</span>
                  <ChevronDown className={`w-4 h-4 ${countryOpen ? "rotate-180" : ""}`} />
                </button>
                {countryOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg max-h-48 overflow-auto">
                    {COUNTRIES.map((c) => (
                      <button key={c} type="button" onClick={() => { setSupervisorForm((p) => ({ ...p, countryOfResidence: c })); setCountryOpen(false); }} className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#E4590F]/10 ${supervisorForm.countryOfResidence === c ? "bg-[#E4590F]/10 text-[#E4590F]" : ""}`}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <InputField type="text" placeholder={t("agent.iataNumber", "N° IATA")} value={supervisorForm.iataNumber} onChange={(v) => setSupervisorForm((p) => ({ ...p, iataNumber: v }))} />
              <InputField type="text" placeholder={t("agent.geographicalLocation", "Geographical location")} value={supervisorForm.geographicalLocation} onChange={(v) => setSupervisorForm((p) => ({ ...p, geographicalLocation: v }))} />
              <InputField type="text" placeholder={t("agent.workPhone", "Work phone number")} value={supervisorForm.workPhone} onChange={(v) => setSupervisorForm((p) => ({ ...p, workPhone: v }))} />
              <InputField type="text" placeholder={t("agent.whatsappPhone", "WhatsApp phone number") + " *"} value={supervisorForm.whatsappPhone} onChange={(v) => setSupervisorForm((p) => ({ ...p, whatsappPhone: v }))} />
              <div className="md:col-span-2 relative" ref={plansRef}>
                <button type="button" onClick={() => setPlansOpen(!plansOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D9D9D9] rounded-xl text-left">
                  <span className="text-[#2B2B2B]">{supervisorForm.assignedPlanIds.length ? t("agent.assignedPlansCount", "{{count}} plan(s) selected", { count: supervisorForm.assignedPlanIds.length }) : t("agent.assignedPlans", "Assigned plans")}</span>
                  <ChevronDown className={`w-4 h-4 ${plansOpen ? "rotate-180" : ""}`} />
                </button>
                {plansOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg max-h-48 overflow-auto">
                    {plans.map((p) => {
                      const selected = supervisorForm.assignedPlanIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSupervisorForm((prev) => ({ ...prev, assignedPlanIds: selected ? prev.assignedPlanIds.filter((id) => id !== p.id) : [...prev.assignedPlanIds, p.id] }))}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#E4590F]/10 ${selected ? "bg-[#E4590F]/10 text-[#E4590F]" : ""}`}
                        >
                          {selected && <Check className="w-4 h-4" />}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setEditSupervisorOpen(false)} className="px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium">
                {t("common.cancel", "Cancel")}
              </button>
              <button onClick={saveSupervisor} disabled={savingSupervisor} className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:opacity-50 text-white font-medium flex items-center gap-2">
                {savingSupervisor && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t("common.save", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent / Add Sub-agent Dialog */}
      {addChildOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto z-50 flex justify-center items-start p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">{addChildType === "agent" ? t("agent.addAgent", "Add Agent") : t("agent.addSubAgent", "Add sub-agent")}</h3>
              <button type="button" onClick={() => setAddChildOpen(false)} className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField type="text" placeholder={t("agent.firstName", "First Name") + " *"} value={childForm.firstName} onChange={(v) => setChildForm((p) => ({ ...p, firstName: v }))} />
                <InputField type="text" placeholder={t("agent.lastName", "Last Name") + " *"} value={childForm.lastName} onChange={(v) => setChildForm((p) => ({ ...p, lastName: v }))} />
              </div>
              <InputField type="email" placeholder={t("agent.email", "Email") + " *"} value={childForm.email} onChange={(v) => setChildForm((p) => ({ ...p, email: v }))} />
              <InputField type="text" placeholder={t("agent.workPhone", "Work phone number")} value={childForm.workPhone} onChange={(v) => setChildForm((p) => ({ ...p, workPhone: v }))} />
              <InputField type="text" placeholder={t("agent.whatsappPhone", "WhatsApp phone number") + " *"} value={childForm.whatsappPhone} onChange={(v) => setChildForm((p) => ({ ...p, whatsappPhone: v }))} />
              <div className="relative" ref={childPlansRef}>
                <button type="button" onClick={() => setChildPlansOpen(!childPlansOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D9D9D9] rounded-xl text-left">
                  <span className="text-[#2B2B2B]">{childForm.assignedPlanIds.length ? t("agent.assignedPlansCount", "{{count}} plan(s) selected", { count: childForm.assignedPlanIds.length }) : t("agent.assignedPlans", "Assigned plans") + " *"}</span>
                  <ChevronDown className={`w-4 h-4 ${childPlansOpen ? "rotate-180" : ""}`} />
                </button>
                {childPlansOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg max-h-48 overflow-auto">
                    {plans.map((p) => {
                      const selected = childForm.assignedPlanIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setChildForm((prev) => ({ ...prev, assignedPlanIds: selected ? prev.assignedPlanIds.filter((id) => id !== p.id) : [...prev.assignedPlanIds, p.id] }))}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#E4590F]/10 ${selected ? "bg-[#E4590F]/10 text-[#E4590F]" : ""}`}
                        >
                          {selected && <Check className="w-4 h-4" />}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setAddChildOpen(false)} className="px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium">
                {t("agent.discard", "Discard")}
              </button>
              <button onClick={submitAddChild} disabled={creatingChild} className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:opacity-50 text-white font-medium flex items-center gap-2">
                {creatingChild && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {addChildType === "agent" ? t("agent.createAgent", "Create Agent") : t("agent.createSubAgent", "Create sub-agent")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent / Sub-agent Dialog */}
      {editChildOpen && editChildTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto z-50 flex justify-center items-start p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">{t("common.edit", "Edit")}</h3>
              <button type="button" onClick={() => { setEditChildOpen(false); setEditChildTarget(null); }} className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <InputField type="text" placeholder={t("agent.name", "Name") + " *"} value={editChildForm.name} onChange={(v) => setEditChildForm((p) => ({ ...p, name: v }))} />
              <InputField type="text" placeholder={t("agent.workPhone", "Work phone number")} value={editChildForm.workPhone} onChange={(v) => setEditChildForm((p) => ({ ...p, workPhone: v }))} />
              <InputField type="text" placeholder={t("agent.whatsappPhone", "WhatsApp phone number")} value={editChildForm.whatsappPhone} onChange={(v) => setEditChildForm((p) => ({ ...p, whatsappPhone: v }))} />
              <div className="relative" ref={editChildPlansRef}>
                <button type="button" onClick={() => setEditChildPlansOpen(!editChildPlansOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#D9D9D9] rounded-xl text-left">
                  <span className="text-[#2B2B2B]">{editChildForm.assignedPlanIds.length ? t("agent.assignedPlansCount", "{{count}} plan(s) selected", { count: editChildForm.assignedPlanIds.length }) : t("agent.assignedPlans", "Assigned plans")}</span>
                  <ChevronDown className={`w-4 h-4 ${editChildPlansOpen ? "rotate-180" : ""}`} />
                </button>
                {editChildPlansOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg max-h-48 overflow-auto">
                    {plans.map((p) => {
                      const selected = editChildForm.assignedPlanIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditChildForm((prev) => ({ ...prev, assignedPlanIds: selected ? prev.assignedPlanIds.filter((id) => id !== p.id) : [...prev.assignedPlanIds, p.id] }))}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[#E4590F]/10 ${selected ? "bg-[#E4590F]/10 text-[#E4590F]" : ""}`}
                        >
                          {selected && <Check className="w-4 h-4" />}
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => { setEditChildOpen(false); setEditChildTarget(null); }} className="px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium">
                {t("common.cancel", "Cancel")}
              </button>
              <button onClick={saveEditChild} disabled={savingChild} className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:opacity-50 text-white font-medium flex items-center gap-2">
                {savingChild && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t("common.save", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm status change */}
      {confirmStatusOpen && confirmStatusTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 w-[90%] max-w-md text-center">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-4">{t("user.confirmAction", "Confirm Action")}</h2>
            <p className="text-[#2B2B2B]/80 mb-6">{t("agent.confirmStatus", "Are you sure you want to change this agent's status?")}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { setConfirmStatusOpen(false); setConfirmStatusTarget(null); }} className="px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium">
                {t("common.cancel", "Cancel")}
              </button>
              <button onClick={confirmStatus} disabled={updatingStatus} className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:opacity-50 text-white font-medium flex items-center gap-2">
                {updatingStatus && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t("agent.confirm", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child password modal (after create agent/sub-agent) */}
      {childPasswordModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[70]">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-4 text-center">{t("agent.subAgentCreated", "Sub-agent created successfully!")}</h2>
            <p className="text-[#2B2B2B] font-medium text-center bg-[#E4590F]/10 rounded-xl p-2 mb-4">{childPasswordModal.userEmail}</p>
            <label className="block text-[#2B2B2B]/70 text-sm mb-2">{t("user.tempPassword", "Temporary Password:")}</label>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={childPasswordModal.password} readOnly className="flex-1 bg-white border border-[#D9D9D9] rounded-xl px-3 py-2 font-mono text-sm" />
              <button onClick={() => navigator.clipboard.writeText(childPasswordModal.password).then(() => toast.success(t("user.passwordCopied", "Password copied!")))} className="px-3 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white text-sm font-medium">
                {t("user.copy", "Copy")}
              </button>
            </div>
            <p className="text-[#E4590F] text-sm text-center mb-4">{t("user.savePassword", "⚠️ Please save this password securely. It won't be shown again.")}</p>
            <button onClick={() => setChildPasswordModal({ open: false, password: "", userEmail: "" })} className="w-full py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium">
              {t("user.gotIt", "Got it!")}
            </button>
          </div>
        </div>
      )}

      {/* Password modal (reset link) */}
      {passwordModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[70]">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-4 text-center">{t("agent.passwordReset", "Password Reset Successfully!")}</h2>
            <p className="text-[#2B2B2B] font-medium text-center bg-[#E4590F]/10 rounded-xl p-2 mb-4">{passwordModal.userEmail}</p>
            <label className="block text-[#2B2B2B]/70 text-sm mb-2">{t("agent.newTempPassword", "New Temporary Password:")}</label>
            <div className="flex items-center gap-2 mb-4">
              <input type="text" value={passwordModal.password} readOnly className="flex-1 bg-white border border-[#D9D9D9] rounded-xl px-3 py-2 font-mono text-sm" />
              <button onClick={() => navigator.clipboard.writeText(passwordModal.password).then(() => toast.success(t("user.passwordCopied", "Password copied!")))} className="px-3 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white text-sm font-medium">
                {t("user.copy", "Copy")}
              </button>
            </div>
            <p className="text-[#E4590F] text-sm text-center mb-4">{t("user.savePassword", "⚠️ Please save this password securely. It won't be shown again.")}</p>
            <button onClick={() => setPasswordModal({ open: false, password: "", userEmail: "" })} className="w-full py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium">
              {t("user.gotIt", "Got it!")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorView;
