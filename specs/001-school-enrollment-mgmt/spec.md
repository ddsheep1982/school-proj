# Feature Specification: School Enrollment & Management Platform

**Feature Branch**: `001-school-enrollment-mgmt`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "开发一个web based的应用，可以用来管理学校的学生入学信息，缴费信息，班级信息，招生老师信息，在校时间，离校时间。需要可以关联各个数据项目，可以实现看板功能"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Enrollment Registration (Priority: P1)

An admin or staff member registers a new student into the system. They fill in the
student's basic information, select the class the student will join, and assign the
enrollment teacher responsible for this student. Once saved, the student record is
immediately visible and linked to the correct class and teacher.

**Why this priority**: Student enrollment is the core data entry point for the entire
system. All other modules (payments, attendance, dashboard) depend on students existing
in the system first.

**Independent Test**: Create a new student, assign them to a class and an enrollment
teacher, then verify the student appears in the student list, in the class roster, and
in the enrollment teacher's student list — all without any other module needing to work.

**Acceptance Scenarios**:

1. **Given** the system has at least one class and one enrollment teacher configured,
   **When** a user submits a new student registration form with all required fields,
   **Then** the student record is saved and appears in the student list with correct
   class and enrollment teacher associations.

2. **Given** a student record exists,
   **When** a user edits the student's enrollment information and saves,
   **Then** all associated views (class roster, enrollment teacher list) reflect the
   updated information immediately.

3. **Given** a user submits the registration form with missing required fields,
   **When** they attempt to save,
   **Then** the system highlights the missing fields and prevents submission until they
   are filled.

4. **Given** a large student list,
   **When** a user searches by student name or ID,
   **Then** matching results appear within 2 seconds.

---

### User Story 2 - Management Dashboard & Kanban (Priority: P2)

The dashboard provides a real-time overview of the school's operational status. It
displays key metrics and a kanban-style board grouping students by enrollment status.
Users can click on any card or metric to drill down into the relevant filtered list.

**Why this priority**: The dashboard is the primary daily-use screen for administrators.
It aggregates data across all modules and provides immediate visibility into school
operations. It can be built as soon as students exist in the system.

**Independent Test**: With at least 5 students in varying enrollment statuses, verify
the dashboard displays the correct counts per status, the kanban columns show the correct
students, and clicking a column navigates to the filtered student list.

**Acceptance Scenarios**:

1. **Given** student records exist in the system,
   **When** a user opens the dashboard,
   **Then** they see summary cards showing: total students, student count by enrollment
   status, and student count by payment status.

2. **Given** the dashboard kanban view is active,
   **When** a user views the kanban board,
   **Then** students are grouped into three columns by enrollment status:
   在读 | 退学 | 毕业.

3. **Given** the dashboard is displayed,
   **When** a user clicks on a summary metric or kanban column header,
   **Then** they navigate to a filtered student list showing only students in that category.

4. **Given** the dashboard is displayed,
   **When** a user applies a filter by class or by enrollment teacher,
   **Then** all dashboard metrics and the kanban board update to show only the filtered
   population.

5. **Given** a student's data has been updated,
   **When** a user views or refreshes the dashboard,
   **Then** all metrics reflect the latest state.

---

### User Story 3 - Fee & Payment Management (Priority: P2)

Staff record and track each student's payment status. They can log new payments, view
payment history per student, and identify which students have outstanding balances. Payment
records are linked to the student profile and visible from the student detail view.

**Why this priority**: Fee collection is a critical operational need. Knowing who has paid
and who has an outstanding balance is required for daily school operations.

**Independent Test**: Record a payment against an existing student, verify it appears on
the student's payment history, verify the balance updates correctly, and verify the payment
status indicator on the student list reflects the change.

**Acceptance Scenarios**:

1. **Given** a student record exists,
   **When** a staff member records a new payment with amount, date, and payment type,
   **Then** the payment is saved, the student's running balance updates, and the payment
   status (Paid / Partial / Overdue) reflects the new total.

2. **Given** a student has multiple payments recorded,
   **When** a user views the student's payment history,
   **Then** all payment entries are listed in chronological order with running totals.

3. **Given** a list of students,
   **When** a user filters by payment status (e.g., "Overdue"),
   **Then** only students matching that status are shown.

4. **Given** a payment record was entered incorrectly,
   **When** an authorized user voids or adjusts the record,
   **Then** the student's balance recalculates correctly and an audit entry is preserved.

---

### User Story 4 - Class Management (Priority: P3)

Administrators manage the school's class structure. They create classes, set capacity,
and view the roster of students assigned to each class. Class records are linked to
students and visible from both the class view and individual student profiles.

**Why this priority**: Classes are an organizing structure for the platform. They are
needed before the dashboard can show per-class breakdowns, but the platform can function
for enrollment and payment without this being fully built out.

**Independent Test**: Create a new class, assign two existing students to it, then verify
both students appear in the class roster and each student's profile shows the correct class.

**Acceptance Scenarios**:

1. **Given** the admin is on the class management page,
   **When** they create a new class with a name and capacity,
   **Then** the class appears in the class list and is available for selection when
   enrolling a student.

2. **Given** a class exists with enrolled students,
   **When** a user views the class detail page,
   **Then** they see the full student roster, current enrollment count, and remaining
   capacity.

3. **Given** a class has reached maximum capacity,
   **When** a user attempts to assign another student to that class,
   **Then** the system warns the user that the class is at capacity before allowing
   confirmation.

---

### User Story 5 - Enrollment Teacher Management (Priority: P3)

Administrators manage the list of enrollment teachers (招生老师) responsible for
recruiting and onboarding students. Each teacher record is linked to the students they
enrolled, providing a clear view of each teacher's student portfolio.

**Why this priority**: Enrollment teachers are a key relationship for tracking student
origin and staff accountability. The platform functions for core enrollment without this
fully built, but it enables per-teacher metrics on the dashboard.

**Independent Test**: Create an enrollment teacher record, assign existing students to
that teacher, then verify the teacher profile shows their student list and each student's
profile shows the correct enrollment teacher.

**Acceptance Scenarios**:

1. **Given** the admin is on the enrollment teacher management page,
   **When** they add a new teacher with name and contact information,
   **Then** the teacher appears in the teacher list and is available for assignment when
   enrolling a student.

2. **Given** an enrollment teacher exists with assigned students,
   **When** a user views the teacher's profile,
   **Then** they see the full list of students that teacher enrolled, with each student's
   payment status shown.

3. **Given** an enrollment teacher has active student assignments,
   **When** a user attempts to delete that teacher record,
   **Then** the system prevents deletion and prompts the user to reassign those students
   first.

---

### User Story 6 - Recruitment Agent Management (Priority: P3)

Administrators manage the list of external recruitment agents (外部招生代理) who refer
students to the school. Each agent record is linked to the students they referred. When
registering a student, staff select whether the recruitment source was an internal
enrollment teacher or an external agent, and link the corresponding record.

**Why this priority**: Knowing whether a student came through an internal teacher or an
external agent is important for tracking channel effectiveness and agent accountability.
It does not block core enrollment workflows but enriches the data quality significantly.

**Independent Test**: Create an external recruitment agent, register a new student with
that agent as the recruitment source, then verify the student's profile shows the correct
channel and agent, and the agent's profile lists that student.

**Acceptance Scenarios**:

1. **Given** the admin is on the recruitment agent management page,
   **When** they add a new agent with name and contact information,
   **Then** the agent appears in the agent list and is available as a recruitment source
   when registering a student.

2. **Given** a student registration form is open,
   **When** a staff member selects "外部招生代理" as the recruitment channel type and
   chooses an agent from the list,
   **Then** the student record is saved with the agent linked as the recruitment source.

3. **Given** a staff member selects "招生老师" as the recruitment channel type,
   **When** they choose an enrollment teacher from the list,
   **Then** the student record is saved with that teacher linked as the recruitment source.

4. **Given** a recruitment agent has active student assignments,
   **When** a user attempts to delete that agent record,
   **Then** the system prevents deletion and prompts the user to reassign those students
   first.

---

### User Story 7 - Attendance Time Tracking (Priority: P4)

Staff record and review student check-in (到校) and check-out (离校) times. Each
attendance record is linked to a student and date. Staff can view a student's attendance
history and see which students checked in on a given day.

**Why this priority**: Attendance tracking is an operational need but does not block the
core enrollment, payment, or dashboard workflows. It adds value once the core data
structures are established.

**Independent Test**: Record a check-in and check-out time for a student on a given date,
then verify the attendance record appears in that student's history and the daily
attendance overview shows the student as present.

**Acceptance Scenarios**:

1. **Given** a student record exists,
   **When** a staff member records a check-in time for that student on a specific date,
   **Then** the attendance record is saved and the student shows as "present" for that day.

2. **Given** a check-in record exists for a student,
   **When** a staff member records the check-out time,
   **Then** the on-campus duration is calculated and displayed on the attendance record.

3. **Given** a user is viewing a student's profile,
   **When** they navigate to the attendance section,
   **Then** they see the student's full attendance history sorted by date with check-in
   and check-out times for each day.

4. **Given** a selected date,
   **When** a user views the daily attendance overview for that date,
   **Then** they see a list of all students and their check-in status for that day.

---

### Edge Cases

- What happens when a student is assigned to a class that has since been archived?
- How does the system handle a duplicate submission with the same student name and
  contact number?
- What happens if a check-out time is recorded before a check-in time on the same day?
- How does the payment balance display when no fee amount has been configured for a
  student yet?
- What happens to a student's records when their assigned enrollment teacher is deleted
  after reassignment?
- How does the kanban board render when a single status column contains more than
  50 students?
- What happens when a student's recruitment source (enrollment teacher or external agent)
  is deactivated after the student was already enrolled — is the historical link preserved?
- Can a student's recruitment channel be changed after initial registration, and if so,
  is the original channel recorded for audit purposes?

## Requirements *(mandatory)*

### Functional Requirements

**Student Management**

- **FR-001**: System MUST allow authorized users to create, view, edit, and deactivate
  student records.
- **FR-002**: Each student record MUST capture: full name, auto-generated student ID,
  contact phone number, parent/guardian contact, enrollment date, enrollment status
  (在读 / 退学 / 毕业), assigned class, assigned enrollment teacher, recruitment channel
  type (招生老师 / 外部招生代理), and the linked source record for that channel. Newly
  created student records MUST default to status 在读.
- **FR-003**: System MUST enforce that each student has a unique system-generated ID.
- **FR-004**: System MUST allow users to search and filter students by name, class,
  enrollment teacher, enrollment status, payment status, and recruitment channel.
- **FR-005**: System MUST display all linked data (class, enrollment teacher, payment
  records, attendance history) from a single student detail page with no more than
  2 navigation actions.

**Fee & Payment Management**

- **FR-006**: System MUST allow authorized users to record a payment against a student
  with: amount, payment date, payment type, and optional notes.
- **FR-007**: System MUST calculate and display each student's cumulative payment total
  (the sum of all payment record amounts, including adjustments). No fee target amount
  is configured per student or class; the cumulative total represents what has been
  paid to date. The separately managed `paymentStatus` field (FR-008) reflects the
  staff-assessed payment state (Paid / Partial / Overdue) and is not derived from
  this total automatically.
- **FR-008**: System MUST default every newly enrolled student's payment status to "Paid"
  (已缴费). Staff may subsequently record additional payment entries or adjustments; the
  status may be updated to Partial or Overdue only by explicit staff action. No fee
  configuration module is required.
- **FR-009**: System MUST preserve an immutable record of all payment entries; corrections
  MUST be recorded as adjustment entries, not overwrites of the original.
- **FR-010**: System MUST allow the student list to be filtered by payment status.

**Class Management**

- **FR-011**: System MUST allow administrators to create, rename, and archive classes.
- **FR-012**: Each class record MUST capture: class name and maximum capacity.
- **FR-013**: System MUST display the current enrollment count and remaining capacity for
  each class on the class list and class detail views.
- **FR-014**: System MUST warn the user (without hard-blocking) when assigning a student
  to a class that has reached maximum capacity.

**Enrollment Teacher Management**

- **FR-015**: System MUST allow administrators to create, edit, and deactivate enrollment
  teacher records. Note: Enrollment teachers serve two distinct roles in the system —
  (1) **办理老师 (Enrollment Processor)**: the teacher who processed the student's
  enrollment paperwork; and (2) **招生来源 (Recruitment Source)**: when a student's
  recruitment channel type is "招生老师", the specific teacher who referred that student.
  The student registration form MUST label and capture both roles with distinct UI fields.
- **FR-016**: Each enrollment teacher record MUST capture: name and contact phone number.
- **FR-017**: System MUST prevent deletion of an enrollment teacher who has active student
  assignments and MUST prompt the user to reassign those students first.
- **FR-018**: System MUST display a summary of each enrollment teacher's portfolio showing
  total students and a payment status breakdown from the teacher's profile view.

**Recruitment Agent Management**

- **FR-030**: System MUST allow administrators to create, edit, and deactivate external
  recruitment agent records (外部招生代理).
- **FR-031**: Each recruitment agent record MUST capture: agent name, agency name
  (optional), and contact phone number.
- **FR-032**: System MUST prevent deletion of a recruitment agent who has active student
  assignments and MUST prompt the user to reassign those students first.
- **FR-033**: System MUST display a summary of each recruitment agent's student portfolio
  showing total referred students and payment status breakdown from the agent's profile view.
- **FR-034**: System MUST allow the student list and dashboard to be filtered by
  recruitment channel type (招生老师 / 外部招生代理) or by a specific agent.

**Attendance Tracking**

- **FR-019**: System MUST allow staff to record a check-in time and check-out time per
  student per calendar day.
- **FR-020**: System MUST calculate and display the on-campus duration for each attendance
  record where both check-in and check-out times are present.
- **FR-021**: System MUST provide a daily attendance overview listing all students and
  their check-in status for any selected date.
- **FR-022**: System MUST display a student's full attendance history from the student
  detail page.

**Dashboard & Kanban**

- **FR-023**: System MUST provide a dashboard showing: total active students, student
  count by enrollment status, student count by payment status, and today's attendance
  count.
- **FR-024**: System MUST provide a kanban board with three fixed columns grouping students
  by enrollment status: 在读, 退学, 毕业.
- **FR-025**: System MUST allow users to click any dashboard metric or kanban column to
  navigate to the corresponding filtered student list.
- **FR-026**: System MUST allow the dashboard to be filtered by class, enrollment teacher,
  and recruitment channel (type or specific agent), with all metrics and the kanban
  updating accordingly.

**Access & Security**

- **FR-027**: System MUST require user authentication before accessing any page or
  data endpoint.
- **FR-028**: System MUST support two roles: Administrator (full access including
  configuration and deletion) and Staff (data entry and viewing, no delete or system
  configuration access).
- **FR-029**: System MUST record an audit log entry for every data creation, modification,
  and deletion event, capturing who made the change and when.

### Key Entities

- **Student** (学生): The central entity. Represents a student in any phase of their
  school journey. Attributes: system-generated ID, full name, contact phone,
  parent/guardian contact, enrollment date, enrollment status (在读 / 退学 / 毕业),
  recruitment channel type (招生老师 / 外部招生代理). Linked to: one Class, one
  Enrollment Teacher, one Recruitment Source (either an Enrollment Teacher or a
  Recruitment Agent), many Payment Records, many Attendance Records.

- **Class** (班级): Represents a class or grade group. Attributes: name, maximum capacity,
  current enrollment count. Linked to: many Students.

- **Enrollment Teacher** (招生老师): Represents a staff member responsible for recruiting
  and enrolling students. Attributes: name, contact phone, active status. Linked to:
  many Students.

- **Payment Record** (缴费记录): Represents a single payment transaction or adjustment.
  Attributes: amount, payment date, payment type, notes, created-by user, timestamp.
  Linked to: one Student.

- **Attendance Record** (考勤记录): Represents a student's presence on a given calendar
  day. Attributes: date, check-in time, check-out time, calculated duration. Linked to:
  one Student.

- **Recruitment Agent** (外部招生代理): Represents an external agent or agency that
  refers students to the school. Attributes: agent name, agency name (optional), contact
  phone, active status. Linked to: many Students (as their recruitment source).

- **User** (系统用户): Represents a system operator. Attributes: name, login credential,
  role (Admin / Staff), active status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A staff member can complete the registration of a new student (including
  class and enrollment teacher assignment) in under 3 minutes.
- **SC-002**: The dashboard loads and displays up-to-date metrics within 5 seconds for a
  school with up to 500 active students.
- **SC-003**: A user can locate any student record using search or filters in under
  30 seconds.
- **SC-004**: Payment status across all students is accurately reflected on the dashboard
  and student list without any manual reconciliation step.
- **SC-005**: Staff can record a student check-in or check-out in under 30 seconds.
- **SC-006**: 90% of first-time users can complete a student enrollment end-to-end without
  assistance, after a single orientation session of 15 minutes or less.
- **SC-007**: All data relationships (student ↔ class, student ↔ enrollment teacher,
  student ↔ payments, student ↔ attendance) are navigable from the student profile page
  with no more than 2 clicks.

## Assumptions

- The application serves a single school (not a multi-tenant platform); all users and data
  belong to one institution.
- User authentication uses standard username/password login. SSO or social login is out of
  scope for this version.
- The system is web browser-based only; native mobile applications are out of scope.
- Attendance is recorded manually by staff (e.g., at a front desk). Automated check-in
  methods (QR codes, RFID, facial recognition) are out of scope for this version.
- The kanban board is a read-only grouped view; drag-and-drop to change a student's
  enrollment status is not required in this version.
- Payments are entered manually to record offline transactions (cash, bank transfer, etc.).
  Integration with payment processors or online payment is out of scope.
- Reports and bulk data export (PDF, Excel) are out of scope for this version.
- The system supports Simplified Chinese as the primary display language.
