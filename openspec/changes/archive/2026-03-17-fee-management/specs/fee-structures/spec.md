## ADDED Requirements

### Requirement: Admin can create a fee structure
An admin SHALL be able to create a named fee structure with an amount, recurrence type (ONE_TIME, TERM, ANNUAL), and academic year. The name and academic year combination MUST be unique.

#### Scenario: Successful creation
- **WHEN** an authenticated admin submits a valid fee structure (name, amount > 0, recurrence, academicYear)
- **THEN** a `FeeStructure` record is created, an audit log entry is written, and the new structure is returned

#### Scenario: Duplicate name for same academic year rejected
- **WHEN** an admin submits a fee structure with a name and academicYear that already exists
- **THEN** the system SHALL return a validation error and no record is created

#### Scenario: Non-admin cannot create
- **WHEN** a non-admin authenticated user attempts to create a fee structure
- **THEN** the system SHALL return an authorization error

### Requirement: Admin can list fee structures
An admin SHALL be able to retrieve all fee structures, optionally filtered by academicYear.

#### Scenario: List all structures
- **WHEN** an admin requests the fee structure list with no filter
- **THEN** all fee structures are returned ordered by academicYear descending, then name ascending

#### Scenario: Filter by academic year
- **WHEN** an admin requests fee structures filtered by a specific academicYear
- **THEN** only structures matching that academicYear are returned

### Requirement: Admin can update a fee structure
An admin SHALL be able to update the name, amount, or description of a fee structure that has no associated FeeAssignments. Fee structures with existing assignments MUST be immutable to preserve invoice integrity.

#### Scenario: Update structure with no assignments
- **WHEN** an admin updates a fee structure that has zero FeeAssignment records
- **THEN** the structure is updated and an audit log entry is written

#### Scenario: Update blocked when assignments exist
- **WHEN** an admin attempts to update a fee structure that has one or more FeeAssignment records
- **THEN** the system SHALL return an error stating the structure cannot be modified

### Requirement: Admin can delete a fee structure
An admin SHALL be able to delete a fee structure that has no associated FeeAssignments.

#### Scenario: Delete with no assignments
- **WHEN** an admin deletes a fee structure with no assignments
- **THEN** the record is removed and an audit log entry is written

#### Scenario: Delete blocked when assignments exist
- **WHEN** an admin attempts to delete a fee structure with existing assignments
- **THEN** the system SHALL return an error and the record is not deleted
