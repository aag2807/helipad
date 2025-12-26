# Manual Turso Setup Guide (Windows)

Since the automatic installer isn't working, here are alternative methods:

## Option 1: Use GitHub Releases (Easiest)

1. Go to: https://github.com/tursodatabase/turso-cli/releases/latest
2. Download `turso-windows-amd64.exe` (or `turso-windows-arm64.exe` for ARM)
3. Rename to `turso.exe`
4. Move to a directory in your PATH, or add to PATH:
   - Create folder: `C:\turso`
   - Move `turso.exe` there
   - Add to PATH: `$env:Path += ";C:\turso"` (temporary)
   - Or add permanently via System Environment Variables

5. Verify installation:
   ```powershell
   turso --version
   ```

## Option 2: Use Scoop Package Manager

```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Turso
scoop install turso
```

## Option 3: Use WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
curl -sSfL https://get.tur.so/install.sh | bash

# Then use turso commands in WSL
```

## Option 4: Manual Setup via Web Dashboard (No CLI Needed!)

If CLI installation is problematic, use the web dashboard:

1. Go to: https://turso.tech/app
2. Sign up / Log in
3. Click "Create Database"
4. Name it "helipad"
5. Copy the "Database URL" (libsql://...)
6. Click "Create Token" and copy it

Then add to Vercel:
- `DATABASE_URL`: The database URL you copied
- `DATABASE_AUTH_TOKEN`: The token you copied

## After Setup

Once you have Turso credentials (from any method above):

1. **Add to Vercel Environment Variables:**
   ```
   DATABASE_URL=libsql://helipad-xxx.turso.io
   DATABASE_AUTH_TOKEN=eyJ...your-token...
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

2. **Push your schema to Turso:**
   ```bash
   # Temporarily set these in your terminal
   $env:DATABASE_URL="libsql://helipad-xxx.turso.io"
   $env:DATABASE_AUTH_TOKEN="eyJ...your-token..."
   
   # Push schema
   npm run db:push
   
   # Optional: Seed data
   npm run db:seed
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel deploy
   ```

## Recommended: Option 4 (Web Dashboard)

For Windows users having CLI issues, **just use the web dashboard**. It's the easiest and doesn't require any local installation!

## Important Notes

- ✅ Turso CLI is ONLY for management (creating DB, getting credentials)
- ✅ Your app uses `@libsql/client` which is already installed
- ✅ Vercel doesn't need the CLI - just environment variables
- ✅ You can do everything via the web dashboard if CLI doesn't work

