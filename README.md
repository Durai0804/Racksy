# Racksy Smart Warehouse

React/TypeScript warehouse dashboard with a React Three Fiber scene and a Java 21 / Spring Boot inventory API. Product and stock data is loaded from the API; the browser does not own the persistent inventory state.

## Run the isolated demo

The default `demo` Spring profile uses a local H2 file at `backend/data/racksy-demo` and seeds 15 clearly illustrative warehouse records once. It does not connect to or write into the production PostgreSQL database.

1. Install Node.js 20.19+ or 22.12+ and Java 21. Maven 3.6.3+ is required.
2. From the repository root, run `npm install` and `npm run dev`.
3. In a second terminal, run `mvn -f backend/pom.xml spring-boot:run`.
4. Open the Vite URL printed by the frontend (normally `http://localhost:5173`). The Vite dev server proxies `/api` to Spring Boot on port 8080.

The demo database persists between app restarts. To reset it, stop the API and remove the `backend/data/racksy-demo.mv.db` file.

## Run the PostgreSQL demo

`docker compose up -d postgres` starts a local PostgreSQL instance with two databases: `racksy` for the PostgreSQL profile and `racksy_demo` for demo data. The demo seeder is only active for `demo` and `demo-postgres`; the production `postgres` profile never seeds sample records.

In PowerShell, start the API against the separate demo database:

```powershell
$env:SPRING_PROFILES_ACTIVE = 'demo-postgres'
$env:WAREHOUSE_DEMO_DB_PASSWORD = 'racksy-dev-only'
mvn -f backend/pom.xml spring-boot:run
```

For a production PostgreSQL database, set `SPRING_PROFILES_ACTIVE=postgres`, `WAREHOUSE_DB_URL`, `WAREHOUSE_DB_USER`, and `WAREHOUSE_DB_PASSWORD`. Flyway creates the schema; Hibernate validates it. No demo records are inserted in this profile.

## API

- `GET /api/warehouse/containers`
- `GET /api/warehouse/containers/{shelfId}`
- `GET /api/warehouse/containers/{shelfId}/movements`
- `POST /api/warehouse/containers/{shelfId}/stock/add` with `{ "quantity": 5, "note": "Receiving" }`
- `POST /api/warehouse/containers/{shelfId}/stock/remove` with `{ "quantity": 5, "note": "Picking" }`

Stock writes use a database transaction and a row lock. The API rejects non-positive quantities, removals beyond available stock, and additions beyond capacity, and records each accepted adjustment in movement history.

## Checks

- `npm run typecheck`
- `npm run build`
- `mvn -f backend/pom.xml test`

The workspace previously contained only a standalone dashboard, so there was no existing React or Spring application structure to preserve. The earlier warehouse visual direction is retained in the new React shell; no reference image file was present in the workspace for pixel matching.
