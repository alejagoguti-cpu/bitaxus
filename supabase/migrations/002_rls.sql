-- Bitaxus RLS Policies Migration
-- Created: 2026-08-22
-- Description: Row Level Security policies for multi-tenant security

SET search_path TO app, public;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE app.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.dispersions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.dispersion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.global_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COUNTERPARTIES POLICIES
-- ============================================================================

-- SELECT: Users can view counterparties from their tenant
CREATE POLICY "Users can view counterparties" ON app.counterparties
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

-- INSERT: Only admins and operators can create
CREATE POLICY "Admins and operators can create counterparties" ON app.counterparties
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

-- UPDATE: Only admins and operators can update
CREATE POLICY "Admins and operators can update counterparties" ON app.counterparties
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

-- DELETE: Only admins can delete
CREATE POLICY "Only admins can delete counterparties" ON app.counterparties
  FOR DELETE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

-- ============================================================================
-- BANK ACCOUNTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view bank accounts" ON app.bank_accounts
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

CREATE POLICY "Operators can create bank accounts" ON app.bank_accounts
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

CREATE POLICY "Operators can update bank accounts" ON app.bank_accounts
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

-- ============================================================================
-- RECEIPTS POLICIES
-- ============================================================================

-- SELECT: All users can view receipts
CREATE POLICY "Users can view receipts" ON app.receipts
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

-- INSERT: Admins and operators can create
CREATE POLICY "Operators can create receipts" ON app.receipts
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

-- UPDATE: Only admins and operators while status is Pendiente
CREATE POLICY "Operators can update pending receipts" ON app.receipts
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
    AND status = 'Pendiente'
  );

-- ============================================================================
-- PAYMENTS POLICIES
-- ============================================================================

-- SELECT: All users can view
CREATE POLICY "Users can view payments" ON app.payments
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

-- INSERT: Operators can create
CREATE POLICY "Operators can create payments" ON app.payments
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

-- UPDATE: Admins can approve/process
CREATE POLICY "Admins can approve payments" ON app.payments
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

-- ============================================================================
-- DISPERSIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view dispersions" ON app.dispersions
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

CREATE POLICY "Operators can create dispersions" ON app.dispersions
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

CREATE POLICY "Admins can process dispersions" ON app.dispersions
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

-- ============================================================================
-- DISPERSION ITEMS POLICIES
-- ============================================================================

CREATE POLICY "Users can view dispersion items" ON app.dispersion_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app.dispersions d
      WHERE d.id = dispersion_items.dispersion_id
      AND d.tenant_id = app.get_current_tenant_id()
    )
  );

CREATE POLICY "Operators can create dispersion items" ON app.dispersion_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM app.dispersions d
      WHERE d.id = dispersion_items.dispersion_id
      AND d.tenant_id = app.get_current_tenant_id()
      AND app.get_current_user_role() IN ('admin', 'operator')
    )
  );

-- ============================================================================
-- GLOBAL OPERATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view global operations" ON app.global_operations
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

CREATE POLICY "Operators can create global operations" ON app.global_operations
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() IN ('admin', 'operator')
  );

CREATE POLICY "Admins can process global operations" ON app.global_operations
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

-- ============================================================================
-- ACTIVITY LOGS POLICIES (Append-only)
-- ============================================================================

-- SELECT: Users can see logs from their tenant
CREATE POLICY "Users can view activity logs" ON app.activity_logs
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

-- INSERT: System only (through triggers/functions)
CREATE POLICY "System inserts activity logs" ON app.activity_logs
  FOR INSERT WITH CHECK (true);

-- No UPDATE or DELETE allowed (append-only)

-- ============================================================================
-- AUDIT TRAILS POLICIES (Append-only)
-- ============================================================================

CREATE POLICY "Users can view audit trails" ON app.audit_trails
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

CREATE POLICY "System inserts audit trails" ON app.audit_trails
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own notifications" ON app.notifications
  FOR SELECT USING (
    tenant_id = app.get_current_tenant_id()
    AND user_id = NULLIF(CURRENT_SETTING('app.current_user_id', true), '')::UUID
  );

CREATE POLICY "System sends notifications" ON app.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON app.notifications
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND user_id = NULLIF(CURRENT_SETTING('app.current_user_id', true), '')::UUID
  );

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

CREATE POLICY "Users can view users from their tenant" ON app.users
  FOR SELECT USING (tenant_id = app.get_current_tenant_id());

CREATE POLICY "Admins can create users" ON app.users
  FOR INSERT WITH CHECK (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

CREATE POLICY "Admins can update users" ON app.users
  FOR UPDATE USING (
    tenant_id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their tenant" ON app.tenants
  FOR SELECT USING (id = app.get_current_tenant_id());

CREATE POLICY "Admins can update tenant settings" ON app.tenants
  FOR UPDATE USING (
    id = app.get_current_tenant_id()
    AND app.get_current_user_role() = 'admin'
  );
