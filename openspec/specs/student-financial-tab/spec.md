## ADDED Requirements

### Requirement: Student detail page has a financial tab
The student detail page SHALL include a "费用" (Financials) tab that shows the student's tuition payment history and recruitment costs side by side, plus a net contribution summary.

#### Scenario: Financial tab displays tuition history
- **WHEN** an authenticated user navigates to the financial tab of a student's detail page
- **THEN** all PaymentRecord entries for that student are displayed with amount, paymentDate, paymentType, and notes

#### Scenario: Financial tab displays recruitment costs
- **WHEN** an authenticated user views the financial tab
- **THEN** all RecruitmentCost entries for that student are displayed with amount, paymentDate, recipientType, and recipient name

#### Scenario: Financial tab shows summary totals
- **WHEN** an authenticated user views the financial tab
- **THEN** the tab header area SHALL display totalTuitionPaid, totalRecruitmentCost, and netContribution (totalTuitionPaid − totalRecruitmentCost) for that student

#### Scenario: Student with no financial records
- **WHEN** a student has no PaymentRecords and no RecruitmentCosts
- **THEN** the financial tab shows empty states for both sections and 0 totals
