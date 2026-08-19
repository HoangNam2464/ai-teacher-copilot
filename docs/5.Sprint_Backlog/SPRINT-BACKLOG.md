# AI Teacher Copilot — Sprint Backlog & Kế Hoạch Thực Thi 6 Sprints (Jira Ready)

> **Tài liệu chuẩn quản trị thực thi dự án theo mô hình Solo Developer**  
> **Khung quản trị**: Agile Methodology + Scrum-Based Project Management (6 Sprints × 4 tuần / 24 tuần tổng thể)  
> **Đối tượng sử dụng**: Jira Software Backlog, Theo dõi tiến độ & Báo cáo Milestone  
> **Cập nhật chính thức**: 2026-08-19  

---

## 1. CHIẾN LƯỢC PHÂN BỔ SPRINT (SPRINT STRATEGY)

Việc chia 24 tuần thành **6 Sprints cố định (4 tuần/Sprint)** giúp tối ưu hóa luồng phát triển của Solo Developer theo quy luật **Vertical Slice**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         LỘ TRÌNH 6 SPRINT CHO AI TEACHER COPILOT (24 TUẦN)                     │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
  Sprint 1 (Tuần 1–4)   : Foundation, Monorepo Architecture, CI/CD & Design System (Phase 1 + 2)
  Sprint 2 (Tuần 5–8)   : Auth, Workspace, Document Upload & Vector Ingestion (Phase 3 + 4)
  Sprint 3 (Tuần 9–12)  : RAG Retrieval Engine, Prompt Safety & AI Lesson Planner (Phase 5)
  Sprint 4 (Tuần 13–16) : Quiz Generator with Bloom Taxonomy, Version Lineage & Rubric (Phase 6)
  Sprint 5 (Tuần 17–20) : Automated Integration Tests, RAG Quality Evaluation & Hardening (Phase 7)
  Sprint 6 (Tuần 21–24) : Production Docker Deployment, Security Hardening & Handover (Phase 8)
```

### Rationale đằng sau việc phân bổ:
1. **Sprint 1 (Nền tảng & Khung kiến trúc)**: Hoàn tất toàn bộ yêu cầu, thiết kế CSDL, CI/CD 4 luồng, và khung Frontend 4 tầng. Đảm bảo codebase có thể compile, build, test sạch sẽ trước khi viết code nghiệp vụ.
2. **Sprint 2 (Nạp dữ liệu & Không gian)**: Hoàn thành lát cắt bảo mật và dữ liệu: Đăng nhập → Tạo không gian → Nạp file MinIO → Parser/Chunking 512 tokens → Embedding pgvector. Sau Sprint 2, hệ thống đã có kho tri thức sẵn sàng cho AI.
3. **Sprint 3 (Trọng tâm RAG & Soạn giáo án)**: Đây là giai đoạn rủi ro kỹ thuật cao nhất. Dành trọn vẹn 4 tuần để xử lý: Chuẩn hóa Provider Factory, ranh giới prompt `<sources>...</sources>`, xử lý `insufficient_evidence`, sinh giáo án có cấu trúc JSON, lưu vết trích dẫn và xuất file Word/PDF.
4. **Sprint 4 (Mở rộng nội dung & Đề thi)**: Tái sử dụng pipeline RAG từ Sprint 3 để xây dựng Quiz Generator (MCQ + Tự luận ngắn gắn nhãn Bloom), cơ chế tạo lại bài soạn (`version++`), cây lịch sử bài giảng, và tính năng Rubric (*Should-Have*).
5. **Sprint 5 (Kiểm thử tự động & Đánh giá RAG)**: Không dồn việc kiểm thử vào cuối. Sprint 5 tập trung đo lường 20–30 mẫu benchmark K-12 về Groundedness, Citation Coverage, viết full Integration Tests giữa Spring Boot ↔ FastAPI ↔ PostgreSQL.
6. **Sprint 6 (Triển khai & Bàn giao)**: Đóng gói Docker Compose production (Nginx SSL, Postgres pgvector, MinIO, Spring Boot, FastAPI), cấu hình backup dữ liệu, viết tài liệu bàn giao và chuẩn bị kịch bản demo.

---

## 2. CHI TIẾT 6 SPRINT BACKLOG CHO JIRA

---

### 🟢 SPRINT 1: ARCHITECTURE FOUNDATION, CI/CD & DESIGN SYSTEM
* **Sprint Goal**: Thiết lập hoàn chỉnh kiến trúc Monorepo 3 tầng, cấu hình hạ tầng Docker dev, hệ thống CI/CD 4 workflows, CSDL Flyway migration chuẩn hóa, và khung Frontend 4 tầng có thể build sạch.
* **Expected Increment**: Bộ khung dự án sẵn sàng thực thi, CI/CD tự động kiểm thử mỗi PR, Docker Compose chạy Postgres + pgvector + MinIO ổn định, Frontend hiển thị Master Layout và Routing Dictionary.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-101** | Technical Task | Standardize Monorepo Layout & Move AI-Service to Root | Chuyển `backend/ai-service` ra root level `ai-service/`, cập nhật toàn bộ import paths và script khởi chạy. | 1. `ai-service/` nằm độc lập ở thư mục gốc.<br>2. `docker-compose.yml` và script dev nhận diện đúng đường dẫn.<br>3. Không còn file mồ côi trong `backend/`. | High | 3 | None | Phase 2 | Infrastructure |
| **ATC-102** | Technical Task | Setup Docker Compose Dev Infrastructure | Cấu hình PostgreSQL 16 với pgvector extension, MinIO S3 storage, và container tự động tạo bucket (`documents`, `exports`). | 1. `docker compose up -d` khởi chạy `atc-postgres`, `atc-minio`, `atc-minio-init`.<br>2. Healthcheck của Postgres và MinIO đều pass.<br>3. Extension `vector` và `uuid-ossp` được khởi tạo thành công. | High | 5 | None | Phase 2 | Infrastructure |
| **ATC-103** | Technical Task | Setup Flyway Database Migrations & UUID Standardization | Chuẩn hóa `V1__init_schema.sql` (bảng `users`, `workspaces`, `documents`, `document_chunks`, `generated_contents`, `content_citations`) và `V2` (vector dimension 768). Đảm bảo chạy mượt trên cả Postgres và H2 test. | 1. `mvnw test` với profile `test` (H2) chạy thành công 100%.<br>2. Flyway tự động migrate đúng 6 bảng trên PostgreSQL thực tế.<br>3. Bảng `document_chunks` có HNSW index. | High | 5 | ATC-102 | Phase 2 | Core Architecture |
| **ATC-104** | Technical Task | Implement Multi-Service CI/CD GitHub Actions | Thiết lập 4 workflows: `backend-ci.yml` (Maven + H2), `ai-service-ci.yml` (Pytest + pgvector container), `frontend-ci.yml` (Node + Vite), `ci.yml` (Full integration gate khi PR vào main). | 1. Mọi commit vào `backend/**`, `ai-service/**`, `frontend/**` kích hoạt đúng workflow tương ứng.<br>2. 100% checks pass xanh trên GitHub Actions. | High | 5 | ATC-101 | Phase 2 | DevOps & CI/CD |
| **ATC-105** | Technical Task | Initialize 4-Layer Frontend Architecture & Tokens | Xây dựng cấu trúc `app/` (routes, paths), `core/` (primitives, layouts, client, store, utils), `features/`, `styles/` (CSS design tokens). | 1. `paths.js` là SSOT cho toàn bộ URL.<br>2. `DashboardLayout`, `AuthLayout`, `FocusLayout` bọc qua React Router v6 `<Outlet />`.<br>3. `npm run build` pass không lỗi trong < 2 giây. | High | 5 | None | Phase 2 | Frontend Client |
| **ATC-106** | Task | Formalize System Requirements & SRS Documentation | Hoàn thiện tài liệu đặc tả chức năng, ranh giới MVP 6 tháng, ma trận yêu cầu phi chức năng và từ điển dữ liệu vào `docs/`. | 1. SRS và MVP scope matrix được ghi nhận đầy đủ.<br>2. 11 files trong `.agents/rules/` được cập nhật đồng bộ. | Medium | 3 | None | Phase 1 | Requirements |

---

### 🟡 SPRINT 2: AUTHENTICATION, WORKSPACE & DOCUMENT INGESTION
* **Sprint Goal**: Xây dựng hoàn chỉnh phân hệ Xác thực (JWT stateless), Không gian làm việc đa người dùng (Multi-tenant Workspace), cơ chế Tải tài liệu lên MinIO, và Ingestion Pipeline tự động băm chunk và sinh embedding vào pgvector.
* **Expected Increment**: Giáo viên đăng ký/đăng nhập qua UI React, tạo/quản lý workspace riêng biệt, tải file PDF/DOCX lên MinIO và hệ thống tự động băm nhỏ tài liệu lưu vector 768 chiều vào pgvector.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-201** | Story | Teacher Registration & Secure BCrypt Password Hashing | Xây dựng API và UI cho phép giáo viên đăng ký tài khoản mới; mã hóa mật khẩu bằng BCrypt, kiểm tra trùng lặp email. | 1. `POST /api/auth/register` tạo user mới với role `TEACHER`.<br>2. Báo lỗi 400 nếu email đã tồn tại.<br>3. Mật khẩu không bao giờ lưu plain-text trong CSDL. | High | 5 | ATC-103, ATC-105 | Phase 3 | Authentication |
| **ATC-202** | Story | Teacher Login & Stateless JWT Token Issuance | Xây dựng API đăng nhập, sinh JWT token (claims: `userId`, `email`), lưu token vào `authStore` (Zustand) và localStorage. | 1. `POST /api/auth/login` trả về JWT token hợp lệ khi đúng thông tin.<br>2. Trả về 401 Unauthorized nếu sai thông tin hoặc tài khoản bị khóa.<br>3. Frontend tự động chuyển hướng vào `/workspaces` sau khi đăng nhập. | High | 5 | ATC-201 | Phase 3 | Authentication |
| **ATC-203** | Technical Task | Spring Security Stateless Filter & Axios Bearer Interceptor | Cấu hình `SecurityConfig`, `JwtAuthenticationFilter` trên Spring Boot và Axios Request/Response Interceptor trên React để tự động đính kèm `Bearer <token>` và bắt lỗi 401. | 1. Mọi request không có token đến endpoint bảo vệ đều bị chặn (401).<br>2. Frontend Axios client tự động gắn Authorization header.<br>3. Khi token hết hạn, frontend tự động xóa session và đưa về `/login`. | High | 5 | ATC-202 | Phase 3 | Authentication |
| **ATC-204** | Story | Teacher Workspace Management & Data Isolation Gate | Xây dựng CRUD Workspace cho giáo viên (`/api/workspaces`), phân lập dữ liệu theo `owner_id`, triển khai bảo mật `findAndAuthorize(workspaceId, userId)`. | 1. Giáo viên xem danh sách, tạo mới, sửa và xóa workspace của mình.<br>2. Truy cập workspace của giáo viên khác lập tức nhận mã lỗi 403 Forbidden.<br>3. Xóa workspace tự động xóa cascading các dữ liệu liên quan. | High | 5 | ATC-203 | Phase 3 | Teacher Workspace |
| **ATC-205** | Story | Document Upload to MinIO & Metadata Tracking | Xây dựng API và giao diện Drag & Drop cho phép giáo viên upload file PDF, DOCX, TXT (tối đa 50MB) vào MinIO bucket `documents`, lưu metadata tại Spring Boot. | 1. `POST /api/workspaces/{id}/documents/upload` lưu file an toàn lên MinIO.<br>2. Lưu metadata: `fileName`, `fileSize`, `fileType`, `minioObjectKey`, `status='PENDING'`.<br>3. Validate file types: chỉ chấp nhận `.pdf`, `.docx`, `.txt`. | High | 8 | ATC-204 | Phase 4 | Document Management |
| **ATC-206** | Technical Task | Document Parser & Structure-Aware Chunking Pipeline | Xây dựng Ingestion Service trong FastAPI sử dụng PyMuPDF cho PDF và python-docx cho DOCX. Băm nhỏ văn bản thành các chunk 512 tokens (overlap 50 tokens) kèm vị trí trang (`source_page`). | 1. `POST /api/ingestion/process` tải file từ MinIO và parse toàn bộ văn bản.<br>2. Chunk văn bản tôn trọng ngắt đoạn văn và ranh giới câu.<br>3. Mỗi chunk giữ metadata: `workspace_id`, `document_id`, `source_page`. | High | 8 | ATC-205 | Phase 4 | Ingestion & Vectors |
| **ATC-207** | Technical Task | Embedding Generation & pgvector Persistence | Tích hợp provider sinh vector embeddings 768 chiều cho toàn bộ chunk, lưu vào bảng `document_chunks` trên PostgreSQL, cập nhật trạng thái document thành `READY`. | 1. Sinh vector embeddings thành công qua Provider.<br>2. Chèn toàn bộ chunks vào CSDL kèm vector column.<br>3. Cập nhật `documents.processing_status = 'READY'` và `chunk_count`. | High | 8 | ATC-206 | Phase 4 | Ingestion & Vectors |
| **ATC-208** | Technical Task | Unit & Integration Test Suite for Auth & Ingestion | Viết unit tests cho `AuthService`, `WorkspaceService` trên Spring Boot (H2) và pytest test ingestion pipeline trên `ai-service`. | 1. 100% unit tests pass trên CI.<br>2. Kiểm thử thành công các case: email trùng, sai mật khẩu, unauthorized workspace, file vượt quá 50MB. | Medium | 5 | ATC-203, ATC-207 | Phase 3, 4 | Quality & Testing |

---

### 🟠 SPRINT 3: RAG ENGINE, AI SAFETY & AI LESSON PLANNER
* **Sprint Goal**: Xây dựng bộ máy RAG Semantic Search với ranh giới an toàn AI (Prompt Boundary `<sources>`), cơ chế Insufficient Evidence, hoàn thiện tính năng Soạn Giáo Án AI theo cấu trúc JSON chuẩn mực, và lưu vết trích dẫn học liệu.
* **Expected Increment**: Giáo viên nhập yêu cầu bài dạy, hệ thống truy xuất đúng đoạn văn từ tài liệu nguồn, AI sinh giáo án chi tiết có cấu trúc chuẩn, giáo viên xem được nguồn trích dẫn học liệu, chỉnh sửa trực tiếp và xuất file Word/PDF.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-301** | Technical Task | AI Provider Abstraction Factory & Multi-Provider Support | Hoàn thiện Factory `get_ai_provider()` kế thừa `BaseAIProvider` trong `ai-service/app/providers/`, chuẩn hóa hỗ trợ Gemini Provider và OpenAI Provider qua biến môi trường. | 1. Không còn code import cứng `gemini.py` trong route handlers.<br>2. Chuyển đổi linh hoạt giữa Gemini/OpenAI bằng cấu hình `AI_PROVIDER`.<br>3. Xóa bỏ các file provider bị trùng lặp. | High | 5 | ATC-207 | Phase 5 | RAG & AI Core |
| **ATC-302** | Technical Task | Vector Similarity Retrieval with Workspace Isolation | Xây dựng Service truy xuất vector trong `ai-service` sử dụng Cosine Similarity search trên pgvector, bắt buộc lọc theo `workspace_id` và hỗ trợ lọc theo môn/khối. | 1. Truy vấn trả về Top-K (5-8) chunks có điểm tương đồng cao nhất.<br>2. 100% câu truy vấn có mệnh đề `WHERE workspace_id = :wsId`.<br>3. Không bao giờ rò rỉ dữ liệu giữa các workspace khác nhau. | High | 5 | ATC-301 | Phase 5 | RAG & AI Core |
| **ATC-303** | Technical Task | Implement Prompt Boundary `<sources>` & Insufficient Evidence | Thiết lập cơ chế bao bọc untrusted context vào `<sources>...</sources>`, chèn chỉ thị bảo mật chống Prompt Injection, và trả về `insufficient_evidence: true` khi không tìm thấy tài liệu phù hợp. | 1. Tài liệu nguồn luôn nằm trong thẻ `<sources>...</sources>`.<br>2. Khi không có chunk nào đạt ngưỡng tương đồng, trả về lỗi 422 `INSUFFICIENT_EVIDENCE` thay vì bịa đặt nội dung.<br>3. Chỉ thị rõ ràng cho LLM coi nội dung trích xuất là Dữ Liệu Tham Khảo (Untrusted Data). | High | 8 | ATC-302 | Phase 5 | AI Safety & Governance |
| **ATC-304** | Story | AI Lesson Planner Structured Output Generation | Xây dựng pipeline sinh kế hoạch bài dạy chuẩn hóa qua Pydantic schema `LessonPlanSchema` (gồm: tiêu đề, thời lượng, mục tiêu, tiến trình hoạt động, `source_chunk_ids`). | 1. Output trả về khớp 100% với JSON Schema đã định nghĩa.<br>2. Lưu giữ đầy đủ mảng `source_chunk_ids` liên kết với tài liệu nguồn.<br>3. Spring Boot mapping kết quả sang typed DTO `LessonPlanResponseDto` và lưu vào `generated_contents`. | High | 8 | ATC-303 | Phase 5 | AI Lesson Planner |
| **ATC-305** | Story | Citation Provenance & Source Drawer UI | Xây dựng API phân giải trích dẫn `/api/workspaces/{id}/citations/resolve` và giao diện `CitationBadge`, `CitationDrawer` cho phép giáo viên xem đoạn trích và số trang gốc. | 1. Click vào Badge trích dẫn mở ngăn kéo hiển thị tên tài liệu, số trang và đoạn văn bản gốc.<br>2. Dữ liệu trích dẫn được lưu vào bảng `content_citations`. | High | 5 | ATC-304 | Phase 5 | Citation & Provenance |
| **ATC-306** | Story | Teacher Inline Review, Manual Edit & Save | Xây dựng giao diện cho phép giáo viên chỉnh sửa trực tiếp nội dung bài soạn AI trên màn hình (không gọi LLM), chuyển đổi trạng thái từ `DRAFT` → `REVIEWED` → `APPROVED`. | 1. Giáo viên sửa được tiêu đề, thời lượng, nội dung từng phần hoạt động.<br>2. `PUT /api/workspaces/{id}/generation/{genId}` cập nhật bản ghi trong CSDL.<br>3. Cập nhật `review_status` tương ứng. | High | 5 | ATC-304 | Phase 5 | Review & History |
| **ATC-307** | Story | Professional Word (.docx) & PDF Export Engine | Xây dựng Export Service phía Spring Boot sử dụng Apache POI để xuất file Word chuẩn định dạng sư phạm và iText/OpenPDF để xuất file PDF, tự động chèn mục "Tài liệu tham khảo". | 1. `POST /api/workspaces/{id}/export/{genId}?format=DOCX` tải về file Word chuẩn format.<br>2. `POST /api/workspaces/{id}/export/{genId}?format=PDF` tải về file PDF chuẩn layout.<br>3. Cuối tài liệu có danh mục nguồn trích dẫn rõ ràng. | High | 8 | ATC-306 | Phase 5 | Document Export |

---

### 🔵 SPRINT 4: QUIZ GENERATOR, BLOOM TAXONOMY & VERSION LINEAGE
* **Sprint Goal**: Hoàn thiện phân hệ Tạo Đề Thi & Câu Hỏi AI (Quiz Generator) tích hợp gắn nhãn Bloom's Taxonomy, cơ chế Sinh Lại theo hướng dẫn (Regeneration with versioning), Cây phả hệ phiên bản (Version Lineage Tree), và bộ sinh Rubric đánh giá (*Should-Have*).
* **Expected Increment**: Giáo viên sinh được đề trắc nghiệm và tự luận ngắn gắn nhãn Bloom bám sát tài liệu, yêu cầu AI tạo lại bài với góp ý mới (`v1 → v2`), theo dõi lịch sử chỉnh sửa và xuất bản đề thi ra file Word/PDF.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-401** | Story | AI Quiz Generator with Structured Validation | Xây dựng pipeline sinh đề thi qua Pydantic schema `QuizSchema` hỗ trợ cả câu hỏi trắc nghiệm (MCQ) và tự luận ngắn, bao gồm đáp án, giải thích chi tiết và `source_chunk_ids`. | 1. Sinh đúng số lượng câu hỏi yêu cầu (3 - 20 câu).<br>2. Câu hỏi trắc nghiệm có đủ 4 phương án (A, B, C, D) và chỉ rõ đáp án đúng.<br>3. Lưu vào CSDL với `content_type = 'QUIZ'`. | High | 8 | ATC-303, ATC-304 | Phase 6 | Quiz Generator |
| **ATC-402** | Story | Integrated Bloom's Taxonomy Tagging Engine | Tích hợp phân loại 6 cấp độ tư duy Bloom (Remember, Understand, Apply, Analyze, Evaluate, Create) vào từng câu hỏi đề thi dựa trên yêu cầu của giáo viên. | 1. Mỗi câu hỏi trong Quiz đều có trường `bloom_taxonomy_level` hợp lệ.<br>2. UI hiển thị Badge màu tương ứng cho từng cấp độ Bloom.<br>3. Hỗ trợ giáo viên lọc/yêu cầu tỷ lệ cấp độ tư duy theo ma trận đề. | High | 5 | ATC-401 | Phase 6 | Quiz Generator |
| **ATC-403** | Story | Instruction-Based Content Regeneration with Versioning | Xây dựng API và modal cho phép giáo viên nhập chỉ dẫn bổ sung để AI sinh lại nội dung; tự động tăng phiên bản (`version++`) và liên kết bản ghi cha (`parent_id`). | 1. `POST /api/workspaces/{id}/generation/{genId}/regenerate` nhận chỉ dẫn mới.<br>2. Bản ghi mới tạo ra có `version = parent.version + 1` và `parent_id = parent.id`.<br>3. Bản ghi cũ được bảo toàn nguyên vẹn trong lịch sử. | High | 8 | ATC-401, ATC-306 | Phase 6 | Review & History |
| **ATC-404** | Story | Document History & Version Lineage Tree UI | Xây dựng trang Lịch sử bài soạn (`features/history/`) hiển thị danh sách toàn bộ giáo án, đề thi đã tạo, cho phép đối chiếu giữa các phiên bản và khôi phục bản cũ. | 1. Bảng lịch sử hiển thị đầy đủ: Tên bài, Loại (Giáo án/Quiz), Phiên bản, Trạng thái duyệt, Thời gian.<br>2. Cho phép xem chi tiết từng phiên bản trong chuỗi lineage. | Medium | 5 | ATC-403 | Phase 6 | Review & History |
| **ATC-405** | Story | Assessment Rubric Generator (Should-Have Scope) | Tái sử dụng pipeline RAG và structured output để sinh ma trận tiêu chí đánh giá (Rubric Generator) dạng bảng nhiều mức độ (Xuất sắc, Đạt, Cần cố gắng). | 1. Sinh Rubric đánh giá có cấu trúc bảng tiêu chí và trọng số điểm.<br>2. Bám sát mục tiêu bài học và tài liệu nguồn.<br>3. Hỗ trợ xuất Rubric ra bảng Word (.docx). | Medium | 8 | ATC-304, ATC-401 | Phase 6 | Content Expansion |
| **ATC-406** | Task | Export Engine Extension for Quizzes & Answer Keys | Mở rộng Export Service để xuất đề thi Word/PDF theo 2 chế độ: Đề bài cho học sinh (không đáp án) và Đáp án/Hướng dẫn chấm cho giáo viên. | 1. Xuất file Đề kiểm tra học sinh sạch sẽ không lộ đáp án.<br>2. Xuất file Hướng dẫn chấm kèm ma trận Bloom và trích dẫn tài liệu tham khảo. | Medium | 5 | ATC-307, ATC-401 | Phase 6 | Document Export |

---

### 🟣 SPRINT 5: AUTOMATED INTEGRATION TESTS, RAG EVALUATION & HARDENING
* **Sprint Goal**: Xây dựng bộ kiểm thử tích hợp tự động toàn hệ thống (End-to-End Integration Tests), thiết lập bộ dữ liệu Benchmark đánh giá chất lượng RAG (20–30 mẫu K-12), tối ưu hóa hiệu năng truy xuất và xử lý triệt để các trường hợp biên.
* **Expected Increment**: Hệ thống đạt độ tin cậy cao, 100% API endpoints có integration test, bộ số liệu đánh giá chất lượng RAG (Groundedness > 85%, Citation Precision > 90%), loại bỏ hoàn toàn hiện tượng crash khi gặp file lỗi.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-501** | Technical Task | End-to-End Vertical Slice Integration Test Suite | Xây dựng test suite tự động kiểm thử toàn bộ luồng: Đăng ký → Tạo workspace → Upload tài liệu → Chờ index → Sinh giáo án → Chỉnh sửa → Xuất Word. | 1. Toàn bộ kịch bản chạy tự động bằng MockMvc và Testcontainers (Postgres + MinIO).<br>2. Kiểm thử chạy ổn định trên GitHub Actions gate. | High | 8 | ATC-307, ATC-404 | Phase 7 | Quality & Testing |
| **ATC-502** | Technical Task | RAG Evaluation Benchmark (20-30 K-12 Test Cases) | Thiết lập bộ 20–30 câu hỏi và tài liệu mẫu chuẩn SGK THCS/THPT; chạy script đo lường tự động các chỉ số: Groundedness, Citation Coverage, Citation Relevance. | 1. Báo cáo đánh giá chất lượng RAG chi tiết lưu trong `docs/4.Test_Case/`.<br>2. Tỷ lệ Groundedness đạt ≥ 85%.<br>3. Tỷ lệ trích dẫn chính xác (Citation Precision) đạt ≥ 90%. | High | 8 | ATC-303, ATC-401 | Phase 7 | AI Evaluation |
| **ATC-503** | Technical Task | Retrieval & Embedding Latency Optimization | Tối ưu hóa câu lệnh truy vấn pgvector (điều chỉnh `hnsw.ef_search`), thêm caching nhẹ cho metadata và giới hạn kích thước context để giảm thời gian phản hồi LLM. | 1. Thời gian truy xuất vector < 200ms.<br>2. Tổng thời gian sinh giáo án hoàn chỉnh < 15 giây. | Medium | 5 | ATC-302, ATC-502 | Phase 7 | Performance & Hardening |
| **ATC-504** | Bug / Task | Edge Case Hardening & Malformed File Handling | Bổ sung cơ chế xử lý file lỗi (PDF quét scan không có text layer, DOCX bị hỏng cấu trúc, file rỗng); trả về thông báo lỗi thân thiện trên UI thay vì để service bị 500. | 1. Xử lý an toàn file PDF rỗng hoặc không có text layer (chuyển trạng thái `FAILED` kèm lý do).<br>2. Frontend hiển thị Toast thông báo lỗi rõ ràng. | High | 5 | ATC-206 | Phase 7 | Performance & Hardening |
| **ATC-505** | Technical Task | Security Audit & Multi-Tenant Data Leak Verification | Kiểm tra đối soát bảo mật phân lập dữ liệu: Thử nghiệm các kịch bản cố tình gọi API với `workspace_id` của tài khoản khác hoặc chèn prompt injection vào file tài liệu. | 1. 100% kịch bản cross-workspace access đều bị chặn 403 Forbidden.<br>2. Kịch bản Prompt Injection trong file không thể ghi đè system instructions của Copilot. | High | 5 | ATC-204, ATC-303 | Phase 7 | AI Safety & Governance |

---

### 🟤 SPRINT 6: PRODUCTION DEPLOYMENT, BACKUP & HANDOVER
* **Sprint Goal**: Hoàn thiện cấu hình triển khai Production qua Docker Compose đa tầng (Nginx Reverse Proxy, SSL, Spring Boot, FastAPI, Postgres, MinIO), xây dựng quy trình sao lưu CSDL tự động, hoàn tất toàn bộ tài liệu nghiệm thu và kịch bản demo.
* **Expected Increment**: Toàn bộ hệ thống chạy mượt mà trên môi trường VPS/Cloud thông qua 1 lệnh `docker compose -f docker-compose.prod.yml up -d`, bộ tài liệu hướng dẫn bàn giao hoàn chỉnh cho Giảng viên/Mentor.

| Key | Type | Summary | Description & Technical Scope | Acceptance Criteria (AC) | Priority | SP | Dependencies | Phase | Epic |
|---|---|---|---|---|:---:|:---:|---|:---:|---|
| **ATC-601** | Technical Task | Production Multi-Container Docker Compose Setup | Xây dựng `docker-compose.prod.yml` hoàn chỉnh đóng gói: Nginx (Reverse Proxy & Static Serve), Spring Boot backend, FastAPI AI Service, PostgreSQL pgvector, và MinIO. | 1. Toàn bộ 5 services khởi chạy đồng bộ với mạng nội bộ `atc-network`.<br>2. Cổng của FastAPI và PostgreSQL không bị lộ ra ngoài Internet.<br>3. Mọi truy cập đi qua cổng 80/443 của Nginx. | High | 8 | ATC-501 | Phase 8 | Infrastructure |
| **ATC-602** | Technical Task | Nginx Reverse Proxy, CORS & Security Headers | Cấu hình Nginx định tuyến `/api/**` về Spring Boot, static files về React build, cấu hình gzip compression và các security headers (CSP, X-Frame-Options). | 1. Nginx định tuyến chính xác request API và Frontend SPA routes.<br>2. Không có lỗi CORS trên môi trường Production.<br>3. Điểm bảo mật HTTP headers đạt chuẩn A. | High | 5 | ATC-601 | Phase 8 | Infrastructure |
| **ATC-603** | Technical Task | Database Backup & Disaster Recovery Automation | Viết script tự động sao lưu dữ liệu PostgreSQL (kèm vector tables) và MinIO objects (`scripts/backup_db.sh`), tài liệu hóa runbook khôi phục dữ liệu. | 1. Script backup xuất ra file `.sql.gz` có thể restore thành công trên môi trường trắng.<br>2. Tài liệu Runbook hướng dẫn khôi phục dữ liệu chi tiết trong `docs/3.Database/`. | Medium | 5 | ATC-601 | Phase 8 | Operations & DevOps |
| **ATC-604** | Task | Comprehensive System Documentation & API Cheat-Sheet | Hoàn thiện toàn bộ 8 thư mục tài liệu trong `docs/` (`1.Proposal` đến `8.Product_Backlog`), cập nhật `API_DOCS.md` và `README.md` theo trạng thái triển khai thực tế. | 1. Đầy đủ tài liệu Kiến trúc, ERD, API Specs, Test Cases và Hướng dẫn sử dụng.<br>2. `README.md` có hướng dẫn chạy 1-click cho người đánh giá. | High | 5 | All Previous | Phase 8 | Handover & Docs |
| **ATC-605** | Task | Final System Acceptance Testing & Demo Walkthrough | Thực hiện buổi nghiệm thu tổng thể toàn bộ 11 tính năng cốt lõi của MVP theo kịch bản TO-BE Business Process; quay video demo walkthrough lưu vào `artifacts/`. | 1. Toàn bộ 11 tính năng chạy hoàn hảo không có lỗi phát sinh.<br>2. Video demo đầy đủ các bước: Upload → RAG → Soạn giáo án → Tạo Quiz → Trích dẫn → Xuất Word/PDF. | High | 5 | ATC-601, ATC-604 | Phase 8 | Handover & Docs |

---

## 3. CẤU TRÚC EPICS TRONG JIRA (EPIC STRUCTURE)

Toàn bộ 36 công việc trên được nhóm vào **9 Epics chuẩn mực**, đại diện cho các phân hệ năng lực lớn của hệ thống:

| Epic Key | Tên Epic (Capability Area) | Mục Đích & Phạm Vi Chức Năng | Phase(s) Ánh Xạ | Sprint(s) Thực Hiện |
|---|---|---|:---:|:---:|
| **`EPIC-01`** | **Authentication & Security** | Quản lý người dùng, đăng ký, đăng nhập, Spring Security 6 stateless JWT, bảo vệ API và phân quyền. | Phase 3 | **Sprint 2** |
| **`EPIC-02`** | **Teacher Workspace** | Quản lý không gian làm việc môn học/lớp học, phân lập dữ liệu đa người dùng (Multi-tenant Isolation). | Phase 3 | **Sprint 2** |
| **`EPIC-03`** | **Document KB & Vector Ingestion** | Tải file MinIO, băm nhỏ văn bản (Chunking 512 tokens), sinh embedding 768 chiều và lưu trữ pgvector. | Phase 4 | **Sprint 2** |
| **`EPIC-04`** | **RAG Engine & AI Safety** | Truy xuất vector Cosine similarity, Provider Factory, Prompt Boundary `<sources>`, chống Prompt Injection, Insufficient Evidence. | Phase 5 | **Sprint 3, 5** |
| **`EPIC-05`** | **AI Lesson Planner** | Sinh giáo án có cấu trúc (`LessonPlanSchema`), lưu giữ trích dẫn nguồn, DTO mapping và lưu trữ Spring Boot. | Phase 5 | **Sprint 3** |
| **`EPIC-06`** | **Quiz Generator & Bloom Taxonomy** | Sinh đề thi trắc nghiệm và tự luận ngắn, gắn nhãn 6 cấp độ Bloom Taxonomy, trích dẫn nguồn từng câu hỏi. | Phase 6 | **Sprint 4** |
| **`EPIC-07`** | **Review, History & Export** | Chỉnh sửa trực tiếp, tạo lại có versioning (`version++`, `parent_id`), cây phả hệ, xuất bản file Word/PDF. | Phase 5, 6 | **Sprint 3, 4** |
| **`EPIC-08`** | **Quality Evaluation & Testing** | Automated integration tests, Benchmark 20–30 mẫu K-12, đo lường Groundedness & Citation Precision, xử lý edge cases. | Phase 7 | **Sprint 2, 5** |
| **`EPIC-09`** | **Infrastructure & DevOps** | Docker Compose dev/prod, CI/CD GitHub Actions, Nginx SSL, sao lưu CSDL và tài liệu bàn giao. | Phase 2, 8 | **Sprint 1, 6** |

---

## 4. BẢNG ĐỐI SOÁT PHASE ↔ SPRINT MAPPING

Dưới đây là ma trận ánh xạ giữa **8 Roadmap Milestones (Releases)** và **6 Execution Sprints**:

| Roadmap Phase (Release Milestone) | Thời Lượng | Trọng Tâm Nghiệp Vụ & Kỹ Thuật | Phân Bổ Thực Thi Trong Sprints |
|---|:---:|---|---|
| **Phase 1: Discovery & Requirements** | 2 tuần | Yêu cầu K-12, User Stories, Backlog, SRS | **Sprint 1** (Tuần 1–2) |
| **Phase 2: Architecture & UI/UX** | 2 tuần | Kiến trúc 3 lớp, ERD, Docker Dev, CI/CD, Frontend Design System | **Sprint 1** (Tuần 3–4) |
| **Phase 3: Core Foundation** | 3 tuần | Spring Security, JWT, Register/Login, Workspace Isolation | **Sprint 2** (Tuần 5–7) |
| **Phase 4: Document Knowledge Base** | 3 tuần | MinIO Upload, Parser, Chunking 512 tokens, pgvector Ingestion | **Sprint 2** (Tuần 7–8) + Chuyển tiếp |
| **Phase 5: RAG & AI Lesson Planner** | 4 tuần | RAG Engine, Boundary `<sources>`, Insufficient Evidence, Lesson Plan, Export | **Sprint 3** (Tuần 9–12) |
| **Phase 6: Content Generation** | 5 tuần | Quiz Generator (Bloom Tags), Versioning (`version++`), History Tree, Rubric | **Sprint 4** (Tuần 13–16) + Sprint 5 buffer |
| **Phase 7: Testing & Hardening** | 3 tuần | Full Integration Tests, RAG Evaluation Benchmark, Tối ưu hiệu năng | **Sprint 5** (Tuần 17–20) |
| **Phase 8: Deployment & Handover** | 2 tuần | Production Docker Compose, Nginx SSL, Backup Runbook, Bàn giao | **Sprint 6** (Tuần 21–24) |

---

## 5. PHÂN TÍCH CRITICAL PATH & CÁC DEPENDENCY THEN CHỐT

```text
[ATC-102: Postgres & MinIO] ──> [ATC-103: DB Migrations]
                                       │
                                       ▼
                              [ATC-201: Auth Register] ──> [ATC-202: Login JWT]
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

### ⚠️ 3 Điểm nghẽn có rủi ro cao nhất cần lưu ý:
1. **`ATC-207` (Embedding & pgvector Ingestion)**: Nếu băm chunk hoặc embedding bị lỗi, toàn bộ RAG ở Sprint 3 sẽ không có dữ liệu để chạy. Phải kiểm thử kỹ chất lượng chunking ngay cuối Sprint 2.
2. **`ATC-303` (Prompt Boundary & Insufficient Evidence)**: Nếu không xử lý tốt ranh giới prompt, AI sẽ bị ảo giác (hallucination) hoặc bị lỗi format JSON. Phải khóa chặt Pydantic schema validation trước khi phát triển UI.
3. **`ATC-304` (Lesson Planner Pipeline)**: Là nền tảng kiến trúc để mở rộng sang `ATC-401` (Quiz Generator) và `ATC-405` (Rubric). Hoàn thiện chuẩn DTO và provenance ở task này sẽ giúp Sprint 4 làm rất nhanh.

---

## 6. PHÂN ĐỊNH PHẠM VI (SCOPE PRIORITIZATION)

| Phân Loại | Tính Năng / Thành Phần | Cam Kết & Xử Lý Khi Thiếu Thời Gian |
|---|---|---|
| **🔴 MUST HAVE (Bắt buộc 100%)** | • Authentication & User Management<br>• Teacher Workspace & Data Isolation<br>• Document Upload & Knowledge Base (MinIO + pgvector)<br>• RAG Vector Retrieval Baseline<br>• AI Lesson Planner (Structured Output + Citations)<br>• Quiz Generator (MCQ + Short Answer + Bloom Taxonomy)<br>• Review, Inline Edit, Regeneration (`version++`) & History<br>• Word (.docx) & PDF Export | **BẮT BUỘC HOÀN THÀNH**. Đây là xương sống của đồ án/sản phẩm MVP. |
| **🟡 SHOULD HAVE (Nên có)** | • Assessment Rubric Generator (`ATC-405`)<br>• Chế độ xuất đề thi tách biệt đáp án cho học sinh (`ATC-406`) | **Ưu tiên triển khai trong Sprint 4**. Nếu Sprint 4 bị chậm do RAG rủi ro cao, có thể tinh giản UI của Rubric nhưng giữ nguyên export. |
| **🟢 STRETCH / OUT OF SCOPE** | • Slide Outline Generator (Chỉ làm nếu còn thừa thời gian ở Sprint 5)<br>• Standalone Bloom question generator (Đã tích hợp trọn vẹn vào Quiz)<br>• Dữ liệu học sinh / Student PII (**Nghiêm cấm tuyệt đối**) | **KHÔNG CAM KẾT**. Không được đưa vào Sprint Backlog chính thức để tránh gây loãng nguồn lực. |

---

## 7. BẢNG ĐỐI SOÁT SẴN SÀNG NHẬP VÀO JIRA (JIRA IMPORT READINESS)

| Tiêu Chí Đánh Giá | Kết Quả Đối Soát | Chi Tiết |
|---|:---:|---|
| **Không có task trùng lặp / dư thừa** | ✅ Đạt | Toàn bộ 36 tasks đều đại diện cho một kỹ thuật/nghiệp vụ duy nhất, không có task tạo file hay cấu hình vụn vặt. |
| **Định dạng Issue Type chuẩn Jira** | ✅ Đạt | Phân biệt rành mạch giữa `Story` (nghiệp vụ người dùng), `Technical Task` (hạ tầng/kiến trúc) và `Task` (tài liệu/nghiệm thu). |
| **Khối lượng Story Points cân bằng** | ✅ Đạt | Mỗi Sprint 4 tuần có tổng Story Points dao động từ **26 – 37 SP**, cực kỳ hợp lý cho năng suất của 1 lập trình viên full-stack. |
| **Dependencies & Thứ tự logic** | ✅ Đạt | 100% tasks đều có liên kết phụ thuộc rõ ràng, không có task nào bị "treo" không có đầu vào. |
| **Mapping Phase & Epic nhất quán** | ✅ Đạt | Ánh xạ 1-nhiều rõ ràng: 8 Releases (Phases), 9 Epics, 6 Sprints. |
| **Khả năng Copy & Import trực tiếp** | ✅ Đạt | Bảng dữ liệu có thể xuất ra file CSV để **Import trực tiếp vào Jira Software (Jira CSV Importer)** chỉ trong 1 phút. |
