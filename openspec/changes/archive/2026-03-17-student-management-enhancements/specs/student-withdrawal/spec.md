## ADDED Requirements

### Requirement: Admin can withdraw a student
The system SHALL allow an admin to mark a student as withdrawn by setting `withdrawalDate` and `withdrawalReason`. Withdrawn students SHALL remain in the database for historical records. Student lists SHALL default to showing only active (non-withdrawn) students, with an option to include withdrawn students.

#### Scenario: Admin withdraws a student
- **WHEN** an admin submits a withdrawal with a valid `withdrawalDate` and `withdrawalReason` for an active student
- **THEN** the student's `withdrawalDate` and `withdrawalReason` are set, an audit log entry is written, and the student is no longer shown in the default student list

#### Scenario: Withdrawn student excluded from default list
- **WHEN** an admin views the student list without the "include withdrawn" filter
- **THEN** withdrawn students (those with a non-null `withdrawalDate`) SHALL NOT appear in the results

#### Scenario: Withdrawn students visible when filter applied
- **WHEN** an admin views the student list with the "include withdrawn" filter enabled
- **THEN** all students including withdrawn ones SHALL appear in the list

#### Scenario: Cannot withdraw an already withdrawn student
- **WHEN** an admin attempts to withdraw a student who is already withdrawn
- **THEN** the system SHALL return a validation error

### Requirement: Admin can delete a student with no records
The system SHALL allow an admin to permanently delete a student only when the student has no associated payments, invoices, attendance records, recruitment costs, or refund records.

#### Scenario: Student with no records is deleted
- **WHEN** an admin requests hard deletion of a student with no associated records
- **THEN** the student record is permanently removed and an audit log entry is written

#### Scenario: Student with associated records cannot be hard deleted
- **WHEN** an admin requests hard deletion of a student who has any associated records
- **THEN** the system SHALL return an error preventing deletion

### Requirement: Admin can delete a class with no active students
The system SHALL allow an admin to permanently delete a class only when the class has no active (non-withdrawn) enrolled students.

#### Scenario: Empty class is deleted
- **WHEN** an admin requests deletion of a class with no active enrolled students
- **THEN** the class record is permanently removed and an audit log entry is written

#### Scenario: Class with active students cannot be deleted
- **WHEN** an admin requests deletion of a class that has active enrolled students
- **THEN** the system SHALL return an error preventing deletion

### Requirement: Admin can record a refund for a withdrawn student
The system SHALL allow an admin to record a refund (`RefundRecord`) for a student, specifying the refund amount, reason, date, and optionally linking to an invoice.

#### Scenario: Refund recorded with invoice link
- **WHEN** an admin submits a refund with a valid `invoiceId` belonging to the same student
- **THEN** a `RefundRecord` is created with all fields set and an audit log entry is written

#### Scenario: Refund recorded without invoice link
- **WHEN** an admin submits a refund without an `invoiceId`
- **THEN** a `RefundRecord` is created with `invoiceId = null` and an audit log entry is written

#### Scenario: Refund with mismatched invoice rejected
- **WHEN** an admin submits a refund with an `invoiceId` belonging to a different student
- **THEN** the system SHALL return a validation error and no record is created

#### Scenario: Refund list visible on student detail page
- **WHEN** an authenticated user views a student's financial tab
- **THEN** all `RefundRecord` entries for that student SHALL be displayed with amount, reason, and refundDate
