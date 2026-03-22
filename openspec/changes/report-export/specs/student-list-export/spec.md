## ADDED Requirements

### Requirement: Admin can export student list as Excel
The system SHALL provide a `GET /api/export/students?format=xlsx` endpoint that accepts the same filter parameters as the student list page and returns a `.xlsx` file containing all matching students.

#### Scenario: Export all students as Excel
- **WHEN** admin visits `/api/export/students?format=xlsx` with no filters
- **THEN** the system SHALL return a `.xlsx` file download with all active and inactive students including columns: 学号、姓名、联系电话、家长电话、班级、在读状态、缴费状态、入学日期

#### Scenario: Export filtered students as Excel
- **WHEN** admin visits `/api/export/students?format=xlsx&enrollmentStatus=ACTIVE&classId=<id>`
- **THEN** the system SHALL return only students matching those filters in the Excel file

#### Scenario: Export student list as PDF
- **WHEN** admin visits `/api/export/students?format=pdf`
- **THEN** the system SHALL return a `.pdf` file download containing a formatted table of all students with the same columns as the Excel export

#### Scenario: Unauthenticated request is rejected
- **WHEN** an unauthenticated user calls `/api/export/students?format=xlsx`
- **THEN** the system SHALL return HTTP 401

#### Scenario: Export button on student list page
- **WHEN** admin is on the student list page (`/students`)
- **THEN** the page SHALL display export buttons ("导出 Excel" and "导出 PDF") that link to the export endpoint with the current active filter parameters

#### Scenario: Export with Chinese characters renders correctly
- **WHEN** the exported file contains Chinese student names or class names
- **THEN** both Excel and PDF files SHALL render Chinese characters correctly without garbled output
