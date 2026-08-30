# -------------------------------------------------------------
# Stage 1: Build the Application
# -------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS builder

# Set working directory inside the build stage
WORKDIR /build

# Copy the pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the source code
COPY src ./src

# Build the application (skipping tests for faster Docker builds, as tests should be run in CI)
RUN mvn clean package -DskipTests

# -------------------------------------------------------------
# Stage 2: Create the Runtime Image
# -------------------------------------------------------------
FROM openjdk:21-slim

# Create a non-root user and group
RUN addgroup --system spring && adduser --system --ingroup spring spring
USER spring:spring

# Set the working directory
WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /build/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 8080

# Configure health check targeting the Actuator endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the Spring Boot application using the prod profile
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
