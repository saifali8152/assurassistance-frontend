import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getAllCasesApi, getMyCasesWithPaginationApi, cancelCaseApi, generateInvoiceApi } from '../api/caseApi';
import { createSaleApi } from '../api/salesApi';
import { ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Eye, Calendar, Phone, MapPin, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

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

interface Case {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days?: number;
  status: string;
  created_at: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  country_of_residence?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  passport_or_id?: string;
  plan_name: string;
  phone: string;
  email: string;
  product_type: string;
  coverage: string;
  flat_price?: number;
  pricing_rules?: string | PricingTables;
  pricingTables?: PricingTables;
  currency?: string;
  plan_country_of_residence?: string;
  route_type?: string;
  sale_id?: number;
  invoice_generated?: boolean;
  certificate_generated?: boolean;
  created_by_name?: string;
}

const CasesManagement: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const itemsPerPage = 10;

  // Calculate price from pricing table based on duration
  const calculatePriceFromPricingTable = (caseItem: Case, days: number): number | null => {
    if (!caseItem.pricingTables || !caseItem.pricingTables.pricing || caseItem.pricingTables.pricing.length === 0) {
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

    for (const row of caseItem.pricingTables.pricing) {
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
      for (const row of caseItem.pricingTables.pricing) {
        for (const columnName of caseItem.pricingTables.pricingColumns) {
          const price = row.columns[columnName];
          if (price !== null && price !== undefined) {
            return price;
          }
        }
      }
      return null;
    }

    // Get price from the appropriate column
    const columns = caseItem.pricingTables.pricingColumns;
    for (const columnName of columns) {
      const price = bestMatch.columns[columnName];
      if (price !== null && price !== undefined) {
        return price;
      }
    }

    return null;
  };

  // Calculate plan price for display
  const calculatePlanPrice = (caseItem: Case): number => {
    if (!caseItem.duration_days) return 0;
    const days = caseItem.duration_days;
    
    if (caseItem.pricingTables) {
      const price = calculatePriceFromPricingTable(caseItem, days);
      if (price !== null) return price;
    }
    
    // Fallback to flat_price if pricing table is not available
    if (caseItem.flat_price) {
      return caseItem.flat_price * days;
    }
    
    return 0;
  };

  // Calculate guarantees total
  const calculateGuaranteesTotal = (caseItem: Case): number => {
    if (!caseItem.pricingTables || !caseItem.pricingTables.guarantees) return 0;
    
    let total = 0;
    caseItem.pricingTables.guarantees.forEach((g: any) => {
      if (g.amount !== null && g.amount !== undefined) {
        total += g.amount;
      }
    });
    
    return total;
  };

  // Calculate total price (plan price + guarantees)
  const calculateTotalPrice = (caseItem: Case): number => {
    return calculatePlanPrice(caseItem) + calculateGuaranteesTotal(caseItem);
  };

  const fetchCases = async (page: number = 1, search: string = '', status: string = '') => {
    try {
      setLoading(true);
      const response = user?.role === 'admin' 
        ? await getAllCasesApi(page, itemsPerPage)
        : await getMyCasesWithPaginationApi(page, itemsPerPage);
      const data = response as any;
      let filteredCases = (data.cases || []).map((caseItem: any) => {
        // Parse pricing_rules if it's a string
        let pricingTables: PricingTables | undefined;
        if (caseItem.pricing_rules) {
          try {
            pricingTables = typeof caseItem.pricing_rules === 'string' 
              ? JSON.parse(caseItem.pricing_rules) 
              : caseItem.pricing_rules;
          } catch (e) {
            console.error('Failed to parse pricing_rules:', e);
          }
        }
        
        return {
          ...caseItem,
          pricingTables,
        };
      });
      
      // Apply search filter
      if (search.trim()) {
        const searchLower = search.toLowerCase();
        filteredCases = filteredCases.filter((caseItem: Case) => 
          caseItem.full_name.toLowerCase().includes(searchLower) ||
          caseItem.destination.toLowerCase().includes(searchLower) ||
          caseItem.plan_name.toLowerCase().includes(searchLower) ||
          caseItem.email.toLowerCase().includes(searchLower) ||
          caseItem.phone.includes(search) ||
          caseItem.id.toString().includes(search) ||
          (caseItem.created_by_name && caseItem.created_by_name.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply status filter
      if (status) {
        filteredCases = filteredCases.filter((caseItem: Case) => 
          caseItem.status === status
        );
      }
      
      // Apply pagination to filtered results
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedCases = filteredCases.slice(startIndex, endIndex);
      
      setCases(paginatedCases);
      // Calculate pagination for filtered results
      const totalFilteredCases = filteredCases.length;
      const totalPagesForFiltered = Math.ceil(totalFilteredCases / itemsPerPage);
      setTotalPages(totalPagesForFiltered);
      setTotalCases(totalFilteredCases);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCases(1, searchTerm, statusFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchCases(currentPage, searchTerm, statusFilter);
  }, [currentPage]);

  const handleConfirmSale = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      const caseItem = cases.find(c => c.id === caseId);
      if (caseItem) {
        const days = caseItem.duration_days || 1;
        let premiumAmount = 0;

        // Calculate price from pricing table if available
        if (caseItem.pricingTables) {
          const priceFromTable = calculatePriceFromPricingTable(caseItem, days);
          if (priceFromTable !== null) {
            premiumAmount = priceFromTable;
          } else {
            toast.error("No matching price found in pricing table for this duration!");
            setActionLoading(null);
            return;
          }
        } else if (caseItem.flat_price) {
          // Fallback to flatPrice if pricing table is not available
          premiumAmount = caseItem.flat_price * days;
        } else {
          toast.error("Plan pricing information is not available!");
          setActionLoading(null);
          return;
        }

        // Calculate guarantees total and details
        let guaranteesTotal = 0;
        const guaranteesDetails: any[] = [];
        if (caseItem.pricingTables && caseItem.pricingTables.guarantees) {
          caseItem.pricingTables.guarantees.forEach((g: any) => {
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

        const tax = 0;
        // premium_amount should be plan_price + guarantees_total (total before tax)
        const premiumAmountTotal = premiumAmount + guaranteesTotal;
        const grandTotal = premiumAmountTotal + tax;
        
        const payload = {
          case_id: caseId,
          premium_amount: premiumAmountTotal, // plan_price + guarantees_total
          tax: tax,
          total: grandTotal,
          currency: caseItem.currency || 'XOF',
          plan_price: premiumAmount, // just the plan price
          guarantees_total: guaranteesTotal,
          guarantees_details: guaranteesDetails.length > 0 ? guaranteesDetails : undefined,
        };
        const res = await createSaleApi(payload);
        if (res?.saleId) {
          toast.success('Sale confirmed successfully');
        } else {
          toast.error('Failed to confirm sale');
        }
      }
      await fetchCases(currentPage, searchTerm, statusFilter);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to confirm sale:', error);
      toast.error('Failed to confirm sale');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelCase = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      await cancelCaseApi(caseId);
      toast.success('Case cancelled successfully');
      await fetchCases(currentPage, searchTerm, statusFilter);
      setShowModal(false);
    } catch (error) {
      console.error('Failed to cancel case:', error);
      toast.error('Failed to cancel case');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = async (saleId: number) => {
    try {
      setActionLoading(saleId);
      const response = await generateInvoiceApi(saleId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${saleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCertificate = (saleId: number) => {
    window.open(`/certificate/${saleId}`, "_blank", "noopener,noreferrer");
  };

  const openModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-500/10 text-green-600 border border-green-500/20';
      case 'Pending': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-600 border border-red-500/20';
      default: return 'bg-[#D9D9D9]/30 text-[#2B2B2B] border border-[#D9D9D9]';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cases Table Section */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-[#E4590F]">
            {user?.role === 'admin' ? t("cases.allCases") : t("cases.myCases")}
          </h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t("cases.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all"
            >
              <option value="">{t("cases.allStatus")}</option>
              <option value="Confirmed">{t("cases.statusConfirmed")}</option>
              <option value="Cancelled">{t("cases.statusCancelled")}</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
                fetchCases(1, "", "");
              }}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#D9D9D9]/80 text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("cases.clear")}
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-[#2B2B2B]">
                <div className="w-6 h-6 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
                <span>{t("cases.loading")}</span>
              </div>
            </div>
          )}

          {cases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-[#D9D9D9]" />
              <h3 className="mt-2 text-sm font-medium text-[#2B2B2B]">{t("cases.noCases")}</h3>
              <p className="mt-1 text-sm text-[#2B2B2B]/60">
                {user?.role === 'admin' 
                  ? t("cases.noCasesAdmin") 
                  : t("cases.noCasesAgent")
                }
              </p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9]">
                    <th className="text-left text-[#2B2B2B]/70 font-medium py-4 px-2">{t("cases.caseDetails")}</th>
                    <th className="text-center text-[#2B2B2B]/70 font-medium py-4 px-2 hidden sm:table-cell">{t("cases.traveller")}</th>
                    <th className="text-center text-[#2B2B2B]/70 font-medium py-4 px-2 hidden lg:table-cell">{t("cases.plan")}</th>
                    <th className="text-center text-[#2B2B2B]/70 font-medium py-4 px-2 hidden sm:table-cell">{t("cases.status")}</th>
                    <th className="text-right text-[#2B2B2B]/70 font-medium py-4 px-2 hidden lg:table-cell">{t("cases.price")}</th>
                    <th className="text-right text-[#2B2B2B]/70 font-medium py-4 px-2 hidden lg:table-cell">{t("plan.guaranteeTables")}</th>
                    <th className="text-right text-[#2B2B2B]/70 font-medium py-4 px-2 hidden lg:table-cell">{t("createCase.grandTotal")}</th>
                    {user?.role === 'admin' && (
                      <th className="text-center text-[#2B2B2B]/70 font-medium py-4 px-2 hidden md:table-cell">{t("cases.createdBy")}</th>
                    )}
                    <th className="text-left text-[#2B2B2B]/70 font-medium py-4 px-2">{t("cases.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b border-[#D9D9D9] hover:bg-[#D9D9D9]/30 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[#2B2B2B] font-medium text-left">Case #{caseItem.id}</div>
                            <div className="text-[#2B2B2B]/60 text-sm flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {caseItem.destination}
                            </div>
                            <div className="text-[#2B2B2B]/60 text-sm flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(caseItem.start_date)} - {formatDate(caseItem.end_date)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden sm:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] font-medium">{caseItem.full_name}</div>
                          <div className="text-[#2B2B2B]/60 text-sm flex items-center justify-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {caseItem.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                        <div className="text-center">
                          <div className="text-[#2B2B2B] font-medium">{caseItem.plan_name}</div>
                          <div className="text-[#2B2B2B]/60 text-sm">{caseItem.product_type}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex justify-center">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </span>
                        </div>
                        {caseItem.sale_id ? (
                          <div className="text-xs text-green-600 mt-1 text-center">
                            Sale #{caseItem.sale_id}
                          </div>
                        ) : (
                          <div className="text-xs text-red-600 mt-1 text-center">
                            No sale
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                        <div className="text-right">
                          <div className="text-[#E4590F] font-semibold">
                            {formatCurrency(calculatePlanPrice(caseItem))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                        <div className="text-right">
                          <div className="text-[#2B2B2B] font-medium">
                            {formatCurrency(calculateGuaranteesTotal(caseItem))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                        <div className="text-right">
                          <div className="text-[#E4590F] font-semibold">
                            {formatCurrency(calculateTotalPrice(caseItem))}
                          </div>
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="py-4 px-2 text-[#2B2B2B]/80 hidden md:table-cell">
                          <div className="text-center">
                            <div className="text-[#2B2B2B] font-medium">
                              {caseItem.created_by_name || 'Unknown'}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(caseItem)}
                            className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white transition-colors"
                            title={t("cases.viewDetails")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {user?.role === 'admin' && caseItem.status === 'Confirmed' && !caseItem.sale_id && (
                            <button
                              onClick={() => handleConfirmSale(caseItem.id)}
                              disabled={actionLoading === caseItem.id}
                              className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50 border border-green-500/20"
                              title={t("cases.confirmSale")}
                            >
                              {actionLoading === caseItem.id ? (
                                <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {user?.role === 'admin' && caseItem.status === 'Confirmed' && !caseItem.sale_id && (
                            <button
                              onClick={() => handleCancelCase(caseItem.id)}
                              disabled={actionLoading === caseItem.id}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 border border-red-500/20"
                              title={t("cases.cancelCase")}
                            >
                              {actionLoading === caseItem.id ? (
                                <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {caseItem.sale_id && (
                            <>
                              <button
                                onClick={() => caseItem.sale_id && handleDownloadInvoice(caseItem.sale_id)}
                                disabled={actionLoading === caseItem.sale_id}
                                className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 border border-purple-500/20"
                                title={t("cases.downloadInvoice")}
                              >
                                {actionLoading === caseItem.sale_id ? (
                                  <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => caseItem.sale_id && handleOpenCertificate(caseItem.sale_id)}
                                disabled={!caseItem.sale_id}
                                className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50 border border-indigo-500/20"
                                title={t("cases.downloadCertificate")}
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
                <div className="text-[#2B2B2B]/70 text-sm">
                  {t("cases.showing")} <span className="font-medium text-[#2B2B2B]">{(currentPage - 1) * itemsPerPage + 1}</span> {t("cases.to")}{' '}
                  <span className="font-medium text-[#2B2B2B]">
                    {Math.min(currentPage * itemsPerPage, totalCases)}
                  </span>{' '}
                  {t("cases.of")} <span className="font-medium text-[#2B2B2B]">{totalCases}</span> {t("cases.results")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] hover:bg-[#D9D9D9]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-[#E4590F] text-white'
                            : 'bg-white border border-[#D9D9D9] text-[#2B2B2B] hover:bg-[#D9D9D9]/30'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] hover:bg-[#D9D9D9]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-2xl w-full h-fit">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#E4590F] text-xl font-semibold">{t("cases.caseDetails")}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg bg-[#D9D9D9]/30 hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.caseId")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B] font-medium">#{selectedCase.id}</span></div>
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.status")}:</span></div>
                <div className="text-left">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.traveller")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.full_name}</span></div>
                {selectedCase.date_of_birth && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.dateOfBirth")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{new Date(selectedCase.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                  </>
                )}
                {selectedCase.gender && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.gender")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.gender}</span></div>
                  </>
                )}
                {selectedCase.nationality && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.nationality")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.nationality}</span></div>
                  </>
                )}
                {selectedCase.country_of_residence && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.countryOfResidence")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.country_of_residence}</span></div>
                  </>
                )}
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.email")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.email}</span></div>
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.phone")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.phone}</span></div>
                {selectedCase.passport_or_id && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.passport")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.passport_or_id}</span></div>
                  </>
                )}
                {selectedCase.address && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.address")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.address}</span></div>
                  </>
                )}
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.destination")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.destination}</span></div>
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.travelDates")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]/80">
                  {formatDate(selectedCase.start_date)} - {formatDate(selectedCase.end_date)}
                </span></div>
                {selectedCase.duration_days && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.durationDays")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.duration_days} {t("createCase.days")}</span></div>
                  </>
                )}
                <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.plan")}:</span></div>
                <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.plan_name}</span></div>
                {selectedCase.product_type && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("createCase.productType")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.product_type}</span></div>
                  </>
                )}
                {selectedCase.plan_country_of_residence && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("plan.countryOfResidence")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.plan_country_of_residence}</span></div>
                  </>
                )}
                {selectedCase.route_type && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("plan.routeType")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.route_type}</span></div>
                  </>
                )}
                {selectedCase.currency && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">Currency:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]/80">{selectedCase.currency}</span></div>
                  </>
                )}
                {user?.role === 'admin' && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.createdBy")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.created_by_name || 'Unknown'}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Plan Pricing and Guarantees Section */}
            {selectedCase.pricingTables && (() => {
              // Calculate price
              let calculatedPrice = 0;
              if (selectedCase.duration_days) {
                const days = selectedCase.duration_days;
                if (selectedCase.pricingTables) {
                  const price = calculatePriceFromPricingTable(selectedCase, days);
                  calculatedPrice = price !== null ? price : 0;
                } else if (selectedCase.flat_price) {
                  calculatedPrice = selectedCase.flat_price * days;
                }
              }

              // Calculate total guarantees amount
              let totalGuarantees = 0;
              if (selectedCase.pricingTables && selectedCase.pricingTables.guarantees) {
                selectedCase.pricingTables.guarantees.forEach((g: any) => {
                  if (g.amount !== null && g.amount !== undefined) {
                    totalGuarantees += g.amount;
                  }
                });
              }

              // Calculate grand total
              const grandTotal = calculatedPrice + totalGuarantees;

              return (
                <div className="border-t border-[#D9D9D9] pt-6 mt-6">
                  <h4 className="text-lg text-left font-semibold text-[#E4590F] mb-4">{t('createCase.reviewPlan')}</h4>
                  
                  {/* Plan Basic Information */}
                  <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal mb-6">
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.plan')}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.plan_name}</span></div>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.productType')}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.product_type}</span></div>
                    {selectedCase.plan_country_of_residence && (
                      <>
                        <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('plan.countryOfResidence')}:</span></div>
                        <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.plan_country_of_residence}</span></div>
                      </>
                    )}
                    {selectedCase.route_type && (
                      <>
                        <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('plan.routeType')}:</span></div>
                        <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.route_type}</span></div>
                      </>
                    )}
                    {selectedCase.currency && (
                      <>
                        <div className="text-left"><span className="font-semibold text-[#2B2B2B]">Currency:</span></div>
                        <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.currency}</span></div>
                      </>
                    )}
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.price')}:</span></div>
                    <div className="text-left"><span className="text-[#E4590F] font-medium">{formatCurrency(calculatedPrice)}</span></div>
                  </div>

                  {/* Guarantee Tables - Only show applicable guarantees (with non-null amounts) */}
                  {selectedCase.pricingTables && selectedCase.pricingTables.guarantees && selectedCase.pricingTables.guarantees.length > 0 && (() => {
                    const applicableGuarantees = selectedCase.pricingTables!.guarantees.filter(
                      (g: any) => g.amount !== null && g.amount !== undefined
                    );
                    if (applicableGuarantees.length === 0) return null;
                    
                    return (
                      <div className="mb-6">
                        <h4 className="text-sm text-left font-semibold text-[#E4590F] uppercase tracking-wide mb-3">{t("plan.guaranteeTables")}</h4>
                        <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
                          {["MEDICAL", "TRAVEL", "JURIDICAL"].map((category) => {
                            // Filter to only show guarantees with non-null amounts
                            const categoryGuarantees = selectedCase.pricingTables!.guarantees.filter(
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
                                      <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{coverageTypeDisplay}:</span></div>
                                      <div className="text-left"><span className="text-[#E4590F] font-medium">{formatCurrency(row.amount)}</span></div>
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
                      <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.price')}:</span></div>
                      <div className="text-left"><span className="text-[#E4590F] font-medium">{formatCurrency(calculatedPrice)}</span></div>
                      {totalGuarantees > 0 && (
                        <>
                          <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("plan.guaranteeTables")} {t('createCase.total')}:</span></div>
                          <div className="text-left"><span className="text-[#E4590F] font-medium">{formatCurrency(totalGuarantees)}</span></div>
                        </>
                      )}
                      <div className="col-span-2 border-t border-[#D9D9D9] pt-2 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.grandTotal')}:</span></div>
                          <div className="text-left"><span className="text-[#E4590F] font-semibold">{formatCurrency(grandTotal)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-[#D9D9D9]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#D9D9D9]/80 text-[#2B2B2B] rounded-xl transition-colors font-medium"
              >
                {t("cases.close")}
              </button>
              {user?.role === 'admin' && selectedCase.status === 'Confirmed' && !selectedCase.sale_id && (
                <>
                  <button
                    onClick={() => handleConfirmSale(selectedCase.id)}
                    disabled={actionLoading === selectedCase.id}
                    className="px-4 py-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white rounded-xl transition-colors disabled:opacity-50 font-medium"
                  >
                    {actionLoading === selectedCase.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      t("cases.confirmSale")
                    )}
                  </button>
                  <button
                    onClick={() => handleCancelCase(selectedCase.id)}
                    disabled={actionLoading === selectedCase.id}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 font-medium"
                  >
                    {actionLoading === selectedCase.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      t("cases.cancelCase")
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesManagement;
