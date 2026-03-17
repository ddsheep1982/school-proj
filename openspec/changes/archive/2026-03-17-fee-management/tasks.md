## 1. Database Schema

- [x] 1.1 Add `FeeStructure` model to `prisma/schema.prisma` (id, name, description, amount Decimal, recurrence enum ONE_TIME/TERM/ANNUAL, academicYear String, unique constraint on name+academicYear, timestamps)
- [x] 1.2 Add `FeeAssignment` model (id, feeStructureId FK, optional studentId FK, optional classId FK, dueDate, timestamps)
- [x] 1.3 Add `Invoice` model (id, feeAssignmentId FK, studentId FK, amountDue Decimal, dueDate, waivedAt DateTime?, waivedReason String?, timestamps; unique constraint on feeAssignmentId+studentId)
- [x] 1.4 Add optional `invoiceId String?` field to `PaymentRecord` with FK to `Invoice`
- [x] 1.5 Run `npx prisma migrate dev --name add-fee-management` and verify migration succeeds

## 2. Zod Schemas & Types

- [x] 2.1 Add `FeeRecurrence` enum, `CreateFeeStructureInput`, `UpdateFeeStructureInput`, `FeeStructure` types to `src/types/index.ts`
- [x] 2.2 Add `CreateFeeAssignmentInput` (discriminated union: studentId XOR classId), `FeeAssignment` types
- [x] 2.3 Add `InvoiceStatus` type (OUTSTANDING | PARTIAL | PAID | WAIVED), `Invoice`, `InvoiceWithStatus` types
- [x] 2.4 Update `CreatePaymentInput` to include optional `invoiceId`

## 3. Invoice Utility

- [x] 3.1 Create `src/lib/invoice.utils.ts` with `computeInvoiceStatus(invoice)` helper
- [x] 3.2 Write unit tests for `computeInvoiceStatus` covering all four statuses

## 4. Fee Structure Actions

- [x] 4.1 Create `src/actions/fee-structure.actions.ts` with `createFeeStructure` action (requireRole("ADMIN") → Zod → Prisma → writeAuditLog)
- [x] 4.2 Add `getFeeStructures` query (with optional academicYear filter)
- [x] 4.3 Add `updateFeeStructure` action (blocks if assignments exist)
- [x] 4.4 Add `deleteFeeStructure` action (blocks if assignments exist)

## 5. Fee Assignment Actions

- [x] 5.1 Create `src/actions/fee-assignment.actions.ts` with `createFeeAssignment` action (handles both student and class targets; bulk invoice generation for class)
- [x] 5.2 Add `getFeeAssignments` query (with optional filters)
- [x] 5.3 Add `deleteFeeAssignment` action (blocks if any invoice has linked payments; cascades invoice deletion)

## 6. Invoice Actions

- [x] 6.1 Create `src/actions/invoice.actions.ts` with `getStudentInvoices` query (returns invoices with computed status)
- [x] 6.2 Add `waiveInvoice` action (requireRole("ADMIN") → validate not PAID → set waivedAt + waivedReason → writeAuditLog)
- [x] 6.3 Add `getStudentOutstandingBalance` query
- [x] 6.4 Add `listInvoices` paginated query with status and academicYear filters

## 7. Payment Action Update

- [x] 7.1 Update `src/actions/payment.actions.ts` `createPayment` to accept optional `invoiceId`
- [x] 7.2 Validate invoice-student match when `invoiceId` is provided

## 8. Integration Tests

- [x] 8.1 Create `__tests__/integration/fee-structure.test.ts` covering create, list, update-blocked, delete-blocked scenarios
- [x] 8.2 Create `__tests__/integration/fee-assignment.test.ts` covering individual assignment, class bulk assignment, delete-blocked scenarios
- [x] 8.3 Create `__tests__/integration/invoice.test.ts` covering computed status (all four), waive, waive-paid-blocked scenarios
- [x] 8.4 Create `__tests__/integration/payment-reconciliation.test.ts` covering linked payment, mismatch rejected, outstanding balance query
- [x] 8.5 Update `__tests__/integration/payment.test.ts` to cover payment with `invoiceId`

## 9. Admin UI — Fee Structures Page

- [x] 9.1 Create `src/app/admin/fees/page.tsx` — list fee structures with create form
- [x] 9.2 Add delete and edit controls (disabled when assignments exist, with tooltip)

## 10. Admin UI — Fee Assignments Page

- [x] 10.1 Create `src/app/admin/fees/assignments/page.tsx` — list assignments with create form (student or class selector)
- [x] 10.2 Show invoice count per assignment; add delete control (disabled when payments exist)

## 11. Admin UI — Invoices Page

- [x] 11.1 Create `src/app/admin/fees/invoices/page.tsx` — paginated invoice list with status/academicYear filters
- [x] 11.2 Add waive action with reason input on each invoice row

## 12. Admin UI — Student Invoice Detail

- [x] 12.1 Add invoice list and outstanding balance to existing student detail page (`src/app/admin/students/[id]/page.tsx`)
