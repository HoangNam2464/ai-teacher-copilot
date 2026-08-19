# Bảng Theo Dõi Tiến Độ Sprint & Trạng Thái Nhánh Git (Progress Tracker)

> **Mục đích**: Bảng checklist trực quan theo dõi tiến độ hoàn thành của từng Phase/Sprint và trạng thái merge PR vào nhánh `develop`.
> **Cập nhật gần nhất**: 2026-08-19

---

## 1. TỔNG QUAN LỘ TRÌNH 8 GIAI ĐOẠN (24 TUẦN)

- **Phase 1 (Tuần 1-2)**: Khám phá & Yêu cầu `[Hoàn thành]`
- **Phase 2 (Tuần 3-4)**: Kiến trúc & Thiết kế Hệ thống `[Hoàn thành]`
- **Phase 3 (Tuần 5-7)**: Foundation, Auth & Workspace `[Đang triển khai]`
- **Phase 4 (Tuần 8-10)**: Document Knowledge Base & Ingestion Pipeline `[Chờ]`
- **Phase 5 (Tuần 11-14)**: RAG Engine & AI Lesson Planner `[Chờ]`
- **Phase 6 (Tuần 15-19)**: Quiz Generator & Content Expansion `[Chờ]`
- **Phase 7 (Tuần 20-22)**: Testing, Hardening & Evaluation `[Chờ]`
- **Phase 8 (Tuần 23-24)**: Triển khai VPS/Cloud & Bàn giao `[Chờ]`

---

## 2. CHECKLIST CHI TIẾT THEO TỪNG GIAI ĐOẠN

### 🟢 Giai Đoạn 1 & 2: Yêu Cầu, Kiến Trúc & Nền Tảng Khung (Tuần 1 – 4)
- [x] Phân tích nghiệp vụ K-12 & định hình phạm vi MVP 6 tháng (`docs/Project_Detail/`)
- [x] Thiết kế kiến trúc 3 lớp: React Frontend + Spring Boot Backend + FastAPI AI Service
- [x] Thiết lập hạ tầng Docker Compose (PostgreSQL 16 + pgvector, MinIO)
- [x] Thiết lập Database Schema & Flyway Migrations (V1, V2 vector dimension 768)
- [x] Thiết lập hệ thống CI/CD GitHub Actions (4 workflows: backend, ai-service, frontend, gate)
- [x] Di chuyển `ai-service/` ra cùng cấp root level với `backend/` và `frontend/`
- [x] Chuẩn hóa 11 file rules kiến trúc trong `.agents/rules/`
- [x] Chuẩn hóa đặc tả kiến trúc Frontend trong `docs/Development_and_Data/FRONTEND_ARCHITECTURE.md`
- [x] Chuẩn hóa Master Backlog trong `docs/Agile_Management/8.Product_Backlog/ATC-MASTER-TASKS.md`

---

### 🟡 Giai Đoạn 3: Nền Tảng, Auth & Workspace (Tuần 5 – 7)

#### [ATC-AUTH] Authentication & Spring Security
- [ ] Tạo nhánh `feature/authentication` từ `develop`
- [ ] Backend: Cấu hình `SecurityConfig`, `JwtTokenProvider`, `JwtAuthenticationFilter`
- [ ] Backend: Triển khai `AuthService.register()` với BCrypt password encoder
- [ ] Backend: Triển khai `AuthService.login()` trả về JWT token
- [ ] Frontend: Xây dựng `features/auth/` (LoginForm, RegisterForm, LoginPage)
- [ ] Frontend: Tích hợp `authStore` (Zustand) và Axios Bearer interceptor
- [ ] Kiểm thử: Unit test Spring Boot H2 in-memory pass trên CI (`backend-ci.yml`)
- [ ] Tạo PR `feature/authentication` → `develop` & Merge

#### [ATC-WS] Teacher Workspace
- [ ] Tạo nhánh `feature/workspace` từ `develop`
- [ ] Backend: Triển khai `WorkspaceController`, `WorkspaceService` (CRUD workspace)
- [ ] Backend: Phân quyền nghiêm ngặt `findAndAuthorize()` chống truy cập chéo
- [ ] Frontend: Xây dựng `features/workspace/` (WorkspaceSelector, WorkspaceModal)
- [ ] Frontend: Quản lý active workspace trong `workspaceStore`
- [ ] Kiểm thử: Test bảo mật phân lập workspace (403 Forbidden)
- [ ] Tạo PR `feature/workspace` → `develop` & Merge

---

### ⚪ Giai Đoạn 4: Document Knowledge Base & Ingestion (Tuần 8 – 10)

#### [ATC-DOC] Document Upload & MinIO Storage
- [ ] Tạo nhánh `feature/document-upload` từ `develop`
- [ ] Backend: Cấu hình `MinioClient`, validate định dạng (PDF/DOCX) và kích thước (<50MB)
- [ ] Backend: Upload MinIO, lưu metadata bảng `documents` với trạng thái `PENDING`
- [ ] Backend: Bắn request async sang FastAPI `POST /ingestion/process`
- [ ] Frontend: Xây dựng `features/documents/` (DocumentUploader kéo thả, DocumentTable)
- [ ] Tạo PR `feature/document-upload` → `develop` & Merge

#### [ATC-PROC] Document Processing (FastAPI Ingestion)
- [ ] Tạo nhánh `feature/document-processing` từ `develop`
- [ ] AI Service: Parse PDF (`pypdf`) và DOCX (`python-docx`) trích xuất text và số trang
- [ ] AI Service: Structure-aware chunking (max 512 tokens, 50 tokens overlap)
- [ ] AI Service: Sinh vector embedding 768-dim qua provider abstraction (`providers/base.py`)
- [ ] AI Service: Lưu vector vào `document_chunks` (pgvector HNSW)
- [ ] AI Service: Cập nhật trạng thái `PROCESSING` → `READY` hoặc `FAILED`
- [ ] Tạo PR `feature/document-processing` → `develop` & Merge

---

### ⚪ Giai Đoạn 5: RAG Engine & AI Lesson Planner (Tuần 11 – 14)

#### [ATC-RAG] RAG Retrieval Baseline
- [ ] Tạo nhánh `feature/rag-retrieval` từ `develop`
- [ ] AI Service: Embed câu truy vấn (768-dim)
- [ ] AI Service: Truy vấn vector cosine similarity (`<=>`) kèm lọc `workspace_id`
- [ ] AI Service: Trả về top-k chunks hoặc cờ `insufficient_evidence: true`
- [ ] Tạo PR `feature/rag-retrieval` → `develop` & Merge

#### [ATC-PLAN] AI Lesson Planner (Vertical Slice)
- [ ] Tạo nhánh `feature/lesson-planner` từ `develop`
- [ ] AI Service: Prompt template với ranh giới `<sources>...</sources>`
- [ ] AI Service: Structured output validation qua Pydantic `LessonPlanSchema`
- [ ] Backend: Endpoint `POST /generation/lesson-plan`, lưu vào `generated_contents`
- [ ] Frontend: Giao diện `features/lesson-planner/` (LessonPlanForm, LessonSectionCard)
- [ ] Tích hợp Citation: Hiển thị huy hiệu trích dẫn và drawer xem nguồn gốc
- [ ] Tích hợp Export: Nút xuất giáo án sang Word/PDF
- [ ] Tạo PR `feature/lesson-planner` → `develop` & Merge

---

### ⚪ Giai Đoạn 6: Content Generation Mở Rộng (Tuần 15 – 19)

#### [ATC-QUIZ] Quiz Generator (Bloom Taxonomy Tagging)
- [ ] Tạo nhánh `feature/quiz-generator` từ `develop`
- [ ] AI Service: Pydantic `QuizSchema`, `QuizQuestion` (MCQ + Short Answer)
- [ ] AI Service: Gắn nhãn Bloom Taxonomy và citation per question
- [ ] Backend: Endpoint `POST /generation/quiz`
- [ ] Frontend: Giao diện `features/quiz-generator/` (QuizConfigForm, MCQQuestionCard)
- [ ] Tích hợp Export: Xuất đề thi và bảng đáp án sang Word/PDF
- [ ] Tạo PR `feature/quiz-generator` → `develop` & Merge

#### [ATC-REV] Review, Inline Edit & Document History
- [ ] Tạo nhánh `feature/review-edit` từ `develop`
- [ ] Backend: Cập nhật sửa tay `PUT /generation/{id}` (không tốn LLM call)
- [ ] Backend: Tạo lại theo chỉ dẫn `POST /generation/{id}/regenerate` (tạo version mới)
- [ ] Frontend: Chế độ inline edit và component `VersionLineageTree` trong `features/history/`
- [ ] Tạo PR `feature/review-edit` → `develop` & Merge

---

### ⚪ Giai Đoạn 7 & 8: Testing, Đánh Giá & Triển Khai (Tuần 20 – 24)
- [ ] [ATC-EVAL] Thực hiện đánh giá RAG quality checklist trên 20–30 mẫu tài liệu
- [ ] Đóng gói Docker Compose toàn hệ thống chạy trên VPS/Cloud
- [ ] Kiểm tra toàn diện trên nhánh `develop` → Tạo PR merge vào `main`
- [ ] Release v1.0.0 bàn giao đồ án
