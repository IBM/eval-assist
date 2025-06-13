@ -0,0 +1,29 @@
#!/usr/bin/env bash
set -euo pipefail

# 1. Install frontend dependencies
echo "🔧 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 2. Generate Prisma clients
echo "📦 Generating Prisma for frontend..."
node shared/scripts/package_scripts.js prisma_prepare_frontend
cd frontend && npx prisma generate
cd ..

# 3. Build frontend
echo "🚧 Building frontend..."
cd frontend
npm run build
cd ..

# 4. Move built frontend to backend/evalassist
SRC="frontend/out"
DST="backend/evalassist/fe_build"
echo "📁 Moving built frontend from '$SRC' to '$DST' (overwriting)..."
rm -rf "$DST"
mv "$SRC" "$DST"

echo "✅ Done—frontend moved to backend/evalassist/out"
