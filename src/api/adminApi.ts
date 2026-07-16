import { apiGet, apiPatch, API_BASE_URL } from "../lib/api";

export const getAdminDashboardApi = async () => {
  const res = await apiGet("/admin/dashboard");
  return (res as any).data; // <-- return the .data property
};

export const getProductionTrendApi = async () => {
  const res = await apiGet("/admin/production-trend");
  return (res as any).data;
};

export const getAdminProfileApi = async () => {
  const res = await apiGet("/admin/profile");
  return (res as any).data;
};

export const updateAdminProfileApi = async (name: string) => {
  try {
    const response = await apiPatch<{ success: boolean; message: string }>("/admin/profile", { name });
    console.log("Admin API Response:", response); // Debug log
    return response;
  } catch (error) {
    console.error("Admin API Error:", error); // Debug log
    throw error;
  }
};

export const changeAdminPasswordApi = async (currentPassword: string, newPassword: string) => {
  return apiPatch<{ success: boolean; message: string }>("/admin/change-password", { 
    currentPassword, 
    newPassword 
  });
};

export type AgentHierarchyRow = {
  hierarchyRole: "supervisor" | "agent" | "sub_agent";
  id: number;
  name: string;
  email: string;
  status: string;
  forcePasswordChange: boolean;
  lastLogin: string | null;
  createdAt: string | null;
  companyName: string | null;
  partnershipType: string | null;
  countryOfResidence: string | null;
  iataNumber: string | null;
  geographicalLocation: string | null;
  workPhone: string | null;
  whatsappPhone: string | null;
  assignedPlanIds: number[];
  supervisor: {
    id: number | null;
    name: string | null;
    email: string | null;
    companyName: string | null;
    partnershipType: string | null;
    countryOfResidence: string | null;
    iataNumber: string | null;
    geographicalLocation: string | null;
    workPhone: string | null;
    whatsappPhone: string | null;
  };
  agent: {
    id: number;
    name: string | null;
    email: string | null;
    companyName: string | null;
    partnershipType: string | null;
    countryOfResidence: string | null;
    iataNumber: string | null;
    geographicalLocation: string | null;
    workPhone: string | null;
    whatsappPhone: string | null;
  } | null;
};

export type AgentHierarchyApiResponse = {
  success: boolean;
  data: {
    rows: AgentHierarchyRow[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

export const getAgentHierarchyApi = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  return apiGet<AgentHierarchyApiResponse>(`/admin/agent-hierarchy?${qs.toString()}`);
};

/** Full URL for CSV export (use with fetch + Bearer token). */
export const getAgentHierarchyExportUrl = (params: { search?: string; status?: string }) => {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  const q = qs.toString();
  return `${API_BASE_URL}/admin/agent-hierarchy/export${q ? `?${q}` : ""}`;
};

/** One partner (top-level agency / supervisor) for the partners-by-type view. */
export type PartnerRow = {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string | null;
  last_login: string | null;
  company_name: string | null;
  partnership_type: string | null;
  country_of_residence: string | null;
  iata_number: string | null;
  geographical_location: string | null;
  work_phone: string | null;
  whatsapp_phone: string | null;
  /** Agent + sub-agent logins under this partner. */
  account_count: number;
  /** Direct child agents only. */
  direct_agent_count: number;
  /** Cases created by the partner or any descendant account. */
  total_cases: number;
};

export type PartnerTypeSummary = {
  partnership_type: string;
  partner_count: number;
};

export type PartnersApiResponse = {
  success: boolean;
  data: {
    partners: PartnerRow[];
    typeSummary: PartnerTypeSummary[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

/** Superadmin: list partners once by type (ignores which agent login is used day-to-day). */
export const getPartnersApi = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  partnership_type?: string;
}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.partnership_type) qs.set("partnership_type", params.partnership_type);
  return apiGet<PartnersApiResponse>(`/admin/partners?${qs.toString()}`);
};