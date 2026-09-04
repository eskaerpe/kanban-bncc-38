### Migration Plan: Vercel + Supabase (PostgreSQL) Integration

#### 1. Database Layer (Prisma -> Supabase)
- Change `backend/prisma/schema.prisma` datasource provider from `mysql` to `postgresql`.
- Ensure PostgreSQL env vars mapping (`DATABASE_URL` with pooled transaction connection string, `DIRECT_URL` for migrations).

#### 2. Backend Serverless Refactor (Express on Vercel)
- Create Serverless entrypoint at `api/index.ts` or `backend/api/index.ts` exporting Express handler.
- Wrap Express app instance without binding fixed `app.listen()` for serverless serverless environments.
- Create root `vercel.json` configuring builds and serverless function rewrite rules (`/api/(.*)` -> Backend, `/(.*)` -> Frontend).

#### 3. Frontend API Client Adjustments
- Support dynamic API Base URL via `import.meta.env.VITE_API_BASE_URL` falling back to `/api` for Vercel unified routing.
- Re-enable live API calls by removing override mocks while keeping fallback configuration options.

#### 4. Project Configuration & Scaffolding
- Root `package.json` with workspace build scripts for Vercel.
- vercel.json multi-project configuration or root rewrite config.
