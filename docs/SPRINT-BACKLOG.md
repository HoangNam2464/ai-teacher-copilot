# AI Teacher Copilot — Sprint Backlog & Kế Hoạch Thực Thi 6 Sprints (Jira Ready)

> **Tài liệu chuẩn quản trị thực thi dự án theo mô hình Solo Developer**  
> **Khung quản trị**: Agile Methodology + Scrum-Based Project Management (6 Sprints × 4 tuần / 24 tuần tổng thể)  
> **Đối tượng sử dụng**: Jira Software Backlog, Theo dõi tiến độ & Báo cáo Milestone  
> **Cập nhật chính thức**: 2026-08-20  

---

## 1. QUY ƯỚC ĐẶT MÃ & ĐỐI SOÁT TRONG JIRA

Dự án áp dụng mô hình quản trị Jira tinh gọn (tương tự định dạng FoodieGo): **Project → Sprint → Master Task → Group Task ID → Story Points → Dependency → Status**, không xây dựng hệ thống Epic riêng.

```text
Jira Project: AI Teacher Copilot
Space Key: ATC
        │
        ├── Sprint 1 - Foundation
        │     └── Master Tasks
        ├── Sprint 2 - Auth & Ingestion
        │     └── Master Tasks
        ├── Sprint 3 - RAG & Lesson
        │     └── Master Tasks
        ├── Sprint 4 - Quiz & Versioning
        │     └── Master Tasks
        ├── Sprint 5 - Testing & Optimization
        │     └── Master Tasks
        └── Sprint 6 - Production & Handover
              └── Master Tasks
```

Để đảm bảo khả năng đối soát 1:1 giữa tài liệu đặc tả (Source of Truth), mã nguồn Git và hệ thống Jira Software, dự án phân biệt rõ ràng **3 loại mã**:

1. **Jira Issue Key** *(Hệ thống Jira tự sinh)*:  
   * Định dạng: `ATC-1`, `ATC-2`, `ATC-17`...  
   * Được Jira tự động tăng dần khi tạo issue mới trong Project `ATC`.
2. **Master Task ID** *(Mã quản trị Source of Truth)*:  
   * Định dạng: `ATC-101`, `ATC-201`, `ATC-304`, `ATC-605`...  
   * Được giữ nguyên không đổi để đối soát với các tài liệu kiến trúc, branch Git (`feature/authentication`), PR và Test Plan.
3. **Group Task ID** *(Mã phân loại chuyên môn kỹ thuật)*:  
   * `[ARCH-xxx]` — Architecture / System Design (`ARCH-001`)  
   * `[BE-xxx]` — Backend Development (`BE-001` → `BE-011`)  
   * `[FE-xxx]` — Frontend Client (`FE-001`)  
   * `[AI-xxx]` — AI / RAG / Prompt / Vector Ingestion (`AI-001` → `AI-010`)  
   * `[DB-xxx]` — Database / Migration / Vector Optimization (`DB-001` → `DB-002`)  
   * `[OPS-xxx]` — DevOps / Infrastructure / Docker / CI/CD (`OPS-001` → `OPS-005`)  
   * `[QA-xxx]` — Quality Assurance / Testing / Security / Benchmark (`QA-001` → `QA-005`)  
   * `[DOC-xxx]` — Documentation / Requirements / Handover (`DOC-001` → `DOC-002`)  

📌 **Quy chuẩn đặt tên trường Summary trên Jira**:  
```text
[GROUP-###] [ATC-###] Task Name
```
*Ví dụ*: `[BE-001] [ATC-201] Teacher Registration & Secure BCrypt Password Hashing`

📌 **Quy chuẩn Issue Type trên Jira**:  
* Sử dụng các Issue Type mặc định của Jira: **`Story`**, **`Task`**, **`Bug`** (không tạo custom type riêng).  
* Các công việc hạ tầng, kỹ thuật, cấu hình được gán Issue Type là **`Task`**.

📌 **Phân định 37 Master Tasks vs Supplementary / Historical Tasks**:
* **37 Master Tasks (181 SP)**: Là Backlog quản trị chính thức (Official Master Backlog) được thống nhất xuyên suốt dự án.
* **Supplementary Tasks** (như các task hoàn thành sớm giao diện Frontend `FE-P1-TOKENS`, `FE-P31-LESSON-PLANNER`... hoặc các sub-task chi tiết `BE-DOC-STATUS-SYNC`): Là các task triển khai chi tiết / log lịch sử hỗ trợ đối soát, không thuộc 37 Master Tasks và không cộng vào 181 SP chính thức.

---

## 2. CHIẾN LƯỢC PHÂN BỔ SPRINT & ÁNH XẠ PHASE LIÊN TỤC

Theo đúng Roadmap gốc (24 tuần / 8 Phase), các Phase có thời lượng linh hoạt (2–5 tuần) được ánh xạ liên tục và tự nhiên vào **6 Sprint cố định (4 tuần/Sprint)**:

```text
Tuần:    01  02 | 03  04 | 05  06  07 | 08  09  10 | 11  12  13  14 | 15  16  17  18  19 | 20  21  22 | 23  24
Roadmap: |--P1--| |--P2--| |----P3----| |----P4----| |-------P5-------| |----------P6----------| |----P7----| |--P8--|
Sprint:  [  SPRINT 1   ] [  SPRINT 2   ] [  SPRINT 3   ] [  SPRINT 4   ] [  SPRINT 5   ] [  SPRINT 6   ]
          (Tuần 1–4)      (Tuần 5–8)      (Tuần 9–12)     (Tuần 13–16)    (Tuần 17–20)    (Tuần 21–24)
```

### 🗺️ Danh Sách 6 Sprints Chuẩn:
* **Sprint 1 - Foundation** (Tuần 1–4): Phase 1 + Phase 2 (Monorepo, Docker, CI/CD, Frontend Tokens & Layout)
* **Sprint 2 - Auth & Ingestion** (Tuần 5–8): Phase 3 + Phase 4 (Auth, Workspace Isolation, MinIO Upload, Vector Ingestion)
* **Sprint 3 - RAG & Lesson** (Tuần 9–12): Phase 4 + Phase 5 (RAG Retrieval, AI Safety `<sources>`, AI Lesson Planner, Persistence)
* **Sprint 4 - Quiz & Versioning** (Tuần 13–16): Phase 5 + Phase 6 (Quiz Generator, Bloom Taxonomy, Regeneration, History & Export)
* **Sprint 5 - Testing & Optimization** (Tuần 17–20): Phase 6 + Phase 7 (E2E Integration Tests, RAG Quality Benchmark, Security)
* **Sprint 6 - Production & Handover** (Tuần 21–24): Phase 7 + Phase 8 (Production Docker, Nginx SSL, Backup Runbook & Handover)

---

## 3. BẢNG TỔNG HỢP SỐ LƯỢNG TASK & STORY POINTS (181 SP / 37 TASKS)

| Sprint | Tên Sprint | Khung Thời Gian | Phase Ánh Xạ | Số Task | Committed SP | Trọng Tâm Bàn Giao (Increment Deliverable) |
|---|---|:---:|---|:---:|:---:|---|
| **Sprint 1** | **Sprint 1 - Foundation** | Tuần 1 – 4 | **Phase 1 + Phase 2** | 6 tasks | **23 SP** *(+3 SP Done)* | Foundation, Monorepo Setup, CI/CD 4 luồng, Frontend Tokens & Layout |
| **Sprint 2** | **Sprint 2 - Auth & Ingestion** | Tuần 5 – 8 | **Phase 3 + Phase 4 (đầu)** | 8 tasks | **34 SP** | Auth (BCrypt/JWT), Workspace Isolation, MinIO Upload & Vector Ingestion |
| **Sprint 3** | **Sprint 3 - RAG & Lesson** | Tuần 9 – 12 | **Phase 4 (cuối) + Phase 5 (đầu)** | 7 tasks | **34 SP** | RAG Retrieval, Boundary `<sources>`, Insufficient Evidence, Lesson Plan |
| **Sprint 4** | **Sprint 4 - Quiz & Versioning** | Tuần 13 – 16 | **Phase 5 (cuối) + Phase 6 (đầu)** | 6 tasks | **30 SP** | Quiz Generator (Bloom Tags), Regeneration (`version++`), Lineage & Rubric |
| **Sprint 5** | **Sprint 5 - Testing & Optimization** | Tuần 17 – 20 | **Phase 6 (cuối) + Phase 7 (đầu)** | 5 tasks | **29 SP** | E2E Integration Tests, RAG Quality Benchmark, Xử lý file lỗi & Security |
| **Sprint 6** | **Sprint 6 - Production & Handover** | Tuần 21 – 24 | **Phase 7 (cuối) + Phase 8** | 5 tasks | **28 SP** | Production Docker Compose, Nginx SSL, Backup Runbook, Bàn giao & Demo |
| **TỔNG CỘNG** | **6 Sprints** | **24 tuần** | **8 Phases (100%)** | **37 tasks** | **178 SP Committed** *(181 SP Total)* | **Hệ thống AI Teacher Copilot hoàn chỉnh, sẵn sàng nghiệm thu** |

---

## 4. CHI TIẾT 37 TASKS TRONG 6 SPRINT BACKLOG CHO JIRA

---

### 🟢 SPRINT 1 - FOUNDATION (Tuần 1 – 4)
* **Sprint Goal**: Thiết lập hoàn chỉnh kiến trúc Monorepo 3 tầng, cấu hình hạ tầng Docker dev, hệ thống CI/CD 4 workflows, CSDL Flyway migration chuẩn hóa, và khung Frontend 4 tầng có thể build sạch.
* **Committed Capacity**: 23 SP (+ 3 SP Historical Done = 26 SP Total).

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `ARCH-001` | **ATC-101** | Task | `[ARCH-001] [ATC-101] Standardize Monorepo Layout & Move AI-Service to Root` | Sprint 1 - Foundation | Phase 2 | High | 3 | None | 1. `ai-service/` nằm độc lập ở thư mục gốc.<br>2. `docker-compose.yml` và script dev nhận diện đúng đường dẫn.<br>3. Không còn file mồ côi trong `backend/`. | **DONE** |
| `OPS-001` | **ATC-102** | Task | `[OPS-001] [ATC-102] Setup Docker Compose Dev Infrastructure` | Sprint 1 - Foundation | Phase 2 | High | 5 | None | 1. `docker compose up -d` khởi chạy `atc-postgres`, `atc-minio`, `atc-minio-init`.<br>2. Healthcheck của Postgres và MinIO đều pass.<br>3. Extension `vector` và `uuid-ossp` được khởi tạo thành công. | **DONE** |
| `DB-001` | **ATC-103** | Task | `[DB-001] [ATC-103] Setup Flyway Database Migrations & UUID Standardization` | Sprint 1 - Foundation | Phase 2 | High | 5 | is blocked by ATC-102 | 1. `mvnw test` với profile `test` (H2) chạy thành công không có failure.<br>2. Flyway tự động migrate đúng 6 bảng trên PostgreSQL thực tế.<br>3. Bảng `document_chunks` có HNSW index. | **DONE** |
| `OPS-002` | **ATC-104** | Task | `[OPS-002] [ATC-104] Implement Multi-Service CI/CD GitHub Actions` | Sprint 1 - Foundation | Phase 2 | High | 5 | is blocked by ATC-101 | 1. Mọi commit vào `backend/**`, `ai-service/**`, `frontend/**` kích hoạt đúng workflow tương ứng.<br>2. Các checks đều pass xanh trên GitHub Actions. | **DONE** |
| `FE-001` | **ATC-105** | Task | `[FE-001] [ATC-105] Initialize 4-Layer Frontend Architecture & Tokens` | Sprint 1 - Foundation | Phase 2 | High | 5 | None | 1. `paths.js` là SSOT cho toàn bộ URL.<br>2. `DashboardLayout`, `AuthLayout`, `FocusLayout` bọc qua React Router v6 `<Outlet />`.<br>3. `npm run build` pass không lỗi trong < 2 giây. | **DONE** |
| `DOC-001` | **ATC-106** | Task | `[DOC-001] [ATC-106] Formalize System Requirements & SRS Documentation` | Sprint 1 - Foundation | Phase 1 | Medium | 3 | None | 1. SRS và MVP scope matrix được ghi nhận đầy đủ.<br>2. 11 files trong `.agents/rules/` được cập nhật đồng bộ. | **DONE** |

---

### 🟡 SPRINT 2 - AUTH & INGESTION (Tuần 5 – 8)
* **Sprint Goal**: Xây dựng hoàn chỉnh phân hệ Xác thực (JWT stateless), Không gian làm việc đa người dùng (Multi-tenant Workspace), cơ chế Tải tài liệu lên MinIO, và Ingestion Pipeline tự động băm chunk và sinh embedding vào pgvector.
* **Committed Capacity**: 34 SP.

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `BE-001` | **ATC-201** | Story | `[BE-001] [ATC-201] Teacher Registration & Secure BCrypt Password Hashing` | Sprint 2 - Auth & Ingestion | Phase 3 | High | 3 | is blocked by ATC-103, ATC-105 | 1. `POST /api/auth/register` tạo user mới với role `TEACHER`.<br>2. Báo lỗi 400 nếu email đã tồn tại.<br>3. Mật khẩu không bao giờ lưu plain-text trong CSDL. | **DONE** |
| `BE-002` | **ATC-202** | Story | `[BE-002] [ATC-202] Teacher Login & Stateless JWT Token Issuance` | Sprint 2 - Auth & Ingestion | Phase 3 | High | 3 | is blocked by ATC-201 | 1. `POST /api/auth/login` trả về JWT token hợp lệ khi đúng thông tin.<br>2. Trả về 401 Unauthorized nếu sai thông tin hoặc tài khoản bị khóa.<br>3. Frontend tự động chuyển hướng vào `/workspaces` sau khi đăng nhập. | **DONE** |
| `BE-003` | **ATC-203** | Task | `[BE-003] [ATC-203] Spring Security Stateless Filter & Axios Bearer Interceptor` | Sprint 2 - Auth & Ingestion | Phase 3 | High | 5 | is blocked by ATC-202 | 1. Mọi request không có token đến endpoint bảo vệ đều bị chặn (401).<br>2. Frontend Axios client tự động gắn Authorization header.<br>3. Khi token hết hạn, frontend tự động xóa session và đưa về `/login`. | **DONE** |
| `BE-004` | **ATC-204** | Story | `[BE-004] [ATC-204] Teacher Workspace Management & Data Isolation Gate` | Sprint 2 - Auth & Ingestion | Phase 3 | High | 5 | is blocked by ATC-203 | 1. Giáo viên xem danh sách, tạo mới, sửa và xóa workspace của mình.<br>2. Truy cập workspace của giáo viên khác lập tức nhận mã lỗi 403 Forbidden.<br>3. Xóa workspace tự động xóa cascading các dữ liệu liên quan. | **DONE** |
| `BE-005` | **ATC-205** | Story | `[BE-005] [ATC-205] Document Upload to MinIO & Metadata Tracking` | Sprint 2 - Auth & Ingestion | Phase 4 | High | 5 | is blocked by ATC-204 | 1. `POST /api/workspaces/{id}/documents` lưu file an toàn lên MinIO.<br>2. Lưu metadata: `fileName`, `fileSize`, `fileType`, `minioObjectKey`, `status='PENDING'`.<br>3. Validate file types: chỉ chấp nhận `.pdf`, `.docx`, `.txt`. | **DONE** |
| `AI-001` | **ATC-206** | Task | `[AI-001] [ATC-206] Document Parser & Structure-Aware Chunking Pipeline` | Sprint 2 - Auth & Ingestion | Phase 4 | High | 5 | is blocked by ATC-205 | 1. `POST /api/ingestion/process` tải file từ MinIO và parse toàn bộ văn bản.<br>2. Chunk văn bản tôn trọng ngắt đoạn văn và ranh giới câu (512 tokens / 50 overlap).<br>3. Mỗi chunk giữ metadata: `workspace_id`, `document_id`, `source_page`. | **DONE** |
| `AI-002` | **ATC-207** | Task | `[AI-002] [ATC-207] Embedding Generation & pgvector Persistence` | Sprint 2 - Auth & Ingestion | Phase 4 | High | 5 | is blocked by ATC-206 | 1. Sinh vector embeddings 768 chiều thành công qua Provider.<br>2. Chèn toàn bộ chunks vào CSDL bảng `document_chunks` kèm vector column.<br>3. Kiểm tra số lượng vector chunks được chèn và liên kết chính xác với `document_id`. | **DONE** |
| `QA-001` | **ATC-208** | Task | `[QA-001] [ATC-208] Unit & Integration Test Suite for Auth & Ingestion` | Sprint 2 - Auth & Ingestion | Phase 3, 4 | Medium | 3 | is blocked by ATC-203, ATC-207 | 1. Unit test suite chạy thành công không có failure trên CI.<br>2. Kiểm thử thành công các case: email trùng, sai mật khẩu, unauthorized workspace, file vượt quá 50MB. | IN PROGRESS |

---

### 🟠 SPRINT 3 - RAG & LESSON (Tuần 9 – 12)
* **Sprint Goal**: Xây dựng bộ máy RAG Semantic Search với ranh giới an toàn AI (Prompt Boundary `<sources>`), cơ chế Insufficient Evidence, hoàn thiện tính năng Soạn Giáo Án AI theo cấu trúc JSON chuẩn mực, và lưu vết trích dẫn học liệu.
* **Committed Capacity**: 34 SP (0 SP Done, 10 SP In Progress, 24 SP To Do).

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `AI-003` | **ATC-301** | Task | `[AI-003] [ATC-301] AI Provider Abstraction Factory & Multi-Provider Support` | Sprint 3 - RAG & Lesson | Phase 5 | High | 5 | is blocked by ATC-207 | 1. Không còn code import cứng `gemini.py` trong route handlers.<br>2. Chuyển đổi linh hoạt giữa Gemini/OpenAI bằng cấu hình `AI_PROVIDER`.<br>3. Xóa bỏ các file provider bị trùng lặp. | IN PROGRESS |
| `AI-004` | **ATC-302** | Task | `[AI-004] [ATC-302] Vector Similarity Retrieval with Workspace Isolation` | Sprint 3 - RAG & Lesson | Phase 5 | High | 5 | is blocked by ATC-301 | 1. Truy vấn trả về Top-K (5-8) chunks có điểm tương đồng Cosine cao nhất (`cosine_distance`).<br>2. Mọi truy vấn retrieval đều bắt buộc đính kèm bộ lọc `workspace_id`.<br>3. Không rò rỉ dữ liệu giữa các workspace khác nhau. | IN PROGRESS |
| `AI-005` | **ATC-303** | Task | `[AI-005] [ATC-303] Implement Prompt Boundary <sources> & Insufficient Evidence` | Sprint 3 - RAG & Lesson | Phase 5 | High | 5 | is blocked by ATC-302 | 1. Tài liệu nguồn luôn nằm trong thẻ `<sources>...</sources>`.<br>2. Khi không có chunk nào đạt ngưỡng tương đồng, trả về lỗi 422 `INSUFFICIENT_EVIDENCE` thay vì bịa đặt nội dung.<br>3. Chỉ thị rõ ràng cho LLM coi nội dung trích xuất là Dữ Liệu Tham Khảo (Untrusted Data). | TO DO |
| `AI-006` | **ATC-304** | Story | `[AI-006] [ATC-304] AI Lesson Planner Structured Output Generation & Persistence` | Sprint 3 - RAG & Lesson | Phase 5 | High | 8 | is blocked by ATC-303 | 1. Output trả về khớp với JSON Schema `LessonPlanSchema`.<br>2. Lưu giữ đầy đủ mảng `source_chunk_ids` liên kết với tài liệu nguồn.<br>3. Spring Boot mapping kết quả sang typed DTO và lưu bản ghi vào bảng `generated_contents`. | TO DO |
| `BE-006` | **ATC-305** | Story | `[BE-006] [ATC-305] Citation Provenance Resolution & Storage API` | Sprint 3 - RAG & Lesson | Phase 5 | High | 3 | is blocked by ATC-304 | 1. Endpoint `/api/workspaces/{id}/citations/resolve` trả về tên tài liệu, số trang và đoạn văn bản gốc.<br>2. Dữ liệu trích dẫn được lưu vào bảng `content_citations`. | TO DO |
| `BE-007` | **ATC-306** | Story | `[BE-007] [ATC-306] Teacher Inline Review, Manual Edit & Save API` | Sprint 3 - RAG & Lesson | Phase 5 | High | 3 | is blocked by ATC-304 | 1. Giáo viên sửa được tiêu đề, thời lượng, nội dung từng phần hoạt động trên UI.<br>2. `PUT /api/workspaces/{id}/generation/{id}` cập nhật bản ghi trong CSDL.<br>3. Cập nhật `review_status` tương ứng (`DRAFT` → `REVIEWED` → `APPROVED`). | TO DO |
| `BE-008` | **ATC-307** | Story | `[BE-008] [ATC-307] Professional Word (.docx) & PDF Export Engine` | Sprint 3 - RAG & Lesson | Phase 5 | High | 5 | is blocked by ATC-306 | 1. `POST /api/workspaces/{id}/export/{id}?format=DOCX` tải về file Word chuẩn format.<br>2. `POST /api/workspaces/{id}/export/{id}?format=PDF` tải về file PDF chuẩn layout.<br>3. Cuối tài liệu có danh mục nguồn trích dẫn rõ ràng. | TO DO |

---

### 🔵 SPRINT 4 - QUIZ & VERSIONING (Tuần 13 – 16)
* **Sprint Goal**: Hoàn thiện phân hệ Tạo Đề Thi & Câu Hỏi AI (Quiz Generator) tích hợp gắn nhãn Bloom's Taxonomy, cơ chế Sinh Lại theo hướng dẫn (Regeneration with versioning), Cây phả hệ phiên bản (Version Lineage Tree), và bộ sinh Rubric đánh giá (*Should-Have*).
* **Committed Capacity**: 30 SP (22 SP Core Committed + 8 SP Should-Have `ATC-405` | 0 SP Done, 0 SP In Progress, 30 SP To Do).

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `AI-007` | **ATC-401** | Story | `[AI-007] [ATC-401] AI Quiz Generator with Structured Validation & Persistence` | Sprint 4 - Quiz & Versioning | Phase 6 | High | 8 | is blocked by ATC-303, ATC-304 | 1. Sinh đúng số lượng câu hỏi yêu cầu (3 - 20 câu).<br>2. Câu hỏi trắc nghiệm có đủ 4 phương án (A, B, C, D) và chỉ rõ đáp án đúng.<br>3. Lưu vào CSDL `generated_contents` với `content_type = 'QUIZ'`. | TO DO |
| `AI-008` | **ATC-402** | Story | `[AI-008] [ATC-402] Integrated Bloom's Taxonomy Tagging Engine` | Sprint 4 - Quiz & Versioning | Phase 6 | High | 3 | is blocked by ATC-401 | 1. Mỗi câu hỏi trong Quiz đều có trường `bloom_taxonomy_level` hợp lệ (Remember, Understand, Apply, Analyze, Evaluate, Create).<br>2. UI hiển thị Badge màu tương ứng cho từng cấp độ Bloom.<br>3. Hỗ trợ lọc câu hỏi theo ma trận Bloom. | TO DO |
| `BE-009` | **ATC-403** | Story | `[BE-009] [ATC-403] Instruction-Based Content Regeneration with Versioning` | Sprint 4 - Quiz & Versioning | Phase 6 | High | 5 | is blocked by ATC-401, ATC-306 | 1. `POST /api/workspaces/{id}/generation/{id}/regenerate` nhận chỉ dẫn mới.<br>2. Bản ghi mới tạo ra có `version = parent.version + 1` và `parent_id = parent.id`.<br>3. Bản ghi cũ được bảo toàn nguyên vẹn trong lịch sử. | TO DO |
| `BE-010` | **ATC-404** | Story | `[BE-010] [ATC-404] Document History & Version Lineage API` | Sprint 4 - Quiz & Versioning | Phase 6 | Medium | 3 | is blocked by ATC-403 | 1. `GET /api/workspaces/{id}/generation/history` trả về danh sách đầy đủ bài soạn theo workspace.<br>2. `GET /api/workspaces/{id}/generation/{id}` trả về chi tiết từng phiên bản trong chuỗi lineage. | TO DO |
| `AI-009` | **ATC-405** | Story | `[AI-009] [ATC-405] Assessment Rubric Generator (Should-Have Scope)` | Sprint 4 - Quiz & Versioning | Phase 6 | Medium | 8 | is blocked by ATC-304, ATC-401 | 1. Sinh Rubric đánh giá có cấu trúc bảng tiêu chí và trọng số điểm.<br>2. Bám sát mục tiêu bài học và tài liệu nguồn.<br>3. Hỗ trợ xuất Rubric ra bảng Word (.docx). | TO DO |
| `BE-011` | **ATC-406** | Task | `[BE-011] [ATC-406] Export Engine Extension for Quizzes & Answer Keys` | Sprint 4 - Quiz & Versioning | Phase 6 | Medium | 3 | is blocked by ATC-307, ATC-401 | 1. Xuất file Đề kiểm tra học sinh sạch sẽ không lộ đáp án.<br>2. Xuất file Hướng dẫn chấm kèm ma trận Bloom và trích dẫn tài liệu tham khảo. | TO DO |

---

### 🟣 SPRINT 5 - TESTING & OPTIMIZATION (Tuần 17 – 20)
* **Sprint Goal**: Hoàn tất các vòng lặp thực nghiệm đánh giá AI của Phase 6, xây dựng bộ kiểm thử tích hợp tự động toàn hệ thống (End-to-End Integration Tests), thiết lập Benchmark đánh giá chất lượng RAG trên 20–30 mẫu K-12, tối ưu hóa hiệu năng truy xuất.
* **Committed Capacity**: 29 SP.

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `QA-002` | **ATC-501** | Task | `[QA-002] [ATC-501] End-to-End Vertical Slice Integration Test Suite` | Sprint 5 - Testing & Optimization | Phase 7 | High | 8 | is blocked by ATC-307, ATC-404 | 1. Toàn bộ kịch bản chạy tự động bằng MockMvc và Testcontainers (Postgres + MinIO).<br>2. Kiểm thử chạy ổn định trên GitHub Actions gate. | TO DO |
| `AI-010` | **ATC-502** | Task | `[AI-010] [ATC-502] RAG Evaluation Benchmark (20-30 K-12 Test Cases)` | Sprint 5 - Testing & Optimization | Phase 7 | High | 8 | is blocked by ATC-303, ATC-401 | 1. Báo cáo đánh giá chất lượng RAG chi tiết lưu trong `docs/4.Test_Case/`.<br>2. Đo lường và ghi nhận tỷ lệ Groundedness (Target tham chiếu: ≥ 85%).<br>3. Đo lường và ghi nhận Citation Precision (Target tham chiếu: ≥ 90%). | TO DO |
| `DB-002` | **ATC-503** | Task | `[DB-002] [ATC-503] Retrieval & Embedding Latency Optimization` | Sprint 5 - Testing & Optimization | Phase 7 | Medium | 5 | is blocked by ATC-302, ATC-502 | 1. Thời gian truy xuất vector pgvector < 200ms.<br>2. Tổng thời gian sinh giáo án hoàn chỉnh < 15 giây. | TO DO |
| `QA-003` | **ATC-504** | Bug | `[QA-003] [ATC-504] Edge Case Hardening & Malformed File Handling` | Sprint 5 - Testing & Optimization | Phase 7 | High | 3 | is blocked by ATC-206 | 1. Xử lý an toàn file PDF rỗng hoặc không có text layer (chuyển trạng thái `FAILED` kèm lý do).<br>2. Frontend hiển thị Toast thông báo lỗi rõ ràng. | TO DO |
| `QA-004` | **ATC-505** | Task | `[QA-004] [ATC-505] Security Audit & Multi-Tenant Data Leak Verification` | Sprint 5 - Testing & Optimization | Phase 7 | High | 5 | is blocked by ATC-204, ATC-303 | 1. Các kịch bản truy cập trái phép khác workspace đều trả về 403 Forbidden.<br>2. Kịch bản Prompt Injection trong file không thể ghi đè system instructions của Copilot. | TO DO |

---

### 🟤 SPRINT 6 - PRODUCTION & HANDOVER (Tuần 21 – 24)
* **Sprint Goal**: Hoàn thiện cấu hình triển khai Production qua Docker Compose đa tầng (Nginx Reverse Proxy, SSL, Spring Boot, FastAPI, Postgres, MinIO), xây dựng quy trình sao lưu CSDL tự động, hoàn tất toàn bộ tài liệu nghiệm thu và kịch bản demo.
* **Committed Capacity**: 28 SP.

| Group ID | Master Task ID | Issue Type | Summary | Sprint | Phase | Priority | Story Points | Dependencies | Acceptance Criteria | Status |
|:---:|:---:|:---:|---|---|:---:|:---:|:---:|---|---|:---:|
| `OPS-003` | **ATC-601** | Task | `[OPS-003] [ATC-601] Production Multi-Container Docker Compose Setup` | Sprint 6 - Production & Handover | Phase 8 | High | 8 | is blocked by ATC-501 | 1. Toàn bộ 5 services khởi chạy đồng bộ với mạng nội bộ `atc-network`.<br>2. Cổng của FastAPI và PostgreSQL không bị lộ ra ngoài Internet.<br>3. Mọi truy cập đi qua cổng 80/443 của Nginx. | TO DO |
| `OPS-004` | **ATC-602** | Task | `[OPS-004] [ATC-602] Nginx Reverse Proxy, CORS & Security Headers` | Sprint 6 - Production & Handover | Phase 8 | High | 5 | is blocked by ATC-601 | 1. Nginx định tuyến chính xác request API và Frontend SPA routes.<br>2. Không có lỗi CORS trên môi trường Production.<br>3. Điểm bảo mật HTTP headers đạt chuẩn A. | TO DO |
| `OPS-005` | **ATC-603** | Task | `[OPS-005] [ATC-603] Database Backup & Disaster Recovery Automation` | Sprint 6 - Production & Handover | Phase 8 | Medium | 5 | is blocked by ATC-601 | 1. Script backup xuất ra file `.sql.gz` có thể restore thành công trên môi trường trắng.<br>2. Tài liệu Runbook hướng dẫn khôi phục dữ liệu chi tiết trong `docs/3.Database/`. | TO DO |
| `DOC-002` | **ATC-604** | Task | `[DOC-002] [ATC-604] Comprehensive System Documentation & API Cheat-Sheet` | Sprint 6 - Production & Handover | Phase 8 | High | 5 | is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505 | 1. Đầy đủ tài liệu Kiến trúc, ERD, API Specs, Test Cases và Hướng dẫn sử dụng.<br>2. `README.md` có hướng dẫn chạy 1-click cho người đánh giá. | TO DO |
| `QA-005` | **ATC-605** | Task | `[QA-005] [ATC-605] Final System Acceptance Testing & Demo Walkthrough` | Sprint 6 - Production & Handover | Phase 8 | High | 5 | is blocked by ATC-601, ATC-604 | 1. 11 tính năng chính của MVP hoàn thành đúng tiêu chí nghiệm thu.<br>2. Kịch bản demo chạy thông suốt: Upload → RAG → Soạn giáo án → Tạo Quiz → Trích dẫn → Xuất Word/PDF. | TO DO |

---

## 5. PHÂN TÍCH CRITICAL PATH & CÁC DEPENDENCY THEN CHỐT

```text
[ATC-102: Postgres & MinIO] ──> [ATC-103: DB Migrations]
                                       │
                                       ▼
                              [ATC-201: Auth Register] ──> [ATC-202: Login JWT]
                                                                  │
                                                                  ▼
                                                      [ATC-203: Security Filter]
                                                                  │
                                                                  ▼
                                                      [ATC-204: Workspace Isolation]
                                                                  │
                                                                  ▼
                                                      [ATC-205: MinIO File Upload]
                                                                  │
                                                                  ▼
                                                      [ATC-206: Parsing & Chunking]
                                                                  │
                                                                  ▼
                                                      [ATC-207: Embedding & pgvector]
                                                                  │
                                                                  ▼
                                                      [ATC-302: Vector Retrieval]
                                                                  │
                                                                  ▼
                                                      [ATC-303: Prompt Boundary <sources>]
                                                                  │
                                                                  ▼
                                                      [ATC-304: AI Lesson Planner]
                                                                  │
                                                                  ▼
                                                      [ATC-401: Quiz Generator]
                                                                  │
                                                                  ▼
                                                      [ATC-501: E2E Integration Tests]
                                                                  │
                                                                  ▼
                                                      [ATC-601: Production Deployment]
```

> **Lưu ý phụ thuộc**: `ATC-401` phụ thuộc đồng thời vào cả `ATC-303` (Prompt Boundary) và `ATC-304` (Lesson Planner Pipeline).

### ⚠️ 3 Điểm nghẽn có rủi ro cao nhất:
1. **`ATC-207` (Embedding & pgvector Ingestion)**: Nếu băm chunk hoặc embedding bị lỗi, toàn bộ RAG ở Sprint 3 sẽ không có dữ liệu để chạy.
2. **`ATC-303` (Prompt Boundary & Insufficient Evidence)**: Phải kiểm soát chặt ranh giới prompt để AI không bị ảo giác hoặc trả về sai cấu trúc JSON.
3. **`ATC-304` (Lesson Planner Pipeline)**: Là nền tảng kiến trúc để mở rộng sang Quiz Generator (`ATC-401`) và Rubric Generator (`ATC-405`).

---

## 6. PHÂN ĐỊNH PHẠM VI (SCOPE PRIORITIZATION)

| Phân Loại | Tính Năng / Thành Phần | Cam Kết & Xử Lý Khi Thiếu Thời Gian |
|---|---|---|
| **🔴 MUST HAVE (Bắt buộc 100%)** | • Authentication & User Management<br>• Teacher Workspace & Data Isolation<br>• Document Upload & Knowledge Base (MinIO + pgvector)<br>• RAG Vector Retrieval Baseline<br>• AI Lesson Planner (Structured Output + Citations)<br>• Quiz Generator (MCQ + Short Answer + Bloom Taxonomy)<br>• Review, Inline Edit, Regeneration (`version++`) & History<br>• Word (.docx) & PDF Export | **BẮT BUỘC HOÀN THÀNH**. Đây là xương sống của đồ án/sản phẩm MVP. |
| **🟡 SHOULD HAVE (Nên có)** | • Assessment Rubric Generator (`ATC-405`)<br>• Chế độ xuất đề thi tách biệt đáp án cho học sinh (`ATC-406`) | **Ưu tiên triển khai trong Sprint 4**. Nếu thiếu thời gian, tinh giản UI nhưng giữ nguyên xuất file Word. |
| **🟢 STRETCH / OUT OF SCOPE** | • Slide Outline Generator (Chỉ làm nếu còn thừa thời gian ở Sprint 5)<br>• Standalone Bloom question generator (Đã tích hợp trọn vẹn vào Quiz)<br>• Dữ liệu học sinh / Student PII (**Nghiêm cấm tuyệt đối**) | **KHÔNG CAM KẾT**. Không được đưa vào Sprint Backlog chính thức để tránh gây loãng nguồn lực. |

---

## 7. BẢNG ĐỐI SOÁT SẴN SÀNG NHẬP VÀO JIRA (JIRA IMPORT READINESS)

| Tiêu Chí Đánh Giá | Kết Quả Đối Soát | Chi Tiết |
|---|:---:|---|
| **Không có task trùng lặp / dư thừa** | ✅ Đạt | Toàn bộ 37 tasks đều đại diện cho một deliverable kỹ thuật/nghiệp vụ cụ thể. |
| **Định dạng Issue Type chuẩn Jira** | ✅ Đạt | Phân biệt rành mạch giữa `Story`, `Task` và `Bug`. |
| **Khối lượng Story Points cân bằng** | ✅ Đạt | Committed SP dao động từ **23 – 34 SP/Sprint**, hoàn toàn phù hợp với năng lực thực thi của 1 lập trình viên. |
| **Dependencies & Thứ tự logic** | ✅ Đạt | 100% dependencies đã được khai báo đối với các task có phụ thuộc (`is blocked by`); các foundation task không có dependency được ghi nhận là `None`. |
| **Sprint Mapping nhất quán** | ✅ Đạt | Thể hiện sự chuyển tiếp tự nhiên giữa 8 Phase roadmap và 6 Sprints cố định. |
| **Đối soát 1:1 với Jira Issue** | ✅ Đạt | Master Task ID và Group Task ID được tích hợp trực tiếp trong trường Summary, sẵn sàng để import qua CSV hoặc tạo thủ công. |
