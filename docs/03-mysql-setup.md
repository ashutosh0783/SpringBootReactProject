# 3. MySQL Database Setup

MySQL is the **default** database. Data is **kept** between restarts.

There are two ways to provide it:

- **Option A, Docker (recommended):** nothing to install except Docker Desktop. The table and sample data are created automatically.
- **Option B, an existing MySQL server** installed on the machine: you create the database and user yourself.

## Connection details

| Setting | Value (Docker setup) |
|---|---|
| Host | `localhost` |
| Port | **`3307`** (not the usual 3306, so it does not clash with a local MySQL) |
| Database | `incident_management` |
| Application user / password | `incident_user` / `incident_pass` |
| Root password | `root` |
| Table | `incident` |

> These are **development** credentials. Change them before using this anywhere shared (see *Changing the credentials* below).

---

## Option A: MySQL in Docker

### A1. Install Docker Desktop

**Windows**

1. Docker Desktop needs **WSL 2**. In an **Administrator** PowerShell, run:
   ```powershell
   wsl --install
   ```
   Restart the computer if asked.
2. Install Docker Desktop, either with `winget install Docker.DockerDesktop` or from https://www.docker.com/products/docker-desktop/
3. Start **Docker Desktop** and accept the terms. Wait until the bottom-left corner says **Engine running**.
4. If Docker says virtualization is disabled, enable **Intel VT-x / AMD-V (SVM)** in the BIOS/UEFI settings.

**macOS:** `brew install --cask docker`, or download Docker Desktop, then start it.

**Linux:** install Docker Engine and the Compose plugin: https://docs.docker.com/engine/install/

Check it works:

```powershell
docker --version
docker compose version
docker info          # must not show "failed to connect to the docker API"
```

> Docker Desktop must be **running** every time you use MySQL. It can be set to start with Windows in its settings.

### A2. What Docker will run

Everything is defined in [`docker-compose.yml`](../docker-compose.yml):

| Setting | Value |
|---|---|
| Image | `mysql:8.4` (downloaded automatically the first time, about 1.1 GB on disk) |
| Container name | `incident-mysql` |
| Port mapping | computer `3307` → container `3306` |
| Data storage | Docker volume `springbootreactproject_mysql-data` (survives restarts) |
| Init script | `database/init/01-schema.sql` creates the `incident` table and 3 sample incidents |
| Health check | `mysqladmin ping` every 10 seconds |

> **The init script runs only once**, when the data volume is empty (the very first start, or after `docker compose down -v`).
> Changes to `01-schema.sql` are not applied to an existing database.

### A3. Start MySQL

From the project root folder:

```powershell
docker compose up -d
```

Wait until it is healthy (about 10–30 seconds the first time):

```powershell
docker ps       # STATUS must show "(healthy)"
```

Check the table and sample data:

```powershell
docker exec incident-mysql mysql -uincident_user -pincident_pass incident_management -e "SELECT incident_number, status FROM incident;"
```

### A4. Start the application with MySQL

```powershell
cd backend
mvn spring-boot:run          # no profile means MySQL
```

In a second terminal:

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173.

### A5. Everyday Docker commands

| Task | Command |
|---|---|
| Start MySQL | `docker compose up -d` |
| Stop MySQL (**keep data**) | `docker compose stop` |
| Stop and remove the container (**keep data**) | `docker compose down` |
| **Delete all data** and start fresh (re-runs the init script) | `docker compose down -v` then `docker compose up -d` |
| Status | `docker ps -a` |
| Logs | `docker logs incident-mysql` |
| Open a MySQL prompt | `docker exec -it incident-mysql mysql -uincident_user -pincident_pass incident_management` |

---

## Option B: an existing MySQL server (no Docker)

Use this if MySQL 8.x is already installed on the machine (usually on port **3306**).

### B1. Create the database, table and user

Run the project's script as the MySQL **root** user from the project root folder. It creates the database,
the `incident` table and the sample data.

```powershell
mysql -u root -p -e "source database/init/01-schema.sql"
```

If `mysql` is not recognized, add MySQL's `bin` folder (for example `C:\Program Files\MySQL\MySQL Server 8.4\bin`) to the Path,
or open the file in MySQL Workbench and run it there.

Then create the application user. Open a prompt with `mysql -u root -p` and run:

```sql
CREATE USER 'incident_user'@'localhost' IDENTIFIED BY 'incident_pass';
GRANT ALL PRIVILEGES ON incident_management.* TO 'incident_user'@'localhost';
FLUSH PRIVILEGES;
```

### B2. Point the backend to your server

The backend reads its connection details from environment variables, with the Docker values as defaults:

| Variable | Default | Set to |
|---|---|---|
| `DB_HOST` | `localhost` | your MySQL host |
| `DB_PORT` | `3307` | usually **`3306`** for a local install |
| `DB_NAME` | `incident_management` | |
| `DB_USER` | `incident_user` | |
| `DB_PASSWORD` | `incident_pass` | |

PowerShell (applies to this terminal only):

```powershell
$env:DB_PORT = "3306"
cd backend
mvn spring-boot:run
```

macOS/Linux: `DB_PORT=3306 mvn spring-boot:run`

---

## Connecting with a GUI tool (optional)

Use MySQL Workbench, DBeaver or IntelliJ's Database tool with:
host `localhost`, port `3307` (Docker) or `3306` (local), user `incident_user`, password `incident_pass`, database `incident_management`.

If the tool reports *"Public Key Retrieval is not allowed"*, set the driver property `allowPublicKeyRetrieval=true`.

## Back up and restore (moving data to another system)

The commands run inside the container, which avoids PowerShell's file-encoding problems with `>` redirection.

**Back up** on the old computer, from the project root:

```powershell
docker exec incident-mysql sh -c "mysqldump -uroot -proot --no-tablespaces incident_management > /tmp/backup.sql"
docker cp incident-mysql:/tmp/backup.sql .\incident-backup.sql
```

Copy `incident-backup.sql` to the new computer.

**Restore** on the new computer, after `docker compose up -d` shows the container as healthy:

```powershell
docker cp .\incident-backup.sql incident-mysql:/tmp/backup.sql
docker exec incident-mysql sh -c "mysql -uroot -proot incident_management < /tmp/backup.sql"
```

The restore replaces the `incident` table (including the sample data) with the backed-up one.

## How the backend is configured for MySQL

File: `backend/src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3307}/${DB_NAME:incident_management}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: ${DB_USER:incident_user}
    password: ${DB_PASSWORD:incident_pass}
  jpa:
    hibernate:
      ddl-auto: update
```

- `${DB_PORT:3307}` means "use the environment variable `DB_PORT`, or 3307 if it is not set".
- `ddl-auto: update` lets Hibernate add missing columns, but it never deletes data.
  The table itself comes from `database/init/01-schema.sql`.
- The MySQL driver (`mysql-connector-j`) is a dependency in `backend/pom.xml`.

## Changing the credentials

1. Change `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` in `docker-compose.yml`.
2. Recreate the database. New passwords only apply to a fresh volume, so this **deletes the data**:
   `docker compose down -v` then `docker compose up -d`.
3. Start the backend with the matching `DB_USER` and `DB_PASSWORD` environment variables.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `failed to connect to the docker API` | Docker Desktop is not running. Start it and wait for "Engine running". |
| `Bind for 0.0.0.0:3307 failed: port is already allocated` | Something else uses 3307. Change `"3307:3306"` in `docker-compose.yml` and set `DB_PORT` to match. |
| Backend: `Communications link failure` | MySQL is not running or not healthy yet. Check `docker ps` and wait for `(healthy)`. |
| Backend: `Access denied for user 'incident_user'` | Credentials changed after the volume was created, or the user was not created (Option B). See *Changing the credentials* / B1. |
| Backend: `Public Key Retrieval is not allowed` | The JDBC URL must keep `allowPublicKeyRetrieval=true` (it does by default). |
| Table missing or no sample data | The init script only runs on an empty volume: `docker compose down -v` then `docker compose up -d` (**deletes data**). |
| Container keeps restarting | Check `docker logs incident-mysql`. Usually a corrupted or incompatible volume; reset with `docker compose down -v`. |
