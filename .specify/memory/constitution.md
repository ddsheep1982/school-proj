<!--
SYNC IMPACT REPORT
==================
Version change:         NEW → 1.0.0
Modified principles:    N/A (initial ratification — no prior principles existed)

Added sections:
  - Core Principles (I–V)
  - Technology & Stack Constraints
  - Development Workflow
  - Governance

Removed sections:       N/A

Templates requiring updates:
  ✅ .specify/memory/constitution.md              (this file — written)
  ✅ .specify/templates/plan-template.md          (Constitution Check section is dynamic;
                                                   gates now resolve against the 5 principles
                                                   defined here — no structural rewrite needed)
  ✅ .specify/templates/spec-template.md          (no new mandatory sections required;
                                                   existing template structure is sufficient)
  ✅ .specify/templates/tasks-template.md         (Test-First principle reinforces the existing
                                                   "tests MUST fail before implementation" note;
                                                   no structural rewrite needed)
  ✅ .specify/templates/checklist-template.md     (generic template — no principle-specific
                                                   references to update)
  ✅ .specify/templates/agent-file-template.md    (generic template — no updates needed)
  ✅ .claude/commands/speckit.plan.md             (references constitution.md generically — ok)
  ✅ .claude/commands/speckit.tasks.md            (no principle-specific references — ok)

Follow-up TODOs:
  - DONE(TECH_STACK): Technology & Stack Constraints section resolved from feature 001 (2026-03-14).
-->

# School Platform Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

TDD is MANDATORY for all feature work:

- Tests MUST be written before any implementation code is written.
- Tests MUST be observed to fail (Red phase) before implementation begins.
- Implementation MUST be the minimum code required to make the tests pass (Green phase).
- Code MUST be refactored only while tests remain green (Refactor phase).
- No feature is considered complete until its automated tests pass.

**Rationale**: In an education platform, correctness of grade calculations, enrollment logic,
and assignment tracking directly affects students and teachers. TDD ensures every behavior is
explicitly specified and verified before it ships, making regressions visible immediately.

### II. Simplicity (YAGNI)

The simplest solution that satisfies the current requirement MUST be chosen:

- Features MUST NOT be built for hypothetical future use cases.
- Abstractions MUST only be introduced when the same logic appears in three or more places.
- New dependencies MUST be justified by a current need, not an anticipated one.
- Any non-trivial complexity in a design MUST be documented with an explicit justification
  in the plan's Complexity Tracking table.

**Rationale**: Education platforms accumulate scope quickly. Enforcing YAGNI keeps the codebase
maintainable for a small team, reduces onboarding friction, and ensures effort is spent on
delivering user value rather than speculative architecture.

### III. Data Integrity

Student, grade, and enrollment records are authoritative and MUST be treated accordingly:

- All write operations on these records MUST be validated at the service layer before
  reaching the database.
- Destructive operations (hard deletes, bulk updates) MUST require explicit confirmation
  and MUST produce an audit log entry.
- Database schema changes MUST be expressed as versioned, reversible migrations and
  MUST be reviewed before being applied to any shared environment.

**Rationale**: Grade and enrollment data has real-world consequences for students. Data loss
or corruption is not recoverable from either a technical or reputational standpoint.

### IV. Security & Access Control

Authentication and authorization are non-negotiable on every endpoint:

- All API endpoints MUST be authenticated unless explicitly designated public in the
  feature spec and approved in code review.
- Role-based access control (RBAC) MUST be enforced: students, instructors, and
  administrators have distinct, non-overlapping permission sets.
- Sensitive values (passwords, tokens, PII) MUST never be logged or stored in plaintext.
- All input from external sources (user input, third-party APIs) MUST be validated and
  sanitized before processing.

**Rationale**: Education platforms frequently handle data belonging to minors. Access control
failures create both privacy risks and legal liability under applicable regulations.

### V. API-First Design

Contracts MUST be defined and reviewed before implementation begins:

- API schemas and endpoint contracts MUST be written (in `contracts/`) and approved as
  part of the plan phase, before any backend or frontend implementation starts.
- Breaking API changes MUST increment the API major version and MUST include a documented
  migration path for existing consumers.
- Internal services and the frontend MUST treat published contracts as the source of truth,
  not implementation details.

**Rationale**: The platform involves multiple consumers (web UI, potential mobile clients,
admin tools). Clear contracts enable parallel development across the frontend and backend and
reduce integration failures at delivery time.

## Technology & Stack Constraints

_Resolved from feature 001 (2026-03-14)._

- **Language/Runtime**: TypeScript, Node.js 20+
- **Web Framework**: Next.js 16 (App Router) — full-stack, server components + server actions
- **Database**: PostgreSQL 14+ via Prisma 7 ORM with `@prisma/adapter-pg` driver adapter
- **Testing Framework**: Jest 29 + ts-jest (unit/integration), Playwright (e2e — planned)
- **Frontend**: React 19, Tailwind CSS 4 — server components by default, `"use client"` for interactive forms
- **Auth Mechanism**: NextAuth.js v5 (beta), credentials provider, JWT session strategy
- **Validation**: Zod 4 — all action inputs validated at the boundary; schemas in `src/types/index.ts`
- **Audit**: `src/lib/audit.ts` — `writeAuditLog()` called in every mutating server action
- **Prisma Client Output**: `src/generated/prisma/client` (Prisma 7 driver-adapter pattern)

**Conventions**:
- All server mutations go through `src/actions/*.actions.ts` files with `"use server"` directive
- Every action calls `requireAuth()` or `requireRole("ADMIN")` before any DB access
- URL search params drive all list filters; no client-side state library required

## Development Workflow

All contributors MUST follow this workflow for every feature:

1. **Spec-first**: A feature spec (`spec.md`) MUST be approved before a plan is created.
2. **Plan-before-code**: A feature plan (`plan.md`) MUST be approved before tasks are
   generated or implementation begins.
3. **TDD gate (Principle I)**: Tests MUST be written and confirmed failing before
   implementation code is written for any task.
4. **Constitution Check**: Every `plan.md` MUST include a Constitution Check section
   verifying compliance with all five Core Principles before Phase 0 research begins and
   again after Phase 1 design is complete.
5. **Code review**: All changes MUST be reviewed before merge. Constitution compliance is
   a required review criterion — non-compliant PRs MUST document violations in the
   plan's Complexity Tracking table with justification.
6. **Checkpoint validation**: Each user-story checkpoint in `tasks.md` MUST be validated
   independently before work on the next user story begins.

## Governance

This Constitution supersedes all other development practices and conventions in this
repository. In cases of conflict, the Constitution takes precedence.

**Amendment procedure**:
- Amendments MUST be proposed as a pull request modifying `.specify/memory/constitution.md`.
- MAJOR amendments (principle removal or redefinition that breaks existing compliance)
  require explicit team consensus before merging.
- MINOR amendments (new principle or material expansion of an existing principle)
  require at least one reviewer approval.
- PATCH amendments (clarifications, wording fixes, typo corrections) may be merged by
  any maintainer after self-review.

**Versioning policy**: The Constitution version follows semantic versioning (MAJOR.MINOR.PATCH).
The version line MUST be updated in every amendment PR. The `/speckit.constitution` command
enforces increment rules.

**Compliance review**: Every pull request that introduces feature code MUST include or
reference a Constitution Check (see `plan-template.md`). Violations that are accepted MUST
be recorded in the Complexity Tracking table of the relevant `plan.md` with an explicit
justification.

**Runtime guidance**: For active technology stack details, available commands, code style
conventions, and recent feature context, refer to the agent guidance file generated from
feature plans (maintained by the `/speckit.plan` workflow).

**Version**: 1.0.0 | **Ratified**: 2026-03-14 | **Last Amended**: 2026-03-14
