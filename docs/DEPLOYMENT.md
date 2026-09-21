# Deployment: Vercel + Supabase

Production consists of one Vercel project and one Supabase project. The preview
branches are separate: `preview-no-login` and `gh-pages-preview` are static,
dummy-data prototypes and must not be merged into the production deployment.

## Supabase

1. Create a Supabase project.
2. Copy the pooler connection string into `DATABASE_URL`.
3. Copy the direct database connection string into `DIRECT_URL`.
4. Run the migration from the repository root:

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
```

`DATABASE_URL` is used by the serverless runtime. `DIRECT_URL` is used by Prisma
CLI migrations and must not be exposed to the frontend.

## Vercel

Import the repository as a Vercel project using the repository root as the
project root. `vercel.json` routes `/api/*` to the Express serverless handler
and serves the Vite build for all other paths.

Configure these Vercel environment variables for Production and Preview:

```env
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
CORS_ORIGIN=https://your-project.vercel.app
```

Do not set `VITE_API_BASE_URL` in the unified deployment; the frontend then
uses the same-origin `/api` route. For a separately hosted frontend, set it to
the full backend API URL ending in `/api`.

Deploy with:

```bash
npm install
npm run build
```

The Vercel build command is defined in `vercel.json` and generates Prisma Client
before building the frontend.

## Local development

Copy `.env.example` to `backend/.env`, fill in Supabase credentials, then run:

```bash
npm run dev:backend
npm run dev:frontend
```

The frontend Vite proxy forwards `/api` requests to `http://localhost:5000`.