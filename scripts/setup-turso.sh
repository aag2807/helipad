#!/bin/bash

# Turso Setup Script for Helipad
# This script helps you set up Turso for Vercel deployment

echo "🚁 Helipad - Turso Setup Script"
echo "================================"
echo ""

# Check if turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI is not installed."
    echo ""
    echo "Please install it first:"
    echo "  macOS/Linux: curl -sSfL https://get.tur.so/install.sh | bash"
    echo "  Windows: irm get.tur.so/windows | iex"
    echo ""
    exit 1
fi

echo "✅ Turso CLI is installed"
echo ""

# Check if user is authenticated
if ! turso auth whoami &> /dev/null; then
    echo "⚠️  You're not logged in to Turso"
    echo ""
    echo "Please authenticate:"
    echo "  turso auth signup  (for new users)"
    echo "  turso auth login   (for existing users)"
    echo ""
    exit 1
fi

echo "✅ Authenticated with Turso"
echo ""

# Ask for database name
read -p "Enter database name (default: helipad): " DB_NAME
DB_NAME=${DB_NAME:-helipad}

echo ""
echo "Creating database: $DB_NAME"
turso db create $DB_NAME

echo ""
echo "📋 Database Information:"
echo "========================"
echo ""

# Get database URL
DB_URL=$(turso db show $DB_NAME --url)
echo "DATABASE_URL=$DB_URL"
echo ""

# Create auth token
echo "Creating auth token..."
DB_TOKEN=$(turso db tokens create $DB_NAME)
echo "DATABASE_AUTH_TOKEN=$DB_TOKEN"
echo ""

# Save to .env.production.local
echo "💾 Saving to .env.production.local"
cat > .env.production.local << EOF
# Turso Production Database
DATABASE_URL="$DB_URL"
DATABASE_AUTH_TOKEN="$DB_TOKEN"
EOF

echo "✅ Configuration saved!"
echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Add these environment variables to Vercel:"
echo "   - Go to your Vercel project settings"
echo "   - Navigate to Environment Variables"
echo "   - Add DATABASE_URL and DATABASE_AUTH_TOKEN"
echo ""
echo "2. Push your schema to Turso:"
echo "   npm run db:push"
echo ""
echo "3. (Optional) Seed your database:"
echo "   npm run db:seed"
echo ""
echo "4. Deploy to Vercel:"
echo "   vercel deploy"
echo ""
echo "🎉 Done! Your database is ready for Vercel deployment."

