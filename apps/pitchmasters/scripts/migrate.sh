#!/usr/bin/env bash
# Usage:
#   pnpm migrate <sql-file>          — run a single migration file
#   pnpm migrate --list              — list all migration scripts
#   pnpm migrate --check             — test DB connection only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
SQL_DIR="$APP_DIR/docs/database/sql-scripts"
ENV_LOCAL="$APP_DIR/.env.local"

# ── Load DIRECT_URL from .env.local (Python avoids shell $ expansion issues) ──
if [ ! -f "$ENV_LOCAL" ]; then
  echo "❌ .env.local not found at $ENV_LOCAL"
  echo "   Create it with: DIRECT_URL=\"postgresql://...\""
  exit 1
fi

DIRECT_URL=$(python3 -c "
import sys
with open('$ENV_LOCAL') as f:
    for line in f:
        line = line.strip()
        if line.startswith('#') or '=' not in line:
            continue
        key, _, val = line.partition('=')
        if key.strip() == 'DIRECT_URL':
            print(val.strip().strip('\"').strip(\"'\"))
            sys.exit(0)
sys.exit(1)
")

if [ -z "$DIRECT_URL" ]; then
  echo "❌ DIRECT_URL not found in .env.local"
  exit 1
fi

# ── Handle flags ──────────────────────────────────────────────────────────────
if [ "${1:-}" = "--check" ]; then
  echo "🔌 Testing connection..."
  result=$(psql "$DIRECT_URL" -c "SELECT current_database(), current_user, version();" 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ Connected successfully"
    echo "$result"
  else
    echo "❌ Connection failed:"
    echo "$result"
    exit 1
  fi
  exit 0
fi

if [ "${1:-}" = "--list" ]; then
  echo "📋 Migration scripts in $SQL_DIR:"
  ls -1 "$SQL_DIR"/*.sql 2>/dev/null | while read f; do
    echo "   $(basename "$f")"
  done
  exit 0
fi

# ── Run a migration file ──────────────────────────────────────────────────────
if [ -z "${1:-}" ]; then
  echo "Usage: pnpm migrate <sql-file>"
  echo "       pnpm migrate --list"
  echo "       pnpm migrate --check"
  exit 1
fi

SQL_FILE="$1"

# Allow bare filename (looks in sql-scripts dir automatically)
if [ ! -f "$SQL_FILE" ]; then
  SQL_FILE="$SQL_DIR/$1"
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ File not found: $1"
  echo "   Tried: $1"
  echo "   Tried: $SQL_DIR/$1"
  exit 1
fi

echo "🚀 Running migration: $(basename "$SQL_FILE")"
echo "   File: $SQL_FILE"
echo ""

psql "$DIRECT_URL" \
  --file="$SQL_FILE" \
  --set ON_ERROR_STOP=1 \
  --echo-errors \
  2>&1

echo ""
echo "✅ Migration complete: $(basename "$SQL_FILE")"
