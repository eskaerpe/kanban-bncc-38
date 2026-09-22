# Council Code Review — BNCC Proker Kanban

**Project:** `kanban-bncc-38`  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Review mode:** Single active model, three separated perspectives  
**Perspectives:** Solution Architect, Product Manager, CTO  
**Review scope:** Overall architecture, Kanban implementation, backend, frontend, security, testing, documentation, and delivery readiness

> This document is a structured multi-perspective review by one model. It does not represent three independent AI systems or a real vote.

---

## 1. Executive Verdict

The project already contains a real end-to-end MVP foundation, not merely a UI mockup.

Implemented areas include:

- Authentication and JWT-based session handling.
- Board/proker management.
- Board membership and roles.
- Five-column Kanban workflow.
- Card creation and editing.
- Drag-and-drop card movement.
- Division and priority filters.
- Assignee and due-date concepts.
- QC and revision status concepts.
- Activity/audit-log concepts.
- Prisma/PostgreSQL data layer.
- Vercel + Supabase deployment direction.

Current maturity assessment:

| Area | Assessment |
|---|---|
| Functional MVP foundation | **Present** |
| Kanban implementation | **Present** |
| Backend build | **Verified passing** |
| Frontend production build | **Verified passing** |
| Prisma schema validation | **Verified passing** |
| Backend smoke test | **Verified passing, shallow coverage** |
| Frontend lint | **Not passing; ESLint configuration issue** |
| Security regression coverage | **Insufficiently verified** |
| Production readiness | **Not yet verified** |

The primary risk is not absence of features. The primary risk is that permissions, QC rules, state transitions, and operational quality are not yet proven consistently at the backend and test level.

---

## 2. Evidence Collected

### 2.1 Verified commands

```text
npm --prefix backend run prisma:validate
```

Result: Prisma schema valid.

```text
npm --prefix backend run build
```

Result: TypeScript build passed.

```text
npm --prefix frontend run build
```

Result: Vite production build passed; 1595 modules transformed.

```text
npm --prefix backend run test:smoke
```

Result:

```text
Backend dummy smoke test passed
```

### 2.2 Current quality blockers

```text
npm --prefix frontend run lint
```

Fails because ESLint 10 cannot find an `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.cjs` flat configuration.

Dependency audit findings:

- Backend: moderate findings in the `qs` / `body-parser` / `express` dependency chain.
- Frontend: moderate findings in `react-router` / `react-router-dom`.
- A forced React Router upgrade may introduce a breaking change and must not be applied blindly.

### 2.3 Repository observations

- The working tree contains a local modification to `backend/.gitignore`.
- The repository contains both `backend/prisma/` and root `prisma/` paths; the canonical schema/migration source must be explicitly established.
- Some documentation/history refers to MySQL/XAMPP, while current deployment documentation and Prisma configuration use PostgreSQL/Supabase.

---

# 3. Kanban Code Review

## 3.1 Implementation locations

Core page:

```text
frontend/src/pages/BoardDetailPage.tsx
```

Components:

```text
frontend/src/components/KanbanColumn.tsx
frontend/src/components/CardItem.tsx
frontend/src/components/CardDetailModal.tsx
```

Frontend API:

```text
frontend/src/api/card.ts
frontend/src/api/board.ts
```

Backend:

```text
backend/src/controllers/card.controller.ts
backend/src/routes/card.routes.ts
backend/src/controllers/board.controller.ts
```

Database:

```text
prisma/schema.prisma
```

## 3.2 Kanban statuses

The frontend implements five columns:

```text
TO_DO
ON_PROGRESS
ON_QC
REVISION
DONE
```

The intended business flow is:

```text
TO_DO → ON_PROGRESS → ON_QC
                         ├── approve → DONE
                         └── reject  → REVISION
                                        ├── ON_PROGRESS
                                        └── ON_QC
```

## 3.3 Kanban strengths

- The status is represented as a domain enum rather than arbitrary UI strings.
- The board page groups cards by status and sorts them using `position`.
- Drag-and-drop is implemented with `@dnd-kit/core` and related packages.
- Optimistic UI movement and rollback behavior are present.
- Card filtering supports division, `My Division`, priority, and search.
- Card detail, creation, and movement are connected to backend APIs.
- The repository history indicates attention to atomic card reordering and composite indexes.

## 3.4 Kanban risks

### A. Backend transition policy must be explicit

The UI exposes movement between columns, but production correctness requires backend enforcement of:

- Previous status.
- Target status.
- Actor role.
- Board membership.
- Card division.
- QC authority.
- Required revision reason.
- Required approval metadata.

The frontend must never be the authority for workflow permission.

### B. QC should not be represented only by a status change

A robust QC decision should retain at least:

- Reviewer.
- Decision.
- Review timestamp.
- Reason/comment.
- Previous status.
- Target status.
- Revision number or review cycle when relevant.

An activity log is useful, but may not be sufficient as the sole source of QC decision data.

### C. Reordering needs concurrency tests

Cases that require verification:

- Two users reorder at the same time.
- The same card is moved repeatedly with stale client state.
- A card is moved between columns while another user edits it.
- A filtered view is active during drag-and-drop.
- Position calculation is performed against a filtered subset instead of the complete column.

### D. Scaling boundary is undefined

The current client-side loading and filtering approach is reasonable for a small-to-medium board, but there is no explicit operating limit. A large board may cause:

- Slow initial load.
- Large browser memory usage.
- Slower drag-and-drop rendering.
- Expensive search/filter operations.

Define when server-side filtering, pagination, or virtualization becomes necessary.

### E. Attachment boundaries require security review

Attachment/link behavior needs explicit rules for:

- Allowed URL schemes.
- SSRF prevention if the backend fetches URLs.
- XSS-safe rendering.
- File type and size limits if uploads are introduced.
- Supabase storage access policy.
- Authorization for reading and deleting attachments.

---

# 4. Solution Architect Perspective

## Verdict

The project has a valid modular web application foundation:

```text
React/Vite frontend
        ↓
Express/TypeScript API
        ↓
Prisma
        ↓
PostgreSQL/Supabase
```

It is suitable for continued MVP development and controlled internal pilot use. It is not yet proven as a production-grade workflow platform.

## Strengths

- Clear frontend/backend separation.
- TypeScript across application layers.
- Prisma enums and relational data model.
- JWT authentication with a required secret length.
- bcrypt password hashing.
- Zod input validation.
- Helmet, CORS configuration, and rate limiting.
- Activity logging foundation.
- Migration, seed, and deployment documentation.
- Serverless deployment direction is documented.

## Architecture risks

### 4.1 Authorization logic is distributed

Authorization appears in controllers rather than a centralized policy layer. This increases the risk that two endpoints enforce different rules.

Recommended policy surface:

```text
canViewBoard()
canManageBoard()
canManageMembers()
canCreateCard()
canEditCard()
canAssignCard()
canMoveCard()
canSubmitForQC()
canApproveQC()
canRejectQC()
canArchiveBoard()
```

### 4.2 Workflow logic should be a domain policy

Recommended boundary:

```text
authenticate
→ validate input
→ load domain context
→ authorize actor
→ validate workflow transition
→ execute transaction
→ write activity/audit event
→ respond
```

### 4.3 Prisma source of truth is ambiguous

Both of these paths exist:

```text
backend/prisma/
prisma/
```

This can create stale schema, migration, and seed confusion. One canonical location must be selected and documented.

### 4.4 Documentation and database target are inconsistent

Current deployment direction is PostgreSQL/Supabase, while parts of the project history/documentation mention MySQL/XAMPP. This can lead to incorrect local setup and invalid assumptions about database behavior.

Recommended official target: PostgreSQL/Supabase. Historical MySQL material should be clearly archived or marked unsupported.

### 4.5 Modular monolith is preferable to microservices

The project does not need microservices. A better next step is a modular monolith with separated:

- Services.
- Policies.
- Repositories.
- Validation schemas.
- Domain workflow rules.

---

# 5. Product Manager Perspective

## Verdict

The product has a coherent use case: manage BNCC proker execution through a board with division ownership and QC gates.

The main product risk is not lack of feature ideas. It is lack of explicit acceptance criteria proving that the workflow means what stakeholders think it means.

## Product strengths

- `ON_QC` and `REVISION` create a meaningful workflow beyond a generic task board.
- Division and assignee concepts match an organizational setting.
- Board archive supports proker lifecycle management.
- Search and filtering support operational use.
- Activity history can support accountability.

## Product risks

### 5.1 “Done” needs a precise definition

The product must specify whether `DONE` means:

- The card was dragged to the final column.
- QC approved it.
- A required deliverable was attached.
- A manager/C-level stakeholder approved it.
- All required acceptance criteria were met.

Recommended rule: `DONE` should be the result of a valid QC approval, with actor and timestamp recorded.

### 5.2 Role matrix is not yet an explicit product contract

The project references multiple global and board roles. The team needs a definitive action matrix for:

- Viewing boards.
- Creating boards.
- Managing members.
- Creating/editing cards.
- Moving cards.
- Submitting cards for QC.
- Approving/rejecting QC.
- Archiving boards.
- Deleting data.

### 5.3 Revision needs actionable feedback

A revision should preserve:

- Why it was rejected.
- What must change.
- Who requested the change.
- When it was requested.
- Which review cycle it belongs to.

### 5.4 Product metrics are not defined

Future metrics can include:

- Card aging.
- Overdue cards.
- Cycle time.
- Revision count.
- QC turnaround time.
- Completion rate by division.
- Board health.

These should be deferred until workflow correctness is stable.

### 5.5 Mobile UX requires dedicated validation

A five-column horizontal Kanban can be difficult on mobile. Build success does not verify:

- Touch drag behavior.
- Horizontal scrolling clarity.
- Modal usability.
- Filter accessibility.
- Small-screen card readability.

---

# 6. CTO Perspective

## Verdict

The system is technically buildable and has several appropriate hardening measures. However, release confidence is limited by weak automated coverage, a broken lint gate, unresolved moderate dependency findings, and unverified authorization/workflow behavior.

## Strengths

- JWT secret configuration fails fast when missing or too short.
- Authentication re-checks the user in the database.
- Passwords use bcrypt.
- Helmet is enabled.
- Rate limiting is present.
- Zod validation exists.
- Earlier commits addressed privilege escalation, IDOR, assignee authorization, and atomic reorder concerns.
- Production database URLs are documented as backend-only.
- No production credential filename was found among tracked files during this review; only example environment files were tracked.

## CTO risks

### 6.1 Authorization regression risk

Required tests include:

- Non-member cannot read a board.
- Non-member cannot read its cards.
- Non-member cannot mutate cards.
- User cannot edit another division’s card when policy forbids it.
- User cannot assign unauthorized users.
- Ordinary user cannot approve QC.
- Unauthorized user cannot remove members.
- Unauthorized user cannot archive/delete boards.

### 6.2 Token lifecycle needs explicit policy

The system should document:

- Token lifetime.
- Logout behavior.
- Role-change behavior after token issuance.
- Session revocation strategy.
- Whether refresh tokens are required.

### 6.3 CORS must be strict in production

Production should use exact configured origins and never depend on wildcard behavior.

### 6.4 Observability is minimal

Production should add:

- Structured logs.
- Request/correlation IDs.
- Error tracking.
- Latency metrics.
- Audit event monitoring.
- Database error alerts.

### 6.5 Rate limits should be endpoint-specific

Authentication and password-related endpoints should be stricter than read-only board endpoints.

### 6.6 Lint must be repaired before it is treated as a quality gate

The current lint command fails before evaluating the source code. This means code quality is not currently being checked by that command.

---

# 7. Cross-Critique

## Agreement

All perspectives agree that:

1. The project has a real working MVP foundation.
2. The Kanban feature is implemented and connected to backend APIs.
3. The biggest risks are authorization, QC enforcement, testing, and operational consistency.
4. New feature development should not outrun workflow hardening.
5. A modular monolith is sufficient; microservices are unnecessary.

## Key disagreement/trade-offs

### Client-side filtering vs server-side filtering

Client-side filtering is simpler and acceptable for a small board. Server-side filtering becomes necessary as board size grows. Define a threshold before optimizing prematurely.

### Activity log vs dedicated QC model

An activity log is simpler. A dedicated QC decision model is stronger for audit, reporting, and multiple review cycles. Because QC is central to the product, the dedicated model is recommended if the process is operationally important.

### Simplicity vs role complexity

The current controller approach is easy to understand initially. As role rules grow, centralized policy modules become necessary to avoid inconsistent enforcement.

---

# 8. Priority Findings

## P0 — Required before production or broad internal rollout

1. Define and approve the authorization matrix.
2. Enforce Kanban transition rules in the backend.
3. Enforce QC approval/rejection rules in the backend.
4. Add integration/security tests for board, card, member, and QC access.
5. Repair the frontend ESLint configuration.
6. Select one canonical Prisma source of truth.
7. Resolve PostgreSQL/Supabase versus MySQL/XAMPP documentation conflict.

## P1 — Required before routine operational use

1. Strengthen QC/revision data model.
2. Add Kanban E2E coverage.
3. Add mobile QA.
4. Remediate or formally accept dependency findings.
5. Add production logging and error monitoring.
6. Document token lifecycle and CORS policy.

## P2 — Post-stabilization enhancements

1. Product analytics.
2. Server-side filtering and pagination when volume requires it.
3. Notifications.
4. Realtime collaboration.
5. Advanced board health reporting.

---

# 9. Final Recommendation

Proceed with the project as an MVP/internal pilot, but do not label it production-ready yet.

The next investment should be workflow integrity rather than additional UI features:

```text
authorization matrix
→ backend policy enforcement
→ QC/revision contract
→ security/integration tests
→ lint/CI quality gate
→ deployment/documentation cleanup
```

The single most valuable next deliverable is an authorization and workflow test matrix that is implemented in backend policy code and automated tests.
