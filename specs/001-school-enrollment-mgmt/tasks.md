# Tasks: School Enrollment & Management Platform

**Input**: Design documents from `/specs/001-school-enrollment-mgmt/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/types.ts ✅, research.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Test tasks are included per Constitution Principle I (Test-First is NON-NEGOTIABLE).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Next.js monolith with all tooling and dependencies

- [X] T001 Create Next.js project with App Router, TypeScript, and Tailwind CSS using `npx create-next-app@latest`
- [X] T002 Install core runtime dependencies: `prisma @prisma/client @prisma/adapter-pg pg next-auth@beta @auth/prisma-adapter bcryptjs zod`
- [X] T003 [P] Install dev dependencies: `ts-jest @jest/globals @types/jest @types/bcryptjs @types/pg jest jest-environment-jsdom ts-node`
- [X] T004 Move `app/` to `src/app/`, update `tsconfig.json` paths (`"@/*": ["./src/*"]`) and add `"types": ["jest", "node"]`
- [X] T005 [P] Configure `jest.config.ts` with `preset: "ts-jest"`, `testEnvironment: "node"`, and `moduleNameMapper: {"^@/(.*)$": "<rootDir>/src/$1"}`
- [X] T006 [P] Initialize Prisma 7: add `prisma.config.ts` for DATABASE_URL, set generator `provider = "prisma-client"` with `output = "../src/generated/prisma"`

**Checkpoint**: Project boots, `npm run dev` serves a blank page, `npm test` discovers test files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Write complete Prisma schema in `prisma/schema.prisma` — all 8 models (Class, EnrollmentTeacher, RecruitmentAgent, Student, PaymentRecord, AttendanceRecord, User, AuditLog), all enums, named relations (EnrolledBy / RecruitedByTeacher), and @@index / @@unique constraints
- [X] T008 Run `npx prisma migrate dev --name init` to generate and apply all DB tables against the main dev database
- [X] T009 [P] Implement `src/lib/prisma.ts` — PrismaPg driver adapter singleton (imports from `@/generated/prisma/client`)
- [X] T010 [P] Implement `src/lib/auth.ts` — NextAuth v5 credentials provider, JWT strategy, `requireAuth()` and `requireRole("ADMIN")` helpers
- [X] T011 [P] Implement `src/middleware.ts` — protects all routes except `/login` and `/api/auth/*`; returns 403 for STAFF on `/admin/*`
- [X] T012 [P] Implement `src/lib/audit.ts` — `writeAuditLog(userId, action, entity, entityId, changes?)` helper
- [X] T013 [P] Implement `src/lib/student-no.ts` — `generateStudentNo()` using current year + zero-padded 4-digit seq
- [X] T014 **[TDD — RED]** Write failing schema tests in `__tests__/unit/schemas.test.ts` — 25 tests covering all Zod schemas in `src/types/index.ts` (run `npm test`, confirm FAIL before proceeding)
- [X] T015 **[TDD — RED]** Write failing student-no tests in `__tests__/unit/student-no.test.ts` — 5 tests using `jest.mock("@/lib/prisma")` (confirm FAIL before proceeding)
- [X] T016 Implement `src/types/index.ts` — ALL Zod schemas + TypeScript types + `ActionResult<T>` contract (makes T014 pass)
- [X] T017 Verify `src/lib/student-no.ts` makes T015 pass; run `npm run test:unit` → all 30 tests GREEN
- [X] T018 [P] Create `src/app/api/auth/[...nextauth]/route.ts` — exports `{ GET, POST }` from NextAuth handlers
- [X] T019 [P] Create `src/types/next-auth.d.ts` — extends Session and User interfaces to add `id: string` and `role: string`
- [X] T020 Create `prisma/seed.ts` — 2 users (admin + staff), 3 classes, 2 teachers, 2 agents, 10 students in mixed statuses, 1 payment record; uses PrismaPg adapter
- [X] T021 Build login page: `src/app/(auth)/login/page.tsx` (Suspense wrapper) + `src/app/(auth)/login/LoginForm.tsx` ("use client", credentials signIn)
- [X] T022 Build authenticated shell: `src/app/(dashboard)/layout.tsx` (calls `auth()`, renders Sidebar + TopBar) + `src/components/layout/Sidebar.tsx` + `src/components/layout/TopBar.tsx`
- [X] T023 [P] Set up integration test infrastructure: create test database (`psql -c "CREATE DATABASE school_mgmt_test;"`), write `.env.test` with `DATABASE_URL` pointing to test DB, add `jest.config.integration.ts` with `testMatch: ["**/__tests__/integration/**/*.test.ts"]` and `globalSetup`/`globalTeardown` for Prisma migrations, add `"test:integration": "jest --config jest.config.integration.ts"` script to `package.json`; run `npx prisma migrate deploy` against test DB to confirm schema applies

**Checkpoint**: Foundation ready — dev DB connected, test DB ready, all 30 unit tests pass, login works, authenticated shell renders

---

## Phase 3: User Story 1 — Student Enrollment Registration (Priority: P1) 🎯 MVP

**Goal**: Staff can register students, search/filter them, and view full student profiles linked to class and teacher

**Independent Test**: Create a new student with a class + enrollment teacher → verify the student appears in the student list with correct associations and auto-generated studentNo; edit the student → verify list and class roster reflect the update; submit with missing required fields → verify form prevents submission with field errors

### TDD for User Story 1

> **Write these tests FIRST and confirm they FAIL before implementing T025**

- [X] T024 [US1] Write failing integration tests in `__tests__/integration/student.actions.test.ts` — cover: `createStudent` returns `ActionResult` with auto-generated `studentNo`; `updateStudent` reflects changes; `getStudents` filters by `enrollmentStatus`, `paymentStatus`, `classId`; `getStudentById` returns null for missing ID; confirm all tests FAIL before proceeding to T025

### Implementation for User Story 1

- [X] T025 [P] [US1] Implement `src/actions/student.actions.ts` — `createStudent`, `updateStudent`, `getStudents` (with filters + pagination), `getStudentById`; each action calls `requireAuth()` → `ZodSchema.safeParse()` → Prisma → `writeAuditLog()`
- [X] T026 [P] [US1] Build `src/components/shared/StatusBadge.tsx`, `src/components/shared/ConfirmDialog.tsx`, `src/components/shared/SearchInput.tsx`
- [X] T027 [P] [US1] Build `src/components/students/StudentForm.tsx` — handles create and edit; cross-field validation for `recruitmentChannelType` / `recruitmentTeacherId` / `recruitmentAgentId`; fetch class capacity when `classId` is selected and display a non-blocking inline warning banner ("班级已满，请确认") when selected class enrollment count >= capacity (FR-014); label the two enrollment teacher fields distinctly — "办理老师 (Enrollment Processor)" for `enrollmentTeacherId` and "招生来源老师 (Recruited By)" for `recruitmentTeacherId` (FR-015)
- [X] T028 [P] [US1] Build `src/components/students/StudentTable.tsx` — columns, search input, filter dropdowns (class, teacher, status, payment status, channel)
- [X] T029 [US1] Build `src/app/(dashboard)/students/page.tsx` — student list with search params–driven filters and pagination (uses T025, T028)
- [X] T030 [US1] Build `src/app/(dashboard)/students/new/page.tsx` — wraps StudentForm for creation (uses T025, T027)
- [X] T031 [US1] Build `src/app/(dashboard)/students/[id]/page.tsx` — tabbed detail view (Info / Payments / Attendance) loading per active tab (uses T025)
- [X] T032 [US1] Build `src/app/(dashboard)/students/[id]/edit/page.tsx` — wraps StudentForm pre-populated for edit (uses T025, T027)

**Checkpoint**: Full student CRUD is independently functional; studentNo auto-generates; filters work via URL params; capacity warning shown (non-blocking) when full class is selected; two teacher fields labeled distinctly

---

## Phase 4: User Story 2 — Management Dashboard & Kanban (Priority: P2)

**Goal**: Dashboard displays real-time metrics and a kanban board grouped by enrollment status; filters drive both

**Independent Test**: With seed data loaded, open the dashboard → verify metric counts match expected totals; verify kanban columns show correct students per status; apply a class filter → verify metrics and kanban update; click a metric card → verify navigation to filtered student list

### Implementation for User Story 2

- [X] T033 [P] [US2] Implement `src/lib/dashboard.queries.ts` — `getDashboardMetrics(filters)` using `prisma.student.groupBy`, `getKanbanData(filters)` returning `KanbanData` shape; called directly from Server Components (not Server Actions)
- [X] T034 [P] [US2] Build `src/components/dashboard/MetricCard.tsx` — clickable card that navigates to filtered student list via URL param
- [X] T035 [P] [US2] Build `src/components/dashboard/KanbanBoard.tsx` — three columns (在读 / 退学 / 毕业), each column renders `KanbanCard` items with paymentStatus badge; column body uses `overflow-y-auto` with a fixed max-height to handle large student counts gracefully
- [X] T036 [US2] Build `src/app/(dashboard)/page.tsx` — server component fetching metrics + kanban data; renders filter controls (class, teacher, channel), MetricCards, and KanbanBoard (uses T033–T035)

**Checkpoint**: Dashboard metrics match seed data; kanban columns populate correctly; URL-param filters update both metrics and kanban without client state library

---

## Phase 5: User Story 3 — Fee & Payment Management (Priority: P2)

**Goal**: Staff record payments against students; immutable history with adjustment support; payment status filter on student list

**Independent Test**: Record a payment against a seeded student → verify it appears in payment history; record an adjustment → verify original and adjustment are linked; filter student list by Overdue → verify only matching students shown

### TDD for User Story 3

> **Write these tests FIRST and confirm they FAIL before implementing T038**

- [X] T037 [US3] Write failing integration tests in `__tests__/integration/payment.actions.test.ts` — cover: `createPayment` returns immutable record with no `updatedAt`; `createAdjustment` links `originalId` to source record; `getPaymentsByStudent` returns chronological list; confirm all tests FAIL before proceeding to T038

### Implementation for User Story 3

- [X] T038 [P] [US3] Implement `src/actions/payment.actions.ts` — `createPayment`, `createAdjustment` (isAdjustment=true + originalId), `getPaymentsByStudent`; no update action (records are immutable)
- [X] T039 [P] [US3] Build `src/components/payments/PaymentForm.tsx` — fields: amount, paymentDate, paymentType, notes; "use client"
- [X] T040 [P] [US3] Build `src/components/payments/PaymentHistory.tsx` — renders payment records in chronological order; shows cumulative payment total (sum of all amounts including adjustments per FR-007); handles Decimal amounts via `.toString()`
- [X] T041 [US3] Wire payment tab in `src/app/(dashboard)/students/[id]/page.tsx` — renders PaymentForm + PaymentHistory when tab=payments (uses T038–T040)

**Checkpoint**: Payments recorded append-only; adjustments linked to originals; cumulative payment total displayed; paymentStatus filter on student list works end-to-end

---

## Phase 6: User Story 4 — Class Management (Priority: P3)

**Goal**: Admins create and manage classes; class roster shows enrolled students and capacity

**Independent Test**: Create a class → verify it appears in class list and as a dropdown option in StudentForm; assign two students to it → verify both appear in class roster; view class detail → verify enrollment count and remaining capacity are correct

### TDD for User Story 4

> **Write these tests FIRST and confirm they FAIL before implementing T043**

- [X] T042 [US4] Write failing integration tests in `__tests__/integration/class.actions.test.ts` — cover: `createClass` persists name + capacity; `deleteClass` blocked when students assigned returns error; `getClassById` includes `_count.students` alongside `capacity`; `getAllClasses` with `archivedFilter: false` excludes archived classes; confirm all tests FAIL before proceeding to T043

### Implementation for User Story 4

- [X] T043 [P] [US4] Implement `src/actions/class.actions.ts` — `createClass`, `updateClass`, `deleteClass` (blocked if students assigned), `getAllClasses`, `getClassById`; `getAllClasses()` called for student assignment dropdowns MUST filter `where: { archived: false }` to prevent assigning students to archived classes (spec edge case); `getClassById` MUST include `_count: { select: { students: true } }` alongside `capacity` to enable non-blocking capacity warning in `StudentForm` (FR-014); all mutating actions call `requireAuth()` and `writeAuditLog()`
- [X] T044 [US4] Build `src/app/(dashboard)/classes/page.tsx` — class list with enrollment count and capacity display (uses T043)
- [X] T045 [US4] Build `src/app/(dashboard)/classes/new/page.tsx` — create class form (uses T043)
- [X] T046 [US4] Build `src/app/(dashboard)/classes/[id]/page.tsx` — class detail with student roster, enrollment count, and remaining capacity (uses T043)
- [X] T047 [US4] Build `src/app/(dashboard)/classes/[id]/edit/page.tsx` + `src/components/classes/EditClassForm.tsx` — edit name, capacity, and archived status (uses T043)

**Checkpoint**: Class CRUD functional; `getAllClasses()` excludes archived classes in student dropdowns; `getClassById` returns enrollment count; capacity warning shown (non-blocking) in StudentForm when class is full

---

## Phase 7: User Story 5 — Enrollment Teacher Management (Priority: P3)

**Goal**: Admins manage enrollment teachers; teacher profile shows student portfolio with payment status breakdown

**Independent Test**: Create an enrollment teacher → verify they appear in teacher list and as a dropdown in StudentForm; assign students → verify teacher profile lists them with payment statuses; attempt to delete teacher with active students → verify system blocks deletion with reassignment prompt

### TDD for User Story 5

> **Write these tests FIRST and confirm they FAIL before implementing T049**

- [X] T048 [US5] Write failing integration tests in `__tests__/integration/teacher.actions.test.ts` — cover: `createTeacher` persists; `deleteTeacher` returns error when active students assigned; `getTeacherById` includes enrolled student portfolio with paymentStatus per student; confirm all tests FAIL before proceeding to T049

### Implementation for User Story 5

- [X] T049 [P] [US5] Implement `src/actions/teacher.actions.ts` — `createTeacher`, `updateTeacher`, `deactivateTeacher`, `deleteTeacher` (blocked if active students assigned), `getAllTeachers`, `getTeacherById` with enrolled student portfolio
- [X] T050 [US5] Build `src/app/(dashboard)/teachers/page.tsx` — teacher list with active/inactive status (uses T049)
- [X] T051 [US5] Build `src/app/(dashboard)/teachers/new/page.tsx` — create teacher form (uses T049)
- [X] T052 [US5] Build `src/app/(dashboard)/teachers/[id]/page.tsx` — teacher portfolio view (student list with paymentStatus per student) (uses T049)
- [X] T053 [US5] Build `src/app/(dashboard)/teachers/[id]/edit/page.tsx` — edit name, phone, active status (uses T049)

**Checkpoint**: Teacher CRUD functional; portfolio shows students enrolled by this teacher; delete blocked when active assignments exist

---

## Phase 8: User Story 6 — Recruitment Agent Management (Priority: P3)

**Goal**: Admins manage external recruitment agents; agent profile shows referred student portfolio; student form links recruitment channel (teacher or agent) to student records

**Independent Test**: Create a recruitment agent → verify they appear in agent list and as a dropdown in StudentForm when channel=AGENT; register a student with this agent as source → verify student profile shows correct channel + agent; verify agent profile lists that student

### TDD for User Story 6

> **Write these tests FIRST and confirm they FAIL before implementing T055**

- [X] T054 [US6] Write failing integration tests in `__tests__/integration/agent.actions.test.ts` — cover: `createAgent` persists with optional `agencyName`; `deleteAgent` returns error when active students assigned; `getAgentById` includes recruited student portfolio with paymentStatus per student; confirm all tests FAIL before proceeding to T055

### Implementation for User Story 6

- [X] T055 [P] [US6] Implement `src/actions/agent.actions.ts` — `createAgent`, `updateAgent`, `deactivateAgent`, `deleteAgent` (blocked if active students assigned), `getAllAgents`, `getAgentById` with recruited student portfolio
- [X] T056 [US6] Build `src/app/(dashboard)/agents/page.tsx` — agent list with agency name and active status (uses T055)
- [X] T057 [US6] Build `src/app/(dashboard)/agents/new/page.tsx` — create agent form with optional agencyName field (uses T055)
- [X] T058 [US6] Build `src/app/(dashboard)/agents/[id]/page.tsx` — agent portfolio view (referred students with paymentStatus) (uses T055)
- [X] T059 [US6] Build `src/app/(dashboard)/agents/[id]/edit/page.tsx` — edit name, agencyName, phone, active status (uses T055)

**Checkpoint**: Agent CRUD functional; StudentForm correctly shows teacher or agent selector based on recruitmentChannelType; agent portfolio populated; delete blocked when active assignments exist

---

## Phase 9: User Story 7 — Attendance Time Tracking (Priority: P4)

**Goal**: Staff record check-in/out per student per day; daily overview shows all students' attendance for a selected date; student profile shows full attendance history

**Independent Test**: Record a check-in for a student → verify they appear as present on the daily overview; record check-out → verify duration is calculated and displayed; view student profile attendance tab → verify full history sorted by date; attempt check-out before check-in on same day → verify system rejects it

### TDD for User Story 7

> **Write these tests FIRST and confirm they FAIL before implementing T061**

- [X] T060 [US7] Write failing integration tests in `__tests__/integration/attendance.actions.test.ts` — cover: `recordCheckIn` creates record; duplicate checkIn on same day returns error; `recordCheckOut` before checkIn returns error; `recordCheckOut` with time ≤ checkIn returns error; `recordCheckOut` computes duration in minutes correctly; confirm all tests FAIL before proceeding to T061

### Implementation for User Story 7

- [X] T061 [P] [US7] Implement `src/actions/attendance.actions.ts` — `recordCheckIn` (rejects duplicate), `recordCheckOut` (rejects if no checkIn or if time ≤ checkIn, computes duration in minutes), `getDailyAttendance(date)`, `getAttendanceByStudent(studentId)`; enforces `@@unique([studentId, date])` at application layer
- [X] T062 [P] [US7] Build `src/components/attendance/AttendanceForm.tsx` — inputs: studentId selector, date (YYYY-MM-DD), time (HH:MM); validates format using AttendanceTimeSchema; "use client"
- [X] T063 [US7] Build `src/app/(dashboard)/attendance/page.tsx` — daily overview with date picker; lists all students and their check-in status for the selected date (uses T061)
- [X] T064 [US7] Wire attendance tab in `src/app/(dashboard)/students/[id]/page.tsx` — renders AttendanceForm + attendance history list when tab=attendance (uses T061–T062)

**Checkpoint**: Check-in/out recorded per student per day; duration computed on checkOut; daily overview and student attendance history both populated correctly

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Admin user management, spec artifacts, constitution update, and final validation

- [X] T065 [P] Implement `src/actions/user.actions.ts` — `createUser`, `updateUser`, `deactivateUser` (admin-only via `requireRole("ADMIN")`); uses bcrypt for password hashing; `omit: { hashedPassword: true }` in all Prisma reads
- [X] T066 [P] Build `src/app/(dashboard)/admin/users/page.tsx` — admin-only user list with role badges (ADMIN-gated by middleware)
- [X] T067 [P] Build `src/app/(dashboard)/admin/users/new/page.tsx` — create user form (name, email, password, role)
- [X] T068 Verify DB indexes and performance: (1) confirm all 4 `@@index` entries on `Student` and `@@unique` on `AttendanceRecord([studentId, date])` are present in `prisma/schema.prisma`; (2) run `npx ts-node prisma/seed.ts` extended with 490 additional students (500 total), then time `getDashboardMetrics({})` — confirm query completes in <2s to validate SC-002; (3) confirm `getAllClasses()` uses `where: { archived: false }` in production path
- [X] T069 Run `npm run build` — confirm 0 TypeScript errors before marking implementation complete
- [X] T070 Run `npm run test:unit` → confirm all 30 unit tests pass; run `npm run test:integration` against test DB → confirm all 6 integration test suites pass
- [X] T071 [P] Write spec artifact: `specs/001-school-enrollment-mgmt/research.md` — tech stack decisions and rationale
- [X] T072 [P] Write spec artifact: `specs/001-school-enrollment-mgmt/data-model.md` — entity diagram and Prisma schema reference
- [X] T073 [P] Write spec artifact: `specs/001-school-enrollment-mgmt/quickstart.md` — local setup steps (clone → .env → migrate → seed → npm run dev)
- [X] T074 [P] Write spec artifact: `specs/001-school-enrollment-mgmt/plan.md` — filled plan-template with phases, constitution check, and verification checklist
- [X] T075 [P] Write API contract: `specs/001-school-enrollment-mgmt/contracts/types.ts` — copy of `src/types/index.ts`
- [X] T076 Resolve `TODO(TECH_STACK)` in `.specify/memory/constitution.md` — fill Technology & Stack Constraints section with resolved stack from this feature

**Checkpoint**: Build passes, all tests green (unit + integration), performance smoke test passes, all spec artifacts written, constitution tech stack resolved

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**; T023 (test DB setup) must complete before any TDD-RED task runs
- **US1 (Phase 3)**: Depends on Phase 2 — no dependencies on other stories; is MVP
- **US2 (Phase 4)**: Depends on Phase 2 — integrates with US1 data but independently testable
- **US3 (Phase 5)**: Depends on Phase 2 — integrates with US1 data but independently testable
- **US4, US5, US6 (Phases 6–8)**: Depend on Phase 2 — all independently testable; can run in parallel with each other
- **US7 (Phase 9)**: Depends on Phase 2 — independently testable
- **Polish (Phase 10)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other user stories — pure MVP
- **US2 (P2)**: Requires students in DB (from US1 seed); independently testable
- **US3 (P2)**: Requires students in DB; independently testable
- **US4, US5, US6 (P3)**: Each independently testable after Foundational; US1 seed data used for testing
- **US7 (P4)**: Requires students in DB; independently testable

### Within Each User Story

- TDD gate: TDD-RED test task MUST be written and confirmed FAILING before implementation tasks execute
- Actions before pages (pages call actions)
- Shared components (`StatusBadge`, `ConfirmDialog`, `SearchInput`) before feature-specific components that use them
- Detail page wiring (payment tab, attendance tab) after respective action + component tasks

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- In Phase 2: T009–T013 (lib files) can run in parallel; T014–T015 (tests) must complete before T016; T023 (test DB) can run in parallel with T009–T022
- Once Phase 2 completes: US4, US5, US6 (Phases 6–8) can all start simultaneously
- US2 and US3 can start simultaneously after Phase 2
- Within each phase: action implementation [P] tasks can run alongside component [P] tasks

---

## Parallel Example: Phase 6–8 (P3 User Stories)

```bash
# All three P3 user stories can run in parallel after Phase 2:
Task: "US4 Class Management — T042 through T047"
Task: "US5 Enrollment Teacher Management — T048 through T053"
Task: "US6 Recruitment Agent Management — T054 through T059"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; T023 test DB required before TDD tasks)
3. Complete Phase 3: User Story 1 (Student Enrollment)
   - T024: Write failing integration tests → confirm RED
   - T025–T032: Implement
4. **STOP and VALIDATE**: seed DB, run `npm run dev`, verify create/edit/search/filter works
5. US1 is independently shippable — all other modules depend on students existing

### Incremental Delivery

1. Setup + Foundational → Foundation ready (30 unit tests pass, test DB ready)
2. US1 Student Enrollment → Test independently → **MVP Demo**
3. US2 Dashboard + US3 Payments → Test independently → **Operations Demo**
4. US4 + US5 + US6 Classes / Teachers / Agents (parallel) → Test → **Full CRUD Demo**
5. US7 Attendance → Test independently → **Complete Feature Demo**
6. Polish → Spec artifacts + constitution update → **Final Delivery**

---

## Notes

- **[P]** tasks target different files with no unresolved dependencies — safe to parallelise
- **[Story]** label maps each task to a specific user story for traceability
- TDD gate is NON-NEGOTIABLE per Constitution Principle I — never skip the RED phase
- T023 (integration test DB setup) MUST complete before any TDD-RED integration test task (T024, T037, T042, T048, T054, T060)
- Prisma client imports: use `@/generated/prisma/client` (Prisma 7 driver-adapter output path), NOT `@prisma/client`
- All Server Actions use `"use server"` directive and call `requireAuth()` before any DB access
- URL search params drive all list filters — no client-side state library (zustand, redux, etc.)
- `PaymentRecord` has no update action — corrections create a new record with `isAdjustment=true + originalId`
- `PaymentHistory` displays cumulative payment total (sum of all amounts) per FR-007 — no fee target amount exists
- Capacity warning in `StudentForm` is non-blocking (inline banner only) per FR-014
- `getAllClasses()` for student assignment dropdowns MUST filter `archived: false` (edge case guard)
- `getClassById` must return `_count: { select: { students: true } }` to enable FR-014 capacity check
- `StudentForm` MUST label two teacher fields distinctly: "办理老师" for `enrollmentTeacherId`, "招生来源老师" for `recruitmentTeacherId` (FR-015)
- Commit after each completed checkpoint
