# Guía de Componentes - Fase 3 & Fase 4

## 🎨 Componentes Entregados

### Fase 3 - Componentes Base

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

### Fase 4 - Componentes de Operaciones

### 7. **FormPayment** (`components/forms/FormPayment.tsx`)
Formulario para crear pagos individuales:
- ✅ Selección de cuenta origen y beneficiario
- ✅ Concepto, monto, moneda y fecha programada
- ✅ Soporte para pagos recurrentes (mensual, trimestral, anual)
- ✅ Validación con Zod
- ✅ Estados de loading y mensajes de éxito/error

**Uso:**
```typescript
import { FormPayment } from "@/components";

function PaymentCreatePage() {
  const { data: bankAccounts } = useBankAccounts({...});
  const { data: beneficiaries } = useCounterparties({...});
  
  return (
    <FormPayment
      tenantId="tenant-id"
      bankAccounts={bankAccounts?.data || []}
      beneficiaries={beneficiaries?.data || []}
      onSuccess={() => console.log("Pago creado!")}
    />
  );
}
```

### 8. **FormCounterparty** (`components/forms/FormCounterparty.tsx`)
Formulario para crear/editar contrapartes:
- ✅ Información personal/empresarial
- ✅ Tipos de ID (CC, NIT, CE, PP)
- ✅ Relación (Cliente/Proveedor)
- ✅ Datos de contacto (email, teléfono)
- ✅ Validación de campos requeridos

### 9. **FormBankAccount** (`components/forms/FormBankAccount.tsx`)
Formulario para crear cuentas bancarias:
- ✅ Selección de banco y tipo de cuenta
- ✅ Número de cuenta con validación
- ✅ Titular de la cuenta
- ✅ Número de ruta (opcional)
- ✅ Marcar cuenta como principal

### 10. **FormDispersion** (`components/forms/FormDispersion.tsx`)
Formulario avanzado para dispersiones:
- ✅ Agregar múltiples beneficiarios dinámicamente
- ✅ Tabla en vivo con montos y acciones
- ✅ Cálculo automático de monto total
- ✅ Validación de items no vacío
- ✅ Soporte para diferentes monedas

**Uso:**
```typescript
import { FormDispersion } from "@/components";

function DispersionCreatePage() {
  return (
    <FormDispersion
      tenantId="tenant-id"
      bankAccounts={accounts}
      beneficiaries={counterparties}
      onSuccess={() => console.log("Dispersión creada!")}
    />
  );
}
```

### 11. **PaymentsTable** (`components/tables/PaymentsTable.tsx`)
Tabla inteligente de pagos:
- ✅ Paginación automática (10 items por página)
- ✅ Filtro por estado (Programado, Procesado, En proceso, Cancelado, Fallido)
- ✅ Columnas: #Pago, Beneficiario, Concepto, Monto, Fecha, Estado
- ✅ Acciones contextuales (Ver, Editar, Procesar)
- ✅ Badges con colores por estado

### 12. **DispersionsTable** (`components/tables/DispersionsTable.tsx`)
Tabla de dispersiones:
- ✅ Listado con paginación
- ✅ Filtro por estado
- ✅ Muestra cantidad de beneficiarios
- ✅ Acciones (Ver, Editar, Procesar)
- ✅ Colorización de estados

### 13. **CounterpartiesTable** (`components/tables/CounterpartiesTable.tsx`)
Tabla de contrapartes:
- ✅ Búsqueda por nombre o ID
- ✅ Filtro por tipo (Cliente/Proveedor)
- ✅ Columnas: Nombre, ID, Tipo, Relación, Email, Teléfono, Estado
- ✅ Acciones (Ver, Editar, Eliminar)
- ✅ Paginación adaptativa

### 14. **PaymentsPage** (`pages/PaymentsPage.tsx`)
Página de gestión de pagos:
- ✅ Header con botón de crear
- ✅ Formulario modal para crear pagos
- ✅ Panel de detalle del pago seleccionado
- ✅ Tabla con filtros y paginación
- ✅ Diálogo de confirmación para procesar

### 15. **DispersionsPage** (`pages/DispersionsPage.tsx`)
Página de gestión de dispersiones:
- ✅ Crear dispersión con múltiples beneficiarios
- ✅ Ver detalle con breakdown de items
- ✅ Tabla de dispersiones
- ✅ Acciones de edición y procesamiento
- ✅ Confirmación antes de procesar

### 16. **CounterpartiesPage** (`pages/CounterpartiesPage.tsx`)
Página de gestión de contrapartes:
- ✅ Crear nueva contraparte
- ✅ Ver detalle completo con cuentas bancarias
- ✅ Editar información
- ✅ Eliminar con confirmación
- ✅ Búsqueda y filtros avanzados

### 17. **ReportsPage** (`pages/ReportsPage.tsx`)
Página de reportes y exportación:
- ✅ 6 tipos de reportes (Recaudos, Pagos, Dispersiones, Resumen, Conciliación, Auditoría)
- ✅ Selección de período de fechas
- ✅ Formatos de exportación (PDF, Excel, CSV)
- ✅ Generación en tiempo real
- ✅ Información de cumplimiento normativo

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

## ✅ Fase 4 Completada

### Componentes Entregados:
- ✅ `FormPayment.tsx` - Crear pagos con recurrencia
- ✅ `FormDispersion.tsx` - Crear dispersiones con múltiples beneficiarios
- ✅ `FormCounterparty.tsx` - Crear contrapartes
- ✅ `FormBankAccount.tsx` - Crear cuentas bancarias
- ✅ `PaymentsTable.tsx` - Tabla de pagos con filtros
- ✅ `DispersionsTable.tsx` - Tabla de dispersiones
- ✅ `CounterpartiesTable.tsx` - Tabla de contrapartes con búsqueda
- ✅ `PaymentsPage.tsx` - Gestión completa de pagos
- ✅ `DispersionsPage.tsx` - Gestión completa de dispersiones
- ✅ `CounterpartiesPage.tsx` - Gestión completa de contrapartes
- ✅ `ReportsPage.tsx` - Reportes y exportación

## 🔗 Próximos Pasos - Fase 5

### Características Avanzadas:
- [ ] Autenticación y sesiones de usuario
- [ ] Notificaciones en tiempo real (Socket.io)
- [ ] Gráficos y visualización (Recharts)
- [ ] Exportación PDF mejorada (Puppeteer)
- [ ] Importación masiva de contrapartes (Excel)
- [ ] Búsqueda global full-text
- [ ] Filtros guardados y favoritos

### Integraciones:
- [ ] Integración bancaria real (API Bancarias)
- [ ] Webhooks de confirmación
- [ ] Sincronización de estados
- [ ] Alertas y escalamientos

### Optimizaciones:
- [ ] Caché offline-first
- [ ] Sincronización de datos en background
- [ ] Compresión de reportes
- [ ] Análisis y predicción con ML

---

## ✅ Verificación

### Componentes Fase 3:
- ✅ TypeScript types
- ✅ Error handling
- ✅ Loading states
- ✅ Tailwind styling
- ✅ Responsive design
- ✅ Accesibilidad básica

### Componentes Fase 4:
- ✅ Validación con Zod y React Hook Form
- ✅ Manejo de formularios dinámicos
- ✅ Paginación y filtros adaptables
- ✅ Estilos consistentes con color-coding
- ✅ Soporte para operaciones CRUD
- ✅ Diálogos de confirmación para acciones críticas
- ✅ Integración con hooks personalizados
- ✅ Exportable en componentes/index.ts

---

*Fase 3 & 4 completadas. Stack de componentes listo para integración con API.*
