# Supabase Edge Functions

Funciones serverless desplegadas en Supabase (Deno/TypeScript).

## Estructura

```
functions/
├── auth/register/           # Crear usuario y tenant
├── receipts/create/         # Crear recaudo con número secuencial
├── payments/create/         # Crear pago con número secuencial
├── payments/process/        # Procesar pago (cambiar estado)
├── dispersions/create/      # Crear dispersión con items
├── dispersions/process/     # Procesar dispersión
└── dashboard/metrics/       # Calcular métricas por período
```

## Endpoints

### POST /auth/register
Registrar nuevo usuario y crear tenant.

**Body:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "tenant_name": "My Company"
}
```

**Response:**
```json
{
  "userData": { ... },
  "tenantData": { ... }
}
```

### POST /receipts/create
Crear nuevo recaudo.

**Body:**
```json
{
  "tenant_id": "uuid",
  "payerId": "uuid",
  "concept": "Concept",
  "amount": 1000,
  "currency": "COP",
  "date": "2026-08-22",
  "referenceId": "optional-ref",
  "notes": "optional notes"
}
```

### POST /payments/create
Crear nuevo pago.

**Body:**
```json
{
  "tenant_id": "uuid",
  "beneficiary_id": "uuid",
  "source_account_id": "uuid",
  "amount": 1000,
  "currency": "COP",
  "concept": "Payment concept",
  "scheduled_date": "2026-08-22"
}
```

### POST /payments/process
Procesar pago (cambiar a "Completado").

**Body:**
```json
{
  "payment_id": "uuid",
  "tenant_id": "uuid"
}
```

### POST /dispersions/create
Crear dispersión con items.

**Body:**
```json
{
  "tenant_id": "uuid",
  "items": [
    { "payment_id": "uuid", "amount": 500 },
    { "payment_id": "uuid", "amount": 500 }
  ],
  "notes": "optional notes"
}
```

### POST /dispersions/process
Procesar dispersión (cambiar a "Completado").

**Body:**
```json
{
  "dispersion_id": "uuid",
  "tenant_id": "uuid"
}
```

### POST /dashboard/metrics
Calcular métricas por período.

**Body:**
```json
{
  "tenant_id": "uuid",
  "period": "month"
}
```

**Periods:** "today", "week", "month", "year"

**Response:**
```json
{
  "totalReceipts": 0,
  "totalReceiptsAmount": 0,
  "totalPayments": 0,
  "totalPaymentsAmount": 0,
  "totalDispersions": 0,
  "totalDispersionsAmount": 0,
  "pendingPayments": 0,
  "completedPayments": 0,
  "canceledPayments": 0,
  "activeCounterparties": 0
}
```

## Deployment

### Local Development
```bash
supabase start
supabase functions serve
```

### Deploy to Production
```bash
supabase functions deploy auth/register
supabase functions deploy receipts/create
supabase functions deploy payments/create
supabase functions deploy payments/process
supabase functions deploy dispersions/create
supabase functions deploy dispersions/process
supabase functions deploy dashboard/metrics
```

## Environment Variables

Functions use:
- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)

These are automatically available in the Edge Function environment.

## Notes

- All functions use RLS (Row Level Security) filtering via tenant_id
- Document numbers are auto-generated (RC-, PA-, DP- prefixes)
- Timestamps use UTC ISO 8601 format
- All amounts are in base currency units (cents for USD, etc.)
