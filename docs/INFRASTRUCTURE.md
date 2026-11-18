# AI Teacher Copilot — Infrastructure, Security & Environment Specification

> Tài liệu tham chiếu chính thức về cấu hình hạ tầng, biến môi trường, mạng nội bộ và các yêu cầu bảo mật cho môi trường development và deployment.

---

## 1. Tổng quan kiến trúc hạ tầng

```
┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC INTERNET                        │
│                                                             │
│     Browser  ──────────────►  Frontend (React/Vite)        │
│                                    │                        │
│                                    │ REST API               │
│                                    ▼                        │
│                          Spring Boot Backend                │
│                          (Port 8080, public)                │
│                                    │                        │
└────────────────────────────────────┼────────────────────────┘
                                     │ Internal HTTP
                 ┌───────────────────┼───────────────────────┐
                 │     INTERNAL NETWORK (not public)          │
                 │                   │                        │
                 │                   ▼                        │
                 │         FastAPI AI Service                 │
                 │         (Port 8000, internal only)         │
                 │              │          │                  │
                 │              ▼          ▼                  │
                 │         PostgreSQL    MinIO                │
                 │         (Port 5432)  (Port 9000/9001)      │
                 │                                            │
                 └────────────────────────────────────────────┘
```

> **Security Rule**: FastAPI (`ai-service`) KHÔNG được expose trực tiếp ra internet.
> Mọi request từ Frontend phải đi qua Spring Boot (authentication + authorization gate).

---

## 2. Services & Ports

| Service | Role | Port | Network |
|---------|------|------|---------|
| React (Vite dev server) | Frontend client | `5173` (dev) | Public |
| Spring Boot | Backend API gateway | `8080` | Public |
| FastAPI | AI / RAG internal service | `8000` | Internal only |
| PostgreSQL + pgvector | Primary database | `5432` | Internal only |
| MinIO API | S3-compatible object storage | `9000` | Internal only |
| MinIO Console | Admin UI | `9001` | Internal only (dev) |

---

## 3. Docker Compose — Local Development

### Entry point
```bash
# Khởi động infrastructure (Postgres + MinIO)
docker compose up -d

# Kiểm tra health
docker compose ps

# Dừng
docker compose down

# Dừng + xóa data volumes
docker compose down -v
```

### File structure
```
docker-compose.yml                              ← Root entry point
infrastructure/
├── docker-compose/
│   ├── docker-compose.dev.yml                  ← Dev services config
│   └── docker-compose.prod.yml                 ← Production config (placeholder)
├── postgres/
│   └── init/
│       └── 01-init.sql                         ← Khởi tạo pgvector extension
└── minio/                                      ← MinIO config (nếu cần)
```

### Services & Healthchecks

#### PostgreSQL (`atc-postgres`)
```yaml
image: pgvector/pgvector:pg16
healthcheck:
  test: pg_isready -U <user> -d <db>
  interval: 5s | timeout: 5s | retries: 5
volumes:
  - postgres_data:/var/lib/postgresql/data      ← Persistent volume
  - ./postgres/init:/docker-entrypoint-initdb.d ← Auto-run on first start
```

#### MinIO (`atc-minio`)
```yaml
image: minio/minio:latest
command: server /data --console-address ":9001"
healthcheck:
  test: mc ready local
  interval: 5s | timeout: 5s | retries: 5
volumes:
  - minio_data:/data                            ← Persistent volume
```

#### MinIO Init (`atc-minio-init`)
```yaml
depends_on:
  minio:
    condition: service_healthy                  ← Chỉ chạy khi minio healthy
```
- Tự động tạo buckets: `documents`, `exports`

### Dependency startup order
```
atc-postgres (healthy) ──► Spring Boot / FastAPI (manual start)
atc-minio    (healthy) ──► atc-minio-init ──► Spring Boot / FastAPI
```

---

## 4. Biến môi trường

> **Rule**: Tất cả secrets phải load từ `.env`. Chỉ commit `.env.example` vào VCS. Không bao giờ commit `.env`.

### Root `.env.example`

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `POSTGRES_HOST` | Host PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Port PostgreSQL | `5432` |
| `POSTGRES_DB` | Tên database | `aiteachercopilot` |
| `POSTGRES_USER` | User PostgreSQL | `aiteacher` |
| `POSTGRES_PASSWORD` | ⚠️ **Secret** — Mật khẩu DB | `changeme_db_password` |
| `MINIO_ENDPOINT` | MinIO endpoint URL | `http://localhost:9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | ⚠️ **Secret** — MinIO secret | `changeme_minio_password` |
| `MINIO_BUCKET_DOCUMENTS` | Bucket chứa tài liệu gốc | `documents` |
| `MINIO_BUCKET_EXPORTS` | Bucket chứa file export | `exports` |
| `JWT_SECRET` | ⚠️ **Secret** — Tối thiểu 32 ký tự | `changeme_jwt_secret_...` |
| `JWT_EXPIRATION_MS` | JWT TTL (ms) | `86400000` (24h) |
| `AI_PROVIDER` | LLM provider: `openai` hoặc `gemini` | `gemini` |
| `OPENAI_API_KEY` | ⚠️ **Secret** — OpenAI API key | _(để trống nếu dùng Gemini)_ |
| `GEMINI_API_KEY` | ⚠️ **Secret** — Gemini API key | `AIza...` |
| `AI_SERVICE_URL` | Internal FastAPI URL (Spring Boot → FastAPI) | `http://localhost:8000` |
| `AI_SERVICE_API_KEY` | ⚠️ **Secret** — Shared key Spring Boot ↔ FastAPI | `changeme_internal_api_key` |
| `SPRING_PROFILES_ACTIVE` | Spring Boot profile | `dev` |
| `SERVER_PORT` | Spring Boot server port | `8080` |
| `FASTAPI_PORT` | FastAPI server port | `8000` |
| `FASTAPI_ENV` | FastAPI environment | `development` |

---

## 5. Cơ sở dữ liệu — PostgreSQL

### Extensions (auto-initialized)
```sql
-- infrastructure/postgres/init/01-init.sql
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector for embedding storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation
```

### Schema Management
- **Tool**: Flyway (managed bởi Spring Boot)
- **Migration files**: `backend/src/main/resources/db/migration/V*.sql`
- **Test profile**: H2 in-memory, Flyway disabled — không cần PostgreSQL khi chạy unit test

### pgvector
- Vector dimension: `768` (theo embedding model)
- Index type: `ivfflat` hoặc `hnsw` (tùy cấu hình retrieval)
- Similarity function: cosine similarity

---

## 6. Object Storage — MinIO

| Bucket | Mục đích | Retention |
|--------|----------|-----------|
| `documents` | File gốc upload (PDF, DOCX) | Permanent |
| `exports` | File export (PDF, DOCX generated) | Configurable |

- **Access pattern**: Spring Boot ↔ MinIO qua Java MinIO SDK
- **Presigned URLs**: Không expose bucket public — download qua Spring Boot endpoint
- **Max file size**: Cấu hình tại Spring Boot (`spring.servlet.multipart.max-file-size`)

---

## 7. CI/CD — GitHub Actions

| Workflow | File | Trigger | Services |
|----------|------|---------|----------|
| Backend CI | `backend-ci.yml` | `backend/**` push/PR | H2 in-memory |
| AI Service CI | `ai-service-ci.yml` | `ai-service/**` push/PR | `pgvector/pgvector:pg16` container |
| Frontend CI | `frontend-ci.yml` | `frontend/**` push/PR | — |
| Integration Gate | `ci.yml` | Push/PR to `main` | `pgvector/pgvector:pg16` |

### CI Environment Variables (GitHub Secrets)
Các biến sau cần được cấu hình trong **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret Name | Dùng trong |
|-------------|------------|
| _(không cần thêm secrets cho CI test hiện tại)_ | CI dùng dummy values |
| `GEMINI_API_KEY` | (Tùy chọn) nếu muốn test với real API |

---

## 8. Security Configuration

### Authentication Flow
```
Browser → POST /api/auth/login → Spring Boot
                                    │
                               Validates credentials
                               Issues JWT (HS256)
                                    │
                               Returns { token, user }
                                    │
Browser stores token → Subsequent requests include:
Authorization: Bearer <token>
```

### JWT Configuration
- **Algorithm**: HS256
- **Secret**: `JWT_SECRET` env var (minimum 32 characters)
- **Expiry**: `JWT_EXPIRATION_MS` (default 24h = 86400000ms)
- **Validation**: `JwtAuthenticationFilter` trong Spring Security filter chain

### Internal Service Security (Spring Boot → FastAPI)
- FastAPI yêu cầu header `X-API-Key: <AI_SERVICE_API_KEY>` trên mọi internal request
- Key phải trùng khớp giữa Spring Boot (`AI_SERVICE_API_KEY`) và FastAPI (`AI_SERVICE_API_KEY`)
- FastAPI **không** expose endpoint public — chỉ bind localhost hoặc internal Docker network

### Prompt Security (AI Governance)
```
System Prompt (trusted)
    ↓
<sources>
  [Retrieved document chunks — UNTRUSTED DATA]
</sources>
    ↓
User query (trusted)
```
- Document content KHÔNG BAO GIỜ được merge vào system prompt
- Xem đầy đủ trong [Security & AI Governance Rules](../.agents/rules/00-project-foundation.md)

### Data Isolation
- Mọi query vector/metadata đều phải filter theo `workspace_id`
- Cross-workspace access → `403 Forbidden`
- Student PII **ngoài phạm vi MVP** — không thu thập, không lưu trữ

---

## 9. Development Environment Setup

### Prerequisites
| Tool | Version |
|------|---------|
| Java (JDK) | 17 (Temurin recommended) |
| Python | 3.12 |
| Node.js | 20 LTS |
| Docker Desktop | Latest stable |
| Maven | Bundled (`mvnw`) |

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/<username>/ai-teacher-copilot.git
cd ai-teacher-copilot

# 2. Setup environment variables
cp .env.example .env
# → Điền các giá trị thực vào .env

# 3. Start infrastructure
docker compose up -d

# 4. Start Backend (Spring Boot)
cd backend
./mvnw spring-boot:run

# 5. Start AI Service (FastAPI)
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 6. Start Frontend (React)
cd frontend
npm install
npm run dev
```

### Service URLs (Development)
| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080` |
| AI Service | `http://localhost:8000` (internal only) |
| MinIO Console | `http://localhost:9001` (admin: `minioadmin/minioadmin`) |
| PostgreSQL | `localhost:5432` |
