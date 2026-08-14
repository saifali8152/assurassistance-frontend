import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { getAllCasesApi, getMyCasesWithPaginationApi, cancelCaseApi, deleteCaseApi, generateInvoiceApi, type CaseListFilters } from '../api/caseApi';
import {
  createSaleApi,
  softDeleteSaleApi,
  POLICY_DELETION_REASONS,
  type PolicyDeletionReason,
} from '../api/salesApi';
import { ChevronLeft, ChevronRight, Download, CheckCircle, XCircle, Eye, Calendar, Phone, MapPin, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
  computeTravelPlanPremium,
  getLegacyPricingTablePremium,
  roundMoney,
  AGE_EXEMPTION_MESSAGE,
} from '../utils/travelPricing';

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
  sale_deleted_at?: string | null;
  sale_deletion_reason?: string | null;
  invoice_generated?: boolean;
  certificate_generated?: boolean;
  created_by_name?: string;
  fixed_duration_premiums?: boolean;
}

const CasesManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; caseItem: Case | null }>({
    open: false,
    caseItem: null,
  });
  const [deletionReason, setDeletionReason] = useState<PolicyDeletionReason | "">("");
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 25;

  // Age-aware premium from live plan catalogue (same rules for all packages)
  const calculatePlanPrice = (caseItem: Case): number => {
    if (caseItem.sale_deleted_at) return 0;
    if (!caseItem.duration_days) return 0;
    const days = caseItem.duration_days;
    const travelLike = ["Travel", "Travel Inbound", "Road travel"].includes(caseItem.product_type);

    if (travelLike && caseItem.pricingTables?.pricing?.length) {
      const comp = computeTravelPlanPremium(
        caseItem.pricingTables,
        days,
        caseItem.date_of_birth,
        { fixedDurationPremiums: !!caseItem.fixed_duration_premiums }
      );
      if (comp.planPremium != null) return comp.planPremium;
      return 0;
    }

    if (caseItem.pricingTables?.pricing?.length) {
      const legacy = getLegacyPricingTablePremium(caseItem.pricingTables, days);
      if (legacy != null) return legacy;
    }

    if (caseItem.flat_price) {
      return roundMoney(caseItem.flat_price * days);
    }

    return 0;
  };

  const mapCaseRows = (raw: any[]): Case[] =>
    raw.map((caseItem: any) => {
      let pricingTables: PricingTables | undefined;
      if (caseItem.pricing_rules) {
        try {
          pricingTables =
            typeof caseItem.pricing_rules === 'string'
              ? JSON.parse(caseItem.pricing_rules)
              : caseItem.pricing_rules;
        } catch (e) {
          console.error('Failed to parse pricing_rules:', e);
        }
      }
      return {
        ...caseItem,
        pricingTables,
        fixed_duration_premiums: !!(
          caseItem.fixed_duration_premiums ??
          caseItem.plan_fixed_duration_premiums
        ),
      };
    });

  const fetchCases = async (
    page: number = 1,
    search: string = '',
    status: string = '',
    start: string = '',
    end: string = ''
  ) => {
    try {
      setLoading(true);
      const isPrivileged = user?.role === 'admin' || user?.role === 'sub_admin';
      const filters: CaseListFilters = {
        page,
        limit: itemsPerPage,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(start ? { startDate: start } : {}),
        ...(end ? { endDate: end } : {}),
      };
      const response = isPrivileged
        ? await getAllCasesApi(filters)
        : await getMyCasesWithPaginationApi(filters);
      const data = response as {
        cases?: any[];
        totalCases?: number;
        totalPages?: number;
      };
      setCases(mapCaseRows(data.cases || []));
      setTotalCases(Number(data.totalCases) || 0);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      toast.error(t('cases.loadFailed', 'Failed to load cases'));
    } finally {
      setLoading(false);
    }
  };

  const runSearch = (page: number = 1) => {
    setCurrentPage(page);
    fetchCases(page, searchTerm, statusFilter, startDate, endDate);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchCases(1, '', '', '', '');
  };

  const refreshList = () =>
    fetchCases(currentPage, searchTerm, statusFilter, startDate, endDate);

  // Debounced search — reset to page 1 when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchCases(1, searchTerm, statusFilter, startDate, endDate);
    }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchCases(currentPage, searchTerm, statusFilter, startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleConfirmSale = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      const caseItem = cases.find(c => c.id === caseId);
      if (caseItem) {
        const premiumAmount = calculatePlanPrice(caseItem);
        if (!premiumAmount) {
          const travelLike = ["Travel", "Travel Inbound", "Road travel"].includes(caseItem.product_type);
          if (travelLike && caseItem.date_of_birth && caseItem.pricingTables) {
            const comp = computeTravelPlanPremium(
              caseItem.pricingTables,
              caseItem.duration_days || 1,
              caseItem.date_of_birth,
              { fixedDurationPremiums: !!caseItem.fixed_duration_premiums }
            );
            if (comp.error === "age_ineligible") {
              toast.error(t("createCase.ageExemption", AGE_EXEMPTION_MESSAGE));
              setActionLoading(null);
              return;
            }
          }
          toast.error("No matching price found in pricing table for this duration!");
          setActionLoading(null);
          return;
        }

        const guaranteesDetails: any[] = [];
        if (caseItem.pricingTables && caseItem.pricingTables.guarantees) {
          caseItem.pricingTables.guarantees.forEach((g: any) => {
            if (g.amount !== null && g.amount !== undefined) {
              guaranteesDetails.push({
                category: g.category,
                coverageType: g.coverageType,
                amount: g.amount
              });
            }
          });
        }

        const tax = 0;
        const payload = {
          case_id: caseId,
          premium_amount: premiumAmount,
          tax: tax,
          total: premiumAmount + tax,
          currency: caseItem.currency || 'XOF',
          plan_price: premiumAmount,
          guarantees_total: 0,
          guarantees_details: guaranteesDetails.length > 0 ? guaranteesDetails : undefined,
        };
        const res = await createSaleApi(payload);
        if (res?.saleId) {
          toast.success('Sale confirmed successfully');
        } else {
          toast.error('Failed to confirm sale');
        }
      }
      await refreshList();
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
      await refreshList();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to cancel case:', error);
      toast.error('Failed to cancel case');
    } finally {
      setActionLoading(null);
    }
  };

  const reasonLabel = (r: string) => {
    if (r === "Test policy") return t("ledger.reason.test", "Test policy");
    if (r === "Customer desistement") return t("ledger.reason.desistement", "Customer desistement");
    if (r === "Error or duplicate") return t("ledger.reason.duplicate", "Error or duplicate");
    if (r === "Cancellation before reversal")
      return t("ledger.reason.cancellation", "Cancellation before reversal");
    return r;
  };

  /** Open soft-delete reason modal for a confirmed policy; hard-delete drafts without a sale. */
  const handleDeleteCase = async (caseItem: Case) => {
    if (caseItem.sale_deleted_at) {
      toast.error(t("cases.alreadyDeleted", "This policy is already deleted."));
      return;
    }

    if (caseItem.sale_id) {
      setDeletionReason("");
      setDeleteModal({ open: true, caseItem });
      return;
    }

    const label = caseItem.full_name || `#${caseItem.id}`;
    const confirmed = window.confirm(
      t(
        "cases.deleteDraftConfirm",
        "Permanently delete draft case #{{id}} ({{name}})? This cannot be undone.",
        { id: caseItem.id, name: label }
      )
    );
    if (!confirmed) return;

    try {
      setActionLoading(caseItem.id);
      await deleteCaseApi(caseItem.id);
      toast.success(t("cases.deleteSuccess", "Case deleted successfully"));
      await refreshList();
      setShowModal(false);
    } catch (error: any) {
      console.error("Failed to delete case:", error);
      toast.error(
        error?.response?.data?.message ||
          t("cases.deleteFailed", "Failed to delete case")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmSoftDeletePolicy = async () => {
    const caseItem = deleteModal.caseItem;
    if (!caseItem?.sale_id || !deletionReason) {
      toast.error(t("ledger.deleteReasonRequired", "Select a deletion reason"));
      return;
    }
    try {
      setIsDeleting(true);
      setActionLoading(caseItem.id);
      await softDeleteSaleApi(caseItem.sale_id, deletionReason);
      toast.success(
        t(
          "ledger.deleteSuccess",
          "Policy deleted. It remains visible with premium and commission at 0."
        )
      );
      setDeleteModal({ open: false, caseItem: null });
      setDeletionReason("");
      setShowModal(false);
      await refreshList();
    } catch (error: any) {
      console.error("Failed to soft-delete policy:", error);
      toast.error(
        error?.response?.data?.message ||
          t("ledger.deleteFailed", "Could not delete policy")
      );
    } finally {
      setIsDeleting(false);
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

  const isPrivileged = user?.role === 'admin' || user?.role === 'sub_admin';
  const casesBasePath = isPrivileged ? '/admin' : '/user';

  const goEditCase = (caseItem: Case) => {
    if (caseItem.status === 'Cancelled') return;
    const qs = new URLSearchParams();
    qs.set('editCase', String(caseItem.id));
    if (caseItem.sale_id) qs.set('policyEdit', '1');
    navigate(`${casesBasePath}/createCase?${qs.toString()}`);
  };

  const openModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-500/10 text-green-600 border border-green-500/20';
      case 'Draft': return 'bg-amber-500/10 text-amber-700 border border-amber-500/20';
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
            {(user?.role === 'admin' || user?.role === 'sub_admin') ? t("cases.allCases") : t("cases.myCases")}
          </h2>
          
          {/* Search and Filter Controls — server-side (Ledger theme) */}
          <div className="flex flex-col lg:flex-row flex-wrap gap-3 w-full lg:w-auto lg:max-w-4xl lg:justify-end">
            <input
              type="text"
              placeholder={t("cases.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 min-w-[12rem] flex-1 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            >
              <option value="">{t("cases.allStatus")}</option>
              <option value="Draft">{t("cases.statusDraft", "Draft")}</option>
              <option value="Confirmed">{t("cases.statusConfirmed")}</option>
              <option value="Cancelled">{t("cases.statusCancelled")}</option>
            </select>
            <input
              type="date"
              aria-label={t("cases.startDate", "Start date")}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <input
              type="date"
              aria-label={t("cases.endDate", "End date")}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] focus:outline-none focus:ring-2 focus:ring-[#E4590F] font-normal"
            />
            <button
              type="button"
              onClick={() => runSearch(1)}
              className="px-4 py-2 bg-[#E4590F] hover:bg-[#C94A0D] text-white rounded-xl transition-colors font-medium"
            >
              {t("cases.searchButton", "Search")}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
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
                  : user?.role === 'sub_admin'
                    ? t("cases.noCasesSubAdmin", "No cases in your assigned agencies.")
                    : t("cases.noCasesAgent")}
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
                    {isPrivileged && (
                      <th className="text-center text-[#2B2B2B]/70 font-medium py-4 px-2 hidden md:table-cell">{t("cases.createdBy")}</th>
                    )}
                    <th className="text-left text-[#2B2B2B]/70 font-medium py-4 px-2">{t("cases.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((caseItem) => {
                    const deleted = !!caseItem.sale_deleted_at;
                    return (
                    <tr
                      key={caseItem.id}
                      className={`border-b border-[#D9D9D9] transition-colors ${
                        deleted
                          ? "bg-gray-100/90 text-gray-400"
                          : "hover:bg-[#D9D9D9]/30"
                      }`}
                    >
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
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            deleted
                              ? "bg-gray-200 text-gray-500 border border-gray-300"
                              : getStatusColor(caseItem.status)
                          }`}>
                            {caseItem.status}
                          </span>
                        </div>
                        {caseItem.sale_id ? (
                          <div
                            className={`text-xs mt-1 text-center ${
                              caseItem.sale_deleted_at ? "text-gray-400" : "text-green-600"
                            }`}
                          >
                            Sale #{caseItem.sale_id}
                            {caseItem.sale_deleted_at ? (
                              <span className="block uppercase text-[10px] tracking-wide text-gray-500 mt-0.5">
                                {t("ledger.deletedBadge", "Deleted")}
                                {caseItem.sale_deletion_reason
                                  ? ` · ${reasonLabel(caseItem.sale_deletion_reason)}`
                                  : ""}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-xs text-red-600 mt-1 text-center">
                            No sale
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              caseItem.sale_deleted_at ? "text-gray-400" : "text-[#E4590F]"
                            }`}
                          >
                            {formatCurrency(calculatePlanPrice(caseItem))}
                          </div>
                        </div>
                      </td>
                      {isPrivileged && (
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
                          {caseItem.status !== 'Cancelled' && !caseItem.sale_deleted_at && (
                            <button
                              type="button"
                              onClick={() => goEditCase(caseItem)}
                              className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/25 transition-colors"
                              title={t("cases.modifyCase", "Open case to view or modify")}
                            >
                              <span className="text-base leading-none" aria-hidden>
                                ✏️
                              </span>
                            </button>
                          )}
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

                          {user?.role === 'admin' && !caseItem.sale_deleted_at && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCase(caseItem)}
                              disabled={actionLoading === caseItem.id}
                              className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-700 hover:text-red-800 transition-colors disabled:opacity-50 border border-red-600/25"
                              title={
                                caseItem.sale_id
                                  ? t("ledger.deletePolicy", "Delete policy")
                                  : t("cases.deleteCase", "Delete case")
                              }
                            >
                              {actionLoading === caseItem.id ? (
                                <div className="w-4 h-4 border-2 border-red-700/30 border-t-red-700 rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination — server totals, sliding page window */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
                <div className="text-[#2B2B2B]/70 text-sm font-normal">
                  {t("cases.showing")}{' '}
                  <span className="font-medium text-[#2B2B2B]">
                    {totalCases === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  {t("cases.to")}{' '}
                  <span className="font-medium text-[#2B2B2B]">
                    {totalCases === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalCases)}
                  </span>{' '}
                  {t("cases.of")}{' '}
                  <span className="font-medium text-[#2B2B2B]">{totalCases}</span>{' '}
                  {t("cases.results")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || totalCases === 0}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {(() => {
                    const window = 5;
                    const start = Math.max(
                      1,
                      Math.min(
                        totalPages - window + 1,
                        currentPage - Math.floor(window / 2)
                      )
                    );
                    const end = Math.min(totalPages, start + window - 1);
                    const pages: number[] = [];
                    for (let p = start; p <= end; p++) pages.push(p);
                    return pages.map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-[#E4590F] text-white'
                            : 'bg-[#D9D9D9] text-[#2B2B2B] hover:bg-[#B8B8B8]'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalCases === 0}
                    className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] border border-[#D9D9D9] rounded-xl text-[#2B2B2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedCase.sale_deleted_at
                      ? "bg-gray-200 text-gray-500 border border-gray-300"
                      : getStatusColor(selectedCase.status)
                  }`}>
                    {selectedCase.status}
                  </span>
                  {selectedCase.sale_deleted_at && (
                    <div className="mt-1 text-xs text-gray-500 uppercase tracking-wide">
                      {t("ledger.deletedBadge", "Deleted")}
                      {selectedCase.sale_deletion_reason
                        ? ` · ${reasonLabel(selectedCase.sale_deletion_reason)}`
                        : ""}
                    </div>
                  )}
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
                {isPrivileged && (
                  <>
                    <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t("cases.createdBy")}:</span></div>
                    <div className="text-left"><span className="text-[#2B2B2B]">{selectedCase.created_by_name || 'Unknown'}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Plan Pricing and Guarantees Section */}
            {selectedCase.pricingTables && (() => {
              const calculatedPrice = calculatePlanPrice(selectedCase);

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

                  {/* Guarantee Tables — individual benefit limits only (no coverage total) */}
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

                  {/* Premium only — no coverage-amount “grand total” */}
                  <div className="border-t border-[#D9D9D9] pt-4 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-[#2B2B2B] font-normal">
                      <div className="text-left"><span className="font-semibold text-[#2B2B2B]">{t('createCase.premiumDue', "Premium due")}:</span></div>
                      <div className="text-left"><span className="text-[#E4590F] font-semibold">{formatCurrency(calculatedPrice)}</span></div>
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
              {user?.role === 'admin' && !selectedCase.sale_deleted_at && (
                <button
                  type="button"
                  onClick={() => handleDeleteCase(selectedCase)}
                  disabled={actionLoading === selectedCase.id}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl transition-colors disabled:opacity-50 font-medium inline-flex items-center gap-2"
                >
                  {actionLoading === selectedCase.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {selectedCase.sale_id
                        ? t("ledger.deletePolicy", "Delete policy")
                        : t("cases.deleteCase", "Delete case")}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteModal.open && deleteModal.caseItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#E4590F] text-xl font-semibold">
                {t("ledger.deletePolicy", "Delete policy")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDeleteModal({ open: false, caseItem: null });
                  setDeletionReason("");
                }}
                className="p-2 rounded-lg bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#2B2B2B]/80 mb-2">
              Case #{deleteModal.caseItem.id}
              {deleteModal.caseItem.sale_id
                ? ` · Sale #${deleteModal.caseItem.sale_id}`
                : ""}
              {deleteModal.caseItem.full_name
                ? ` · ${deleteModal.caseItem.full_name}`
                : ""}
            </p>
            <p className="text-sm text-[#2B2B2B]/60 mb-4">
              {t(
                "ledger.deleteHelp",
                "The policy stays visible (gray) with premium and commission set to 0 FCFA. Choose a reason:"
              )}
            </p>
            <label className="block text-xs font-medium text-[#2B2B2B]/70 mb-1">
              {t("ledger.deleteReason", "Reason")} *
            </label>
            <select
              value={deletionReason}
              onChange={(e) =>
                setDeletionReason(e.target.value as PolicyDeletionReason | "")
              }
              className="w-full rounded-xl border border-[#D9D9D9] px-3 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-[#E4590F]"
            >
              <option value="">
                {t("ledger.deleteReasonPlaceholder", "Select a reason…")}
              </option>
              {POLICY_DELETION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {reasonLabel(r)}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModal({ open: false, caseItem: null });
                  setDeletionReason("");
                }}
                className="px-4 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium"
              >
                {t("ledger.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmSoftDeletePolicy}
                disabled={isDeleting || !deletionReason}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {isDeleting
                  ? t("ledger.deleting", "Deleting…")
                  : t("ledger.confirmDelete", "Delete policy")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesManagement;
