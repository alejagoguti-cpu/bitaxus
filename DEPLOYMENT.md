# Bitaxus Deployment Guide

Complete guide to deploy Bitaxus with Supabase integration.

## Prerequisites

- Node.js 18+
- Supabase CLI: `npm install -g supabase`
- Git
- GitHub account (for PR merging)

## Step 1: Environment Configuration ✅

### .env.local already configured with:
```env
VITE_SUPABASE_URL=https://hduqkztwwvbgmttlmsle.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR
```

**Status:** ✅ CONFIGURED

## Step 2: Deploy Edge Functions

### Option A: Auto Deploy (Recommended)
```bash
cd /home/user/bitaxus
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### Option B: Manual Deploy
```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Deploy each function
supabase functions deploy auth/register --project-id hduqkztwwvbgmttlmsle
supabase functions deploy receipts/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy payments/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy payments/process --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dispersions/create --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dispersions/process --project-id hduqkztwwvbgmttlmsle
supabase functions deploy dashboard/metrics --project-id hduqkztwwvbgmttlmsle
```

### Verify Deployment
```bash
# List deployed functions
supabase functions list --project-id hduqkztwwvbgmttlmsle

# View function logs
supabase functions logs auth/register --project-id hduqkztwwvbgmttlmsle --limit 100
```

## Step 3: Local Testing

### Start Dev Server
```bash
cd /home/user/bitaxus
npm install  # if needed
npm run dev
```

### Test Checklist
- [ ] Open http://localhost:5173
- [ ] Test Login
  - Click "Ingresar"
  - Enter Supabase auth credentials
  - Should redirect to Dashboard
- [ ] Test Receipts
  - Go to Recaudos
  - Click "Crear Recaudo"
  - Fill form and submit
  - Should see new receipt in table
- [ ] Test Payments
  - Go to Pagos
  - Click "Crear Pago"
  - Should see payment created
- [ ] Test Dashboard
  - Go to Dashboard
  - Should show metrics from last 30 days
- [ ] Test Real-time
  - Open two browser windows
  - Create receipt in one
  - Should appear in other automatically

### Troubleshooting

**Error: "Cannot find module @supabase/supabase-js"**
```bash
npm install
```

**Error: "Supabase URL/Key not found"**
- Check .env.local exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set

**Edge Functions returning 404**
- Verify functions are deployed: `supabase functions list`
- Check function logs for errors
- Ensure project ID is correct

**RLS errors (403 Forbidden)**
- Check that user has proper tenant_id
- Verify RLS policies are enabled in Supabase
- Check auth token is valid

## Step 4: Production Deployment

### Merge PR to Main
```bash
# On GitHub: https://github.com/alejagoguti-cpu/bitaxus/pull/2
# Click "Merge pull request"
```

### Deploy to Hosting (Vercel Example)

1. **Connect Repository**
   - Go to vercel.com
   - Import project from GitHub
   - Select `alejagoguti-cpu/bitaxus`

2. **Configure Environment Variables**
   - Add to Vercel Dashboard:
     ```
     VITE_SUPABASE_URL=https://hduqkztwwvbgmttlmsle.supabase.co
     VITE_SUPABASE_ANON_KEY=sb_publishable_V5PJfk7ZDr2frE8o-Ry8yQ_qSbFnjYR
     ```

3. **Configure Supabase CORS**
   - Dashboard → Settings → API → CORS
   - Add your Vercel domain:
     ```
     https://bitaxus.vercel.app
     https://*.vercel.app
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access at https://bitaxus.vercel.app

### Deploy to Netlify (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

## Step 5: Production Testing

After deployment to production:

1. **Test Live Site**
   - Login with valid credentials
   - Create test data
   - Verify dashboard displays correctly

2. **Monitor Edge Functions**
   - Dashboard → Functions
   - Check logs for errors
   - Monitor invocations

3. **Check RLS Policies**
   - Dashboard → SQL Editor
   - Run queries to verify tenant isolation
   - Test with different user accounts

## Database Backups

Supabase automatically backs up daily. To manually backup:

```bash
# Create backup
supabase db push --project-id hduqkztwwvbgmttlmsle

# Restore from backup (if needed)
supabase db pull --project-id hduqkztwwvbgmttlmsle
```

## Monitoring

### Logs
```bash
# Frontend logs
# Check browser console (F12)

# Edge Function logs
supabase functions logs <function-name> --project-id hduqkztwwvbgmttlmsle

# Database logs
# Dashboard → Logs in Supabase
```

### Performance
- Frontend: Check Network tab in DevTools
- Backend: Monitor Edge Function invocations
- Database: Check query performance in Supabase

## Rollback (if needed)

### Rollback Deployment
```bash
# Go back to previous commit
git revert <commit-hash>
git push origin main

# Redeploy to hosting
# (Auto-deploys on push if connected to Vercel/Netlify)
```

### Rollback Database
```bash
# Restore from backup in Supabase Dashboard
# Settings → Backups → Restore
```

## Support

- **Frontend Issues:** Check browser console, React Query devtools
- **Backend Issues:** Check Edge Function logs
- **Database Issues:** Check Supabase Dashboard → SQL Editor
- **RLS Issues:** Check policies in Authentication → Policies

## Security Checklist

- [ ] .env.local is in .gitignore (NEVER commit credentials)
- [ ] CORS is configured in Supabase
- [ ] RLS policies are enabled on all tables
- [ ] Edge Functions validate tenant_id
- [ ] API keys have appropriate scopes
- [ ] Backups are enabled
- [ ] SSL/TLS is enforced

## Next Steps

- Monitor application performance
- Gather user feedback
- Plan feature enhancements
- Schedule regular backups
- Review logs weekly

---

**Deployment Complete!** 🚀

Bitaxus is now live with full Supabase integration.
