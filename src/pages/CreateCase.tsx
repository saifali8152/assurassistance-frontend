import React, { useState, useEffect } from "react";
import InputField from "../components/InputFields";
import { User as UserIcon, Mail, Contact, IdCard, Home, Globe2, CalendarIcon, ClockIcon, CircleDot } from "lucide-react";
import SelectField from "../components/SelectField";
import PlanCard from "../components/Plans";

interface Tab {
    id: string;
    label: string;
    content: React.ReactNode;
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


    const dummyPlans: Plan[] = [

        {
            id: "1",
            name: "Basic Travel Plan",
            productType: "Travel",
            coverage: "Covers emergency medical up to $50,000",
            flatPrice: 200,
            eligibleDestinations: ["USA", "Canada"],
            durations: ["7 days", "14 days"],
            terms: "No pre-existing conditions covered",
            active: true,
        },
        {
            id: "2",
            name: "Premium Health Plan",
            productType: "Health",
            coverage: "Full coverage worldwide",
            flatPrice: 500,
            eligibleDestinations: ["Global"],
            durations: ["1 month", "3 months"],
            terms: "Includes evacuation services",
            active: false,
        },
        {
            id: "3",
            name: "Premium Health Plan",
            productType: "Health",
            coverage: "Full coverage worldwide",
            flatPrice: 500,
            eligibleDestinations: ["Global"],
            durations: ["1 month", "3 months"],
            terms: "Includes evacuation services",
            active: false,
        },
    ];

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
                    {/* Here we neeed to show the plans */}
                    <div className="grid grid-cols-3 gap-8">
                        {dummyPlans.map((plan) => (
                            <div key={plan.id} className="relative ">
                                <div
                                    className={`cursor-pointer transition-all duration-200 ${selectedPlan === plan.id ? '' : ''
                                        }`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    <PlanCard plan={plan} />
                                </div>
                                {/* Radio button */}
                                <div className="absolute top-3 right-3">
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${selectedPlan === plan.id
                                        }`}>
                                        {selectedPlan === plan.id && (
                                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
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
                            options={["Paris", "Dubai", "New York", "Tokyo", "London"]}
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
                            options={["Draft", "Confirmed", "Cancelled",]}
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
                <button
                    onClick={() => {
                        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                        if (currentIndex > 0) {
                            setActiveTab(tabs[currentIndex - 1].id);
                        }
                    }}
                    disabled={activeTab === tabs[0].id}
                    className="cursor-pointer px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <div className="flex space-x-3">
                    {activeTab !== tabs[tabs.length - 1].id && (
                        <button className="cursor-pointer px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors">
                            Save Draft
                        </button>
                    )}
                    <button
                        onClick={() => {
                            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
                            if (currentIndex < tabs.length - 1) {
                                setActiveTab(tabs[currentIndex + 1].id);
                            }
                        }}
                        className="cursor-pointer px-6 py-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-white hover:bg-blue-500/30 transition-colors"
                    >
                        {activeTab === tabs[tabs.length - 1].id ? "Submit Case" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCase;