# 🚀 Quick Start: Deploy Helipad to Vercel

## ⚡ TL;DR

Your app uses SQLite, which **doesn't work on Vercel**. I've converted it to use **Turso** (cloud SQLite) instead.

## 🛠️ Setup (5 minutes)

### 1. Install Turso CLI

**Windows (PowerShell):**
```powershell
irm get.tur.so/windows | iex
```

**macOS/Linux:**
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2. Run Setup Script

**Windows:**
```powershell
cd heliport
.\scripts\setup-turso.ps1
```

**macOS/Linux:**
```bash
cd heliport
chmod +x scripts/setup-turso.sh
./scripts/setup-turso.sh
```

This will:
- Create your Turso database
- Generate auth token
- Save credentials to `.env.production.local`

### 3. Add to Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables (from `.env.production.local`):
   - `DATABASE_URL`
   - `DATABASE_AUTH_TOKEN`
   - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL)

### 4. Push Schema & Deploy

```bash
npm run db:push    # Push schema to Turso
npm run db:seed    # (Optional) Seed data
vercel deploy      # Deploy to Vercel
```

## ✅ What Changed

- **Before:** `better-sqlite3` (local file) ❌ Doesn't work on Vercel
- **After:** `@libsql/client` (Turso) ✅ Works on Vercel

## 📁 Files Modified

- `src/server/db/index.ts` - Changed to use libsql client
- `drizzle.config.ts` - Updated for Turso support

## 💻 Local Development

Your local dev setup still works! Just use:

```bash
# .env.local
DATABASE_URL="file:./helipad.db"
# No auth token needed for local file
```

## 🆘 Manual Setup (Without Script)

```bash
# 1. Create database
turso db create helipad

# 2. Get URL
turso db show helipad --url

# 3. Create token
turso db tokens create helipad

# 4. Add to Vercel environment variables
# DATABASE_URL=libsql://helipad-xxx.turso.io
# DATABASE_AUTH_TOKEN=your-token-here
```

## 💰 Turso Free Tier

- ✅ 9 GB storage
- ✅ 1 billion row reads/month
- ✅ 25 million row writes/month
- ✅ Perfect for most apps!

## 🔗 Helpful Links

- [Turso Docs](https://docs.turso.tech)
- [Drizzle + Turso Guide](https://orm.drizzle.team/docs/get-started-sqlite#turso)
- [Full Setup Guide](./VERCEL_SETUP.md)

## ❓ FAQ

**Q: Do I need to change my code?**  
A: No! Turso uses the same SQLite syntax. Your queries work as-is.

**Q: Can I still use local SQLite for development?**  
A: Yes! Use `file:./helipad.db` in your `.env.local`

**Q: What about my existing data?**  
A: Run `npm run db:seed` to populate your Turso database.

---

**Need help?** Check `VERCEL_SETUP.md` for detailed instructions.

