## ADDED Requirements

### Requirement: Admin can view financial summary statistics
An admin SHALL be able to view aggregated financial statistics including total tuition income (sum of PaymentRecord.amount), total recruitment cost expenditure (sum of RecruitmentCost.amount), and net income (income − expenditure). Stats MUST be filterable by date range and optionally by classId.

#### Scenario: Summary with no filters
- **WHEN** an admin requests the financial summary with no filters
- **THEN** the response includes totalIncome (all PaymentRecord amounts), totalCosts (all RecruitmentCost amounts), and netIncome = totalIncome − totalCosts

#### Scenario: Filter by date range
- **WHEN** an admin requests the financial summary with startDate and endDate
- **THEN** only PaymentRecord entries with paymentDate in range and RecruitmentCost entries with paymentDate in range are included in the totals

#### Scenario: Filter by classId
- **WHEN** an admin requests the financial summary filtered by a classId
- **THEN** only records belonging to students in that class are included

#### Scenario: Non-admin cannot view financial summary
- **WHEN** a non-admin authenticated user requests the financial summary
- **THEN** the system SHALL return an authorization error

### Requirement: Admin can view monthly income and cost breakdown
An admin SHALL be able to retrieve a month-by-month breakdown of tuition income and recruitment costs for a given year.

#### Scenario: Monthly breakdown for a year
- **WHEN** an admin requests the monthly breakdown for a specific year
- **THEN** the response includes 12 entries (one per month) each with month label, tuitionIncome, recruitmentCost, and netIncome; months with zero activity return 0 values

### Requirement: Admin can view per-student financial summary
An admin SHALL be able to retrieve a list of students with their total tuition paid and total recruitment cost, sortable by netContribution (tuition − cost).

#### Scenario: Per-student list
- **WHEN** an admin requests the per-student financial summary
- **THEN** each student entry includes studentNo, name, totalTuition, totalRecruitmentCost, and netContribution, ordered by netContribution descending by default
