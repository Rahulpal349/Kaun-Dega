# Kaun Dega - Deployment Guide

This document outlines the deployment strategy, checklist, and cloud options for deploying the Kaun Dega Spring Boot Backend and PostgreSQL database.

## Quick Start (Local Development)

You can spin up the entire backend stack locally using Docker Compose:

```bash
cd backend
docker-compose up --build -d
```

- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/actuator/health
- **Database**: `localhost:5432` (Credentials: postgres/postgres)

To shut it down:
```bash
docker-compose down
```

---

## Production Configuration

When running the container in production, pass these Environment Variables:

| Variable | Description | Default |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Must be set to `prod` | `dev` |
| `DB_URL` | JDBC URL for PostgreSQL | `jdbc:postgresql://postgres:5432/kaundega` |
| `DB_USER` | Database User | `postgres` |
| `DB_PASSWORD` | Database Password | `postgres` |
| `JWT_SECRET` | Secret for signing tokens (Must be secure/long) | `local-development...` |
| `JWT_EXPIRATION_MS` | Expiration time for JWTs | `86400000` (24h) |

### Performance Tuning
The `prod` profile leverages **HikariCP** for connection pooling, explicitly disabling Hibernate's `ddl-auto=update` in favor of `validate` to prevent accidental production schema alterations.

---

## Deployment Checklist

Before rolling out a production update, ensure the following checklist is met:

1. **Build & Test**
   - Ensure `mvn clean test` runs with 100% success.
   - Verify the Docker image builds successfully without caching issues (`docker build --no-cache -t kaundega-api .`).
2. **Database Backup Strategy**
   - Take a snapshot of the PostgreSQL RDS/Managed DB instance.
   - Run `pg_dump` before making schema changes.
3. **Database Migration**
   - If introducing new tables/columns, run `scripts/init-schema.sql` (or your preferred migration tool) against the production database *before* deploying the new backend version.
4. **Monitoring Setup**
   - Verify `GET /actuator/health` returns `UP`.
   - Ensure Metrics (`/actuator/metrics`) are being scraped by Prometheus/Datadog.
5. **Rollback Plan**
   - Keep the previous Docker image tag available in the container registry (e.g., ECR/GCR) to allow instant reversion of the deployment.

---

## Cloud Deployment Options

### Option 1: Simple EC2 + Docker (Easiest)
Best for MVP or low-traffic deployments.
1. Provision a Linux EC2 instance.
2. Install Docker and Docker Compose.
3. Copy `docker-compose.yml` and `scripts/init-schema.sql` to the server.
4. Set up an `.env` file containing the production secrets.
5. Run `docker-compose up -d`.
*(Note: A reverse proxy like Nginx should be placed in front of port 8080 to handle SSL/HTTPS).*

### Option 2: AWS ECS / Fargate (Recommended for Scale)
Serverless container execution with automated scaling.
1. Push your built Docker image to **Amazon ECR**.
2. Provision an **Amazon RDS** PostgreSQL instance.
3. Create an **ECS Task Definition**:
   - Set the image URI to your ECR image.
   - Map port `8080`.
   - Inject Secrets (DB credentials, JWT Secret) from **AWS Secrets Manager** as environment variables.
4. Deploy an **ECS Service** using Fargate and attach it to an Application Load Balancer (ALB).

### Option 3: Google Cloud Run (Easiest Serverless)
Scale-to-zero serverless environment.
1. Build and push the image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/your-project/kaundega-api
   ```
2. Provision a **Cloud SQL for PostgreSQL** instance.
3. Deploy the container:
   ```bash
   gcloud run deploy kaundega-api \
     --image gcr.io/your-project/kaundega-api \
     --add-cloudsql-instances <INSTANCE_CONNECTION_NAME> \
     --set-env-vars DB_URL=jdbc:postgresql://<DB_IP>/kaundega,SPRING_PROFILES_ACTIVE=prod
   ```

## Troubleshooting Guide

- **Container exits immediately:** The database might be unreachable. Check the Docker logs (`docker logs kaundega-api`). Ensure `depends_on` or network rules are allowing access to PostgreSQL.
- **HikariPool-1 - Connection is not available:** The max connection pool size (default: 20) has been reached. Either scale the database or increase `spring.datasource.hikari.maximum-pool-size`.
- **JWT Signature Exception:** The `JWT_SECRET` differs between multiple deployed containers. Ensure a unified secret is injected via environment variables.
