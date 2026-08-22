# Bitaxus Frontend - Setup y Guía

## 🚀 Fase 2: Frontend Integration

Este documento describe cómo usar los hooks, servicios y esquemas de validación creados.

### 📦 Estructura

```
client/src/
├── services/
│   └── api.ts              # Cliente API para Edge Functions
├── hooks/
│   ├── useReceipts.ts      # Hooks para recaudos
│   ├── usePayments.ts      # Hooks para pagos
│   ├── useDashboard.ts     # Hooks para dashboard
│   └── index.ts            # Exportaciones
├── schemas/
│   └── forms.ts            # Validaciones con Zod
├── lib/
│   └── formatting.ts       # Utilidades de formato
└── components/
    ├── forms/              # Componentes de formularios
    ├── tables/             # Componentes de tablas
    └── modals/             # Componentes modales
```

---

## 📡 Inicialización de API

En tu `main.tsx` o `app.tsx`:

```typescript
import { initializeAPI } from "@/services/api";

// Inicializar API en el inicio de la app
const api = initializeAPI({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

// Cuando el usuario inicia sesión, actualizar el token
const { session } = await supabase.auth.getSession();
api.setAccessToken(session.access_token);
```

---

## 🎣 Hooks - Ejemplos de Uso

### 1. Obtener Recaudos

```typescript
import { useReceipts, useReceiptOperations } from "@/hooks";

function ReceiptsPage() {
  const { data, isLoading, error } = useReceipts({
    tenantId: "tenant-id",
    status: "Pendiente",
    limit: 10,
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map((receipt) => (
        <div key={receipt.id}>{receipt.receipt_number}</div>
      ))}
    </div>
  );
}
```

### 2. Crear Recaudo

```typescript
import { useReceiptOperations } from "@/hooks";
import { CreateReceiptInput } from "@/schemas/forms";

function CreateReceiptForm() {
  const { handleCreateReceipt, isLoading, successMessage, errorMessage } =
    useReceiptOperations("tenant-id");

  const onSubmit = async (formData: CreateReceiptInput) => {
    await handleCreateReceipt({
      tenantId: "tenant-id",
      payerId: formData.payerId,
      concept: formData.concept,
      amount: formData.amount,
      date: formData.date,
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit({
        payerId: formData.get("payerId") as string,
        concept: formData.get("concept") as string,
        amount: parseFloat(formData.get("amount") as string),
        date: formData.get("date") as string,
      });
    }}>
      {/* Form fields */}
      {errorMessage && <div className="text-red-600">{errorMessage}</div>}
      {successMessage && <div className="text-green-600">{successMessage}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creando..." : "Crear Recaudo"}
      </button>
    </form>
  );
}
```

### 3. Dashboard con Métricas

```typescript
import { useDashboardWidgets } from "@/hooks";
import { formatCurrency } from "@/lib/formatting";

function Dashboard() {
  const { widgets, isLoading } = useDashboardWidgets({
    tenantId: "tenant-id",
    year: 2026,
    month: 8,
  });

  if (isLoading) return <div>Cargando dashboard...</div>;
  if (!widgets) return <div>Sin datos</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Balance */}
      <Card>
        <div className="text-sm text-gray-500">{widgets.balance.title}</div>
        <div className="text-2xl font-bold">
          {formatCurrency(widgets.balance.value)}
        </div>
        <div className={`text-sm ${
          widgets.balance.status === "positive" ? "text-green-600" : "text-red-600"
        }`}>
          {widgets.balance.status === "positive" ? "✓ Positivo" : "✗ Negativo"}
        </div>
      </Card>

      {/* Recaudos Confirmados */}
      <Card>
        <div className="text-sm text-gray-500">{widgets.receipts_confirmed.title}</div>
        <div className="text-2xl font-bold">
          {formatCurrency(widgets.receipts_confirmed.value)}
        </div>
        <div className="text-sm text-gray-600">
          {widgets.receipts_confirmed.subtitle}
        </div>
      </Card>

      {/* Pagos Pendientes */}
      <Card>
        <div className="text-sm text-gray-500">{widgets.payments_pending.title}</div>
        <div className="text-2xl font-bold">{widgets.payments_pending.count}</div>
        <div className="text-sm text-amber-600">Por procesar</div>
      </Card>

      {/* Items por Revisar */}
      <Card>
        <div className="text-sm text-gray-500">{widgets.pending_review.title}</div>
        <div className="text-2xl font-bold">{widgets.pending_review.count}</div>
        <div className={`text-sm ${
          widgets.pending_review.status === "warning"
            ? "text-amber-600"
            : "text-green-600"
        }`}>
          {widgets.pending_review.status === "warning"
            ? "Requiere atención"
            : "Todo despejado"}
        </div>
      </Card>
    </div>
  );
}
```

### 4. Procesar Pago

```typescript
import { usePaymentOperations } from "@/hooks";

function ProcessPaymentButton({ paymentId }: { paymentId: string }) {
  const { handleProcessPayment, isLoading, successMessage } =
    usePaymentOperations("tenant-id");

  return (
    <>
      <button
        onClick={() => handleProcessPayment(paymentId)}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? "Procesando..." : "Procesar Pago"}
      </button>
      {successMessage && (
        <div className="text-green-600 mt-2">{successMessage}</div>
      )}
    </>
  );
}
```

---

## ✅ Validación de Formularios

Usar Zod + React Hook Form:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReceiptSchema, CreateReceiptInput } from "@/schemas/forms";

function ReceiptForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateReceiptInput>({
    resolver: zodResolver(createReceiptSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("concept")}
        placeholder="Concepto"
      />
      {errors.concept && <span className="text-red-600">{errors.concept.message}</span>}

      <input
        {...register("amount", { valueAsNumber: true })}
        type="number"
        placeholder="Monto"
      />
      {errors.amount && <span className="text-red-600">{errors.amount.message}</span>}

      <button type="submit">Crear</button>
    </form>
  );
}
```

---

## 🎨 Utilidades de Formato

```typescript
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  maskAccountNumber,
} from "@/lib/formatting";

// Moneda
formatCurrency(1000000);        // "$1.000.000"
formatCurrencyCompact(1000000); // "$1.0M"

// Fechas
formatDate(new Date());         // "2026-08-22"
formatDateDisplay(new Date());  // "22 de agosto de 2026"
formatRelativeTime(new Date()); // "hace unos segundos"

// Estados
getPaymentStatusLabel("Programado");   // "Programado"
getPaymentStatusColor("Programado");   // "blue"

// Seguridad
maskAccountNumber("12345678901234"); // "****1234"
maskIdNumber("1234567890");          // "*****7890"
```

---

## 🔧 Configuración en `.env.local`

```env
VITE_SUPABASE_URL=https://hduqkztwwvbgmttlmsle.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📋 Requisitos de Dependencias

Asegúrate de tener instaladas:

```json
{
  "dependencies": {
    "axios": "^1.12.0",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@tanstack/react-query": "^5.x",
    "@supabase/supabase-js": "^2.38.0",
    "zod": "^4.1.12",
    "react-hook-form": "^7.64.0",
    "@hookform/resolvers": "^5.2.2"
  }
}
```

---

## 🚀 Próximos Pasos

### 1. Crear Componentes de Formularios
- [ ] `FormReceipt.tsx` - Formulario para crear recaudos
- [ ] `FormPayment.tsx` - Formulario para crear pagos
- [ ] `FormDispersion.tsx` - Formulario para crear dispersiones
- [ ] `FormCounterparty.tsx` - Formulario para crear contrapartes

### 2. Crear Componentes de Tablas
- [ ] `ReceiptsTable.tsx` - Tabla de recaudos
- [ ] `PaymentsTable.tsx` - Tabla de pagos
- [ ] `DispersionsTable.tsx` - Tabla de dispersiones
- [ ] `CounterpartiesTable.tsx` - Tabla de contrapartes

### 3. Crear Páginas Principales
- [ ] `DashboardPage.tsx` - Home con métricas
- [ ] `ReceiptsPage.tsx` - Gestión de recaudos
- [ ] `PaymentsPage.tsx` - Gestión de pagos
- [ ] `DispersionsPage.tsx` - Gestión de dispersiones
- [ ] `CounterpartiesPage.tsx` - Gestión de contrapartes

### 4. Integración en Rutas
- [ ] Configurar React Router
- [ ] Proteger rutas por rol
- [ ] Implementar breadcrumbs

### 5. Mejoras
- [ ] Paginación en tablas
- [ ] Exportar a PDF/Excel
- [ ] Gráficos con Recharts
- [ ] Notificaciones en tiempo real

---

## 📞 Ejemplos Completos

Ver carpeta `client/src/components/` para ejemplos completos de:
- Formularios validados
- Tablas con paginación
- Modales de confirmación
- Mensajes de estado

---

## ✨ Tips

1. **Types**: Siempre usa los tipos de `@/shared/types`
2. **Validación**: Define esquemas en `@/schemas/forms`
3. **Formato**: Usa funciones de `@/lib/formatting`
4. **Hooks**: Importa desde `@/hooks` para autocomplete
5. **API**: El cliente se inicializa una sola vez

---

*Fase 2 completada. Listos para construir componentes React.*
