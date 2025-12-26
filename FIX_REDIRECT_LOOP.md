# ⚠️ VERCEL ENVIRONMENT VARIABLES CHECKLIST

## ❌ Missing Required Variable: AUTH_URL

Your redirect loop is caused by missing or incorrect environment variables in Vercel.

## Required Environment Variables for Vercel (Production):

### 1. Database (Already Added ✅)
```bash
DATABASE_URL=libsql://heliport-aagn2807.aws-us-east-2.turso.io
DATABASE_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### 2. NextAuth v5 (CRITICAL - ADD THESE!)
```bash
AUTH_SECRET=your-unique-production-secret-here
AUTH_URL=https://helipad-git-main-aag2807s-projects.vercel.app
```

**⚠️ Important:**
- `AUTH_URL` MUST match your exact Vercel deployment URL
- `AUTH_SECRET` must be a secure random string (32+ characters)

### 3. Optional (Email features)
```bash
RESEND_API_KEY=re_4NoRCAeP_HKxcGKtcqqQSRjwQjaE335JV
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://helipad-git-main-aag2807s-projects.vercel.app
NEXT_PUBLIC_APP_NAME=Helipad
```

## How to Add to Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your "helipad" project
3. Click **Settings** → **Environment Variables**
4. For EACH variable:
   - Enter the **Key** (e.g., `AUTH_URL`)
   - Enter the **Value** (e.g., your URL)
   - Select **Production** environment
   - Click **Save**

## Generate AUTH_SECRET:

**Option 1: PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option 2: Online**
https://generate-secret.vercel.app/32

**Option 3: OpenSSL (if you have it)**
```bash
openssl rand -base64 32
```

## After Adding Variables:

1. **Redeploy** your app:
   - Either push a new commit, OR
   - Go to Deployments → Click "..." → Redeploy

2. The redirect loop will be **FIXED**!

## Why This Happens:

Without `AUTH_URL`, NextAuth can't properly validate sessions, causing:
```
Login page → Has session? → Yes → Redirect to /bookings/calendar
Dashboard → Has valid session? → No → Redirect to /login
Login page → Has session? → Yes → Redirect to /bookings/calendar
... INFINITE LOOP
```

With correct `AUTH_URL`, sessions work properly:
```
Login → Create session → Dashboard → Valid session ✅ → Show content
```

## Quick Fix Commands:

```bash
# Add AUTH_URL via Vercel CLI (if installed)
vercel env add AUTH_URL production
# Paste: https://helipad-git-main-aag2807s-projects.vercel.app

# Add AUTH_SECRET via Vercel CLI
vercel env add AUTH_SECRET production
# Paste your generated secret

# Redeploy
vercel deploy --prod
```

