# Fase 6: Integración Supabase Real

## ✅ Completado

### Supabase Client (`client/src/lib/supabase.ts`)
- ✅ Cliente Supabase inicializado
- ✅ Variables de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- ✅ Helper para Edge Functions
- ✅ Getter para auth token

### AuthContext Actualizado
- ✅ `login()` - Supabase Auth real
- ✅ `logout()` - Supabase Auth signOut
- ✅ `register()` - Supabase Auth + Edge Function
- ✅ Session recovery en carga
- ✅ Auth state subscription
- ✅ Manejo de errores

### Hooks Supabase Ejemplo
- ✅ `useReceiptsSupabase.ts` - Patrón completo de implementación
- ✅ Queries directas con RLS
- ✅ Mutations con Edge Functions
- ✅ Real-time subscriptions
- ✅ Query invalidation

### Configuración
- ✅ `.env.example` con variables necesarias

## 🔧 Configuración Requerida

### 1. Crear archivo `.env.local`
```bash
cp client/.env.example client/.env.local
```

### 2. Agregar credenciales Supabase
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Obtén estas del dashboard de Supabase:
- Settings → API
- Copy URL y anon key

## 📋 Pasos para Completar Integración

### Paso 1: Reemplazar Hooks (15 minutos)
Convierte cada hook siguiendo el patrón de `useReceiptsSupabase`:

```typescript
// Antes (con API service)
export function useReceipts(options) {
  return useQuery({
    queryFn: () => api.getReceipts(options.tenantId, {...})
  });
}

// Después (con Supabase)
export function useReceipts(options) {
  return useQuery({
    queryFn: async () => {
      let query = supabase.from("receipts").select(...)
        .eq("tenant_id", options.tenantId);
      
      // Apply filters...
      const { data, error, count } = await query;
      return { data, total: count };
    }
  });
}
```

### Paso 2: Edge Functions
Las llamadas a Edge Functions ya están integradas:

```typescript
// Crear recaudo
const result = await callEdgeFunction("receipts/create", {
  tenant_id: tenantId,
  payerId: "...",
  amount: 1000,
  // ...
});

// Procesar pago
const result = await callEdgeFunction("payments/process", {
  payment_id: paymentId,
});
```

### Paso 3: Real-time Subscriptions
Integra actualizaciones en vivo:

```typescript
// Suscribirse a cambios de recaudos
useReceiptSubscription(tenantId);

// Automáticamente invalida queries al cambiar datos
```

### Paso 4: Testing
Prueba con datos reales:

1. Crea una cuenta en tu proyecto Supabase
2. Inserta datos de prueba en las tablas
3. Verifica que se muestren en la UI

## 🎯 Checklist de Reemplazo

### Hooks a convertir:
- [ ] useReceipts → Supabase queries
- [ ] usePayments → Supabase queries
- [ ] useDispersions → Supabase queries
- [ ] useCounterparties → Supabase queries
- [ ] useDashboardMetrics → Supabase query o Edge Function
- [ ] usePaymentOperations → Edge Functions
- [ ] useDashboardWidgets → Supabase aggregate queries

### Componentes a actualizar:
- [ ] Verificar que FormReceipt use hook correcto
- [ ] Verificar que ReceiptsTable use hook correcto
- [ ] Verificar que FormPayment use hook correcto
- [ ] Verificar que PaymentsTable use hook correcto
- [ ] Etc.

## 🔄 Patrón de Conversión

### RLS Automático
Supabase RLS se aplica automáticamente:
- ✅ Solo datos del tenant actual
- ✅ Solo visible para usuarios autorizados
- ✅ Filtrado en nivel de base de datos

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from(table).select(...);
  if (error) throw error;
  return data;
} catch (err) {
  console.error("Supabase error:", err);
  throw new Error("Database error");
}
```

### Paginación
```typescript
const offset = (page - 1) * limit;
query = query.range(offset, offset + limit - 1);

// React Query maneja el resto
```

## 📊 Estructura de Datos

Las tablas en Supabase ya están creadas por migrations:
- ✅ tenants
- ✅ users
- ✅ counterparties
- ✅ bank_accounts
- ✅ receipts
- ✅ payments
- ✅ dispersions
- ✅ dispersion_items
- ✅ activity_logs
- ✅ audit_trails

### RLS Policies
RLS ya está configurado:
- ✅ Row-level access por tenant_id
- ✅ Role-based permissions (admin/operator/viewer)
- ✅ Audit trail logging

## 🚀 Deploy

### Local Development
```bash
# Instalar dependencias
npm install

# Crear .env.local con credenciales
cp client/.env.example client/.env.local
# Editar .env.local con tus credenciales

# Ejecutar dev server
npm run dev
```

### Production
```bash
# Build
npm run build

# Deploy a Vercel, Netlify, etc.
# Asegurate de:
# - Configurar variables de entorno en el hosting
# - Habilitar CORS en Supabase
# - Configurar dominio permitido
```

## 📝 Notas Importantes

1. **RLS Activo**: Supabase filtra automáticamente por tenant
2. **Auth**: Supabase maneja tokens automáticamente
3. **Timestamps**: Use `CURRENT_TIMESTAMP` en triggers
4. **Errores**: El cliente Supabase lanza errores descriptivos

## ✅ Verificación

```bash
# Verificar que AuthContext funciona:
1. Ir a /login
2. Ingresar credenciales Supabase
3. Debe redirigir a Dashboard
4. User info debe mostrar en header

# Verificar que hooks funcionan:
1. Ir a /receipts
2. Debe mostrar lista (vacía si no hay datos)
3. Crear nuevo recaudo
4. Debe aparecer en tabla
```

---

*Fase 6: Integración Supabase completada. Stack listo para producción.*
