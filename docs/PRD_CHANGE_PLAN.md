# PRD Change Plan — BNCC Proker Kanban

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Inputs:**

- `docs/PRD.md` — reverse-engineered current-state baseline
- `docs/COUNCIL_PRD_REVIEW.md` — Solution Architect / PM / CTO council review
- `docs/UPDATE_PLAN.md` — previous implementation plan
- `docs/USER_AUTHORIZATION_ERD.md`
- `docs/SYSTEM_FLOW_AND_QC_GUIDE.md`

**Status:** Planning only — no application-code execution authorized in this phase.  
**Planning model:** active `codex-terra` via the requested single-model council process.  
**Execution rule:** switch/confirm the coding model before any implementation phase begins.

---

## 1. Purpose

This plan converts the council findings into a controlled sequence of documentation, contract, schema, backend, frontend, testing, and operational changes.

The plan intentionally does **not** start from UI screens. The highest-risk change is authorization: introducing multiple role assignments, division scope, and super-admin management without privilege escalation or ambiguity.

The desired result is a system where:

- users can self-register only with safe default access;
- privileged authorization is granted through a protected, auditable flow;
- one user may hold multiple approved roles when permitted by policy;
- division membership is explicit scope and is not silently treated as permission;
- board role remains distinct from global role;
- QC workflow decisions are deterministic and auditable;
- all sensitive mutations are enforced server-side;
- schema migration, seed, tests, release, and rollback are documented and verifiable.

---

## 2. Planning Principles

1. **Contract before code.** Resolve terminology and authority semantics before schema or UI changes.
2. **Backend is authoritative.** Frontend route guards and hidden buttons are usability features, not security controls.
3. **Scope is explicit.** Global authority, board authority, and division membership must be evaluated separately.
4. **Least privilege by default.** Registration creates the minimum usable account state.
5. **No implicit privilege.** Division membership, board creation, or legacy labels do not grant more authority unless the policy explicitly says so.
6. **Migration is a product change.** Existing users, boards, divisions, seeds, and tokens require a mapping strategy.
7. **Negative tests are mandatory.** Every sensitive action needs denied-case coverage.
8. **One task, one prompt, one commit.** Keep execution units reviewable and reversible.
9. **No destructive cleanup without confirmation.** Preserve user-owned changes, especially `backend/.gitignore`.
10. **No secrets in documentation or seed files.** Use placeholders such as `[REDACTED]` and environment-variable names only.

---

## 3. Scope and Non-Scope

### In scope

- PRD target-contract clarification.
- Canonical authorization vocabulary.
- Global role, board role, division scope, and effective-permission semantics.
- Self-registration and account lifecycle baseline.
- Super-admin authorization management.
- Five official divisions: `PR`, `EEO`, `HRD`, `R&D`, `LNT`.
- Role/division assignment auditability.
- Card workflow and QC policy contract.
- Schema/seed/migration strategy.
- Backend policy and API implementation plan.
- Frontend admin and permission-explanation plan.
- Automated testing and release gates.

### Not in the first implementation wave

- Arbitrary user-created roles.
- Microservice decomposition.
- Real-time collaboration unless later prioritized.
- Broad redesign of the Kanban UI.
- Email verification and password recovery before their launch priority is approved.
- Bulk import of real member data before a redacted, validated mapping is available.
- Any production migration before backup and rollback rehearsal.

---

## 4. Target Authorization Model to Approve

This is the proposed model for stakeholder approval, not yet an implementation instruction.

### 4.1 Identity

`User` represents an account and must include an explicit lifecycle state, subject to final naming approval:

- active;
- pending/awaiting approval, if required;
- disabled/suspended;
- optional email-verified state if email verification is adopted.

A self-registration request must not accept a global role, board role, or privileged division assignment from the client.

### 4.2 Global roles

A role catalog should replace hard-coded assumptions where the product needs multiple assignments. Each role definition must specify:

- stable code;
- display name;
- scope (`GLOBAL`, `BOARD`, or another explicitly approved scope);
- whether it can be assigned by a super admin;
- whether it is protected from self-assignment;
- which permissions it grants;
- whether it is mutually exclusive with another role;
- whether it is assignable to multiple users.

Do not finalize names such as `C-Level`, `Manager`, `DPI`, or `Koor` until BNCC confirms their meaning.

### 4.3 User-role assignments

A `UserRole` relationship should support multiple assignments with:

- user reference;
- role reference;
- optional scope reference if a role is scoped;
- assigning actor;
- created/revoked timestamps;
- optional reason;
- active/revoked state or a temporal model.

The exact representation must be selected before migration. A role assignment without scope and audit semantics is incomplete.

### 4.4 Divisions

The five official divisions are:

| Code | Name |
|---|---|
| `PR` | Public Relation |
| `EEO` | Event & External Event Organizer |
| `HRD` | Human Resource and Development |
| `R&D` | Research and Development |
| `LNT` | Learning and Training |

Use a stable machine code and a display name. Decide whether the database stores `R&D` literally or uses a machine-safe code such as `RND` with `R&D` as the display label; do not mix both forms in policy code.

Division membership is organizational scope. It must not automatically grant global administration, board administration, or QC approval.

### 4.5 Board roles

Keep board-level membership separate from global roles. Current board roles are `BOARD_ADMIN`, `KOOR_DIVISION`, and `STAFF`; their names and responsibilities require contract approval.

For each board role, define:

- board scope;
- member-management capability;
- card mutation capability;
- assignment capability;
- QC submission/approval/rejection capability;
- whether division match is required;
- conflict behavior when global and board permissions differ.

### 4.6 Effective permission calculation

The policy contract must answer, deterministically:

```text
Can actor perform action on resource?
= identity/account status check
+ global permission check
+ resource scope check
+ board membership check
+ division scope check where applicable
+ workflow transition check where applicable
```

The implementation must not use “first matching role” or frontend state as the authority. Define deny-by-default behavior for missing or conflicting context.

---

## 5. Phase 0 — Contract Freeze and Baseline Refresh

**Objective:** remove ambiguity before any code change.  
**No code implementation:** documentation and verification only.

### Tasks

- Refresh branch, commit, working tree, Node/npm, Prisma validation, backend build, frontend build, smoke test, lint, and dependency audit results.
- Preserve and document uncommitted user changes; do not include `backend/.gitignore` changes without explicit approval.
- Create a canonical glossary for:
  - global role;
  - board role;
  - division;
  - super admin;
  - board admin;
  - coordinator;
  - QC approver;
  - staff;
  - account status.
- Mark every unresolved term as `DECISION_REQUIRED`, not as an implementation fact.
- Add a target-state section to `docs/PRD.md` that is separate from the current-state evidence.
- Reconcile `docs/UPDATE_PLAN.md` with this plan or mark it superseded for authorization work.

### Deliverables

- Updated `docs/PRD.md`.
- `docs/AUTHORIZATION_GLOSSARY.md`.
- Baseline verification record, either in `docs/PRD.md` or a dedicated dated report.

### Exit criteria

- No role has two meanings across the active documents.
- Current code claims have file evidence.
- All stakeholder decisions are listed explicitly.
- Baseline commands have current outputs.

### Suggested commit

```text
docs(prd): freeze authorization vocabulary and target contract
```

---

## Phase 1 — Product and Authorization Decision Package

**Objective:** approve the business contract before schema design.

### Tasks

- Define personas and jobs-to-be-done for:
  - self-registering staff;
  - board administrator;
  - division coordinator/QC approver;
  - super administrator;
  - technical/deployment owner.
- Create an authorization matrix covering every sensitive action:
  - view board;
  - create/update/archive board;
  - manage board members;
  - create/update/delete card;
  - assign card users;
  - move card;
  - submit QC;
  - approve QC;
  - reject QC;
  - view activities;
  - add/delete attachments;
  - assign/revoke roles;
  - assign/revoke divisions;
  - disable/reactivate account.
- For every matrix row specify:
  - actor role;
  - resource scope;
  - required division relation;
  - allowed state transitions;
  - denial response;
  - audit event.
- Decide whether signup is open, invite-only, or approval-based.
- Decide whether one user may belong to multiple divisions.
- Decide whether privileged accounts are bootstrapped through environment configuration, a one-time command, or a controlled seed process.
- Decide role revocation behavior for already-issued JWTs.
- Decide whether email verification and password recovery are launch blockers.

### Deliverables

- `docs/AUTHORIZATION_MATRIX.md`.
- `docs/ACCOUNT_LIFECYCLE.md`.
- Updated `docs/PRD.md` with measurable outcomes and acceptance criteria.
- Decision log for unresolved BNCC policy questions.

### Exit criteria

- Every P0 action has an owner, scope, allow rule, deny rule, and audit requirement.
- No policy depends on an undefined role alias.
- Product owner approves the launch scope.

### Suggested commit

```text
docs(auth): define authorization and account lifecycle contracts
```

---

## Phase 2 — Target Data Model and Migration Design

**Objective:** design a safe database transition without executing it yet.

### Tasks

- Review `docs/USER_AUTHORIZATION_ERD.md` against the approved authorization matrix.
- Choose the target representation for:
  - role catalog;
  - user-role assignments;
  - division master data;
  - user-division assignments;
  - assignment audit events;
  - account status;
  - optional scoped roles.
- Define constraints:
  - unique user-role assignment;
  - unique user-division assignment;
  - protected role deletion behavior;
  - foreign-key delete behavior;
  - revoked assignment behavior;
  - audit immutability;
  - seed idempotency.
- Write a legacy mapping table:
  - current `GLOBAL_ADMIN` → approved target role(s);
  - current `USER` → approved default role(s);
  - current `BoardRole` values → target board role contract;
  - existing `Division.name` rows → stable division codes;
  - existing board member division references → preserved or remapped relation.
- Define whether legacy `global_role` remains during a compatibility window or is removed in the same migration.
- Define bootstrap-super-admin creation and recovery without storing credentials in Git.
- Define forward migration, verification query set, rollback trigger, and backup requirement.

### Deliverables

- Updated `docs/USER_AUTHORIZATION_ERD.md`.
- `docs/AUTHORIZATION_MIGRATION_MAP.md`.
- `docs/SEED_AND_BOOTSTRAP_POLICY.md`.
- Migration dry-run checklist.

### Exit criteria

- Every current record type has a deterministic mapping.
- No user can become privileged because of a default or null mapping.
- Migration and rollback behavior are reviewable before coding.

### Suggested commit

```text
docs(data): specify target authorization schema and migration map
```

---

## Phase 3 — Backend Policy and Schema Foundation

**Objective:** implement the approved contract in the backend before any admin UI.

**Execution gate:** requires explicit model switch/confirmation after this planning phase.

### Tasks

- Add the target Prisma models and migration according to Phase 2.
- Seed only approved master data and idempotent non-secret development fixtures.
- Enforce registration defaults server-side.
- Add account status checks to authentication and authorization.
- Implement a typed policy service for:
  - platform authorization;
  - board authorization;
  - division scope;
  - card mutation;
  - QC transition;
  - role/division assignment.
- Remove duplicated ad-hoc authorization checks where the policy service replaces them, preserving behavior until tests prove equivalence.
- Ensure role/division assignment and audit event are atomic.
- Define JWT behavior when account status or assignment changes.
- Add safe API error contracts that do not leak sensitive resource existence unnecessarily.

### Required backend API families

Names are provisional until the contract package approves them.

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/roles`
- `POST /api/admin/users/:id/roles`
- `DELETE /api/admin/users/:id/roles/:roleId`
- `GET /api/admin/divisions`
- `POST /api/admin/users/:id/divisions`
- `DELETE /api/admin/users/:id/divisions/:divisionId`
- `GET /api/admin/audit/authorization`

Every route requires backend authorization, validation, object-level checks, consistent errors, and audit behavior.

### Exit criteria

- Schema validation passes.
- Migration applies to a disposable database.
- Registration cannot request privileged access.
- Admin APIs reject non-admin callers through direct HTTP requests.
- Role and division assignment is auditable and idempotent.
- Existing board/card behavior is covered by regression tests.

### Suggested commit boundaries

```text
feat(auth): add target role and division authorization schema
feat(auth): enforce account lifecycle and registration defaults
feat(auth): add centralized authorization policy service
feat(admin): add protected role and division management APIs
```

---

## Phase 4 — Official Automated Verification

**Objective:** replace interim assertions with maintainable test coverage.

### Test layers

#### Unit tests

- role and scope resolution;
- deny-by-default behavior;
- role conflict behavior;
- account status behavior;
- every workflow transition;
- QC approval/rejection rules;
- division scope checks.

#### Integration/API tests

- self-registration with attempted privileged payload;
- admin grant/revoke role;
- admin grant/revoke division;
- non-admin direct API denial;
- cross-board access denial;
- cross-board member mutation denial;
- cross-card assignment/attachment/activity denial;
- role revocation and token behavior;
- audit event creation and immutability expectations.

#### Regression tests

- login and `/me`;
- board CRUD;
- board member management;
- card CRUD and movement;
- assignee operations;
- attachment and activity behavior;
- migration/seed repeatability.

#### Frontend verification

- lint with the repository's supported ESLint configuration;
- build;
- protected route behavior;
- admin route visibility as UX only;
- denial and loading/error states;
- role/division display and explanation.

### Exit criteria

- No P0 authorization rule is represented only by a manual script.
- Negative tests exist for every P0 sensitive endpoint.
- Build, lint, schema validation, and tests have reproducible commands.
- Failures are classified as code defects, environment blockers, or accepted dependency findings.

### Suggested commits

```text
test(auth): add authorization policy and privilege escalation coverage
test(workflow): add complete card and QC transition matrix
test(api): add object-level access and regression coverage
fix(tooling): restore frontend lint and CI quality gates
```

---

## Phase 5 — Frontend Admin and Permission UX

**Objective:** expose the approved capabilities without making the UI a security boundary.

### Tasks

- Add a protected admin console route only after backend authorization exists.
- User list:
  - search/filter;
  - account status;
  - current roles;
  - current divisions;
  - last relevant audit events.
- User detail:
  - grant/revoke approved roles;
  - grant/revoke divisions;
  - disable/reactivate account;
  - require reason where policy says so;
  - show effective authorization scope.
- Add clear denial messages for board/card/QC actions.
- Distinguish role authority from division membership in labels and help text.
- Handle stale permissions and server denial without trusting cached user state.
- Ensure mobile and desktop layouts are usable for the admin workflow.

### Exit criteria

- Every UI mutation maps to a tested backend endpoint.
- Unauthorized users cannot perform the operation by calling the API directly.
- A user can understand which role/division grants or limits an action.
- Audit history is visible according to the approved privacy policy.

### Suggested commits

```text
feat(admin-ui): add user authorization management console
feat(auth-ui): explain effective roles, divisions, and denied actions
```

---

## Phase 6 — Operational Readiness and Release

**Objective:** prove the system can be deployed and recovered safely.

### Tasks

- Validate environment variables at startup without printing secret values.
- Confirm production CORS allowlist.
- Confirm JWT secret requirements, expiry, rotation, and revocation behavior.
- Document database migration ownership and release order.
- Rehearse backup and restore on a disposable environment.
- Rehearse migration rollback or document the forward-fix procedure if rollback is technically unsafe.
- Define health/readiness checks and redacted structured logging.
- Review dependency vulnerabilities without force-updating blindly.
- Confirm rate-limit behavior for auth and admin endpoints.
- Review attachment URL security and object-level access.
- Record release evidence and known limitations.

### Release gate

A release is blocked if any of these are true:

- privileged access can be self-assigned;
- non-admin direct API calls succeed;
- migration mapping is unverified;
- role assignment has no audit event;
- P0 negative tests fail or do not exist;
- schema/build/test/lint status is unknown;
- backup/recovery ownership is undefined;
- secrets appear in logs, seed data, docs, or commits.

### Suggested commit

```text
docs(ops): document authorization release, recovery, and security gates
```

---

## 6. Traceability Matrix

| PRD gap | Plan phase | Primary deliverable | Verification |
|---|---:|---|---|
| `G-01` single global role | 1–3 | Authorization matrix, target role schema, policy service | role composition and denial tests |
| `G-02` no user-division relation | 1–3 | Target ERD, migration map, `UserDivision` implementation | scope and uniqueness tests |
| `G-03` no super-admin management | 1–5 | Admin API and console | direct API denial + UI flow tests |
| `G-04` incomplete privileged lifecycle | 1–3 | Account lifecycle and bootstrap policy | registration escalation and status tests |
| `G-05` division master contract | 1–3 | Stable code decision and idempotent seed | seed repeatability and mapping verification |
| `G-06` no authorization audit | 2–4 | Immutable assignment audit contract | grant/revoke audit tests |
| `G-07` incomplete official tests | 4 | Unit/integration/regression suite | reproducible quality gate |
| `G-08` no frontend admin console | 5 | Admin user/authorization UI | protected route and API-backed mutation tests |
| `G-09` recovery/verification lifecycle | 1, 6 | Account lifecycle decision and release scope | approved scope plus implementation tests if P0 |
| `G-10` distributed mutation authorization | 1–4 | Central policy contract/service | endpoint matrix and negative tests |
| `G-11` card edge-case semantics | 1, 4 | Workflow acceptance matrix | transition and reorder tests |
| `G-12` attachment URL limitations | 1, 4, 6 | Attachment security contract | object-level and access tests |
| `G-13` incomplete observability | 6 | Operations/release contract | health/logging verification |
| `G-14` incomplete backup/rollback | 2, 6 | Migration and recovery policy | rehearsal evidence |
| `G-15` production-readiness gaps | 0, 4, 6 | Baseline and release gates | recorded command outputs and sign-off |

---

## 7. Recommended Execution Order

```text
Phase 0: Contract freeze and baseline
    ↓
Phase 1: Product and authorization decisions
    ↓
Phase 2: Target data model and migration design
    ↓
Phase 3: Backend schema and policy foundation
    ↓
Phase 4: Official automated verification
    ↓
Phase 5: Frontend admin and permission UX
    ↓
Phase 6: Operational readiness and release
```

Do not invert this order by starting with:

- admin screens before protected APIs;
- seed rewrites before migration mapping;
- role labels before authorization semantics;
- production migration before backup/rollback rehearsal;
- convenience features before P0 negative tests.

---

## 8. Immediate Next Action After Model Switch

The next coding session should begin with **Phase 0 only**:

1. rerun the repository baseline;
2. inspect the current working tree and preserve user-owned changes;
3. write/approve the glossary and target authorization contract;
4. update PRD sections that currently mix as-is and to-be language;
5. stop for review before schema implementation.

No backend, frontend, Prisma, seed, migration, or deployment code should be changed until the Phase 0 and Phase 1 exit criteria are explicitly approved.

---

## 9. Planning Status

- Council review: completed in `docs/COUNCIL_PRD_REVIEW.md`.
- Change plan: this document.
- Application-code execution: intentionally not started.
- Model switch: required before implementation, per user instruction.
- Existing `docs/UPDATE_PLAN.md`: retained as historical/related planning input; authorization sections must be reconciled before use.
