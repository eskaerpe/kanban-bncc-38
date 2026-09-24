# Council Review — Reverse-Engineered PRD

**Project:** BNCC Proker Kanban  
**Repository:** `/mnt/d/Coding/kanban-bncc-38`  
**Subject:** `docs/PRD.md` and its relationship to the existing implementation plan  
**Review mode:** Single-model council using the active `codex-terra` model  
**Perspectives:** Solution Architect, Product Manager, CTO  
**Supporting lenses:** Framer, First Principles, Red Team, Evidence/Technical Reviewer, Executor  
**Scope:** Documentation review and change planning only. No application code was changed.

> This is a structured multi-perspective analysis by one active model, not independent model votes. The role separation is used to force disagreement and coverage.

---

## 1. Executive Verdict

`docs/PRD.md` is a useful reverse-engineered baseline, but it is **not yet an implementation-ready target PRD**. It correctly separates many current-state facts from gaps, but it still mixes three different artifacts:

1. an evidence-backed description of the current MVP;
2. a desired authorization/product direction; and
3. an implementation roadmap.

That mixture is acceptable for discovery, but dangerous as the direct source of truth for coding. The main risk is not missing features; it is implementing an authorization model whose terminology, authority boundaries, migration rules, and acceptance criteria are not yet unambiguous.

### Council decision

**Approve the PRD as a baseline discovery document, with conditions. Do not start implementation from it unchanged.**

Before code execution begins, produce a target-state amendment and a separate implementation plan that:

- freezes the current evidence snapshot;
- defines the canonical authorization vocabulary;
- separates global authority, board membership, and division membership;
- specifies self-registration and privileged-account bootstrap rules;
- defines migration/rollback and seed strategy;
- converts every P0/P1 gap into testable acceptance criteria;
- establishes the order of schema, policy, API, UI, and operational work.

**Confidence:** High for findings tied directly to repository files; medium for product decisions that still require BNCC stakeholder confirmation.

---

## 2. Frame

### Objective

Pressure-test the reverse-engineered PRD before it becomes the basis for changes to the BNCC Kanban application, then produce a safe, phased change plan without executing code changes yet.

### Constraints

- The current codebase is the source of truth for `Implemented` claims.
- Existing documentation may be aspirational and must not be treated as runtime evidence.
- The requested target includes self-registration, Discord-like multiple roles, super-admin authorization management, and five BNCC divisions: `PR`, `EEO`, `HRD`, `R&D`, and `LNT`.
- Backend authorization must remain authoritative; frontend visibility is not a security boundary.
- The current session must use the active `codex-terra` model for council and planning.
- This stage must not begin implementation or modify application code.
- Secrets, credentials, and plaintext passwords must not enter documentation.

### Decision criteria

1. Is the PRD factually grounded in the repository?
2. Can a coding agent implement it without inventing policy?
3. Does the authorization model prevent privilege escalation and ambiguous ownership?
4. Can the schema and seed changes be migrated safely?
5. Are product outcomes and acceptance tests explicit enough to decide whether the work is done?
6. Is the execution order risk-reducing and reversible?

### Facts versus decisions

**Evidence-backed facts:** current Prisma models, enums, routes, controllers, frontend routes, and verification notes recorded in the PRD.

**Product decisions still required:** exact global roles, whether divisions are memberships or permissions, who can approve users, whether one user may belong to multiple divisions, and the final QC authority matrix.

**Assumptions that must not silently become code:** role names proposed in older planning material, the meaning of `C-Level`, `Manager`, `DPI`, or `Koor`, and whether every board creator may create or archive boards.

---

## 3. Evidence Snapshot Used by the Council

The council reviewed the PRD, current implementation plan, and representative source files.

| Area | Current evidence | Council implication |
|---|---|---|
| Database | `backend/prisma/schema.prisma` uses PostgreSQL, `GlobalRole { GLOBAL_ADMIN, USER }`, `BoardRole { BOARD_ADMIN, KOOR_DIVISION, STAFF }`, `Division { id, name }`, and no `UserRole`/`UserDivision` junctions | The target multi-role and multi-division model is not implemented; migration design is a P0 dependency |
| Registration | `auth.controller.ts` creates a user with `GlobalRole.USER`, hashes the password, and issues a seven-day JWT | Self-registration exists, but account lifecycle, verification, approval, disable/revoke, and privileged bootstrap are incomplete |
| Auth routes | `/register`, `/login`, and authenticated `/me` exist | No admin user-management or authorization-management contract exists |
| Board routes | Authenticated create/read/update/delete and member mutation routes exist | Board access and member authority need a single explicit policy matrix; route presence is not proof of correct authorization |
| Card routes | Authenticated update, move, delete, assignee, attachment, and activity routes exist | Workflow enforcement exists in part, but all mutation and QC rules need a complete test matrix |
| Frontend routes | `App.tsx` exposes login, register, dashboard, and board detail | There is no verified admin console, role assignment UI, division management UI, or account lifecycle UI |
| Quality | Backend build and policy assertions were previously exercised; frontend lint and official test coverage remain incomplete per PRD | “Implemented” must remain distinct from “verified” and “production-ready” |
| Existing plan | `docs/UPDATE_PLAN.md` contains useful sequencing, but includes unresolved `TBD` authorization entries and terminology that is not yet canonical | The old plan should be reconciled, not blindly executed |

### Important evidence caveat

The PRD date and repository state are snapshots. Any implementation phase must rerun baseline commands and record the new commit, working tree, schema validation, builds, tests, and lint status before relying on the snapshot.

---

# 4. Perspective Findings

## 4.1 Solution Architect perspective

### What is sound

- Treating `backend/prisma/schema.prisma` as the canonical database source is the right direction.
- Separating current implementation from target gaps is essential for this repository.
- Centralized workflow policy is a better foundation than scattered controller conditions.
- The proposed target shape—modular monolith, explicit policy, transactional mutations, auditability, and automated tests—is proportionate to an internal application.

### Architectural risks

#### A. The authority model has three overlapping axes

The repository already has:

1. a global role (`GLOBAL_ADMIN` or `USER`);
2. a board role (`BOARD_ADMIN`, `KOOR_DIVISION`, `STAFF`); and
3. a division relation on board membership.

The requested Discord-like model introduces user-level multiple roles and user-level multiple divisions. Without a formal precedence rule, the same action can be allowed by one axis and denied by another. The PRD must define whether:

- global roles grant platform-wide authority;
- board roles grant authority only inside a board;
- division membership describes scope, not privilege; and
- a user can hold multiple board memberships with different roles.

**Required decision:** never encode authority by checking arbitrary labels in controllers. Define policy input as a typed context containing actor, target resource, board membership, division membership, and effective permissions.

#### B. “Role” is overloaded

The old plan uses terms such as `Global Admin`, `C-Level`, `Manager`, `DPI`, `Koor`, and `Staff`, while the current schema uses `GlobalRole` and `BoardRole`. The target request also uses “role like Discord.” These are not interchangeable concepts.

**Required decision:** create a canonical glossary and an authorization matrix before schema migration. Every role must state its scope, assignability, and maximum authority.

#### C. Schema migration is under-specified

Adding `UserRole` and `UserDivision` is not merely a Prisma model change. Existing users, board memberships, division rows, seed data, and any code reading `global_role` must be mapped. The plan needs:

- a forward migration;
- a compatibility/read strategy during rollout;
- a deterministic mapping from legacy `global_role`;
- a bootstrap-super-admin strategy;
- rollback criteria;
- seed idempotency;
- uniqueness and foreign-key rules; and
- an audit trail for assignment changes.

#### D. Authorization should not be inferred from division alone

A division such as `PR` or `R&D` is an organizational scope, not automatically a permission. Treating division membership as authorization would make data membership equivalent to administrative power and create privilege escalation risk.

#### E. Transaction and audit boundaries need to be explicit

Role assignment, division assignment, board membership changes, QC decisions, and card state changes should define whether the state mutation and its audit event are committed atomically. “Auditable” is not satisfied by a general activity list if assignment history can be altered or omitted.

### Architect recommendation

Define a policy kernel first, then migrate schema around the policy contract. Do not start with frontend role screens or seed rewriting.

---

## 4.2 Product Manager perspective

### What is sound

- The current product purpose is understandable: internal BNCC program-work tracking using Kanban.
- The PRD identifies the main journeys: registration, board usage, card workflow, assignment, and QC.
- The gap matrix gives the team a common vocabulary for prioritization.

### Product gaps

#### A. The outcome is not measurable

The PRD describes features but does not yet define success measures. A product owner cannot decide whether the target has succeeded using only “admin API exists” or “multi-role works.” Add measurable outcomes such as:

- every active user has a traceable account status and authorized scope;
- a privileged assignment can be granted, revoked, and audited without direct database edits;
- unauthorized cross-board and cross-division mutations are rejected consistently;
- a card can complete the agreed QC loop with a recorded decision;
- users can discover their effective permissions without reading implementation details.

Exact numeric targets require stakeholder confirmation; do not invent them.

#### B. User personas and jobs-to-be-done are thin

At minimum, distinguish:

- self-registering staff member;
- board administrator;
- division coordinator or QC approver;
- super administrator responsible for authorization;
- operational/technical owner.

Their needs and failure consequences differ. A super admin needs safe bulk visibility and audit history; staff needs a clear “why was this action denied?” response; a coordinator needs scoped QC authority.

#### C. Scope is at risk of expanding too early

Password recovery, email verification, account approval, multi-role management, division management, admin UI, QC refinement, observability, and production hardening are all valid work—but they should not be one undifferentiated P0. The product plan must separate launch blockers from post-MVP improvements.

#### D. The user-facing authorization experience is missing

If a user can have multiple roles, the product must explain:

- which roles they have;
- which divisions they belong to;
- where a permission applies;
- why an action is unavailable; and
- who can request or grant access.

A database model alone does not deliver the requested Discord-like experience.

### PM recommendation

Approve a narrow authorization foundation release first: safe signup, explicit bootstrap admin, deterministic permission checks, assignment audit, and a minimal admin workflow. Defer convenience features until this foundation is verified.

---

## 4.3 CTO perspective

### What is sound

- The plan correctly prioritizes security and workflow before visual feature expansion.
- It recognizes that frontend checks are UX only.
- It calls for build, lint, dependency, and test gates.
- It avoids a premature microservice split.

### CTO concerns

#### A. “Production-ready” is not currently testable

The PRD mentions backup/restore, observability, dependency remediation, and deployment readiness, but does not define owners, evidence, or release gates. Convert these into explicit checks:

- schema validation and migration dry run;
- build and lint;
- authorization integration tests;
- workflow transition tests;
- dependency review with a documented exception process;
- CORS/JWT configuration validation;
- backup/restore exercise;
- health/readiness behavior; and
- rollback procedure.

#### B. Security acceptance must cover object-level authorization

A role check is not enough. Tests must cover a legitimate user attempting to access another board, mutate another board's member list, move a card outside their scope, attach data to an unrelated card, and access activity history. These are the likely failure modes of a board application.

#### C. Token and account lifecycle are incomplete

The current registration path returns a long-lived JWT immediately. The PRD must decide whether that is acceptable for the internal launch. It also needs behavior for disabled users, role revocation while a token is still valid, logout/revocation expectations, and secret rotation. The correct behavior may be staged, but it must be explicit.

#### D. Operational constraints are missing

Before production, define supported deployment topology, environment variable validation, database migration ownership, logging redaction, rate-limit behavior, and recovery responsibility. No secret values belong in docs or seed files.

#### E. Quality gates must be real, not aspirational

The existing policy script is useful as an interim check, but it should become an official test suite. A green TypeScript build does not prove authorization correctness; a successful frontend build does not prove lint or user flow correctness.

### CTO recommendation

Treat the first implementation release as a security/data-foundation release with a hard release gate. No role-management UI should ship before backend policy and migration tests pass.

---

## 4.4 Framer lens

The real decision is not “which features should be added?” It is:

> What target authorization and workflow contract can be safely derived from the current MVP, approved by BNCC stakeholders, migrated without privilege leakage, and verified before implementation begins?

The PRD currently answers the current-state half well enough, but only partially answers the target-contract half. The plan must therefore contain a decision phase, not jump directly to coding.

---

## 4.5 First Principles lens

The system exists to give the right people the right ability to coordinate program work and approve quality transitions. From that goal:

1. Identity answers **who is acting**.
2. Scope answers **which organization, division, board, or card is affected**.
3. Permission answers **what action is allowed**.
4. Workflow policy answers **whether the state transition is valid**.
5. Audit answers **what happened and who changed authority or state**.

A role table that does not distinguish these five concerns will become a source of hidden coupling. The target model should be derived from these primitives rather than from labels alone.

---

## 4.6 Red Team lens

### Highest-risk failure modes

1. **Self-escalation:** a registration payload, admin endpoint, seed command, or migration lets a normal user gain a privileged role.
2. **Stale-token privilege:** a revoked role remains effective until JWT expiry.
3. **Cross-scope mutation:** a user can manipulate a board/card/member by guessing an ID.
4. **Role confusion:** board admin, global admin, coordinator, and division membership are treated as equivalent.
5. **Migration privilege leak:** legacy admin users are mapped too broadly or old columns remain authoritative unexpectedly.
6. **Audit gap:** assignment or QC mutation succeeds while its audit event fails or can be edited.
7. **Seed credential leak:** development bootstrap data contains reusable plaintext credentials.
8. **UI-only security:** buttons are hidden but direct API calls still succeed.
9. **Policy drift:** controller checks and policy modules disagree after a later feature is added.
10. **Terminology drift:** `R&D`/`RND`, `EEO`/legacy names, and role aliases produce duplicate or unreachable authorization rules.

### Red-team conclusion

The plan must make privilege boundaries and negative tests first-class deliverables. Happy-path screenshots are not sufficient evidence.

---

## 4.7 Evidence / Technical Reviewer lens

### Claims that are adequately grounded

- PostgreSQL is declared in the current Prisma datasource.
- Current global and board role enums are visible in the schema.
- Registration creates a default `USER` and issues a JWT.
- The frontend route set does not expose an admin console.
- The current repository has workflow policy work and incomplete official test/lint coverage as documented.

### Claims that require re-verification during implementation

- Exact authorization behavior of every board/card mutation.
- Whether duplicate middleware paths represent duplicate implementations or a naming inconsistency.
- Whether all current migrations and seeds match the canonical schema.
- Whether production CORS and JWT configuration are safe in deployed environments.
- Whether attachment URLs and activity endpoints enforce object-level scope.

### Documentation quality finding

The PRD is strongest when it uses status labels and file evidence. It becomes weaker where target requirements are written in the same narrative as current behavior. Add a hard separation between `As-is`, `To-be`, `Decision required`, and `Acceptance test`.

---

## 4.8 Executor lens

The smallest safe next step is not implementation. It is a contract package:

1. canonical glossary;
2. authorization matrix;
3. target-state data model and migration map;
4. account lifecycle decision;
5. endpoint and policy acceptance tests written before code;
6. phased implementation backlog with exit criteria.

This package can be reviewed by the project owner before a coding model is switched in. It also prevents a coding agent from inventing role semantics during implementation.

---

# 5. Cross-Critique

## Convergence

All perspectives converge on these points:

- The PRD is valuable as an as-is baseline.
- Authorization is the highest-risk area.
- The current schema cannot directly support the requested multi-role/multi-division target.
- Backend policy must be authoritative and tested negatively, not only positively.
- Existing `UPDATE_PLAN.md` is useful but not sufficient as the direct execution plan.
- No code should be changed until terminology and authority boundaries are approved.
- Migration, seed, audit, and rollback need equal status with feature implementation.

## Genuine tensions

### Tension 1 — Broad account lifecycle versus narrow P0

The PM lens wants a usable account lifecycle; the CTO lens wants the smallest security foundation. Resolution: make safe registration, account status, privileged bootstrap, and revocation behavior P0. Email verification and password recovery may be P1 unless BNCC requires them for launch.

### Tension 2 — Flexible Discord-like roles versus governance simplicity

Multiple roles are requested, but arbitrary role composition can create unreviewable privilege combinations. Resolution: support multiple assignments only after each role has scope, precedence, assignability, and conflict rules. Start with a small approved role catalog rather than a fully user-defined role system.

### Tension 3 — Division-first UX versus permission-first security

Users may think in divisions, but division membership must not automatically grant administrative power. Resolution: display divisions as scope and roles as authority; policy evaluates both explicitly.

## Strongest counterargument

It may be argued that the current internal MVP is small and can postpone formal authorization modeling until more users arrive. The council rejects postponing the foundational boundary. The requested feature is itself authorization management; implementing it informally would create migration and security debt at the exact point where privilege is introduced. Some convenience features can wait, but the authority contract cannot.

## Blind spots requiring stakeholder input

- Exact BNCC hierarchy and approved role names.
- Whether users may belong to multiple divisions concurrently.
- Whether board membership is always explicitly assigned or inferred from division.
- Who may approve QC for each division and board.
- Whether registration is open, invite-only, or approval-based.
- Required retention period and visibility of authorization audit logs.
- Deployment owner and recovery expectations.

---

# 6. Council Recommendation

Adopt a two-document model:

1. `docs/PRD.md` remains the reverse-engineered as-is and target-gap baseline, but receives a target-contract addendum.
2. `docs/PRD_CHANGE_PLAN.md` becomes the implementation plan for resolving the approved gaps.

Also create or update supporting contracts before code execution:

- authorization glossary;
- authorization matrix;
- target ERD/migration map;
- account lifecycle contract;
- workflow/QC acceptance matrix;
- release and rollback checklist.

Do not use `docs/UPDATE_PLAN.md` as the sole source of execution truth until its unresolved role terminology and `TBD` permissions are reconciled with the PRD.

---

# 7. Go / No-Go Gate for Starting Code Execution

## Go only when all are true

- [ ] Canonical role and division vocabulary is approved.
- [ ] Global role, board role, division scope, and effective permission semantics are documented.
- [ ] Self-registration cannot request privileged authorization.
- [ ] Bootstrap-super-admin and recovery procedure are defined without plaintext secrets.
- [ ] Legacy-to-target schema mapping is reviewed.
- [ ] Migration rollback and seed idempotency strategy are defined.
- [ ] P0 authorization and workflow acceptance tests are listed.
- [ ] Phase ownership and commit boundaries are assigned.
- [ ] Baseline build/test/lint/schema results are refreshed.

## No-go conditions

- Any role name still means different things in different documents.
- A coding agent must guess whether division grants permission.
- Admin assignment is protected only by frontend visibility.
- Existing legacy columns and new role tables can disagree without a precedence rule.
- A migration can create a privileged account without an auditable, controlled process.

---

## Final verdict

**PRD status:** Approved as reverse-engineered baseline; not approved as the sole implementation specification.  
**Existing plan status:** Directionally useful; requires reconciliation and replacement of unresolved authorization assumptions.  
**Implementation status:** Intentionally not started in this council/planning step.  
**Next artifact:** `docs/PRD_CHANGE_PLAN.md`.
