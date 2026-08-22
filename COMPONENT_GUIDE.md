# Guía de Componentes - Fase 3

## 🎨 Componentes Entregados

### 1. **FormReceipt** (`components/forms/FormReceipt.tsx`)
Formulario para crear y editar recaudos con:
- ✅ Validación con Zod
- ✅ React Hook Form integration
- ✅ Manejo de errores
- ✅ Mensajes de éxito
- ✅ Estados de loading

**Uso:**
```typescript
import { FormReceipt } from "@/components";
import { useReceipts } from "@/hooks";

function ReceiptCreatePage() {
  const { data: counterparties } = useReceipts({...});
  
  return (
    <FormReceipt
      tenantId="tenant-id"
      counterparties={counterparties?.data || []}
      onSuccess={() => {
        console.log("Recaudo creado!");
      }}
    />
  );
}
```

### 2. **ReceiptsTable** (`components/tables/ReceiptsTable.tsx`)
Tabla inteligente de recaudos con:
- ✅ Paginación automática
- ✅ Filtros por estado
- ✅ Acciones (Ver, Editar)
- ✅ Estados coloreados
- ✅ Formato de moneda

**Uso:**
```typescript
import { ReceiptsTable } from "@/components";

function ReceiptsListPage() {
  return (
    <ReceiptsTable
      tenantId="tenant-id"
      onViewDetail={(receipt) => {
        navigate(`/receipts/${receipt.id}`);
      }}
      onEdit={(receipt) => {
        // Abrir modal de edición
      }}
    />
  );
}
```

### 3. **MetricCard & DashboardGrid** (`components/dashboard/MetricCard.tsx`)
Componentes para mostrar métricas:
- ✅ Múltiples variantes (default, compact, detailed)
- ✅ Estados (success, warning, error, info)
- ✅ Trends y cambios
- ✅ Grid responsivo
- ✅ Iconos personalizables

**Uso:**
```typescript
import { MetricCard, DashboardGrid } from "@/components";

function MetricsSection() {
  return (
    <DashboardGrid columns={3}>
      <MetricCard
        title="Balance"
        value={1000000}
        currency
        status="success"
        icon="💰"
      />
      <MetricCard
        title="Pagos Pendientes"
        value={5}
        status="warning"
        icon="⏳"
      />
      <MetricCard
        title="Recaudos Confirmados"
        value={250000}
        currency
        status="success"
      />
    </DashboardGrid>
  );
}
```

### 4. **ConfirmDialog & useConfirmDialog** (`components/modals/ConfirmDialog.tsx`)
Modal de confirmación reutilizable:
- ✅ 3 variantes (danger, warning, info)
- ✅ Hook para manejar estado
- ✅ Loading state
- ✅ Callbacks customizables

**Uso:**
```typescript
import { useConfirmDialog } from "@/components";

function PaymentActionButton() {
  const { confirm } = useConfirmDialog();

  const handleProcess = async () => {
    const confirmed = await confirm(
      "Procesar Pago",
      "¿Estás seguro de que deseas procesar este pago?",
      async () => {
        // Hacer acción
        await api.processPayment(paymentId);
      },
      {
        confirmText: "Procesar",
        variant: "warning"
      }
    );

    if (confirmed) {
      console.log("Pago procesado!");
    }
  };

  return (
    <button onClick={handleProcess}>
      Procesar Pago
    </button>
  );
}
```

### 5. **DashboardPage** (`pages/DashboardPage.tsx`)
Página completa de dashboard con:
- ✅ Métricas en tiempo real
- ✅ Navegación de períodos
- ✅ Items por revisar
- ✅ Acciones rápidas
- ✅ Dispersiones recientes

**Uso:**
```typescript
import { DashboardPage } from "@/pages/DashboardPage";

// En tu router
<DashboardPage tenantId="tenant-id" />
```

### 6. **Router** (`router.tsx`)
Configuración de rutas con:
- ✅ Rutas públicas y protegidas
- ✅ Role-based access control
- ✅ Control de títulos
- ✅ Estructura extensible

**Uso:**
```typescript
import { Router } from "@/router";

export default function App() {
  return <Router />;
}
```

---

## 🎯 Flujos de Desarrollo

### Crear Nueva Página

1. **Crear el archivo** en `src/pages/`
```typescript
// src/pages/ReceiptsPage.tsx
export function ReceiptsPage({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useReceipts({ tenantId });
  
  return (
    <div>
      <ReceiptsTable tenantId={tenantId} />
    </div>
  );
}
```

2. **Agregar a router** en `src/router.tsx`
```typescript
{
  path: "/receipts",
  title: "Recaudos",
  component: ReceiptsPage,
  requiredRoles: [UserRole.ADMIN, UserRole.OPERATOR],
}
```

### Crear Nuevo Formulario

1. **Crear esquema** en `src/schemas/forms.ts`
```typescript
export const createMyEntitySchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  // ...
});
```

2. **Crear componente** en `src/components/forms/`
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMyEntitySchema } from "@/schemas/forms";

export function FormMyEntity({ ... }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createMyEntitySchema),
  });
  
  // Implementar formulario
}
```

### Crear Nueva Tabla

1. **Crear hook** si es necesario en `src/hooks/`
2. **Crear componente** en `src/components/tables/`
```typescript
export function MyEntityTable({ tenantId, onViewDetail }: ...) {
  const { data, isLoading } = useMyEntity({ tenantId });
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Tabla */}
    </div>
  );
}
```

---

## 📋 Checklist para Componentes Completos

- [ ] Componente React funcional
- [ ] TypeScript types definidos
- [ ] Validación si es formulario
- [ ] Manejo de loading states
- [ ] Manejo de error states
- [ ] Mensajes de éxito
- [ ] Estilos Tailwind consistentes
- [ ] Responsivo (mobile-first)
- [ ] Accesibilidad (labels, aria-labels)
- [ ] Comentarios JSDoc
- [ ] Exportado en `index.ts`
- [ ] Ejemplo de uso en documentación

---

## 🛠️ Patrones Comunes

### Loading State
```typescript
{isLoading && (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)}
```

### Error State
```typescript
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-800">{error.message}</p>
  </div>
)}
```

### Empty State
```typescript
{!isLoading && !data?.data?.length && (
  <div className="text-center py-12">
    <p className="text-gray-500">No hay datos para mostrar</p>
  </div>
)}
```

### Success Message
```typescript
{successMessage && (
  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
    <p className="text-sm text-green-800">{successMessage}</p>
  </div>
)}
```

---

## 📦 Tailwind Classes Comunes

```css
/* Fondos */
bg-white            /* Blanco */
bg-gray-50          /* Gris muy claro */
bg-blue-600         /* Azul */

/* Bordes */
border border-gray-300
rounded-lg          /* Bordes redondeados */
shadow-sm           /* Sombra pequeña */

/* Tipografía */
text-lg font-semibold     /* Grande y negrita */
text-sm text-gray-600     /* Pequeño y gris */

/* Espaciado */
p-6                 /* Padding */
gap-3              /* Gap entre elementos */
space-y-4          /* Espacio vertical entre hijos */

/* Interacción */
hover:bg-blue-700   /* Hover */
disabled:opacity-50 /* Disabled */
transition-colors   /* Transiciones */

/* Responsive */
md:grid-cols-2      /* 2 columnas en medium screens */
lg:grid-cols-3      /* 3 columnas en large screens */
```

---

## 🔗 Próximos Pasos - Fase 4

### Componentes Pendientes:
- [ ] `FormPayment.tsx` - Crear pagos
- [ ] `FormDispersion.tsx` - Crear dispersiones
- [ ] `FormCounterparty.tsx` - Crear contrapartes
- [ ] `FormBankAccount.tsx` - Crear cuentas
- [ ] `PaymentsTable.tsx` - Tabla de pagos
- [ ] `DispersionsTable.tsx` - Tabla de dispersiones
- [ ] `CounterpartiesTable.tsx` - Tabla de contrapartes

### Páginas Pendientes:
- [ ] `PaymentsPage.tsx` - Gestión de pagos
- [ ] `DispersionsPage.tsx` - Gestión de dispersiones
- [ ] `CounterpartiesPage.tsx` - Gestión de contrapartes
- [ ] `ReportsPage.tsx` - Reportes y exports

### Mejoras:
- [ ] Autenticación y sesiones
- [ ] Notificaciones en tiempo real
- [ ] Gráficos con Recharts
- [ ] Exportar a PDF/Excel
- [ ] Búsqueda y filtros avanzados

---

## ✅ Verificación

Todos los componentes incluyen:
- ✅ TypeScript types
- ✅ Error handling
- ✅ Loading states
- ✅ Tailwind styling
- ✅ Responsive design
- ✅ Accesibilidad básica

---

*Fase 3 completada. Componentes y páginas listas para desarrollar.*
