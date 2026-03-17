## ADDED Requirements

### Requirement: Invoice is created automatically on fee assignment
The system SHALL create Invoice records as a side-effect of fee assignment creation. Invoices MUST NOT be created directly by admins outside of the assignment flow.

#### Scenario: Invoice created with correct fields
- **WHEN** a fee assignment is created for a student
- **THEN** the Invoice record SHALL have `amountDue` equal to the fee structure's amount, `dueDate` equal to the assignment's due date, `status` of OUTSTANDING, and `waivedAt = null`

### Requirement: Invoice status is computed from linked payments
The system SHALL derive invoice status dynamically:
- OUTSTANDING: no linked payments and `waivedAt` is null
- PARTIAL: sum of linked payment amounts > 0 and < `amountDue` and `waivedAt` is null
- PAID: sum of linked payment amounts >= `amountDue`
- WAIVED: `waivedAt` is not null (regardless of payments)

#### Scenario: No payments → OUTSTANDING
- **WHEN** an invoice has no linked PaymentRecords and is not waived
- **THEN** its computed status SHALL be OUTSTANDING

#### Scenario: Partial payment → PARTIAL
- **WHEN** the sum of linked PaymentRecord amounts is greater than 0 but less than `amountDue`
- **THEN** its computed status SHALL be PARTIAL

#### Scenario: Full payment → PAID
- **WHEN** the sum of linked PaymentRecord amounts is greater than or equal to `amountDue`
- **THEN** its computed status SHALL be PAID

#### Scenario: Waived invoice
- **WHEN** an invoice has `waivedAt` set
- **THEN** its computed status SHALL be WAIVED regardless of payment amounts

### Requirement: Admin can list invoices for a student
An admin SHALL be able to retrieve all invoices for a given student, including computed status and amount paid.

#### Scenario: List student invoices
- **WHEN** an admin requests invoices for a specific studentId
- **THEN** all invoices for that student are returned with computed status, amountDue, amountPaid, and dueDate

### Requirement: Admin can waive an invoice
An admin SHALL be able to waive an outstanding or partial invoice by providing a reason. Waiving a PAID invoice SHALL be rejected.

#### Scenario: Waive outstanding invoice
- **WHEN** an admin waives an invoice in OUTSTANDING or PARTIAL status with a reason
- **THEN** `waivedAt` is set to the current timestamp, `waivedReason` is recorded, and an audit log entry is written

#### Scenario: Waive paid invoice rejected
- **WHEN** an admin attempts to waive an invoice in PAID status
- **THEN** the system SHALL return an error and the invoice is not modified

#### Scenario: Non-admin cannot waive
- **WHEN** a non-admin authenticated user attempts to waive an invoice
- **THEN** the system SHALL return an authorization error
