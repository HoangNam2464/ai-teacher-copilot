# 03 - TASK DETAILS (Sub-tasks)

> Chi tiết thông tin thực thi của toàn bộ Sub-tasks thuộc dự án AI Teacher Copilot.

### [BE-001] Standardize Backend Package Structure by Feature
- **Group:** BE
- **Master Task ID:** ATC-101
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Tổ chức lại cấu trúc thư mục backend Spring Boot và dọn dẹp các package thừa.

**Acceptance Criteria:**
Cấu trúc package backend chuẩn theo feature (auth, workspace, document, generation); không còn file mồ côi.

**Deliverable:** Backend Directory Layout

---

### [FE-001] Initialize React Vite Frontend Project
- **Group:** FE
- **Master Task ID:** ATC-101
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Khởi tạo thư mục frontend React 18 với Vite và cấu trúc thư mục phân tầng.

**Acceptance Criteria:**
Thư mục frontend build sạch sẽ, sẵn sàng tích hợp design system và router.

**Deliverable:** Frontend Directory Layout

---

### [OPS-001] Restructure Monorepo Root Layout and Workspace Scripts
- **Group:** OPS
- **Master Task ID:** ATC-101
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Cập nhật đường dẫn gốc, file .gitignore và scripts điều phối monorepo.

**Acceptance Criteria:**
Di chuyển ai-service/ ra root độc lập; scripts dev nhận diện đúng 3 service.

**Deliverable:** Root Scripts & .gitignore

---

### [QA-001] Test Multi-Service Monorepo Build Isolation
- **Group:** QA
- **Master Task ID:** ATC-101
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Kiểm thử độc lập quá trình build và chạy của 3 service trong monorepo.

**Acceptance Criteria:**
Backend, AI Service và Frontend build độc lập không bị xung đột dependency.

**Deliverable:** Monorepo Build Report

---

### [OPS-002] Set Up Local Dev Docker Compose for PostgreSQL and MinIO
- **Group:** OPS
- **Master Task ID:** ATC-102
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Viết file docker-compose.dev.yml khởi tạo PostgreSQL 16 pgvector và MinIO S3 storage.

**Acceptance Criteria:**
Khởi chạy thành công atc-postgres, atc-minio và atc-minio-init với healthcheck hợp lệ.

**Deliverable:** docker-compose.dev.yml

---

### [QA-002] Test Local Dev Infrastructure Startup and Healthchecks
- **Group:** QA
- **Master Task ID:** ATC-102
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Kiểm thử kết nối cổng và tính sẵn sàng của database và object storage.

**Acceptance Criteria:**
Cổng 5432 (Postgres), 9000/9001 (MinIO) phản hồi đúng; dữ liệu volume được bảo toàn.

**Deliverable:** Infra Verification Report

---

### [BE-002] Implement Flyway V1 Database Migration Schema
- **Group:** BE
- **Master Task ID:** ATC-103
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-102

**Description:**
Viết script V1__init_schema.sql tạo 6 bảng chính với khóa chính UUID chuẩn hóa.

**Acceptance Criteria:**
Flyway tự động migrate thành công 6 bảng trên PostgreSQL; khóa chính dùng uuid-ossp.

**Deliverable:** V1__init_schema.sql

---

### [OPS-003] Configure PostgreSQL pgvector Extension Initialization
- **Group:** OPS
- **Master Task ID:** ATC-103
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-102

**Description:**
Cấu hình script khởi tạo extension vector và uuid-ossp trong Docker init.

**Acceptance Criteria:**
Extension vector và uuid-ossp được kích hoạt tự động khi container khởi động.

**Deliverable:** init-extensions.sql

---

### [QA-003] Test Flyway Migrations on PostgreSQL and H2
- **Group:** QA
- **Master Task ID:** ATC-103
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-102

**Description:**
Kiểm thử chạy migration trên PostgreSQL và tương thích test profile H2.

**Acceptance Criteria:**
Chạy mvnw test với profile=test pass 100% không bị lỗi cú pháp SQL.

**Deliverable:** Migration Test Report

---

### [OPS-004] Configure GitHub Actions CI Workflows for All Services
- **Group:** OPS
- **Master Task ID:** ATC-104
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-101

**Description:**
Tạo 4 workflows CI riêng biệt kích hoạt theo đường dẫn thay đổi (paths-filter).

**Acceptance Criteria:**
backend-ci.yml, ai-service-ci.yml, frontend-ci.yml và ci.yml chạy đúng khi có push/PR.

**Deliverable:** .github/workflows/*.yml

---

### [QA-004] Test CI Workflow Triggers and Branch Protection Gates
- **Group:** QA
- **Master Task ID:** ATC-104
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-101

**Description:**
Kiểm thử trigger CI khi tạo PR vào develop và main.

**Acceptance Criteria:**
CI tự động chặn merge nếu có unit test fail hoặc lint error.

**Deliverable:** CI Gate Verification Report

---

### [DES-001] Define Figma Design System & Color Tokens
- **Group:** DES
- **Master Task ID:** ATC-105
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Thiết kế bộ Design System chuẩn: bảng màu HSL, typography, spacing và component primitives.

**Acceptance Criteria:**
Bộ Figma Design System hoàn chỉnh với đầy đủ biến màu sắc, font chữ và button states.

**Deliverable:** Figma Design System

---

### [FE-002] Implement 4-Layer Frontend Architecture and CSS Tokens
- **Group:** FE
- **Master Task ID:** ATC-105
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Tạo cấu trúc 4 tầng (app, core, features, shared) và cài đặt biến CSS design tokens.

**Acceptance Criteria:**
File variables.css chứa đủ tokens; cấu trúc thư mục tuân thủ FRONTEND_ARCHITECTURE.md.

**Deliverable:** variables.css & Core Components

---

### [FE-003] Configure Axios Client and React Router Layout Shells
- **Group:** FE
- **Master Task ID:** ATC-105
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Cấu hình client.js, paths.js và 3 Layout shells (Dashboard, Auth, Focus).

**Acceptance Criteria:**
paths.js là SSOT cho toàn bộ URL; router chuyển đổi mượt mà giữa các layout.

**Deliverable:** AppRoutes.jsx & client.js

---

### [QA-005] Test Frontend Layout Shells and Token Rendering
- **Group:** QA
- **Master Task ID:** ATC-105
- **Sprint:** Sprint 1 - Foundation
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Kiểm thử giao diện layout cơ bản và tốc độ build của Vite.

**Acceptance Criteria:**
npm run build hoàn thành < 2s; không có lỗi CSS hay console warning.

**Deliverable:** Frontend Base Test Report

---

### [BE-003] Document Backend REST API Contracts and Data Models
- **Group:** BE
- **Master Task ID:** ATC-106
- **Sprint:** Sprint 1 - Foundation
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Tài liệu hóa các endpoint API, mã lỗi HTTP và thực thể CSDL trong tài liệu SRS.

**Acceptance Criteria:**
Đặc tả rõ 100% request/response payload và quan hệ ERD trong docs/3.Database/.

**Deliverable:** API & ERD Specs

---

### [FE-004] Document Frontend Component Specs and UI Interactions
- **Group:** FE
- **Master Task ID:** ATC-106
- **Sprint:** Sprint 1 - Foundation
- **Priority:** Medium
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Viết tài liệu quy chuẩn component, routing hierarchy và state management.

**Acceptance Criteria:**
Tài liệu FRONTEND_ARCHITECTURE.md mô tả rõ ràng 4 tầng kiến trúc và Zustand store.

**Deliverable:** Frontend Architecture Specs

---

### [OPS-005] Document Infrastructure, Security and Environment Specs
- **Group:** OPS
- **Master Task ID:** ATC-106
- **Sprint:** Sprint 1 - Foundation
- **Priority:** Medium
- **Assignee Type:** DevOps Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Xác định các thông số môi trường, bảo mật bí mật (.env.example) và ranh giới mạng.

**Acceptance Criteria:**
Tài liệu ranh giới bảo mật AI và cấu hình Docker chuẩn hóa.

**Deliverable:** Infra & Security Specs

---

### [QA-006] Define Master Test Strategy and Quality Acceptance Gates
- **Group:** QA
- **Master Task ID:** ATC-106
- **Sprint:** Sprint 1 - Foundation
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** None

**Description:**
Thiết lập tiêu chuẩn kiểm thử, ma trận truy xuất nguồn gốc và ngưỡng chấp nhận MVP.

**Acceptance Criteria:**
11 files trong .agents/rules/ được đồng bộ hóa với định hướng chất lượng.

**Deliverable:** Master Test Strategy

---

### [DES-002] Design Teacher Registration Screen in Figma
- **Group:** DES
- **Master Task ID:** ATC-201
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-103, ATC-105

**Description:**
Thiết kế màn hình Đăng ký tài khoản giáo viên với các trạng thái lỗi và thành công.

**Acceptance Criteria:**
Bản vẽ Figma hoàn chỉnh cho màn hình Register với form input, validation message và nút submit.

**Deliverable:** Figma Register Screen

---

### [FE-005] Implement Teacher Registration Form with Validation
- **Group:** FE
- **Master Task ID:** ATC-201
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-103, ATC-105

**Description:**
Xây dựng RegisterForm component với kiểm tra tính hợp lệ của email và độ mạnh mật khẩu.

**Acceptance Criteria:**
Form kiểm tra định dạng email và mật khẩu tối thiểu 8 ký tự trước khi gọi API.

**Deliverable:** RegisterForm.jsx

---

### [BE-004] Implement Teacher Registration API
- **Group:** BE
- **Master Task ID:** ATC-201
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-103, ATC-105

**Description:**
Tạo endpoint POST /api/auth/register, kiểm tra trùng email và hash mật khẩu bằng BCrypt.

**Acceptance Criteria:**
Trả về HTTP 201 khi thành công; trả về 400 nếu email tồn tại; mật khẩu không lưu plaintext.

**Deliverable:** AuthController.java & AuthService.java

---

### [QA-007] Test Teacher Registration and Duplicate Email Handling
- **Group:** QA
- **Master Task ID:** ATC-201
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-103, ATC-105

**Description:**
Kiểm thử tự động các kịch bản đăng ký thành công, trùng email và mật khẩu không hợp lệ.

**Acceptance Criteria:**
Unit test và integration test bao phủ 100% các nhánh validation và mã lỗi.

**Deliverable:** Register Test Suite

---

### [DES-003] Design Teacher Login Screen in Figma
- **Group:** DES
- **Master Task ID:** ATC-202
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-201

**Description:**
Thiết kế màn hình Đăng nhập giáo viên với trạng thái loading, lỗi sai mật khẩu.

**Acceptance Criteria:**
Bản vẽ Figma hoàn chỉnh cho màn hình Login kèm thông báo lỗi trực quan.

**Deliverable:** Figma Login Screen

---

### [FE-006] Implement Teacher Login Form and Token Storage
- **Group:** FE
- **Master Task ID:** ATC-202
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-201

**Description:**
Xây dựng LoginForm component và lưu trữ JWT token trong authStore.

**Acceptance Criteria:**
Đăng nhập thành công lưu token vào localStorage và chuyển hướng sang /workspaces.

**Deliverable:** LoginForm.jsx & authStore.js

---

### [BE-005] Implement Teacher Login and JWT Issuance API
- **Group:** BE
- **Master Task ID:** ATC-202
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-201

**Description:**
Tạo endpoint POST /api/auth/login xác thực credentials và sinh JWT token.

**Acceptance Criteria:**
Trả về HTTP 200 kèm JWT token chứa userId, email và role TEACHER; trả về 401 nếu sai mật khẩu.

**Deliverable:** JwtTokenProvider.java & AuthController.java

---

### [QA-008] Test Teacher Login and Invalid Credentials Handling
- **Group:** QA
- **Master Task ID:** ATC-202
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-201

**Description:**
Kiểm thử các kịch bản đăng nhập đúng, sai thông tin, tài khoản chưa đăng ký.

**Acceptance Criteria:**
Test suite kiểm tra cấu trúc JWT claims và thời gian hết hạn (expiration).

**Deliverable:** Login Test Suite

---

### [FE-007] Implement Axios JWT Bearer Interceptors and 401 Redirect
- **Group:** FE
- **Master Task ID:** ATC-203
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-202

**Description:**
Cấu hình client.js tự động gắn header Authorization: Bearer <token> và bắt lỗi 401.

**Acceptance Criteria:**
Mọi request đều có Bearer token; khi gặp lỗi 401 tự động xóa session và redirect về /login.

**Deliverable:** client.js Interceptors

---

### [BE-006] Implement Spring Security Stateless JWT Filter
- **Group:** BE
- **Master Task ID:** ATC-203
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-202

**Description:**
Tạo JwtAuthenticationFilter trích xuất token, xác thực chữ ký và set SecurityContext.

**Acceptance Criteria:**
Các endpoint bảo vệ từ chối truy cập không có token (401); SecurityContext lưu Principal.

**Deliverable:** JwtAuthenticationFilter.java & SecurityConfig.java

---

### [QA-009] Test JWT Route Protection and Token Expiration
- **Group:** QA
- **Master Task ID:** ATC-203
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-202

**Description:**
Kiểm thử truy cập các endpoint bảo vệ khi không có token, token hết hạn hoặc giả mạo.

**Acceptance Criteria:**
Bảo vệ 100% các endpoint nghiệp vụ khỏi truy cập trái phép.

**Deliverable:** Security Filter Test Report

---

### [DES-004] Design Workspace Dashboard and Creation Modal in Figma
- **Group:** DES
- **Master Task ID:** ATC-204
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-203

**Description:**
Thiết kế giao diện quản lý danh sách Workspace, modal tạo mới và thẻ workspace.

**Acceptance Criteria:**
Bản vẽ Figma hoàn chỉnh cho Workspace Dashboard, Workspace Card và Create Modal.

**Deliverable:** Figma Workspace Screens

---

### [FE-008] Implement Workspace List, Creation Modal and Selector
- **Group:** FE
- **Master Task ID:** ATC-204
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-203

**Description:**
Xây dựng WorkspaceListPage, CreateWorkspaceModal và quản lý activeWorkspace trong Zustand.

**Acceptance Criteria:**
Giáo viên xem được danh sách workspace của mình, tạo mới và chọn workspace hoạt động.

**Deliverable:** WorkspaceListPage.jsx & workspaceStore.js

---

### [BE-007] Implement Workspace CRUD API with Ownership Gate
- **Group:** BE
- **Master Task ID:** ATC-204
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-203

**Description:**
Tạo các endpoint CRUD cho Workspace kèm phương thức kiểm tra quyền sở hữu findAndAuthorize.

**Acceptance Criteria:**
Truy cập workspace của giáo viên khác lập tức nhận mã lỗi HTTP 403 Forbidden.

**Deliverable:** WorkspaceController.java & WorkspaceService.java

---

### [QA-010] Test Workspace Multi-Tenant Data Isolation and 403 Forbidden
- **Group:** QA
- **Master Task ID:** ATC-204
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-203

**Description:**
Kiểm thử phân lập dữ liệu đa người dùng: Teacher A không thể đọc/sửa dữ liệu Teacher B.

**Acceptance Criteria:**
Test suite kiểm tra chặt chẽ các trường hợp vi phạm quyền sở hữu workspace.

**Deliverable:** Workspace Isolation Test Report

---

### [DES-005] Design Document Upload Drag-and-Drop and File List in Figma
- **Group:** DES
- **Master Task ID:** ATC-205
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-204

**Description:**
Thiết kế khu vực kéo thả tài liệu, thanh tiến trình upload và danh sách tài liệu.

**Acceptance Criteria:**
Bản vẽ Figma chi tiết cho Document Library, Upload Dropzone và trạng thái PENDING.

**Deliverable:** Figma Document Screens

---

### [FE-009] Implement Document Upload Component with Progress Bar
- **Group:** FE
- **Master Task ID:** ATC-205
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-204

**Description:**
Xây dựng DocumentUploadModal và DocumentTable hiển thị danh sách tài liệu trong workspace.

**Acceptance Criteria:**
Hỗ trợ kéo thả file .pdf, .docx; hiển thị tiến trình tải lên và cập nhật danh sách.

**Deliverable:** DocumentUploadModal.jsx & DocumentTable.jsx

---

### [BE-008] Implement Multipart Document Upload API to MinIO
- **Group:** BE
- **Master Task ID:** ATC-205
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-204

**Description:**
Tạo endpoint POST /api/workspaces/{id}/documents lưu file lên MinIO và lưu metadata vào DB.

**Acceptance Criteria:**
Lưu file an toàn lên MinIO; lưu metadata vào bảng documents với processing_status='PENDING'.

**Deliverable:** DocumentController.java & MinioStorageService.java

---

### [QA-011] Test Document Upload, MinIO Storage and Metadata Persistence
- **Group:** QA
- **Master Task ID:** ATC-205
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-204

**Description:**
Kiểm thử upload file PDF/DOCX hợp lệ, từ chối file sai định dạng hoặc quá dung lượng (50MB).

**Acceptance Criteria:**
Metadata lưu chính xác dung lượng, loại file và đường dẫn MinIO object key.

**Deliverable:** Document Upload Test Report

---

### [BE-009] Implement PDF and DOCX Document Parsing Pipeline
- **Group:** BE
- **Master Task ID:** ATC-206
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-205

**Description:**
Sử dụng PyMuPDF và python-docx để trích xuất văn bản có cấu trúc kèm thông tin số trang.

**Acceptance Criteria:**
Trích xuất văn bản chính xác từ PDF và DOCX; giữ lại metadata tiêu đề và trang nguồn.

**Deliverable:** parsers.py in ai-service

---

### [BE-010] Implement Structure-Aware Text Chunking with Overlap
- **Group:** BE
- **Master Task ID:** ATC-206
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-205

**Description:**
Xây dựng thuật toán băm văn bản StructureAwareChunker (512 tokens / 50 tokens overlap).

**Acceptance Criteria:**
Không ngắt giữa chừng câu; giữ ranh giới đoạn văn và bảo toàn ngữ cảnh liền kề.

**Deliverable:** chunking.py in ai-service

---

### [QA-012] Test Document Parsing Accuracy and Chunk Boundaries
- **Group:** QA
- **Master Task ID:** ATC-206
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-205

**Description:**
Kiểm thử băm chunk trên các giáo trình thực tế có định dạng phức tạp.

**Acceptance Criteria:**
100% chunk có độ dài trong ngưỡng 100-512 tokens và không bị mất chữ.

**Deliverable:** Chunking Quality Test Report

---

### [BE-011] Implement Text Chunk Embedding Generation
- **Group:** BE
- **Master Task ID:** ATC-207
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-206

**Description:**
Tích hợp sinh vector embedding 768 chiều qua Google Gemini text-embedding-004.

**Acceptance Criteria:**
Sinh vector embedding chuẩn 768 chiều cho từng text chunk theo batch hiệu quả.

**Deliverable:** embeddings.py in ai-service

---

### [BE-012] Implement Vector Embedding Persistence in pgvector
- **Group:** BE
- **Master Task ID:** ATC-207
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-206

**Description:**
Lưu các chunks và vector tương ứng vào bảng document_chunks qua SQLAlchemy asyncpg.

**Acceptance Criteria:**
Toàn bộ chunks được chèn thành công kèm workspace_id, document_id và vector column.

**Deliverable:** ingestion_router.py & models.py

---

### [QA-013] Test Vector Embedding Generation and pgvector Storage
- **Group:** QA
- **Master Task ID:** ATC-207
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** DONE
- **Dependencies:** is blocked by ATC-206

**Description:**
Kiểm tra số lượng bản ghi chunk trong database và tính toàn vẹn của vector index.

**Acceptance Criteria:**
Vector có đúng 768 chiều; HNSW index được cập nhật và liên kết đúng document_id.

**Deliverable:** Vector Storage Test Report

---

### [QA-014] Implement Automated Unit and Integration Tests for Auth and Ingestion
- **Group:** QA
- **Master Task ID:** ATC-208
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-203, ATC-207

**Description:**
Viết test suite tự động kiểm thử toàn bộ luồng từ đăng ký, đăng nhập đến tải tài liệu và băm chunk.

**Acceptance Criteria:**
Bộ test chạy tự động trên CI; đạt tỷ lệ bao phủ code (code coverage) theo yêu cầu.

**Deliverable:** Auth & Ingestion Test Suite

---

### [QA-015] Execute Security and Negative Input Tests for Upload and Auth
- **Group:** QA
- **Master Task ID:** ATC-208
- **Sprint:** Sprint 2 - Auth & Ingestion
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-203, ATC-207

**Description:**
Kiểm thử các kịch bản tiêu cực: upload file độc hại, file rỗng, sai token, truy cập trái phép.

**Acceptance Criteria:**
Hệ thống từ chối an toàn và trả về mã lỗi HTTP chuẩn mực (400, 401, 403, 415).

**Deliverable:** Negative Testing Report

---

### [BE-013] Implement AI Provider Abstraction Interface and Factory
- **Group:** BE
- **Master Task ID:** ATC-301
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-207

**Description:**
Xây dựng lớp trừu tượng BaseAIProvider định nghĩa các phương thức generate và embed.

**Acceptance Criteria:**
Loại bỏ import cứng SDK trong route handlers; khởi tạo provider qua ProviderFactory.

**Deliverable:** providers/base.py & factory.py

---

### [BE-014] Implement Gemini and OpenAI LLM Provider Adapters
- **Group:** BE
- **Master Task ID:** ATC-301
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-207

**Description:**
Cài đặt cụ thể GeminiProvider và OpenAIProvider tuân thủ BaseAIProvider interface.

**Acceptance Criteria:**
Hỗ trợ chuyển đổi qua biến môi trường AI_PROVIDER mà không cần sửa code nghiệp vụ.

**Deliverable:** providers/gemini.py & openai.py

---

### [QA-016] Test AI Provider Dynamic Switching and API Error Fallback
- **Group:** QA
- **Master Task ID:** ATC-301
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-207

**Description:**
Kiểm thử chuyển đổi linh hoạt giữa Gemini và OpenAI; xử lý timeout và rate limit.

**Acceptance Criteria:**
Hệ thống tự động bắt lỗi API provider và trả về mã lỗi nội bộ thích hợp.

**Deliverable:** Provider Test Report

---

### [BE-015] Implement Vector Similarity Search with Workspace Isolation
- **Group:** BE
- **Master Task ID:** ATC-302
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-301

**Description:**
Xây dựng hàm truy vấn vector trong retrieval_service với khoảng cách Cosine và bộ lọc workspace_id.

**Acceptance Criteria:**
Trả về Top-K (5-8) chunks phù hợp nhất; bắt buộc lọc workspace_id ở mức câu lệnh SQL.

**Deliverable:** retrieval/service.py in ai-service

---

### [QA-017] Test Top-K Vector Retrieval and Workspace Data Isolation
- **Group:** QA
- **Master Task ID:** ATC-302
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** IN PROGRESS
- **Dependencies:** is blocked by ATC-301

**Description:**
Kiểm thử truy vấn vector bảo đảm không rò rỉ dữ liệu chunk giữa các workspace khác nhau.

**Acceptance Criteria:**
Truy vấn từ Workspace A không bao giờ trả về chunk thuộc Workspace B.

**Deliverable:** Retrieval Isolation Test Report

---

### [BE-016] Implement Sources Boundary Wrapper for Retrieved Context
- **Group:** BE
- **Master Task ID:** ATC-303
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302

**Description:**
Bọc toàn bộ nội dung chunk trích xuất vào thẻ <sources>...</sources> và chỉ thị Untrusted Data.

**Acceptance Criteria:**
Tài liệu nguồn được coi là dữ liệu tham khảo thuần túy; ngăn chặn ghi đè system prompt.

**Deliverable:** prompt_builder.py in ai-service

---

### [BE-017] Implement Insufficient Evidence Detection and Handling
- **Group:** BE
- **Master Task ID:** ATC-303
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302

**Description:**
Kiểm tra điểm tương đồng; nếu không có chunk nào đạt ngưỡng trả về lỗi INSUFFICIENT_EVIDENCE.

**Acceptance Criteria:**
Trả về mã HTTP 422 với mã lỗi INSUFFICIENT_EVIDENCE thay vì để LLM bịa đặt nội dung.

**Deliverable:** evidence_validator.py

---

### [QA-018] Test Prompt Injection Defense and Insufficient Evidence Rejection
- **Group:** QA
- **Master Task ID:** ATC-303
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302

**Description:**
Thực hiện kiểm thử tiêm prompt (Prompt Injection) và truy vấn kiến thức không có trong tài liệu.

**Acceptance Criteria:**
Hệ thống từ chối tạo nội dung ảo giác khi thiếu tài liệu nguồn.

**Deliverable:** Prompt Security Test Report

---

### [DES-006] Design Lesson Planner Input Form and Output View in Figma
- **Group:** DES
- **Master Task ID:** ATC-304
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303

**Description:**
Thiết kế form nhập yêu cầu bài giảng (chủ đề, khối lớp, thời lượng) và giao diện xem giáo án.

**Acceptance Criteria:**
Bản vẽ Figma hoàn chỉnh cho cấu trúc giáo án 4 phần: Mục tiêu, Chuẩn bị, Hoạt động, Đánh giá.

**Deliverable:** Figma Lesson Planner Screens

---

### [FE-010] Implement Lesson Planner Generation Form and Viewer
- **Group:** FE
- **Master Task ID:** ATC-304
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303

**Description:**
Xây dựng LessonPlanGeneratorForm và LessonPlanViewer hiển thị giáo án theo tab/timeline.

**Acceptance Criteria:**
Form gửi yêu cầu sinh giáo án, hiển thị animation loading và render cấu trúc bài giảng trực quan.

**Deliverable:** LessonPlanViewer.jsx

---

### [BE-018] Implement Structured Lesson Plan Generation Pipeline
- **Group:** BE
- **Master Task ID:** ATC-304
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303

**Description:**
Xây dựng pipeline sinh giáo án bằng Gemini/OpenAI ép cấu trúc qua schema LessonPlanSchema.

**Acceptance Criteria:**
Output trả về khớp 100% với Pydantic schema; giữ lại mảng source_chunk_ids.

**Deliverable:** lesson_planner.py in ai-service

---

### [BE-019] Implement Lesson Plan Persistence in Generated Contents Repository
- **Group:** BE
- **Master Task ID:** ATC-304
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303

**Description:**
Nhận kết quả từ FastAPI và lưu bản ghi vào bảng generated_contents với review_status='DRAFT'.

**Acceptance Criteria:**
Giáo án được lưu với content_type='LESSON_PLAN', version=1 và liên kết đúng workspace.

**Deliverable:** GenerationService.java in backend

---

### [QA-019] Test Lesson Plan JSON Schema and Source Citation Traceability
- **Group:** QA
- **Master Task ID:** ATC-304
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303

**Description:**
Kiểm thử tự động tính hợp lệ của JSON giáo án và liên kết trích dẫn nguồn chunk.

**Acceptance Criteria:**
Schema không bị thiếu trường; mảng source_chunk_ids tồn tại trong database.

**Deliverable:** Lesson Plan Schema Test Report

---

### [DES-007] Design Citation Badges, Tooltips and Source Drawer in Figma
- **Group:** DES
- **Master Task ID:** ATC-305
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Thiết kế badge trích dẫn [1], tooltip hiển thị tên sách/trang và drawer xem đoạn gốc.

**Acceptance Criteria:**
Bản vẽ Figma chi tiết cho Citation Badge, Citation Tooltip và Source Drawer.

**Deliverable:** Figma Citation Components

---

### [FE-011] Implement Citation Badges and Source Chunk Drawer
- **Group:** FE
- **Master Task ID:** ATC-305
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Gắn badge trích dẫn tương tác vào nội dung bài giảng; mở drawer xem đoạn văn bản gốc khi click.

**Acceptance Criteria:**
Click vào badge hiển thị chính xác tên tài liệu, trang số và đoạn trích dẫn nguồn.

**Deliverable:** CitationBadge.jsx & SourceDrawer.jsx

---

### [BE-020] Implement Citation Resolution and Provenance API
- **Group:** BE
- **Master Task ID:** ATC-305
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Tạo endpoint GET /api/workspaces/{id}/citations/resolve và lưu bản ghi vào content_citations.

**Acceptance Criteria:**
Truy vấn trả về đầy đủ metadata nguồn gốc từ bảng document_chunks.

**Deliverable:** CitationController.java & CitationService.java

---

### [QA-020] Test Citation Provenance Resolution to Document Page and Chunk
- **Group:** QA
- **Master Task ID:** ATC-305
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Kiểm thử đối chiếu dữ liệu trích dẫn từ giao diện ngược về trang PDF/DOCX gốc.

**Acceptance Criteria:**
100% trích dẫn trỏ đúng tài liệu và vị trí trang đã tải lên.

**Deliverable:** Citation Traceability Test Report

---

### [DES-008] Design Lesson Plan Inline Editor and Review Status in Figma
- **Group:** DES
- **Master Task ID:** ATC-306
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Thiết kế chế độ chỉnh sửa trực tiếp trên từng phần giáo án và nút đổi trạng thái phê duyệt.

**Acceptance Criteria:**
Bản vẽ Figma cho Inline Editor, nút Save Draft và chuyển đổi DRAFT -> APPROVED.

**Deliverable:** Figma Inline Review Screen

---

### [FE-012] Implement Inline Lesson Plan Editor with Auto-Save
- **Group:** FE
- **Master Task ID:** ATC-306
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Cho phép giáo viên sửa tiêu đề, mục tiêu, nội dung hoạt động và chọn trạng thái phê duyệt.

**Acceptance Criteria:**
Giáo viên sửa trực tiếp trên UI; có nút Lưu thay đổi và thông báo toast thành công.

**Deliverable:** InlineLessonEditor.jsx

---

### [BE-021] Implement Lesson Content Update and Review Status API
- **Group:** BE
- **Master Task ID:** ATC-306
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Tạo endpoint PUT /api/workspaces/{id}/generation/{id} cập nhật content_data và review_status.

**Acceptance Criteria:**
Cập nhật thành công nội dung bài giảng và chuyển trạng thái DRAFT -> REVIEWED -> APPROVED.

**Deliverable:** GenerationController.java

---

### [QA-021] Test Inline Content Editing and Review Status Transitions
- **Group:** QA
- **Master Task ID:** ATC-306
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304

**Description:**
Kiểm thử lưu nội dung chỉnh sửa, cập nhật trạng thái và bảo đảm dữ liệu JSON không bị vỡ.

**Acceptance Criteria:**
Dữ liệu chỉnh sửa được lưu chính xác vào DB mà không làm hỏng cấu trúc schema.

**Deliverable:** Review Edit Test Report

---

### [DES-009] Design Document Export Modal and Layout Options in Figma
- **Group:** DES
- **Master Task ID:** ATC-307
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-306

**Description:**
Thiết kế modal tùy chọn định dạng xuất file (Word, PDF) và template văn bản mẫu.

**Acceptance Criteria:**
Bản vẽ Figma cho Export Modal và mẫu trình bày giáo án chuẩn trường học.

**Deliverable:** Figma Export Modal

---

### [FE-013] Implement Document Export Modal and Download Flow
- **Group:** FE
- **Master Task ID:** ATC-307
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-306

**Description:**
Xây dựng ExportModal kích hoạt API tải file blob và lưu file về máy người dùng.

**Acceptance Criteria:**
Người dùng chọn định dạng DOCX hoặc PDF và tải file về máy thành công.

**Deliverable:** ExportModal.jsx

---

### [BE-022] Implement DOCX Lesson Export with Citation Footnotes
- **Group:** BE
- **Master Task ID:** ATC-307
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-306

**Description:**
Sử dụng Apache POI để sinh file Word chuẩn định dạng giáo án kèm danh mục trích dẫn cuối trang.

**Acceptance Criteria:**
Tạo file .docx với font chữ, bảng biểu chuẩn và danh mục tài liệu tham khảo.

**Deliverable:** DocxExportService.java

---

### [BE-023] Implement PDF Lesson Export with Pedagogical Formatting
- **Group:** BE
- **Master Task ID:** ATC-307
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-306

**Description:**
Sử dụng iText/OpenPDF để render giáo án thành file PDF chuyên nghiệp.

**Acceptance Criteria:**
Tạo file .pdf chuẩn trang in A4, có header/footer và đánh số trang.

**Deliverable:** PdfExportService.java

---

### [QA-022] Test DOCX and PDF Lesson Export Formatting and Citations
- **Group:** QA
- **Master Task ID:** ATC-307
- **Sprint:** Sprint 3 - RAG & Lesson
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-306

**Description:**
Kiểm thử tải và mở file DOCX/PDF trên Microsoft Word và Adobe Acrobat.

**Acceptance Criteria:**
File mở không bị lỗi format; bảng biểu và trích dẫn hiển thị rõ ràng.

**Deliverable:** Export Quality Test Report

---

### [DES-010] Design Quiz Generator Form and Preview Interface in Figma
- **Group:** DES
- **Master Task ID:** ATC-401
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-304

**Description:**
Thiết kế form tạo đề thi (số lượng câu, trắc nghiệm, tự luận) và giao diện xem danh sách câu hỏi.

**Acceptance Criteria:**
Bản vẽ Figma cho Quiz Generator, Question Card và hiển thị đáp án đúng/sai.

**Deliverable:** Figma Quiz Screens

---

### [FE-014] Implement Quiz Generator Form and Question List Viewer
- **Group:** FE
- **Master Task ID:** ATC-401
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-304

**Description:**
Xây dựng QuizGeneratorForm và QuizQuestionViewer với tùy chọn ẩn/hiện đáp án.

**Acceptance Criteria:**
Hiển thị đầy đủ danh sách câu hỏi trắc nghiệm (4 phương án) và câu hỏi tự luận.

**Deliverable:** QuizQuestionViewer.jsx

---

### [BE-024] Implement Structured MCQ and Short Answer Quiz Generation
- **Group:** BE
- **Master Task ID:** ATC-401
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-304

**Description:**
Xây dựng pipeline sinh đề thi bằng LLM với Pydantic schema QuizSchema.

**Acceptance Criteria:**
Sinh đúng số lượng câu hỏi yêu cầu; câu trắc nghiệm có đủ 4 lựa chọn A, B, C, D.

**Deliverable:** quiz_generator.py in ai-service

---

### [BE-025] Implement Quiz Content Persistence in Generated Contents Repository
- **Group:** BE
- **Master Task ID:** ATC-401
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-304

**Description:**
Lưu đề thi vào bảng generated_contents với content_type='QUIZ'.

**Acceptance Criteria:**
Đề thi được lưu vào CSDL kèm metadata câu hỏi và mảng source_chunk_ids.

**Deliverable:** QuizService.java in backend

---

### [QA-023] Test Quiz Question Completeness, Options and Answer Keys
- **Group:** QA
- **Master Task ID:** ATC-401
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-304

**Description:**
Kiểm thử sinh đề thi với các mức số lượng câu hỏi (3 - 20 câu) và kiểm tra tính duy nhất của đáp án.

**Acceptance Criteria:**
100% câu hỏi trắc nghiệm có đúng 1 đáp án chính xác và lời giải thích hợp lý.

**Deliverable:** Quiz Generation Test Report

---

### [DES-011] Design Bloom Taxonomy Level Badges and Distribution in Figma
- **Group:** DES
- **Master Task ID:** ATC-402
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401

**Description:**
Thiết kế hệ thống badge màu sắc cho 6 cấp độ Bloom (Nhận biết đến Sáng tạo) và biểu đồ phân bổ.

**Acceptance Criteria:**
Bản vẽ Figma cho 6 Bloom Badges và widget thống kê ma trận nhận thức.

**Deliverable:** Figma Bloom Badges

---

### [FE-015] Implement Bloom's Taxonomy Filter and Level Badges
- **Group:** FE
- **Master Task ID:** ATC-402
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401

**Description:**
Gắn badge cấp độ Bloom vào từng câu hỏi và thêm bộ lọc câu hỏi theo thang Bloom.

**Acceptance Criteria:**
Giáo viên lọc được câu hỏi theo cấp độ nhận thức; xem tỷ lệ phân bổ ma trận đề.

**Deliverable:** BloomBadge.jsx & BloomFilter.jsx

---

### [BE-026] Implement Automated Bloom's Taxonomy Question Classification
- **Group:** BE
- **Master Task ID:** ATC-402
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401

**Description:**
Tích hợp chỉ thị phân loại cấp độ Bloom trực tiếp vào prompt sinh câu hỏi.

**Acceptance Criteria:**
Mỗi câu hỏi có trường bloom_taxonomy_level hợp lệ (REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE).

**Deliverable:** bloom_classifier.py

---

### [QA-024] Test Bloom's Taxonomy Question Tagging and Filtering
- **Group:** QA
- **Master Task ID:** ATC-402
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401

**Description:**
Kiểm thử tính chính xác của việc gắn nhãn cấp độ Bloom trên tập câu hỏi mẫu.

**Acceptance Criteria:**
Nhãn Bloom phản ánh đúng độ khó của câu hỏi; bộ lọc UI hoạt động chính xác.

**Deliverable:** Bloom Tagging Test Report

---

### [DES-012] Design Regeneration Prompt Modal and Version Diff in Figma
- **Group:** DES
- **Master Task ID:** ATC-403
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401, ATC-306

**Description:**
Thiết kế modal nhập chỉ dẫn sinh lại (Regenerate) và giao diện so sánh 2 phiên bản.

**Acceptance Criteria:**
Bản vẽ Figma cho Regeneration Modal và Diff Viewer so sánh bài soạn.

**Deliverable:** Figma Regeneration Screens

---

### [FE-016] Implement Instruction-Based Regeneration Dialog and Version Selector
- **Group:** FE
- **Master Task ID:** ATC-403
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401, ATC-306

**Description:**
Xây dựng RegenerationModal cho phép giáo viên nhập prompt điều chỉnh và chọn phiên bản xem.

**Acceptance Criteria:**
Gửi yêu cầu sinh lại kèm parent_id; hiển thị phiên bản mới mà không mất bản cũ.

**Deliverable:** RegenerationModal.jsx

---

### [BE-027] Implement Content Regeneration API with Version Lineage
- **Group:** BE
- **Master Task ID:** ATC-403
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401, ATC-306

**Description:**
Tạo endpoint POST /api/workspaces/{id}/generation/{id}/regenerate tạo bản ghi mới với version = parent.version + 1.

**Acceptance Criteria:**
Bản ghi mới có version tăng dần, parent_id trỏ về bản cũ; dữ liệu cũ được bảo toàn.

**Deliverable:** RegenerationService.java

---

### [QA-025] Test Content Regeneration Version Increment and Lineage
- **Group:** QA
- **Master Task ID:** ATC-403
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-401, ATC-306

**Description:**
Kiểm thử sinh lại nhiều lần (v1 -> v2 -> v3) và xác minh tính toàn vẹn của cây phả hệ phiên bản.

**Acceptance Criteria:**
Bản ghi cũ không bị ghi đè; liên kết parent_id chính xác 100%.

**Deliverable:** Versioning Test Report

---

### [DES-013] Design Generation History Timeline and Version Tree in Figma
- **Group:** DES
- **Master Task ID:** ATC-404
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-403

**Description:**
Thiết kế trang danh sách lịch sử bài soạn và sơ đồ cây phiên bản trực quan.

**Acceptance Criteria:**
Bản vẽ Figma cho History List Page, Version Timeline và Revert Action.

**Deliverable:** Figma History Screens

---

### [FE-017] Implement Generation History List and Version Lineage Tree
- **Group:** FE
- **Master Task ID:** ATC-404
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-403

**Description:**
Xây dựng HistoryListPage và VersionTimeline hiển thị lịch sử bài soạn theo thời gian.

**Acceptance Criteria:**
Giáo viên xem được toàn bộ các bài soạn trong workspace và mở lại phiên bản cũ.

**Deliverable:** HistoryListPage.jsx & VersionTimeline.jsx

---

### [BE-028] Implement Generation History and Version Tree API
- **Group:** BE
- **Master Task ID:** ATC-404
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-403

**Description:**
Tạo endpoint GET /api/workspaces/{id}/generation/history và GET /api/workspaces/{id}/generation/{id}/lineage.

**Acceptance Criteria:**
Trả về danh sách bài soạn kèm thông tin phiên bản và chuỗi phả hệ version.

**Deliverable:** HistoryController.java

---

### [QA-026] Test Generation History Retrieval and Version Tree Navigation
- **Group:** QA
- **Master Task ID:** ATC-404
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-403

**Description:**
Kiểm thử truy xuất lịch sử và mở xem nội dung các phiên bản cũ.

**Acceptance Criteria:**
API trả về đúng danh sách bài soạn của workspace; không lẫn lộn dữ liệu.

**Deliverable:** History API Test Report

---

### [DES-014] Design Assessment Rubric Matrix and Criteria Editor in Figma
- **Group:** DES
- **Master Task ID:** ATC-405
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304, ATC-401

**Description:**
Thiết kế bảng ma trận Rubric đánh giá (tiêu chí, trọng số, các mức độ đạt chuẩn).

**Acceptance Criteria:**
Bản vẽ Figma cho Rubric Matrix Table và thanh chỉnh sửa tiêu chí.

**Deliverable:** Figma Rubric Screens

---

### [FE-018] Implement Assessment Rubric Table and Inline Criteria Editor
- **Group:** FE
- **Master Task ID:** ATC-405
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304, ATC-401

**Description:**
Xây dựng RubricTableView cho phép xem và chỉnh sửa các mức điểm tiêu chí đánh giá.

**Acceptance Criteria:**
Hiển thị bảng Rubric rõ ràng; hỗ trợ sửa trọng số và tiêu chí trên giao diện.

**Deliverable:** RubricTableView.jsx

---

### [BE-029] Implement Structured Assessment Rubric Generation Pipeline
- **Group:** BE
- **Master Task ID:** ATC-405
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304, ATC-401

**Description:**
Xây dựng pipeline sinh Rubric đánh giá có cấu trúc qua RubricSchema.

**Acceptance Criteria:**
Sinh Rubric đánh giá phù hợp với mục tiêu bài giảng; lưu vào CSDL với content_type='RUBRIC'.

**Deliverable:** rubric_generator.py

---

### [QA-027] Test Rubric Scoring Matrix and Curriculum Alignment
- **Group:** QA
- **Master Task ID:** ATC-405
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-304, ATC-401

**Description:**
Kiểm thử tính logic của thang điểm Rubric và độ bám sát yêu cầu cần đạt của bài học.

**Acceptance Criteria:**
Tổng trọng số điểm = 100% hoặc thang điểm 10 chuẩn; tiêu chí rõ ràng.

**Deliverable:** Rubric Test Report

---

### [DES-015] Design Student Exam Sheet and Teacher Answer Key in Figma
- **Group:** DES
- **Master Task ID:** ATC-406
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Designer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-401

**Description:**
Thiết kế layout phiếu đề thi cho học sinh và phiếu đáp án / hướng dẫn chấm cho giáo viên.

**Acceptance Criteria:**
Bản vẽ Figma cho mẫu đề thi học sinh (không đáp án) và phiếu hướng dẫn chấm.

**Deliverable:** Figma Quiz Export Layouts

---

### [FE-019] Implement Student Exam and Teacher Answer Key Export Controls
- **Group:** FE
- **Master Task ID:** ATC-406
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-401

**Description:**
Thêm tùy chọn xuất 'Đề thi học sinh' và 'Đáp án & Hướng dẫn chấm' trong Export Modal.

**Acceptance Criteria:**
Giáo viên tải được 2 file riêng biệt chỉ bằng 1 thao tác chọn lựa.

**Deliverable:** QuizExportControls.jsx

---

### [BE-030] Implement Student Quiz Sheet Export without Answers
- **Group:** BE
- **Master Task ID:** ATC-406
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-401

**Description:**
Mở rộng export engine tạo file Word/PDF đề thi sạch sẽ, ẩn toàn bộ đáp án và giải thích.

**Acceptance Criteria:**
File xuất ra chỉ có danh sách câu hỏi và các lựa chọn; không để lộ đáp án đúng.

**Deliverable:** QuizStudentDocxService.java

---

### [BE-031] Implement Teacher Answer Key and Grading Guide Export
- **Group:** BE
- **Master Task ID:** ATC-406
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-401

**Description:**
Mở rộng export engine tạo file Word/PDF hướng dẫn chấm chi tiết kèm ma trận Bloom.

**Acceptance Criteria:**
File xuất ra có đáp án, lời giải chi tiết, cấp độ Bloom và trích dẫn nguồn tham khảo.

**Deliverable:** QuizTeacherDocxService.java

---

### [QA-028] Test Student Quiz Sheet and Teacher Grading Guide Exports
- **Group:** QA
- **Master Task ID:** ATC-406
- **Sprint:** Sprint 4 - Quiz & Versioning
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-401

**Description:**
Kiểm thử đối chiếu file học sinh và file giáo viên để đảm bảo tuyệt đối không lộ đáp án.

**Acceptance Criteria:**
File học sinh sạch 100%; file giáo viên có lời giải và đáp án chính xác.

**Deliverable:** Quiz Export Test Report

---

### [BE-032] Set Up Spring Boot and FastAPI Testcontainers Integration Harness
- **Group:** BE
- **Master Task ID:** ATC-501
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-404

**Description:**
Cấu hình môi trường test tích hợp sử dụng Testcontainers (Postgres + MinIO) cho CI.

**Acceptance Criteria:**
Bộ test harness tự động khởi chạy containers sạch và dọn dẹp sau khi chạy test.

**Deliverable:** TestcontainersConfig.java

---

### [QA-029] Implement Automated End-to-End User Journey Test Suite
- **Group:** QA
- **Master Task ID:** ATC-501
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-404

**Description:**
Viết kịch bản test E2E tự động: Đăng ký -> Upload -> Ingest -> RAG -> Lesson -> Quiz -> Export.

**Acceptance Criteria:**
Toàn bộ luồng nghiệp vụ cốt lõi chạy thông suốt không có lỗi gián đoạn.

**Deliverable:** E2ETestSuite.java

---

### [QA-030] Validate Full Vertical Slice from Upload to Word Export
- **Group:** QA
- **Master Task ID:** ATC-501
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-307, ATC-404

**Description:**
Chạy và ghi nhận kết quả kiểm thử tự động trên luồng tích hợp hoàn chỉnh.

**Acceptance Criteria:**
100% kịch bản kiểm thử E2E pass xanh trên môi trường test tích hợp.

**Deliverable:** E2E Execution Report

---

### [BE-033] Implement RAG Retrieval Quality Metrics Logging
- **Group:** BE
- **Master Task ID:** ATC-502
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-401

**Description:**
Xây dựng module ghi nhận metrics đánh giá chất lượng RAG trong FastAPI.

**Acceptance Criteria:**
Ghi log độ tương đồng Cosine, thời gian truy xuất và số lượng chunk đạt chuẩn.

**Deliverable:** evaluation_logger.py

---

### [QA-031] Execute RAG Evaluation Benchmark across 20–30 K-12 Test Cases
- **Group:** QA
- **Master Task ID:** ATC-502
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-401

**Description:**
Thu thập và chạy benchmark trên bộ 20-30 tài liệu giáo khoa K-12 (Toán, Văn, KHTN, Sử, Địa).

**Acceptance Criteria:**
Bộ benchmark bao phủ đủ các khối lớp và định dạng tài liệu thực tế.

**Deliverable:** RAG Benchmark Dataset & Script

---

### [QA-032] Measure RAG Groundedness and Citation Precision Metrics
- **Group:** QA
- **Master Task ID:** ATC-502
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-303, ATC-401

**Description:**
Đo lường và lập báo cáo tỷ lệ Groundedness (mục tiêu >= 85%) và Citation Precision (>= 90%).

**Acceptance Criteria:**
Báo cáo chi tiết các trường hợp đạt chuẩn và các trường hợp cần tinh chỉnh prompt.

**Deliverable:** RAG Evaluation Benchmark Report

---

### [BE-034] Optimize pgvector Query Plans and HNSW Index Performance
- **Group:** BE
- **Master Task ID:** ATC-503
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** Medium
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302, ATC-502

**Description:**
Tinh chỉnh tham số HNSW index (m=16, ef_construction=64) và tối ưu HikariCP connection pool.

**Acceptance Criteria:**
Thời gian truy xuất vector pgvector giảm xuống < 200ms cho mỗi request tìm kiếm.

**Deliverable:** V2__optimize_hnsw_index.sql

---

### [OPS-006] Tune PostgreSQL Memory and pgvector Worker Configuration
- **Group:** OPS
- **Master Task ID:** ATC-503
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** Medium
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302, ATC-502

**Description:**
Cấu hình shared_buffers, work_mem và max_parallel_workers cho PostgreSQL container.

**Acceptance Criteria:**
Tối ưu hóa tài nguyên phần cứng, tránh nghẽn I/O khi tính toán vector.

**Deliverable:** postgresql.conf tuning

---

### [QA-033] Benchmark Vector Retrieval Latency under Concurrent Load
- **Group:** QA
- **Master Task ID:** ATC-503
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-302, ATC-502

**Description:**
Thực hiện kiểm thử tải (Load Testing) đo độ trễ truy vấn vector dưới tải đồng thời.

**Acceptance Criteria:**
Độ trễ truy vấn vector trung bình < 200ms; tổng thời gian sinh giáo án < 15s.

**Deliverable:** Performance Benchmark Report

---

### [FE-020] Implement Error Boundary and Toast Notifications for Upload Failures
- **Group:** FE
- **Master Task ID:** ATC-504
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-206

**Description:**
Cải thiện thông báo lỗi trên UI khi tài liệu bị lỗi phân tích hoặc quá tải.

**Acceptance Criteria:**
Hiển thị Toast lỗi rõ ràng kèm hướng dẫn khắc phục khi file không thể xử lý.

**Deliverable:** ErrorBoundary.jsx & ToastNotification.jsx

---

### [BE-035] Implement Exception Handlers for Corrupt Files and Empty Text
- **Group:** BE
- **Master Task ID:** ATC-504
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-206

**Description:**
Bổ sung xử lý ngoại lệ khi file PDF là file scan không có text layer hoặc file DOCX lỗi.

**Acceptance Criteria:**
Tự động đánh dấu tài liệu trạng thái FAILED kèm thông điệp lỗi chi tiết trong DB.

**Deliverable:** GlobalExceptionHandler.java & parsers.py

---

### [QA-034] Test File Ingestion Edge Cases for Corrupt and Scanned Files
- **Group:** QA
- **Master Task ID:** ATC-504
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-206

**Description:**
Kiểm thử hệ thống với tập file lỗi, file không có text, file mật khẩu bảo vệ.

**Acceptance Criteria:**
Hệ thống không bị crash (500); trả về thông báo lỗi thân thiện cho giáo viên.

**Deliverable:** Edge Case Test Report

---

### [BE-036] Harden Authorization Filters and System Prompt Injection Defense
- **Group:** BE
- **Master Task ID:** ATC-505
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-204, ATC-303

**Description:**
Rà soát toàn bộ route handlers, thêm kiểm tra quyền sở hữu và lọc ký tự độc hại trong prompt.

**Acceptance Criteria:**
Không có lỗ hổng IDOR; ngăn chặn hoàn toàn việc bypass ranh giới prompt.

**Deliverable:** SecurityHardeningPatch.java

---

### [QA-035] Conduct Penetration Testing on Cross-Workspace Leakage and Injections
- **Group:** QA
- **Master Task ID:** ATC-505
- **Sprint:** Sprint 5 - Testing & Optimization
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-204, ATC-303

**Description:**
Thực hiện kiểm thử xâm nhập (Pen-test) thử nghiệm truy cập trái phép chéo workspace và inject prompt.

**Acceptance Criteria:**
Báo cáo an ninh xác nhận không có rò rỉ dữ liệu giữa các giáo viên.

**Deliverable:** Security Audit & Pentest Report

---

### [OPS-007] Configure Multi-Stage Production Dockerfiles for All Services
- **Group:** OPS
- **Master Task ID:** ATC-601
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501

**Description:**
Viết Dockerfile multi-stage tối ưu dung lượng image và bảo mật cho 3 services.

**Acceptance Criteria:**
Image build nhẹ, non-root user và không chứa công cụ build thừa thãi.

**Deliverable:** Production Dockerfiles

---

### [OPS-008] Set Up Production Docker Compose with Isolated Internal Network
- **Group:** OPS
- **Master Task ID:** ATC-601
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501

**Description:**
Cấu hình docker-compose.prod.yml kết nối 5 services qua mạng nội bộ atc-network an toàn.

**Acceptance Criteria:**
Cổng PostgreSQL, FastAPI không bị lộ ra ngoài Internet; chỉ mở cổng Nginx 80/443.

**Deliverable:** docker-compose.prod.yml

---

### [QA-036] Test Production Container Startup and Inter-Service Networking
- **Group:** QA
- **Master Task ID:** ATC-601
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501

**Description:**
Kiểm thử khởi động cụm container production và kiểm tra giới hạn CPU/RAM.

**Acceptance Criteria:**
Toàn bộ container khởi chạy ổn định; giao tiếp nội bộ thông suốt qua service name.

**Deliverable:** Production Deployment Test Report

---

### [OPS-009] Configure Nginx Reverse Proxy, SSL and Security Headers
- **Group:** OPS
- **Master Task ID:** ATC-602
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601

**Description:**
Viết cấu hình nginx.conf định tuyến /api vào Spring Boot, static files cho React và bảo mật headers.

**Acceptance Criteria:**
Nginx chuyển hướng đúng SPA routes; cấu hình HTTPS SSL và security headers chuẩn A.

**Deliverable:** nginx.conf & SSL config

---

### [QA-037] Test Nginx API Routing, CORS Policies and Security Headers
- **Group:** QA
- **Master Task ID:** ATC-602
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601

**Description:**
Kiểm thử định tuyến API, xử lý CORS preflight và chấm điểm bảo mật HTTP headers.

**Acceptance Criteria:**
Không có lỗi CORS trên môi trường production; điểm bảo mật headers đạt chuẩn.

**Deliverable:** Nginx Security Audit Report

---

### [OPS-010] Automate PostgreSQL and MinIO Backups with Scheduled Cron Jobs
- **Group:** OPS
- **Master Task ID:** ATC-603
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** Medium
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601

**Description:**
Viết script backup_db.sh tự động dump database nén .sql.gz và đồng bộ dữ liệu MinIO.

**Acceptance Criteria:**
Script chạy tự động qua cron job hàng ngày và lưu trữ bản backup an toàn.

**Deliverable:** backup_db.sh & cron config

---

### [OPS-011] Document Disaster Recovery Runbook and Restoration Procedures
- **Group:** OPS
- **Master Task ID:** ATC-603
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** Medium
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601

**Description:**
Viết tài liệu hướng dẫn quy trình khôi phục hệ thống từ bản backup khi gặp sự cố.

**Acceptance Criteria:**
Tài liệu Runbook chi tiết từng bước khôi phục dữ liệu trên môi trường trắng.

**Deliverable:** Disaster_Recovery_Runbook.md

---

### [QA-038] Test Database Backup Integrity and Disaster Recovery Restoration
- **Group:** QA
- **Master Task ID:** ATC-603
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** Medium
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601

**Description:**
Kiểm thử thực tế khôi phục dữ liệu từ file backup lên máy chủ mới.

**Acceptance Criteria:**
Dữ liệu phục hồi nguyên vẹn 100% không bị mất mát hay lỗi index vector.

**Deliverable:** Backup Restoration Test Report

---

### [BE-037] Document OpenAPI Specifications and Backend Architecture
- **Group:** BE
- **Master Task ID:** ATC-604
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** Backend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505

**Description:**
Tổng hợp tài liệu Swagger/OpenAPI đầy đủ cho toàn bộ REST API của Spring Boot.

**Acceptance Criteria:**
File API_DOCS.md và Swagger UI hiển thị đủ mô tả request/response của 100% endpoints.

**Deliverable:** API_DOCS.md & OpenAPI Spec

---

### [FE-021] Document Frontend Architecture and State Management
- **Group:** FE
- **Master Task ID:** ATC-604
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** Frontend Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505

**Description:**
Tổng hợp tài liệu kiến trúc frontend, cấu trúc store Zustand và sơ đồ luồng dữ liệu.

**Acceptance Criteria:**
Tài liệu FRONTEND_ARCHITECTURE.md được cập nhật đồng bộ với mã nguồn thực tế.

**Deliverable:** Frontend Component Docs

---

### [OPS-012] Document DevOps Deployment Guide and Environment Cheat-Sheet
- **Group:** OPS
- **Master Task ID:** ATC-604
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** DevOps Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505

**Description:**
Viết tài liệu hướng dẫn triển khai hệ thống 1-click và bảng tra cứu biến môi trường.

**Acceptance Criteria:**
File README.md và Deployment Guide hướng dẫn chi tiết các bước setup từ đầu.

**Deliverable:** Deployment_Guide.md & README.md

---

### [QA-039] Produce Final Quality Assurance Report and Test Summary
- **Group:** QA
- **Master Task ID:** ATC-604
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505

**Description:**
Tổng hợp kết quả kiểm thử, ma trận độ bao phủ và báo cáo chất lượng RAG toàn dự án.

**Acceptance Criteria:**
Báo cáo tổng kết chất lượng SPQM hoàn chỉnh sẵn sàng cho hội đồng nghiệm thu.

**Deliverable:** Final QA & SPQM Report

---

### [QA-040] Execute Final System Acceptance Test Plan for 11 MVP Features
- **Group:** QA
- **Master Task ID:** ATC-605
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601, ATC-604

**Description:**
Kiểm thử nghiệm thu toàn diện 11 tính năng MVP theo đúng tiêu chí Acceptance Criteria.

**Acceptance Criteria:**
100% tính năng cốt lõi hoạt động trơn tru và đạt tiêu chuẩn nghiệm thu đồ án.

**Deliverable:** Final Acceptance Test Matrix

---

### [QA-041] Conduct End-to-End Product Demonstration Walkthrough
- **Group:** QA
- **Master Task ID:** ATC-605
- **Sprint:** Sprint 6 - Production & Handover
- **Priority:** High
- **Assignee Type:** QA Engineer
- **Status:** TO DO
- **Dependencies:** is blocked by ATC-601, ATC-604

**Description:**
Thực hiện kịch bản demo hoàn chỉnh: Upload tài liệu -> RAG -> Soạn giáo án -> Tạo Quiz -> Xuất file.

**Acceptance Criteria:**
Kịch bản demo chạy thông suốt, không phát sinh lỗi và làm nổi bật giá trị sản phẩm.

**Deliverable:** Demo Walkthrough Script & Video

---
