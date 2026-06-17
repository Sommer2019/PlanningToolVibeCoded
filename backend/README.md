# Planning Tool – Backend

Kotlin Spring Boot Backend für die Uni Student Collaboration & Planning Platform.

## Features

- ✅ Task CRUD (Erstellen, Lesen, Bearbeiten, Löschen)
- ✅ Kanban Board (Status: TODO → IN_PROGRESS → DONE)
- ✅ Task-Locking (Sperren von Tasks)
- ✅ Kalender-Integration (Einträge + Tasks im Kalender)
- ✅ Berechtigungen (Gruppen-Zugriff, Admin-Zugriff)
- ✅ Swagger API Docs

## Voraussetzungen

- Java 21+
- Docker (für PostgreSQL)

## Schnellstart

### 1. PostgreSQL starten
```bash
cd backend
docker-compose up -d
```

### 2. Backend starten
```bash
cd backend
./gradlew bootRun
```

### 3. API Docs öffnen
Öffne im Browser: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## API Endpoints

### Tasks
| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `GET` | `/api/tasks?groupId=1` | Alle Tasks einer Gruppe |
| `GET` | `/api/tasks/{id}` | Einzelne Task |
| `POST` | `/api/tasks` | Neue Task erstellen |
| `PUT` | `/api/tasks/{id}` | Task bearbeiten |
| `PATCH` | `/api/tasks/{id}/status` | Status ändern |
| `PATCH` | `/api/tasks/{id}/lock` | Task sperren/entsperren |
| `DELETE` | `/api/tasks/{id}` | Task löschen |

### Kalender
| Methode | Endpoint | Beschreibung |
|---------|----------|-------------|
| `GET` | `/api/calendar?groupId=1` | Alle Kalendereinträge |
| `POST` | `/api/calendar` | Neuen Eintrag erstellen |
| `PUT` | `/api/calendar/{id}` | Eintrag bearbeiten |
| `DELETE` | `/api/calendar/{id}` | Eintrag löschen |

### Authentifizierung
Aktuell wird die User-ID per Header `X-User-Id` übergeben. JWT-Auth kann später ergänzt werden.

## Tech Stack

- **Kotlin** + **Spring Boot 3.5**
- **PostgreSQL 16**
- **Spring Data JPA** (Hibernate)
- **SpringDoc OpenAPI** (Swagger)
- **Gradle** (Kotlin DSL)
