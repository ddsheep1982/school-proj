## Why

The school platform currently lacks structured fee management: there is no way to define fee structures, issue invoices to students, or track payment obligations beyond ad-hoc payment records. Administrators need a first-class system for creating fee schedules, assigning fees to students, and reconciling outstanding balances.

## What Changes

- Introduce fee structures (types of fees with amounts and recurrence rules)
- Allow assigning fee obligations to individual students or entire classes
- Generate invoice records from assigned fees
- Track payment status per invoice (paid, partial, outstanding, waived)
- Provide admin views for outstanding balances and payment history per student
- Tie payments to invoices (replacing or extending the current standalone `PaymentRecord` model)

## Capabilities

### New Capabilities
- `fee-structures`: Define named fee types with amounts, recurrence (one-time, term, annual), and applicable academic year
- `fee-assignments`: Assign a fee structure to a student or a cohort/class, generating invoice records
- `invoices`: Invoice records per student per fee assignment; track amount due, amount paid, due date, and status
- `payment-reconciliation`: Link payment records to invoices; compute balance, mark invoices paid/partial/waived

### Modified Capabilities
- `payments`: Extend existing payment records to optionally reference an invoice (`invoiceId`), keeping backwards compatibility with standalone payments

## Impact

- **Database**: New tables — `FeeStructure`, `FeeAssignment`, `Invoice`; `PaymentRecord` gains optional `invoiceId` FK
- **Prisma schema**: `prisma/schema.prisma` updated with new models and relations
- **Server actions**: New action files for fee structures, assignments, and invoices
- **API types**: `src/types/index.ts` gains Zod schemas for all new models
- **UI**: New admin pages under `/admin/fees/` for structures, assignments, and invoice listing
- **Audit log**: All fee and invoice mutations must emit audit entries
