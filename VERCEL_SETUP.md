# Vercel Deployment Setup for Helipad

## Problem
SQLite with `better-sqlite3` doesn't work on Vercel because:
- Vercel uses serverless functions with read-only filesystem
- No persistent storage between function invocations
- Distributed architecture across multiple servers

## Solution: Use Turso (LibSQL)
Turso is a distributed SQLite database that works perfectly with Vercel's serverless architecture.

## Setup Instructions

### 1. Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm get.tur.so/windows | iex
```

### 2. Create a Turso Account

```bash
turso auth signup
```

### 3. Create Your Database

```bash
# Create a new database
turso db create helipad

# Get the database URL
turso db show helipad --url

# Create an auth token
turso db tokens create helipad
```

### 4. Update Local Development

For local development, you can continue using the local SQLite file:

```bash
# .env.local
DATABASE_URL="file:./helipad.db"
# DATABASE_AUTH_TOKEN is not needed for local file
```

### 5. Configure Vercel Environment Variables

In your Vercel project settings, add these environment variables:

```bash
DATABASE_URL="libsql://helipad-[your-org].turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
```

### 6. Push Schema to Turso

```bash
# Push your schema to the Turso database
npm run db:push
```

### 7. Seed the Database (Optional)

```bash
# Update DATABASE_URL in your .env to point to Turso temporarily
# Then run:
npm run db:seed

# Or create a seed script that reads Turso credentials
```

### 8. Deploy to Vercel

```bash
vercel deploy
```

## Alternative: Using Turso for Both Local and Production

You can use Turso for both environments:

```bash
# Create separate databases
turso db create helipad-dev
turso db create helipad-prod

# Get URLs and tokens for each
turso db show helipad-dev --url
turso db tokens create helipad-dev

turso db show helipad-prod --url
turso db tokens create helipad-prod
```

Then use:
- `helipad-dev` for local development
- `helipad-prod` for production on Vercel

## Testing Locally with Production Config

```bash
# .env.local
DATABASE_URL="libsql://helipad-dev-[your-org].turso.io"
DATABASE_AUTH_TOKEN="your-dev-auth-token"

npm run dev
```

## Other Vercel-Compatible Database Options

If you prefer not to use Turso, consider:

1. **Vercel Postgres** - Managed PostgreSQL
2. **PlanetScale** - Managed MySQL
3. **Neon** - Serverless Postgres
4. **Supabase** - PostgreSQL with real-time features

Note: These would require changing from SQLite to PostgreSQL/MySQL and updating Drizzle configuration.

## Turso Benefits

- ✅ SQLite-compatible (no schema changes needed)
- ✅ Edge-native and globally distributed
- ✅ Free tier: 9 GB storage, 1 billion row reads/month
- ✅ Low latency with embedded replicas
- ✅ Works perfectly with Vercel serverless

## Need Help?

- Turso Docs: https://docs.turso.tech
- Drizzle + Turso: https://orm.drizzle.team/docs/get-started-sqlite#turso
- Vercel Docs: https://vercel.com/docs

