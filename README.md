# AI Teacher Copilot

**Curriculum-Grounded AI Teaching Assistant for K-12 Teachers**

AI Teacher Copilot is a specialized AI assistant that helps lower and upper secondary education (THCS/THPT) teachers create teaching materials (lesson plans, quizzes, etc.) grounded in their own uploaded documents. 

Unlike general educational chatbots, this system provides a controlled workflow: **Upload Documents → RAG Retrieval → AI Generation → Teacher Review → Save & Export.**

> **Note:** The detailed project vision, problem statement, architecture design, and RAG rules have been moved to the documentation folder. Please read [Project Overview](docs/Requirements_and_Planning/Project_Overview.md) for full details.

---

## 🏗️ Repository Structure

```text
ai-teacher-copilot/
├── backend/                  # Spring Boot (Java 17) - Core API, Auth, Workspaces
├── frontend/                 # React 18 + Vite - Web UI
├── ai-service/               # FastAPI (Python 3.12) - RAG, Document Processing, LLM integration
├── infrastructure/           # Docker configuration (PostgreSQL + pgvector, MinIO)
└── docs/                     # Detailed project documentation (Agile, Planning, QA, etc.)
```

## 🚀 Quick Start (Local Development)

The project consists of 4 main components that run together. 

### Prerequisites
- Docker & Docker Compose
- Java 17+
- Node.js 20+
- Python 3.12+

### Step 1: Start Infrastructure (Database & Storage)
Run Docker Compose from the root directory to start PostgreSQL (with pgvector) and MinIO:
```bash
docker-compose up -d
```

### Step 2: Start Backend (Spring Boot)
Open a new terminal, navigate to `backend`, and use the Maven wrapper to run:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
*The backend will run on `http://localhost:8080`. Flyway will automatically create the database tables.*

### Step 3: Start AI Service (FastAPI)
Open a new terminal, navigate to `ai-service`, set up the Python virtual environment, install requirements, and run Uvicorn:
```bash
cd ai-service
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The AI Service will run on `http://localhost:8000`.*

### Step 4: Start Frontend (React)
Open a new terminal, navigate to `frontend`, install dependencies and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
*Access the UI at `http://localhost:5173`.*

---

## 📚 Documentation

For a deep dive into the project's requirements, architecture, and planning, please refer to the `docs/` directory:

- [Project Overview & Architecture](docs/Requirements_and_Planning/Project_Overview.md)
- [Requirements & Planning](docs/Requirements_and_Planning/)
- [Agile Management & Sprint Backlogs](docs/Agile_Management/)
- [Database Schema & Data Architecture](docs/Development_and_Data/)
- [Testing & QA](docs/Testing_and_QA/)
