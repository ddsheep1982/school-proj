## ADDED Requirements

### Requirement: Admin can export financial report as Excel
The system SHALL provide a `GET /api/export/finance?format=xlsx&year=<YYYY>` endpoint that returns an Excel file containing the annual financial breakdown: monthly income, recruitment costs, refunds, and net income.

#### Scenario: Export financial report as Excel for a given year
- **WHEN** admin visits `/api/export/finance?format=xlsx&year=2026`
- **THEN** the system SHALL return a `.xlsx` file with two sheets: (1) 月度汇总 with columns 月份、学费收入、招生提成、退费、净收入; (2) 收费明细 listing all PaymentRecords for the year

#### Scenario: Export financial report as PDF
- **WHEN** admin visits `/api/export/finance?format=pdf&year=2026`
- **THEN** the system SHALL return a `.pdf` file containing the same monthly summary table as the Excel export, formatted for printing

#### Scenario: Year defaults to current year when omitted
- **WHEN** admin visits `/api/export/finance?format=xlsx` without a year parameter
- **THEN** the system SHALL use the current calendar year as the default

#### Scenario: Unauthenticated request is rejected
- **WHEN** an unauthenticated user calls `/api/export/finance?format=xlsx`
- **THEN** the system SHALL return HTTP 401

#### Scenario: Export button on finance page
- **WHEN** admin is on the finance page (`/finance`)
- **THEN** the page SHALL display export buttons ("导出 Excel" and "导出 PDF") that link to the export endpoint with the currently selected year

#### Scenario: Monetary amounts formatted correctly in export
- **WHEN** the exported file contains monetary amounts
- **THEN** amounts SHALL be formatted as numbers (not strings) in Excel cells, and as "¥X,XXX.XX" in PDF output
