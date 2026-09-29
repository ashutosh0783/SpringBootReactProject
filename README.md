# Incident Management System

Spring Boot REST microservice + React UI + MySQL (Docker).

```
SpringBootReactProject/
├── docker-compose.yml        MySQL 8.4 container (database: incident_management)
├── database/init/            Table creation + sample data (runs on first container start)
├── backend/                  Spring Boot 3.5 / Java 21 REST service  → http://localhost:8080
└── frontend/                 React 19 + Vite + React Router          → http://localhost:5173
```

## Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 21 |
| Maven | 3.9+ |
| Node.js (includes npm) | 22 LTS or newer |
| Docker Desktop | running (only for MySQL; not needed with the H2 profile) |

## Run it

MySQL is the default database. To run without it, see [Run without MySQL](#run-without-mysql-in-memory-h2).

```powershell
# 1. Start MySQL (first start creates the incident table + 3 sample incidents)
docker compose up -d

# 2. Start the backend
cd backend
mvn spring-boot:run

# 3. Start the frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

### Run without MySQL (in-memory H2)

The `h2` profile uses an in-memory H2 database, so no Docker or MySQL is needed.
Everything works the same, with the same 3 sample incidents, but data is reset on every restart.

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```

H2 console: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:incident_management`, user `sa`, empty password).
Profile settings: `backend/src/main/resources/application-h2.yml`; sample data: `data-h2.sql`.

### MySQL details

MySQL is exposed on host port **3307**, so it does not clash with a local MySQL on 3306.
Credentials: `incident_user` / `incident_pass` (root: `root`). Override the backend's connection with
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` environment variables.

## REST API — base path `/api/incidents`

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/incidents` | All incidents with full details | 200 |
| GET | `/api/incidents/summary?search=&status=` | Summary list (number, description, status, open/closed, dates). `search` matches number or description; `status` = `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | 200 |
| GET | `/api/incidents/{incidentNumber}` | Details of one incident | 200 / 404 |
| POST | `/api/incidents` | Create an incident | 201 / 400 / 409 |
| PUT | `/api/incidents/{incidentNumber}` | Update status, description, dates, detailed analysis | 200 / 400 / 404 |
| DELETE | `/api/incidents/{incidentNumber}` | Delete an incident | 204 / 404 |

Example create:

```json
POST /api/incidents
{
  "incidentNumber": "INC-1004",
  "status": "OPEN",
  "description": "Checkout page timing out",
  "detailedAnalysis": null,
  "createdDate": "2026-09-29",
  "closedDate": null
}
```

The PUT body is the same without `incidentNumber` (it comes from the URL and cannot change).

### Business rules
- Incident numbers are unique, stored upper-case, and may contain letters, digits, `-` and `_`.
- A `CLOSED` incident **must** have a detailed analysis. If no close date is given, it defaults to today.
- The close date cannot be before the creation date.
- A non-closed incident has no close date (re-opening clears it).

Errors are returned as RFC 7807 problem JSON, with a `fieldErrors` map for validation errors.

## Screens
1. **Summary** (`/`): every incident with search, status filter and open/closed counts. Click a row to open it.
2. **Details** (`/incidents/{number}`): full description and analysis, with **Edit / Update Analysis**, **Close Incident** and **Delete** actions.
3. **Create Incident** (`/incidents/new`)
4. **Delete Incident** (`/delete`): look up an incident by number, review it, confirm the delete.

## Tests
```powershell
cd backend
mvn test
```
Tests need no MySQL: controller tests use mocks, and `IncidentH2IntegrationTest` runs the full stack on H2.
