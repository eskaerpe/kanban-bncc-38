# Architecture Decisions

## ADR-001: Canonical Prisma source

- **Status:** Accepted
- **Decision:** `backend/prisma/` is the canonical Prisma schema, migration, and seed location.
- **Reason:** The backend owns Prisma CLI execution, runtime client generation, migrations, and deployment. The root `prisma/` directory is retained temporarily as legacy material so it is not silently deleted.
- **Operational rule:** Run Prisma commands from `backend/` or through `npm --prefix backend ...`. Changes to the database model must be made in `backend/prisma/schema.prisma` and accompanied by a migration.
- **Follow-up:** Compare the legacy root schema/seed with the canonical source, archive or remove the duplicate only in a separately reviewed cleanup change.

## ADR-002: PostgreSQL/Supabase is the supported database target

- **Status:** Accepted
- **Decision:** The deployed application targets PostgreSQL through Supabase.
- **Reason:** `backend/prisma/schema.prisma` declares `provider = "postgresql"`, and `docs/DEPLOYMENT.md` uses Supabase pooler/direct URLs.
- **Impact:** MySQL/XAMPP instructions are historical and must not be treated as a supported setup path. New SQL, migrations, tests, and deployment instructions must target PostgreSQL.

## ADR-003: Keep the modular-monolith boundary

- **Status:** Accepted
- **Decision:** Keep one Express/Prisma backend and one React frontend. Introduce policy modules rather than splitting services prematurely.
- **Reason:** The current product is an internal Kanban MVP; authorization and workflow consistency are higher-value risks than service decomposition.
