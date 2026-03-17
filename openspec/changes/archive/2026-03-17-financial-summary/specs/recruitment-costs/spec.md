## ADDED Requirements

### Requirement: Admin can record a recruitment cost for a student
An admin SHALL be able to record a recruitment cost entry for a student, specifying the amount paid, payment date, recipient type (TEACHER or AGENT), and optionally the specific teacher or agent. An audit log entry MUST be written on creation.

#### Scenario: Successful cost entry for teacher
- **WHEN** an admin submits a recruitment cost with a valid studentId, amount > 0, paymentDate, and recipientType TEACHER with a valid teacherId
- **THEN** a `RecruitmentCost` record is created, linked to the student and teacher, and an audit log entry is written

#### Scenario: Successful cost entry for agent
- **WHEN** an admin submits a recruitment cost with recipientType AGENT and a valid agentId
- **THEN** a `RecruitmentCost` record is created linked to the agent, and an audit log entry is written

#### Scenario: Invalid input rejected
- **WHEN** an admin submits a recruitment cost with missing required fields or amount ≤ 0
- **THEN** the system SHALL return a validation error and no record is created

#### Scenario: Non-admin cannot record recruitment cost
- **WHEN** a non-admin authenticated user attempts to create a recruitment cost
- **THEN** the system SHALL return an authorization error

### Requirement: Admin can list recruitment costs for a student
An admin SHALL be able to retrieve all recruitment costs for a given student, ordered by paymentDate descending.

#### Scenario: List costs for student
- **WHEN** an admin requests recruitment costs for a studentId
- **THEN** all `RecruitmentCost` records for that student are returned with recipient info

### Requirement: Admin can delete a recruitment cost
An admin SHALL be able to delete a recruitment cost record. Deletion MUST write an audit log entry.

#### Scenario: Successful deletion
- **WHEN** an admin deletes a recruitment cost by id
- **THEN** the record is removed and an audit log entry is written

#### Scenario: Non-existent record
- **WHEN** an admin attempts to delete a recruitment cost id that does not exist
- **THEN** the system SHALL return an error
