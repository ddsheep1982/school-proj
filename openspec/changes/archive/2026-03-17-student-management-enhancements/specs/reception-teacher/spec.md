## ADDED Requirements

### Requirement: Student has an optional reception teacher
Each student record SHALL support an optional `receptionTeacherId` field referencing an `EnrollmentTeacher`. This field is independent of the existing `enrollmentTeacherId` (招生老师). The reception teacher (接待老师) field SHALL be displayed and editable on the student detail page.

#### Scenario: Reception teacher assigned when creating or editing a student
- **WHEN** an admin creates or edits a student and selects a reception teacher
- **THEN** the student's `receptionTeacherId` is set to the selected teacher's ID

#### Scenario: Reception teacher is optional
- **WHEN** an admin creates or edits a student without selecting a reception teacher
- **THEN** the student record is saved with `receptionTeacherId = null`

#### Scenario: Reception teacher displayed on student detail
- **WHEN** an authenticated user views a student's detail page
- **THEN** the reception teacher's name is displayed (or "无" if not set)

### Requirement: Admin can record a recruitment cost for a reception teacher
The system SHALL allow an admin to record a `RecruitmentCost` entry with `recipientType = RECEPTION_TEACHER`, linking to an `EnrollmentTeacher` via `teacherId`.

#### Scenario: Recruitment cost recorded for reception teacher
- **WHEN** an admin submits a recruitment cost with `recipientType = RECEPTION_TEACHER` and a valid `teacherId`
- **THEN** a `RecruitmentCost` record is created with those values and an audit log entry is written

#### Scenario: Reception teacher recruitment cost visible in financial tab
- **WHEN** an authenticated user views a student's financial tab
- **THEN** `RecruitmentCost` entries with `recipientType = RECEPTION_TEACHER` are displayed with the recipient teacher's name and labeled as "接待老师"

#### Scenario: Financial overview includes reception teacher costs
- **WHEN** an admin views the financial overview page
- **THEN** recruitment costs with `recipientType = RECEPTION_TEACHER` are included in total recruitment expenditure
