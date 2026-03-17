## MODIFIED Requirements

### Requirement: Student detail page has a financial tab
The student detail page SHALL include a "费用" (Financials) tab that shows the student's tuition payment history, recruitment costs (including reception teacher costs), refund records, and a net contribution summary.

#### Scenario: Financial tab displays tuition history
- **WHEN** an authenticated user navigates to the financial tab of a student's detail page
- **THEN** all PaymentRecord entries for that student are displayed with amount, paymentDate, paymentType, and notes

#### Scenario: Financial tab displays recruitment costs
- **WHEN** an authenticated user views the financial tab
- **THEN** all RecruitmentCost entries for that student are displayed with amount, paymentDate, recipientType (including RECEPTION_TEACHER), and recipient name

#### Scenario: Financial tab shows refund records
- **WHEN** an authenticated user views the financial tab
- **THEN** all RefundRecord entries for that student SHALL be displayed with amount, reason, refundDate, and linked invoice (if any)

#### Scenario: Financial tab shows summary totals
- **WHEN** an authenticated user views the financial tab
- **THEN** the tab header area SHALL display totalTuitionPaid, totalRecruitmentCost (all types), totalRefunded, and netContribution (totalTuitionPaid − totalRecruitmentCost − totalRefunded) for that student

#### Scenario: Student with no financial records
- **WHEN** a student has no PaymentRecords, no RecruitmentCosts, and no RefundRecords
- **THEN** the financial tab shows empty states for all sections and 0 totals

## ADDED Requirements

### Requirement: Financial tab shows withdrawal status
The student detail page financial tab SHALL display the student's withdrawal status, date, and reason if the student has been withdrawn.

#### Scenario: Withdrawn student shows withdrawal info
- **WHEN** an authenticated user views the financial tab of a withdrawn student
- **THEN** the withdrawal date and reason are prominently displayed at the top of the tab
