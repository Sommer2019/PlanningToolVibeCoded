# Multi-stage build for the Planning & Tracking backend.
# Build context = ./backend (see docker-compose.yml and CI).

# ---- Stage 1: build ----
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /workspace

# Cache dependencies first.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Build the application (tests run separately in CI).
COPY src ./src
RUN mvn -B -DskipTests clean package

# ---- Stage 2: runtime ----
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# curl for the container healthcheck; non-root user for runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app app

COPY --from=build /workspace/target/*.jar app.jar
RUN chown -R app:app /app
USER app

EXPOSE 8004
ENV JAVA_OPTS=""

HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=5 \
  CMD ["sh", "-c", "curl -fsS http://localhost:8004/health | grep -q ok || exit 1"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
