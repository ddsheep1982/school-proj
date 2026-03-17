## MODIFIED Requirements

### Requirement: Admin can record a payment for a student
The system SHALL allow an admin to record a payment for a student. The payment MAY optionally reference an invoice via `invoiceId`. When `invoiceId` is provided, the system SHALL validate that the invoice belongs to the same student. When omitted, the payment is recorded as a standalone record with no invoice linkage.

#### Scenario: Payment created without invoice reference
- **WHEN** an admin submits a valid payment with no invoiceId
- **THEN** a PaymentRecord is created with `invoiceId = null` and an audit log entry is written

#### Scenario: Payment created with valid invoice reference
- **WHEN** an admin submits a valid payment with an invoiceId referencing an invoice for the same student
- **THEN** a PaymentRecord is created with `invoiceId` set and an audit log entry is written

#### Scenario: Payment with mismatched invoice rejected
- **WHEN** an admin submits a payment with an invoiceId that belongs to a different student
- **THEN** the system SHALL return a validation error and no record is created

#### Scenario: Non-admin cannot record a payment
- **WHEN** a non-admin authenticated user attempts to create a payment
- **THEN** the system SHALL return an authorization error

## ADDED Requirements

### Requirement: Admin can delete a refund record
The system SHALL allow an admin to delete a `RefundRecord` entry.

#### Scenario: Refund record deleted
- **WHEN** an admin requests deletion of a refund record
- **THEN** the record is permanently removed and an audit log entry is written
