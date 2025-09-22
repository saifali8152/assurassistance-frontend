import React, { useState } from "react";
import { Info, Check, X } from "lucide-react";

export interface Plan {
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

interface PlanCardProps {
    plan: Plan;
    onSelect?: (planId: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 relative">
            {/* Header */}
            <div className="mb-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <div className="flex gap-2 mr-6">
                        <span className="px-3 py-1 text-sm rounded-full bg-indigo-500/20 text-indigo-300">
                            {plan.productType}
                        </span>
                        <span
                            className={`px-3 py-1 text-sm rounded-full ${plan.active
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                        >
                            {plan.active ? <Check className="w-4 h-4 inline" /> : <X className="w-4 h-4 inline" />}
                            {plan.active ? " Active" : " Inactive"}
                        </span>
                    </div>
                </div>

                {/* Always visible key details */}
                <div className="mt-3 flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <span className="text-white/60">Price:</span>
                        <span className="text-green-300 font-semibold">
                            {plan.flatPrice ? `$${plan.flatPrice}` : "N/A"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-white/60">Destinations:</span>
                        <span className="text-blue-300 font-medium">
                            {plan.eligibleDestinations.length > 0
                                ? plan.eligibleDestinations.length === 1 
                                    ? plan.eligibleDestinations[0]
                                    : `${plan.eligibleDestinations[0]} +${plan.eligibleDestinations.length - 1} more`
                                : "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Coverage Description */}
            <p className="text-white/80 mb-8">{plan.coverage}</p>

            {/* Expandable Details */}
            {showDetails && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm text-white/70">
                    <div>
                        <span className="font-semibold text-blue-300">All Destinations: </span>
                        {plan.eligibleDestinations.length > 0
                            ? plan.eligibleDestinations.join(", ")
                            : "N/A"}
                    </div>
                    <div>
                        <span className="font-semibold text-purple-300">Durations: </span>
                        {plan.durations.length > 0 ? plan.durations.join(", ") : "N/A"}
                    </div>
                    <div>
                        <span className="font-semibold text-amber-300">Terms: </span>
                        {plan.terms || "N/A"}
                    </div>
                </div>
            )}

            {/* Info Icon - Bottom Right */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-white/10 text-blue-300 transition cursor-pointer backdrop-blur-sm"
            >
                <Info className="w-4 h-4" />
            </button>
        </div>
    );
};

export default PlanCard;