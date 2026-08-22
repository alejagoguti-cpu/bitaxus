# Bitaxus - Arquitectura Completa

## 📋 Resumen Ejecutivo

Bitaxus es un dashboard financiero B2B para operaciones de equipos financieros. La arquitectura implementa:

- **Multi-tenant seguro** con Row Level Security
- **Operaciones financieras complejas** (recaudos, pagos, dispersiones, operaciones globales)
- **Auditoría completa** de cambios y eventos de seguridad
- **Edge Functions** para lógica backend serverless
- **Tipos TypeScript** para seguridad en frontend

## 🗄️ Estructura de Base de Datos

### Tablas Principales

1. **tenants** - Empresas (raíz multi-tenant)
2. **users** - Usuarios con roles (admin, operator, viewer)
3. **counterparties** - Clientes y proveedores
4. **bank_accounts** - Cuentas bancarias
5. **receipts** - Recaudos (entradas)
6. **payments** - Pagos individuales
7. **dispersions** - Pagos a múltiples beneficiarios
8. **dispersion_items** - Items de dispersión
9. **global_operations** - Operaciones FX/Transferencias internacionales
10. **activity_logs** - Registro de cambios
11. **audit_trails** - Auditoría de seguridad
12. **notifications** - Notificaciones a usuarios

### Relaciones Clave

```
tenants (root)
  ├── users (1:M)
  ├── counterparties (1:M)
  │   ├── bank_accounts (1:M)
  │   ├── receipts.payer_id (1:M)
  │   ├── payments.beneficiary_id (1:M)
  │   └── dispersion_items.beneficiary_id (1:M)
  ├── receipts (1:M)
  ├── payments (1:M)
  ├── dispersions (1:M)
  │   └── dispersion_items (1:M)
  ├── global_operations (1:M)
  ├── activity_logs (1:M) - Append only
  ├── audit_trails (1:M) - Append only
  └── notifications (1:M)
```

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

- **Viewers** - Solo lectura
- **Operators** - Lectura + Crear operaciones
- **Admins** - Control completo + Aprobaciones

### Políticas de Acceso

```sql
-- Ejemplo: Usuarios solo ven datos de su tenant
SELECT * FROM counterparties WHERE tenant_id = app.get_current_tenant_id()

-- Solo admins pueden aprobar pagos
UPDATE payments SET status = 'Procesado' 
WHERE tenant_id = app.get_current_tenant_id() 
AND app.get_current_user_role() = 'admin'
```

### Auditoría

- **activity_logs** - Registra CREAR, ACTUALIZAR, ELIMINAR
- **audit_trails** - Eventos de seguridad (login, cambios de 2FA, etc)

## 🚀 Edge Functions

### 1. `receipts/create.ts`

Crear recaudos con número secuencial automático.

```typescript
POST /functions/v1/receipts/create
{
  tenantId: "...",
  payerId: "...",
  concept: "Honorarios",
  amount: 1000000,
  currency: "COP",
  date: "2026-08-22"
}
```

### 2. `payments/create.ts`

Crear pagos individuales con validaciones.

```typescript
POST /functions/v1/payments/create
{
  tenantId: "...",
  sourceAccountId: "...",
  beneficiaryId: "...",
  concept: "Factura",
  amount: 500000,
  scheduledDate: "2026-08-25",
  isRecurring: false
}
```

### 3. `payments/process.ts`

Procesar (ejecutar) pagos programados.

```typescript
POST /functions/v1/payments/process
{
  paymentId: "...",
  tenantId: "..."
}
```

### 4. `dispersions/create.ts`

Crear dispersiones con múltiples beneficiarios.

```typescript
POST /functions/v1/dispersions/create
{
  tenantId: "...",
  name: "Comisiones Agosto",
  concept: "Comisiones",
  sourceAccountId: "...",
  scheduledDate: "2026-08-30",
  items: [
    { beneficiaryId: "...", accountId: "...", amount: 100000 },
    { beneficiaryId: "...", accountId: "...", amount: 150000 }
  ]
}
```

### 5. `dashboard/metrics.ts`

Obtener métricas para el dashboard.

```typescript
POST /functions/v1/dashboard/metrics
{
  tenantId: "...",
  year: 2026,
  month: 8
}

Response:
{
  period: { year: 2026, month: 8 },
  receipts: {
    total_confirmed: 5000000,
    total_pending: 2000000,
    count_confirmed: 10,
    count_pending: 3
  },
  payments: {
    total_processed: 3000000,
    total_pending: 1500000,
    count_pending: 5,
    count_failed: 0
  },
  balance: 2000000,
  pending_review: { items_count: 8, ... },
  recent_dispersions: [...]
}
```

## 📊 CRUDs Operacionales

### Contrapartes (Counterparties)

```sql
-- CREATE
INSERT INTO counterparties (...) VALUES (...)
RETURNING *;

-- READ (List)
SELECT * FROM counterparties 
WHERE tenant_id = $1 
  AND (relation = $2 OR $2 = 'Todas')
  AND name ILIKE '%' || $3 || '%'
LIMIT $4 OFFSET $5;

-- UPDATE
UPDATE counterparties SET name = $1, ... WHERE id = $2;

-- DELETE
DELETE FROM counterparties WHERE id = $1;
```

### Recaudos (Receipts)

```sql
-- Dashboard summary
SELECT status, COUNT(*) as count, SUM(amount) as total
FROM receipts
WHERE tenant_id = $1 AND period_year = $2 AND period_month = $3
GROUP BY status;

-- Filtrar por rango de fechas
SELECT * FROM receipts
WHERE tenant_id = $1 AND date BETWEEN $2 AND $3
ORDER BY date DESC;
```

### Pagos (Payments)

```sql
-- Lista pagada con estado
SELECT * FROM payments
WHERE tenant_id = $1 AND status IN ('Programado', 'En proceso')
ORDER BY scheduled_date DESC;

-- Aprobar pago (solo admin)
UPDATE payments 
SET status = 'Procesado', executed_date = CURRENT_DATE
WHERE id = $1 AND status = 'Programado';
```

### Dispersiones (Dispersions)

```sql
-- Crear con validación de total
BEGIN;
INSERT INTO dispersions (...) VALUES (...) RETURNING id;
INSERT INTO dispersion_items (...) 
  SELECT ... FROM json_to_recordset($1);
-- Trigger valida que SUM(items) = total_amount
COMMIT;
```

## 📁 Estructura de Carpetas

```
bitaxus/
├── supabase/
│   ├── migrations/
│   │   ├── 001_init.sql              # Schema inicial
│   │   └── 002_rls.sql               # Políticas RLS
│   └── functions/
│       ├── receipts/
│       │   └── create.ts
│       ├── payments/
│       │   ├── create.ts
│       │   └── process.ts
│       ├── dispersions/
│       │   └── create.ts
│       └── dashboard/
│           └── metrics.ts
├── shared/
│   ├── types.ts                      # Tipos TypeScript
│   └── const.ts
├── client/
│   └── src/
│       └── api/                      # Hooks para llamar Edge Functions
│           ├── receipts.ts
│           ├── payments.ts
│           ├── dispersions.ts
│           └── dashboard.ts
└── ARCHITECTURE.md                   # Esta documentación
```

## 🔄 Flujos de Negocio

### Flujo: Crear y Procesar Recaudo

1. **Usuario (Operator)** crea recaudo
   - POST /functions/v1/receipts/create
   - Receipt se guarda con status "Pendiente"
   - Se registra en activity_logs
   - Se envía notificación

2. **Dashboard** muestra recaudo en "Por revisar"
   - Query: SELECT * FROM receipts WHERE status = 'Pendiente'

3. **Admin** confirma recaudo
   - UPDATE receipts SET status = 'Recibido'
   - Se actualiza activity_logs

### Flujo: Programar y Procesar Pago

1. **Operator** programa pago
   - POST /functions/v1/payments/create
   - Payment se guarda con status "Programado"

2. **Admin** revisa pago en dashboard
   - Dashboard.metrics() muestra "Pagos por procesar"

3. **Admin** aprueba pago
   - POST /functions/v1/payments/process
   - Status cambia a "Procesado"
   - Se actualiza executed_date
   - Se envía notificación

4. **Sistema** (en prod) ejecuta transferencia bancaria
   - Edge Function llamaría a API de banco

### Flujo: Crear Dispersión

1. **Operator** crea dispersión con múltiples beneficiarios
   - POST /functions/v1/dispersions/create
   - Se valida que SUM(items) = total_amount
   - Se guardan dispersión + items

2. **Admin** procesa dispersión
   - UPDATE dispersions SET status = 'Procesada'
   - Edge Function ejecuta todas las transferencias

3. **Sistema** actualiza estado de cada item
   - dispersion_items.status: pending → processed/failed

## 📈 Índices para Performance

```sql
-- Dashboards (metrics queries)
CREATE INDEX idx_receipts_metrics 
  ON receipts(tenant_id, period_year, period_month, status);

CREATE INDEX idx_payments_metrics 
  ON payments(tenant_id, period_year, period_month, status);

-- Búsquedas
CREATE INDEX idx_counterparties_tsvector 
  ON counterparties USING GIN(to_tsvector('spanish', name || ' ' || id_number));

-- Filtros frecuentes
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_receipts_status ON receipts(status);

-- Ordenamiento
CREATE INDEX idx_receipts_date ON receipts(date DESC);
CREATE INDEX idx_payments_scheduled_date ON payments(scheduled_date DESC);
```

## 🛠️ Cómo Usar en Frontend

### 1. Importar tipos

```typescript
import { 
  Receipt, 
  Payment, 
  Dispersion,
  CreateReceiptRequest,
  DashboardMetrics
} from "@/shared/types";
```

### 2. Crear cliente Supabase

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types";

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 3. Llamar Edge Functions

```typescript
// Crear recaudo
const response = await fetch(
  `${supabaseUrl}/functions/v1/receipts/create`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tenantId: tenant.id,
      payerId: payer.id,
      concept: "Honorarios",
      amount: 1000000,
      date: new Date().toISOString().split("T")[0]
    })
  }
);

const receipt: Receipt = await response.json();
```

### 4. Consultar base de datos con RLS

```typescript
// Automáticamente filtra por tenant_id del usuario
const { data: payments } = await supabase
  .from("payments")
  .select("*, beneficiary:counterparties(*)")
  .eq("status", PaymentStatus.SCHEDULED)
  .order("scheduled_date", { ascending: true });

// Solo devuelve pagos del tenant actual
```

### 5. Obtener métricas del dashboard

```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/dashboard/metrics`,
  {
    method: "POST",
    headers: { "Authorization": `Bearer ${session.access_token}` },
    body: JSON.stringify({
      tenantId: tenant.id,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1
    })
  }
);

const metrics: DashboardMetrics = await response.json();
```

## 🚀 Próximos Pasos

### Fase 1: Implementar (HECHO)
- [x] Schema SQL
- [x] Políticas RLS
- [x] Edge Functions
- [x] Tipos TypeScript

### Fase 2: Conectar Frontend
- [ ] Hooks para cada entidad (useReceipts, usePayments, etc)
- [ ] Componentes React para CRUDs
- [ ] Dashboard con métricas en tiempo real
- [ ] Formularios con validación

### Fase 3: Integración Bancaria
- [ ] API de banco para procesar pagos
- [ ] Webhooks para confirmaciones
- [ ] Reconciliación automática

### Fase 4: Reportes y Analytics
- [ ] Exportar a PDF/Excel
- [ ] Gráficos de cash flow
- [ ] Análisis de tendencias

## 📚 Referencias

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Bitaxus Design Guide](./ideas.md)

## ⚙️ Variables de Entorno

```env
VITE_SUPABASE_URL=https://hduqkztwwvbgmttlmsle.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📞 Soporte

Para preguntas sobre la arquitectura:
1. Revisar esta documentación
2. Consultar queries en `supabase/migrations/`
3. Revisar tipos en `shared/types.ts`
