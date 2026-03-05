import { useState } from "react";
import { Info, Check, X } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useTranslation } from "react-i18next";

export interface Plan {
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
    pricingTables?: any;
    currency?: string;
}

interface PlanCardProps {
    plan: Plan;
}

const PlanCard = ({ plan }: PlanCardProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const { formatCurrency } = useCurrency();
    const { t } = useTranslation();

    return (
        <div className="bg-white border border-[#D9D9D9] rounded-xl p-6 hover:border-[#E4590F] transition-all duration-300 relative">
            {/* Header */}
            <div className="mb-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-[#E4590F]">{plan.name}</h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 text-xs rounded-full bg-[#E4590F]/10 text-[#E4590F] border border-[#E4590F]/20">
                            {plan.productType}
                        </span>
                        <span
                            className={`px-3 py-1 text-xs rounded-full ${plan.active
                                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                                }`}
                        >
                            {plan.active ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                            {plan.active ? t("plan.active") : t("plan.inactive")}
                        </span>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="mt-3 space-y-2 text-sm">
                    {plan.countryOfResidence && (
                        <div className="flex items-center gap-2">
                            <span className="text-[#2B2B2B]/60">{t("plan.countryOfResidence")}:</span>
                            <span className="text-[#2B2B2B] font-medium">{plan.countryOfResidence}</span>
                        </div>
                    )}
                    {plan.routeType && (
                        <div className="flex items-center gap-2">
                            <span className="text-[#2B2B2B]/60">{t("plan.routeType")}:</span>
                            <span className="text-[#2B2B2B] font-medium">{plan.routeType}</span>
                        </div>
                    )}
                    {plan.currency && (
                        <div className="flex items-center gap-2">
                            <span className="text-[#2B2B2B]/60">Currency:</span>
                            <span className="text-[#2B2B2B] font-medium">{plan.currency}</span>
                        </div>
                    )}
                    {plan.pricingTables && plan.pricingTables.pricing && plan.pricingTables.pricing.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[#2B2B2B]/60">{t("plan.pricingTables")}:</span>
                            <span className="text-[#E4590F] font-semibold">{plan.pricingTables.pricing.length} {t("plan.duration")}(s)</span>
                        </div>
                    ) : plan.flatPrice ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[#2B2B2B]/60">{t("plan.price")}:</span>
                            <span className="text-[#E4590F] font-semibold">{formatCurrency(plan.flatPrice)}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Coverage Description */}
            {plan.coverage && (
                <p className="text-[#2B2B2B]/80 mb-4 text-sm">{plan.coverage}</p>
            )}

            {/* Expandable Details */}
            {showDetails && (
                <div className="mt-4 pt-4 border-t border-[#D9D9D9] space-y-4 animate-fadeIn">
                    {/* Plan Information */}
                    <div className="space-y-2 text-sm">
                        <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.detailsTitle")}</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <span className="text-[#2B2B2B]/60 font-normal">{t("plan.name")}:</span>
                                <p className="text-[#2B2B2B] font-medium mt-1">{plan.name}</p>
                            </div>
                            <div>
                                <span className="text-[#2B2B2B]/60 font-normal">{t("plan.productType")}:</span>
                                <p className="text-[#2B2B2B] font-medium mt-1">{plan.productType}</p>
                            </div>
                            {plan.countryOfResidence && (
                                <div>
                                    <span className="text-[#2B2B2B]/60 font-normal">{t("plan.countryOfResidence")}:</span>
                                    <p className="text-[#2B2B2B] font-medium mt-1">{plan.countryOfResidence}</p>
                                </div>
                            )}
                            {plan.routeType && (
                                <div>
                                    <span className="text-[#2B2B2B]/60 font-normal">{t("plan.routeType")}:</span>
                                    <p className="text-[#2B2B2B] font-medium mt-1">{plan.routeType}</p>
                                </div>
                            )}
                            {plan.currency && (
                                <div>
                                    <span className="text-[#2B2B2B]/60 font-normal">Currency:</span>
                                    <p className="text-[#2B2B2B] font-medium mt-1">{plan.currency}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-[#2B2B2B]/60 font-normal">{t("plan.status")}:</span>
                                <p className={`font-medium mt-1 ${plan.active ? 'text-green-600' : 'text-red-600'}`}>
                                    {plan.active ? t("plan.active") : t("plan.inactive")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Tables */}
                    {plan.pricingTables && plan.pricingTables.pricing && plan.pricingTables.pricing.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.pricingTables")}</h4>
                            <div className="bg-[#D9D9D9]/10 rounded-lg p-3 overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[#D9D9D9]">
                                            <th className="text-left py-2 pr-4 text-[#2B2B2B] font-semibold">
                                                {plan.productType === "Bank" ? t("plan.cardVolume") : t("plan.duration")}
                                            </th>
                                            {plan.pricingTables.pricingColumns.map((col: string, idx: number) => (
                                                <th key={idx} className="text-right py-2 pl-4 text-[#2B2B2B] font-semibold">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.pricingTables.pricing.map((row: any, rowIdx: number) => (
                                            <tr key={rowIdx} className="border-b border-[#D9D9D9]/50">
                                                <td className="py-2 pr-4 text-[#2B2B2B] font-medium">{row.label}</td>
                                                {plan.pricingTables.pricingColumns.map((col: string, colIdx: number) => (
                                                    <td key={colIdx} className="text-right py-2 pl-4 text-[#E4590F] font-medium">
                                                        {row.columns[col] !== null && row.columns[col] !== undefined 
                                                            ? formatCurrency(row.columns[col]) 
                                                            : t("plan.notApplicable")}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Guarantee Tables */}
                    {plan.pricingTables && plan.pricingTables.guarantees && plan.pricingTables.guarantees.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.guaranteeTables")}</h4>
                            <div className="bg-[#D9D9D9]/10 rounded-lg p-3 space-y-2">
                                {["MEDICAL", "TRAVEL", "JURIDICAL"].map((category) => {
                                    const categoryGuarantees = plan.pricingTables.guarantees.filter((g: any) => g.category === category);
                                    if (categoryGuarantees.length === 0) return null;
                                    const categoryKey = category === "JURIDICAL" ? "legal" : category.toLowerCase();
                                    return (
                                        <div key={category}>
                                            <div className="text-xs font-semibold text-[#2B2B2B] mb-1">{t(`plan.${categoryKey}`)}</div>
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
                                                    <div key={i} className="flex justify-between text-xs ml-2">
                                                        <span className="text-[#2B2B2B]">{coverageTypeDisplay}:</span>
                                                        <span className="text-[#E4590F] font-medium">
                                                            {row.amount !== null ? formatCurrency(row.amount) : t("plan.notApplicable")}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Destinations */}
                    {plan.eligibleDestinations && plan.eligibleDestinations.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">Destinations</h4>
                            <p className="text-sm text-[#2B2B2B]">{plan.eligibleDestinations.join(", ")}</p>
                        </div>
                    )}

                    {/* Terms */}
                    {plan.terms && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.terms")}</h4>
                            <p className="text-sm text-[#2B2B2B]">{plan.terms}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Info Icon - Bottom Right */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="absolute bottom-4 right-4 p-2 rounded-full hover:bg-[#E4590F]/10 text-[#E4590F] transition cursor-pointer"
            >
                <Info className="w-4 h-4" />
            </button>
        </div>
    );
};

export default PlanCard;