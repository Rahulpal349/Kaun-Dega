# Kaun Dega Backend - Security Best Practices & Checklist

Before deploying the Spring Boot application to production, ensure this checklist is completed to maintain a hardened environment.

## 1. Environment & Secrets Management
- [ ] **No Hardcoded Secrets**: Ensure `application-prod.properties` relies solely on environment variables (`${DB_PASSWORD}`, etc.).
- [ ] **Secret Rotation**:
  - **JWT Secret**: Rotate the JWT secret every 90 days. Generate a new secure 256-bit base64 string and update the environment variable. Existing sessions will be invalidated.
  - **Database Credentials**: Rotate database passwords every 180 days. Update the `DB_PASSWORD` environment variable and restart the Spring Boot service.
- [ ] **.env Safety**: Verify that `.env` is explicitly added to `.gitignore` and is NEVER committed to version control.

## 2. Spring Security & Network
- [ ] **TLS/HTTPS**: Never serve traffic over plain HTTP. Either configure `server.ssl.*` in `application-prod.properties` (with a valid PKCS12 keystore) OR deploy behind a reverse proxy (Nginx, AWS ALB) that terminates SSL.
- [ ] **CORS Configuration**: Restrict `CORS_ALLOWED_ORIGINS` to ONLY the exact domains of your frontend (e.g., `https://kaundega.com`). Do not use wildcards (`*`) in production.
- [ ] **CSRF Protection**: CSRF is intentionally disabled because the frontend stores JWTs in `localStorage` and uses Bearer headers. **Warning**: If you ever switch to storing JWTs in `HttpOnly` cookies, you MUST re-enable CSRF in `SecurityConfig.java`.

## 3. Database Security
- [ ] **Principle of Least Privilege**: Ensure the database user provided in `DB_USERNAME` only has `SELECT`, `INSERT`, `UPDATE`, `DELETE` permissions on the `kaundega` database schema. Do not run the application as the postgres superuser.
- [ ] **Hibernate Validation**: Ensure `spring.jpa.hibernate.ddl-auto=validate` in production. Never use `update` or `create-drop` in production to prevent accidental schema destruction.

## 4. Logging & Monitoring
- [ ] **Sensitive Data Scrubbing**: Ensure `application-prod.properties` sets `logging.level.org.springframework.web=WARN` or higher. Never log raw HTTP requests in production, as this leaks `Authorization` headers and passwords in plain text.
- [ ] **Rate Limiting**: Monitor logs for HTTP 429 (Too Many Requests) on the `/auth/login` endpoint, which indicates a brute-force attack in progress. The current `RateLimitingFilter` allows 5 attempts per minute per IP.

## 5. Dependency Management
- [ ] **Vulnerability Scanning**: The `pom.xml` includes the OWASP `dependency-check-maven` plugin. Run `mvn dependency-check:check` as part of your CI/CD pipeline and block deployments if high-severity CVEs are found in dependencies.
