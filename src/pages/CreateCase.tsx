import React, { useState, useEffect } from "react";
import InputField from "../components/InputFields";
import DateField from "../components/DateField";
import { User as UserIcon, Mail, Contact, IdCard, Home, Globe2, CalendarIcon, ClockIcon, Cake, MapPin, Users, Flag } from "lucide-react";
import SelectField from "../components/SelectField";
import MultiSelectField from "../components/MultiSelectField";
import { createSaleApi, generateInvoiceApi, generateCertificateApi } from "../api/salesApi";
import PlanCard from "../components/Plans";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { createCaseApi, changeCaseStatusApi, updateCaseApi } from "../api/caseApi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useNavigate } from "react-router-dom";
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
  const { t } = useTranslation();
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

  // Calculate price from pricing table based on duration
  const calculatePriceFromPricingTable = (plan: Plan, days: number): number | null => {
    if (!plan.pricingTables || !plan.pricingTables.pricing || plan.pricingTables.pricing.length === 0) {
      return null;
    }

    // Extract day numbers from pricing row labels (e.g., "10 Days" -> 10)
    const parseDaysFromLabel = (label: string): number | null => {
      const match = label.match(/(\d+)\s*(?:Days|Jours|days|jours)/i);
      if (match) return parseInt(match[1]);
      // Also check for "1 Year" or "1 an"
      if (label.toLowerCase().includes('year') || label.toLowerCase().includes('an')) {
        return 365;
      }
      return null;
    };

    // Find the closest matching pricing row
    let bestMatch: PricingRow | null = null;
    let minDiff = Infinity;

    for (const row of plan.pricingTables.pricing) {
      const rowDays = parseDaysFromLabel(row.label);
      if (rowDays !== null) {
        const diff = Math.abs(rowDays - days);
        if (diff < minDiff) {
          minDiff = diff;
          bestMatch = row;
        }
      }
    }

    if (!bestMatch) {
      // If no exact match, try to find the first row with a valid price
      for (const row of plan.pricingTables.pricing) {
        for (const columnName of plan.pricingTables.pricingColumns) {
          const price = row.columns[columnName];
          if (price !== null && price !== undefined) {
            return price;
          }
        }
      }
      return null;
    }

    // Get price from the appropriate column
    // For most product types, there's one price column
    // For Health Evacuation, there are multiple columns (Classic, Basic, Advanced)
    const columns = plan.pricingTables.pricingColumns;
    
    // For Health Evacuation, default to the first column (Classic) if available
    // For others, use the first (and usually only) price column
    for (const columnName of columns) {
      const price = bestMatch.columns[columnName];
      if (price !== null && price !== undefined) {
        return price;
      }
    }

    return null;
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
  // Countries list (same as in CreatePlan)
  const countries = [
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
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.nationality')}:</span> {nationality}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.countryOfResidence')}:</span> {countryOfResidence}</div>
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
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.destination')}:</span> {destination.length > 0 ? destination.join(", ") : "N/A"}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.startDate')}:</span> {startDate}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.endDate')}:</span> {endDate}</div>
          <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.durationDays')}:</span> {durationDays} {t('createCase.durationDaysPlaceholder')}</div>
        </div>
      </div>

      {selectedPlanObj && (() => {
        // Calculate price
        let calculatedPrice = 0;
        if (durationDays && selectedPlanObj) {
          const days = parseInt(durationDays) || 1;
          if (selectedPlanObj.pricingTables) {
            const price = calculatePriceFromPricingTable(selectedPlanObj, days);
            calculatedPrice = price !== null ? price : 0;
          } else if (selectedPlanObj.flatPrice) {
            calculatedPrice = selectedPlanObj.flatPrice * days;
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
                {totalGuarantees > 0 && (
                  <>
                    <div><span className="font-semibold text-[#2B2B2B]">{t("plan.guaranteeTables")} {t('createCase.total')}:</span></div>
                    <div><span className="text-[#E4590F] font-medium">{formatCurrency(totalGuarantees)}</span></div>
                  </>
                )}
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
                if (selectedPlanObj.pricingTables) {
                  const price = calculatePriceFromPricingTable(selectedPlanObj, days);
                  return price !== null ? formatCurrency(price) : formatCurrency(0);
                } else if (selectedPlanObj.flatPrice) {
                  return formatCurrency(selectedPlanObj.flatPrice * days);
                }
                return formatCurrency(0);
              })()
            }</div>
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.tax')}:</span> {formatCurrency(0)}</div>
            <div><span className="font-semibold text-[#2B2B2B]">{t('createCase.total')}:</span> {
              (() => {
                if (!durationDays || !selectedPlanObj) return formatCurrency(0);
                const days = parseInt(durationDays) || 1;
                if (selectedPlanObj.pricingTables) {
                  const price = calculatePriceFromPricingTable(selectedPlanObj, days);
                  return price !== null ? formatCurrency(price) : formatCurrency(0);
                } else if (selectedPlanObj.flatPrice) {
                  return formatCurrency(selectedPlanObj.flatPrice * days);
                }
                return formatCurrency(0);
              })()
            }</div>
          </div>
        </div>
      )}
    </div>
  );
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
                />
              </div>
              <div>
                <SelectField
                  label={t('createCase.nationality')}
                  options={countries}
                  placeholder={t('createCase.nationalityPlaceholder')}
                  icon={<Flag />}
                  value={nationality}
                  onChange={setNationality}
                  required
                />
              </div>
              <div>
                <SelectField
                  label={t('createCase.countryOfResidence')}
                  options={countries}
                  placeholder={t('createCase.countryOfResidencePlaceholder')}
                  icon={<MapPin />}
                  value={countryOfResidence}
                  onChange={setCountryOfResidence}
                  required
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="relative">
                  <div
                    className={`cursor-pointer transition-all duration-200 rounded-xl ${selectedPlan === plan.id ? 'ring-2 ring-[#E4590F] ring-offset-2' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
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
                <MultiSelectField
                  label={t('createCase.destination')}
                  options={countries}
                  placeholder={t('createCase.destinationPlaceholder')}
                  icon={<Globe2 />}
                  value={destination}
                  onChange={setDestination}
                  required
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
  if (createdSaleId) {
    visibleTabs = [reviewTab];
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

  // Update case when user makes changes after creation
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
      
      // Call update case API
      await updateCaseApi(createdCaseId, payload);
      setLastUpdated(new Date().toLocaleTimeString());
      toast.success("Case updated successfully!");
    } catch (err) {
      console.error("Failed to update case:", err);
      toast.error("Failed to update case");
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
      let premiumAmount = 0;

      // Calculate price from pricing table if available
      if (selectedPlanObj.pricingTables) {
        const priceFromTable = calculatePriceFromPricingTable(selectedPlanObj, days);
        if (priceFromTable !== null) {
          premiumAmount = priceFromTable;
        } else {
          toast.error("No matching price found in pricing table for this duration!");
          return;
        }
      } else if (selectedPlanObj.flatPrice) {
        // Fallback to flatPrice if pricing table is not available (backward compatibility)
        premiumAmount = selectedPlanObj.flatPrice * days;
      } else {
        toast.error("Plan pricing information is not available!");
        return;
      }

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
      // premium_amount should be plan_price + guarantees_total (total before tax)
      const premiumAmountTotal = premiumAmount + guaranteesTotal;
      const grandTotal = premiumAmountTotal + tax;
      
      const payload = {
        case_id: createdCaseId,
        premium_amount: premiumAmountTotal, // plan_price + guarantees_total
        tax: tax,
        total: grandTotal,
        currency: selectedPlanObj.currency || 'XOF',
        plan_price: premiumAmount, // just the plan price
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

  const handleGenerateCertificate = async () => {
    if (!createdSaleId) return;
    try {
      const response = await generateCertificateApi(createdSaleId);
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${createdSaleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download certificate:', error);
      toast.error('Failed to download certificate');
    }
  };


  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full">
      <h1 className="text-2xl font-semibold text-[#E4590F] mb-8">{t('case.create')}</h1>

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
        {!createdSaleId && (
          <button
            onClick={() => {
              const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) setActiveTab(visibleTabs[currentIndex - 1].id);
            }}
            disabled={activeTab === visibleTabs[0].id}
            className="px-6 py-3 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/*  Previous */}
            {t('case.previous')}
          </button>
        )}
        <div className="flex space-x-3">
          {/* Next Button */}
          {!createdSaleId && activeTab !== visibleTabs[visibleTabs.length - 1].id && (
            <button
              onClick={() => {
                const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex < visibleTabs.length - 1) setActiveTab(visibleTabs[currentIndex + 1].id);
              }}
              className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
            >
              {/* Next */}
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
          {createdSaleId && (
            <>
              <button
                onClick={handleGenerateInvoice}
                className="px-6 py-3 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
              >
                {t('sale.downloadInvoice')}
              </button>
              <button
                onClick={handleGenerateCertificate}
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