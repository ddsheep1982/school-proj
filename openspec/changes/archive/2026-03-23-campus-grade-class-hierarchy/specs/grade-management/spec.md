## ADDED Requirements

### Requirement: Admin can manage grades within a campus
The system SHALL allow admins to create, edit, and archive grades (年级) that belong to a specific campus.

#### Scenario: Create a grade within a campus
- **WHEN** admin submits a grade name and selects a parent campus
- **THEN** the system SHALL create the grade linked to that campus

#### Scenario: Grade name required and campus required
- **WHEN** admin submits a grade without a name or without a campus
- **THEN** the system SHALL reject the request with appropriate validation errors

#### Scenario: Grade list shows grades grouped by campus
- **WHEN** admin visits the grade management page
- **THEN** the system SHALL display grades grouped under their parent campus

#### Scenario: Archive a grade
- **WHEN** admin archives a grade
- **THEN** the system SHALL mark it as archived; it SHALL NOT appear in the class creation dropdown

#### Scenario: Grade names are unique within a campus
- **WHEN** admin creates a grade with the same name as an existing grade in the same campus
- **THEN** the system SHALL reject the request with a uniqueness error
