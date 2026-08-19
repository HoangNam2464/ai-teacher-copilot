# AI Teacher Copilot — Master Tasks & Feature Breakdown (Backlog)

> **Tài liệu nguồn định nghĩa toàn bộ User Stories, Feature Tasks, Git Branches và Tiêu chuẩn Nghiệm thu**
> Phục vụ theo dõi tiến độ và đối chiếu kỹ thuật trong suốt 6 tháng phát triển.

---

## 1. BẢNG TỔNG HỢP PHẠM VI 11 TÍNH NĂNG CỐT LÕI (MVP MATRIX)

| Mã Task | Phân Hệ / Tính Năng | Nhánh Git | Giai Đoạn (Phase) | Sprint (4 tuần) | Trạng Thái |
|---|---|---|---|---|---|
| **ATC-AUTH** | Authentication & User Management | `feature/authentication` | Phase 3 (Tuần 5-7) | **Sprint 2** | 🟡 Ready for Implementation |
| **ATC-WS** | Teacher Workspace & Isolation | `feature/workspace` | Phase 3 (Tuần 5-7) | **Sprint 2** | ⚪ Backlog |
| **ATC-DOC** | Document Upload & Storage (MinIO) | `feature/document-upload` | Phase 4 (Tuần 8-10) | **Sprint 2** | ⚪ Backlog |
| **ATC-PROC** | Document Parsing, Chunking & Embedding | `feature/document-processing` | Phase 4 (Tuần 8-10) | **Sprint 2** | ⚪ Backlog |
| **ATC-RAG** | RAG Retrieval Baseline (pgvector) | `feature/rag-retrieval` | Phase 5 (Tuần 11-14) | **Sprint 3** | ⚪ Backlog |
| **ATC-PLAN** | AI Lesson Planner (Structured Output) | `feature/lesson-planner` | Phase 5 (Tuần 11-14) | **Sprint 3** | ⚪ Backlog |
| **ATC-QUIZ** | Quiz Generator (Bloom Taxonomy Tagging) | `feature/quiz-generator` | Phase 6 (Tuần 15-19) | **Sprint 4** | ⚪ Backlog |
| **ATC-REV** | Review, Inline Edit & Document History | `feature/review-edit` | Phase 5-6 (Tuần 11-19) | **Sprint 3-4** | ⚪ Backlog |
| **ATC-CITE** | Citation & Provenance Resolution | `feature/citation` | Phase 5-6 (Tuần 11-19) | **Sprint 3-4** | ⚪ Backlog |
| **ATC-EXP** | Word (DOCX) & PDF Document Export | `feature/export` | Phase 5-6 (Tuần 11-19) | **Sprint 3-5** | ⚪ Backlog |
| **ATC-EVAL** | RAG Quality Evaluation & Checklists | `feature/evaluation` | Phase 7 (Tuần 20-22) | **Sprint 5** | ⚪ Backlog |

---

## 2. CHI TIẾT TỪNG TÍNH NĂNG (TASK BREAKDOWN)

---

### [ATC-AUTH] Authentication & User Management
* **Mục tiêu**: Cho phép giáo viên đăng ký tài khoản, đăng nhập an toàn, nhận JWT và phân quyền API.
* **Nhánh Git**: `feature/authentication`
* **Acceptance Criteria (AC)**:
  1. Đăng ký tài khoản với email, mật khẩu và họ tên; kiểm tra trùng lặp email.
  2. Mật khẩu được mã hóa BCrypt trước khi lưu database.
  3. Đăng nhập thành công trả về JWT token với claims `userId` và `email`.
  4. Token được gửi kèm trong header `Authorization: Bearer <token>` trên mọi request bảo vệ.
  5. Đăng xuất xóa token phía client; truy cập khi hết hạn nhận mã lỗi `401 Unauthorized`.
* **Task Breakdown**:
  - `[BE]` Cấu hình `SecurityConfig`, `JwtTokenProvider`, `JwtAuthenticationFilter`, `AuthService`.
  - `[FE]` Tạo `features/auth/` (LoginForm, RegisterForm, LoginPage), tích hợp `authStore` và Axios interceptor.
  - `[QA]` Viết unit test cho AuthController và AuthService với H2 database (`backend-ci.yml`).

---

### [ATC-WS] Teacher Workspace & Data Isolation
* **Mục tiêu**: Tạo không gian làm việc riêng cho từng giáo viên, phân lập dữ liệu tài liệu và bài soạn.
* **Nhánh Git**: `feature/workspace`
* **Acceptance Criteria (AC)**:
  1. Giáo viên tạo mới, xem danh sách, đổi tên và xóa workspace của mình.
  2. Workspace tự động gán `owner_id` từ JWT token.
  3. Truy cập vào workspace của giáo viên khác bị từ chối với mã lỗi `403 Forbidden`.
  4. Xóa workspace tự động xóa toàn bộ tài liệu, vector chunks và lịch sử bài soạn liên quan.
* **Task Breakdown**:
  - `[BE]` Tạo `WorkspaceController`, `WorkspaceService`, `WorkspaceRepository` với hàm `findAndAuthorize()`.
  - `[FE]` Tạo `features/workspace/` (WorkspaceCard, WorkspaceSelector, WorkspaceModal), lưu `activeWorkspace` trong `workspaceStore`.
  - `[QA]` Viết test kiểm tra phân lập dữ liệu chéo giữa 2 giáo viên.

---

### [ATC-DOC] Document Upload & MinIO Storage
* **Mục tiêu**: Giáo viên tải lên tài liệu giảng dạy (PDF, DOCX, TXT), lưu trữ file gốc và metadata.
* **Nhánh Git**: `feature/document-upload`
* **Acceptance Criteria (AC)**:
  1. Hỗ trợ định dạng PDF, DOCX, TXT; dung lượng tối đa 50MB.
  2. Tên file được sanitize chống tấn công Path Traversal.
  3. File gốc lưu vào MinIO bucket `documents` theo mẫu `{workspaceId}/{userId}/{documentId}_{filename}`.
  4. Metadata lưu vào bảng `documents` với trạng thái ban đầu `PENDING`.
  5. Bắn tín hiệu bất đồng bộ sang FastAPI `POST /ingestion/process` mà không block client.
* **Task Breakdown**:
  - `[BE]` Tạo `MinioConfig`, `DocumentController`, `DocumentService`, upload file lên MinIO.
  - `[FE]` Tạo `features/documents/` (DocumentUploader kéo thả file, DocumentTable hiển thị trạng thái).
  - `[QA]` Test upload file hợp lệ, file quá cỡ (413), định dạng không hỗ trợ (400).

---

### [ATC-PROC] Document Parsing, Chunking & Embedding (AI Service)
* **Mục tiêu**: Xử lý tài liệu thô thành các khối văn bản (chunks) và vector embedding lưu trong pgvector.
* **Nhánh Git**: `feature/document-processing`
* **Acceptance Criteria (AC)**:
  1. Parse PDF (`pypdf`) và DOCX (`python-docx`) giữ nguyên cấu trúc tiêu đề, số trang.
  2. Chunking theo cấu trúc: tối đa **512 tokens**, overlap **50 tokens**.
  3. Sinh vector embedding qua Provider Abstraction (`providers/base.py`) với kích thước **768-dim**.
  4. Lưu chunks và vector vào bảng `document_chunks` (pgvector HNSW index).
  5. Cập nhật trạng thái tài liệu `PROCESSING` → `READY` hoặc `FAILED`.
* **Task Breakdown**:
  - `[AI]` Xây dựng `parser.py`, `chunker.py`, `service.py` trong `ai-service/app/ingestion/`.
  - `[AI]` Tích hợp Gemini Embedding / OpenAI Embedding qua `providers/base.py`.
  - `[QA]` Test parsing file PDF/DOCX tiếng Việt thực tế, kiểm tra số lượng chunk và vector dimension.

---

### [ATC-RAG] RAG Retrieval Baseline
* **Mục tiêu**: Truy xuất các đoạn văn bản liên quan nhất từ kho tri thức dựa trên câu hỏi/yêu cầu.
* **Nhánh Git**: `feature/rag-retrieval`
* **Acceptance Criteria (AC)**:
  1. Embed câu truy vấn (query) bằng cùng model/dimension 768 với tài liệu.
  2. Truy vấn vector cosine distance (`<=>`) trong pgvector có lọc cứng `workspace_id`.
  3. Trả về top-k chunks (mặc định 5, tối đa 10) kèm số trang, tên tài liệu.
  4. Khi không có chunk phù hợp hoặc độ tương đồng quá thấp, trả về `insufficient_evidence: true`.
* **Task Breakdown**:
  - `[AI]` Xây dựng `ai-service/app/retrieval/service.py` với truy vấn SQLAlchemy pgvector.
  - `[AI]` Thiết lập logic kiểm tra `insufficient_evidence`.
  - `[QA]` Test truy vấn với từ khóa có trong tài liệu và từ khóa không có trong tài liệu.

---

### [ATC-PLAN] AI Lesson Planner (Structured Output)
* **Mục tiêu**: Sinh giáo án có cấu trúc dựa trên môn, lớp, chủ đề và tài liệu nguồn.
* **Nhánh Git**: `feature/lesson-planner`
* **Acceptance Criteria (AC)**:
  1. Đầu vào: Môn, Lớp, Chủ đề, Mục tiêu, Thời lượng, Chỉ dẫn thêm.
  2. RAG trích xuất context và đưa vào khối `<sources>...</sources>` trong prompt.
  3. LLM sinh dữ liệu tuân thủ strict Pydantic `LessonPlanSchema` (mục tiêu, các bước hoạt động, thời lượng).
  4. Trả về kèm danh sách `source_chunk_ids` phục vụ trích dẫn.
  5. Lưu bản nháp vào bảng `generated_contents` với `review_status = 'DRAFT'`.
* **Task Breakdown**:
  - `[BE]` Endpoint `POST /api/workspaces/{id}/generation/lesson-plan` điều phối sang AI Service.
  - `[AI]` Xây dựng prompt template an toàn và Pydantic `LessonPlanSchema` trong `ai-service/app/generation/`.
  - `[FE]` Giao diện soạn bài `LessonConfigForm` và `LessonSectionCard` hiển thị giáo án.
  - `[QA]` Test sinh giáo án với tài liệu đầy đủ và tài liệu rỗng (`insufficient_evidence`).

---

### [ATC-QUIZ] Quiz Generator (Bloom Taxonomy Tagging)
* **Mục tiêu**: Sinh bộ câu hỏi trắc nghiệm (MCQ) và tự luận ngắn, có gắn nhãn Bloom Taxonomy và giải thích chi tiết.
* **Nhánh Git**: `feature/quiz-generator`
* **Acceptance Criteria (AC)**:
  1. Đầu vào: Chủ đề, Số lượng câu hỏi (3-20), Loại câu hỏi, Độ khó, Mục tiêu mức độ Bloom.
  2. Mỗi câu hỏi MCQ có 4 đáp án (A, B, C, D), 1 đáp án đúng, giải thích căn cứ vào tài liệu nguồn.
  3. Tích hợp nhãn Bloom Taxonomy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) cho từng câu.
  4. Gắn `source_chunk_ids` cho từng câu hỏi độc lập.
* **Task Breakdown**:
  - `[AI]` Xây dựng Pydantic `QuizSchema`, `QuizQuestion` và prompt sinh đề thi.
  - `[BE]` Endpoint `POST /api/workspaces/{id}/generation/quiz` và lưu trữ JSONB vào database.
  - `[FE]` Giao diện `QuizConfigForm`, `MCQQuestionCard`, `BloomTaxonomyTag`.
  - `[QA]` Kiểm tra tính chính xác của đáp án đúng và nhãn Bloom Taxonomy.

---

### [ATC-REV] Review, Inline Edit & Document History
* **Mục tiêu**: Giáo viên kiểm tra, sửa trực tiếp trên giao diện hoặc yêu cầu AI tạo lại theo ý muốn.
* **Nhánh Git**: `feature/review-edit`
* **Acceptance Criteria (AC)**:
  1. Giáo viên sửa trực tiếp text trong từng phần giáo án/câu hỏi; lưu lại qua `PUT` không tốn lượt gọi LLM.
  2. Nút "Tạo lại (Regenerate)" cho phép nhập chỉ dẫn bổ sung, tạo ra bản ghi mới `version = version + 1`, liên kết qua `parent_id`.
  3. Xem danh sách lịch sử bài soạn theo workspace, chuyển đổi trạng thái `DRAFT` → `REVIEWED` → `APPROVED`.
* **Task Breakdown**:
  - `[BE]` Endpoints cập nhật `PUT /generation/{id}`, tạo lại `POST /generation/{id}/regenerate`, lịch sử `GET /history`.
  - `[FE]` Tích hợp chế độ sửa inline, modal nhập chỉ dẫn tạo lại, và component `VersionLineageTree`.
  - `[QA]` Test tạo lại phiên bản v1 → v2 → v3 và đối soát `parent_id`.

---

### [ATC-CITE] Citation & Provenance Resolution
* **Mục tiêu**: Đảm bảo mọi nội dung sinh ra đều có thể truy vết ngược về tài liệu gốc và số trang.
* **Nhánh Git**: `feature/citation`
* **Acceptance Criteria (AC)**:
  1. Giao diện hiển thị huy hiệu trích dẫn (Citation Badge) bên cạnh từng phần bài giảng / câu hỏi.
  2. Nhấn vào huy hiệu mở Drawer hiển thị: Tên tài liệu, Số trang, Đoạn trích nguồn (200 ký tự đầu).
  3. Endpoint giải mã citation `GET /citations/resolve?chunkIds=...` kiểm tra quyền workspace.
* **Task Breakdown**:
  - `[BE]` `CitationController`, `CitationService`, lưu bảng `content_citations`.
  - `[AI]` Endpoint tra cứu chunk `GET /retrieval/chunks?ids=...`.
  - `[FE]` Component `core/components/citation/CitationBadge.jsx` và `CitationDrawer.jsx`.
  - `[QA]` Test kiểm tra tính chính xác của số trang và tên file được trích dẫn.

---

### [ATC-EXP] Word (DOCX) & PDF Document Export
* **Mục tiêu**: Xuất giáo án và đề kiểm tra đã duyệt sang định dạng Word và PDF chuẩn in ấn.
* **Nhánh Git**: `feature/export`
* **Acceptance Criteria (AC)**:
  1. Xuất Lesson Plan sang file `.docx` và `.pdf` giữ nguyên cấu trúc tiêu đề, bảng biểu.
  2. Xuất Quiz sang file `.docx` và `.pdf` có chia phần câu hỏi và bảng đáp án/giải thích ở cuối trang.
  3. Tự động thêm mục "Tài liệu tham khảo" ở cuối trang liệt kê các tài liệu và số trang đã trích dẫn.
  4. Tải trực tiếp qua trình duyệt với đúng tên file định dạng `{loại}_{chủđề}_{ngày}.ext`.
* **Task Breakdown**:
  - `[BE]` Tích hợp Apache POI (`poi-ooxml`) và PDFBox/iText trong `com.aiteachercopilot.export`.
  - `[FE]` Tích hợp component `core/components/export/ExportDropdown.jsx` và `exportService.js`.
  - `[QA]` Mở thử file `.docx` trong Microsoft Word và `.pdf` trong trình duyệt kiểm tra hiển thị tiếng Việt UTF-8.

---

### [ATC-EVAL] RAG Quality Evaluation & Quality Checklist
* **Mục tiêu**: Đánh giá chất lượng RAG (Groundedness, Citation Coverage) trên 20–30 mẫu thử nghiệm.
* **Nhánh Git**: `feature/evaluation`
* **Acceptance Criteria (AC)**:
  1. Ghi log các chỉ số retrieval (top similarity score, số chunk tìm thấy).
  2. Bảng checklist đánh giá thủ công chất lượng đầu ra (Groundedness, Relevance, Acceptance Rate).
  3. Báo cáo đánh giá chất lượng RAG phục vụ nghiệm thu Phase 7.
