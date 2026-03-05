import React, { useState, useEffect, useRef } from "react";
import { Trash2, Edit3, Save, X, Plus, Check, Info, ChevronDown } from "lucide-react";
import { 
  getAllCataloguesApi, 
  createCatalogueApi, 
  updateCatalogueApi, 
  deleteCatalogueApi 

} from "../api/catalogueApi";
import { toast } from "react-hot-toast"; // for notifications
import { useTranslation } from "react-i18next";
import { useCurrency } from "../context/CurrencyContext";

interface Plan {
  id: string;
  name: string;
  productType: string;
  flatPrice?: number;
  active: boolean;
  countryOfResidence?: string;
  routeType?: string;
  currency?: string; // Currency code (XOF, USD, EUR)
}

interface PricingRow {
  id: string;
  label: string; // Duration or volume range label
  columns: Record<string, number | null>; // Column name -> premium value (in XOF)
}

interface GuaranteeRow {
  id: string;
  category: string; // "MEDICAL", "TRAVEL", "JURIDICAL"
  coverageType: string;
  amount: number | null; // In XOF (FCFA), null means "Not Applicable"
}

interface PricingTables {
  pricingColumns: string[]; // Column headers (e.g., ["Monde Entier", "Outbound"])
  pricing: PricingRow[];
  guarantees: GuaranteeRow[];
}

interface FormData {
  name: string;
  productType: string;
  active: boolean;
  countryOfResidence?: string;
  routeType?: string;
  pricingTables?: PricingTables;
}

const CreatePlan: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();

  // Get default pricing tables based on product type
  const getDefaultPricingTables = (productType: string): PricingTables => {
    const baseId = () => Math.random().toString(36).substr(2, 9);
    
    switch (productType) {
      case "Travel":
        return {
          pricingColumns: [t("plan.byAir") + " " + t("plan.outbound")],
          pricing: [
            { id: baseId(), label: t("plan.tenDays"), columns: { [t("plan.byAir") + " " + t("plan.outbound")]: 7030 } },
            { id: baseId(), label: t("plan.fortyFiveDays"), columns: { [t("plan.byAir") + " " + t("plan.outbound")]: 18940 } },
            { id: baseId(), label: t("plan.ninetyThreeDays"), columns: { [t("plan.byAir") + " " + t("plan.outbound")]: 26880 } },
            { id: baseId(), label: t("plan.oneHundredEightyDays"), columns: { [t("plan.byAir") + " " + t("plan.outbound")]: 38789 } },
            { id: baseId(), label: t("plan.threeHundredSixtyFiveDays"), columns: { [t("plan.byAir") + " " + t("plan.outbound")]: 50698 } },
          ],
          guarantees: [
            { id: baseId(), category: "MEDICAL", coverageType: "medicalEmergencies", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "medicalTransport", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "hospitalization", amount: 40000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "evacuationRepatriation", amount: 80000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "bodyRepatriation", amount: 5000000 },
            { id: baseId(), category: "TRAVEL", coverageType: "tripCancellation", amount: 600000 },
            { id: baseId(), category: "TRAVEL", coverageType: "baggageDeliveryDelay", amount: 50000 },
            { id: baseId(), category: "TRAVEL", coverageType: "passportLoss", amount: 80000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "civilLiability", amount: 2000000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "legalAssistance", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "bail", amount: 200000 },
          ],
        };
      
      case "Road travel":
        return {
          pricingColumns: [t("plan.byRoad")],
          pricing: [
            { id: baseId(), label: t("plan.tenDays"), columns: { [t("plan.byRoad")]: 1224.10 } },
            { id: baseId(), label: t("plan.fortyFiveDays"), columns: { [t("plan.byRoad")]: 2415.20 } },
            { id: baseId(), label: t("plan.ninetyThreeDays"), columns: { [t("plan.byRoad")]: null } },
            { id: baseId(), label: t("plan.oneHundredEightyDays"), columns: { [t("plan.byRoad")]: null } },
            { id: baseId(), label: t("plan.threeHundredSixtyFiveDays"), columns: { [t("plan.byRoad")]: null } },
          ],
          guarantees: [
            { id: baseId(), category: "MEDICAL", coverageType: "medicalEmergencies", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "medicalTransport", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "hospitalization", amount: 9000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "evacuationRepatriation", amount: 10000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "bodyRepatriation", amount: 1000000 },
            { id: baseId(), category: "TRAVEL", coverageType: "tripCancellation", amount: 100000 },
            { id: baseId(), category: "TRAVEL", coverageType: "baggageDeliveryDelay", amount: null },
            { id: baseId(), category: "TRAVEL", coverageType: "passportLoss", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "civilLiability", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "legalAssistance", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "bail", amount: null },
          ],
        };
      
      case "Travel Inbound":
        return {
          pricingColumns: [t("plan.byAir") + " " + t("plan.inbound")],
          pricing: [
            { id: baseId(), label: t("plan.tenDays"), columns: { [t("plan.byAir") + " " + t("plan.inbound")]: 5442 } },
            { id: baseId(), label: t("plan.fortyFiveDays"), columns: { [t("plan.byAir") + " " + t("plan.inbound")]: 14970 } },
            { id: baseId(), label: t("plan.ninetyThreeDays"), columns: { [t("plan.byAir") + " " + t("plan.inbound")]: 24497.50 } },
            { id: baseId(), label: t("plan.oneHundredEightyDays"), columns: { [t("plan.byAir") + " " + t("plan.inbound")]: null } },
            { id: baseId(), label: t("plan.threeHundredSixtyFiveDays"), columns: { [t("plan.byAir") + " " + t("plan.inbound")]: null } },
          ],
          guarantees: [
            { id: baseId(), category: "MEDICAL", coverageType: "medicalEmergencies", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "medicalTransport", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "hospitalization", amount: 40000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "evacuationRepatriation", amount: 80000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "bodyRepatriation", amount: 5000000 },
            { id: baseId(), category: "TRAVEL", coverageType: "tripCancellation", amount: 600000 },
            { id: baseId(), category: "TRAVEL", coverageType: "baggageDeliveryDelay", amount: 50000 },
            { id: baseId(), category: "TRAVEL", coverageType: "passportLoss", amount: 80000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "civilLiability", amount: 2000000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "legalAssistance", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "bail", amount: 200000 },
          ],
        };
      
      case "Bank":
        return {
          pricingColumns: [t("plan.netPremiums")],
          pricing: [
            { id: baseId(), label: t("plan.threeToFiveThousand"), columns: { [t("plan.netPremiums")]: 4400 } },
            { id: baseId(), label: t("plan.fiveToTenThousand"), columns: { [t("plan.netPremiums")]: 3940 } },
            { id: baseId(), label: t("plan.tenToThirtyThousand"), columns: { [t("plan.netPremiums")]: 3500 } },
            { id: baseId(), label: t("plan.thirtyToFiftyThousand"), columns: { [t("plan.netPremiums")]: 3140 } },
          ],
          guarantees: [
            { id: baseId(), category: "MEDICAL", coverageType: "medicalEmergencies", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "medicalTransport", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "hospitalization", amount: 40000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "evacuationRepatriation", amount: 80000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "bodyRepatriation", amount: 5000000 },
            { id: baseId(), category: "TRAVEL", coverageType: "tripCancellation", amount: 600000 },
            { id: baseId(), category: "TRAVEL", coverageType: "baggageDeliveryDelay", amount: 50000 },
            { id: baseId(), category: "TRAVEL", coverageType: "passportLoss", amount: 80000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "civilLiability", amount: 2000000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "legalAssistance", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "bail", amount: 200000 },
          ],
        };
      
      case "Health Evacuation":
        return {
          pricingColumns: [t("plan.classic"), t("plan.basic"), t("plan.advanced")],
          pricing: [
            { id: baseId(), label: t("plan.oneYear"), columns: { [t("plan.classic")]: 28500, [t("plan.basic")]: 35000, [t("plan.advanced")]: 47000 } },
          ],
          guarantees: [
            { id: baseId(), category: "MEDICAL", coverageType: "medicalEmergencies", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "medicalTransport", amount: null },
            { id: baseId(), category: "MEDICAL", coverageType: "hospitalization", amount: 40000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "evacuationRepatriation", amount: 80000000 },
            { id: baseId(), category: "MEDICAL", coverageType: "bodyRepatriation", amount: 5000000 },
            { id: baseId(), category: "TRAVEL", coverageType: "tripCancellation", amount: 600000 },
            { id: baseId(), category: "TRAVEL", coverageType: "baggageDeliveryDelay", amount: 50000 },
            { id: baseId(), category: "TRAVEL", coverageType: "passportLoss", amount: 80000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "civilLiability", amount: 2000000 },
            { id: baseId(), category: "JURIDICAL", coverageType: "legalAssistance", amount: null },
            { id: baseId(), category: "JURIDICAL", coverageType: "bail", amount: 200000 },
          ],
        };
      
      default:
        return { pricingColumns: [], pricing: [], guarantees: [] };
    }
  };

  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    productType: "",
    active: true, // Always default to active for new plans
    countryOfResidence: "",
    routeType: "",
    pricingTables: undefined
  });
  const [previewData, setPreviewData] = useState<Partial<FormData>>({});

  // Dropdown states
  //const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  //const [showDestinationsDropdown, setShowDestinationsDropdown] = useState(false);


  const productTypes = ["Travel", "Bank", "Health Evacuation", "Travel Inbound", "Road travel"];
  const routeTypes = ["By Air", "By Road"];
  
  // Countries list
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
  
  // Dropdown states
  const [productTypeDropdownOpen, setProductTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [routeTypeDropdownOpen, setRouteTypeDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const productTypeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const routeTypeDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);


  const fieldLabels: Record<keyof FormData, string> = {
    name: t("plan.name"),
    productType: t("plan.productType"),
    active: t("plan.active"),
    countryOfResidence: t("plan.countryOfResidence"),
    routeType: t("plan.routeType"),
    pricingTables: t("plan.pricingTables")
  };

  const fieldOrder: (keyof FormData)[] = [
    'name',
    'productType',
    'countryOfResidence',
    'routeType'
  ];
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch plans from backend on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      try {
        const res = await getAllCataloguesApi();
        // Backend returns { success, data }
        const plans = (res as any).data.map((plan: any) => ({
          id: String(plan.id),
          name: plan.name,
          productType: plan.product_type,
          active: !!plan.active,
          flatPrice: plan.flat_price,
          countryOfResidence: plan.country_of_residence || "",
          routeType: plan.route_type || "",
          pricingTables: plan.pricing_rules ? (typeof plan.pricing_rules === 'string' ? JSON.parse(plan.pricing_rules) : plan.pricing_rules) : null,
          currency: plan.currency || 'XOF', // Load currency from database, default to XOF
        }));
        setPlans(plans);
      } catch (err) {
        toast.error("Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productTypeDropdownRef.current && !productTypeDropdownRef.current.contains(event.target as Node)) {
        setProductTypeDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (routeTypeDropdownRef.current && !routeTypeDropdownRef.current.contains(event.target as Node)) {
        setRouteTypeDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };

    if (productTypeDropdownOpen || statusDropdownOpen || routeTypeDropdownOpen || countryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [productTypeDropdownOpen, statusDropdownOpen, routeTypeDropdownOpen, countryDropdownOpen]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'active') return;

    // If product type changes, reset pricing tables to defaults (only if product type is selected)
    if (field === 'productType') {
      const newPricingTables = value ? getDefaultPricingTables(value) : undefined;
      setFormData(prev => ({
        ...prev,
        [field]: value,
        pricingTables: newPricingTables
      }));
      setPreviewData(prev => ({
        ...prev,
        [field]: value,
        pricingTables: newPricingTables
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setPreviewData(prev => ({
      ...prev,
      [field]: value
    }));
    }
  };

  const handlePricingRowChange = (id: string, field: 'label' | 'columns', value: string | Record<string, number | null>) => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      const updatedPricing = prev.pricingTables.pricing.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      );
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          pricing: updatedPricing
        }
      };
    });
  };

  const handlePricingColumnChange = (id: string, columnName: string, value: number | null) => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      const updatedPricing = prev.pricingTables.pricing.map(row => {
        if (row.id === id) {
          return {
            ...row,
            columns: {
              ...row.columns,
              [columnName]: value
            }
          };
        }
        return row;
      });
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          pricing: updatedPricing
        }
      };
    });
  };

  const handleGuaranteeRowChange = (id: string, field: 'category' | 'coverageType' | 'amount', value: string | number | null) => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      const updatedGuarantees = prev.pricingTables.guarantees.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      );
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          guarantees: updatedGuarantees
        }
      };
    });
  };

  const addPricingRow = () => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      const defaultColumns: Record<string, number | null> = {};
      prev.pricingTables?.pricingColumns.forEach(col => {
        defaultColumns[col] = null;
      });
      const newRow: PricingRow = {
        id: Math.random().toString(36).substr(2, 9),
        label: "",
        columns: defaultColumns
      };
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          pricing: [...prev.pricingTables.pricing, newRow]
        }
      };
    });
  };

  const removePricingRow = (id: string) => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          pricing: prev.pricingTables.pricing.filter(row => row.id !== id)
        }
      };
    });
  };

  const addGuaranteeRow = () => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      const medicalTypes = getCoverageTypesForCategory("MEDICAL");
      const newRow: GuaranteeRow = {
        id: Math.random().toString(36).substr(2, 9),
        category: "MEDICAL",
        coverageType: medicalTypes[0] || "",
        amount: null
      };
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          guarantees: [...prev.pricingTables.guarantees, newRow]
        }
      };
    });
  };

  const removeGuaranteeRow = (id: string) => {
    setFormData(prev => {
      if (!prev.pricingTables) return prev;
      return {
        ...prev,
        pricingTables: {
          ...prev.pricingTables,
          guarantees: prev.pricingTables.guarantees.filter(row => row.id !== id)
        }
      };
    });
  };

  // Get available coverage types for a category
  const getCoverageTypesForCategory = (category: string): string[] => {
    switch (category) {
      case "MEDICAL":
        return ["medicalEmergencies", "medicalTransport", "hospitalization", "evacuationRepatriation", "bodyRepatriation"];
      case "TRAVEL":
        return ["tripCancellation", "baggageDeliveryDelay", "passportLoss", "civilLiability"];
      case "JURIDICAL":
        return ["legalAssistance", "bail"];
      default:
        return [];
    }
  };

  const handleStatusChange = (status: boolean) => {
    setFormData(prev => ({ ...prev, active: status }));
    setPreviewData(prev => ({ ...prev, active: status }));
  };


  // Save or update plan
  const handleSavePlan = async () => {
    if (!formData.name.trim() || !formData.productType) {
      toast.error('Please fill in Plan Name and Product Type');
      return;
    }

    // Prepare payload for backend
    const countryValue = formData.countryOfResidence && formData.countryOfResidence.trim() !== "" 
      ? formData.countryOfResidence.trim() 
      : null;
    const routeValue = formData.routeType && formData.routeType.trim() !== "" 
      ? formData.routeType.trim() 
      : null;
    
    const payload = {
      product_type: formData.productType,
      name: formData.name.trim(),
      pricing_rules: formData.pricingTables || { pricing: [], guarantees: [] }, 
      flat_price: null,
      active: formData.active,
      country_of_residence: countryValue,
      route_type: routeValue,
      currency: currency, // Save the current currency from context
    };
    
    console.log('Payload being sent:', payload);
    console.log('FormData values:', { countryOfResidence: formData.countryOfResidence, routeType: formData.routeType });

    setIsLoading(true);
    try {
      if (editingPlan) {
        await updateCatalogueApi(Number(editingPlan), payload);
        toast.success("Plan updated!");
      } else {
        await createCatalogueApi(payload);
        toast.success("Plan created!");
      }
      // Reload plans
      const res = await getAllCataloguesApi();
      const plans = (res as any).data.map((plan: any) => ({
        id: String(plan.id),
        name: plan.name,
        productType: plan.product_type,
        active: !!plan.active,
        flatPrice: plan.flat_price,
          countryOfResidence: plan.country_of_residence || "",
          routeType: plan.route_type || "",
          pricingTables: plan.pricing_rules ? (typeof plan.pricing_rules === 'string' ? JSON.parse(plan.pricing_rules) : plan.pricing_rules) : null,
          currency: plan.currency || 'XOF', // Load currency from database, default to XOF
      }));
      setPlans(plans);
      setEditingPlan(null);
      setFormData({
        name: "",
        productType: "",
        active: true, // Always default to active for new plans
        countryOfResidence: "",
        routeType: "",
        pricingTables: undefined
      });
      setPreviewData({});
    } catch (err) {
      toast.error("Failed to save plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete plan
  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    setIsLoading(true);
    try {
      await deleteCatalogueApi(Number(id));
      toast.success("Plan deleted!");
      setPlans(prev => prev.filter(plan => plan.id !== id));
    } catch (err) {
      toast.error("Failed to delete plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);
    // Try to load pricing tables from plan, or use defaults
    const pricingTables = (plan as any).pricingTables || getDefaultPricingTables(plan.productType);
    setFormData({
      name: plan.name,
      productType: plan.productType,
      active: plan.active,
      countryOfResidence: plan.countryOfResidence || "",
      routeType: plan.routeType || "",
      pricingTables: pricingTables,
    });
    setPreviewData({
      name: plan.name,
      productType: plan.productType,
      active: plan.active,
      countryOfResidence: plan.countryOfResidence || "",
      routeType: plan.routeType || "",
      pricingTables: pricingTables,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      productType: "",
      active: true, // Always default to active for new plans
        countryOfResidence: "",
        routeType: "",
        pricingTables: undefined
    });
    setPreviewData({});
  };

  return (
    <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 w-full relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
          <div className="bg-white border border-[#D9D9D9] rounded-xl p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
            <span className="text-[#2B2B2B] font-normal">{t("plan.loading", "Loading...")}</span>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#E4590F] flex items-center gap-3">
          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
          {editingPlan ? t("plan.editTitle") : t("plan.createTitle")}
        </h1>
        {/* {!editingPlan && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs border border-green-400/30">
              <Check className="w-3 h-3" />
              {t("plan.defaultActive", "New plans default to Active status")}
            </span>
          </div>
        )} */}
      </div>

      {/* Form Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t("plan.detailsTitle")}</h2>

            {fieldOrder.map((field) => (
              <div key={field} className="mb-4">
                <label className="block text-[#2B2B2B] text-sm font-normal mb-2">
                  {fieldLabels[field]}
                </label>

                {field === 'productType' ? (
                  <div className="relative" ref={productTypeDropdownRef}>
                    <button
                      onClick={() => setProductTypeDropdownOpen(!productTypeDropdownOpen)}
                      className="w-full flex items-center justify-between gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 hover:border-[#E4590F] transition-all duration-200 cursor-pointer group"
                      type="button"
                    >
                      <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
                        {formData.productType || t("plan.productTypePlaceholder")}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
                          productTypeDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {productTypeDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
                        <div className="py-1.5">
                      {productTypes.map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                handleInputChange('productType', type);
                                setProductTypeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                                formData.productType === type
                                  ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                                  : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                              }`}
                              type="button"
                            >
                              <span>{type}</span>
                              {formData.productType === type && (
                                <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : field === 'countryOfResidence' ? (
                  <div className="relative" ref={countryDropdownRef}>
                    <button
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="w-full flex items-center justify-between gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 hover:border-[#E4590F] transition-all duration-200 cursor-pointer group"
                      type="button"
                    >
                      <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
                        {formData.countryOfResidence || t("plan.selectCountry")}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
                          countryDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {countryDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn max-h-60 overflow-y-auto">
                        <div className="py-1.5">
                          {countries.map((country) => (
                            <button
                              key={country}
                              onClick={() => {
                                handleInputChange('countryOfResidence', country);
                                setCountryDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                                formData.countryOfResidence === country
                                  ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                                  : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                              }`}
                              type="button"
                            >
                              <span>{country}</span>
                              {formData.countryOfResidence === country && (
                                <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : field === 'routeType' ? (
                  <div className="relative" ref={routeTypeDropdownRef}>
                    <button
                      onClick={() => setRouteTypeDropdownOpen(!routeTypeDropdownOpen)}
                      className="w-full flex items-center justify-between gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 hover:border-[#E4590F] transition-all duration-200 cursor-pointer group"
                      type="button"
                    >
                      <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
                        {formData.routeType || t("plan.selectRouteType")}
                      </span>
                      <ChevronDown 
                        className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
                          routeTypeDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {routeTypeDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
                        <div className="py-1.5">
                          {routeTypes.map((route) => (
                            <button
                              key={route}
                              onClick={() => {
                                handleInputChange('routeType', route);
                                setRouteTypeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                                formData.routeType === route
                                  ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                                  : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                              }`}
                              type="button"
                            >
                              <span>{route}</span>
                              {formData.routeType === route && (
                                <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData[field] as string}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`Enter ${fieldLabels[field].toLowerCase()}...`}
                    className="w-full px-4 py-3 bg-white border border-[#D9D9D9] rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200"
                  />
                )}
              </div>
            ))}

            {/* Status Section - Only show when editing */}
            {editingPlan && (
              <div className="mb-4">
                <label className="block text-[#2B2B2B] text-sm font-normal mb-2">
                  {t("plan.status", "Status")}
                </label>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="w-full flex items-center justify-between gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-3 hover:border-[#E4590F] transition-all duration-200 cursor-pointer group"
                    type="button"
                  >
                    <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
                      {formData.active ? t("plan.active") : t("plan.inactive")}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
                        statusDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {statusDropdownOpen && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
                      <div className="py-1.5">
                        <button
                          onClick={() => {
                            handleStatusChange(true);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                            formData.active
                              ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                              : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                          }`}
                          type="button"
                        >
                          <span>{t("plan.active")}</span>
                          {formData.active && (
                            <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            handleStatusChange(false);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                            !formData.active
                              ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                              : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                          }`}
                          type="button"
                        >
                          <span>{t("plan.inactive")}</span>
                          {!formData.active && (
                            <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Tables Section */}
            {formData.pricingTables && (
              <div className="mb-6 space-y-6">
                {/* Pricing Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#E4590F]">{t("plan.pricingTables")}</h3>
                    <button
                      onClick={addPricingRow}
                      className="px-3 py-1.5 bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] rounded-xl text-sm font-medium border border-[#E4590F]/20 transition-all duration-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("plan.addPricingRow")}
                    </button>
                  </div>
                  <div className="bg-white border border-[#D9D9D9] rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#D9D9D9]/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2B2B2B]">
                            {formData.productType === "Bank" ? t("plan.cardVolume") : t("plan.duration")}
                          </th>
                          {formData.pricingTables?.pricingColumns.map((col) => (
                            <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-[#2B2B2B]">{col}</th>
                          ))}
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2B2B2B] w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pricingTables.pricing.map((row) => (
                          <tr key={row.id} className="border-t border-[#D9D9D9]">
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={row.label}
                                onChange={(e) => handlePricingRowChange(row.id, 'label', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
                                placeholder={formData.productType === "Bank" ? t("plan.cardVolume") : t("plan.duration")}
                              />
                            </td>
                            {formData.pricingTables?.pricingColumns.map((col) => (
                              <td key={col} className="px-4 py-3">
                                <input
                                  type="number"
                                  value={row.columns[col] ?? ""}
                                  onChange={(e) => handlePricingColumnChange(row.id, col, e.target.value === "" ? null : Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
                                  placeholder={t("plan.notApplicable")}
                                  min={0}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removePricingRow(row.id)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Guarantee Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#E4590F]">{t("plan.guaranteeTables")}</h3>
                    <button
                      onClick={addGuaranteeRow}
                      className="px-3 py-1.5 bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] rounded-xl text-sm font-medium border border-[#E4590F]/20 transition-all duration-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("plan.addGuaranteeRow")}
                    </button>
                  </div>
                  <div className="bg-white border border-[#D9D9D9] rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[#D9D9D9]/30">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2B2B2B]">{t("plan.coverageType")}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-[#2B2B2B]">{t("plan.amount")}</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-[#2B2B2B] w-20"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.pricingTables.guarantees.map((row) => (
                          <tr key={row.id} className="border-t border-[#D9D9D9]">
                            <td className="px-4 py-3">
                              <div className="space-y-2">
                  <select
                                  value={row.category}
                                  onChange={(e) => {
                                    const newCategory = e.target.value;
                                    handleGuaranteeRowChange(row.id, 'category', newCategory);
                                    // Reset coverageType when category changes if current type is not valid for new category
                                    const validTypes = getCoverageTypesForCategory(newCategory);
                                    if (!validTypes.includes(row.coverageType)) {
                                      handleGuaranteeRowChange(row.id, 'coverageType', validTypes[0] || "");
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
                                >
                                  <option value="MEDICAL">{t("plan.medical")}</option>
                                  <option value="TRAVEL">{t("plan.travel")}</option>
                                  <option value="JURIDICAL">{t("plan.legal")}</option>
                                </select>
                                <select
                                  value={row.coverageType}
                                  onChange={(e) => handleGuaranteeRowChange(row.id, 'coverageType', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
                                >
                                  <option value="">{t("plan.coverageType")}</option>
                                  {getCoverageTypesForCategory(row.category).map((typeKey) => (
                                    <option key={typeKey} value={typeKey}>
                                      {t(`plan.${typeKey}`)}
                                    </option>
                                  ))}
                  </select>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.amount ?? ""}
                                onChange={(e) => handleGuaranteeRowChange(row.id, 'amount', e.target.value === "" ? null : Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-[#D9D9D9] rounded-lg text-sm text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent"
                                placeholder={t("plan.notApplicable")}
                                min={0}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeGuaranteeRow(row.id)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSavePlan}
                disabled={isLoading}
                className="flex-1 bg-[#E4590F] hover:bg-[#C94A0D] disabled:bg-[#E4590F]/50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 flex items-center cursor-pointer justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isLoading ? t("plan.saving") : (editingPlan ? t("plan.updateButton") : t("plan.saveButton"))}
              </button>

              {editingPlan && (
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <X className="w-5 h-5" />
                  {t("plan.cancelButton")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-6">{t("plan.livePreviewTitle")}</h2>

            {Object.keys(previewData).length > 0 ? (
              <div className="bg-white border border-[#D9D9D9] rounded-xl p-4 space-y-3">
                {previewData.name && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#E4590F]">{previewData.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previewData.productType && (
                        <span className="px-2 py-1 bg-[#E4590F]/10 text-[#E4590F] rounded-full text-xs font-normal">
                          {previewData.productType}
                        </span>
                      )}
                      {previewData.routeType && (
                        <span className="px-2 py-1 bg-[#E4590F]/10 text-[#E4590F] rounded-full text-xs font-normal">
                          {previewData.routeType}
                        </span>
                      )}
                      {/* <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${previewData.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                        {previewData.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {previewData.active ? t("plan.active") : t("plan.inactive")}
                      </div> */}
                    </div>
                  </div>
                )}

                {previewData.countryOfResidence && (
                  <div>
                    <span className="text-[#2B2B2B]/70 text-sm font-normal">{t("plan.countryOfResidence")}:</span>
                    <p className="text-[#2B2B2B] font-normal">{previewData.countryOfResidence}</p>
                  </div>
                )}

                {/* Pricing Tables Preview */}
                {previewData.pricingTables && previewData.pricingTables.pricing.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#E4590F] mb-2">{t("plan.pricingTables")}</h4>
                    <div className="bg-[#D9D9D9]/10 rounded-lg p-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#D9D9D9]">
                            <th className="text-left py-2 pr-4 text-[#2B2B2B] font-semibold">
                              {previewData.productType === "Bank" ? t("plan.cardVolume") : t("plan.duration")}
                            </th>
                            {previewData.pricingTables.pricingColumns.map((col) => (
                              <th key={col} className="text-left py-2 pr-4 text-[#2B2B2B] font-semibold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.pricingTables.pricing.map((row, i) => (
                            <tr key={i} className="border-b border-[#D9D9D9]/50">
                              <td className="py-2 pr-4 text-[#2B2B2B]">{row.label}</td>
                              {previewData.pricingTables!.pricingColumns.map((col) => (
                                <td key={col} className="py-2 pr-4 text-[#E4590F] font-medium">
                                  {row.columns[col] !== null && row.columns[col] !== undefined 
                                    ? formatCurrency(row.columns[col]!) 
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

                {/* Guarantee Tables Preview */}
                {previewData.pricingTables && previewData.pricingTables.guarantees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#E4590F] mb-2">{t("plan.guaranteeTables")}</h4>
                    <div className="bg-[#D9D9D9]/10 rounded-lg p-3 space-y-2">
                      {["MEDICAL", "TRAVEL", "JURIDICAL"].map((category) => {
                        const categoryGuarantees = previewData.pricingTables!.guarantees.filter(g => g.category === category);
                        if (categoryGuarantees.length === 0) return null;
                        // Translate category: MEDICAL -> medical, TRAVEL -> travel, JURIDICAL -> legal
                        const categoryKey = category === "JURIDICAL" ? "legal" : category.toLowerCase();
                        return (
                          <div key={category}>
                            <div className="text-xs font-semibold text-[#2B2B2B] mb-1">{t(`plan.${categoryKey}`)}</div>
                            {categoryGuarantees.map((row, i) => {
                              // Translate coverageType - it should be a translation key
                              // Try to translate it, but if translation fails, use the original value
                              // (for backward compatibility with existing data that might have translated strings)
                              let coverageTypeDisplay = row.coverageType;
                              if (row.coverageType) {
                                try {
                                  // Check if it's already a translated string by trying to find the key
                                  const coverageTypeKeys = [
                                    "medicalEmergencies", "medicalTransport", "hospitalization",
                                    "evacuationRepatriation", "bodyRepatriation",
                                    "tripCancellation", "baggageDeliveryDelay", "passportLoss",
                                    "civilLiability", "legalAssistance", "bail"
                                  ];
                                  const matchingKey = coverageTypeKeys.find(key => 
                                    t(`plan.${key}`) === row.coverageType
                                  );
                                  if (matchingKey) {
                                    // It's already translated, use it as is
                                    coverageTypeDisplay = row.coverageType;
                                  } else {
                                    // It's a translation key, translate it
                                    coverageTypeDisplay = t(`plan.${row.coverageType}`);
                                  }
                                } catch (e) {
                                  // If translation fails, use original value
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
              </div>
            ) : (
              <div className="text-center text-[#2B2B2B]/50 py-12">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-normal">{t("plan.startTyping")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Plans */}
      {plans.length > 0 && (
        <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#E4590F] mb-6">{t("plan.savedPlansTitle")} ({plans.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="relative bg-white border border-secondary rounded-xl p-5 hover:bg-secondary/30 hover:border-secondary-dark transition-all duration-300 animate-fadeIn h-fit"
              >
                {/* Header with Info Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[#E4590F] truncate mb-2">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-normal ${plan.active
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                        : 'bg-red-500/20 text-red-600 border border-red-500/30'
                        }`}>
                        {plan.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {plan.active ? t("plan.active") : t("plan.inactive")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="cursor-pointer p-1.5 rounded-lg bg-[#D9D9D9] hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white transition-all duration-200"
                    title={t("plan.viewDetails")}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Default View - Plan Name, Status, Basic Info */}
                <div className="flex flex-col gap-4 mb-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-[#2B2B2B]/60 text-xs uppercase tracking-wide font-normal">{t("plan.productType")}</span>
                      <p className="text-[#2B2B2B] text-sm font-medium mt-1">{plan.productType}</p>
                    </div>
                    {(plan.countryOfResidence || plan.routeType) && (
                      <div className="grid grid-cols-2 gap-3">
                        {plan.countryOfResidence && (
                          <div>
                            <span className="text-[#2B2B2B]/60 text-xs uppercase tracking-wide font-normal">{t("plan.countryOfResidence")}</span>
                            <p className="text-[#2B2B2B] text-sm font-normal mt-1">{plan.countryOfResidence}</p>
                          </div>
                        )}
                        {plan.routeType && (
                          <div>
                            <span className="text-[#2B2B2B]/60 text-xs uppercase tracking-wide font-normal">{t("plan.routeType")}</span>
                            <p className="text-[#2B2B2B] text-sm font-normal mt-1">{plan.routeType}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {plan.currency && (
                      <div>
                        <span className="text-[#2B2B2B]/60 text-xs uppercase tracking-wide font-normal">Currency</span>
                        <p className="text-[#2B2B2B] text-sm font-normal mt-1">{plan.currency}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPlan === plan.id && (
                  <div className="border-t border-[#D9D9D9] pt-4 space-y-4 animate-fadeIn">
                    {/* Plan Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.detailsTitle")}</h4>
                      <div className="grid grid-cols-1 gap-3 text-sm">
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
                    {(plan as any).pricingTables && (plan as any).pricingTables.pricing && (plan as any).pricingTables.pricing.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.pricingTables")}</h4>
                        <div className="bg-[#D9D9D9]/10 rounded-lg p-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-[#D9D9D9]">
                                <th className="text-left py-2 pr-4 text-[#2B2B2B] font-semibold">
                                  {plan.productType === "Bank" ? t("plan.cardVolume") : t("plan.duration")}
                                </th>
                                {(plan as any).pricingTables.pricingColumns.map((col: string) => (
                                  <th key={col} className="text-left py-2 pr-4 text-[#2B2B2B] font-semibold">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(plan as any).pricingTables.pricing.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-[#D9D9D9]/50">
                                  <td className="py-2 pr-4 text-[#2B2B2B]">{row.label}</td>
                                  {(plan as any).pricingTables.pricingColumns.map((col: string) => (
                                    <td key={col} className="py-2 pr-4 text-[#E4590F] font-medium">
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
                    {(plan as any).pricingTables && (plan as any).pricingTables.guarantees && (plan as any).pricingTables.guarantees.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-[#E4590F] uppercase tracking-wide">{t("plan.guaranteeTables")}</h4>
                        <div className="bg-[#D9D9D9]/10 rounded-lg p-3 space-y-3">
                          {["MEDICAL", "TRAVEL", "JURIDICAL"].map((category) => {
                            const categoryGuarantees = (plan as any).pricingTables.guarantees.filter((g: any) => g.category === category);
                            if (categoryGuarantees.length === 0) return null;
                            const categoryKey = category === "JURIDICAL" ? "legal" : category.toLowerCase();
                            return (
                              <div key={category} className="border-b border-[#D9D9D9]/50 pb-2 last:border-b-0 last:pb-0">
                                <div className="text-xs font-semibold text-[#2B2B2B] mb-2 uppercase">{t(`plan.${categoryKey}`)}</div>
                                <div className="space-y-1.5">
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
                                      <div key={i} className="flex justify-between items-center text-xs ml-2">
                                        <span className="text-[#2B2B2B] flex-1">{coverageTypeDisplay}:</span>
                                        <span className="text-[#E4590F] font-medium ml-2">
                                          {row.amount !== null && row.amount !== undefined 
                                            ? formatCurrency(row.amount) 
                                            : t("plan.notApplicable")}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-[#D9D9D9]">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-[#E4590F]/10 hover:bg-[#E4590F]/20 disabled:bg-[#E4590F]/5 disabled:cursor-not-allowed text-[#E4590F] cursor-pointer rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-[#E4590F]/20 font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {t("plan.editButton")}
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:bg-red-500/5 disabled:cursor-not-allowed cursor-pointer text-red-600 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm border border-red-500/20 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t("plan.deleteButton")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CreatePlan;