# 🚀 BITAXUS - Start Here

Complete automated startup guide. Choose your path below.

---

## ⚡ Quick Start (5 minutes)

Just want to run the app locally?

```bash
cd /home/user/bitaxus
chmod +x quick-start.sh
./quick-start.sh
```

Then open: **http://localhost:5173**

---

## 🔧 Full Setup (Production Ready)

Complete setup with Edge Functions deployment.

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`

### Run Automated Setup
```bash
cd /home/user/bitaxus
chmod +x setup-and-run.sh
./setup-and-run.sh
```

The script will:
1. ✅ Install dependencies
2. ✅ Deploy Edge Functions
3. ✅ Build frontend
4. ✅ Start dev server
5. ✅ Guide you through testing
6. ✅ Help merge PR

---

## 📋 Manual Steps (If scripts don't work)

### 1. Install Dependencies
```bash
cd /home/user/bitaxus
npm install
```

### 2. Deploy Edge Functions
```bash
# First login to Supabase CLI
supabase login

# Then deploy each function
supabase functions deploy auth/register --project-id hduqkztwwvbgmttlmsle
supabase functions deploy receipts/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy payments/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy payments/process --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dispersions/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dispersions/process --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dashboard/metrics --project-id hduqkztwwvbgmttlmsle
```

### 3. Start Dev Server
```bash
npm run dev
```

Open: http://localhost:5173

### 4. Test the Application

#### 4.1 Test Login
- Click "Ingresar"
- Enter Supabase credentials
- Should see Dashboard

#### 4.2 Test Receipts
- Go to "Recaudos"
- Click "Crear Recaudo"
- Fill: Payer, Amount, Date
- Submit
- Should appear in table

#### 4.3 Test Payments
- Go to "Pagos"
- Click "Crear Pago"
- Fill: Beneficiary, Amount, Account
- Submit
- Should appear in table

#### 4.4 Test Dashboard
- Go to "Dashboard"
- Should show metrics from last 30 days

#### 4.5 Test Real-time
- Open 2 browser tabs
- Create receipt in Tab 1
- Tab 2 should update automatically

### 5. Merge PR
Visit: https://github.com/alejagoguti-cpu/bitaxus/pull/2

Click: **"Merge pull request"**

---

## 🐛 Troubleshooting

### Issue: Dependencies fail to install
```bash
npm install --legacy-peer-deps --force
```

### Issue: Supabase CLI not found
```bash
npm install -g supabase
supabase login
```

### Issue: Edge Functions deployment fails
```bash
# Check if logged in
supabase projects list

# If not logged in:
supabase login
```

### Issue: Port 5173 already in use
```bash
# Kill the process using port 5173
# On Linux/Mac:
lsof -ti :5173 | xargs kill -9

# Then restart dev server
npm run dev
```

### Issue: Cannot connect to Supabase
- Verify .env.local exists in `client/`
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Restart dev server

### Issue: Login fails
- Verify Supabase credentials are correct
- Check if user account is active in Supabase
- Check browser console for detailed error

### Issue: Edge Functions returning 404
```bash
# Verify functions are deployed
supabase functions list --project-id hduqkztwwvbgmttlmsle

# Check function logs
supabase functions logs auth/register --project-id hduqkztwwvbgmttlmsle --limit 50
```

---

## 📊 What You'll See

### ✅ Login Page (First)
- Email and password fields
- "Ingresar" (Login) button
- "Registrarse" (Register) button

### ✅ Dashboard (After Login)
- Welcome message with your name
- 4 metric cards:
  - Total Receipts
  - Total Payments
  - Pending Payments
  - Active Counterparties
- Recent activity list

### ✅ Receipts Page
- Table with all receipts
- Filter by status
- Pagination
- "Crear Recaudo" button

### ✅ Payments Page
- Table with all payments
- Filter by status
- Pagination
- "Crear Pago" button

### ✅ Dispersions Page
- Table with all dispersions
- "Crear Dispersión" button

### ✅ Settings Page
- User profile info
- Tenant info
- Logout button

---

## 📚 Documentation

- **DEPLOYMENT.md** - Complete production deployment guide
- **PHASE6_GUIDE.md** - Technical details about Supabase integration
- **supabase/functions/README.md** - Edge Functions API documentation

---

## ✨ Features Included

✅ Supabase authentication (email/password)
✅ Real-time data updates
✅ Receipt management (RC-XXXX-XXXXXX numbering)
✅ Payment processing (PA-XXXX-XXXXXX numbering)
✅ Dispersion management (DP-XXXX-XXXXXX numbering)
✅ Dashboard with metrics
✅ Multi-tenant support (RLS)
✅ Role-based access (admin/operator/viewer)
✅ Activity logging
✅ Audit trails

---

## 🎯 Success Criteria

You'll know everything is working when:

1. ✅ Can login with Supabase credentials
2. ✅ Can see Dashboard with no errors
3. ✅ Can create Receipt/Payment/Dispersion
4. ✅ Can view list of all transactions
5. ✅ Real-time updates work (2 tabs)
6. ✅ No console errors (F12 → Console)
7. ✅ Edge Function logs show no errors

---

## 🚀 Next: Production

After testing locally:

1. Merge PR: https://github.com/alejagoguti-cpu/bitaxus/pull/2
2. Deploy to Vercel/Netlify
3. Configure production environment
4. Monitor Edge Function logs
5. Verify RLS policies

See **DEPLOYMENT.md** for full production guide.

---

## ❓ Questions?

Check the documentation:
- Frontend issues → Check browser console (F12)
- Backend issues → Check Edge Function logs
- Database issues → Check Supabase Dashboard
- RLS issues → Check Authentication → Policies

---

**You're all set!** 🎉

Choose a start option above and begin.

```bash
# Quick start (recommended)
./quick-start.sh

# Full setup with deployment
./setup-and-run.sh
```
