// src/api/interfaces.ts
export interface LoginRequest {
    email: string;
    password: string;
  }
  
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "agent";
    force_password_change?: boolean;
  };
}

export interface ChangePasswordResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "agent";
    force_password_change?: boolean;
  };
}
  export interface CreateCaseResponse {
  message: string;
  caseId: number;
  }
export interface CreateSaleRequest {
  case_id: number;
  premium_amount: number;
  tax?: number;
  total: number;
  currency?: string;
  plan_price?: number;
  guarantees_total?: number;
  guarantees_details?: any[];
}

export interface CreateSaleResponse {
  message: string;
  saleId: number;
  policyNumber: string;
  certificateNumber: string;
}

export interface GenerateInvoiceRequest {
  saleId: number;
}

export interface GenerateCertificateRequest {
  saleId: number;
  productType: "Travel" | "Bank" | "Health Evacuation" | "Travel Inbound";
}

export interface GenerateInvoiceResponse {
  url: string;
}

export interface GenerateCertificateResponse {
  url: string;
}

export interface DownloadResponse {
  url: string;
  pdfUrl: string;
}
