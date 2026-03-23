## ADDED Requirements

### Requirement: Admin can manage campuses
The system SHALL provide a campus management interface where admins can create, view, edit, and archive campuses (学院/校区).

#### Scenario: Create a new campus
- **WHEN** admin submits a valid campus name
- **THEN** the system SHALL create the campus and display it in the campus list

#### Scenario: Campus name is required
- **WHEN** admin submits a campus with an empty name
- **THEN** the system SHALL reject the request with a validation error

#### Scenario: Archive a campus
- **WHEN** admin archives a campus that has no active classes
- **THEN** the system SHALL mark the campus as archived and hide it from active lists

#### Scenario: Campus list shows all active campuses
- **WHEN** admin visits the campus management page
- **THEN** the system SHALL display all non-archived campuses with their grade counts

#### Scenario: Edit campus name
- **WHEN** admin updates an existing campus name with a valid value
- **THEN** the system SHALL save the new name and reflect it immediately
