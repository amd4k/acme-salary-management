# ACME Salary Management

A web-based salary management application for ACME's HR team.

## Problem

ACME currently manages salary information for approximately 10,000 employees across multiple countries using spreadsheets. This makes salary administration tedious, makes historical changes difficult to track, and makes it harder for HR to answer questions about how the organization pays its employees.

## Goal

Build a web-based application that enables an HR Manager to:

* Manage employee salary information.
* Maintain salary history.
* Search and filter employees.
* Analyze salary and payroll distributions across countries, departments, and job levels.
* Understand how the organization pays its employees.

## Planned Technology

### Backend

* Ruby
* Ruby on Rails
* PostgreSQL
* REST/JSON API

### Frontend

* React
* TypeScript
* Vite

### Testing

* RSpec
* Frontend tests for important UI behavior

## Architecture

The application will initially be implemented as a modular monolith with a separate React frontend and Rails JSON API backend.

```text
┌─────────────────────┐
│      React UI       │
│   TypeScript/Vite   │
└──────────┬──────────┘
           │
           │ JSON/REST
           ▼
┌─────────────────────┐
│       Rails API     │
│         Ruby        │
└──────────┬──────────┘
           │
           │ SQL
           ▼
┌─────────────────────┐
│     PostgreSQL      │
└─────────────────────┘
```

The application is designed to support approximately 10,000 employees initially while keeping the architecture suitable for future growth.

## Documentation

* [Requirements](docs/requirements.md)
* Architecture documentation - to be added
* Trade-offs - to be added
* Performance considerations - to be added
* AI usage - to be added

## Development Status

The project is currently under development as part of a software engineering assessment.

The implementation will be developed incrementally with small commits so that the evolution of the solution and engineering decisions can be reviewed.

## Development Environment

The application is being developed using:

* WSL2 / Ubuntu
* Ruby 3.4.8
* Rails 8.1.4
* Node.js 24.21.0
* npm 11.19.0
* PostgreSQL 14
