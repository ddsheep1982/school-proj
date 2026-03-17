## ADDED Requirements

### Requirement: Payment can be linked to an invoice at creation
When creating a PaymentRecord, an admin MAY optionally supply an `invoiceId`. The system SHALL validate that the referenced invoice belongs to the same student as the payment.

#### Scenario: Payment linked to valid invoice
- **WHEN** an admin creates a payment with a valid invoiceId referencing an invoice for the same student
- **THEN** the PaymentRecord is created with `invoiceId` set and the invoice's computed status updates accordingly

#### Scenario: Invoice-student mismatch rejected
- **WHEN** an admin creates a payment with an invoiceId that belongs to a different student than the payment's studentId
- **THEN** the system SHALL return a validation error and no record is created

#### Scenario: Payment without invoiceId still valid
- **WHEN** an admin creates a payment with no invoiceId
- **THEN** the PaymentRecord is created as a standalone payment with `invoiceId = null`, identical to existing behavior

### Requirement: Admin can view outstanding balance for a student
The system SHALL provide a query returning the total outstanding amount across all OUTSTANDING and PARTIAL invoices for a student.

#### Scenario: Student with mixed invoice statuses
- **WHEN** an admin queries the outstanding balance for a student with OUTSTANDING, PARTIAL, and PAID invoices
- **THEN** the response includes the sum of remaining amounts only from OUTSTANDING and PARTIAL invoices (amountDue minus amountPaid for each)

#### Scenario: Student with no invoices
- **WHEN** an admin queries the outstanding balance for a student with no invoices
- **THEN** the response returns a balance of 0

### Requirement: Admin can list invoices with payment summary across the school
An admin SHALL be able to retrieve a paginated list of invoices across all students filtered by status and/or academicYear, including student name, fee structure name, amountDue, amountPaid, and computed status.

#### Scenario: Filter by OUTSTANDING status
- **WHEN** an admin requests invoices filtered by status OUTSTANDING
- **THEN** only invoices with computed status OUTSTANDING are returned

#### Scenario: Filter by academicYear
- **WHEN** an admin requests invoices filtered by academicYear
- **THEN** only invoices whose fee structure matches that academicYear are returned
