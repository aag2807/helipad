# 🎯 Final Setup Steps - Your Database is Ready!

Your Turso database URL: `libsql://heliport-aagn2807.aws-us-east-2.turso.io`

## Step 1: Add Your Auth Token to .env.production.local

Create or edit `heliport/.env.production.local`:

```bash
DATABASE_URL="libsql://heliport-aagn2807.aws-us-east-2.turso.io"
DATABASE_AUTH_TOKEN="YOUR_TURSO_AUTH_TOKEN_HERE"
```

**To get your auth token:**
- Go to https://turso.tech/app
- Find your "heliport" database
- Look for "Create Token" or "Tokens" section
- Copy the token (starts with `eyJ...`)

## Step 2: Push Your Schema to Turso

```powershell
cd heliport

# Make sure .env.production.local has your credentials
npm run db:push
```

This will create all your tables in the Turso database.

## Step 3: (Optional) Seed Your Database

```powershell
npm run db:seed
```

This will create initial users and data.

## Step 4: Add Environment Variables to Vercel

Go to your Vercel project dashboard:
1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables for **Production**:

```
DATABASE_URL=libsql://heliport-aagn2807.aws-us-east-2.turso.io
DATABASE_AUTH_TOKEN=your-turso-token-here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

Optional (for email features):
```
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_NAME=Helipad Booking
```

### Generate NEXTAUTH_SECRET

**PowerShell:**
```powershell
# Generate a random secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Or use online:** https://generate-secret.vercel.app/32

## Step 5: Deploy to Vercel

```powershell
# If you haven't installed Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

Or just push to your Git repository if you have Vercel connected.

## Step 6: Verify Deployment

After deployment:
1. Visit your Vercel URL
2. Try to login or create a booking
3. Check Vercel logs if you encounter errors

## Local Development Setup

For local development, create `heliport/.env.local`:

```bash
# Use local SQLite file for development
DATABASE_URL="file:./helipad.db"

# Local URLs
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-for-local-dev"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Helipad Booking"
```

Then run:
```powershell
npm run dev
```

---

## Troubleshooting

**"Unable to open database" error on Vercel?**
- ✅ Make sure `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are set in Vercel
- ✅ Verify the auth token is valid (regenerate if needed)
- ✅ Check Vercel logs for the exact error

**Schema not created?**
```powershell
# Run this with production env vars set
npm run db:push
```

**Need to reset database?**
- Go to Turso dashboard → Your database → Settings → Delete
- Create a new one and repeat steps above

---

## Summary Checklist

- [ ] Got auth token from Turso dashboard
- [ ] Added to `.env.production.local`
- [ ] Ran `npm run db:push` to create tables
- [ ] (Optional) Ran `npm run db:seed` to add data
- [ ] Added environment variables to Vercel
- [ ] Deployed to Vercel
- [ ] Tested the deployed app

🎉 Once complete, your app will work perfectly on Vercel!

