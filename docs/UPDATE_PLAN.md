# Update Plan — BNCC Proker Kanban

**Project:** `kanban-bncc-38`  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Basis:** `docs/COUNCIL_CODE_REVIEW.md`  
**Planning objective:** Move the project from functional MVP to a verifiable, maintainable, production-capable internal application.

> This is an implementation plan. It is intentionally ordered by risk reduction, not by visual feature appeal.

---

# 1. Target State

The target state is a modular monolith with:

- A single canonical Prisma schema/migration/seed source.
- Explicit authorization policies.
- Explicit Kanban transition rules.
- Auditable QC and revision decisions.
- Automated security and workflow tests.
- Working lint and CI quality gates.
- Consistent PostgreSQL/Supabase documentation.
- Production-safe configuration and observability.
- A Kanban UX validated on desktop and mobile.

Target request flow:

```text
HTTP request
  ↓
Authentication
  ↓
Input validation
  ↓
Load domain context
  ↓
Authorization policy
  ↓
Workflow transition policy
  ↓
Database transaction
  ↓
Activity/audit event
  ↓
Response
```

---

# 2. Delivery Principles

1. Do not add major product features before P0 workflow and security work is complete.
2. Backend authorization is the source of truth; frontend checks are UX only.
3. Every workflow rule must have at least one automated test.
4. Every schema change must have a migration and seed impact review.
5. Do not run `npm audit fix --force` without a branch, build, lint, and regression test.
6. Preserve existing behavior with incremental changes rather than a broad rewrite.
7. Do not delete duplicate or user-owned artifacts without inspecting differences and confirming the decision.
8. Keep the project as a modular monolith; do not introduce microservices for this scope.

---

# 3. Phase 0 — Baseline and Decisions

## Objective

Freeze the current baseline and eliminate ambiguity before modifying business behavior.

## Tasks

### 0.1 Record repository baseline

Capture:

- Current branch and commit.
- Working-tree changes.
- Node/npm versions.
- Backend build result.
- Frontend build result.
- Prisma validation result.
- Smoke test result.
- Lint result.
- Dependency audit result.

Commands:

```bash
git status --short --branch
git log --oneline -10
npm --prefix backend run prisma:validate
npm --prefix backend run build
npm --prefix frontend run build
npm --prefix backend run test:smoke
npm --prefix frontend run lint
npm --prefix backend audit --omit=dev
npm --prefix frontend audit --omit=dev
```

### 0.2 Decide canonical Prisma location

Compare:

```text
backend/prisma/
prisma/
```

Check differences in:

- `schema.prisma`.
- Migrations.
- Seed scripts.
- Package scripts.
- Deployment scripts.
- CI/Vercel configuration.

Decision requirement:

- Select one canonical source.
- Update package scripts.
- Update deployment docs.
- Update contributor docs.
- Archive or remove stale material only after review.

Recommended direction:

```text
backend/prisma/
```

because backend package scripts already reference it.

### 0.3 Decide official database target

Recommended decision:

```text
PostgreSQL + Supabase is the official target.
```

Then:

- Mark MySQL/XAMPP references historical or unsupported.
- Update README local setup.
- Update `docs/DEPLOYMENT.md`.
- Update `docs/data-model.md`.
- Update seed and migration instructions.

### 0.4 Approve role terminology

Create one glossary for:

- Global role.
- Board role.
- Division.
- Board admin.
- QC approver.
- Staff.
- Coordinator.
- Manager.
- C-Level.
- DPI.

## Exit criteria

- Canonical Prisma location approved.
- Official database target approved.
- Role names approved.
- Baseline results recorded.
- No undocumented destructive cleanup performed.

---

# 4. Phase P0 — Authorization and Workflow Contract

## Objective

Turn the intended business workflow into explicit, testable backend rules.

## 4.1 Adopt canonical authorization matrix

Canonical matrix specification is formalized in:

```text
docs/AUTHORIZATION_MATRIX.md
docs/AUTHORIZATION_GLOSSARY.md
```

All permissions are resolved with Zero-TBD as defined in the approved specification:

| Action | Super Admin | Board Admin | Koor Division (In-Scope) | Staff (Assigned) | Staff (Unassigned) |
|---|---|---|---|---|---|
| View public boards | Yes | Yes | Yes | Yes | Yes |
| View private boards | Yes | Yes (if member) | Yes (if member) | Yes (if member) | No |
| Create board | Yes | Yes | No | No | No |
| Archive/Delete board | Yes | Yes | No | No | No |
| Manage board members | Yes | Yes | No | No | No |
| Create card | Yes | Yes | Yes | Yes | No |
| Edit card details | Yes | Yes | Yes | Yes | No |
| Move TO_DO -> ON_PROGRESS | Yes | Yes | Yes | Yes | No |
| Submit ON_QC | Yes | Yes | Yes | Yes | No |
| Approve QC (-> DONE) | Yes | Yes | Yes (Non-assignee) | No | No |
| Reject QC (-> REVISION) | Yes | Yes | Yes (Non-assignee) | No | No |
| Delete card | Yes | Yes | No | No | No |
| Manage global roles/divisions | Yes | No | No | No | No |

Refer to `docs/AUTHORIZATION_MATRIX.md` for full edge cases and anti-self-approval enforcement.

## 4.2 Create authorization policy modules

Recommended files:

```text
backend/src/policies/board.policy.ts
backend/src/policies/card.policy.ts
backend/src/policies/member.policy.ts
backend/src/policies/workflow.policy.ts
backend/src/policies/index.ts
```

Recommended functions:

```typescript
canViewBoard(context)
canManageBoard(context)
canManageMembers(context)
canCreateCard(context)
canEditCard(context)
canAssignCard(context)
canMoveCard(context)
canSubmitForQC(context)
canApproveQC(context)
canRejectQC(context)
canArchiveBoard(context)
```

Policy functions should be deterministic and unit-testable. They should not depend on HTTP response objects.

## 4.3 Create workflow rules

Create:

```text
docs/workflow-rules.md
```

Minimum transition table:

| From | To | Actor requirement | Extra requirement |
|---|---|---|---|
| TO_DO | ON_PROGRESS | Authorized card worker | Card has required fields |
| ON_PROGRESS | ON_QC | Authorized card worker | Submission data complete |
| ON_QC | DONE | QC approver | Approval decision recorded |
| ON_QC | REVISION | QC approver | Revision reason required |
| REVISION | ON_PROGRESS | Authorized card worker | Revision acknowledged |
| REVISION | ON_QC | Authorized card worker | Resubmission data complete |

Reject invalid transitions with a stable 4xx response.

## 4.4 Enforce transition rules in backend

Implement a single service/policy path for movement:

```text
backend/src/services/workflow.service.ts
```

The movement operation must:

1. Authenticate the actor.
2. Validate request payload.
3. Load card, board, membership, division, and relevant role.
4. Validate authorization.
5. Validate `from_status` and `to_status`.
6. Validate QC/revision requirements.
7. Execute reorder and status update transactionally.
8. Write activity/audit record.
9. Return the updated card.

Do not trust a client-supplied previous status. Load the current status from the database.

## Exit criteria

- Role matrix approved.
- Workflow rules approved.
- Invalid transitions rejected by backend.
- QC approval/rejection cannot be bypassed by direct API calls.
- Unit tests cover every transition and actor category.

---

# 5. Phase P0 — QC and Revision Data Contract

## Objective

Make QC decisions auditable and useful instead of representing them only as a status.

## Tasks

### 5.1 Inspect current models

Review:

```text
Card
CardRevision
CardActivity
```

Identify what is already represented and what is missing.

### 5.2 Define QC decision data

Minimum recommended fields:

```text
id
card_id
reviewer_id
from_status
to_status
decision
comment
created_at
```

Optional but recommended:

```text
revision_number
required_changes
resolved_at
```

### 5.3 Define revision behavior

A rejection must preserve:

- Rejection reason.
- Reviewer.
- Review time.
- Review cycle.
- Current unresolved feedback.

### 5.4 Add migration and API contract

If schema changes are approved:

1. Update Prisma schema.
2. Create migration.
3. Update seed data.
4. Update validation schemas.
5. Update controller/service.
6. Update frontend API types.
7. Update modal UX.
8. Add integration tests.

## Exit criteria

- Every `DONE` transition has a QC decision actor and timestamp.
- Every `REVISION` transition has a reason.
- Review history is queryable.
- Frontend displays the actionable revision feedback.

---

# 6. Phase P0 — Test and Quality Gates

## Objective

Replace shallow confidence with automated evidence.

## 6.1 Repair frontend lint

Current problem:

```text
ESLint 10 cannot find eslint.config.js/mjs/cjs
```

Preferred approach:

- Add a modern flat config compatible with installed ESLint.
- Include TypeScript and React rules appropriate for the project.
- Exclude generated/build/dependency directories.
- Add lint execution to CI.

Alternative:

- Pin ESLint to a compatible version and use legacy configuration.

Do not choose an alternative without checking the current package configuration.

Exit command:

```bash
npm --prefix frontend run lint
```

Expected result: exit code 0 with no unreviewed errors.

## 6.2 Add backend unit tests

Test policy functions independently:

```text
backend/tests/policies/board.policy.test.ts
backend/tests/policies/card.policy.test.ts
backend/tests/policies/workflow.policy.test.ts
```

Cases:

- Member vs non-member.
- Board admin vs regular member.
- Division match vs mismatch.
- QC role vs non-QC role.
- Valid vs invalid transitions.
- Missing revision reason.

## 6.3 Add API integration tests

Minimum endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
GET  /api/boards
GET  /api/boards/:id
POST /api/boards/:id/cards
PUT  /api/cards/:id
PATCH/PUT card move endpoint
POST/PUT QC decision endpoint
```

Security cases:

- Missing token.
- Invalid token.
- Expired token.
- Deleted user.
- Non-member access.
- Wrong board membership.
- Unauthorized role.
- Invalid payload.

## 6.4 Add Kanban E2E tests

Recommended flow:

1. Register or seed test users.
2. Login.
3. Open board.
4. Create card.
5. Move card within a column.
6. Move card to another column.
7. Open card modal.
8. Update priority/due date/assignee.
9. Submit for QC.
10. Reject with revision reason.
11. Verify revision feedback.
12. Resubmit.
13. Approve and verify `DONE`.

## 6.5 Add concurrency tests

Test:

- Repeated movement of the same card.
- Simultaneous reorder requests.
- Stale position payload.
- Card move while another update occurs.

## Exit criteria

- Unit, integration, and E2E test commands exist.
- Security cases are automated.
- Kanban workflow is automated end-to-end.
- CI fails on test/lint/build failure.

---

# 7. Phase P1 — Documentation and Repository Hygiene

## Objective

Remove contradictory instructions and reduce maintenance risk.

## Tasks

### 7.1 Synchronize documentation

Review and update:

```text
README.md
docs/DEPLOYMENT.md
docs/data-model.md
docs/TESTING.md
docs/TASKS.md
docs/BIG_PICTURE.md
```

Ensure terminology matches implementation:

- PostgreSQL/Supabase versus MySQL/XAMPP.
- Actual package scripts.
- Actual Prisma path.
- Actual environment variable names.
- Actual API routes.
- Actual role names.
- Actual Kanban statuses.

### 7.2 Add architecture decision records

Recommended:

```text
docs/adr/0001-official-database.md
docs/adr/0002-prisma-source-of-truth.md
docs/adr/0003-workflow-authorization.md
docs/adr/0004-qc-audit-model.md
```

### 7.3 Review tracked files and secrets

Check:

```bash
git ls-files | grep -Ei '(^|/)(\.env($|\.)|credentials|.*\.(key|pem|p12)$)'
```

Review any result manually. Do not delete files automatically.

### 7.4 Resolve local working-tree change

Inspect the existing modification:

```bash
git diff -- backend/.gitignore
```

Then decide whether to:

- Keep and commit it.
- Revert it.
- Replace it with a deliberate ignore rule.

This must be a conscious repository decision.

## Exit criteria

- No contradictory official setup instructions.
- One canonical schema location documented.
- Architecture decisions recorded.
- Sensitive-file review complete.
- Local changes accounted for.

---

# 8. Phase P1 — Security and Operational Hardening

## Objective

Raise the application from development-safe to operationally defensible.

## 8.1 Dependency remediation

Current audit findings include moderate issues in backend and frontend dependencies.

Process:

1. Create a dependency update branch.
2. Review advisory and affected version range.
3. Apply the smallest non-breaking update first.
4. Avoid `--force` initially.
5. Run build, lint, unit, integration, and E2E tests.
6. Review routing behavior after React Router changes.
7. Document accepted residual risk if an update is not yet safe.

Commands to run after updates:

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run prisma:validate
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend run test:smoke
npm --prefix backend audit --omit=dev
npm --prefix frontend audit --omit=dev
```

## 8.2 Token lifecycle

Document and implement decisions for:

- Access-token lifetime.
- Refresh-token requirement.
- Logout behavior.
- Session revocation.
- Role changes after token issue.
- Password-change invalidation.

## 8.3 CORS

Production configuration must:

- Use exact origins.
- Avoid wildcard origins.
- Separate production and preview origins.
- Be tested against the actual deployment.

## 8.4 Rate limits

Use endpoint-specific limits:

```text
/register: strict
/login: strict
password-related endpoints: very strict
read endpoints: moderate
mutation endpoints: moderate
```

## 8.5 Attachment security

Define and test:

- URL scheme allowlist.
- File size limit.
- MIME/type validation.
- Storage access policy.
- Authorization for read/delete.
- Safe rendering.
- SSRF prevention where relevant.

## 8.6 Observability

Add:

- Structured JSON logs.
- Request ID/correlation ID.
- Error tracking.
- Request latency measurements.
- Database error logging.
- Audit event monitoring.

## Exit criteria

- Security policy is documented.
- High-risk endpoints have dedicated rate limits.
- Production CORS is strict.
- Dependency findings are remediated or formally accepted.
- Operational failures are observable.

---

# 9. Phase P1 — Kanban UX and Mobile QA

## Objective

Verify that the core product works for real users, not only in a desktop build.

## Tasks

### 9.1 Desktop QA

Verify:

- Loading state.
- Empty state.
- Error state.
- Five-column layout.
- Drag within column.
- Drag across columns.
- Rollback after failed API request.
- Search.
- Division filter.
- Priority filter.
- Card modal.
- Board archive.
- Member management.

### 9.2 Mobile QA

Test at minimum:

```text
360px width
390px width
tablet width
desktop width
```

Verify:

- Horizontal column navigation.
- Touch drag behavior.
- Card readability.
- Modal scrolling.
- Filter controls.
- Keyboard/focus behavior.
- Error messages.

### 9.3 Accessibility

Check:

- Keyboard movement.
- Visible focus states.
- Button labels.
- Dialog semantics.
- Color contrast.
- Status not conveyed by color alone.
- Drag-and-drop alternative for keyboard users.

## Exit criteria

- Critical desktop and mobile issues resolved.
- Keyboard flow is usable.
- Kanban status meaning is visible without relying only on color.

---

# 10. Phase P2 — Scale and Product Enhancements

Do not start this phase until P0 and P1 exit criteria are met.

## 10.1 Server-side card querying

Introduce query parameters as volume requires:

```text
GET /boards/:id/cards?status=&division_id=&priority=&search=&page=&limit=
```

Add indexes based on measured query patterns.

## 10.2 Analytics

Build from activity/QC data:

- Card aging.
- Cycle time.
- Overdue cards.
- Revision count.
- QC turnaround.
- Completion per division.
- Board health.

## 10.3 Notifications

Only after authorization and event semantics are stable:

- Assignment notification.
- QC submission notification.
- Revision notification.
- Approval notification.
- Due-date reminder.

## 10.4 Realtime updates

Before implementation, define:

- Source of truth.
- Conflict handling.
- Stale update behavior.
- Reorder event semantics.
- Offline/reconnect behavior.

---

# 11. Recommended File Changes

## New files

```text
docs/authorization-matrix.md
docs/workflow-rules.md
docs/adr/0001-official-database.md
docs/adr/0002-prisma-source-of-truth.md
docs/adr/0003-workflow-authorization.md
docs/adr/0004-qc-audit-model.md
backend/src/policies/board.policy.ts
backend/src/policies/card.policy.ts
backend/src/policies/member.policy.ts
backend/src/policies/workflow.policy.ts
backend/src/services/workflow.service.ts
backend/tests/policies/*.test.ts
backend/tests/integration/*.test.ts
frontend/eslint.config.js
```

The exact ESLint filename may differ depending on the selected configuration strategy.

## Existing files likely requiring updates

```text
README.md
docs/DEPLOYMENT.md
docs/data-model.md
docs/TESTING.md
docs/TASKS.md
docs/BIG_PICTURE.md
backend/src/controllers/board.controller.ts
backend/src/controllers/card.controller.ts
backend/src/controllers/attachment.controller.ts
backend/src/schemas/validation.schemas.ts
backend/src/routes/card.routes.ts
frontend/src/pages/BoardDetailPage.tsx
frontend/src/components/CardDetailModal.tsx
frontend/src/api/card.ts
frontend/package.json
backend/package.json
prisma/schema.prisma
backend/prisma/schema.prisma
```

Do not update both Prisma schema locations blindly. First complete the Phase 0 comparison and canonical-source decision.

---

# 12. Definition of Done

The project can be considered ready for a controlled production/internal rollout when all of the following are true:

## Architecture

- [ ] One canonical Prisma source of truth.
- [ ] Official PostgreSQL/Supabase target documented.
- [ ] Authorization policies centralized.
- [ ] Workflow transition policy centralized.

## Product behavior

- [ ] Role/action matrix approved.
- [ ] `DONE` definition approved.
- [ ] QC approval and rejection behavior approved.
- [ ] Revision feedback is actionable and persistent.

## Engineering quality

- [ ] Backend build passes.
- [ ] Frontend build passes.
- [ ] Prisma validation passes.
- [ ] Frontend lint passes.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] E2E Kanban tests pass.
- [ ] Security regression tests pass.

## Security

- [ ] Non-member access is blocked.
- [ ] Role escalation paths are blocked.
- [ ] Workflow bypass is blocked.
- [ ] Production CORS is strict.
- [ ] Token lifecycle is documented.
- [ ] Attachment boundaries are secured.
- [ ] Dependency findings are remediated or formally accepted.

## Operations

- [ ] Structured logging exists.
- [ ] Errors are observable.
- [ ] Database failures are monitored.
- [ ] Deployment variables are documented.
- [ ] Rollback procedure exists.

## UX

- [ ] Kanban works on desktop.
- [ ] Kanban works on mobile.
- [ ] Keyboard navigation is usable.
- [ ] Loading, empty, and error states are covered.

---

# 13. Execution Order Summary

```text
Phase 0: Baseline + architecture/product decisions
    ↓
P0: Authorization matrix + workflow rules
    ↓
P0: Backend policy enforcement + QC data contract
    ↓
P0: Unit/integration/E2E/security tests
    ↓
P0: Lint and CI repair
    ↓
P1: Documentation and Prisma cleanup
    ↓
P1: Dependency/security/observability hardening
    ↓
P1: Desktop/mobile/accessibility QA
    ↓
P2: Analytics, scale, notifications, realtime
```

The correct next move is to complete Phase 0 and P0 before expanding the feature surface.
