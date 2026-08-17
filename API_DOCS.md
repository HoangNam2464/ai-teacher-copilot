# Tài liệu API AI Teacher Copilot (Chi tiết)

Toàn bộ **Core Backend API** của AI Teacher Copilot được thiết kế theo chuẩn **RESTful API**.

Format trao đổi dữ liệu mặc định:

```text
application/json
```

**Xác thực:** Sử dụng Authentication Token.

Các API yêu cầu xác thực cần gửi thông tin xác thực trong Header:

```http
Authorization: Bearer <your_access_token>
```

Kiến trúc API của hệ thống:

```text
React Frontend
      ↓
Spring Boot REST API
      ↓
┌─────┴───────────────┐
↓                     ↓
PostgreSQL + MinIO   FastAPI AI Service
                            ↓
                       LLM Provider
```

Spring Boot là **API entry point chính** cho Frontend. FastAPI là AI Service nội bộ, phụ trách document processing, embedding, retrieval, RAG, LLM orchestration, structured output và AI evaluation.

---

## 1. Xác thực & Người dùng (Authentication & Users)

| Chức năng         | Method | Endpoint                        | Quyền (Role) |
| ----------------- | ------ | ------------------------------- | ------------ |
| Đăng ký tài khoản | `POST` | `/api/v1/auth/register`         | Public       |
| Đăng nhập         | `POST` | `/api/v1/auth/login`            | Public       |
| Làm mới Token     | `POST` | `/api/v1/auth/refresh`          | Có Token     |
| Đăng xuất         | `POST` | `/api/v1/auth/logout`           | Có Token     |
| Lấy Profile       | `GET`  | `/api/v1/users/me`              | Teacher      |
| Cập nhật Profile  | `PUT`  | `/api/v1/users/me`              | Teacher      |
| Đổi mật khẩu      | `POST` | `/api/v1/users/change-password` | Teacher      |

Authentication là một thành phần bắt buộc của MVP.

> **Lưu ý:** Endpoint path ở trên là API contract đề xuất. Cần cập nhật theo implementation thực tế nếu source code sử dụng path khác.

---

## 2. Teacher Workspace

| Chức năng               | Method   | Endpoint                     | Quyền (Role) |
| ----------------------- | -------- | ---------------------------- | ------------ |
| Lấy Workspace hiện tại  | `GET`    | `/api/v1/workspaces/current` | Teacher      |
| Tạo Workspace           | `POST`   | `/api/v1/workspaces`         | Teacher      |
| Cập nhật Workspace      | `PUT`    | `/api/v1/workspaces/{id}`    | Teacher      |
| Lấy thông tin Workspace | `GET`    | `/api/v1/workspaces/{id}`    | Teacher      |
| Xóa Workspace           | `DELETE` | `/api/v1/workspaces/{id}`    | Teacher      |

## Teacher Workspace là khu vực làm việc chính của giáo viên và là boundary quan trọng để đảm bảo người dùng chỉ truy cập được tài nguyên thuộc workspace của mình.

## 3. Documents & Knowledge Base

### 3.1 Document Management

| Chức năng                 | Method   | Endpoint                        | Quyền (Role) |
| ------------------------- | -------- | ------------------------------- | ------------ |
| Upload tài liệu           | `POST`   | `/api/v1/documents`             | Teacher      |
| Danh sách tài liệu        | `GET`    | `/api/v1/documents`             | Teacher      |
| Chi tiết tài liệu         | `GET`    | `/api/v1/documents/{id}`        | Teacher      |
| Cập nhật Metadata         | `PUT`    | `/api/v1/documents/{id}`        | Teacher      |
| Xóa tài liệu              | `DELETE` | `/api/v1/documents/{id}`        | Teacher      |
| Kiểm tra trạng thái xử lý | `GET`    | `/api/v1/documents/{id}/status` | Teacher      |

### 3.2 Document Processing

| Chức năng              | Method | Endpoint                           | Quyền (Role) |
| ---------------------- | ------ | ---------------------------------- | ------------ |
| Bắt đầu xử lý tài liệu | `POST` | `/api/v1/documents/{id}/process`   | Teacher      |
| Re-process tài liệu    | `POST` | `/api/v1/documents/{id}/reprocess` | Teacher      |

Document processing bao gồm:

```text
Document
    ↓
Parsing
    ↓
Chunking
    ↓
Embedding
    ↓
Vector Indexing
```

Hệ thống lưu metadata của file và xử lý tài liệu thành chunk/embedding để phục vụ retrieval.

---

## 4. Knowledge Retrieval / RAG

| Chức năng               | Method | Endpoint                     | Quyền (Role) |
| ----------------------- | ------ | ---------------------------- | ------------ |
| Truy vấn Knowledge Base | `POST` | `/api/v1/rag/retrieve`       | Teacher      |
| Lấy các chunk liên quan | `POST` | `/api/v1/rag/search`         | Teacher      |
| Kiểm tra Retrieval      | `POST` | `/api/v1/rag/test-retrieval` | Teacher      |

Retrieval baseline của MVP sử dụng:

```text
Metadata Filter
      +
Semantic / Vector Retrieval
      ↓
Top-K Relevant Chunks
```

Hybrid retrieval hoặc reranking chỉ được bổ sung nếu evaluation cho thấy baseline chưa đáp ứng yêu cầu chất lượng.

---

## 5. AI Lesson Planner

| Chức năng             | Method   | Endpoint                                          | Quyền (Role) |
| --------------------- | -------- | ------------------------------------------------- | ------------ |
| Tạo Lesson Plan       | `POST`   | `/api/v1/generation/lesson-plans`                 | Teacher      |
| Lấy Lesson Plan       | `GET`    | `/api/v1/generation/lesson-plans/{id}`            | Teacher      |
| Chỉnh sửa Lesson Plan | `PUT`    | `/api/v1/generation/lesson-plans/{id}`            | Teacher      |
| Tạo lại Lesson Plan   | `POST`   | `/api/v1/generation/lesson-plans/{id}/regenerate` | Teacher      |
| Xóa Lesson Plan       | `DELETE` | `/api/v1/generation/lesson-plans/{id}`            | Teacher      |

Lesson Planner nhận context gồm:

```text
Subject
+
Grade
+
Topic
+
Selected Documents
+
Teacher Requirements
```

Sau đó:

```text
Teacher Input
      ↓
Retrieval
      ↓
RAG
      ↓
Prompt Orchestration
      ↓
LLM
      ↓
Structured Lesson Plan
      ↓
Citation
```

Lesson Planner là một trong hai loại nội dung **bắt buộc** của MVP.

---

## 6. Quiz Generator

| Chức năng      | Method   | Endpoint                                     | Quyền (Role) |
| -------------- | -------- | -------------------------------------------- | ------------ |
| Tạo Quiz       | `POST`   | `/api/v1/generation/quizzes`                 | Teacher      |
| Lấy Quiz       | `GET`    | `/api/v1/generation/quizzes/{id}`            | Teacher      |
| Chỉnh sửa Quiz | `PUT`    | `/api/v1/generation/quizzes/{id}`            | Teacher      |
| Tạo lại Quiz   | `POST`   | `/api/v1/generation/quizzes/{id}/regenerate` | Teacher      |
| Xóa Quiz       | `DELETE` | `/api/v1/generation/quizzes/{id}`            | Teacher      |

Quiz Generator hỗ trợ các thông tin đầu vào như:

```text
Subject
Grade
Topic
Number of Questions
Question Requirements
Bloom Taxonomy
Selected Documents
```

Bloom Taxonomy được tích hợp trực tiếp vào Quiz Generator, không được tách thành một feature độc lập.

---

## 7. Rubric Generator

Rubric Generator thuộc nhóm **Nên có** trong MVP và chỉ triển khai nếu tiến độ cho phép.

| Chức năng        | Method   | Endpoint                                     | Quyền (Role) |
| ---------------- | -------- | -------------------------------------------- | ------------ |
| Tạo Rubric       | `POST`   | `/api/v1/generation/rubrics`                 | Teacher      |
| Lấy Rubric       | `GET`    | `/api/v1/generation/rubrics/{id}`            | Teacher      |
| Chỉnh sửa Rubric | `PUT`    | `/api/v1/generation/rubrics/{id}`            | Teacher      |
| Tạo lại Rubric   | `POST`   | `/api/v1/generation/rubrics/{id}/regenerate` | Teacher      |
| Xóa Rubric       | `DELETE` | `/api/v1/generation/rubrics/{id}`            | Teacher      |

Rubric Generator được định hướng tái sử dụng pipeline structured output hiện có để giảm effort triển khai.

---

## 8. Review / Edit / Regenerate

| Chức năng               | Method | Endpoint                          | Quyền (Role) |
| ----------------------- | ------ | --------------------------------- | ------------ |
| Lấy nội dung cần Review | `GET`  | `/api/v1/reviews/{id}`            | Teacher      |
| Lưu chỉnh sửa           | `PUT`  | `/api/v1/reviews/{id}`            | Teacher      |
| Chấp nhận nội dung      | `POST` | `/api/v1/reviews/{id}/accept`     | Teacher      |
| Tạo lại nội dung        | `POST` | `/api/v1/reviews/{id}/regenerate` | Teacher      |

Workflow:

```text
AI Generated Draft
        ↓
      Review
      ↙   ↘
    Edit  Regenerate
      ↘   ↙
    Final Content
```

AI output được xem là bản nháp/đề xuất và giáo viên vẫn là người quyết định cuối cùng.

---

## 9. Document History

| Chức năng           | Method   | Endpoint                       | Quyền (Role) |
| ------------------- | -------- | ------------------------------ | ------------ |
| Lịch sử tài liệu    | `GET`    | `/api/v1/history`              | Teacher      |
| Chi tiết History    | `GET`    | `/api/v1/history/{id}`         | Teacher      |
| Khôi phục phiên bản | `POST`   | `/api/v1/history/{id}/restore` | Teacher      |
| Xóa History         | `DELETE` | `/api/v1/history/{id}`         | Teacher      |

Document History được sử dụng để lưu giữ lịch sử nội dung đã sinh và đã được giáo viên kiểm tra/chỉnh sửa.

---

## 10. Citation / Source References

| Chức năng                 | Method | Endpoint                         | Quyền (Role) |
| ------------------------- | ------ | -------------------------------- | ------------ |
| Lấy Citation của nội dung | `GET`  | `/api/v1/citations/{contentId}`  | Teacher      |
| Lấy Source Reference      | `GET`  | `/api/v1/citations/{citationId}` | Teacher      |

Citation được tạo từ source identifiers của các chunk/tài liệu được retrieval.

```text
Generated Content
       ↓
Citation
       ↓
Source Document
       ↓
Source Chunk
```

Mỗi chunk cần có metadata về workspace, tài liệu/phiên bản và vị trí nguồn để hỗ trợ provenance và citation.

---

## 11. Export

| Chức năng            | Method | Endpoint                        | Quyền (Role) |
| -------------------- | ------ | ------------------------------- | ------------ |
| Export Word          | `POST` | `/api/v1/exports/word`          | Teacher      |
| Export PDF           | `POST` | `/api/v1/exports/pdf`           | Teacher      |
| Lấy thông tin Export | `GET`  | `/api/v1/exports/{id}`          | Teacher      |
| Download Export      | `GET`  | `/api/v1/exports/{id}/download` | Teacher      |

Export được thực hiện sau khi giáo viên hoàn tất quá trình review/edit.

```text
Generated Content
       ↓
Review / Edit
       ↓
Final Content
       ↓
┌──────┴──────┐
↓             ↓
Word          PDF
```

Word/PDF Export nằm trong phạm vi chức năng bắt buộc của MVP.

---

## 12. AI Service — Internal API

FastAPI AI Service không được Frontend gọi trực tiếp.

Luồng giao tiếp:

```text
React
  ↓
Spring Boot
  ↓
FastAPI
  ↓
LLM Provider
```

Các nhóm API nội bộ dự kiến:

| Chức năng         | Method | Endpoint                    | Caller      |
| ----------------- | ------ | --------------------------- | ----------- |
| Parse Document    | `POST` | `/internal/documents/parse` | Spring Boot |
| Chunk Document    | `POST` | `/internal/documents/chunk` | Spring Boot |
| Create Embeddings | `POST` | `/internal/embeddings`      | Spring Boot |
| Retrieve Context  | `POST` | `/internal/retrieval`       | Spring Boot |
| Generate Content  | `POST` | `/internal/generation`      | Spring Boot |
| Evaluate Output   | `POST` | `/internal/evaluation`      | Spring Boot |

FastAPI chịu trách nhiệm document processing, retrieval, RAG orchestration, LLM call, structured output và evaluation.

> Các endpoint `/internal/*` là API contract nội bộ đề xuất. Path và request/response schema cần được chốt trong API Contract giữa Spring Boot và FastAPI trước khi implementation mở rộng.

---

## 13. AI Generation Response

Các loại nội dung có schema riêng:

```text
Lesson Planner → Lesson Schema
Quiz Generator → Quiz Schema
Rubric Generator → Rubric Schema
```

Output không sử dụng một schema chung cho tất cả loại nội dung.

Một response AI có thể có cấu trúc logic:

```json
{
  "success": true,
  "content": {},
  "citations": [],
  "status": "completed"
}
```

Khi evidence không đủ:

```json
{
  "success": false,
  "status": "insufficient_evidence",
  "content": null,
  "citations": []
}
```

Hệ thống được thiết kế để không ép AI sinh nội dung khi evidence truy xuất không đủ đáng tin cậy.

> JSON trên chỉ mô tả response contract ở mức khái niệm. Schema cuối cùng cần được định nghĩa trong API Contract/implementation.

---

## 14. HTTP Status Codes

Các API REST sử dụng HTTP status code theo kết quả xử lý:

| Status Code                 | Ý nghĩa                                         |
| --------------------------- | ----------------------------------------------- |
| `200 OK`                    | Request thành công                              |
| `201 Created`               | Tạo resource thành công                         |
| `400 Bad Request`           | Request không hợp lệ                            |
| `401 Unauthorized`          | Chưa xác thực / Token không hợp lệ              |
| `403 Forbidden`             | Không có quyền truy cập                         |
| `404 Not Found`             | Không tìm thấy resource                         |
| `409 Conflict`              | Xung đột dữ liệu                                |
| `422 Unprocessable Entity`  | Dữ liệu hợp lệ về format nhưng không xử lý được |
| `500 Internal Server Error` | Lỗi server                                      |

---

## 15. Error Response

API nên trả về error response thống nhất.

Ví dụ:

```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_PROCESSING_FAILED",
    "message": "Document processing failed."
  }
}
```

Đối với AI generation:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_EVIDENCE",
    "message": "The available evidence is insufficient to generate a reliable answer."
  }
}
```

Các lỗi document processing và AI generation cần trả về trạng thái lỗi rõ ràng, có ý nghĩa để Frontend có thể hiển thị trạng thái phù hợp cho giáo viên.

---

## 16. API Authentication

Các endpoint bảo vệ yêu cầu:

```http
Authorization: Bearer <access_token>
```

Ví dụ:

```http
GET /api/v1/documents
Authorization: Bearer eyJ...
```

Server phải kiểm tra:

```text
Token
 ↓
User
 ↓
Workspace
 ↓
Resource Ownership
```

Người dùng không được phép truy cập document, generated content hoặc resource thuộc workspace khác. Đây là một yêu cầu bảo mật của MVP.

---

## 17. API Architecture Summary

```text
┌──────────────────┐
│  React Frontend  │
└────────┬─────────┘
         │
         │ REST API
         ▼
┌─────────────────────────────┐
│      Spring Boot API        │
│                             │
│ /auth                       │
│ /users                      │
│ /workspaces                 │
│ /documents                  │
│ /generation                 │
│ /reviews                    │
│ /history                    │
│ /citations                  │
│ /exports                    │
└──────┬──────────────┬───────┘
       │              │
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────────┐
│ PostgreSQL  │  │ FastAPI AI      │
│ + pgvector  │  │ Service         │
└─────────────┘  └────────┬────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ LLM Provider│
                   │OpenAI/Gemini│
                   └─────────────┘

       ┌─────────────┐
       │    MinIO    │
       │ File Storage│
       └─────────────┘
```

---

## 18. API Development Status

| Module                     | MVP Status   |
| -------------------------- | ------------ |
| Authentication             | **Bắt buộc** |
| Teacher Workspace          | **Bắt buộc** |
| Documents                  | **Bắt buộc** |
| Knowledge Base             | **Bắt buộc** |
| RAG                        | **Bắt buộc** |
| Lesson Planner             | **Bắt buộc** |
| Quiz Generator             | **Bắt buộc** |
| Review / Edit / Regenerate | **Bắt buộc** |
| Document History           | **Bắt buộc** |
| Citation                   | **Bắt buộc** |
| Word/PDF Export            | **Bắt buộc** |
| Rubric Generator           | **Nên có**   |
| Slide Generator            | **Hoãn lại** |
| Analytics Dashboard        | **Hoãn lại** |

Phạm vi này phù hợp với nguyên tắc cắt scope 6 tháng: ưu tiên hoàn thiện vertical loop end-to-end cho **Lesson Planner + Quiz Generator**, và chỉ triển khai tối đa một loại nội dung bổ sung nếu tiến độ cho phép.

---

**Ghi chú:** File `API_DOCS.md` này là tài liệu API contract ở mức thiết kế dựa trên Project Detail hiện tại. Các endpoint, HTTP method, request body, response schema và authentication flow cụ thể cần được cập nhật theo source code sau khi API contract giữa **Spring Boot ↔ FastAPI** được Mentor xác nhận. Tài liệu Project Detail hiện tại xác định API contract này cần được chốt sớm để tránh rework trong quá trình implementation.
