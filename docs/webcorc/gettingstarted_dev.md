# 🚀 Getting Started for Developers

WebCorC consists of an Angular frontend and a Micronaut backend, which verifies programs with KeY.

### 📋 Prerequisites

- **Git**
- **Docker** & **Docker Compose** (containerized run)
- **Java 21 JDK** (manual backend run)
- **Node.js** (manual frontend run)

### 🐳 Option 1: Docker (recommended)

1. Clone the repository:
    ```sh
    git clone https://github.com/KIT-TVA/WebCorC.git
    cd WebCorC
    ```
2. Start the development environment:
    ```sh
    docker compose -f docker-compose.dev.yml up --build
    ```
    !!! tip
        Press `w` after the start to enable **hot reloading** via Docker Compose Watch.
3. Open `http://localhost:4200`.

!!! note
    The AI features need your OpenAI API key in `docker-compose.env`.

### 🔧 Option 2: Manual Setup

**Backend** (REST API and verification):

```sh
cd backend
./mvnw mn:run
```

Swagger UI: `http://localhost:8080/swagger-ui`

**Frontend**:

```sh
cd frontend
npm install
npm run ng serve
```

Frontend: `http://localhost:4200`

For more details see the [README](https://github.com/KIT-TVA/WebCorC#readme).
