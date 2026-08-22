// Bitaxus Database Types
// Auto-generated types for database entities

// ============================================================================
// ENUMS
// ============================================================================

export enum TenantPlan {
  FREE = "free",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum UserRole {
  ADMIN = "admin",
  OPERATOR = "operator",
  VIEWER = "viewer",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
}

export enum CounterpartyType {
  NATURAL = "Persona natural",
  LEGAL = "Persona jurídica",
}

export enum CounterpartyRelation {
  CLIENT = "Cliente",
  SUPPLIER = "Proveedor",
}

export enum CounterpartyStatus {
  ACTIVE = "Activa",
  INACTIVE = "Inactiva",
}

export enum BankAccountType {
  SAVINGS = "Ahorros",
  CHECKING = "Corriente",
  PROGRAMMABLE_SAVINGS = "Ahorro programado",
}

export enum BankAccountStatus {
  ACTIVE = "Activa",
  INACTIVE = "Inactiva",
  BLOCKED = "Bloqueada",
}

export enum ReceiptStatus {
  PENDING = "Pendiente",
  RECEIVED = "Recibido",
  CANCELED = "Cancelado",
}

export enum PaymentStatus {
  SCHEDULED = "Programado",
  PROCESSED = "Procesado",
  IN_PROGRESS = "En proceso",
  CANCELED = "Cancelado",
  FAILED = "Fallido",
}

export enum PaymentRecurrence {
  ONCE = "once",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUAL = "annual",
}

export enum DispersionStatus {
  SCHEDULED = "Programada",
  PROCESSED = "Procesada",
  IN_PROGRESS = "En proceso",
  CANCELED = "Cancelada",
  FAILED = "Fallida",
}

export enum DispersionItemStatus {
  PENDING = "pending",
  PROCESSED = "processed",
  FAILED = "failed",
}

export enum GlobalOperationType {
  CONVERSION = "conversion",
  INTERNATIONAL_TRANSFER = "international_transfer",
  FX_SPOT = "fx_spot",
}

export enum GlobalOperationStatus {
  PENDING = "Pendiente",
  CONFIRMED = "Confirmado",
  PROCESSED = "Procesado",
  CANCELED = "Cancelado",
}

export enum ActivityAction {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
  APPROVED = "approved",
  REJECTED = "rejected",
  VIEWED = "viewed",
}

export enum NotificationType {
  EMAIL = "email",
  PUSH = "push",
  IN_APP = "in_app",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  READ = "read",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  nit: string;
  email: string;
  city: string;
  country: string;
  phone?: string;
  plan: TenantPlan;
  status: TenantStatus;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  two_factor_enabled: boolean;
  last_login_at?: string;
  last_login_ip?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Counterparty {
  id: string;
  tenant_id: string;
  name: string;
  id_type: string; // CC, NIT, CE, PP
  id_number: string;
  type: CounterpartyType;
  relation: CounterpartyRelation;
  phone: string;
  email: string;
  status: CounterpartyStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  counterparty_id: string;
  tenant_id: string;
  bank_name: string;
  account_type: BankAccountType;
  account_number: string;
  account_holder: string;
  routing_number?: string;
  status: BankAccountStatus;
  is_primary: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  counterparty?: Counterparty;
}

export interface Receipt {
  id: string;
  tenant_id: string;
  receipt_number: string;
  payer_id: string;
  concept: string;
  amount: number;
  currency: string;
  date: string;
  status: ReceiptStatus;
  reference_id?: string;
  notes?: string;
  period_year: number;
  period_month: number;
  created_at: string;
  updated_at: string;

  // Relations
  payer?: Counterparty;
}

export interface Payment {
  id: string;
  tenant_id: string;
  payment_number: string;
  source_account_id: string;
  beneficiary_id: string;
  concept: string;
  amount: number;
  currency: string;
  scheduled_date: string;
  executed_date?: string;
  status: PaymentStatus;
  recurrence: PaymentRecurrence;
  is_recurring: boolean;
  notes?: string;
  period_year: number;
  period_month: number;
  created_at: string;
  updated_at: string;

  // Relations
  source_account?: BankAccount;
  beneficiary?: Counterparty;
}

export interface DispersionItem {
  id: string;
  dispersion_id: string;
  beneficiary_id: string;
  account_id: string;
  amount: number;
  status: DispersionItemStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;

  // Relations
  beneficiary?: Counterparty;
  account?: BankAccount;
}

export interface Dispersion {
  id: string;
  tenant_id: string;
  dispersion_number: string;
  name: string;
  concept: string;
  total_amount: number;
  currency: string;
  source_account_id: string;
  scheduled_date: string;
  executed_date?: string;
  status: DispersionStatus;
  notes?: string;
  period_year: number;
  period_month: number;
  created_at: string;
  updated_at: string;

  // Relations
  source_account?: BankAccount;
  items?: DispersionItem[];
}

export interface GlobalOperation {
  id: string;
  tenant_id: string;
  operation_number: string;
  operation_type: GlobalOperationType;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  exchange_rate: number;
  source_counterparty_id?: string;
  target_counterparty_id?: string;
  status: GlobalOperationStatus;
  scheduled_date: string;
  executed_date?: string;
  created_at: string;
  updated_at: string;

  // Relations
  source_counterparty?: Counterparty;
  target_counterparty?: Counterparty;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  changes: Record<string, any>;
  ip_address?: string;
  created_at: string;

  // Relations
  user?: User;
}

export interface AuditTrail {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: "success" | "failure";
  error_message?: string;
  created_at: string;

  // Relations
  user?: User;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: string;
  status: NotificationStatus;
  related_entity_type?: string;
  related_entity_id?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;

  // Relations
  user?: User;
}

// ============================================================================
// API REQUESTS & RESPONSES
// ============================================================================

export interface CreateReceiptRequest {
  tenantId: string;
  payerId: string;
  concept: string;
  amount: number;
  currency?: string;
  date: string;
  referenceId?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  tenantId: string;
  sourceAccountId: string;
  beneficiaryId: string;
  concept: string;
  amount: number;
  currency?: string;
  scheduledDate: string;
  isRecurring?: boolean;
  recurrence?: PaymentRecurrence;
  notes?: string;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  tenantId: string;
}

export interface CreateDispersionRequest {
  tenantId: string;
  name: string;
  concept: string;
  sourceAccountId: string;
  scheduledDate: string;
  items: DispersionItemInput[];
  notes?: string;
}

export interface DispersionItemInput {
  beneficiaryId: string;
  accountId: string;
  amount: number;
}

export interface DashboardMetricsRequest {
  tenantId: string;
  year: number;
  month: number;
}

export interface DashboardMetrics {
  period: {
    year: number;
    month: number;
  };
  receipts: {
    total_confirmed: number;
    total_pending: number;
    count_confirmed: number;
    count_pending: number;
  };
  payments: {
    total_processed: number;
    total_pending: number;
    count_pending: number;
    count_failed: number;
  };
  balance: number;
  pending_review: {
    payments: Payment[];
    receipts: Receipt[];
    items_count: number;
  };
  recent_dispersions: Dispersion[];
  generated_at: string;
}

// ============================================================================
// DATABASE SCHEMAS (for Supabase)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Tenant, "id" | "created_at" | "updated_at">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "created_at" | "updated_at">>;
      };
      counterparties: {
        Row: Counterparty;
        Insert: Omit<Counterparty, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Counterparty, "id" | "created_at" | "updated_at">>;
      };
      bank_accounts: {
        Row: BankAccount;
        Insert: Omit<BankAccount, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BankAccount, "id" | "created_at" | "updated_at">>;
      };
      receipts: {
        Row: Receipt;
        Insert: Omit<Receipt, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Receipt, "id" | "created_at" | "updated_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Payment, "id" | "created_at" | "updated_at">>;
      };
      dispersions: {
        Row: Dispersion;
        Insert: Omit<Dispersion, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Dispersion, "id" | "created_at" | "updated_at">>;
      };
      dispersion_items: {
        Row: DispersionItem;
        Insert: Omit<DispersionItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DispersionItem, "id" | "created_at" | "updated_at">>;
      };
      global_operations: {
        Row: GlobalOperation;
        Insert: Omit<GlobalOperation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<GlobalOperation, "id" | "created_at" | "updated_at">>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: Partial<Omit<ActivityLog, "id" | "created_at">>;
      };
      audit_trails: {
        Row: AuditTrail;
        Insert: Omit<AuditTrail, "id" | "created_at">;
        Update: Partial<Omit<AuditTrail, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
    };
  };
}
