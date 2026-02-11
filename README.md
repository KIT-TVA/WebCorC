# <div align="center">WebCorC</div>

<div align="center">

**The Web-based Correctness-by-Construction (CbC) IDE**

[![Frontend](https://img.shields.io/badge/Frontend-Angular_19-dd0031.svg)](https://angular.io/)
[![Backend](https://img.shields.io/badge/Backend-Micronaut-black.svg)](https://micronaut.io/)
[![Build](https://img.shields.io/badge/Build-Docker-2496ed.svg)](https://www.docker.com/)

</div>

---

## Project Overview

**WebCorC** is a modern, web-based evolution of the Eclipse-based [CorC](https://github.com/KIT-TVA/CorC) tool. It provides a graphical and textual Integrated Development Environment (IDE) designed to support the **Correctness-by-Construction (CbC)** approach to software development.

### What is CbC?
Correctness-by-Construction is a methodology where programs are developed incrementally, guided by rigorous pre- and post-condition specifications. Instead of writing code and then testing it, developers use **refinement rules** that guarantee the correctness of the implementation at every step. WebCorC supports this workflow by:
- Allowing you to start with an abstract specification.
- Guiding you through a sequence of refinement steps.
- Verifying the correctness of each step using a deductive verifier.

> **Live Demo**: Try out the public instance at [corc.informatik.kit.edu](https://corc.informatik.kit.edu/)

---

## Artifact Evaluation Instructions

For the FM'26 artifact evaluation, we provide two multi-platform Docker images.

### Prerequisites
- Docker ≥ 24.x  
- Docker Compose v2

### Artifact Setup Instructions

The following steps must be executed **in the unpacked artifact archive**, i.e., in the directory where the `README.md` file is located.

#### 1. Load the Prebuilt Docker Images

Load the backend and frontend images provided with the artifact:

```bash
docker load < webcorc-be-fm.tar.xz
docker load < webcorc-fe-fm.tar.xz
```

#### 2. Start the Artifact Evaluation Setup

```bash
docker compose -f artifacteval-compose.yml up -d
```

After startup completes, the WebCorC web interface will be available at:

```
http://localhost:4200
```

> **Browser Note**: WebCorC does not support WebKit-based browsers such as Safari.
> Please use browsers like Chrome, Edge, or Firefox.

#### 3. Stopping the System

```bash
docker compose -f artifacteval-compose.yml down
```

#### (4.) Local Build Fallback

```bash
docker compose -f docker-compose.dev.yml up --build
```

This builds all images locally from the Dockerfiles.

---

## Reproduction of Examples from Tutorial Paper


### 0. Important Note
WebCorC stores a project ID in the browser session.\
We recommend accessing WebCorC in **incognito/private browser tabs** to
avoid state conflicts.


Before loading an example in a project already containing files, you **must reset the project** .

You can do this in one of the following ways:

-   **Option A (Recommended):**\
    Open examples in a new **incognito/private browser tab**.

-   **Option B (Manual Reset):**

    1.  Click the **settings wheel** in the top bar.\
    2.  Click the red button **"Resetting project ID"**.
    3.  Load example as described below.

### 1. Transaction Example

The first example from the tutorial paper is the **Transaction** algorithm.\
It can be reconstructed manually using the instructions from Detours 1-3 of
the paper, but it is also fully available as a predefined example.

#### Steps for Loading the Predefined Example

1.  On the landing page, click **Load Example**.
2.  Select **Transaction** and **Load Example**.
3.  Open the **Project Explorer** on the left side.
4.  Select the file **transaction.diagram**.
5.  Click into the editor to close the project explorer.
6.  Click the **Verify** button in the top-right corner.
7.  Confirm the **saving** dialog.
8.  Wait until verification completes (this may take a few seconds).
9.  Successful verification is indicated by the green **Verified** icons in the refinements of the program and in the **Console** which can be opened on the right-hand side of the editor.

### 2. BubbleSort Example

The second example from the tutorial paper is **BubbleSort**.\
It can be constructed following the paper's theoretical descriptions or loaded
directly as a predefined example.

> **Important:** Make sure to **reset the project** before loading this example (see
> above).

#### Steps for Loading the Predefined Example

1.  On the landing page, click **Load Example**.
2.  Select **Bubblesort** and **Load Example**.
3.  Open the **Project Explorer** on the left side.
4.  Select the file **bubblesort.diagram**.
5.  Click into the editor to close the project explorer.
6.  Click the **Verify** button in the top-right corner.
7.  Confirm the **saving** dialog.
8.  Wait until verification completes (this may take a few seconds).
9.  Successful verification is indicated by the green **Verified** icons in the refinements of the program and in the **Console** which can be opened on the right-hand side of the editor.

---

## Technology Stack

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

##  Project Structure

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

This project is licensed under the [Apache 2.0](LICENSE).