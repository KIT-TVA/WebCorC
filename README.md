# <div align="center">WebCorC</div>

<div align="center">

**The Web-based Correctness-by-Construction (CbC) IDE**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Angular_19-dd0031.svg)](https://angular.io/)
[![Backend](https://img.shields.io/badge/Backend-Micronaut-black.svg)](https://micronaut.io/)
[![Build](https://img.shields.io/badge/Build-Docker-2496ed.svg)](https://www.docker.com/)

</div>

---

## 📖 Project Overview

**WebCorC** is a modern, web-based evolution of the Eclipse-based [CorC](https://github.com/KIT-TVA/CorC) tool. It provides a graphical and textual Integrated Development Environment (IDE) designed to support the **Correctness-by-Construction (CbC)** approach to software development.

### What is CbC?
Correctness-by-Construction is a methodology where programs are developed incrementally, guided by rigorous pre- and post-condition specifications. Instead of writing code and then testing it, developers use **refinement rules** that guarantee the correctness of the implementation at every step. WebCorC supports this workflow by:
- Allowing you to start with an abstract specification.
- Guiding you through a sequence of refinement steps.
- Verifying the correctness of each step using a deductive verifier.

> **Live Demo**: Try out the public instance at [corc.informatik.kit.edu](https://corc.informatik.kit.edu/)

For more in-depth information on the concepts, visit the [CorC Wiki](https://github.com/KIT-TVA/CorC/wiki).

---

## ✨ Key Features

- **Web-Based IDE**: Accessible from any modern browser without complex local installation requirements for users.
- **Graphical & Textual Editing**: Flexible views to suit different development preferences.
- **Incremental Refinement**: Step-by-step guidance to build correct software.
- **Integrated Verification**: Built-in support for verifying refinement steps against formal specifications.
- **Modern Stack**: Built with performance and developer experience in mind using Angular and Micronaut.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Angular 19](https://angular.dev/)
- **Component Library**: [Angular Material](https://material.angular.io/) + [PrimeNG](https://primeng.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) (VS Code engine)

### Backend
- **Framework**: [Micronaut](https://micronaut.io/)
- **Language**: Java 21
- **Database**: MongoDB
- **Build Tool**: Maven

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Caddy

---

## 🚀 Getting Started

You can run WebCorC entirely using Docker, or set up the development environment manually.

### Prerequisites
- **Git**
- **Docker** & **Docker Compose** (for containerized run)
- **Java 21 JDK** (for manual backend run)
- **Node.js** (for manual frontend run)

### Option 1: Quick Start (Docker)
The easiest way to get up and running is with Docker Compose. This will spin up the Frontend, Backend, Database, and Caddy server.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/KIT-TVA/WebCorC.git
    cd WebCorC
    ```

2.  **Start the development environment:**
    ```bash
    docker compose -f docker-compose.dev.yml up --build
    ```
    > **Tip**: Press `w` in the terminal after starting to enable **Hot Reloading** via Docker Compose Watch.

3.  **Access the application:**
    Open your browser and navigate to `http://localhost`.

### Option 2: Manual Development Setup

If you prefer to run services individually for debugging or native performance:

#### Backend Setup
The backend exposes a REST API and verifies your CbC programs.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Run the application using the Maven wrapper:
    ```bash
    ./mvnw mn:run
    ```
    *The backend Swagger UI will be available at: `http://localhost:8080/swagger-ui`*

#### Frontend Setup
The frontend provides the user interface.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    ng serve
    ```
    *Access the frontend at: `http://localhost:4200`*

---

## 📂 Project Structure

```
WebCorC/
├── backend/            # Micronaut Java API
├── frontend/           # Angular Single Page Application
├── config/             # Project-wide configurations (e.g., checkstyle)
├── data/               # Persistent data storage (MongoDB, logs)
├── docker-compose.yml  # Production composition
└── docker-compose.dev.yml # Development composition
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).
