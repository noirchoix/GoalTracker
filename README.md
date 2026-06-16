# GoalTracker — SvelteKit Goals/Notes (Zero-Native Build)

Lightweight goals/tasks tracker with a clean glass UI. Create, edit (PUT), complete, delete, take per-task notes, and “Audit” overdue items. Auth uses cookie sessions. Built to be **clone-and-run** (no C++ toolchains): password hashing uses Node `crypto.scrypt`, storage uses **sql.js** (SQLite/WASM) persisted to a local file.

## Features
- Auth: register/login, cookie sessions, floating logout
- Tasks: add, edit (PUT), complete, delete, notes, native date picker
- Audit: marks tasks *failed* when `createdAt + durationHours < now`
- UI: grey “glass” theme, accessible auth tabs, smooth transitions
- Persistence: file-backed **sql.js** at `data/dev.sqlite` (git-ignored)

## Tech
SvelteKit + TypeScript • `sql.js` • Node `crypto.scrypt` • Zod

## Quick start
```bash
# Node 18/20+ recommended
npm i
npm run dev
