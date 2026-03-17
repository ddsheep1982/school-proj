## ADDED Requirements

### Requirement: Admin can assign a fee structure to an individual student
An admin SHALL be able to assign a fee structure to a single student, specifying a due date. This MUST create exactly one Invoice record for that student.

#### Scenario: Successful individual assignment
- **WHEN** an admin assigns a valid fee structure to a student with a due date
- **THEN** a `FeeAssignment` record is created with `studentId` set, one `Invoice` record is created for that student, and an audit log entry is written

#### Scenario: Duplicate individual assignment rejected
- **WHEN** an admin assigns the same fee structure to the same student a second time
- **THEN** the system SHALL return a validation error and no records are created

### Requirement: Admin can assign a fee structure to a class (bulk)
An admin SHALL be able to assign a fee structure to a class, specifying a due date. This MUST create one Invoice per currently enrolled student in that class.

#### Scenario: Successful class assignment
- **WHEN** an admin assigns a valid fee structure to a class with enrolled students
- **THEN** a `FeeAssignment` record is created with `classId` set, one `Invoice` record is created per enrolled student, and a single audit log entry is written recording the count of invoices generated

#### Scenario: Class with no students
- **WHEN** an admin assigns a fee structure to a class that has no enrolled students
- **THEN** a `FeeAssignment` record is created but zero `Invoice` records are generated; the response indicates zero invoices created

#### Scenario: Non-admin cannot assign
- **WHEN** a non-admin authenticated user attempts to create a fee assignment
- **THEN** the system SHALL return an authorization error

### Requirement: Admin can list fee assignments
An admin SHALL be able to list all fee assignments, optionally filtered by feeStructureId or classId.

#### Scenario: List all assignments
- **WHEN** an admin requests all fee assignments
- **THEN** all assignments are returned with their associated fee structure name and target (student or class)

### Requirement: Admin can delete a fee assignment
An admin SHALL be able to delete a fee assignment only if all its generated invoices are in OUTSTANDING status (i.e., no payments have been made). Deletion MUST cascade-delete the associated Invoice records.

#### Scenario: Delete with no payments
- **WHEN** an admin deletes a fee assignment whose invoices have no linked payments
- **THEN** the assignment and all its Invoice records are deleted and an audit log entry is written

#### Scenario: Delete blocked when payments exist
- **WHEN** an admin attempts to delete a fee assignment where at least one invoice has linked payments
- **THEN** the system SHALL return an error and nothing is deleted
