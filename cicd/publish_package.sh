#!/usr/bin/env bash
set -euo pipefail
export NEXT_OUTPUT_MODE="export"
# 1. Install and build frontend dependencies
echo "🔧 Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

# 4. Move built frontend to backend/evalassist
SRC="frontend/out"
DST="backend/evalassist/static"
echo "📁 Moving built frontend from '$SRC' to '$DST' (overwriting)..."
rm -rf "$DST"
mv "$SRC" "$DST"

echo "✅ Done—frontend moved to backend/evalassist/out"

# Build the package
cd backend
poetry build

poetry config pypi-token.pypi "$PYPI_TOKEN"
poetry publish
