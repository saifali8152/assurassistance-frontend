import React, { useState, useEffect } from "react";
import InputField from "../components/InputFields";
import { User as UserIcon, Mail, Contact, IdCard, Home, Globe2, CalendarIcon, ClockIcon, CircleDot } from "lucide-react";
import SelectField from "../components/SelectField";
import { createSaleApi, generateInvoiceApi, generateCertificateApi } from "../api/salesApi";
import PlanCard from "../components/Plans";
import { getAllCataloguesApi } from "../api/catalogueApi";
import { createCaseApi } from "../api/caseApi";
import { toast } from "react-hot-toast";

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
    const [status, setStatus] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [createdCaseId, setCreatedCaseId] = useState<number | null>(null);
const [createdSaleId, setCreatedSaleId] = useState<number | null>(null);

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

// Move eligibleDestinations ABOVE tabs
const eligibleDestinations = selectedPlanObj?.eligibleDestinations || [];
    // Tab configuration
    const tabs: Tab[] = [
        {
            id: "traveller",
            label: "Traveller",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <InputField
                                label="Full Name"
                                type="text"
                                placeholder="Sam Carter"
                                icon={<UserIcon />}
                                value={fullName}
                                onChange={setFullName}
                                required
                            />
                        </div>
                        <div>
                            <InputField
                                label="Email"
                                type="text"
                                placeholder="Your Email"
                                icon={<Mail />}
                                value={email}
                                onChange={setEmail}
                                required
                            />
                        </div>
                        <div>
                            <InputField
                                label="Number"
                                type="number"
                                placeholder="Phone Number"
                                icon={<Contact />}
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                required
                            />
                        </div>
                        <div>
                            <InputField
                                label="Passport"
                                type="text"
                                placeholder="Passport ID"
                                icon={<IdCard />}
                                value={passportId}
                                onChange={setPassportId}
                                required
                            />
                        </div>
                        <div>
                            <InputField
                                label="Address"
                                type="text"
                                placeholder="Your Address"
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
            label: "Choose Plan",
            content: (
                <div className="space-y-6">
                    <h2 className="text-xl font-medium text-white mb-4">Choose Plan</h2>
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
            label: "Case Details",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <SelectField
                            label="Destination"
                            options={eligibleDestinations}
                            placeholder="Travel Destination"
                            icon={<Globe2 />}
                            value={destination}
                            onChange={setDestination}
                            required
                        />
                        <InputField
                            label="Start Date"
                            type="date"
                            placeholder="Start Date"
                            icon={<CalendarIcon />}
                            value={startDate}
                            onChange={setStartDate}
                            required
                        />
                        <InputField
                            label="End Date"
                            type="date"
                            placeholder="End Date"
                            icon={<CalendarIcon />}
                            value={endDate}
                            onChange={setEndDate}
                            required
                        />
                        <InputField
                            label="Duration Days"
                            type="number"
                            placeholder="Duration (days)"
                            icon={<ClockIcon />}
                            value={durationDays}
                            onChange={() => { }}
                            required
                            readOnly
                        />
                        <SelectField
                            label="Status"
                            options={["Draft", "Confirmed", "Cancelled"]}
                            placeholder="Status"
                            icon={<CircleDot />}
                            value={status}
                            onChange={setStatus}
                            required
                        />
                    </div>
                </div>
            ),
        },
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab);

    const handleSubmitCase = async () => {
        if (!selectedPlan || !destination || !fullName || !email || !phoneNumber || !passportId || !address || !startDate || !endDate) {
            toast.error("Please fill all required fields");
            return;
        }
        try {
            // Prepare payload to match backend expectations
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
                    status,
                }
            };
const res = await createCaseApi(payload);

if (res.caseId) {
    setCreatedCaseId(res.caseId); 
  toast.success("Case created successfully!");
} else {
  toast.error("Failed to create case");
}


        } catch (err) {
            toast.error("Server error");
        }
    };

{/*const handleConvertToSale = async (caseId: number) => {
  try {
    const payload = {
      case_id: caseId,
      premium_amount: 200,
      tax: 20,
      total: 220,
    };

    const res = await createSaleApi(payload);

    if (res.saleId) {
      toast.success("Sale created successfully!");

      // Generate and open invoice
      const invoice = await generateInvoiceApi({ saleId: res.saleId });
      window.open(invoice.url, "_blank");

      // Generate and open certificate (pass product type dynamically)
      const certificate = await generateCertificateApi({
        saleId: res.saleId,
        productType: "Travel",
      });
      window.open(certificate.url, "_blank");
    } else {
      toast.error("Failed to create sale");
    }
  } catch (err) {
    toast.error("Server error");
  }
};
 */}
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
      setCreatedSaleId(res.saleId); // Store Sale ID
      toast.success("Sale confirmed successfully!");
    } else {
      toast.error("Failed to confirm sale");
    }
  } catch (err) {
    toast.error("Server error");
  }
};

const handleGenerateInvoice = async () => {
  if (!createdSaleId) return;
  const res = await generateInvoiceApi(createdSaleId);
  window.open(res.pdfUrl, "_blank"); // <-- Full URL now
};


const handleGenerateCertificate = async () => {
  if (!createdSaleId) return;
  const res = await generateInvoiceApi(createdSaleId);
  window.open(res.pdfUrl, "_blank"); // <-- Full URL now
};







    return (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
            <h1 className="text-2xl font-semibold text-white mb-8">Create Case</h1>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8 bg-white/5 p-1 rounded-2xl">
                {tabs.map((tab) => (
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
  <button
    onClick={() => {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
    }}
    disabled={activeTab === tabs[0].id}
    className="px-6 py-3 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      backgroundColor: "#0f172b",
      border: "1px solid rgba(255,255,255,0.2)"
    }}
  >
    Previous
  </button>

  <div className="flex space-x-3">
    {/* Save Draft */}
    {activeTab !== tabs[tabs.length - 1].id && (
      <button
        className="px-6 py-3 rounded-xl text-white transition-colors"
        style={{
          backgroundColor: "transparent",
          border: "1px solid rgba(255,255,255,0.2)"
        }}
      >
        Save Draft
      </button>
    )}

    {/* Next Button (always visible except last tab) */}
    {activeTab !== tabs[tabs.length - 1].id && (
      <button
        onClick={() => {
          const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
          if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
        }}
        className="px-6 py-3 rounded-xl text-white transition-colors"
        style={{
          backgroundColor: "#1c398e",
          border: "1px solid rgba(28,57,142,0.3)"
        }}
      >
        Next
      </button>
    )}

    {/* Submit Case Button - only on last tab, before case is created */}
    {activeTab === tabs[tabs.length - 1].id && !createdCaseId && (
      <button
        onClick={handleSubmitCase}
        className="px-6 py-3 rounded-xl text-white transition-colors"
        style={{
          backgroundColor: "#1c398e",
          border: "1px solid rgba(28,57,142,0.3)"
        }}
      >
        Submit Case
      </button>
    )}

    {/* Confirm Sale Button - after case created, before sale confirmed */}
    {createdCaseId && !createdSaleId && (
      <button
        onClick={handleConfirmSale}
        className="px-6 py-3 rounded-xl text-white transition-colors"
        style={{
          backgroundColor: "#16a34a", // green
          border: "1px solid rgba(22,163,74,0.3)"
        }}
      >
        Confirm Sale
      </button>
    )}

    {/* Download Invoice & Certificate - after sale confirmed */}
    {createdSaleId && (
      <>
        <button
          onClick={handleGenerateInvoice}
          className="px-6 py-3 rounded-xl text-white transition-colors"
          style={{
            backgroundColor: "#eab308", // yellow
            border: "1px solid rgba(234,179,8,0.3)"
          }}
        >
          Download Invoice
        </button>
        <button
          onClick={handleGenerateCertificate}
          className="px-6 py-3 rounded-xl text-white transition-colors"
          style={{
            backgroundColor: "#9333ea", // purple
            border: "1px solid rgba(147,51,234,0.3)"
          }}
        >
          Download Certificate
        </button>
      </>
    )}
  </div>
</div>


        </div>
    );
};

export default CreateCase;