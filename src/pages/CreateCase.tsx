import React, { useState, useEffect } from "react";
import InputField from "../components/InputFields";
import DateField from "../components/DateField";
import { User as UserIcon, Mail, Contact, IdCard, Home, Globe2, CalendarIcon, ClockIcon, CircleDot } from "lucide-react";
import SelectField from "../components/SelectField";
import { createSaleApi, generateInvoiceApi, generateCertificateApi } from "../api/salesApi";
import PlanCard from "../components/Plans";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { createCaseApi, changeCaseStatusApi } from "../api/caseApi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface Plan {
  id: string;
  name: string;
  productType: string;
  coverage: string;
  flatPrice: number;
  eligibleDestinations: string[];
  durations: string[];
  terms: string;
  active: boolean;
}

const CreateCase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("traveller");
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passportId, setPassportId] = useState('');
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<number | null>(null);
  const [createdSaleId, setCreatedSaleId] = useState<number | null>(null);
const { t } = useTranslation();
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
        const activePlans = res.data
          .filter((plan: any) => !!plan.active)
          .map((plan: any) => ({
            id: String(plan.id),
            name: plan.name,
            productType: plan.product_type,
            coverage: plan.coverage,
            flatPrice: plan.flat_price,
            eligibleDestinations: typeof plan.eligible_destinations === "string"
              ? plan.eligible_destinations.split(",").map((d: string) => d.trim()).filter((d: string) => d)
              : [],
            durations: typeof plan.durations === "string"
              ? plan.durations.split(",").map((d: string) => d.trim()).filter((d: string) => d)
              : [],
            terms: plan.terms,
            active: !!plan.active,
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

  // Find selected plan first
  const selectedPlanObj = plans.find(p => p.id === selectedPlan);
  const reviewDetails = (
    <div className="space-y-6">
      <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">{t('createCase.travellerDetails')}</h3>
        <div className="grid grid-cols-2 gap-4 text-white/80">
          <div><span className="font-medium text-white">{t('createCase.name')}:</span> {fullName}</div>
          <div><span className="font-medium text-white">{t('createCase.email')}:</span> {email}</div>
          <div><span className="font-medium text-white">{t('createCase.phone')}:</span> {phoneNumber}</div>
          <div><span className="font-medium text-white">{t('createCase.passport')}:</span> {passportId}</div>
          <div><span className="font-medium text-white">{t('createCase.address')}:</span> {address}</div>
        </div>
      </div>
      <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">{t('createCase.caseDetails')}</h3>
        <div className="grid grid-cols-2 gap-4 text-white/80">
          <div><span className="font-medium text-white">{t('createCase.destination')}:</span> {destination}</div>
          <div><span className="font-medium text-white">{t('createCase.startDate')}:</span> {startDate}</div>
          <div><span className="font-medium text-white">{t('createCase.endDate')}:</span> {endDate}</div>
          <div><span className="font-medium text-white">{t('createCase.durationDays')}:</span> {durationDays} {t('createCase.durationDaysPlaceholder')}</div>
        </div>
      </div>

      {selectedPlanObj && (
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">{t('createCase.reviewPlan')}</h3>
          <div className="grid grid-cols-2 gap-4 text-white/80">
            <div><span className="font-medium text-white">{t('createCase.plan')}:</span> {selectedPlanObj.name}</div>
            <div><span className="font-medium text-white">{t('createCase.productType')}:</span> {selectedPlanObj.productType}</div>
            <div><span className="font-medium text-white">{t('createCase.coverage')}:</span> {selectedPlanObj.coverage}</div>
            <div><span className="font-medium text-white">{t('createCase.price')}:</span> {selectedPlanObj.flatPrice}</div>
          </div>
        </div>
      )}
      {createdSaleId && (
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">{t('createCase.reviewSale')}</h3>
          <div className="grid grid-cols-2 gap-4 text-white/80">
            <div><span className="font-medium text-white">{t('createCase.saleId')}:</span> {createdSaleId}</div>
            <div><span className="font-medium text-white">{t('createCase.premium')}:</span> 200</div>
            <div><span className="font-medium text-white">{t('createCase.tax')}:</span> 20</div>
            <div><span className="font-medium text-white">{t('createCase.total')}:</span> 220</div>
          </div>
        </div>
      )}
    </div>
  );
  // Move eligibleDestinations ABOVE tabs
  const eligibleDestinations = selectedPlanObj?.eligibleDestinations || [];
  // Tab configuration
  const tabs: Tab[] = [
    {
      id: "traveller",
      label: t('createCase.travellerDetails'),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <InputField
                label={t('createCase.fullName')}
                type="text"
                placeholder={t('createCase.fullNamePlaceholder')}
                icon={<UserIcon />}
                value={fullName}
                onChange={setFullName}
                required
              />
            </div>
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
                type="number"
                placeholder={t('createCase.phonePlaceholder')}
                icon={<Contact />}
                value={phoneNumber}
                onChange={setPhoneNumber}
                required
              />
            </div>
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
            <div>
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
      ),
    },

    {
      id: "choosePlan",
      label: t('createCase.choosePlan'),
      content: (
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-white mb-4">{t('createCase.choosePlanTitle')}</h2>
          <div className="grid grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="relative ">
                <div
                  className={`cursor-pointer transition-all duration-200 ${selectedPlan === plan.id ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <PlanCard plan={plan} />
                </div>
                <div className="absolute top-3 right-3">
                  <div className={`w-5 h-5 rounded-full border-2 border-blue-400 transition-all duration-200 flex items-center justify-center ${selectedPlan === plan.id ? 'bg-blue-400' : 'bg-transparent'}`}>
                    {selectedPlan === plan.id && (
                      <div className="w-3 h-3 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    {
      id: "case",
      label: t('createCase.caseDetails'),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <SelectField
              label={t('createCase.destination')}
              options={eligibleDestinations}
              placeholder={t('createCase.destinationPlaceholder')}
              icon={<Globe2 />}
              value={destination}
              onChange={setDestination}
              required
            />
            <DateField
              label={t('createCase.startDate')}
              placeholder={t('createCase.startDatePlaceholder')}
              icon={<CalendarIcon />}
              value={startDate}
              onChange={setStartDate}
              required
            />

            <DateField
              label={t('createCase.endDate')}
              placeholder={t('createCase.endDatePlaceholder')}
              icon={<CalendarIcon />}
              value={endDate}
              onChange={setEndDate}
              required
            />
            <InputField
              label={t('createCase.durationDays')}
              type="number"
              placeholder={t('createCase.durationDaysPlaceholder')}
              icon={<ClockIcon />}
              value={durationDays}
              onChange={() => { }}
              required
              readOnly
            />

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


  const handleSubmitCase = async () => {
    if (!selectedPlan || !destination || !fullName || !email || !phoneNumber || !passportId || !address || !startDate || !endDate) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      // Set status to "Confirmed" automatically
      const payload = {
        traveller: {
          full_name: fullName,
          passport_or_id: passportId,
          phone: phoneNumber,
          email,
          address,
        },
        caseData: {
          destination,
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

  const handleConfirmSale = async () => {
    if (!createdCaseId) {
      toast.error("Create case first!");
      return;
    }
    try {
      const payload = {
        case_id: createdCaseId,
        premium_amount: 200,
        tax: 20,
        total: 220,
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
      // Optionally, redirect or reset state here
    } catch (err) {
      toast.error("Failed to cancel case.");
    }
  };


  const handleGenerateInvoice = async () => {
    if (!createdSaleId) return;
    const res = await generateInvoiceApi(createdSaleId);
    window.open(res.url, "_blank"); // <-- Use res.url
  };

  const handleGenerateCertificate = async () => {
    if (!createdSaleId) return;
    const res = await generateCertificateApi(createdSaleId); // <-- Use correct API
    window.open(res.url, "_blank");
  };


  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
      <h1 className="text-2xl font-semibold text-white mb-8">{t('case.create')}</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-white/5 p-1 rounded-2xl">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === tab.id
              ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
              : "text-white/70 hover:text-white hover:bg-white/10"
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

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        {/* Previous Button */}
        {!createdSaleId && (
          <button
            onClick={() => {
              const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) setActiveTab(visibleTabs[currentIndex - 1].id);
            }}
            disabled={activeTab === visibleTabs[0].id}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/*  Previous */}
            {t('case.previous')}
          </button>
        )}
        <div className="flex space-x-3">
          {/* Save Draft */}
          {!createdSaleId && activeTab !== visibleTabs[visibleTabs.length - 1].id && (
            <button
              className="px-6 py-3 rounded-xl text-white transition-colors cursor-pointer"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              {t('case.saveDraft')}
            </button>
          )}

          {/* Next Button */}
          {!createdSaleId && activeTab !== visibleTabs[visibleTabs.length - 1].id && (
            <button
              onClick={() => {
                const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
                if (currentIndex < visibleTabs.length - 1) setActiveTab(visibleTabs[currentIndex + 1].id);
              }}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
            >
              {/* Next */}
              {t('case.next')}
            </button>
          )}

          {/* Submit Case Button - only on last tab, before case is created */}
          {!createdSaleId && activeTab === visibleTabs[visibleTabs.length - 1].id && !createdCaseId && (
            <button
              onClick={handleSubmitCase}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
            >
              {/* Submit Case */}
              {t('case.submit')}
            </button>
          )}

          {createdCaseId && !createdSaleId && activeTab === "review" && (
            <button
              onClick={handleCancelCase}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
            >
             {t('case.cancel')}
            </button>
          )}

          {/* Confirm Sale Button  */}
          {createdCaseId && !createdSaleId && activeTab === "review" && (
            <button
              onClick={handleConfirmSale}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
            >
             {t('case.confirmSale')}
            </button>
          )}

          {/* Download Invoice & Certificate - after sale confirmed */}
          {createdSaleId && (
            <>
              <button
                onClick={handleGenerateInvoice}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
              >
                {t('sale.downloadInvoice')}
              </button>
              <button
                onClick={handleGenerateCertificate}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
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