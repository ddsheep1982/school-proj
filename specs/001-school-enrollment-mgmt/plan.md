# Implementation Plan: School Enrollment & Management Platform

**Feature**: `001-school-enrollment-mgmt`
**Status**: Implemented
**Date**: 2026-03-14

## Summary

Full-stack Next.js web application for a single school to manage student enrollment, fees,
classes, teachers, agents, attendance, and a kanban dashboard. Built as a Next.js 16
monolith with PostgreSQL via Prisma 7.

## Artifacts

| File | Description |
|---|---|
| `research.md` | Tech stack decisions and rationale |
| `data-model.md` | Entity diagram and Prisma schema |
| `contracts/types.ts` | TypeScript API contract (all Zod schemas + types) |
| `quickstart.md` | Local setup steps |
| `plan.md` | This file |

## Directory Structure

```
school-proj/
├── prisma/schema.prisma           ← DB source of truth
├── prisma/seed.ts                 ← 2 users, 3 classes, 2 teachers, 2 agents, 10 students
├── src/
│   ├── app/(auth)/login/          ← public login page
│   ├── app/(dashboard)/           ← all authenticated pages (layout with sidebar)
│   │   ├── page.tsx               ← dashboard + kanban
│   │   ├── students/              ← list, new, [id], [id]/edit
│   │   ├── classes/               ← list, new, [id], [id]/edit
│   │   ├── teachers/              ← list, new, [id], [id]/edit
│   │   ├── agents/                ← list, new, [id], [id]/edit
│   │   ├── attendance/            ← daily overview
│   │   └── admin/users/           ← ADMIN only
│   ├── app/api/auth/[...nextauth]/route.ts
│   ├── actions/                   ← student, payment, attendance, class, teacher, agent, user
│   ├── lib/                       ← prisma.ts, auth.ts, audit.ts, student-no.ts, dashboard.queries.ts
│   ├── types/index.ts             ← ALL Zod schemas + TS types (written before any action)
│   ├── types/next-auth.d.ts       ← Session type extension (adds role)
│   ├── middleware.ts              ← NextAuth route protection + RBAC
│   └── components/                ← layout, students, dashboard, payments, attendance, shared
└── __tests__/unit/                ← 30 tests: schemas (25) + student-no (5)
```

## Constitution Check

| Principle | Status | How satisfied |
|---|---|---|
| I. Test-First | ✅ | 30 unit tests written first; schema tests + student-no tests confirmed failing before src/types/index.ts and src/lib/student-no.ts were written |
| II. Simplicity | ✅ | Server Actions eliminate REST API. URL params drive filters. No client state library. Payment status is a direct field. |
| III. Data Integrity | ✅ | Prisma migrations. Zod validates every action input. PaymentRecord has no updatedAt. @@unique on attendance. writeAuditLog() in every mutation. |
| IV. Security | ✅ | NextAuth middleware + requireAuth()/requireRole() in every action. bcrypt hashing. No secrets in code. Zod validates all inputs. |
| V. API-First | ✅ | src/types/index.ts (all schemas) written before any action. ActionResult<T> contract on all actions. |

## Phase Summary

| Phase | Description | Status |
|---|---|---|
| 0 | Foundation: Next.js, Prisma, auth, types, 30 unit tests | ✅ |
| 1 | Student enrollment: actions + pages + components | ✅ |
| 2a | Dashboard + Kanban | ✅ |
| 2b | Payment management | ✅ |
| 3 | Classes + Teachers + Agents CRUD | ✅ |
| 4 | Attendance tracking | ✅ |
| 5 | Admin users + spec artifacts + constitution update | ✅ |

## Verification Checklist

1. **Auth**: Unauthenticated request to `/students` → redirects to `/login`
2. **Student**: Create student with class + teacher + agent → appears in list, class roster, teacher portfolio, agent portfolio
3. **Dashboard**: Metric counts match seed data; kanban columns show correct students
4. **Payment**: Record payment → history updates; record adjustment → both records linked
5. **Attendance**: Check in → daily overview shows present; check out → duration displayed
6. **RBAC**: Staff → `/admin/users` → 403; Admin → `/admin/users` → accessible
7. **Tests**: `npm run test:unit` → 30 pass

## Run Tests

```bash
npm run test:unit
# → 30 tests passing
```

## Start Dev Server

```bash
# 1. Set up .env.local with DATABASE_URL + NEXTAUTH_SECRET
# 2. Run: npx prisma migrate dev --name init
# 3. Run: npx ts-node --project tsconfig.json prisma/seed.ts
# 4. Run: npm run dev
# 5. Open: http://localhost:3000 → login with admin@school.com / admin123456
```
