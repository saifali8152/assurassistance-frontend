import React, { useState, useEffect } from "react";
import { Trash2, Edit3, Save, X, Plus, Check, Eye, EyeOff, ChevronDown } from "lucide-react";
import { 
  getAllCataloguesApi, 
  createCatalogueApi, 
  updateCatalogueApi, 
  deleteCatalogueApi 
} from "../api/catalogueApi";
import { toast } from "react-hot-toast"; // for notifications

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
}

interface FormData {
  name: string;
  productType: string;
  coverage: string;
  eligibleDestinations: string[];
  durations: string[];
  flatPrice?: number;
  terms: string;
  active: boolean;
}

const CreatePlan: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    productType: "Travel",
    coverage: "",
    eligibleDestinations: [],
    durations: [],
    flatPrice: undefined,
    terms: "",
    active: true
  });
  const [previewData, setPreviewData] = useState<Partial<FormData>>({});
  
  // Dropdown states
  //const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  //const [showDestinationsDropdown, setShowDestinationsDropdown] = useState(false);
  
  // Input states for adding new items
  const [destinationInput, setDestinationInput] = useState("");
  const [durationInput, setDurationInput] = useState("");
  //const [pricingRuleInput, setPricingRuleInput] = useState("");

  const productTypes = ["Travel", "Blank","Health Evacuation","Travel Inbound"];
  {/*const availableDestinations = [
    "USA", "Canada", "Mexico", "UK", "France", "Germany", "Italy", "Spain", 
    "Japan", "China", "Australia", "India", "Brazil", "Argentina", "Egypt", 
    "South Africa", "Thailand", "Singapore", "New Zealand", "Norway"
  ];  */}

  const fieldLabels = {
    name: "Plan Name",
    productType: "Product Type",
    coverage: "Coverage Details",
    eligibleDestinations: "Eligible Destinations",
    durations: "Duration Options",
    flatPrice: "Flat Price",
    terms: "Terms & Conditions",
    active: "Plan Status"
  };

  const fieldOrder: (keyof FormData)[] = [
    'name',
    'productType',
    'coverage',
    'eligibleDestinations',
    'durations',
    'flatPrice',
    'terms',
    'active'
  ];

  // Add loading state
  const [loading, setLoading] = useState(false);

  // Fetch plans from backend on mount
  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await getAllCataloguesApi();
        // Backend returns { success, data }
        const plans = res.data.map((plan: any) => ({
          id: String(plan.id),
          name: plan.name,
          productType: plan.product_type,
          coverage: plan.coverage,
          eligibleDestinations: plan.eligible_destinations ? plan.eligible_destinations.split(",") : [],
          durations: plan.durations ? plan.durations.split(",") : [],
          terms: plan.terms,
          active: !!plan.active,
          flatPrice: plan.flat_price,
        }));
        setPlans(plans);
      } catch (err) {
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'active') return;

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setPreviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggleActive = () => {
    const newActive = !formData.active;
    setFormData(prev => ({ ...prev, active: newActive }));
    setPreviewData(prev => ({ ...prev, active: newActive }));
  };

  const handleAddItem = (field: 'eligibleDestinations' | 'durations', value: string) => {
    if (!value.trim()) return;
    const trimmedValue = value.trim();
    if (!formData[field].includes(trimmedValue)) {
      const newArray = [...formData[field], trimmedValue];
      handleInputChange(field, newArray);
    }
    if (field === 'durations') setDurationInput("");
    if (field === 'eligibleDestinations') setDestinationInput("");
  };

  const handleRemoveItem = (field: 'eligibleDestinations' | 'durations', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    field: 'eligibleDestinations' | 'durations',
    value: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(field, value);
    }
  };

  {/*
  const toggleDestination = (destination: string) => {
    const currentDestinations = formData.eligibleDestinations;
    const newDestinations = currentDestinations.includes(destination)
      ? currentDestinations.filter(d => d !== destination)
      : [...currentDestinations, destination];
    
    handleInputChange('eligibleDestinations', newDestinations);
  };  */}

  // Save or update plan
  const handleSavePlan = async () => {
    if (!formData.name.trim() || !formData.coverage.trim()) {
      toast.error('Please fill in at least Plan Name and Coverage');
      return;
    }

    // Prepare payload for backend
    const payload = {
      product_type: formData.productType,
      name: formData.name.trim(),
      coverage: formData.coverage.trim(),
      eligible_destinations: formData.eligibleDestinations.join(","),
      durations: formData.durations.join(","),
      pricing_rules: [], // send empty array for now
      flat_price: formData.flatPrice || null,
      terms: formData.terms.trim(),
      active: formData.active,
    };

    setLoading(true);
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
      const plans = res.data.map((plan: any) => ({
        id: String(plan.id),
        name: plan.name,
        productType: plan.product_type,
        coverage: plan.coverage,
        eligibleDestinations: plan.eligible_destinations ? plan.eligible_destinations.split(",") : [],
        durations: plan.durations ? plan.durations.split(",") : [],
        terms: plan.terms,
        active: !!plan.active,
        flatPrice: plan.flat_price,
      }));
      setPlans(plans);
      setEditingPlan(null);
      setFormData({
        name: "",
        productType: "Travel",
        coverage: "",
        eligibleDestinations: [],
        durations: [],
        terms: "",
        active: true,
        flatPrice: undefined,
      });
      setPreviewData({});
      setDestinationInput("");
      setDurationInput("");
    } catch (err) {
      toast.error("Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  // Delete plan
  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    setLoading(true);
    try {
      await deleteCatalogueApi(Number(id));
      toast.success("Plan deleted!");
      setPlans(prev => prev.filter(plan => plan.id !== id));
    } catch (err) {
      toast.error("Failed to delete plan");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);
    setFormData({
      name: plan.name,
      productType: plan.productType,
      coverage: plan.coverage,
      eligibleDestinations: plan.eligibleDestinations,
      durations: plan.durations,
      terms: plan.terms,
      active: plan.active,
      flatPrice: plan.flatPrice,
    });
    setPreviewData({
      name: plan.name,
      productType: plan.productType,
      coverage: plan.coverage,
      eligibleDestinations: plan.eligibleDestinations,
      durations: plan.durations,
      terms: plan.terms,
      active: plan.active,
      flatPrice: plan.flatPrice,
    });
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      productType: "Travel",
      coverage: "",
      eligibleDestinations: [],
      durations: [],
      terms: "",
      active: true,
      flatPrice: undefined,
    });
    setPreviewData({});
    setDestinationInput("");
    setDurationInput("");
  };

  const renderTagInput = (
    field: 'eligibleDestinations' | 'durations',
    inputValue: string,
    setInputValue: (value: string) => void,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {formData[field].map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-400/20"
          >
            {item}
            <button
              onClick={() => handleRemoveItem(field, index)}
              className="text-blue-300 hover:text-red-300 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => handleKeyPress(e, field, inputValue)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
      />
      <p className="text-white/50 text-xs">Press Enter to add</p>
    </div>
  );

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Plus className="w-8 h-8" />
        {editingPlan ? 'Edit Plan' : 'Create New Plan'}
      </h1>

      {/* Form Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Plan Details</h2>

            {fieldOrder.map((field) => (
              <div key={field} className="mb-4">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  {fieldLabels[field]}
                </label>

                {field === 'productType' ? (
                  <div className="relative">
                    <select
                      value={formData.productType}
                      onChange={(e) => handleInputChange('productType', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                    >
                      {productTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                ) : field === 'eligibleDestinations' ? (
                  renderTagInput('eligibleDestinations', destinationInput, setDestinationInput, 'Enter destination and press Enter...')
                ) : field === 'durations' ? (
                  renderTagInput('durations', durationInput, setDurationInput, 'Enter duration and press Enter...')
                ) : field === 'flatPrice' ? (
                  <input
                    type="number"
                    value={formData.flatPrice ?? ""}
                    onChange={(e) => handleInputChange('flatPrice', e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder="Enter flat price..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                    min={0}
                  />
                ) : field === 'active' ? (
                  <button
                    onClick={handleToggleActive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${formData.active
                        ? 'bg-green-500/20 border-green-400/30 text-green-300'
                        : 'bg-red-500/20 border-red-400/30 text-red-300'
                      }`}
                  >
                    {formData.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {formData.active ? 'Active' : 'Inactive'}
                  </button>
                ) : field === 'terms' ? (
                  <textarea
                    value={formData[field] as string}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`Enter ${fieldLabels[field].toLowerCase()}...`}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300 resize-none h-24"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field] as string}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`Enter ${fieldLabels[field].toLowerCase()}...`}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSavePlan}
                className="flex-1 bg-blue-600  text-white font-semibold py-3 px-6 rounded-xl 300 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingPlan ? 'Update Plan' : 'Save Plan'}
              </button>

              {editingPlan && (
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Live Preview</h2>

            {Object.keys(previewData).length > 0 ? (
              <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                {previewData.name && (
                  <div>
                    <h3 className="text-lg font-semibold text-white">{previewData.name}</h3>
                    <div className="flex gap-2 mt-2">
                      {previewData.productType && (
                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs">
                          {previewData.productType}
                        </span>
                      )}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${previewData.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                        {previewData.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {previewData.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                )}

                {previewData.coverage && (
                  <div>
                    <span className="text-white/70 text-sm">Coverage:</span>
                    <p className="text-white/90">{previewData.coverage}</p>
                  </div>
                )}

                {previewData.eligibleDestinations && previewData.eligibleDestinations.length > 0 && (
                  <div>
                    <span className="text-white/70 text-sm">Destinations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.eligibleDestinations.map((dest, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs">
                          {dest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.durations && previewData.durations.length > 0 && (
                  <div>
                    <span className="text-white/70 text-sm">Durations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.durations.map((duration, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs">
                          {duration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {previewData.flatPrice !== undefined && (
                  <div>
                    <span className="text-white/70 text-sm">Flat Price:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs">
                        {previewData.flatPrice}
                      </span>
                    </div>
                  </div>
                )}

                {previewData.terms && (
                  <div>
                    <span className="text-white/70 text-sm">Terms:</span>
                    <p className="text-white/90 text-xs">{previewData.terms}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-white/50 py-12">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Start typing to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Plans */}
      {plans.length > 0 && (
        <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Saved Plans ({plans.length})</h2>

          <div className="space-y-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 animate-fadeIn"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="flex gap-2">
                        <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-400/30">
                          {plan.productType}
                        </span>
                        <span className={`self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${plan.active
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-400/30'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border border-red-400/30'
                          }`}>
                          {plan.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          {plan.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/90 text-base leading-relaxed">{plan.coverage}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-xl transition-all duration-300 flex items-center gap-2 border border-blue-400/20 hover:border-blue-400/40"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-300 rounded-xl transition-all duration-300 flex items-center gap-2 border border-red-400/20 hover:border-red-400/40"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Destinations */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-300 font-semibold text-sm uppercase tracking-wide">Eligible Destinations</span>
                      </div>
                      {plan.eligibleDestinations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {plan.eligibleDestinations.map((dest, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-400/20"
                            >
                              {dest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/50 text-sm italic">No destinations specified</span>
                      )}
                    </div>

                    {/* Durations */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-purple-300 font-semibold text-sm uppercase tracking-wide">Duration Options</span>
                      </div>
                      {plan.durations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {plan.durations.map((duration, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 rounded-lg text-sm font-medium border border-purple-400/20"
                            >
                              {duration}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/50 text-sm italic">No durations specified</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Flat Price */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-green-300 font-semibold text-sm uppercase tracking-wide">Flat Price</span>
                      </div>
                      {plan.flatPrice !== undefined ? (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-400/20">
                          {plan.flatPrice}
                        </span>
                      ) : (
                        <span className="text-white/50 text-sm italic">No flat price specified</span>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                        <span className="text-amber-300 font-semibold text-sm uppercase tracking-wide">Terms & Conditions</span>
                      </div>
                      <div className="text-white/90 text-sm leading-relaxed line-clamp-4">
                        {plan.terms || <span className="text-white/50 italic">No terms specified</span>}
                      </div>
                    </div>
                  </div>
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