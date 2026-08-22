-- Bitaxus Database Schema - Initial Migration
-- Created: 2026-08-22
-- Description: Complete schema for financial operations dashboard

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema
CREATE SCHEMA IF NOT EXISTS app;
SET search_path TO app, public;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: tenants (Companies - Multi-tenant Core)
CREATE TABLE app.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  nit VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'CO',
  phone VARCHAR(20),
  plan VARCHAR(50) NOT NULL DEFAULT 'business'
    CHECK (plan IN ('free', 'business', 'enterprise')),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{"currency": "COP", "timezone": "America/Bogota", "language": "es"}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_slug ON app.tenants(slug);
CREATE INDEX idx_tenants_status ON app.tenants(status);
CREATE INDEX idx_tenants_created ON app.tenants(created_at DESC);

-- Table: users (Authentication and Roles)
CREATE TABLE app.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'operator'
    CHECK (role IN ('admin', 'operator', 'viewer')),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON app.users(tenant_id);
CREATE INDEX idx_users_email ON app.users(email);
CREATE INDEX idx_users_status ON app.users(status);
CREATE INDEX idx_users_role ON app.users(role);

-- Table: counterparties (Clients/Suppliers)
CREATE TABLE app.counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  id_type VARCHAR(10) NOT NULL
    CHECK (id_type IN ('CC', 'NIT', 'CE', 'PP')),
  id_number VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('Persona natural', 'Persona jurídica')),
  relation VARCHAR(50) NOT NULL
    CHECK (relation IN ('Cliente', 'Proveedor')),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Activa'
    CHECK (status IN ('Activa', 'Inactiva')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, id_type, id_number)
);

CREATE INDEX idx_counterparties_tenant ON app.counterparties(tenant_id);
CREATE INDEX idx_counterparties_relation ON app.counterparties(relation);
CREATE INDEX idx_counterparties_status ON app.counterparties(status);
CREATE INDEX idx_counterparties_search ON app.counterparties
  USING GIN (to_tsvector('spanish', name || ' ' || id_number || ' ' || email));

-- Table: bank_accounts
CREATE TABLE app.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_id UUID NOT NULL REFERENCES app.counterparties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  bank_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL
    CHECK (account_type IN ('Ahorros', 'Corriente', 'Ahorro programado')),
  account_number VARCHAR(50) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  routing_number VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Activa'
    CHECK (status IN ('Activa', 'Inactiva', 'Bloqueada')),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_accounts_counterparty ON app.bank_accounts(counterparty_id);
CREATE INDEX idx_bank_accounts_tenant ON app.bank_accounts(tenant_id);
CREATE INDEX idx_bank_accounts_status ON app.bank_accounts(status);

-- Table: receipts (Income/Collections)
CREATE TABLE app.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) NOT NULL,
  payer_id UUID NOT NULL REFERENCES app.counterparties(id) ON DELETE RESTRICT,
  concept VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pendiente'
    CHECK (status IN ('Pendiente', 'Recibido', 'Cancelado')),
  reference_id VARCHAR(255),
  notes TEXT,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, receipt_number)
);

CREATE INDEX idx_receipts_tenant ON app.receipts(tenant_id);
CREATE INDEX idx_receipts_payer ON app.receipts(payer_id);
CREATE INDEX idx_receipts_status ON app.receipts(status);
CREATE INDEX idx_receipts_date ON app.receipts(date DESC);
CREATE INDEX idx_receipts_period ON app.receipts(period_year, period_month);
CREATE INDEX idx_receipts_created ON app.receipts(created_at DESC);
CREATE INDEX idx_receipts_metrics ON app.receipts(tenant_id, period_year, period_month, status);

-- Table: payments (Individual Payments)
CREATE TABLE app.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  payment_number VARCHAR(50) NOT NULL,
  source_account_id UUID NOT NULL REFERENCES app.bank_accounts(id) ON DELETE RESTRICT,
  beneficiary_id UUID NOT NULL REFERENCES app.counterparties(id) ON DELETE RESTRICT,
  concept VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  scheduled_date DATE NOT NULL,
  executed_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Programado'
    CHECK (status IN ('Programado', 'Procesado', 'En proceso', 'Cancelado', 'Fallido')),
  recurrence VARCHAR(50) NOT NULL DEFAULT 'once'
    CHECK (recurrence IN ('once', 'monthly', 'quarterly', 'annual')),
  is_recurring BOOLEAN DEFAULT FALSE,
  notes TEXT,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant ON app.payments(tenant_id);
CREATE INDEX idx_payments_source_account ON app.payments(source_account_id);
CREATE INDEX idx_payments_beneficiary ON app.payments(beneficiary_id);
CREATE INDEX idx_payments_status ON app.payments(status);
CREATE INDEX idx_payments_date ON app.payments(scheduled_date DESC);
CREATE INDEX idx_payments_recurring ON app.payments(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_payments_metrics ON app.payments(tenant_id, period_year, period_month, status);

-- Table: dispersions (Bulk Payments)
CREATE TABLE app.dispersions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  dispersion_number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  concept VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  source_account_id UUID NOT NULL REFERENCES app.bank_accounts(id) ON DELETE RESTRICT,
  scheduled_date DATE NOT NULL,
  executed_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Programada'
    CHECK (status IN ('Programada', 'Procesada', 'En proceso', 'Cancelada', 'Fallida')),
  notes TEXT,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, dispersion_number)
);

CREATE INDEX idx_dispersions_tenant ON app.dispersions(tenant_id);
CREATE INDEX idx_dispersions_status ON app.dispersions(status);
CREATE INDEX idx_dispersions_date ON app.dispersions(scheduled_date DESC);

-- Table: dispersion_items (Items in Dispersions)
CREATE TABLE app.dispersion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispersion_id UUID NOT NULL REFERENCES app.dispersions(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES app.counterparties(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES app.bank_accounts(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dispersion_items_dispersion ON app.dispersion_items(dispersion_id);
CREATE INDEX idx_dispersion_items_beneficiary ON app.dispersion_items(beneficiary_id);
CREATE INDEX idx_dispersion_items_status ON app.dispersion_items(status);

-- Table: global_operations (FX/International Transfers)
CREATE TABLE app.global_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  operation_number VARCHAR(50) NOT NULL,
  operation_type VARCHAR(50) NOT NULL
    CHECK (operation_type IN ('conversion', 'international_transfer', 'fx_spot')),
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  source_amount DECIMAL(15, 2) NOT NULL CHECK (source_amount > 0),
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  exchange_rate DECIMAL(10, 6) NOT NULL,
  source_counterparty_id UUID REFERENCES app.counterparties(id) ON DELETE SET NULL,
  target_counterparty_id UUID REFERENCES app.counterparties(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Pendiente'
    CHECK (status IN ('Pendiente', 'Confirmado', 'Procesado', 'Cancelado')),
  scheduled_date DATE NOT NULL,
  executed_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, operation_number)
);

CREATE INDEX idx_global_operations_tenant ON app.global_operations(tenant_id);
CREATE INDEX idx_global_operations_status ON app.global_operations(status);

-- Table: activity_logs (Audit Trail)
CREATE TABLE app.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL
    CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected', 'viewed')),
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  old_values JSONB DEFAULT '{}'::jsonb,
  new_values JSONB DEFAULT '{}'::jsonb,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_tenant ON app.activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_user ON app.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON app.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON app.activity_logs(created_at DESC);

-- Table: audit_trails (Security Events)
CREATE TABLE app.audit_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_trails_tenant ON app.audit_trails(tenant_id);
CREATE INDEX idx_audit_trails_user ON app.audit_trails(user_id);
CREATE INDEX idx_audit_trails_action ON app.audit_trails(action);
CREATE INDEX idx_audit_trails_created ON app.audit_trails(created_at DESC);

-- Table: notifications
CREATE TABLE app.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('email', 'push', 'in_app')),
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(255),
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_tenant ON app.notifications(tenant_id);
CREATE INDEX idx_notifications_user ON app.notifications(user_id);
CREATE INDEX idx_notifications_status ON app.notifications(status);
CREATE INDEX idx_notifications_created ON app.notifications(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION app.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Get current tenant
CREATE OR REPLACE FUNCTION app.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(CURRENT_SETTING('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current user role
CREATE OR REPLACE FUNCTION app.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(CURRENT_SETTING('app.user_role', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update timestamps on all tables
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON app.tenants
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON app.users
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_counterparties_updated_at
  BEFORE UPDATE ON app.counterparties
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON app.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_receipts_updated_at
  BEFORE UPDATE ON app.receipts
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON app.payments
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_dispersions_updated_at
  BEFORE UPDATE ON app.dispersions
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_dispersion_items_updated_at
  BEFORE UPDATE ON app.dispersion_items
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON app.notifications
  FOR EACH ROW EXECUTE FUNCTION app.update_timestamp();
