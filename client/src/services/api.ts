/**
 * API Service - Edge Functions Client
 * Centralized API calls to Supabase Edge Functions
 */

import axios, { AxiosInstance } from "axios";
import {
  CreateReceiptRequest,
  CreatePaymentRequest,
  ProcessPaymentRequest,
  CreateDispersionRequest,
  DashboardMetricsRequest,
  DashboardMetrics,
  Receipt,
  Payment,
  Dispersion,
} from "@/shared/types";

interface ApiConfig {
  supabaseUrl: string;
  supabaseKey: string;
  accessToken?: string;
}

export class BitaxusAPI {
  private client: AxiosInstance;
  private supabaseUrl: string;

  constructor(config: ApiConfig) {
    this.supabaseUrl = config.supabaseUrl;

    this.client = axios.create({
      baseURL: `${config.supabaseUrl}/functions/v1`,
      headers: {
        "Content-Type": "application/json",
        ...(config.accessToken && {
          Authorization: `Bearer ${config.accessToken}`,
        }),
      },
    });
  }

  /**
   * Update authorization token
   */
  setAccessToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // ============================================================================
  // RECEIPTS (Recaudos)
  // ============================================================================

  /**
   * Create a new receipt
   */
  async createReceipt(data: CreateReceiptRequest): Promise<Receipt> {
    try {
      const response = await this.client.post<Receipt>("/receipts/create", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error creating receipt");
    }
  }

  /**
   * Get receipts for a tenant with filters
   */
  async getReceipts(
    tenantId: string,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Receipt[]; total: number }> {
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { start_date: filters.startDate }),
        ...(filters?.endDate && { end_date: filters.endDate }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await this.client.get<{
        data: Receipt[];
        total: number;
      }>("/receipts/list", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching receipts");
    }
  }

  /**
   * Get receipt by ID
   */
  async getReceipt(receiptId: string): Promise<Receipt> {
    try {
      const response = await this.client.get<Receipt>(
        `/receipts/${receiptId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching receipt");
    }
  }

  /**
   * Update receipt
   */
  async updateReceipt(
    receiptId: string,
    data: Partial<Receipt>
  ): Promise<Receipt> {
    try {
      const response = await this.client.put<Receipt>(
        `/receipts/${receiptId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error updating receipt");
    }
  }

  // ============================================================================
  // PAYMENTS (Pagos)
  // ============================================================================

  /**
   * Create a new payment
   */
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    try {
      const response = await this.client.post<Payment>("/payments/create", data);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error creating payment");
    }
  }

  /**
   * Process (execute) a payment
   */
  async processPayment(data: ProcessPaymentRequest): Promise<Payment> {
    try {
      const response = await this.client.post<Payment>(
        "/payments/process",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error processing payment");
    }
  }

  /**
   * Get payments for a tenant
   */
  async getPayments(
    tenantId: string,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Payment[]; total: number }> {
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { start_date: filters.startDate }),
        ...(filters?.endDate && { end_date: filters.endDate }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await this.client.get<{
        data: Payment[];
        total: number;
      }>("/payments/list", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching payments");
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const response = await this.client.get<Payment>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching payment");
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<Payment> {
    try {
      const response = await this.client.post<Payment>(
        `/payments/${paymentId}/cancel`,
        {}
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error canceling payment");
    }
  }

  // ============================================================================
  // DISPERSIONS (Dispersiones)
  // ============================================================================

  /**
   * Create a new dispersion with items
   */
  async createDispersion(data: CreateDispersionRequest): Promise<Dispersion> {
    try {
      const response = await this.client.post<Dispersion>(
        "/dispersions/create",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error creating dispersion");
    }
  }

  /**
   * Get dispersions for a tenant
   */
  async getDispersions(
    tenantId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Dispersion[]; total: number }> {
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.page && { page: String(filters.page) }),
        ...(filters?.limit && { limit: String(filters.limit) }),
      });

      const response = await this.client.get<{
        data: Dispersion[];
        total: number;
      }>("/dispersions/list", { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching dispersions");
    }
  }

  /**
   * Get dispersion by ID with items
   */
  async getDispersion(dispersionId: string): Promise<Dispersion> {
    try {
      const response = await this.client.get<Dispersion>(
        `/dispersions/${dispersionId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching dispersion");
    }
  }

  /**
   * Process a dispersion
   */
  async processDispersion(dispersionId: string): Promise<Dispersion> {
    try {
      const response = await this.client.post<Dispersion>(
        `/dispersions/${dispersionId}/process`,
        {}
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error processing dispersion");
    }
  }

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  /**
   * Get dashboard metrics for a period
   */
  async getDashboardMetrics(
    data: DashboardMetricsRequest
  ): Promise<DashboardMetrics> {
    try {
      const response = await this.client.post<DashboardMetrics>(
        "/dashboard/metrics",
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Error fetching dashboard metrics");
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message;
      throw new Error(`${defaultMessage}: ${message}`);
    }

    if (error instanceof Error) {
      throw new Error(`${defaultMessage}: ${error.message}`);
    }

    throw new Error(defaultMessage);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let apiInstance: BitaxusAPI | null = null;

export function initializeAPI(config: ApiConfig): BitaxusAPI {
  apiInstance = new BitaxusAPI(config);
  return apiInstance;
}

export function getAPI(): BitaxusAPI {
  if (!apiInstance) {
    throw new Error(
      "API not initialized. Call initializeAPI() first in your app setup."
    );
  }
  return apiInstance;
}

export default BitaxusAPI;
