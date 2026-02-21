export interface User {
  id: string;
  email: string;
}

export interface Certificate {
  id: string;
  filename: string;
  active: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  amount: number;
  description: string;
  serviceCode: string;
  buyerName: string;
  buyerDocument: string;
  buyerEmail?: string | null;
  status: "PROCESSING" | "SUCCESS" | "ERROR";
  protocol?: string | null;
  xmlContent?: string | null;
  errorMessage?: string | null;
  webhookSentAt?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  idempotencyKey?: string | null;
}

export interface SalesResponse {
  data: Sale[];
  total: number;
  page: number;
  limit: number;
}
