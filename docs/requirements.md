# ACME Salary Management

## Current Issue

Currently, ACME's HR team manages salary data for approximately 10,000 employees across multiple countries using spreadsheets. This is tedious to maintain, makes historical changes difficult to track, and makes it harder to answer questions about how the organization pays its employees.

## Goal

Build a web-based salary management application that replaces spreadsheet-based salary administration for ACME's HR team. The system should enable an HR Manager to securely manage employee salary information and answer common questions about how the organization pays its employees across countries, departments, and job levels.

## Primary User - HR Manager

The primary user is responsible for maintaining employee salary information and analyzing salary distributions across the organization.

## In Scope

### 1. Employee Management

* View a paginated list of approximately 10,000 employees.
* Search employees by employee ID, name, or email.
* Filter by country, department, job level, and employment status.
* View employee details including current annual base salary information.
* Perform pagination and filtering on the server to avoid loading the entire employee dataset into the browser.
* Add appropriate database indexes for frequently searched and filtered fields.

### 2. Salary Management

* View an employee's current annual base salary and currency.
* Create a salary change with an effective date and reason.
* Maintain salary history rather than overwriting historical salary data.
* Record which HR user made each salary change.
* Treat the current salary as the most recent salary record effective on or before the current date.

### 3. Salary Analytics

The HR Manager should be able to answer questions such as:

* How many employees does ACME have?
* What is the total annual payroll?
* What are the average and median annual salaries?
* How is payroll distributed by country?
* How is payroll distributed by department and job level?
* What does the salary distribution look like?

Salary analytics will use a configured reporting currency. Salaries stored in other currencies will be converted using explicitly stored exchange rates rather than live market rates.

For organization-level payroll and salary statistics, calculations will use the current annual base salary of active employees unless otherwise specified.

### 4. Security and Auditability

* Require authentication for salary-management functionality.
* Restrict salary-management operations to authorized HR users.
* Enforce authorization in the backend API, not only in the user interface.
* Record salary changes in an auditable history.

### 5. Seed Data

* Provide a deterministic seed script capable of generating 10,000 employees with realistic countries, departments, job levels, currencies, and salary histories.
* Ensure repeated execution produces predictable data suitable for development and testing environments.

## Deliberately Out of Scope

* **Data migration and Full Excel/XLSX import support** - Deferred to a later iteration so the initial release can focus on the core salary-management and analytics workflow.
* **Payroll execution, tax calculation, benefits, deductions, and payslips** - These introduce substantially more payroll and country-specific regulatory complexity than required for salary management.
* **Employee self-service functionality** - The defined persona for this MVP is the HR Manager, so employee-facing workflows are not required.
* **SSO/SAML and enterprise identity-provider integration** - This adds significant authentication and infrastructure complexity without being necessary to demonstrate the core product.
* **Fine-grained multi-role authorization** - The MVP only requires an HR Manager persona, so a broader role hierarchy is unnecessary at this stage.
* **Real-time foreign-exchange rates** - Live external integrations add operational dependencies and are unnecessary when stored reporting rates are sufficient for the assessment.
* **Notifications and workflow approvals** - No notification or approval workflow is required to solve the stated salary-management problem.
* **Microservices or distributed infrastructure** - The domain and expected scale do not currently justify the operational complexity of a distributed architecture.

## Key Engineering Decisions

The backend will use Ruby on Rails with PostgreSQL and expose a JSON REST API. The frontend will use React and TypeScript.

The employee dataset is expected to grow beyond 10,000 records, so filtering, sorting, and pagination will be performed on the server. Appropriate database indexes will be used for frequently accessed fields and query patterns.

Salary history will be modeled as separate records so that changing a salary never destroys historical information.

The application will prioritize correctness, maintainability, security, and understandable architecture over unnecessary infrastructure complexity. The system will remain a modular monolith because the current domain and scale do not justify microservices.

## Success Criteria

An HR Manager can authenticate, search and filter the employee population, inspect an employee's salary history, modify salary information, and use the dashboard to understand salary distribution across the organization.

The application can be seeded with 10,000 employees, has meaningful automated tests, is deployable, and includes documentation explaining architectural and product trade-offs.
