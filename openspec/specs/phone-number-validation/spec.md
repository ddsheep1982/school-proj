### Requirement: Phone numbers must match Chinese mobile format
The system SHALL validate that phone number fields conform to the Chinese mainland mobile phone format: starts with 1, second digit 3–9, total 11 digits (`/^1[3-9]\d{9}$/`). This applies to student contact phone (`phone`), guardian phone (`guardianPhone`), and teacher phone (`phone`).

#### Scenario: Valid Chinese mobile number is accepted
- **WHEN** user submits a phone number matching `/^1[3-9]\d{9}$/` (e.g., `13812345678`)
- **THEN** the system SHALL accept the value and proceed with save

#### Scenario: Number with wrong length is rejected
- **WHEN** user submits a phone number that is not 11 digits (e.g., `1381234567` — 10 digits)
- **THEN** the system SHALL reject the request and return an error message indicating the phone number format is invalid

#### Scenario: Number with invalid prefix is rejected
- **WHEN** user submits a phone number whose second digit is not 3–9 (e.g., `12012345678`)
- **THEN** the system SHALL reject the request with a format validation error

#### Scenario: Non-numeric characters are rejected
- **WHEN** user submits a phone number containing non-digit characters (e.g., `138-1234-5678`)
- **THEN** the system SHALL reject the request with a format validation error

#### Scenario: Empty phone is rejected on create
- **WHEN** user submits a create request with an empty phone field
- **THEN** the system SHALL reject the request indicating the phone number is required

#### Scenario: Phone validation error shown in form
- **WHEN** user enters an invalid phone number in the student or teacher form and submits
- **THEN** the form SHALL display a user-friendly Chinese error message next to the phone field

#### Scenario: Optional phone on update still validates format if provided
- **WHEN** user submits an update request with a phone number present but in invalid format
- **THEN** the system SHALL reject the request with a format validation error

#### Scenario: Update with no phone field is accepted
- **WHEN** user submits an update request without including the phone field
- **THEN** the system SHALL accept the request and leave the existing phone value unchanged
