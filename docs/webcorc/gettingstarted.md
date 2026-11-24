# 🚀 WebCorC - Getting Started

WebCorC is the web-based CbC IDE. You can use the public instance right away or run it yourself.

## 🌐 Using WebCorC

### 🔗 Open the Tool

Open the public instance at [corc.informatik.kit.edu](https://corc.informatik.kit.edu/).

!!! warning "Browser support"
    WebKit-based browsers such as Safari are **not** supported. Use Chrome, Edge or Firefox.

### 🏁 Landing Page

The landing page offers three actions:

| Action | What it does |
|---|---|
| 📄 **Import File** | Import a single CbC file into your workspace |
| 📦 **Import Project** | Import a whole project (multiple files) |
| 📂 **Open Project** | Open a project that already exists |

### 🗄️ Open an Example

1. Download an example CbC file or project, e.g. from the [CorC repository](https://github.com/KIT-TVA/CorC) or the [case studies](../corc/casestudies.md).
2. Click **Import File** (single file) or **Import Project** (several files) and select it.
3. Open the menu (☰) in the top left to browse your files in the project explorer, then open the file in the editor.

### ✅ Verify

1. Open a CbC program in the editor.
2. Click **Verify** in the top bar. The button is disabled as long as no program is open.
3. WebCorC checks every refinement step with the deductive verifier [KeY](https://www.key-project.org/).
4. Follow the results in the console (🖥️ icon in the top right).

!!! note
    If your project contains a `helper.key`, WebCorC asks you to create a backend project first. Confirm the dialog, verification then continues automatically.

### 🧰 Other Top Bar Functions

- 🔗 **Share**: share your project
- 💻 **Generate Code**: generate code from a verified program
- 🧠 **AI Chat**: open the AI assistant (see [AI Chat](ai-chat.md))
- 🖥️ **Console**: show output and verification messages

## 🛠️ Getting Started for Developers

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

### 🧱 Tech Stack

| Part | Technology |
|---|---|
| Frontend | Angular 21, Angular Material, TailwindCSS, Monaco Editor |
| Backend | Micronaut 4.5.1, Java 21, KeY 3.0.0, MongoDB, Maven |
| Infrastructure | Docker & Docker Compose, Caddy |

### 📂 Project Structure

```
WebCorC/
├── backend/               # Micronaut Java API
├── frontend/              # Angular Single Page Application
├── config/                # Project-wide configurations (e.g., checkstyle)
├── data/                  # Persistent data storage (MongoDB, logs)
├── docker-compose.yml     # Production composition
└── docker-compose.dev.yml # Development composition
```

For more details see the [README](https://github.com/KIT-TVA/WebCorC#readme).
