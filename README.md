# GoalTracker — Full-Stack SvelteKit Task System

A full-stack SvelteKit task application built around a real relational SQLite/WASM schema, password/session security, per-user isolation, complete CRUD/state-transition semantics, and append-only task audit events. Its strongest value is the backend/security engineering hidden behind a simple productivity UI.

## Engineering profile

This repository demonstrates:

- `sql.js` SQLite/WASM persisted to a local file for zero-native builds
- Relational users, sessions, tasks, and task-log tables with indexes, foreign keys, and constraints
- Parameterized SQL operations
- Node `crypto.scrypt` password hashing with random salt and `timingSafeEqual` verification
- Persisted expiring sessions and cleanup of expired sessions
- Per-user query scoping/data isolation
- POST/GET/PATCH/PUT/DELETE semantics, completion/reopening, notes, history, and overdue-audit transitions

## Reliability and scope

File-backed sql.js is appropriate for a local/single-instance demonstration but should not be presented as a horizontally scalable multi-instance production datastore.

## Quick start
```bash
# Node 18/20+ recommended
npm i
npm run dev
```
