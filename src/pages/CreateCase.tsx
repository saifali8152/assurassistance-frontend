import React, { useState, useEffect } from "react";
import InputField from "../components/InputFields";
import DateField from "../components/DateField";
import { User as UserIcon, Mail, Contact, IdCard, Home, Globe2, CalendarIcon, ClockIcon, Cake, MapPin, Users, Flag } from "lucide-react";
import SelectField from "../components/SelectField";
import CountrySearchMultiSelect from "../components/CountrySearchMultiSelect";
import CountrySearchSelect from "../components/CountrySearchSelect";
import { getCountryLabel } from "../utils/countryLabels";
import { createSaleApi, generateInvoiceApi } from "../api/salesApi";
import PlanCard from "../components/Plans";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { createCaseApi, changeCaseStatusApi, updateCaseApi, getPolicyEditMetaApi, type PolicyEditMeta } from "../api/caseApi";
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
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface PricingRow {
  id: string;
  label: string;
  columns: Record<string, number | null>;
}

interface PricingTables {
  pricingColumns: string[];
  pricing: PricingRow[];
  guarantees: any[];
}

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
  pricingTables?: PricingTables;
}

const CreateCase: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("traveller");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passportId, setPassportId] = useState('');
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<number | null>(null);
  const [createdSaleId, setCreatedSaleId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [policyMeta, setPolicyMeta] = useState<PolicyEditMeta | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    if (!createdCaseId || !createdSaleId) {
      setPolicyMeta(null);
      return;
    }
    let cancelled = false;
    getPolicyEditMetaApi(createdCaseId).then((m) => {
      if (!cancelled) setPolicyMeta(m);
    });
    return () => {
      cancelled = true;
    };
  }, [createdCaseId, createdSaleId]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDurationDays(diffDays.toString());
      } else {
        setDurationDays('');
        // Show error if end date is before start date
        if (end < start) {
          toast.error(t('createCase.endDateBeforeStartDate', 'End date cannot be before start date'));
        }
      }
    } else {
      setDurationDays('');
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await getAllCataloguesApi();
        // Only use active plans and parse eligibleDestinations correctly
        const activePlans = (res as any).data
          .filter((plan: any) => !!plan.active)
          .map((plan: any) => ({
            id: String(plan.id),
            name: plan.name,
            productType: plan.product_type,
            coverage: plan.coverage,
            flatPrice: plan.flat_price || undefined,
            eligibleDestinations: typeof plan.eligible_destinations === "string"
              ? plan.eligible_destinations.split(",").map((d: string) => d.trim()).filter((d: string) => d)
              : [],
            durations: typeof plan.durations === "string"
              ? plan.durations.split(",").map((d: string) => d.trim()).filter((d: string) => d)
              : [],
            terms: plan.terms,
            active: !!plan.active,
            countryOfResidence: plan.country_of_residence || "",
            routeType: plan.route_type || "",
            currency: plan.currency || "XOF",
            pricingTables: plan.pricing_rules ? (typeof plan.pricing_rules === 'string' ? JSON.parse(plan.pricing_rules) : plan.pricing_rules) : undefined,
          }));
        setPlans(activePlans);
      } catch (err) {
        toast.error("Failed to load plans");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Track changes and update case when user makes modifications after case creation
  useEffect(() => {
    if (createdCaseId && !createdSaleId) {
      // Debounce the update to avoid too many API calls
      const timeoutId = setTimeout(() => {
        if (hasUnsavedChanges) {
          updateCase();
          setHasUnsavedChanges(false);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeoutId);
    }
  }, [firstName, lastName, dateOfBirth, countryOfResidence, gender, nationality, email, phoneNumber, passportId, address, destination, startDate, endDate, selectedPlan, createdCaseId, createdSaleId, hasUnsavedChanges]);

  // Track when user makes changes after case is created
  useEffect(() => {
    if (createdCaseId && !createdSaleId) {
      setHasUnsavedChanges(true);
    }
  }, [firstName, lastName, dateOfBirth, countryOfResidence, gender, nationality, email, phoneNumber, passportId, address, destination, startDate, endDate, selectedPlan]);

  // Find selected plan first
  const selectedPlanObj = plans.find(p => p.id === selectedPlan);

  /** Plan premium: Travel / Travel Inbound / Road travel → tier + age; other tables → legacy row match, no age factor. */
  const getPlanPremiumBreakdown = (plan: Plan, stayDays: number, dob: string) => {
    const travelLike = ["Travel", "Travel Inbound", "Road travel"].includes(plan.productType);
    if (plan.pricingTables?.pricing?.length) {
      if (travelLike) {
        return computeTravelPlanPremium(plan.pricingTables, stayDays, dob);
      }
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
      if (!ageInfo.eligible) {
        return { error: "age_ineligible" as const, planPremium: null };
      }
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

  // Show no plans message if no plans are available
  if (!loadingPlans && plans.length === 0) {
    return (
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#E4590F]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#E4590F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-[#E4590F] mb-2">
              {user?.role === 'admin' ? t('createCase.noPlansAdmin') : t('createCase.noPlansAgent')}
            </h2>
            <p className="text-[#2B2B2B]/70 text-lg font-normal">
              {user?.role === 'admin' ? t('createCase.noPlansAdminMessage') : t('createCase.noPlansAgentMessage')}
            </p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
            >
              {t('createCase.goToAdmin')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const genders = ["Male", "Female", "Other"];

  const reviewDetails = (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
        <h3 className="text-lg font-semibold text-[#E4590F] mb-4">{t('createCase.travellerDetails')}</h3>
        <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
          {/* Personal Information */}
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.firstName')}:</span> {firstName}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.lastName')}:</span> {lastName}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.dateOfBirth')}:</span> {dateOfBirth}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.gender')}:</span> {gender}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.nationality')}:</span> {nationality ? getCountryLabel(nationality, i18n.language) : ""}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.countryOfResidence')}:</span> {countryOfResidence ? getCountryLabel(countryOfResidence, i18n.language) : ""}</div>
          {/* Contact Information */}
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.email')}:</span> {email}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.phone')}:</span> {phoneNumber}</div>
          {/* Official Documents */}
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.passport')}:</span> {passportId}</div>
          {/* Address */}
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.address')}:</span> {address}</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#E4590F]">{t('createCase.caseDetails')}</h3>
          {lastUpdated && (
            <div className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg font-normal">
              {t('createCase.lastUpdated')}: {lastUpdated}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.destination')}:</span> {destination.length > 0 ? destination.map((d) => getCountryLabel(d, i18n.language)).join(", ") : "N/A"}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.startDate')}:</span> {startDate}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.endDate')}:</span> {endDate}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.durationDays')}:</span> {durationDays} {t('createCase.durationDaysPlaceholder')}</div>
        </div>
      </div>

      {selectedPlanObj && (() => {
        let calculatedPrice = 0;
        let validityTierDays: number | null = null;
        if (durationDays && selectedPlanObj) {
          const days = parseInt(durationDays) || 1;
          const br = getPlanPremiumBreakdown(selectedPlanObj, days, dateOfBirth);
          if ("planPremium" in br && br.planPremium != null) {
            calculatedPrice = br.planPremium;
            if ("validityDays" in br && br.validityDays != null) validityTierDays = br.validityDays;
          }
        }

        // Calculate total guarantees amount
        let totalGuarantees = 0;
        if (selectedPlanObj.pricingTables && selectedPlanObj.pricingTables.guarantees) {
          selectedPlanObj.pricingTables.guarantees.forEach((g: any) => {
            if (g.amount !== null && g.amount !== undefined) {
              totalGuarantees += g.amount;
            }
          });
        }

        // Calculate grand total
        const grandTotal = calculatedPrice + totalGuarantees;

        return (
          <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
            <h3 className="text-lg font-semibold text-[#E4590F] mb-4">{t('createCase.reviewPlan')}</h3>
            
            {/* Plan Basic Information */}
            <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal mb-6">
              <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.plan')}:</span> {selectedPlanObj.name}</div>
              <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.productType')}:</span> {selectedPlanObj.productType}</div>
              {selectedPlanObj.countryOfResidence && (
                <div><span className="font-semibold text-[#2B2B2B]">{t('plan.countryOfResidence')}:</span> {selectedPlanObj.countryOfResidence}</div>
              )}
              {selectedPlanObj.routeType && (
                <div><span className="font-semibold text-[#2B2B2B]">{t('plan.routeType')}:</span> {selectedPlanObj.routeType}</div>
              )}
              {selectedPlanObj.currency && (
                <div><span className="font-semibold text-[#2B2B2B]">Currency:</span> {selectedPlanObj.currency}</div>
              )}
              {validityTierDays != null && (
                <div><span className="font-semibold text-[#2B2B2B]">Validity (plan days):</span> {validityTierDays}</div>
              )}
              <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.price')}:</span> {formatCurrency(calculatedPrice)}</div>
            </div>

            {/* Guarantee Tables - Only show applicable guarantees (with non-null amounts) */}
            {selectedPlanObj.pricingTables && selectedPlanObj.pricingTables.guarantees && selectedPlanObj.pricingTables.guarantees.length > 0 && (() => {
              const applicableGuarantees = selectedPlanObj.pricingTables!.guarantees.filter(
                (g: any) => g.amount !== null && g.amount !== undefined
              );
              if (applicableGuarantees.length === 0) return null;
              
              return (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide mb-3">{t("plan.guaranteeTables")}</h4>
                  <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
                    {["MEDICAL", "TRAVEL", "JURIDICAL"].map((category) => {
                      // Filter to only show guarantees with non-null amounts
                      const categoryGuarantees = selectedPlanObj.pricingTables!.guarantees.filter(
                        (g: any) => g.category === category && g.amount !== null && g.amount !== undefined
                      );
                      if (categoryGuarantees.length === 0) return null;
                      return (
                        <React.Fragment key={category}>
                          {categoryGuarantees.map((row: any, i: number) => {
                            let coverageTypeDisplay = row.coverageType;
                            if (row.coverageType) {
                              try {
                                const coverageTypeKeys = [
                                  "medicalEmergencies", "medicalTransport", "hospitalization",
                                  "evacuationRepatriation", "bodyRepatriation",
                                  "tripCancellation", "baggageDeliveryDelay", "passportLoss",
                                  "civilLiability", "legalAssistance", "bail"
                                ];
                                const matchingKey = coverageTypeKeys.find(key => 
                                  t(`plan.${key}`) === row.coverageType
                                );
                                if (!matchingKey) {
                                  coverageTypeDisplay = t(`plan.${row.coverageType}`);
                                }
                              } catch (e) {
                                coverageTypeDisplay = row.coverageType;
                              }
                            }
                            return (
                              <React.Fragment key={i}>
                                <div><span className="font-semibold text-[#2B2B2B]">{coverageTypeDisplay}:</span></div>
                                <div><span className="text-[#E4590F] font-medium">{formatCurrency(row.amount)}</span></div>
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Total Section */}
            <div className="border-t border-[#D9D9D9] pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
                <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.price')}:</span></div>
                <div><span className="text-[#E4590F] font-medium">{formatCurrency(calculatedPrice)}</span></div>
                <div className="col-span-2 border-t border-[#D9D9D9] pt-2 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.grandTotal')}:</span></div>
                    <div><span className="text-[#E4590F] font-semibold">{formatCurrency(grandTotal)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {createdSaleId && (
        <div className="bg-white rounded-2xl p-6 border border-[#D9D9D9]">
          <h3 className="text-lg font-semibold text-[#E4590F] mb-4">{t('createCase.reviewSale')}</h3>
          <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.saleId')}:</span> {createdSaleId}</div>
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.premium')}:</span> {
              (() => {
                if (!durationDays || !selectedPlanObj) return formatCurrency(0);
                const days = parseInt(durationDays) || 1;
                const br = getPlanPremiumBreakdown(selectedPlanObj, days, dateOfBirth);
                if ("planPremium" in br && br.planPremium != null) {
                  let gt = br.planPremium;
                  if (selectedPlanObj.pricingTables?.guarantees) {
                    selectedPlanObj.pricingTables.guarantees.forEach((g: any) => {
                      if (g.amount != null) gt += g.amount;
                    });
                  }
                  return formatCurrency(gt);
                }
                return formatCurrency(0);
              })()
            }</div>
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.tax')}:</span> {formatCurrency(0)}</div>
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.total')}:</span> {
              (() => {
                if (!durationDays || !selectedPlanObj) return formatCurrency(0);
                const days = parseInt(durationDays) || 1;
                const br = getPlanPremiumBreakdown(selectedPlanObj, days, dateOfBirth);
                if ("planPremium" in br && br.planPremium != null) {
                  let gt = br.planPremium;
                  if (selectedPlanObj.pricingTables?.guarantees) {
                    selectedPlanObj.pricingTables.guarantees.forEach((g: any) => {
                      if (g.amount != null) gt += g.amount;
                    });
                  }
                  return formatCurrency(gt);
                }
                return formatCurrency(0);
              })()
            }</div>
          </div>
        </div>
      )}
    </div>
  );

  const editAllConfirmed = !!(createdSaleId && policyMeta?.adminMayEditAllFields);
  const editLimitedConfirmed = !!(createdSaleId && policyMeta?.agentMayEditLimitedFields);
  const rnFirstLastDestDates = !!(createdSaleId && !editAllConfirmed && !editLimitedConfirmed);
  const rnOtherTraveller = !!(createdSaleId && !editAllConfirmed);
  const rnPlan = !!(createdSaleId && !editAllConfirmed);

  // Tab configuration
  const tabs: Tab[] = [
    {
      id: "traveller",
      label: t('createCase.travellerDetails'),
      content: (
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t('createCase.travellerDetails')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <InputField
                  label={t('createCase.firstName')}
                  type="text"
                  placeholder={t('createCase.firstNamePlaceholder')}
                  icon={<UserIcon />}
                  value={firstName}
                  onChange={setFirstName}
                  required
                  readOnly={rnFirstLastDestDates}
                />
              </div>
              <div>
                <InputField
                  label={t('createCase.lastName')}
                  type="text"
                  placeholder={t('createCase.lastNamePlaceholder')}
                  icon={<UserIcon />}
                  value={lastName}
                  onChange={setLastName}
                  required
                  readOnly={rnFirstLastDestDates}
                />
              </div>
              <div>
                <DateField
                  label={t('createCase.dateOfBirth')}
                  placeholder={t('createCase.dateOfBirthPlaceholder')}
                  icon={<Cake />}
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  required
                  readOnly={rnOtherTraveller}
                />
              </div>
              <div>
                <SelectField
                  label={t('createCase.gender')}
                  options={genders}
                  placeholder={t('createCase.genderPlaceholder')}
                  icon={<Users />}
                  value={gender}
                  onChange={setGender}
                  required
                  disabled={rnOtherTraveller}
                />
              </div>
              <div>
                <CountrySearchSelect
                  label={t('createCase.nationality')}
                  placeholder={t('createCase.nationalityPlaceholder')}
                  icon={<Flag />}
                  value={nationality}
                  onChange={setNationality}
                  required
                  disabled={rnOtherTraveller}
                />
              </div>
              <div>
                <CountrySearchSelect
                  label={t('createCase.countryOfResidence')}
                  placeholder={t('createCase.countryOfResidencePlaceholder')}
                  icon={<MapPin />}
                  value={countryOfResidence}
                  onChange={setCountryOfResidence}
                  required
                  disabled={rnOtherTraveller}
                />
              </div>
              {/* Contact Information */}
              <div>
                <InputField
                  label={t('createCase.email')}
                  type="text"
                  placeholder={t('createCase.emailPlaceholder')}
                  icon={<Mail />}
                  value={email}
                  onChange={setEmail}
                  required
                  readOnly={rnOtherTraveller}
                />
              </div>
              <div>
                <InputField
                  label={t('createCase.phone')}
                  type="text"
                  placeholder={t('createCase.phonePlaceholder')}
                  icon={<Contact />}
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  required
                  readOnly={rnOtherTraveller}
                />
              </div>
              {/* Official Documents */}
              <div>
                <InputField
                  label={t('createCase.passport')}
                  type="text"
                  placeholder={t('createCase.passportPlaceholder')}
                  icon={<IdCard />}
                  value={passportId}
                  onChange={setPassportId}
                  required
                  readOnly={rnOtherTraveller}
                />
              </div>
              {/* Address */}
              <div className="md:col-span-2">
                <InputField
                  label={t('createCase.address')}
                  type="text"
                  placeholder={t('createCase.addressPlaceholder')}
                  icon={<Home />}
                  value={address}
                  onChange={setAddress}
                  required
                  readOnly={rnOtherTraveller}
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "choosePlan",
      label: t('createCase.choosePlan'),
      content: (
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t('createCase.choosePlanTitle')}</h2>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#2B2B2B]/60 font-normal">{t('createCase.noPlansAvailable') || 'No plans available'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => (
                <div key={plan.id} className="relative h-full flex flex-col min-h-[280px]">
                  <div
                    className={`transition-all duration-200 rounded-xl flex-1 flex flex-col min-h-0 ${selectedPlan === plan.id ? 'ring-2 ring-[#E4590F] ring-offset-2' : ''} ${rnPlan ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
                    onClick={() => !rnPlan && setSelectedPlan(plan.id)}
                  >
                    <PlanCard plan={plan} />
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`w-5 h-5 rounded-full border-2 border-[#E4590F] transition-all duration-200 flex items-center justify-center ${selectedPlan === plan.id ? 'bg-[#E4590F]' : 'bg-white'}`}>
                      {selectedPlan === plan.id && (
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },

    {
      id: "case",
      label: t('createCase.caseDetails'),
      content: (
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t('createCase.caseDetails')}</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4 md:col-span-2">
                <CountrySearchMultiSelect
                  label={t('createCase.destination')}
                  placeholder={t('createCase.destinationPlaceholder')}
                  icon={<Globe2 />}
                  value={destination}
                  onChange={setDestination}
                  required
                  disabled={rnFirstLastDestDates}
                />
              </div>
              <div className="mb-4">
                <DateField
                  label={t('createCase.startDate')}
                  placeholder={t('createCase.startDatePlaceholder')}
                  icon={<CalendarIcon />}
                  value={startDate}
                  onChange={setStartDate}
                  required
                  readOnly={rnFirstLastDestDates}
                />
              </div>
              <div className="mb-4">
                <DateField
                  label={t('createCase.endDate')}
                  placeholder={t('createCase.endDatePlaceholder')}
                  icon={<CalendarIcon />}
                  value={endDate}
                  onChange={setEndDate}
                  required
                  readOnly={rnFirstLastDestDates}
                />
              </div>
              <div className="mb-4">
                <InputField
                  label={t('createCase.durationDays')}
                  type="text"
                  placeholder={t('createCase.durationDaysPlaceholder')}
                  icon={<ClockIcon />}
                  value={durationDays}
                  onChange={() => { }}
                  required
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];


  const reviewTab: Tab = {
    id: "review",
    label: t('createCase.reviewTab'),
    content: reviewDetails,
  };

  // Tabs to show
  let visibleTabs = tabs;
  if (createdCaseId) {
    visibleTabs = [...tabs, reviewTab];
  }

  const currentTab = visibleTabs.find(tab => tab.id === activeTab) || visibleTabs[0];

  // Check if all required fields are filled
  const isFormValid = () => {
    const isFieldEmpty = (value: string) => !value || value.trim() === '';
    const isArrayEmpty = (value: string[]) => !value || value.length === 0;
    return !isFieldEmpty(selectedPlan || '') && 
           !isArrayEmpty(destination) && 
           !isFieldEmpty(firstName) && 
           !isFieldEmpty(lastName) && 
           !isFieldEmpty(dateOfBirth) && 
           !isFieldEmpty(countryOfResidence) && 
           !isFieldEmpty(gender) && 
           !isFieldEmpty(nationality) && 
           !isFieldEmpty(email) && 
           !isFieldEmpty(phoneNumber) && 
           !isFieldEmpty(passportId) && 
           !isFieldEmpty(address) && 
           !isFieldEmpty(startDate) && 
           !isFieldEmpty(endDate);
  };

  // Helper function to check if a specific field is empty
  const isFieldEmpty = (value: string) => !value || value.trim() === '';


  const handleSubmitCase = async () => {
    // Check for empty or whitespace-only fields
    const isArrayEmpty = (value: string[]) => !value || value.length === 0;
    if (isFieldEmpty(selectedPlan || '') || isArrayEmpty(destination) || isFieldEmpty(firstName) || 
        isFieldEmpty(lastName) || isFieldEmpty(dateOfBirth) || isFieldEmpty(countryOfResidence) || 
        isFieldEmpty(gender) || isFieldEmpty(nationality) || isFieldEmpty(email) || 
        isFieldEmpty(phoneNumber) || isFieldEmpty(passportId) || isFieldEmpty(address) || 
        isFieldEmpty(startDate) || isFieldEmpty(endDate)) {
      const missingFields = [];
      if (isFieldEmpty(selectedPlan || '')) missingFields.push('Plan');
      if (isArrayEmpty(destination)) missingFields.push('Destination');
      if (isFieldEmpty(firstName)) missingFields.push('First Name');
      if (isFieldEmpty(lastName)) missingFields.push('Last Name');
      if (isFieldEmpty(dateOfBirth)) missingFields.push('Date of Birth');
      if (isFieldEmpty(countryOfResidence)) missingFields.push('Country of Residence');
      if (isFieldEmpty(gender)) missingFields.push('Gender');
      if (isFieldEmpty(nationality)) missingFields.push('Nationality');
      if (isFieldEmpty(email)) missingFields.push('Email');
      if (isFieldEmpty(phoneNumber)) missingFields.push('Phone');
      if (isFieldEmpty(passportId)) missingFields.push('Passport');
      if (isFieldEmpty(address)) missingFields.push('Address');
      if (isFieldEmpty(startDate)) missingFields.push('Start Date');
      if (isFieldEmpty(endDate)) missingFields.push('End Date');
      
      toast.error(`Please fill: ${missingFields.join(', ')}`);
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      toast.error(t('createCase.endDateBeforeStartDate', 'End date cannot be before start date'));
      return;
    }
    try {
      // Set status to "Confirmed" automatically
      const payload = {
        traveller: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          country_of_residence: countryOfResidence,
          gender: gender,
          nationality: nationality,
          passport_or_id: passportId,
          phone: phoneNumber,
          email,
          address,
        },
        caseData: {
          destination: destination.join(", "),
          start_date: startDate,
          end_date: endDate,
          selected_plan_id: Number(selectedPlan),
          status: "Confirmed",
        }
      };
      const res = await createCaseApi(payload);

      if (res.caseId) {
        setCreatedCaseId(res.caseId);
        setActiveTab("review");
        toast.success("Case created successfully!");
      } else {
        toast.error("Failed to create case");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  // Update case when user makes changes after creation (before sale only — debounced)
  const updateCase = async () => {
    if (!createdCaseId) return;
    
    // Validate dates before updating
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        toast.error(t('createCase.endDateBeforeStartDate', 'End date cannot be before start date'));
        return;
      }
    }
    
    try {
      const payload = {
        traveller: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          country_of_residence: countryOfResidence,
          gender: gender,
          nationality: nationality,
          passport_or_id: passportId,
          phone: phoneNumber,
          email,
          address,
        },
        caseData: {
          destination: destination.join(", "),
          start_date: startDate,
          end_date: endDate,
          selected_plan_id: Number(selectedPlan),
          status: "Confirmed",
        }
      };
      
      await updateCaseApi(createdCaseId, payload);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success("Case updated successfully!");
    } catch (err: unknown) {
      console.error("Failed to update case:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update case";
      toast.error(msg);
    }
  };

  /** After sale confirmed — same payload shape; server enforces role / limits */
  const saveConfirmedPolicyChanges = async () => {
    if (!createdCaseId || !createdSaleId) return;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        toast.error(t("createCase.endDateBeforeStartDate", "End date cannot be before start date"));
        return;
      }
    }
    setSavingPolicy(true);
    try {
      const payload = {
        traveller: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          country_of_residence: countryOfResidence,
          gender: gender,
          nationality: nationality,
          passport_or_id: passportId,
          phone: phoneNumber,
          email,
          address,
        },
        caseData: {
          destination: destination.join(", "),
          start_date: startDate,
          end_date: endDate,
          selected_plan_id: Number(selectedPlan),
          status: "Confirmed",
        },
      };
      await updateCaseApi(createdCaseId, payload);
      const m = await getPolicyEditMetaApi(createdCaseId);
      setPolicyMeta(m);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success(t("createCase.policySaveSuccess", "Policy changes saved"));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        t("createCase.policySaveFailed", "Could not save policy changes");
      toast.error(msg);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleConfirmSale = async () => {
    if (!createdCaseId) {
      toast.error("Create case first!");
      return;
    }
    if (!selectedPlanObj) {
      toast.error("Please select a plan first!");
      return;
    }
    if (!durationDays) {
      toast.error("Please ensure duration is set!");
      return;
    }
    try {
      const days = parseInt(durationDays) || 1;
      const br = getPlanPremiumBreakdown(selectedPlanObj, days, dateOfBirth);
      if ("error" in br && br.error === "age_ineligible") {
        toast.error("Travel insurance is not available for travellers over 85 years of age.");
        return;
      }
      if (!("planPremium" in br) || br.planPremium == null) {
        toast.error("No matching price found in pricing table for this duration!");
        return;
      }
      const premiumAmount = br.planPremium;

      // Calculate guarantees total and details
      let guaranteesTotal = 0;
      const guaranteesDetails: any[] = [];
      if (selectedPlanObj.pricingTables && selectedPlanObj.pricingTables.guarantees) {
        selectedPlanObj.pricingTables.guarantees.forEach((g: any) => {
          if (g.amount !== null && g.amount !== undefined) {
            guaranteesTotal += g.amount;
            guaranteesDetails.push({
              category: g.category,
              coverageType: g.coverageType,
              amount: g.amount
            });
          }
        });
      }

      const tax = 0; // No tax for now
      // Billable premium is the plan rate only; guarantee amounts are coverage limits, not charges
      const grandTotal = premiumAmount + tax;

      const payload = {
        case_id: createdCaseId,
        premium_amount: premiumAmount,
        tax: tax,
        total: grandTotal,
        currency: selectedPlanObj.currency || 'XOF',
        plan_price: premiumAmount,
        guarantees_total: guaranteesTotal,
        guarantees_details: guaranteesDetails.length > 0 ? guaranteesDetails : undefined,
      };
      const res = await createSaleApi(payload);
      if (res?.saleId) {
        setCreatedSaleId(res.saleId); 
        toast.success("Sale confirmed successfully!");
      } else {
        toast.error("Failed to confirm sale");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const handleCancelCase = async () => {
    if (!createdCaseId) return;
    try {
      await changeCaseStatusApi(createdCaseId, "Cancelled");
      toast.success("Case cancelled.");
      
      // Redirect to All Cases page based on user role
      if (user?.role === 'admin') {
        navigate('/admin/cases');
      } else {
        navigate('/user/cases');
      }
    } catch (err) {
      toast.error("Failed to cancel case.");
    }
  };


  const handleGenerateInvoice = async () => {
    if (!createdSaleId) return;
    try {
      const response = await generateInvoiceApi(createdSaleId);
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${createdSaleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleOpenCertificate = () => {
    if (!createdSaleId) return;
    window.open(`/certificate/${createdSaleId}`, "_blank", "noopener,noreferrer");
  };


  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
      <h1 className="text-2xl font-semibold text-[#E4590F] mb-8">{t('case.create')}</h1>

      {createdSaleId && policyMeta && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            policyMeta.agentBlockedFromEditing
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-[#D9D9D9] bg-[#f8f9fa] text-[#2B2B2B]"
          }`}
        >
          {policyMeta.adminMayEditAllFields && (
            <p>{t("createCase.policyEditAdminHint", "As an administrator you may correct all fields on this confirmed policy.")}</p>
          )}
          {policyMeta.agentMayEditLimitedFields && (
            <p>
              {t("createCase.policyEditAgentHint", {
                remaining: policyMeta.policyEditsRemaining,
                defaultValue:
                  "You may adjust first name, last name, destination, and travel dates (length of stay). Remaining corrections: {{remaining}} / 3.",
              })}
            </p>
          )}
          {policyMeta.agentBlockedFromEditing && (
            <p>
              {t(
                "createCase.policyEditAgentBlocked",
                "This confirmed policy can no longer be edited from your account (cut-off 24 hours before departure, maximum corrections reached, or trip already started). Contact an administrator if a change is required."
              )}
            </p>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-[#D9D9D9]/30 p-1 rounded-2xl">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-normal rounded-xl transition-all duration-200 ${activeTab === tab.id
              ? "bg-[#E4590F] text-white"
              : "text-[#2B2B2B] hover:bg-[#D9D9D9]/50"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {currentTab && (
          <div className="animate-fadeIn">
            {currentTab.content}
          </div>
        )}
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-[#D9D9D9]">
        {/* Previous Button */}
        {visibleTabs.length > 1 && (
          <button
            onClick={() => {
              const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) setActiveTab(visibleTabs[currentIndex - 1].id);
            }}
            disabled={activeTab === visibleTabs[0].id}
            className="px-6 py-3 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {t('case.previous')}
          </button>
        )}
        <div className="flex space-x-3">
          {/* Next Button */}
          {visibleTabs.length > 1 && activeTab !== visibleTabs[visibleTabs.length - 1].id && (
            <button
              onClick={() => {
                const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex < visibleTabs.length - 1) setActiveTab(visibleTabs[currentIndex + 1].id);
              }}
              className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
            >
              {t('case.next')}
            </button>
          )}

          {/* Submit Case Button - only on last tab, before case is created */}
          {!createdSaleId && activeTab === visibleTabs[visibleTabs.length - 1].id && !createdCaseId && (
            <div className="flex flex-col items-end space-y-2">
              {!isFormValid() && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg font-normal">
                  Please fill all required fields
                </div>
              )}
              <button
                onClick={handleSubmitCase}
                disabled={!isFormValid()}
                className={`px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
                  isFormValid() 
                    ? 'bg-[#E4590F] hover:bg-[#C94A0D] text-white' 
                    : 'bg-[#D9D9D9] text-[#2B2B2B]/50 cursor-not-allowed'
                }`}
              >
                {/* Submit Case */}
                {t('case.submit')}
              </button>
            </div>
          )}

          {createdCaseId && !createdSaleId && activeTab === "review" && (
            <button
              onClick={handleCancelCase}
              className="px-6 py-3 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium transition-colors cursor-pointer"
            >
             {t('case.cancel')}
            </button>
          )}

          {/* Confirm Sale Button  */}
          {createdCaseId && !createdSaleId && activeTab === "review" && (
            <button
              onClick={handleConfirmSale}
              className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
            >
             {t('case.confirmSale')}
            </button>
          )}

          {/* Download Invoice & Certificate - after sale confirmed */}
          {createdSaleId && (editAllConfirmed || editLimitedConfirmed) && (
            <button
              type="button"
              onClick={saveConfirmedPolicyChanges}
              disabled={savingPolicy}
              className="px-6 py-3 rounded-xl bg-[#2B2B2B] hover:bg-[#1a1a1a] text-white font-medium transition-colors disabled:opacity-50"
            >
              {savingPolicy ? t("createCase.savingPolicy", "Saving…") : t("createCase.savePolicyChanges", "Save policy changes")}
            </button>
          )}
          {createdSaleId && (
            <>
              <button
                onClick={handleGenerateInvoice}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
              >
                {t('sale.downloadInvoice')}
              </button>
              <button
                onClick={handleOpenCertificate}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
              >
                {t('sale.downloadCertificate')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCase;