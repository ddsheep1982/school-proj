## 1. Database Schema

- [x] 1.1 Add `RecruitmentCostRecipientType` enum (TEACHER, AGENT) to `prisma/schema.prisma`
- [x] 1.2 Add `RecruitmentCost` model (id, studentId FK, amount Decimal, paymentDate, recipientType enum, teacherId FK?, agentId FK?, notes?, createdById FK, createdAt; indexes on studentId, teacherId, agentId)
- [x] 1.3 Add `recruitmentCosts` back-relation to `Student`, `EnrollmentTeacher`, `RecruitmentAgent`, and `User` models
- [x] 1.4 Run `npx prisma migrate dev --name add-recruitment-cost` and verify migration succeeds
- [x] 1.5 Run `npx prisma generate` to update client types

## 2. Zod Schemas & Types

- [x] 2.1 Add `RecruitmentCostRecipientTypeEnum`, `CreateRecruitmentCostSchema`, `CreateRecruitmentCostInput` to `src/types/index.ts`
- [x] 2.2 Add `FinancialSummaryFiltersSchema` (startDate?, endDate?, classId?, year?) and `FinancialSummaryFilters` type
- [x] 2.3 Add `FinancialSummary`, `MonthlyFinancialEntry`, `StudentFinancialSummary` interfaces to `src/types/index.ts`

## 3. Recruitment Cost Actions

- [x] 3.1 Create `src/actions/recruitment-cost.actions.ts` with `createRecruitmentCost` action (requireRole("ADMIN") → Zod → validate studentId, teacherId/agentId exist → Prisma → writeAuditLog)
- [x] 3.2 Add `getRecruitmentCostsByStudent(studentId)` query
- [x] 3.3 Add `deleteRecruitmentCost(id)` action (requireRole("ADMIN") → delete → writeAuditLog)

## 4. Financial Query Layer

- [x] 4.1 Create `src/lib/financial.queries.ts` with `getFinancialSummary(filters)` — aggregates PaymentRecord income + RecruitmentCost expenditure, returns totalIncome, totalCosts, netIncome
- [x] 4.2 Add `getMonthlyFinancialBreakdown(year)` — returns 12-entry array with tuitionIncome, recruitmentCost, netIncome per month
- [x] 4.3 Add `getStudentFinancialSummaries(filters?)` — per-student totals ordered by netContribution desc

## 5. Integration Tests

- [x] 5.1 Create `__tests__/integration/recruitment-cost.actions.test.ts` covering create, list, delete, non-existent delete
- [x] 5.2 Create `__tests__/integration/financial.queries.test.ts` covering summary (no filter, date range, classId), monthly breakdown, per-student list

## 6. Admin UI — Financial Overview Page

- [x] 6.1 Create `src/app/(dashboard)/finance/page.tsx` — financial overview with summary cards (total income, total costs, net income) and date/class filters
- [x] 6.2 Add monthly breakdown chart/table to the finance page (12-row table with month, income, cost, net)
- [x] 6.3 Add per-student financial summary table (studentNo, name, tuition paid, recruitment cost, net contribution)

## 7. Admin UI — Recruitment Cost Management

- [x] 7.1 Create `src/components/finance/RecruitmentCostForm.tsx` — form to add a recruitment cost entry (studentId lookup, amount, date, recipient)
- [x] 7.2 Create `src/components/finance/RecruitmentCostList.tsx` — list with delete button per entry

## 8. Student Detail — Financial Tab

- [x] 8.1 Create `src/components/finance/StudentFinancialTab.tsx` — shows summary totals bar, tuition payment table, recruitment cost table
- [x] 8.2 Wire up financial tab in `src/app/(dashboard)/students/[id]/page.tsx` — add "费用" tab key, fetch `getPaymentsByStudent` + `getRecruitmentCostsByStudent`, pass to component

## 9. Navigation

- [x] 9.1 Add "财务" link to the dashboard sidebar navigation pointing to `/finance`
