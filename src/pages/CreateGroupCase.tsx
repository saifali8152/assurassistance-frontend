import React, { useState, useEffect, useRef } from "react";
import InputField from "../components/InputFields";
import DateField from "../components/DateField";
import { Globe2, CalendarIcon, ClockIcon, Upload, Download, Trash2, Plus } from "lucide-react";
import MultiSelectField from "../components/MultiSelectField";
import {
  createSaleApi,
  generateInvoiceApi,
  downloadGroupCertificatesZipApi,
  downloadGroupInvoicesZipApi
} from "../api/salesApi";
import PlanCard from "../components/Plans";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { createGroupCasesApi, changeCaseStatusApi } from "../api/caseApi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useNavigate } from "react-router-dom";
import {
  computeTravelPlanPremium,
  getAgeFromDateString,
  getAgePremiumMultiplier,
  getLegacyPricingTablePremium,
  roundMoney
} from "../utils/travelPricing";
import { COUNTRIES } from "../constants/countries";
import { downloadGroupTemplateFile, parseGroupExcelFile, type GroupMemberImport } from "../utils/groupCaseExcel";

interface Plan {
  id: string;
  name: string;
  productType: string;
  coverage: string;
  flatPrice?: number;
  eligibleDestinations: string[];
  durations: string[];
  terms: string;
  active: boolean;
  countryOfResidence?: string;
  routeType?: string;
  currency?: string;
  pricingTables?: {
    pricingColumns: string[];
    pricing: { id: string; label: string; columns: Record<string, number | null> }[];
    guarantees: any[];
  };
}

interface MemberRow extends GroupMemberImport {
  key: string;
}

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

const newMember = (data: Partial<GroupMemberImport> = {}): MemberRow => ({
  key: crypto.randomUUID(),
  last_name: data.last_name ?? "",
  first_name: data.first_name ?? "",
  date_of_birth: data.date_of_birth ?? "",
  gender: data.gender ?? "",
  nationality: data.nationality ?? "",
  country_of_residence: data.country_of_residence ?? "",
  email: data.email ?? "",
  phone: data.phone ?? "",
  passport_or_id: data.passport_or_id ?? "",
  address: data.address ?? ""
});

const CreateGroupCase: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("traveller");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [destination, setDestination] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [groupId, setGroupId] = useState<string | null>(null);
  const [caseIds, setCaseIds] = useState<number[]>([]);
  const [createdSaleIds, setCreatedSaleIds] = useState<number[]>([]);

  useEffect(() => {
    if (createdSaleIds.length > 0 && caseIds.length > 0 && createdSaleIds.length === caseIds.length) {
      setActiveTab("review");
    }
  }, [createdSaleIds, caseIds]);

  const countries = COUNTRIES;
  const genders = ["Male", "Female", "Other"];

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDurationDays(String(diffDays));
      } else {
        setDurationDays("");
        if (end < start) toast.error(t("createCase.endDateBeforeStartDate"));
      }
    } else setDurationDays("");
  }, [startDate, endDate, t]);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await getAllCataloguesApi();
        const activePlans = (res as any).data
          .filter((plan: any) => !!plan.active)
          .map((plan: any) => ({
            id: String(plan.id),
            name: plan.name,
            productType: plan.product_type,
            coverage: plan.coverage,
            flatPrice: plan.flat_price || undefined,
            eligibleDestinations:
              typeof plan.eligible_destinations === "string"
                ? plan.eligible_destinations.split(",").map((d: string) => d.trim()).filter(Boolean)
                : [],
            durations:
              typeof plan.durations === "string"
                ? plan.durations.split(",").map((d: string) => d.trim()).filter(Boolean)
                : [],
            terms: plan.terms,
            active: !!plan.active,
            countryOfResidence: plan.country_of_residence || "",
            routeType: plan.route_type || "",
            currency: plan.currency || "XOF",
            pricingTables: plan.pricing_rules
              ? typeof plan.pricing_rules === "string"
                ? JSON.parse(plan.pricing_rules)
                : plan.pricing_rules
              : undefined
          }));
        setPlans(activePlans);
      } catch {
        toast.error("Failed to load plans");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);

  const getPlanPremiumBreakdown = (plan: Plan, stayDays: number, dob: string) => {
    const travelLike = ["Travel", "Travel Inbound", "Road travel"].includes(plan.productType);
    if (plan.pricingTables?.pricing?.length) {
      if (travelLike) return computeTravelPlanPremium(plan.pricingTables, stayDays, dob);
      const legacy = getLegacyPricingTablePremium(plan.pricingTables, stayDays);
      if (legacy == null) return { error: "no_price" as const, planPremium: null };
      return {
        validityDays: stayDays,
        basePremium: legacy,
        ageInfo: { multiplier: 1, eligible: true, band: "non_travel" },
        planPremium: legacy
      };
    }
    if (plan.flatPrice != null) {
      const base = roundMoney(plan.flatPrice * stayDays);
      if (!travelLike) {
        return {
          validityDays: stayDays,
          basePremium: base,
          ageInfo: { multiplier: 1, eligible: true, band: "flat" },
          planPremium: base
        };
      }
      const age = getAgeFromDateString(dob);
      const ageInfo = getAgePremiumMultiplier(age);
      if (!ageInfo.eligible) return { error: "age_ineligible" as const, planPremium: null };
      return {
        validityDays: stayDays,
        basePremium: base,
        age,
        ageInfo,
        planPremium: roundMoney(base * ageInfo.multiplier)
      };
    }
    return { error: "no_price" as const, planPremium: null };
  };

  const guaranteesPayload = () => {
    let guaranteesTotal = 0;
    const guaranteesDetails: any[] = [];
    if (selectedPlanObj?.pricingTables?.guarantees) {
      selectedPlanObj.pricingTables.guarantees.forEach((g: any) => {
        if (g.amount != null && g.amount !== undefined) {
          guaranteesTotal += g.amount;
          guaranteesDetails.push({
            category: g.category,
            coverageType: g.coverageType,
            amount: g.amount
          });
        }
      });
    }
    return { guaranteesTotal, guaranteesDetails };
  };

  const memberPremiumTotal = (dob: string) => {
    if (!durationDays || !selectedPlanObj) return 0;
    const days = parseInt(durationDays, 10) || 1;
    const br = getPlanPremiumBreakdown(selectedPlanObj, days, dob);
    if (!("planPremium" in br) || br.planPremium == null) return 0;
    const { guaranteesTotal } = guaranteesPayload();
    return br.planPremium + guaranteesTotal;
  };

  const groupGrandTotal = () =>
    members.reduce((sum, m) => sum + memberPremiumTotal(m.date_of_birth), 0);

  const updateMember = (key: string, field: keyof MemberRow, value: string) => {
    setMembers((prev) => prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)));
  };

  const removeMember = (key: string) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = await parseGroupExcelFile(file);
      if (!parsed.length) {
        toast.error(t("groupCase.importEmpty"));
        return;
      }
      setMembers(parsed.map((p) => newMember(p)));
      toast.success(t("groupCase.importSuccess", { count: parsed.length }));
    } catch {
      toast.error(t("groupCase.importError"));
    }
  };

  const isMemberValid = (m: MemberRow) =>
    m.first_name.trim() &&
    m.last_name.trim() &&
    m.date_of_birth.trim() &&
    m.country_of_residence.trim() &&
    m.gender.trim() &&
    m.nationality.trim() &&
    m.email.trim() &&
    m.phone.trim() &&
    m.passport_or_id.trim() &&
    m.address.trim();

  const isFormValid = () => {
    if (!selectedPlan || !destination.length || !startDate || !endDate) return false;
    if (members.length === 0) return false;
    return members.every(isMemberValid);
  };

  const handleSubmitCase = async () => {
    if (!isFormValid()) {
      toast.error(t("groupCase.fillAll"));
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      toast.error(t("createCase.endDateBeforeStartDate"));
      return;
    }
    try {
      const travellers = members.map((m) => ({
        first_name: m.first_name.trim(),
        last_name: m.last_name.trim(),
        date_of_birth: m.date_of_birth,
        country_of_residence: m.country_of_residence,
        gender: m.gender,
        nationality: m.nationality,
        passport_or_id: m.passport_or_id,
        phone: m.phone,
        email: m.email,
        address: m.address.trim()
      }));
      const res = await createGroupCasesApi({
        travellers,
        caseData: {
          destination: destination.join(", "),
          start_date: startDate,
          end_date: endDate,
          selected_plan_id: Number(selectedPlan),
          status: "Confirmed"
        }
      });
      setGroupId(res.groupId);
      setCaseIds(res.caseIds);
      setActiveTab("review");
      toast.success(t("groupCase.casesCreated", { n: res.caseIds.length }));
    } catch {
      toast.error(t("groupCase.casesError"));
    }
  };

  const handleConfirmSale = async () => {
    if (!caseIds.length || caseIds.length !== members.length) {
      toast.error(t("groupCase.mismatch"));
      return;
    }
    if (!selectedPlanObj || !durationDays) {
      toast.error(t("createCase.noPlansAvailable"));
      return;
    }
    const days = parseInt(durationDays, 10) || 1;
    const { guaranteesTotal, guaranteesDetails } = guaranteesPayload();
    const saleIds: number[] = [];

    for (let i = 0; i < caseIds.length; i++) {
      const dob = members[i].date_of_birth;
      const br = getPlanPremiumBreakdown(selectedPlanObj, days, dob);
      if ("error" in br && br.error === "age_ineligible") {
        toast.error(t("groupCase.ageIneligibleRow", { row: i + 1 }));
        return;
      }
      if (!("planPremium" in br) || br.planPremium == null) {
        toast.error(t("groupCase.noPriceRow", { row: i + 1 }));
        return;
      }
      const premiumAmount = br.planPremium;
      const premiumAmountTotal = premiumAmount + guaranteesTotal;
      const tax = 0;
      try {
        const res = await createSaleApi({
          case_id: caseIds[i],
          premium_amount: premiumAmountTotal,
          tax,
          total: premiumAmountTotal + tax,
          currency: selectedPlanObj.currency || "XOF",
          plan_price: premiumAmount,
          guarantees_total: guaranteesTotal,
          guarantees_details: guaranteesDetails.length ? guaranteesDetails : undefined
        });
        if (res?.saleId) saleIds.push(res.saleId);
      } catch {
        toast.error(t("groupCase.saleFailedRow", { row: i + 1 }));
        return;
      }
    }
    setCreatedSaleIds(saleIds);
    toast.success(t("groupCase.salesDone"));
  };

  const handleCancelGroup = async () => {
    if (!caseIds.length) return;
    try {
      for (const id of caseIds) {
        await changeCaseStatusApi(id, "Cancelled");
      }
      toast.success(t("groupCase.cancelled"));
      navigate(user?.role === "admin" ? "/admin/cases" : "/user/cases");
    } catch {
      toast.error(t("groupCase.cancelError"));
    }
  };

  const handleDownloadZip = async () => {
    if (!groupId) return;
    try {
      const response = await downloadGroupCertificatesZipApi(groupId);
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificates-group-${groupId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t("groupCase.zipError"));
    }
  };

  const handleDownloadInvoicesZip = async () => {
    if (!groupId) return;
    try {
      const response = await downloadGroupInvoicesZipApi(groupId);
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-group-${groupId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t("groupCase.invoicesZipError"));
    }
  };

  const handleFirstInvoice = async () => {
    const sid = createdSaleIds[0];
    if (!sid) return;
    try {
      const response = await generateInvoiceApi(sid);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${sid}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t("groupCase.invoiceError"));
    }
  };

  if (!loadingPlans && plans.length === 0) {
    return (
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full text-center">
        <h2 className="text-xl font-semibold text-[#E4590F] mb-2">{t("createCase.noPlansAdmin")}</h2>
        <p className="text-[#2B2B2B]/70">{t("createCase.noPlansAdminMessage")}</p>
      </div>
    );
  }

  const travellerTab: Tab = {
    id: "traveller",
    label: t("createCase.travellerDetails"),
    content: (
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#E4590F] mb-2">{t("groupCase.title")}</h2>
          <p className="text-sm text-[#2B2B2B]/80 mb-4">{t("groupCase.intro")}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadGroupTemplateFile()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D9D9D9] bg-white hover:bg-[#f8f8f8] text-sm"
            >
              <Download className="w-4 h-4" />
              {t("groupCase.downloadTemplate")}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E4590F] text-white hover:bg-[#C94A0D] text-sm"
            >
              <Upload className="w-4 h-4" />
              {t("groupCase.importExcel")}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onImportFile} />
            <button
              type="button"
              onClick={() => setMembers((m) => [...m, newMember()])}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E4590F] text-[#E4590F] text-sm"
            >
              <Plus className="w-4 h-4" />
              {t("groupCase.addRow")}
            </button>
          </div>
        </div>

        {members.length === 0 ? (
          <p className="text-[#2B2B2B]/60 text-sm">{t("groupCase.emptyHint")}</p>
        ) : (
          <div className="overflow-x-auto border border-[#D9D9D9] rounded-xl">
            <table className="min-w-[960px] w-full text-sm">
              <thead>
                <tr className="bg-[#f5f5f5] text-left">
                  <th className="p-2 font-semibold">{t("createCase.lastName")}</th>
                  <th className="p-2 font-semibold">{t("createCase.firstName")}</th>
                  <th className="p-2 font-semibold">{t("createCase.dateOfBirth")}</th>
                  <th className="p-2 font-semibold">{t("createCase.gender")}</th>
                  <th className="p-2 font-semibold">{t("createCase.nationality")}</th>
                  <th className="p-2 font-semibold">{t("createCase.countryOfResidence")}</th>
                  <th className="p-2 font-semibold">{t("createCase.email")}</th>
                  <th className="p-2 font-semibold">{t("createCase.phone")}</th>
                  <th className="p-2 font-semibold">{t("createCase.passport")}</th>
                  <th className="p-2 font-semibold">{t("createCase.address")}</th>
                  <th className="p-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.key} className="border-t border-[#E0E0E0]">
                    <td className="p-1">
                      <input
                        className="w-full min-w-[88px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.last_name}
                        onChange={(e) => updateMember(m.key, "last_name", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full min-w-[88px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.first_name}
                        onChange={(e) => updateMember(m.key, "first_name", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="date"
                        className="w-full min-w-[120px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.date_of_birth}
                        onChange={(e) => updateMember(m.key, "date_of_birth", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <select
                        className="w-full min-w-[80px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.gender}
                        onChange={(e) => updateMember(m.key, "gender", e.target.value)}
                      >
                        <option value="">{t("createCase.genderPlaceholder")}</option>
                        {genders.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <select
                        className="w-full min-w-[100px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.nationality}
                        onChange={(e) => updateMember(m.key, "nationality", e.target.value)}
                      >
                        <option value="">{t("createCase.nationalityPlaceholder")}</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <select
                        className="w-full min-w-[100px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.country_of_residence}
                        onChange={(e) => updateMember(m.key, "country_of_residence", e.target.value)}
                      >
                        <option value="">{t("createCase.countryOfResidencePlaceholder")}</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full min-w-[100px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.email}
                        onChange={(e) => updateMember(m.key, "email", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full min-w-[88px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.phone}
                        onChange={(e) => updateMember(m.key, "phone", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full min-w-[88px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.passport_or_id}
                        onChange={(e) => updateMember(m.key, "passport_or_id", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        className="w-full min-w-[100px] border border-[#D9D9D9] rounded px-2 py-1"
                        value={m.address}
                        onChange={(e) => updateMember(m.key, "address", e.target.value)}
                      />
                    </td>
                    <td className="p-1">
                      <button
                        type="button"
                        onClick={() => removeMember(m.key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  };

  const planTab: Tab = {
    id: "choosePlan",
    label: t("createCase.choosePlan"),
    content: (
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t("createCase.choosePlanTitle")}</h2>
        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="relative h-full flex flex-col min-h-[280px]">
                <div
                  className={`cursor-pointer rounded-xl flex-1 flex flex-col min-h-0 ${
                    selectedPlan === plan.id ? "ring-2 ring-[#E4590F] ring-offset-2" : ""
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <PlanCard plan={plan} />
                </div>
                <div className="absolute top-3 right-3 z-10">
                  <div
                    className={`w-5 h-5 rounded-full border-2 border-[#E4590F] flex items-center justify-center ${
                      selectedPlan === plan.id ? "bg-[#E4590F]" : "bg-white"
                    }`}
                  >
                    {selectedPlan === plan.id && <div className="w-3 h-3 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  };

  const caseTab: Tab = {
    id: "case",
    label: t("createCase.caseDetails"),
    content: (
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t("createCase.caseDetails")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <MultiSelectField
              label={t("createCase.destination")}
              options={countries}
              placeholder={t("createCase.destinationPlaceholder")}
              icon={<Globe2 />}
              value={destination}
              onChange={setDestination}
              required
            />
          </div>
          <DateField
            label={t("createCase.startDate")}
            placeholder={t("createCase.startDatePlaceholder")}
            icon={<CalendarIcon />}
            value={startDate}
            onChange={setStartDate}
            required
          />
          <DateField
            label={t("createCase.endDate")}
            placeholder={t("createCase.endDatePlaceholder")}
            icon={<CalendarIcon />}
            value={endDate}
            onChange={setEndDate}
            required
          />
          <InputField
            label={t("createCase.durationDays")}
            type="text"
            placeholder={t("createCase.durationDaysPlaceholder")}
            icon={<ClockIcon />}
            value={durationDays}
            onChange={() => {}}
            required
            readOnly
          />
        </div>
      </div>
    )
  };

  const reviewTab: Tab = {
    id: "review",
    label: t("createCase.reviewTab"),
    content: (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
          <h3 className="text-lg font-semibold text-[#E4590F] mb-4">{t("groupCase.membersTitle", { n: members.length })}</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">{t("createCase.lastName")}</th>
                  <th className="py-2 pr-2">{t("createCase.firstName")}</th>
                  <th className="py-2 pr-2">{t("createCase.dateOfBirth")}</th>
                  <th className="py-2 text-right">{t("createCase.grandTotal")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.key} className="border-b border-[#f0f0f0]">
                    <td className="py-2 pr-2">{m.last_name}</td>
                    <td className="py-2 pr-2">{m.first_name}</td>
                    <td className="py-2 pr-2">{m.date_of_birth}</td>
                    <td className="py-2 text-right">{formatCurrency(memberPremiumTotal(m.date_of_birth))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end font-semibold text-[#E4590F]">
            {t("groupCase.groupTotal")}: {formatCurrency(groupGrandTotal())}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
          <h3 className="text-lg font-semibold text-[#E4590F] mb-2">{t("createCase.caseDetails")}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold">{t("createCase.destination")}:</span> {destination.join(", ")}
            </div>
            <div>
              <span className="font-semibold">{t("createCase.plan")}:</span> {selectedPlanObj?.name}
            </div>
            <div>
              <span className="font-semibold">{t("createCase.startDate")}:</span> {startDate}
            </div>
            <div>
              <span className="font-semibold">{t("createCase.endDate")}:</span> {endDate}
            </div>
          </div>
        </div>
      </div>
    )
  };

  const baseTabs = [travellerTab, planTab, caseTab];
  let visibleTabs: Tab[] = baseTabs;
  if (caseIds.length > 0) visibleTabs = [...baseTabs, reviewTab];
  if (createdSaleIds.length > 0 && createdSaleIds.length === caseIds.length && caseIds.length > 0) {
    visibleTabs = [reviewTab];
  }

  const currentTab = visibleTabs.find((tab) => tab.id === activeTab) || visibleTabs[0];

  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
      <h1 className="text-2xl font-semibold text-[#E4590F] mb-2">{t("groupCase.pageTitle")}</h1>
      <p className="text-sm text-[#2B2B2B]/75 mb-8">{t("groupCase.pageSubtitle")}</p>

      <div className="flex space-x-1 mb-8 bg-[#D9D9D9]/30 p-1 rounded-2xl overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-normal rounded-xl transition-all ${
              activeTab === tab.id ? "bg-[#E4590F] text-white" : "text-[#2B2B2B] hover:bg-[#D9D9D9]/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">{currentTab?.content}</div>

      <div className="flex justify-between mt-8 pt-6 border-t border-[#D9D9D9] flex-wrap gap-3">
        {!createdSaleIds.length && (
          <button
            type="button"
            onClick={() => {
              const idx = visibleTabs.findIndex((x) => x.id === activeTab);
              if (idx > 0) setActiveTab(visibleTabs[idx - 1].id);
            }}
            disabled={activeTab === visibleTabs[0]?.id}
            className="px-6 py-3 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium disabled:opacity-50"
          >
            {t("case.previous")}
          </button>
        )}
        <div className="flex flex-wrap gap-3 ml-auto">
          {!caseIds.length && !createdSaleIds.length && activeTab !== visibleTabs[visibleTabs.length - 1]?.id && (
            <button
              type="button"
              onClick={() => {
                const idx = visibleTabs.findIndex((x) => x.id === activeTab);
                if (idx < visibleTabs.length - 1) setActiveTab(visibleTabs[idx + 1].id);
              }}
              className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium"
            >
              {t("case.next")}
            </button>
          )}

          {!caseIds.length && activeTab === "case" && (
            <button
              type="button"
              onClick={handleSubmitCase}
              disabled={!isFormValid()}
              className={`px-6 py-3 rounded-xl font-medium ${
                isFormValid() ? "bg-[#E4590F] hover:bg-[#C94A0D] text-white" : "bg-[#D9D9D9] text-[#2B2B2B]/50 cursor-not-allowed"
              }`}
            >
              {t("case.submit")}
            </button>
          )}

          {caseIds.length > 0 && !createdSaleIds.length && activeTab === "review" && (
            <>
              <button
                type="button"
                onClick={handleCancelGroup}
                className="px-6 py-3 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium"
              >
                {t("case.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium"
              >
                {t("case.confirmSale")}
              </button>
            </>
          )}

          {createdSaleIds.length > 0 && createdSaleIds.length === caseIds.length && caseIds.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleFirstInvoice}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium"
              >
                {t("sale.downloadInvoice")} ({t("groupCase.firstOnly")})
              </button>
              <button
                type="button"
                onClick={handleDownloadInvoicesZip}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium"
              >
                {t("groupCase.downloadInvoicesZip")}
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium"
              >
                {t("groupCase.downloadCertificatesZip")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupCase;
