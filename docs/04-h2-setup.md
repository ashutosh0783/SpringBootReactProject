# 4. H2 In-Memory Database Setup

H2 is a small database written in Java that runs **inside the backend process**, in memory.
With it, the whole application runs on any computer that has Java, Maven and Node.
You need **no MySQL and no Docker**.

| | |
|---|---|
| Install needed | **Nothing.** H2 is a Maven dependency and downloads automatically |
| Data | Starts with the 3 sample incidents; **everything is lost when the backend stops** |
| Use it for | Demos, trying the app, development, automated tests |
| Do not use it for | Data you want to keep; use [MySQL](03-mysql-setup.md) instead |

## How to run the application with H2

### 1. Start the backend with the `h2` profile

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```

In the log you should see:

```
The following 1 profile is active: "h2"
H2 console available at '/h2-console'. Database available at 'jdbc:h2:mem:incident_management'
Started IncidentManagementApplication
```

Other ways to switch on the profile:

| Way | Command |
|---|---|
| Environment variable (PowerShell) | `$env:SPRING_PROFILES_ACTIVE = "h2"; mvn spring-boot:run` |
| Environment variable (macOS/Linux) | `SPRING_PROFILES_ACTIVE=h2 mvn spring-boot:run` |
| Packaged JAR | `java -jar target/incident-service-1.0.0.jar --spring.profiles.active=h2` |
| IntelliJ IDEA | Run → Edit Configurations → **Active profiles**: `h2` |

### 2. Start the frontend (unchanged)

```powershell
cd frontend
npm install     # first time only
npm run dev
```

### 3. Use it

- Application: http://localhost:5173
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 console: http://localhost:8080/h2-console

All operations work exactly as with MySQL: list, search, view, create, update, close, delete.

## The H2 console (view the data in the browser)

1. Open http://localhost:8080/h2-console
2. Enter:

   | Field | Value |
   |---|---|
   | Driver Class | `org.h2.Driver` |
   | JDBC URL | **`jdbc:h2:mem:incident_management`** |
   | User Name | `sa` |
   | Password | *(leave empty)* |

3. Click **Connect**, then run for example:

   ```sql
   SELECT * FROM incident;
   ```

> If the console shows *"Database ... not found"*, check the JDBC URL. It must match exactly, and the backend must be running with the `h2` profile.

## How it works

Spring Boot **profiles** let one application have several configurations.
`application.yml` holds the default (MySQL) settings. When the `h2` profile is active, Spring Boot
also loads `application-h2.yml`, and its values **override** the defaults. The MySQL configuration itself is never changed.

File: `backend/src/main/resources/application-h2.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:incident_management;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE
    username: sa
    password:
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop              # create the table on start, drop it on stop
    defer-datasource-initialization: true  # load data-h2.sql AFTER the table exists
  sql:
    init:
      mode: always
      platform: h2                       # picks data-h2.sql
  h2:
    console:
      enabled: true
      path: /h2-console
```

What each part of the URL means:

| Part | Meaning |
|---|---|
| `jdbc:h2:mem:incident_management` | An in-memory database named `incident_management` |
| `MODE=MySQL` | Behave like MySQL, so the same queries work on both databases |
| `DB_CLOSE_DELAY=-1` | Keep the database while the application runs, not only while a connection is open |
| `DATABASE_TO_LOWER=TRUE` | Lower-case table/column names, like MySQL |

On every start:

1. H2 starts empty in memory.
2. Hibernate creates the `incident` table from the `Incident` entity (`ddl-auto: create-drop`).
3. Spring Boot runs **`backend/src/main/resources/data-h2.sql`**, which inserts the 3 sample incidents.

The H2 driver is a dependency in `backend/pom.xml`:

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
```

## Changing the sample data

Edit `backend/src/main/resources/data-h2.sql` and restart the backend.
Every row must include `created_at` and `updated_at` (use `CURRENT_TIMESTAMP`).

## Keeping H2 data between restarts (optional)

For a file-based H2 database instead of an in-memory one, change the URL and `ddl-auto` in `application-h2.yml`:

```yaml
spring:
  datasource:
    url: jdbc:h2:file:./data/incident_management;MODE=MySQL;DATABASE_TO_LOWER=TRUE
  jpa:
    hibernate:
      ddl-auto: update
  sql:
    init:
      mode: never      # otherwise the sample rows are inserted again on every start
```

Data is then stored in `backend/data/`. Add that folder to `.gitignore`.

## H2 in the automated tests

The backend test `IncidentH2IntegrationTest` uses `@ActiveProfiles("h2")`. It starts the whole application
on H2 and tests the real database queries and business rules. This is why `mvn test` needs no MySQL.

## H2 vs MySQL

| | H2 profile | MySQL (default) |
|---|---|---|
| Start command | `mvn spring-boot:run "-Dspring-boot.run.profiles=h2"` | `docker compose up -d` then `mvn spring-boot:run` |
| Needs Docker/MySQL | No | Yes |
| Data survives restart | No | Yes |
| Table created by | Hibernate (`create-drop`) | `database/init/01-schema.sql` |
| Sample data from | `backend/.../data-h2.sql` | `database/init/01-schema.sql` |
| Browse data | H2 console `/h2-console` | MySQL client / Workbench on port 3307 |
| API, UI, business rules | Identical | Identical |

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| Backend tries to connect to MySQL (`Communications link failure`) | The profile is not active. Check the log for `profile is active: "h2"`. In PowerShell, keep the quotes: `"-Dspring-boot.run.profiles=h2"`. |
| My data disappeared | Expected. In-memory data is lost when the backend stops. Use MySQL or the file-based option above. |
| `/h2-console` shows 404 | The backend is not running with the `h2` profile (the console is only enabled there). |
| H2 console: "Database not found" | Wrong JDBC URL. Use exactly `jdbc:h2:mem:incident_management`. |
| `Port 8080 was already in use` | Another backend (for example the MySQL one) is still running. Stop it first. |
