# 2. Setting Up the Project on a New System

Follow this guide to move the project to another computer and run it there.
Commands are for **Windows PowerShell**. macOS/Linux notes are included where they differ.

## Step 0: Choose a database

You need to choose this first, because it decides whether you need Docker.

| | **H2 (in-memory)** | **MySQL (Docker)** |
|---|---|---|
| Install needed | Nothing extra | Docker Desktop (or an existing MySQL server) |
| Data after restart | **Lost.** Resets to the 3 sample incidents | **Kept** |
| Best for | Demos, quick testing, new laptops, running tests | Real use, keeping data |
| Guide | [04-h2-setup.md](04-h2-setup.md) | [03-mysql-setup.md](03-mysql-setup.md) |

## Step 1: Install the required software

| Software | Version | Needed for | Required? |
|---|---|---|---|
| **Git** | any recent | Getting the code | Yes (or copy the folder) |
| **Java JDK** | **21** | Backend | Yes |
| **Maven** | **3.9+** | Building/running the backend | Yes |
| **Node.js** (includes npm) | **22 LTS or newer** | Frontend | Yes |
| **Docker Desktop** | any recent | MySQL container | Only for MySQL |
| IDE (IntelliJ IDEA, VS Code) | any | Editing code | Optional |

### Windows (using winget)

Open **PowerShell** and run:

```powershell
winget install Git.Git
winget install EclipseAdoptium.Temurin.21.JDK
winget install OpenJS.NodeJS.LTS
winget install Docker.DockerDesktop      # only if you will use MySQL
```

**Maven** has no official winget package. Install it by hand:

1. Download the *Binary zip archive* from https://maven.apache.org/download.cgi
2. Unzip it, for example to `C:\tools\apache-maven-3.9.9`
3. Add `C:\tools\apache-maven-3.9.9\bin` to your **Path**: Start menu, then *Edit the system environment variables*,
   then *Environment Variables*, then *Path*, then *Edit*, then *New*
4. Make sure **JAVA_HOME** points to the JDK folder, for example `C:\Program Files\Eclipse Adoptium\jdk-21...`
   (the Temurin installer can set this for you)

> After installing, **close and reopen PowerShell** (and your IDE) so it picks up the new Path.

### macOS (Homebrew)

```bash
brew install git openjdk@21 maven node
brew install --cask docker              # only if you will use MySQL
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install git openjdk-21-jdk maven
# Node.js 22+: see https://nodejs.org (the default apt version may be too old)
# Docker: see https://docs.docker.com/engine/install/  (only if you will use MySQL)
```

### Check the installation

```powershell
git --version
java -version        # must say 21
mvn -version         # must say 3.9.x and use Java 21
node -v              # must be v22 or newer
npm -v
docker --version     # only for MySQL
```

If `mvn -version` shows a different Java than 21, fix `JAVA_HOME`.

## Step 2: Get the code

**Option A: clone from GitHub (recommended)**

```powershell
cd C:\Users\<you>\workspaces
git clone https://github.com/ashutosh0783/SpringBootReactProject.git
cd SpringBootReactProject
```

**Option B: copy the folder.** Do **not** copy these folders; they are regenerated and are very large:

- `frontend/node_modules/`
- `frontend/dist/`
- `backend/target/`

> **Data does not move with the code.** H2 data is never saved. MySQL data lives inside a Docker volume on the old computer.
> To move it, see *Back up and restore* in [03-mysql-setup.md](03-mysql-setup.md).

## Step 3: Install frontend dependencies (once)

```powershell
cd frontend
npm install
cd ..
```

The backend downloads its dependencies automatically on the first Maven run. This needs internet and takes a few minutes the first time.

## Step 4: Start the backend

Pick **one**:

**H2, no database needed:**

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```

**MySQL:** first start the database (see [03-mysql-setup.md](03-mysql-setup.md)), then:

```powershell
docker compose up -d
cd backend
mvn spring-boot:run
```

Wait for `Started IncidentManagementApplication`. Check it with http://localhost:8080/actuator/health, which should show `{"status":"UP"}`.

> In PowerShell, keep the quotes around `"-Dspring-boot.run.profiles=h2"`. Without them PowerShell splits the argument.

## Step 5: Start the frontend

In a **second** terminal:

```powershell
cd frontend
npm run dev
```

## Step 6: Open the application

| What | URL |
|---|---|
| **Application (UI)** | http://localhost:5173 |
| Swagger UI (try the APIs) | http://localhost:8080/swagger-ui.html |
| Health check | http://localhost:8080/actuator/health |
| H2 console (H2 only) | http://localhost:8080/h2-console |

## Step 7: Run the tests (optional)

```powershell
cd backend;  mvn test      # backend: no database needed
cd frontend; npm test      # frontend: no backend needed
```

## Stopping everything

- **Backend / frontend:** press `Ctrl + C` in their terminals.
- **MySQL:** `docker compose stop` keeps the data; `docker compose down -v` deletes it.

## Ports used

| Port | Used by | Change it with |
|---|---|---|
| 5173 | React dev server | `server.port` in `frontend/vite.config.js` |
| 8080 | Spring Boot backend | `--server.port=XXXX`, or `server.port` in `application.yml` (then also update the proxy in `vite.config.js`) |
| 3307 | MySQL in Docker | `ports` in `docker-compose.yml` and `DB_PORT` |

## Building a runnable JAR (optional)

To run the backend without Maven (Java 21 is still needed):

```powershell
cd backend
mvn package                          # runs the tests and creates target/incident-service-1.0.0.jar
java -jar target/incident-service-1.0.0.jar                               # MySQL
java -jar target/incident-service-1.0.0.jar --spring.profiles.active=h2   # H2
```

## Running from IntelliJ IDEA

1. **File → Open**, then select the project folder.
2. Right-click `backend/pom.xml` and choose **Add as Maven Project** (if it was not detected).
3. **File → Project Structure → SDK**: choose Java 21.
4. Open `IncidentManagementApplication.java` and click the green ▶ Run icon.
5. For H2: **Run → Edit Configurations → Active profiles**: `h2`.
6. Start the frontend from the IntelliJ terminal with `cd frontend; npm run dev`.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| `mvn`, `node` or `npm` "is not recognized" | Not on the Path, or the terminal was opened before installing. Reopen the terminal and check Step 1. |
| `mvn -version` shows the wrong Java | Set `JAVA_HOME` to the JDK 21 folder and reopen the terminal. |
| `Port 8080 was already in use` | Another backend is still running. Find it with `Get-NetTCPConnection -LocalPort 8080` and stop that process (`Stop-Process -Id <OwningProcess>`), or run on another port. |
| UI shows "Cannot reach the server" | The backend is not running, or not on 8080. Start it (Step 4). |
| UI loads but the list is empty and there is no error | The database is empty. With H2, restart the backend to reload the sample data. |
| `npm install` warns `install-scripts ... esbuild` | Harmless. Optionally run `npm install-scripts approve esbuild`. |
| Backend fails with `Communications link failure` | MySQL is not running or not reachable. See [03-mysql-setup.md](03-mysql-setup.md). |
| `failed to connect to the docker API ... dockerDesktopLinuxEngine` | Docker Desktop is not started. Open it and wait for "Engine running". |

## Checklist for a new system

- [ ] Git, JDK 21, Maven 3.9+, Node 22+ installed and verified (Step 1)
- [ ] Docker Desktop installed and running (**MySQL only**)
- [ ] Code cloned (Step 2)
- [ ] `npm install` done in `frontend` (Step 3)
- [ ] Backend started with H2 **or** MySQL (Step 4)
- [ ] Frontend started (Step 5)
- [ ] http://localhost:5173 shows the incident list (Step 6)
