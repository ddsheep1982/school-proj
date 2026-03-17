## Context

The school platform (Next.js 16, Prisma 7, PostgreSQL) already manages students, classes, teachers, and ad-hoc payment records. Payment records are currently standalone — they carry an amount, method, and description but are not tied to any obligation. Administrators have no way to define what a student owes, issue an invoice, or know whether a payment was collected for the right reason.

This design introduces a three-layer fee model: **FeeStructure** (the template), **FeeAssignment** (applying the template to a student or class), and **Invoice** (the obligation record per student). PaymentRecord gains an optional `invoiceId` to link payments to obligations without breaking existing standalone records.

All mutations follow the established pattern: `requireRole("ADMIN")` → Zod parse → Prisma → `writeAuditLog()`.

## Goals / Non-Goals

**Goals:**
- Define reusable fee structures with amount, recurrence, and academic year
- Bulk-assign fees to a class or individually to a student, auto-generating Invoice rows
- Track invoice status (OUTSTANDING, PARTIAL, PAID, WAIVED) derived from linked payments
- Link existing and new PaymentRecord rows to invoices (optional FK)
- Admin UI pages for managing structures, assignments, and viewing invoices
- Full audit trail for all creates, updates, and waives

**Non-Goals:**
- Online payment gateway integration (Stripe, etc.)
- Student/parent-facing invoice portal (separate future change)
- Automated recurring invoice generation (scheduled jobs)
- Multi-currency support
- PDF invoice generation

## Decisions

### 1. Invoice status is computed, not stored
**Decision**: Invoice status (OUTSTANDING / PARTIAL / PAID / WAIVED) is derived at query time by summing linked PaymentRecord amounts and comparing to `amountDue`. A `waivedAt` timestamp on Invoice signals a manual waive.

**Rationale**: Storing status creates sync hazards — a payment deletion could leave status stale. Since invoices are per-student and counts are small, computing on read is safe and eliminates an entire class of bugs.

**Alternative considered**: Stored enum status updated by triggers/actions. Rejected because it requires careful coordination across payment create/delete paths and adds migration complexity.

---

### 2. FeeAssignment targets either a student or a class (not both)
**Decision**: `FeeAssignment` has mutually exclusive optional FKs — either `studentId` OR `classId` is set, enforced at the action layer with a Zod discriminated union. When `classId` is set, the create action expands it into one Invoice per enrolled student at the time of assignment.

**Rationale**: Class-level assignment is a bulk convenience; the source of truth is always individual Invoice rows. This keeps the Invoice model simple and queries fast.

**Alternative considered**: A polymorphic `targetType/targetId` column. Rejected because Prisma doesn't support polymorphic FKs cleanly, and two nullable FKs are explicit and easy to index.

---

### 3. PaymentRecord gains optional invoiceId (additive migration)
**Decision**: Add `invoiceId String?` to `PaymentRecord` with a nullable FK to `Invoice`. Existing rows keep `invoiceId = null` and behave exactly as before.

**Rationale**: This is the least-disruptive path. The current `PaymentRecord` model is described as immutable (no `updatedAt`); we preserve that invariant and simply add a new linkage column.

**Alternative considered**: Create a new `InvoicePayment` join table. Rejected as over-engineering — a direct FK from payment to invoice is sufficient given a payment typically settles one invoice.

---

### 4. No Prisma-level status enum — use a TypeScript computed helper
**Decision**: Invoice status is not stored in DB. A helper `computeInvoiceStatus(invoice: InvoiceWithPayments): InvoiceStatus` in `src/lib/invoice.utils.ts` is used everywhere (actions, queries, UI).

**Rationale**: Keeps the schema simple. The helper is unit-testable without a DB. The `InvoiceStatus` type is defined in `src/types/index.ts`.

## Risks / Trade-offs

- **Bulk assignment race**: If two admins assign the same fee structure to the same class concurrently, duplicate Invoices could be created. Mitigation: unique constraint on `(feeAssignmentId, studentId)` on Invoice.
- **Class enrollment changes post-assignment**: Students added to a class after a bulk fee assignment won't automatically get an Invoice. Mitigation: document this limitation; admins can do a follow-up individual assignment. Future work can add a "sync" action.
- **Payment deletion leaves invoice stale**: If a PaymentRecord is deleted after being linked to an invoice, the computed status reverts automatically (by design). No special handling needed, but this may surprise admins.

## Migration Plan

1. Add new models to `prisma/schema.prisma` (`FeeStructure`, `FeeAssignment`, `Invoice`) and add `invoiceId` to `PaymentRecord`.
2. Generate and apply migration: `prisma migrate dev --name add-fee-management`.
3. No data backfill required — all new tables start empty; existing PaymentRecords keep `invoiceId = null`.
4. Rollback: `prisma migrate down` (or drop the three new tables and the column). No data loss on rollback since new tables are additive.

## Open Questions

- Should `FeeStructure.amount` be stored in cents (integer) or decimal? **Tentative**: decimal (`Decimal` Prisma type) consistent with existing `PaymentRecord.amount`.
- Should waiving an invoice require a reason field? **Tentative**: yes — `Invoice.waivedReason String?` for audit clarity.
