# Research: Tech Stack Decisions

**Feature**: School Enrollment & Management Platform
**Date**: 2026-03-14

## Stack Summary

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | Full-stack, server components + actions eliminate separate API layer |
| Database | PostgreSQL via Prisma 7 ORM | Type-safe migrations, relations, constraints; Prisma 7 uses driver adapters |
| Auth | NextAuth.js v5 (beta) credentials provider | Standard JWT session for username+password login |
| UI | Tailwind CSS 4 | Fast admin-style utility UI, no design system overhead |
| Validation | Zod 4 | Single source of truth for types + runtime validation at action boundaries |
| Testing (unit) | Jest + ts-jest | Standard Next.js testing setup |
| DB Adapter | @prisma/adapter-pg + pg | Required by Prisma 7 for PostgreSQL connections |

## Key Decisions

### Prisma 7 Driver Adapter Pattern
Prisma 7 changed the `PrismaClient` constructor to require a driver adapter. PostgreSQL uses `@prisma/adapter-pg`. The adapter is instantiated with the DATABASE_URL and passed to `new PrismaClient({ adapter })`.

Implication: `prisma.ts` must import `PrismaPg` from `@prisma/adapter-pg` and create the adapter before instantiating the client.

### NextAuth v5 + JWT Sessions
NextAuth v5 (beta) exposes `auth()` directly as a function usable in Server Components and Server Actions. JWT strategy stores `{ id, name, email, role }` in the session token, avoiding a DB hit on every request.

Session type is extended via `src/types/next-auth.d.ts` to include `role`.

### Server Actions as API Layer
No REST API routes created — all mutations go through `"use server"` functions in `src/actions/`. This satisfies the API-First principle while eliminating boilerplate. Every action calls `requireAuth()` or `requireRole("ADMIN")` before touching data.

### Immutable Payment Records
`PaymentRecord` has no `updatedAt` field. Corrections are new records with `isAdjustment=true` and `originalId` pointing to the original. This satisfies FR-009 and constitution principle III (Data Integrity).

### Student Number Generation
`generateStudentNo()` in `src/lib/student-no.ts` uses `prisma.student.findFirst` with `orderBy: { studentNo: "desc" }` to find the highest existing number for the current year, then increments. Simple, no race condition risk for a single-school system.

### Duration Computed on CheckOut
`AttendanceRecord.duration` (minutes) is computed and stored when `checkOut` is recorded. Avoids repeated CPU work on list views with 500+ rows.

## Rejected Alternatives

| Alternative | Why Rejected |
|---|---|
| Separate Express/FastAPI backend | Unnecessary complexity for a single-school system |
| Client-side state (Redux/Zustand) | URL params + Server Components + `router.refresh()` cover all state needs |
| SQLite | Deployment target is a school server; PostgreSQL is already available |
| Fee configuration module | Spec says no fee config needed; payment status is staff-managed field |
