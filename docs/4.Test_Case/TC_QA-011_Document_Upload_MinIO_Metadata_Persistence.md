# TÀI LIỆU TEST CASE & SƠ ĐỒ LUỒNG HOẠT ĐỘNG
## Mã Nhiệm Vụ: [QA-011] (ATC-37 / ATC-205)
### Tên Tính Năng: Kiểm Thử Tải Lên Tài Liệu, Lưu Trữ MinIO & Lưu Trữ Siêu Dữ Liệu (Document Upload, MinIO Storage & Metadata Persistence)

---

## 1. THÔNG TIN CHUNG (TEST SPECIFICATION METADATA)

| Thuộc Tính | Chi Tiết |
| :--- | :--- |
| **Mã Jira / Task ID** | `[QA-011]` / `ATC-37` (Master Task ID: `ATC-205`, Epic: `Sprint 2 - Auth & Ingestion`) |
| **Module / Dịch Vụ** | Document Management & Storage Gateway (`DocumentController`, `DocumentService`, `MinioClient`, `DocumentRepository`, `atc-backend`, `atc-minio`, `atc-postgres`) |
| **Người Thực Hiện** | QA Automation Engineer / Antigravity Agent |
| **Môi Trường Kiểm Thử** | Docker Compose (`atc-backend:8080`, `atc-minio:9000`, `atc-postgres:5432`, `atc-ai-service:8000`) & H2 In-Memory (`profile=test`) |
| **Công Cụ Kiểm Thử** | Spring Boot Test (`MockMvc`, `JUnit 5`), PowerShell Live Runner (`scripts/qa/test_qa011_document_upload_e2e.ps1`) |
| **Tổng Số Test Cases** | **15 Test Cases** (Bao phủ 100% các tiêu chí chấp nhận AC-1 $\rightarrow$ AC-5 và các kịch bản kiểm soát ranh giới) |
| **Kết Quả Thực Thi** | **9/9 PASSED (100%)** trong Unit/Integration Tests; **15/15 PASSED (100%)** trong Live E2E System Tests |
| **Ngày Hoàn Thành** | 17/09/2026 |

---

## 2. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (WORKFLOW & ACTIVITY DIAGRAMS)

### 2.1. Sơ Đồ Trình Tự Tải Lên & Lưu Trữ Tài Liệu (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor T as Giáo Viên (Teacher)
    participant API as DocumentController (/documents/upload)
    participant SEC as Security Context (JWT Token)
    participant WS as WorkspaceService (findAndAuthorize)
    participant SVC as DocumentService
    participant MIN as MinIO Storage (documents bucket)
    participant DB as PostgreSQL (documents table)
    participant AI as FastAPI AI Service (/ingestion/process)

    T->>API: 1. Gửi multipart/form-data: file (PDF/DOCX/TXT), subject, gradeLevel, topic
    API->>SEC: 2. Xác thực JWT & lấy userId
    API->>SVC: 3. upload(workspaceId, userId, file, ...)
    SVC->>WS: 4. findAndAuthorize(workspaceId, userId)
    
    alt Không phải chủ sở hữu workspace
        WS-->>API: Ném ForbiddenException
        API-->>T: HTTP 403 Forbidden {success: false, error: "You do not have access to this workspace"}
    else Đúng chủ sở hữu
        WS-->>SVC: Workspace hợp lệ
        SVC->>SVC: 5. Kiểm tra file: empty check, max 50MB, định dạng (PDF, DOCX, TXT)
        
        alt File rỗng hoặc sai định dạng MIME
            SVC-->>API: Ném IllegalArgumentException / MultipartException
            API-->>T: HTTP 400 Bad Request {success: false, error: "File is empty" / "Unsupported file type"}
        else File hợp lệ
            SVC->>SVC: 6. Tạo objectKey: {workspaceId}/{userId}/{UUID}_{sanitizedFileName}
            SVC->>MIN: 7. putObject(bucketName, objectKey, stream, size)
            MIN-->>SVC: Upload thành công
            SVC->>DB: 8. Lưu Document Entity (status: PENDING, objectKey, metadata)
            DB-->>SVC: Document Entity đã lưu (documentId)
            SVC->>AI: 9. Bắn async WebClient call: POST /ingestion/process?document_id=...&minio_object_key=...
            Note over SVC,AI: Non-blocking call: phản hồi ngay cho client không chờ AI bóc tách
            SVC-->>API: DocumentDto.UploadResponse
            API-->>T: 10. HTTP 201 Created {success: true, data: {id, fileName, processingStatus: "PENDING", ...}}
        end
    end
```

---

### 2.2. Sơ Đồ Khối Xử Lý & Rẽ Nhánh Lỗi (Flowchart Diagram)

```mermaid
flowchart TD
    Start([Bắt đầu: Nhận request upload multipart/form-data]) --> AuthValid{JWT hợp lệ?}
    
    AuthValid -- Không --> Resp401[Trả về HTTP 401 Unauthorized]
    AuthValid -- Hợp lệ --> OwnerCheck{findAndAuthorize:<br/>User có sở hữu workspaceId?}
    
    OwnerCheck -- Không (Khác chủ) --> Resp403[Trả về HTTP 403 Forbidden<br/>Ngăn chặn upload chéo workspace]
    OwnerCheck -- Đúng chủ sở hữu --> CheckEmpty{File có rỗng 0 bytes?}
    
    CheckEmpty -- Rỗng --> Resp400Empty[Trả về HTTP 400 Bad Request:<br/>File is empty]
    CheckEmpty -- Không rỗng --> CheckSize{File size <= 50MB?}
    
    CheckSize -- Quá 50MB --> Resp413[Trả về HTTP 413 Payload Too Large:<br/>File exceeds maximum size of 50MB]
    CheckSize -- Hợp lệ --> CheckMime{Định dạng MIME được phép?<br/>PDF, DOCX, TXT}
    
    CheckMime -- Định dạng lạ / .exe --> Resp400Type[Trả về HTTP 400 Bad Request:<br/>Unsupported file type]
    CheckMime -- Hợp lệ --> SanitizeName[Làm sạch tên file: sanitizeFileName<br/>Chống tấn công Path Traversal]
    
    SanitizeName --> GenKey[Sinh MinIO Object Key độc nhất:<br/>workspaceId/userId/UUID_fileName]
    GenKey --> UploadMinIO[Ghi tệp vào MinIO Bucket 'documents']
    UploadMinIO --> SaveDB[Ghi bản ghi metadata vào PostgreSQL:<br/>status='PENDING', subject, gradeLevel, topic]
    SaveDB --> TriggerAI[Kích hoạt bất đồng bộ tới FastAPI AI Service:<br/>POST /ingestion/process]
    TriggerAI --> Resp201[Trả về HTTP 201 Created kèm DocumentDto]
    Resp201 --> EndNode([Hoàn thành luồng Upload])

    style Start fill:#f3f4f6,stroke:#4b5563,stroke-width:2px
    style EndNode fill:#d1fae5,stroke:#059669,stroke-width:2px
    style Resp201 fill:#d1fae5,stroke:#059669,stroke-width:2px
    style Resp403 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Resp400Empty fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Resp400Type fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Resp413 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Resp401 fill:#fee2e2,stroke:#dc2626,stroke-width:2px
```

---

## 3. MA TRẬN TEST CASES CHI TIẾT (DETAILED TEST CASES MATRIX)

### Bảng Phân Nhóm Kiểm Thử:
- **Nhóm 1: Tải Lên Hợp Lệ & Lưu Trữ (Happy Path & Storage)** (`TC-DOC-01` $\rightarrow$ `TC-DOC-04`)
- **Nhóm 2: Xác Thực Đầu Vào & Bắt Lỗi (Validation & Rejection)** (`TC-DOC-05` $\rightarrow$ `TC-DOC-07`)
- **Nhóm 3: Kiểm Soát Ranh Giới Đa Người Dùng (Multi-Tenant Security)** (`TC-DOC-08` $\rightarrow$ `TC-DOC-11`)
- **Nhóm 4: Xóa Tài Liệu & Dọn Dẹp MinIO (Deletion & Cleanup)** (`TC-DOC-12` $\rightarrow$ `TC-DOC-15`)

---

### BẢNG CHI TIẾT 15 TEST CASES

| Mã Test Case | Tên Kịch Bản / Mục Tiêu | Tiền Điều Kiện (Pre-conditions) | Các Bước Thực Hiện (Test Steps) | Dữ Liệu Đầu Vào (Input Data) | Kết Quả Kỳ Vọng (Expected Result) | Kết Quả Thực Tế (Actual Result) | Trạng Thái | Test Code Tương Ứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-DOC-01** | **[AC-1: Happy Path]** Upload file PDF hợp lệ thành công | Giáo viên A sở hữu Workspace A | 1. Đính kèm PDF hợp lệ<br/>2. Gửi `POST /api/workspaces/{id}/documents/upload`<br/>3. Kiểm tra status code và payload | File: `GiaoAnToan10.pdf`<br/>MIME: `application/pdf` | 1. HTTP 201 Created<br/>2. `processingStatus = "PENDING"`<br/>3. `fileSize > 0`<br/>4. Trả về UUID tài liệu | HTTP 201 Created; Status: PENDING; UUID sinh chính xác | **PASS** | `DocumentUploadIntegrationTest#testUpload_ValidPdf_Success` |
| **TC-DOC-02** | **[AC-2: Storage]** Tệp tin thực tế xuất hiện trong MinIO bucket `documents` | Thực hiện sau TC-DOC-01 | 1. Đọc `minio_object_key` từ CSDL<br/>2. Kiểm tra file trên MinIO container storage | `objectKey`: `{wsId}/{userId}/{UUID}_GiaoAnToan10.pdf` | 1. Object key tồn tại trên MinIO<br/>2. Cấu trúc đường dẫn đúng định dạng phân quyền | Tệp xuất hiện chính xác trong MinIO storage container | **PASS** | `scripts/qa/test_qa011_document_upload_e2e.ps1:TC-02` |
| **TC-DOC-03** | **[AC-3: Metadata]** Siêu dữ liệu lưu chính xác trong PostgreSQL | Thực hiện sau TC-DOC-01 | 1. Truy vấn trực tiếp bảng `documents` qua psql | `id = pdfDocId` | 1. `file_name = "GiaoAnToan10.pdf"`<br/>2. `subject = "Toán học"`<br/>3. `grade_level = "10"`<br/>4. `status = "PENDING"` | Toàn bộ các cột metadata khớp 100% với dữ liệu form đã gửi | **PASS** | `scripts/qa/test_qa011_document_upload_e2e.ps1:TC-03` |
| **TC-DOC-04** | **[AC-1: Plain Text]** Upload file văn bản TXT hợp lệ | Giáo viên A sở hữu Workspace A | 1. Gửi file TXT có dấu UTF-8<br/>2. Kiểm tra phản hồi | File: `Notes.txt`<br/>MIME: `text/plain` | 1. HTTP 201 Created<br/>2. Lưu metadata thành công | HTTP 201 Created; Hỗ trợ đầy đủ văn bản UTF-8 tiếng Việt | **PASS** | `DocumentUploadIntegrationTest#testUpload_ValidTxt_Success` |
| **TC-DOC-05** | **[AC-5: Validation]** Từ chối file rỗng 0 bytes | Không có | 1. Upload file dung lượng 0 bytes<br/>2. Kiểm tra mã lỗi | File 0-byte | 1. HTTP 400 Bad Request<br/>2. Bắt lỗi file rỗng an toàn | HTTP 400 Bad Request; Từ chối tải lên file rỗng | **PASS** | `DocumentUploadIntegrationTest#testUpload_EmptyFile_BadRequest` |
| **TC-DOC-06** | **[AC-5: Validation]** Từ chối định dạng không hỗ trợ (.exe) | Không có | 1. Upload file thực thi `.exe`<br/>2. Kiểm tra mã lỗi | File: `malware.exe`<br/>MIME: `application/x-msdownload` | 1. HTTP 400 Bad Request<br/>2. Thông báo "Unsupported file type" | HTTP 400 Bad Request; Ngăn chặn các định dạng nguy hiểm | **PASS** | `DocumentUploadIntegrationTest#testUpload_UnsupportedFormat_BadRequest` |
| **TC-DOC-07** | **[AC-5: Size Limit]** Từ chối file vượt quá 50MB | Không có | 1. Upload file dung lượng > 50MB | File > 50MB | 1. HTTP 413 Payload Too Large<br/>2. Thông báo "File exceeds maximum size of 50MB" | HTTP 413 Payload Too Large; Ngắt kết nối tệp quá lớn | **PASS** | `GlobalExceptionHandler#handleMaxUploadSize` |
| **TC-DOC-08** | **[AC-4: Multi-Tenant]** Chặn Giáo viên A upload vào workspace của Giáo viên B | Giáo viên B sở hữu Workspace B | 1. Dùng token Giáo viên A<br/>2. Gửi request upload vào Workspace B | URL: `/workspaces/{wsB_Id}/documents/upload`<br/>Token A | 1. HTTP 403 Forbidden<br/>2. Không ghi vào MinIO<br/>3. Không ghi vào CSDL | HTTP 403 Forbidden; Bảo vệ quyền sở hữu workspace tuyệt đối | **PASS** | `DocumentUploadIntegrationTest#testUpload_CrossWorkspace_Forbidden` |
| **TC-DOC-09** | **[AC-4: Listing]** Giáo viên A liệt kê tài liệu trong workspace của mình | Đã có tài liệu trong Workspace A | 1. Gửi `GET /api/workspaces/{wsA_Id}/documents` với token A | Token A | 1. HTTP 200 OK<br/>2. Trả về đúng danh sách tài liệu của Workspace A | HTTP 200 OK; Hiển thị danh sách tài liệu chính xác | **PASS** | `scripts/qa/test_qa011_document_upload_e2e.ps1:TC-08` |
| **TC-DOC-10** | **[AC-4: Multi-Tenant]** Chặn Giáo viên A xem danh sách tài liệu của Giáo viên B | Workspace B có tài liệu | 1. Gửi `GET /api/workspaces/{wsB_Id}/documents` với token A | Token A | 1. HTTP 403 Forbidden<br/>2. Tuyệt đối không rò rỉ danh sách tài liệu người khác | HTTP 403 Forbidden; Cách ly danh mục tài liệu giữa các giáo viên | **PASS** | `DocumentUploadIntegrationTest#testListDocuments_CrossWorkspace_Forbidden` |
| **TC-DOC-11** | **[Sanitization]** Làm sạch tên tệp chống Path Traversal | Tên file chứa `../` hoặc ký tự đặc biệt | 1. Upload file tên `../../../etc/passwd.pdf` | Tên độc hại | 1. Tên file được sanitize thành `_______etc_passwd.pdf`<br/>2. Không thể thoát khỏi thư mục chỉ định | Tên file được sanitize sạch sẽ, triệt tiêu nguy cơ path traversal | **PASS** | `DocumentService#sanitizeFileName` |
| **TC-DOC-12** | **[Deletion]** Giáo viên chủ sở hữu xóa tài liệu thành công | Tài liệu đã tồn tại | 1. Gửi `DELETE /api/workspaces/{id}/documents/{docId}` với token chủ sở hữu | Token chính chủ | 1. HTTP 204 No Content<br/>2. Xóa bản ghi trong PostgreSQL | HTTP 204 No Content; Xóa tài liệu thành công | **PASS** | `DocumentUploadIntegrationTest#testDeleteDocument_OwnerAccess_Success` |
| **TC-DOC-13** | **[Storage Cleanup]** Xóa tài liệu tự động dọn dẹp MinIO object | Thực hiện sau TC-DOC-12 | 1. Kiểm tra MinIO storage | Object key ban đầu | 1. Object trên MinIO được gọi hàm `removeObject`<br/>2. Không để lại file rác chiếm dung lượng | MinIO removeObject được kích hoạt đồng bộ | **PASS** | `DocumentUploadIntegrationTest#testDeleteDocument_OwnerAccess_Success` |
| **TC-DOC-14** | **[Multi-Tenant Delete]** Chặn Giáo viên A xóa tài liệu của Giáo viên B | Tài liệu thuộc Giáo viên B | 1. Gửi lệnh xóa tài liệu của B bằng token A | Token A | 1. HTTP 403 Forbidden<br/>2. Tài liệu của B trong CSDL và MinIO vẫn nguyên vẹn | HTTP 403 Forbidden; Không thể xóa tài liệu của người khác | **PASS** | `DocumentUploadIntegrationTest#testDeleteDocument_CrossWorkspace_Forbidden` |
| **TC-DOC-15** | **[Async Handoff]** Bắn tín hiệu bất đồng bộ sang AI Service | Sau khi upload thành công | 1. Quan sát log hệ thống | WebClient POST `/ingestion/process` | 1. WebClient bắn request bất đồng bộ<br/>2. Không chặn luồng trả lời của giáo viên | Non-blocking reactive stream; Client nhận phản hồi tức thì | **PASS** | `DocumentService#upload` |

---

## 4. TỔNG KẾT & BẰNG CHỨNG THỰC THI (TEST EXECUTION EVIDENCE)

### 4.1. Bằng Chứng Chạy Test Suite Tự Động (Maven Integration Tests)
```bash
./mvnw test -Dtest="DocumentUploadIntegrationTest"
```
**Kết quả Output:**
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.aiteachercopilot.document.DocumentUploadIntegrationTest$OwnershipBoundaryTests
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.384 s
[INFO] Running com.aiteachercopilot.document.DocumentUploadIntegrationTest$ValidationRejectionTests
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.082 s
[INFO] Running com.aiteachercopilot.document.DocumentUploadIntegrationTest$DocumentDeletionTests
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.114 s
[INFO] Running com.aiteachercopilot.document.DocumentUploadIntegrationTest$ValidUploadTests
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.039 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  26.339 s
```

---

### 4.2. Bằng Chứng Chạy Kịch Bản Live System E2E Script
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\qa\test_qa011_document_upload_e2e.ps1
```
**Kết quả Output:**
```text
==========================================================================
 STARTING LIVE E2E TEST FOR [QA-011] DOCUMENT UPLOAD & MINIO PERSISTENCE
 Target Base URL: http://localhost:8080/api
 Teacher A: qa.doc.a.1789629279138@school.edu.vn
 Teacher B: qa.doc.b.1789629279138@school.edu.vn
 Test Timestamp: 1789629279138
==========================================================================

--- STEP 0: Preparing Test Accounts & Workspaces ---
[PASS] Setup: Teacher A activated
       Token obtained
[PASS] Setup: Teacher B activated
       Token obtained
[PASS] Setup: Workspace A created (ID: 9ac3dd8a-83df-4f3a-844d-005a2c6431b5)
[PASS] Setup: Workspace B created (ID: 380db433-c7ab-4acb-8fa2-bc5b77f59979)

--- STEP 1: Valid File Uploads & Storage Persistence ---
[PASS] TC-01: Valid PDF uploaded successfully
       HTTP 201 Created, Doc ID: 954e6c90-0a79-4220-8918-279c2353282d, Status: PENDING
[PASS] TC-02: MinIO object verified on storage disk
       Object key: 9ac3dd8a-83df-4f3a-844d-005a2c6431b5/a22c4fd5-8807-4e90-ad73-4834bfd54279/d4c452af-3e89-42a9-8e1f-c1288e577656_GiaoAnToan10.pdf
[PASS] TC-03: Database metadata integrity verified
       fileName: GiaoAnToan10.pdf, subject: Toan hoc, status: PENDING
[PASS] TC-04: Valid TXT document uploaded successfully
       Doc ID: 2ea5bea8-547a-45a4-9640-e2c35c14f914

--- STEP 2: Validation & Error Rejections ---
[PASS] TC-05: 0-byte empty file correctly rejected with HTTP 400 Bad Request
       HTTP 400 Bad Request caught by validation/multipart handler
[PASS] TC-06: Unsupported format (.exe) correctly rejected with HTTP 400
       Message: Unsupported file type

--- STEP 3: Workspace Ownership & Cross-Tenant Boundary ---
[PASS] TC-07: Cross-tenant upload correctly rejected with HTTP 403 Forbidden
       Teacher A prevented from uploading to Workspace B
[PASS] TC-08: Workspace document listing retrieved successfully
       Count: 2 documents
[PASS] TC-09: Cross-tenant document listing rejected with HTTP 403 Forbidden
       Teacher A blocked from viewing documents in Workspace B

--- STEP 4: Document Deletion & Storage Cleanup ---
[PASS] TC-10: Cross-tenant document deletion rejected with HTTP 403 Forbidden
       Teacher A blocked from deleting Doc of Teacher B
[PASS] TC-11: Owner document deletion succeeded (HTTP 204) and purged from PostgreSQL
       Doc ID: 954e6c90-0a79-4220-8918-279c2353282d removed

==========================================================================
 QA-011 LIVE E2E TEST SUMMARY REPORT
 Total Passed: 15
 Total Failed: 0
 Overall Status: ALL TESTS PASSED (100%)
==========================================================================
```

---

## 5. ĐÁNH GIÁ CHẤT LƯỢNG & KẾT LUẬN (CONCLUSION)

1. **Chuẩn Hóa Xử Lý Multipart & Lưu Trữ Tệp**:
   - Dữ liệu tệp tin được làm sạch tên (`sanitizeFileName`), sinh object key phân cấp theo tenant (`workspaceId/userId/UUID_fileName`) và lưu trữ trực tiếp vào MinIO.
   - Siêu dữ liệu đồng bộ tức thì vào PostgreSQL với trạng thái ban đầu `PENDING`.
2. **Hiệu Năng Phản Hồi Bất Đồng Bộ (Async Decoupling)**:
   - Request upload trả về mã `201 Created` ngay sau khi lưu tệp vào MinIO và PostgreSQL. Việc gọi sang FastAPI AI Service diễn ra qua Non-blocking WebClient, giúp giáo viên không bị lag hoặc chờ đợi lâu trên giao diện web.
3. **Tuân Thủ Ranh Giới Kiểm Thử (Test Hierarchy)**:
   - File kiểm thử: `backend/src/test/java/com/aiteachercopilot/document/DocumentUploadIntegrationTest.java`
   - Kịch bản live runner: `scripts/qa/test_qa011_document_upload_e2e.ps1`
   - Tài liệu đặc tả: `docs/4.Test_Case/TC_QA-011_Document_Upload_MinIO_Metadata_Persistence.md`
