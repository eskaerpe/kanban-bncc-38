# Backend Hardening Plan

## Goal

Fix the backend issues found during review that are deterministic, security-relevant, and testable without Supabase credentials. Preserve the existing API contract used by controllers/frontend (`title`, not `name`) and avoid unrelated refactors.

## Scope

### In scope

1. Synchronize board Zod schemas with controller behavior.
2. Make `/api/health` genuinely public by registering it before dynamic/protected routes.
3. Remove the hardcoded JWT fallback; fail fast when `JWT_SECRET` is absent or too weak.
4. Prevent public registration from creating `GLOBAL_ADMIN`; global admin bootstrap remains seed/controlled setup responsibility.
5. Improve input validation for board/card date and attachment payloads where the current controller can otherwise accept malformed data.
6. Update the backend environment example from MySQL to PostgreSQL/Supabase-compatible variables.
7. Add a credential-free smoke-test script using Node's built-in `fetch` and a dummy unreachable PostgreSQL URL. It will verify route/auth/validation behavior without pretending database operations succeeded.

### Explicitly deferred

- Revalidating every JWT against the database: requires a deliberate token revocation/role-change policy and would alter request latency/availability behavior.
- Restricting `/api/users` by role: the required product permission model is not explicit enough to safely choose the allowed role.
- Card position uniqueness/transactional reorder changes: requires database migration and dedicated concurrency tests.
- Full controller unit/integration test suite: requires selecting a mocking strategy and test runner; no test framework currently exists.

## Detailed changes

### 1. Validation contract

File: `backend/src/schemas/validation.schemas.ts`

- Change board create/update payload field from `name` to `title`.
- Add board update `status` enum matching `ACTIVE`/`ARCHIVED`.
- Validate numeric IDs as positive integers.
- Validate optional `due_date` as either null or a parseable ISO date string.
- Keep validation aligned with the controller and current frontend payload shape.

### 2. Public health route

File: `backend/src/app.ts`

- Register `GET /api/health` immediately after JSON middleware and before `/api` rate-limited/protected route mounts.
- Keep rate limiting on business API routes; health remains lightweight and public.

### 3. JWT configuration hardening

File: `backend/src/config/jwt.ts`

- Remove the production fallback secret.
- Throw during startup when `JWT_SECRET` is missing or shorter than a safe minimum.
- Keep the check deterministic so misconfiguration is caught before serving requests.

### 4. Registration privilege hardening

File: `backend/src/controllers/auth.controller.ts`

- New public registrations always receive `GlobalRole.USER`.
- Existing seed/admin provisioning remains the source of `GLOBAL_ADMIN` accounts.
- Remove the user-count race condition and privilege escalation path.

### 5. Environment documentation

File: `backend/.env.example`

- Replace the MySQL example with PostgreSQL URLs.
- Include `DIRECT_URL` because the Prisma schema declares it.
- Use a clearly non-production JWT placeholder and document that it must be replaced.

### 6. Dummy smoke tests

Files:
- `backend/scripts/smoke-test.cjs`
- `backend/package.json`

The script will start the compiled server with dummy DB URLs and test:

- `GET /api/health` -> `200` without auth.
- Protected boards route without auth -> `401`.
- Invalid login payload -> `400` validation response.
- Valid-looking registration with unreachable dummy DB -> `500`, proving the server is wired but not masking the missing DB.
- Server startup with missing JWT secret -> fails before serving.

The script must clean up the child process and exit non-zero on unexpected results.

## Execution order

1. Write this plan to `.hermes/plans/`.
2. Add/update smoke tests first and run them against the current code to capture expected red cases where practical.
3. Apply the minimal production changes.
4. Run `npm run prisma:validate`, `npm run prisma:generate`, `npm run build` in `backend`.
5. Run the dummy smoke test.
6. Review the final diff and run `git status`; do not commit.

## Risks and tradeoffs

- Existing deployments that relied on the fallback JWT secret will fail fast until `JWT_SECRET` is configured. This is intentional and safer than silently accepting a known key.
- Existing workflows that expect the first public registrant to become admin will stop doing so. Admin creation must happen through seed/provisioning instead.
- Health checks will no longer consume API rate-limit quota, which is generally desirable for platform probes.
- No Supabase schema/data migration is required for this scope.

## Acceptance criteria

- Board payloads accepted by controllers are accepted by Zod validation.
- `/api/health` returns `200` without a bearer token.
- Missing JWT secret prevents startup.
- Public registration cannot assign `GLOBAL_ADMIN`.
- Prisma schema validates and TypeScript compiles.
- Dummy smoke test passes without requiring Supabase credentials.
