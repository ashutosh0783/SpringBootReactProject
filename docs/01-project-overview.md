# 1. Project Overview

## What this project does

The **Incident Management System** records IT incidents and tracks them from the moment they are
raised until they are closed with a full analysis.

For every incident it stores:

| Field | Meaning |
|---|---|
| Incident number | Unique ID, for example `INC-1001` |
| Incident status | `OPEN`, `IN_PROGRESS`, `RESOLVED` or `CLOSED` |
| Incident description | Short summary of the problem (up to 500 characters) |
| Date of creation | When the incident was raised |
| Date of close | When it was closed (only for closed incidents) |
| Detailed analysis | Investigation notes: root cause, fix, preventive actions |

With it you can:

- see all incidents on a **summary screen**, search them and filter them by status
- open an incident to see its **full details** and analysis
- **create** new incidents
- **update** an incident: status, description, dates and analysis
- **close** an incident, which requires writing the final analysis
- **delete** incidents

## Architecture

```
 ┌───────────────────────┐   HTTP /api/...   ┌───────────────────────────┐    JDBC    ┌──────────────────────┐
 │  React UI (browser)   │ ────────────────▶ │  Spring Boot REST service │ ─────────▶ │  Database            │
 │  Vite dev server      │    JSON            │  incident-service         │            │  MySQL (Docker)  or  │
 │  http://localhost:5173│ ◀──────────────── │  http://localhost:8080    │ ◀───────── │  H2 (in-memory)      │
 └───────────────────────┘                   └───────────────────────────┘            └──────────────────────┘
```

- **Frontend:** a React single-page app. In development the Vite dev server forwards every `/api/...`
  call to the backend on port 8080 (see `frontend/vite.config.js`), so the browser only talks to port 5173.
- **Backend:** a Spring Boot REST microservice. It contains all business rules and talks to the database through JPA/Hibernate.
- **Database:** either **MySQL** (the default: persistent, runs in Docker) or **H2** (in memory, no installation needed).
  Only the backend configuration changes between them; the code is identical.
  See [03-mysql-setup.md](03-mysql-setup.md) and [04-h2-setup.md](04-h2-setup.md).

## Technology stack

| Layer | Technology | Version |
|---|---|---|
| Language (backend) | Java | 21 |
| Backend framework | Spring Boot (Web, Data JPA, Validation, Actuator) | 3.5.6 |
| API documentation | springdoc-openapi (Swagger UI) | 2.8.17 |
| Build (backend) | Maven | 3.9+ |
| Database | MySQL (Docker image `mysql:8.4`) / H2 in-memory | 8.4 / managed by Spring Boot |
| Frontend | React + React Router | 19 / 7 |
| Build (frontend) | Vite | 7 |
| Runtime (frontend tooling) | Node.js + npm | 22 LTS or newer |
| Backend tests | JUnit 5, Mockito, Spring MockMvc | managed by Spring Boot |
| Frontend tests | Vitest, React Testing Library, jsdom | 5 / 16 / 30 |

## Folder structure

```
SpringBootReactProject/
├── README.md                     Quick start
├── docs/                         This documentation
├── docker-compose.yml            MySQL container definition
├── database/
│   └── init/01-schema.sql        MySQL: creates the table and sample data (runs on first container start)
├── backend/                      Spring Boot service
│   ├── pom.xml                   Dependencies and build
│   └── src/
│       ├── main/java/com/incidentmanagement/
│       │   ├── IncidentManagementApplication.java   Entry point
│       │   ├── controller/       REST endpoints (IncidentController)
│       │   ├── service/          Business rules (IncidentService)
│       │   ├── repository/       Database access (IncidentRepository)
│       │   ├── model/            JPA entity (Incident) and IncidentStatus enum
│       │   ├── dto/              Request/response objects
│       │   ├── exception/        Custom errors and the global error handler
│       │   └── config/           CORS and Swagger/OpenAPI configuration
│       ├── main/resources/
│       │   ├── application.yml       Default settings (MySQL)
│       │   ├── application-h2.yml    H2 profile settings
│       │   └── data-h2.sql           H2 sample data
│       └── test/java/...         JUnit tests (service, controller, H2 integration)
└── frontend/                     React app
    ├── package.json              Dependencies and npm scripts
    ├── vite.config.js            Dev server, /api proxy, test settings
    └── src/
        ├── main.jsx, App.jsx     Entry point and routes
        ├── api/incidents.js      All calls to the backend
        ├── components/           IncidentForm, StatusBadge
        ├── pages/                Summary, Create, Detail, Delete screens
        ├── test/                 Shared test setup, sample data, helpers
        └── **/*.test.js(x)       Tests, next to the code they test
```

## Screens

| Screen | URL | What you can do |
|---|---|---|
| Incident Summary (home page) | `/` | See all incidents with number, description, status, Open/Closed badge and dates. Search, filter by status, see counts. Click a row to open it. |
| Incident Details | `/incidents/{number}` | See the full description and analysis. **Edit / Update Analysis**, **Close Incident**, **Delete**. |
| Create Incident | `/incidents/new` | Enter all fields and create the incident. |
| Delete Incident | `/delete` | Look up an incident by number, review it, confirm the deletion. |

## REST API

Base path: `/api/incidents`. You can try all endpoints in the browser at
**http://localhost:8080/swagger-ui.html**, or read the spec at `/v3/api-docs`.

| # | Method | Endpoint | Purpose | Responses |
|---|---|---|---|---|
| 1 | GET | `/api/incidents` | All incidents with full details | 200 |
| 2 | GET | `/api/incidents/summary?search=&status=` | Summary list. `search` matches number or description; `status` filters | 200 |
| 3 | GET | `/api/incidents/{incidentNumber}` | Details of one incident | 200, 404 |
| 4 | POST | `/api/incidents` | Create an incident | 201, 400, 409 |
| 5 | PUT | `/api/incidents/{incidentNumber}` | Update status, description, dates, analysis (also used to close) | 200, 400, 404 |
| 6 | DELETE | `/api/incidents/{incidentNumber}` | Delete an incident | 204, 404 |

Create example:

```json
POST /api/incidents
{
  "incidentNumber": "INC-2001",
  "status": "OPEN",
  "description": "Checkout page timing out for some users",
  "detailedAnalysis": null,
  "createdDate": "2026-09-29",
  "closedDate": null
}
```

Close example (the incident number is taken from the URL):

```json
PUT /api/incidents/INC-2001
{
  "status": "CLOSED",
  "description": "Checkout page timing out for some users",
  "detailedAnalysis": "Root cause: expired TLS certificate. Fix: renewed it. Prevention: expiry alerts.",
  "createdDate": "2026-09-29",
  "closedDate": null
}
```

Errors use the standard *problem details* JSON format. Validation errors also include `fieldErrors`,
which the UI shows next to the matching input:

```json
{
  "status": 400,
  "title": "Validation failed",
  "detail": "Detailed analysis is required to close an incident",
  "fieldErrors": { "detailedAnalysis": "Detailed analysis is required to close an incident" }
}
```

## Business rules

The backend enforces these rules in `IncidentService`. The UI checks the same rules before sending, for instant feedback.

1. **Incident numbers are unique.** They are stored upper-case (`inc-7` becomes `INC-7`) and may contain only letters, digits, `-` and `_`.
2. **Closing requires a detailed analysis.**
3. **The close date defaults to today** when an incident is closed without one.
4. **The close date cannot be before the creation date.**
5. **Only closed incidents have a close date.** Re-opening an incident clears it.
6. The incident number cannot be changed after creation.

## Database table

One table, `incident`, in the database `incident_management`:

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT, auto increment | Primary key |
| `incident_number` | VARCHAR(50) | Unique, not null |
| `status` | VARCHAR(20) | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `description` | VARCHAR(500) | Not null |
| `detailed_analysis` | TEXT | Optional; required when closed |
| `created_date` | DATE | Not null |
| `closed_date` | DATE | Only when closed |
| `created_at`, `updated_at` | DATETIME(6) | Set automatically |

Both databases start with three sample incidents: `INC-1001` (Open), `INC-1002` (In Progress) and `INC-1003` (Closed).

## Tests

| Part | Command | What is tested |
|---|---|---|
| Backend | `cd backend` then `mvn test` | Service rules (Mockito), REST layer (MockMvc), full stack on H2 |
| Frontend | `cd frontend` then `npm test` | API client, form validation, every screen, routing (the API is mocked) |

Neither needs MySQL or a running server.

## Related documents

- [02-setup-new-system.md](02-setup-new-system.md): install everything and run the project on a new computer
- [03-mysql-setup.md](03-mysql-setup.md): MySQL with Docker (or an existing MySQL server)
- [04-h2-setup.md](04-h2-setup.md): the H2 in-memory database
