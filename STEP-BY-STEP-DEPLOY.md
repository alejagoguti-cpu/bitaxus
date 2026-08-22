# 🚀 Deployment Manual - Paso a Paso

Como no tenemos sesión interactiva para `supabase login`, aquí están los pasos exactos.

## PASO 1: Obtener Access Token de Supabase

### Opción A: Usar Token Existente (Rápido)
Si ya tienes credenciales guardadas:
```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

### Opción B: Generar Nuevo Token (Recomendado)
1. Ir a: https://app.supabase.com
2. Click en tu avatar (abajo a la izquierda)
3. "Access Tokens"
4. "Generate new token"
5. Nombre: "bitaxus-deploy"
6. Copiar el token

---

## PASO 2: Deployar Cada Edge Function

### Opción A: Script Automático
```bash
cd /home/user/bitaxus

# Exportar token
export SUPABASE_ACCESS_TOKEN="tu-token-aqui"

# Ejecutar deployment
for func in auth/register receipts/create payments/create payments/process dispersions/create dispersions/process dashboard/metrics; do
  echo "Deploying $func..."
  supabase functions deploy "$func" \
    --project-id hduqkztwwvbgmttlmsle \
    --token "$SUPABASE_ACCESS_TOKEN"
done

echo "✅ All functions deployed!"
```

### Opción B: Manual (Función por función)
```bash
export SUPABASE_ACCESS_TOKEN="tu-token-aqui"
export PROJECT_ID="hduqkztwwvbgmttlmsle"

# 1. auth/register
supabase functions deploy auth/register --project-id $PROJECT_ID

# 2. receipts/create
supabase functions deploy receipts/create --project-id $PROJECT_ID

# 3. payments/create
supabase functions deploy payments/create --project-id $PROJECT_ID

# 4. payments/process
supabase functions deploy payments/process --project-id $PROJECT_ID

# 5. dispersions/create
supabase functions deploy dispersions/create --project-id $PROJECT_ID

# 6. dispersions/process
supabase functions deploy dispersions/process --project-id $PROJECT_ID

# 7. dashboard/metrics
supabase functions deploy dashboard/metrics --project-id $PROJECT_ID
```

---

## PASO 3: Verificar Deployment

```bash
supabase functions list --project-id hduqkztwwvbgmttlmsle

# Deberías ver algo como:
# ✓ auth/register
# ✓ receipts/create
# ✓ payments/create
# ✓ payments/process
# ✓ dispersions/create
# ✓ dispersions/process
# ✓ dashboard/metrics
```

---

## PASO 4: Verificar Logs

```bash
# Ver logs de una función
supabase functions logs auth/register --project-id hduqkztwwvbgmttlmsle --limit 50

# Si no hay errores, ¡estás listo!
```

---

## PASO 5: Mergear PR

Ya lo hacemos automáticamente en el siguiente paso.

---

## ✅ Success Criteria

Después del deployment:
- [ ] `supabase functions list` muestra 7 funciones
- [ ] No hay errores en los logs
- [ ] Puedes crear Recaudos/Pagos en la app
- [ ] Dashboard muestra métricas

---

## 🆘 Troubleshooting

### Error: "unauthorized"
- Token inválido o expirado
- Genera nuevo token en https://app.supabase.com

### Error: "function not found"
- Verifica ruta de funciones
- Debe ser: `supabase/functions/auth/register/index.ts`

### Error: "project not found"
- Verificar project-id es correcto: `hduqkztwwvbgmttlmsle`
- En Supabase Dashboard → Settings

### Función no invocable
- Verifica autenticación en config.toml
- `verify_jwt = false` para auth/register

---

## 📝 Notes

- Funciones se despliegan a: `https://hduqkztwwvbgmttlmsle.supabase.co/functions/v1/`
- Endpoint ejemplo: `/functions/v1/auth/register`
- Versionado automático por Supabase
- Logs disponibles en Dashboard → Functions

---

**Ejecuta esto localmente cuando tengas tu token Supabase y estaremos listos!** 🚀
