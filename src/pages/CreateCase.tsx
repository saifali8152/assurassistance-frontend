import React, { useState } from "react";
import InputField from "../components/InputFields";
import { User as UserIcon, Mail, Contact, IdCard, Badge, Home, Plane, Globe2, CalendarIcon, ClockIcon, CircleDot } from "lucide-react";
import SelectField from "../components/SelectField";

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
    const [Id, setId] = useState('');
    const [address, setAddress] = useState('');
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [durationDays, setDurationDays] = useState('');
    const [status, setStatus] = useState('');
    // Tab configuration - easy to add more tabs here
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
                                label="Your ID"
                                type="text"
                                placeholder="Your ID"
                                icon={<Badge />}
                                value={Id}
                                onChange={setId}
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
            id: "case",
            label: "Case",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <InputField
                            label="ID"
                            type="text"
                            placeholder="Your ID"
                            icon={<Badge />}
                            value={Id}
                            onChange={setId}
                            required
                        />
                        <InputField
                            label="Traveller ID"
                            type="text"
                            placeholder="Traveller ID"
                            icon={<Plane />}
                            value={Id}
                            onChange={setId}
                            required
                        />

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
                            onChange={setDurationDays}
                            required
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
        {
            id: "certificate",
            label: "Certificate",
            content: (
                <div className="space-y-6">
                    <h2 className="text-xl font-medium text-white mb-4">Certificate Requirements</h2>
                   
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
                    <button className="cursor-pointer px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors">
                        Save Draft
                    </button>
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
        </div>
    );
};

export default CreateCase;