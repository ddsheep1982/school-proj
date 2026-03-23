## MODIFIED Requirements

### Requirement: Admin can create and manage classes
Classes SHALL belong to a grade (which in turn belongs to a campus). When creating or editing a class, the admin SHALL select a grade. Class names SHALL be unique within the same grade.

#### Scenario: Create a class with a grade
- **WHEN** admin submits a valid class name, capacity, and selects a grade
- **THEN** the system SHALL create the class linked to that grade

#### Scenario: Create a class without selecting a grade is rejected
- **WHEN** admin submits a class without selecting a grade
- **THEN** the system SHALL reject the request with a validation error requiring grade selection

#### Scenario: Class name uniqueness is scoped to grade
- **WHEN** admin creates a class with the same name as an existing class in a different grade
- **THEN** the system SHALL allow the creation (names are unique per grade, not globally)

#### Scenario: Class name duplicate within same grade is rejected
- **WHEN** admin creates a class with the same name as an existing class in the same grade
- **THEN** the system SHALL reject the request with a uniqueness error

#### Scenario: Class list can be filtered by campus
- **WHEN** admin visits the class list and selects a campus filter
- **THEN** the system SHALL show only classes belonging to grades in that campus

#### Scenario: Class list can be filtered by grade
- **WHEN** admin visits the class list and selects a grade filter
- **THEN** the system SHALL show only classes belonging to that grade

#### Scenario: Existing classes without a grade are shown as "未分配"
- **WHEN** a class has no gradeId (legacy data)
- **THEN** the system SHALL display "未分配" as the grade label and allow editing to assign one

#### Scenario: Student list can be filtered by campus
- **WHEN** admin selects a campus in the student list filter
- **THEN** the system SHALL show only students enrolled in classes belonging to grades in that campus

#### Scenario: Student list can be filtered by grade
- **WHEN** admin selects a grade in the student list filter
- **THEN** the system SHALL show only students enrolled in classes belonging to that grade
