#!/usr/bin/env bash
set -euo pipefail

# 1) Make sure nvm (Windows) is available
if ! command -v nvm >/dev/null 2>&1; then
  echo "❌ nvm (Windows) not found on PATH."
  echo "   Install NVM for Windows, reopen the terminal, then re-run this script."
  exit 1
fi

# 2) Install & use Node 20 LTS (latest 20.x)
echo "→ Installing Node 20 via nvm…"
nvm install 20
nvm use 20

# 3) Verify we’re really on Node 20
NODE_V="$(node -v 2>/dev/null || true)"
case "$NODE_V" in
  v20.*) echo "✔ Using $NODE_V";;
  *)
    echo "❌ Still on $NODE_V. Open a NEW terminal (so PATH refreshes) and re-run this script."
    exit 1
    ;;
esac

# 4) Clean old deps/locks
echo "→ Cleaning node_modules and lockfiles…"
rm -rf node_modules package-lock.json pnpm-lock.yaml yarn.lock

# 5) Refresh SvelteKit types and reinstall deps
echo "→ Verifying npm cache…"
npm cache verify || true

echo "→ Syncing SvelteKit types…"
npx svelte-kit sync

echo "→ Installing native deps…"
npm i better-sqlite3 argon2 zod

echo "✅ Done. You can now run:  npm run dev"
