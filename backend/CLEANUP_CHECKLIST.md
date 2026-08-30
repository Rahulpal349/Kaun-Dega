# Production Code Cleanup Checklist

This checklist ensures your Spring Boot application is free of development artifacts before deploying to production.

## 1. Remove Debugging Code
- [x] Scan and remove all `System.out.println()` calls. *(Currently: 0 found)*
- [x] Ensure `printStackTrace()` is never called. *(Currently: 0 found)*
- [x] Use SLF4J `@Slf4j` for all logging instead of standard out.

## 2. Resolve Placeholders
- [x] Scan for `@TODO` or `TODO:` tags. *(Currently: 0 found)*
- [x] Scan for `@FIXME` or `FIXME:` tags. *(Currently: 0 found)*

## 3. Exception Handling
- [x] Do not leak stack traces to the API client.
- [x] Implemented `GlobalExceptionHandler` to catch all unhandled exceptions and return a sanitized JSON response, while logging the full stack trace internally via SLF4J.

## 4. Unused Code
- [ ] Run your IDE's "Optimize Imports" on the whole project.
- [ ] Run your IDE's Code Inspection to find unused private methods and variables.

## 5. Configuration Profiles
- [x] `application-dev.properties`: Used for local development (enables `show-sql`, uses local Postgres/H2).
- [x] `application-test.properties`: Used explicitly for `@SpringBootTest` execution.
- [x] `application-prod.properties`: Locks down logging, disables DDL auto-updates, and enforces strict environment variables.

## 6. Automation
You can run the `cleanup-scanner.ps1` script at any time to automatically search your codebase for bad practices.
