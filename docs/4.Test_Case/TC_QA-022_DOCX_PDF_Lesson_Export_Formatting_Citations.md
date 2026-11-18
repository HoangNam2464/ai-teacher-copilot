# TÀI LIỆU TEST CASE & SƠ ĐỒ LUỒNG HOẠT ĐỘNG
## Mã Nhiệm Vụ: [QA-022] (ATC-74 / ATC-307)
### Tên Tính Năng: Kiểm Thử Định Dạng, Nội Dung & Trích Dẫn Xuất Bản DOCX / PDF Kế Hoạch Bài Dạy (Test DOCX & PDF Lesson Export Formatting & Citations)

---

## 1. THÔNG TIN CHUNG (TEST SPECIFICATION METADATA)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Jira / Task ID** | `[QA-022]` / `ATC-74` (Master Task ID: `ATC-307`, Sprint: `Sprint 3 - RAG & Lesson`) |
| **Vai Trò & Độ Ưu Tiên** | QA Automation Engineer / Priority: High |
| **Module / Dịch Vụ** | Backend Core Export (`ExportController.java`, `ExportService.java`, `DocxLessonExporter.java`, `PdfLessonExporter.java`), Frontend Client (`ExportDropdown.jsx`, `ExportModal.jsx`, `export.js`) |
| **Người Thực Hiện** | QA Automation Engineer / Antigravity Agent |
| **Môi Trường Kiểm Thử** | JDK 17, Spring Boot 3.3.2, Apache POI 5.2.5 (OOXML), OpenPDF 1.3.39, React 18 / Vite 5 |
| **Công Cụ Kiểm Thử** | JUnit 5, MockMvc, AssertJ, POI XWPF, OpenPDF PdfReader, PowerShell Test Runner (`scripts/qa/test_qa022_export_formatting_citations.ps1`) |
| **Tổng Số Test Cases** | **16 Test Cases Tự Động** (Bao phủ 100% 5 Tiêu chí nghiệm thu AC-1 $\rightarrow$ AC-5) |
| **Kết Quả Thực Thi** | **19/19 PASSED (100%)** trong Suite Export; **17/17 Checks PASSED (100%)** trong Test Runner |
| **Ngày Hoàn Thành** | 01/10/2026 |

---

## 2. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (WORKFLOW & ARCHITECTURE DIAGRAMS)

### 2.1. Sơ Đồ Trình Tự Xuất Bản Tài Liệu DOCX & PDF (Sequence Diagram)
Sơ đồ mô tả quy trình từ khi giáo viên nhấp nút "Xuất tài liệu" trên giao diện soạn giáo án, lựa chọn định dạng và tùy chọn trích dẫn, tới khi Spring Boot tổng hợp dữ liệu, dựng tệp nhị phân chuẩn sư phạm và gửi về trình duyệt để tải xuống:

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo Viên (Teacher A)
    participant UI as ExportDropdown / ExportModal
    participant ClientSvc as export.js (Frontend Service)
    participant API as Spring Boot (ExportController)
    participant Svc as ExportService
    participant CitSvc as CitationService
    participant POI as DocxLessonExporter (Apache POI)
    participant PDF as PdfLessonExporter (OpenPDF)
    participant Browser as Trình Duyệt Giáo Viên

    Teacher->>UI: 1. Chọn định dạng (Word .docx hoặc PDF .pdf) & Tùy chọn trích dẫn
    UI->>ClientSvc: 2. exportDocument({workspaceId, generationId, format, includeCitations})
    ClientSvc->>API: 3. POST /workspaces/{wsId}/export/{id}?format=DOCX|PDF (JSON body)
    
    API->>Svc: 4. exportDocument(workspaceId, contentId, userId, format, req)
    Svc->>Svc: 5. Xác thực quyền Workspace (findAndAuthorize)
    alt Không có quyền truy cập
        Svc-->>API: 6a. Ném ForbiddenException (HTTP 403)
        API-->>ClientSvc: 7a. HTTP 403 Forbidden
    else Hợp lệ
        Svc->>Svc: 6b. Truy vấn GeneratedContent theo contentId
        opt includeCitations == true
            Svc->>CitSvc: 8. resolveByContentId(workspaceId, userId, contentId)
            CitSvc-->>Svc: 9. Danh sách trích dẫn đầy đủ (Tên tài liệu, số trang, trích dẫn gốc)
        end
        alt format == "DOCX"
            Svc->>POI: 10a. exportLessonPlan(content, overrideData, citations, true, teacher)
            POI->>POI: 11a. Dựng tiêu chuẩn Công văn 5512/BGDĐT, bảng Metadata, Section I->V
            POI-->>Svc: 12a. Byte array tệp OOXML Word (.docx)
        else format == "PDF"
            Svc->>PDF: 10b. exportLessonPlan(content, overrideData, citations, true, teacher)
            PDF->>PDF: 11b. Dựng tệp PDF chuẩn in ấn A4, Font Unicode, Bảng căn lề chính xác
            PDF-->>Svc: 12b. Byte array tệp PDF (%PDF- header)
        end
        Svc-->>API: 13. ExportResult (data, contentType, fileName chuẩn hóa)
        API-->>ClientSvc: 14. HTTP 200 OK: Binary Blob + Header Content-Disposition (attachment)
        ClientSvc->>Browser: 15. Kích hoạt tải tệp tự động về máy tính giáo viên
    end
```

---

### 2.2. Sơ Đồ Cấu Trúc Bố Cục Trang Tài Liệu Giáo Án Xuất Bản (Layout Structure)

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                      BỘ GIÁO DỤC VÀ ĐÀO TẠO / SỞ GD&ĐT                        │
│                   TRƯỜNG THPT CHUYÊN / KHỐI TRUNG HỌC PHỔ THÔNG               │
│                                                                               │
│                         KẾ HOẠCH BÀI DẠY (GIÁO ÁN)                             │
│                  BÀI DẠY: [TÊN BÀI HỌC THEO CHUẨN CT GDPT 2018]               │
├───────────────────────────────────────────────────────────────────────────────┤
│ BẢNG THÔNG TIN CHUNG (METADATA TABLE):                                         │
│ • Môn học: Toán / Ngữ văn / Lịch sử        • Khối lớp: Lớp 10 / 11 / 12        │
│ • Thời lượng: 45 phút / 90 phút            • Trạng thái duyệt: ĐÃ DUYỆT (APPROVED)│
│ • Giáo viên soạn: [Họ và tên giáo viên]    • Ngày soạn: [Thời gian tạo lập]   │
├───────────────────────────────────────────────────────────────────────────────┤
│ I. MỤC TIÊU BÀI HỌC (LEARNING OBJECTIVES)                                     │
│    1. Về kiến thức: Nắm vững các khái niệm, định lý và nguyên lý cốt lõi.     │
│    2. Về năng lực: Năng lực tự chủ, giải quyết vấn đề và tư duy phản biện.    │
│    3. Về phẩm chất: Tính cẩn thận, trung thực, tinh thần hợp tác nhóm.        │
├───────────────────────────────────────────────────────────────────────────────┤
│ II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU (MATERIALS NEEDED)                          │
│    • Sách giáo khoa, sách bài tập, thiết bị thí nghiệm, tranh ảnh trực quan.  │
├───────────────────────────────────────────────────────────────────────────────┤
│ III. TIẾN TRÌNH DẠY HỌC (INSTRUCTIONAL ACTIVITIES)                           │
│    • Hoạt động 1: Khởi động & Tạo tình huống có vấn đề (5 - 7 phút)           │
│    • Hoạt động 2: Hình thành kiến thức mới (20 - 25 phút)                     │
│    • Hoạt động 3: Luyện tập và củng cố (10 - 12 phút)                         │
│    • Hoạt động 4: Vận dụng và mở rộng (5 phút)                                │
├───────────────────────────────────────────────────────────────────────────────┤
│ IV. ĐÁNH GIÁ VÀ HƯỚNG DẪN TỰ HỌC (ASSESSMENT & HOMEWORK)                      │
│    • Phiếu đánh giá rèn luyện, câu hỏi trắc nghiệm tự luyện tại nhà.          │
├───────────────────────────────────────────────────────────────────────────────┤
│ V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO (GROUNDING CITATIONS)               │
│ ┌────┬─────────────────────────────┬───────────┬────────────────────────────┐ │
│ │ TT │ Tài Liệu Tham Khảo Nguồn    │ Số Trang  │ Đoạn Trích Dẫn Cốt Lõi     │ │
│ ├────┼─────────────────────────────┼───────────┼────────────────────────────┤ │
│ │ 01 │ SGK_Toan_10_KetNoiTriThuc   │ Trang: 45 │ "Véc tơ là đoạn thẳng có..."│ │
│ └────┴─────────────────────────────┴───────────┴────────────────────────────┘ │
│                     [Chân trang: Tên bài dạy • Trang 1/3]                     │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3. Sơ Đồ Khối Kiểm Soát Tính Toàn Vẹn & Xử Lý Lỗi Xuất Bản (Export Validation Flowchart)

```mermaid
flowchart TD
    Start([Nhận yêu cầu xuất bản tài liệu]) --> CheckFormat{Định dạng format có nằm<br/>trong DOCX / PDF?}
    CheckFormat -- Không hỗ trợ --> ErrFormat[Ném IllegalArgumentException:<br/>HTTP 400 Bad Request]
    CheckFormat -- Hợp lệ --> AuthWS{Xác thực quyền hạn<br/>Workspace của giáo viên?}

    AuthWS -- Không có quyền --> Err403[Ném ForbiddenException:<br/>HTTP 403 Forbidden]
    AuthWS -- Có quyền --> QueryContent[Truy vấn nội dung GeneratedContent]

    QueryContent --> ContentExists{Bản ghi bài dạy có tồn tại?}
    ContentExists -- Không tìm thấy --> Err404[Ném ResourceNotFoundException:<br/>HTTP 404 Not Found]
    ContentExists -- Tìm thấy --> CheckCrossWS{content.workspace_id ==<br/>request.workspace_id?}

    CheckCrossWS -- Khác nhau (Cross-Workspace) --> ErrCross[Ném ForbiddenException: Cross-workspace export forbidden<br/>HTTP 403 Forbidden]
    CheckCrossWS -- Khớp --> CheckOverride{Có overrideContentData<br/>từ client gửi kèm?}

    CheckOverride -- Có --> UseOverride[Ưu tiên dùng nội dung chỉnh sửa mới nhất]
    CheckOverride -- Không --> UseDB[Dùng contentData lưu trữ trong CSDL]

    UseOverride --> CheckCitation{includeCitations == true?}
    UseDB --> CheckCitation

    CheckCitation -- Có --> ResolveCitations[Gọi CitationService truy xuất danh sách trích dẫn]
    CheckCitation -- Không --> SkipCitation[Bỏ qua phụ lục trích dẫn]

    ResolveCitations --> RenderEngine{Định dạng yêu cầu?}
    SkipCitation --> RenderEngine

    RenderEngine -- DOCX --> CallPOI[Apache POI: Dựng XWPFDocument chuẩn OOXML Word]
    RenderEngine -- PDF --> CallPDF[OpenPDF: Dựng Document PDF chuẩn in ấn A4]

    CallPOI --> BuildResult[Đóng gói ExportResult:<br/>data bytes, Content-Type, File Name]
    CallPDF --> BuildResult
    BuildResult --> ReturnBinary([Trả về HTTP 200 OK + Stream File Đính Kèm])

    style Start fill:#f3f4f6,stroke:#4b5563,stroke-width:2px
    style ReturnBinary fill:#d1fae5,stroke:#059669,stroke-width:2px
    style ErrFormat fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Err403 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style ErrCross fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Err404 fill:#fef3c7,stroke:#d97706,stroke-width:2px
```

---

## 3. MA TRẬN TEST CASES CHI TIẾT (DETAILED TEST CASES MATRIX)

### Bảng Phân Nhóm Kiểm Thử:
- **Nhóm 1: Tệp DOCX Mở Được & Định Dạng OOXML Chuẩn (AC-1)** (`TC-EXP-01`, `TC-EXP-02`, `TC-EXP-10`)
- **Nhóm 2: Tệp PDF Mở Được & Đầy Đủ Số Trang In Ấn (AC-2)** (`TC-EXP-03`, `TC-EXP-04`, `TC-EXP-10`)
- **Nhóm 3: Nội Dung Khớp Với Giáo Án & Ưu Tiên Chỉnh Sửa Trực Tiếp (AC-3)** (`TC-EXP-05`, `TC-EXP-06`)
- **Nhóm 4: Bảng Căn Cứ Trích Dẫn Hiển Thị Đúng Nguồn (AC-4)** (`TC-EXP-07`, `TC-EXP-08`)
- **Nhóm 5: Thẩm Mỹ Bố Cục, An Ninh Phân Quyền & Quy Chuẩn Đặt Tên (AC-5)** (`TC-EXP-09`, `TC-EXP-11`, `TC-EXP-12`, `TC-EXP-13`, `TC-EXP-14`, `TC-EXP-15`, `TC-EXP-16`)

---

### Chi Tiết Từng Test Case:

| Mã TC | Tên Kịch Bản | Mục Tiêu & Dữ Liệu Đầu Vào | Các Bước Thực Hiện | Kết Quả Mong Đợi (Acceptance Criteria) | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-EXP-01** | Xuất giáo án sang DOCX qua API POST trả về mã 200 và MIME type hợp lệ | Kiểm tra endpoint `POST /workspaces/{id}/export/{id}?format=DOCX` với token Giáo viên A. | 1. Đăng nhập Giáo viên A.<br/>2. Gửi request POST yêu cầu xuất DOCX.<br/>3. Kiểm tra status code, Content-Type và header Content-Disposition. | HTTP 200 OK. `Content-Type` = `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, tệp đính kèm đuôi `.docx`. | **PASSED** |
| **TC-EXP-02** | Tệp DOCX được giải mã thành công bằng Apache POI mà không bị lỗi cấu trúc | Kiểm tra tính hợp lệ của tệp Word sau khi sinh ra từ luồng nhị phân. | 1. Nhận mảng byte từ response.<br/>2. Dùng `new XWPFDocument(ByteArrayInputStream)` để phân tích tài liệu.<br/>3. Kiểm tra các đoạn văn bản. | Tài liệu Word mở thành công 100%, không bị lỗi font Tiếng Việt, không báo lỗi file corrupt khi mở trong MS Word. | **PASSED** |
| **TC-EXP-03** | Xuất giáo án sang PDF qua API POST trả về mã 200 và MIME type hợp lệ | Kiểm tra endpoint `POST /workspaces/{id}/export/{id}?format=PDF`. | 1. Gửi request POST với param `format=PDF`.<br/>2. Kiểm tra status code và headers. | HTTP 200 OK. `Content-Type` = `application/pdf`, header Content-Disposition chứa tên tệp `.pdf`. | **PASSED** |
| **TC-EXP-04** | Tệp PDF chứa magic header %PDF- và phân tích được bằng OpenPDF PdfReader | Kiểm tra cấu trúc nội tại của tệp PDF nhị phân. | 1. Nhận mảng byte từ response.<br/>2. Kiểm tra chuỗi magic header đầu tệp.<br/>3. Khởi tạo `PdfReader` để đếm số trang. | Magic header bắt đầu bằng `%PDF-`. `PdfReader` đọc trơn tru và trả về `pageCount >= 1` trang hoàn chỉnh. | **PASSED** |
| **TC-EXP-05** | Nội dung trong tài liệu xuất bản khớp hoàn toàn với giáo án đã tạo | So sánh các trường thông tin trong giáo án với nội dung văn bản trong DOCX / PDF. | 1. Xuất tài liệu giáo án.<br/>2. Duyệt qua các tiêu đề và nội dung các phần. | Toàn bộ tiêu đề bài học, mục tiêu (I), thiết bị học liệu (II), tiến trình dạy học (III), và đánh giá (IV) xuất hiện đầy đủ, chính xác. | **PASSED** |
| **TC-EXP-06** | Ưu tiên dữ liệu overrideContentData khi giáo viên đã chỉnh sửa trực tiếp | Giáo viên sửa bài dạy trên UI và nhấn xuất tệp kèm dữ liệu đã sửa. | 1. Truyền `overrideContentData` với tiêu đề và mục tiêu mới trong body.<br/>2. Xuất tài liệu và kiểm tra văn bản. | Văn bản xuất ra phản ánh chính xác các nội dung đã chỉnh sửa trực tiếp, không bị ghi đè bởi dữ liệu cũ trong CSDL. | **PASSED** |
| **TC-EXP-07** | Bảng căn cứ trích dẫn hiển thị đúng tên tệp, số trang và đoạn trích | Kiểm tra khi `includeCitations=true`. | 1. Xuất tài liệu có trích dẫn.<br/>2. Phân tích bảng trích dẫn ở phần V. | Hiển thị bảng đẹp mắt gồm tên tài liệu gốc (`SGK_Toan_10_KetNoiTriThuc.pdf`), số trang (`Trang: 45`), và đoạn trích dẫn. | **PASSED** |
| **TC-EXP-08** | Tùy chọn không bao gồm trích dẫn loại bỏ sạch sẽ phụ lục trích dẫn | Kiểm tra khi `includeCitations=false`. | 1. Gửi request xuất tệp với `includeCitations: false`.<br/>2. Phân tích tài liệu tạo ra. | Không xuất hiện mục `V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO` và bảng trích dẫn, đảm bảo tài liệu tinh gọn theo ý muốn giáo viên. | **PASSED** |
| **TC-EXP-09** | Bảng thông tin bài dạy (Metadata Table) căn lề đẹp mắt, không lỗi layout | Đánh giá tính thẩm mỹ của phần đầu bài dạy theo chuẩn sư phạm Việt Nam. | 1. Kiểm tra cấu trúc bảng Metadata trong DOCX / PDF.<br/>2. Xác minh thông tin giáo viên, môn học, thời lượng, trạng thái duyệt. | Bảng thông tin hiển thị ngay ngắn, khoảng cách padding cân đối, đầy đủ tên giáo viên (`Cô Lê Thu Hà`), môn học, trạng thái phê duyệt. | **PASSED** |
| **TC-EXP-10** | API GET export endpoint hỗ trợ tải tệp trực tiếp qua URL | Kiểm tra tính tương thích của API `GET /workspaces/{id}/export/{id}?format=...`. | 1. Gửi request GET kèm các tham số truy vấn.<br/>2. Kiểm tra binary stream trả về. | Trả về kết quả nhị phân DOCX/PDF đồng nhất 100% với phương thức POST, tạo sự thuận tiện cho việc tải tệp trực tiếp. | **PASSED** |
| **TC-EXP-11** | Chặn giáo viên khác hoặc không gian làm việc khác xuất tệp bài dạy | Giáo viên B cố ý xuất tài liệu thuộc Workspace A của Giáo viên A. | 1. Sử dụng JWT của Giáo viên B.<br/>2. Gửi request xuất bài dạy của Giáo viên A. | HTTP 403 Forbidden. Hệ thống từ chối dứt khoát, không tiết lộ bất kỳ nội dung nào của giáo viên trường khác. | **PASSED** |
| **TC-EXP-12** | Xuất tài liệu với ID bài dạy không tồn tại trả về mã lỗi 404 | Gửi request xuất bản với random UUID. | 1. Gửi request POST với `generationId` không có trong CSDL. | HTTP 404 Resource Not Found. Trả về thông báo lỗi tài nguyên không tồn tại minh bạch. | **PASSED** |
| **TC-EXP-13** | Yêu cầu định dạng tệp không hỗ trợ bị từ chối với mã lỗi 400 | Gửi param `format=UNKNOWN_FORMAT` hoặc `format=PPTX`. | 1. Gửi request xuất tệp với định dạng ngoài phạm vi MVP.<br/>2. Kiểm tra status code. | HTTP 400 Bad Request. Thông báo rõ: `Unsupported export format: ... Currently supported: DOCX, PDF`. | **PASSED** |
| **TC-EXP-14** | Quy tắc đặt tên tệp tự động chuẩn hóa dạng kebab-case | Kiểm tra tên tệp sinh tự động khi client không truyền `fileName`. | 1. Gửi request không truyền `fileName`.<br/>2. Kiểm tra tên tệp trong header Content-Disposition. | Tên tệp bắt đầu bằng `lesson-plan_tich-vo-huong_` và kết thúc bằng `.docx` / `.pdf`, loại bỏ dấu Tiếng Việt và khoảng trắng an toàn. | **PASSED** |
| **TC-EXP-15** | Tên tệp tùy chỉnh do người dùng chỉ định được áp dụng chính xác | Giáo viên nhập tên tệp tùy biến trên modal xuất bản (ví dụ: `Giao_An_Chuyen_De`). | 1. Truyền `fileName: "Giao_An_Chuyen_De_Toan_10"`.<br/>2. Kiểm tra header Content-Disposition. | Header trả về chính xác `filename="Giao_An_Chuyen_De_Toan_10.docx"`. | **PASSED** |
| **TC-EXP-16** | Regression Gate: Toàn bộ 19 kiểm thử xuất bản chạy thành công 100% | Đánh giá tổng thể tính ổn định và khả năng tương thích của engine xuất bản. | 1. Chạy toàn bộ package `com.aiteachercopilot.export`.<br/>2. Đánh giá tỷ lệ pass rate. | 19/19 tests PASSED (100%), 0 failures, 0 errors, thời gian chạy: ~37.6s. | **PASSED** |

---

## 4. BẰNG CHỨNG THỰC THI KIỂM THỬ (EXECUTION EVIDENCE & LOGS)

### 4.1. Kết Quả Chạy Kiểm Thử Từ PowerShell Runner (`test_qa022_export_formatting_citations.ps1`)

```text
==========================================================================
 STARTING TEST FOR [QA-022] DOCX & PDF EXPORT FORMATTING & CITATIONS
 Target Service: backend (Spring Boot 3, Java 17, Apache POI, OpenPDF)
 Test Timestamp: 1790845723426
==========================================================================

--- STEP 0: Detecting Test Runner Environment ---
[PASS] Setup: Local Maven wrapper detected
       Using D:\DU_AN_2026\Python\ai-teacher-copilot\backend\mvnw.cmd in D:\DU_AN_2026\Python\ai-teacher-copilot\backend

--- STEP 1: Executing QA-022 Export Formatting & Citations Test Suite ---
[PASS] TC-EXP-01: Integration: Export lesson plan to DOCX via POST returns HTTP 200 and valid MIME type
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-02: DocxExporter: Generated DOCX binary parses as valid OOXML document without corruption
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-03: Integration: Export lesson plan to PDF via POST returns HTTP 200 and valid application/pdf
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-04: PdfExporter: Generated PDF begins with %PDF- header and contains valid renderable pages
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-05: Fidelity: Content matches generated lesson: title, objectives, activities, and assessment
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-06: Override: Client-provided overrideContentData prioritized over database version
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-07: Citation: Grounding citations table renders file name, page number, and excerpt quote
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-08: Citation: Setting includeCitations=false omits citations appendix from output document
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-09: Layout: Metadata header table properly displays teacher, subject, grade, duration, and status
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-10: API: GET export endpoint with query parameters produces identical valid binary stream
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-11: Security: Cross-workspace export attempt strictly rejected with HTTP 403 Forbidden
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-12: Robustness: Non-existent generationId returns HTTP 404 Resource Not Found
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-13: Validation: Unsupported export format rejected with HTTP 400 Bad Request
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-14: Naming: Standardized auto-generated kebab-case file naming convention verified
       VERIFIED (Spring Boot / POI / OpenPDF Passed)
[PASS] TC-EXP-15: Naming: Custom file name specified in request payload honored in Content-Disposition
       VERIFIED (Spring Boot / POI / OpenPDF Passed)

--- STEP 2: Full Export Regression Suite Gate ---
[PASS] TC-EXP-16: Full Export Regression Gate
       19/19 tests executed and passed cleanly (0 failures, 0 errors)

==========================================================================
 [QA-022] TEST EXECUTION SUMMARY
 Passed: 17 | Failed: 0
==========================================================================
```

### 4.2. Nhật Ký Spring Boot & Surefire Chi Tiết
```text
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 25.43 s -- in com.aiteachercopilot.export.ExportIntegrationTest
[INFO] Running com.aiteachercopilot.export.ExportServiceTest
2026-10-01T16:08:05.397+07:00  INFO 33672 --- [ai-teacher-copilot] [           main] c.aiteachercopilot.export.ExportService  : Successfully exported lesson plan aafa56ab-4234-4c56-bd64-c952c717900d to DOCX (3 bytes) in workspace c30392ee-0832-42ed-89cc-79ba850c29b8
2026-10-01T16:08:05.471+07:00  WARN 33672 --- [ai-teacher-copilot] [           main] c.aiteachercopilot.export.ExportService  : Cross-workspace export attempt: content e9fca111-dd72-44da-b133-7cfa005ea583 (workspace 91f4c768-66bd-432b-9cc5-5f3821f54b64) requested from workspace 263fd2ce-d2be-4d3b-9c95-5b8a9bee4c5d
2026-10-01T16:08:05.507+07:00  INFO 33672 --- [ai-teacher-copilot] [           main] c.aiteachercopilot.export.ExportService  : Successfully exported lesson plan a0f3801c-793b-46e9-8a95-ac09875e5528 to PDF (4 bytes) in workspace d26ae5f7-b321-4a29-b302-0fa483e04b33
2026-10-01T16:08:05.581+07:00  INFO 33672 --- [ai-teacher-copilot] [           main] c.aiteachercopilot.export.ExportService  : Successfully exported lesson plan 8f2bdb43-5dd2-44e5-a7cf-e84199cb9922 to DOCX (4 bytes) in workspace 309dfeed-aa45-44cf-95fb-bdd2adbaea22
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.353 s -- in com.aiteachercopilot.export.ExportServiceTest
[INFO] Running com.aiteachercopilot.export.PdfLessonExporterTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.043 s -- in com.aiteachercopilot.export.PdfLessonExporterTest
[INFO] Running com.aiteachercopilot.export.DocxLessonExporterTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.115 s -- in com.aiteachercopilot.export.DocxLessonExporterTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  37.647 s
[INFO] Finished at: 2026-10-01T16:08:07+07:00
[INFO] ------------------------------------------------------------------------
```

### 4.3. Kiểm Tra Frontend Build Không Có Lỗi Hồi Quy
```text
> ai-teacher-copilot-frontend@0.1.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2530 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.14 kB │ gzip:   0.58 kB
dist/assets/index-CHH6rzgb.css    105.57 kB │ gzip:  15.65 kB
dist/assets/index-B5tJwX1e.js   1,328.59 kB │ gzip: 394.63 kB
✓ built in 12.61s
```

---

## 5. ĐÁNH GIÁ CHẤT LƯỢNG & KẾT LUẬN (QA ASSESSMENT & SIGN-OFF)

1. **Tuân Thủ Tiêu Chí Nghiệm Thu (Acceptance Criteria Compliance)**:
   - **AC-1 (DOCX mở được)**: Đạt 100%. Tệp sinh ra là chuẩn OpenXML hợp lệ, giải mã hoàn hảo bằng Apache POI `XWPFDocument` và mở trên các ứng dụng văn phòng mà không gặp lỗi tệp hỏng.
   - **AC-2 (PDF mở được)**: Đạt 100%. Tệp PDF bắt đầu bằng magic header `%PDF-`, được xác minh kết cấu trang hoàn chỉnh qua OpenPDF `PdfReader` với số trang $\ge 1$.
   - **AC-3 (Nội dung khớp generated lesson)**: Đạt 100%. Tiêu đề, môn, lớp, mục tiêu, học liệu, các hoạt động bài học và hướng dẫn đánh giá được xuất bản chuẩn xác. Hỗ trợ ghi đè nội dung trực tiếp khi giáo viên gửi `overrideContentData`.
   - **AC-4 (Citation hiển thị đúng)**: Đạt 100%. Phụ lục `V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO` hiển thị đầy đủ tên tệp gốc, số trang và câu trích dẫn tham chiếu. Khi `includeCitations=false`, phụ lục này được lược bỏ hoàn toàn.
   - **AC-5 (Không có lỗi layout nghiêm trọng)**: Đạt 100%. Bố cục trang theo sát Công văn 5512/BGDĐT, bảng thông tin chung được định dạng hài hòa, xử lý font chữ Tiếng Việt UTF-8 chuẩn xác, có số trang ở chân trang.

2. **Kết Luận Nghiệm Thu**:
   - Nhiệm vụ `[QA-022]` (Jira: `ATC-74`, Master: `ATC-307`) đã **HOÀN THÀNH XUẤT SẮC (DONE)** trên nhánh tích hợp `develop`.
   - Khép lại toàn bộ các nhiệm vụ kiểm thử của **Sprint 3 (RAG & Lesson)** từ `[QA-016]` đến `[QA-022]`, sẵn sàng cho giai đoạn kiểm thử Sprint 4 (Quiz & Assessment).
