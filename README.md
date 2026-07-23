# Sentinel

Fraud prediction API with model monitoring, drift detection, and a live operations dashboard.

## Getting Started

1. Copy the environment file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack:

   ```bash
   make up
   ```

3. Run database migrations:

   ```bash
   make migrate
   ```

4. Services:
   - API: http://localhost:8000 (health check at `/health`)
   - Frontend: http://localhost:3000
   - Postgres: localhost:5433

5. Stop the stack:

   ```bash
   make down
   ```
# sentinel
