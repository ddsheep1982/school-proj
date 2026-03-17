## MODIFIED Requirements

### Requirement: Admin can withdraw a student
The system SHALL allow an admin to mark a student as withdrawn by setting `withdrawalDate` and `withdrawalReason`, with optional simultaneous refund recording. If refund fields are provided (`refundAmount`, `refundDate`, `refundReason`), the system SHALL atomically create a `RefundRecord` linked to the student in the same database transaction. Withdrawn students SHALL remain in the database for historical records. Student lists SHALL default to showing only active (non-withdrawn) students, with an option to include withdrawn students.

#### Scenario: Admin withdraws a student without refund
- **WHEN** an admin submits a withdrawal with a valid `withdrawalDate` and `withdrawalReason` and no refund fields for an active student
- **THEN** the student's `withdrawalDate` and `withdrawalReason` are set, `enrollmentStatus` becomes WITHDRAWN, an audit log entry is written, and no RefundRecord is created

#### Scenario: Admin withdraws a student with refund
- **WHEN** an admin submits a withdrawal with `withdrawalDate`, `withdrawalReason`, `refundAmount`, `refundDate`, and `refundReason` for an active student
- **THEN** the student's withdrawal fields are set, a `RefundRecord` is created with the provided refund data linked to the student, both operations succeed atomically, and an audit log entry is written

#### Scenario: Admin withdraws a student with refund linked to an invoice
- **WHEN** an admin submits a withdrawal with refund fields including a valid `refundInvoiceId` belonging to the same student
- **THEN** the `RefundRecord` is created with `invoiceId` set to the provided invoice

#### Scenario: Refund with partial fields is rejected
- **WHEN** an admin submits a withdrawal with `refundAmount` provided but without `refundDate` or `refundReason`
- **THEN** the system SHALL return a validation error and neither the withdrawal nor the refund record is created

#### Scenario: Refund amount must be positive
- **WHEN** an admin submits a withdrawal with `refundAmount` set to 0 or a negative value
- **THEN** the system SHALL return a validation error

#### Scenario: Withdrawn student excluded from default list
- **WHEN** an admin views the student list without the "include withdrawn" filter
- **THEN** withdrawn students (those with a non-null `withdrawalDate`) SHALL NOT appear in the results

#### Scenario: Withdrawn students visible when filter applied
- **WHEN** an admin views the student list with the "include withdrawn" filter enabled
- **THEN** all students including withdrawn ones SHALL appear in the list

#### Scenario: Cannot withdraw an already withdrawn student
- **WHEN** an admin attempts to withdraw a student who is already withdrawn
- **THEN** the system SHALL return a validation error
