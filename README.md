# AI Teacher Copilot for K-12 Teachers

Hệ thống **AI Teaching Assistant** hỗ trợ giáo viên K-12 tạo học liệu dựa trên tài liệu giảng dạy do giáo viên cung cấp.

Dự án bao gồm 3 phần chính:

* **Frontend:** Xây dựng bằng React, cung cấp giao diện cho giáo viên.
* **Backend:** Xây dựng bằng Java Spring Boot, phụ trách authentication, workspace, business logic, document metadata, history và REST API.
* **AI Service:** Xây dựng bằng Python FastAPI, phụ trách document processing, embedding, retrieval, RAG và AI content generation.

Hệ thống sử dụng **PostgreSQL + pgvector** để lưu dữ liệu và vector embedding, **MinIO** để lưu trữ file và **OpenAI/Gemini** làm LLM Provider.

---

## ✨ Chức năng nổi bật

* **Teacher Workspace:** Giáo viên đăng nhập và làm việc trong workspace cá nhân.

* **Document Knowledge Base:** Upload, xử lý và quản lý tài liệu giảng dạy; tài liệu được parse, chunk, embedding và index để phục vụ RAG.

* **AI Lesson Planner:** Sinh giáo án có cấu trúc dựa trên môn, lớp, chủ đề và tài liệu nguồn.

* **Quiz Generator:** Sinh câu hỏi/đề kiểm tra dựa trên Knowledge Base, có hỗ trợ gắn nhãn **Bloom Taxonomy**.

* **RAG & Citation:** AI truy xuất các đoạn nội dung liên quan từ tài liệu nguồn và trả về citation để giáo viên kiểm tra.

* **Review / Edit / Regenerate:** Giáo viên có thể kiểm tra, chỉnh sửa hoặc tạo lại nội dung AI.

* **Document History:** Lưu lại lịch sử nội dung đã được tạo và chỉnh sửa.

* **Word/PDF Export:** Xuất nội dung đã kiểm tra sang Word hoặc PDF.

Các chức năng bắt buộc của MVP gồm Authentication, Teacher Workspace, Document Upload/KB, Document Processing, RAG, Lesson Planner, Quiz Generator, Review/Edit/Regenerate, Document History, Citation và Word/PDF Export.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

1. **Java JDK 17+**

2. **Python 3.x** & **pip**

3. **Node.js** & **npm**

4. **Docker** & **Docker Compose**

5. **Git**

6. **OpenAI API Key hoặc Gemini API Key**

Hệ thống sử dụng Docker Compose cho môi trường development, PostgreSQL + pgvector làm database/vector store và MinIO làm file storage.

---

## 🚀 Hướng dẫn Khởi chạy (Dành cho Giảng viên kiểm tra)

Vui lòng mở các cửa sổ Terminal độc lập để chạy đồng thời các thành phần của hệ thống.

Hệ thống gồm:

```text
Terminal 1 → Infrastructure (PostgreSQL + pgvector + MinIO)
Terminal 2 → AI Service (FastAPI)
Terminal 3 → Backend (Spring Boot)
Terminal 4 → Frontend (React)
```

---

### Bước 1: Khởi chạy Infrastructure (Terminal 1)

Tại thư mục gốc của project:

```bash
docker compose up -d
```

Kiểm tra trạng thái các container:

```bash
docker compose ps
```

Đảm bảo các service cần thiết đã được khởi động trước khi chạy Backend và AI Service.

**Lưu ý:** Không tắt Terminal hoặc dừng Docker trong quá trình kiểm tra hệ thống.

---

### Bước 2: Khởi chạy AI Service — FastAPI (Terminal 2)

Mở cửa sổ Terminal thứ 2 và đi vào thư mục AI Service:

```bash
cd ai-service
```

#### Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

#### Mac/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

Cài đặt thư viện:

```bash
pip install -r requirements.txt
```

Khởi chạy FastAPI:

```bash
uvicorn app.main:app --reload
```

AI Service phụ trách:

* Document parsing
* Chunking
* Embedding
* Retrieval
* RAG orchestration
* LLM integration
* Structured output

FastAPI được thiết kế để phục vụ **nội bộ**, không expose trực tiếp ra Internet.

**Lưu ý:** Không tắt Terminal này.

---

### Bước 3: Khởi chạy Backend — Spring Boot (Terminal 3)

Mở cửa sổ Terminal thứ 3:

```bash
cd backend
```

Nếu project sử dụng Maven Wrapper:

#### Windows:

```bash
mvnw.cmd spring-boot:run
```

#### Mac/Linux:

```bash
./mvnw spring-boot:run
```

Spring Boot Backend chịu trách nhiệm:

* Authentication
* User management
* Teacher Workspace
* Business logic
* Document metadata
* Review / History
* REST API

Frontend chỉ giao tiếp với hệ thống thông qua Spring Boot Backend.

**Lưu ý:** Không tắt Terminal này.

---

### Bước 4: Khởi chạy Frontend — React (Terminal 4)

Mở cửa sổ Terminal thứ 4:

```bash
cd frontend
```

Cài đặt thư viện:

```bash
npm install
```

Khởi chạy Frontend:

```bash
npm run dev
```

Sau khi chạy thành công, Terminal sẽ hiển thị địa chỉ truy cập Frontend.

Mở URL được hiển thị trong trình duyệt để sử dụng hệ thống.

---

## 🔐 Cấu hình Environment Variables

Trước khi khởi chạy hệ thống, cần cấu hình các thông tin kết nối cho:

* PostgreSQL.
* MinIO.
* FastAPI.
* Spring Boot.
* LLM Provider.

Ví dụ:

```env
DATABASE_URL=...
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...

OPENAI_API_KEY=...
```

> Tên biến environment thực tế phải khớp với configuration của source code hiện tại.

**Không commit API key, password hoặc secret thật lên GitHub.**

API key/secret không được expose ra Frontend và thông tin xác thực nhạy cảm phải được lưu thông qua environment/secrets.

---

## 🔄 Quy trình sử dụng hệ thống

Sau khi toàn bộ service đã được khởi chạy:

```text
Teacher Login
     ↓
Teacher Workspace
     ↓
Upload Teaching Document
     ↓
Document Processing
     ↓
Knowledge Base
     ↓
Select Subject / Grade / Topic
     ↓
RAG Retrieval
     ↓
AI Generation
     ↓
Citation
     ↓
Review / Edit / Regenerate
     ↓
Document History
     ↓
Word / PDF Export
```

Quy trình này là vertical loop cốt lõi của MVP: **upload → RAG → generate → review → export**.

---

## 📚 Demo kiểm tra

Giảng viên có thể kiểm tra hệ thống theo quy trình:

### 1. Đăng nhập

Đăng nhập bằng tài khoản giáo viên.

### 2. Upload tài liệu

Upload một tài liệu giảng dạy được hỗ trợ.

### 3. Kiểm tra Knowledge Base

Chờ hệ thống hoàn tất:

```text
Upload
→ Parse
→ Chunk
→ Embedding
→ Index
```

### 4. Tạo Lesson Plan

Chọn:

```text
Subject
Grade
Topic
Source Document
Lesson Planner
```

Sau đó yêu cầu hệ thống sinh giáo án.

### 5. Kiểm tra Citation

Kiểm tra các nguồn được sử dụng trong kết quả AI.

### 6. Review / Edit / Regenerate

Giáo viên có thể:

```text
Review
Edit
Regenerate
```

### 7. Tạo Quiz

Chọn **Quiz Generator** và cấu hình yêu cầu cho đề kiểm tra.

Bloom Taxonomy được sử dụng như một thuộc tính trong quá trình sinh Quiz, không phải một feature độc lập.

### 8. Export

Xuất nội dung sau khi kiểm tra sang:

```text
Word
PDF
```

---

## 🧠 RAG Pipeline

Hệ thống xử lý tài liệu theo pipeline:

```text
Document
   ↓
Parse
   ↓
Chunk
   ↓
Embedding
   ↓
PostgreSQL + pgvector
   ↓
Semantic Retrieval
   ↓
Top-K Relevant Chunks
   ↓
Prompt Orchestration
   ↓
LLM
   ↓
Structured Output
   ↓
Citation
```

Mỗi chunk được lưu metadata về workspace, tài liệu/phiên bản, môn học và vị trí nguồn để phục vụ retrieval isolation và citation.

---

## 📊 AI Quality Evaluation

Trong MVP, chất lượng AI được đánh giá ở mức tối giản trên khoảng **20–30 mẫu output**.

Các chỉ số chính:

* **Groundedness**
* **Citation Coverage**
* **Citation Relevance**
* **Acceptance Rate**
* **Edit Rate**
* **Retrieval Quality**

Việc có citation không đồng nghĩa với việc citation chính xác hoặc nội dung được grounded hoàn toàn; evaluation cần xem xét cả citation relevance và groundedness.

---

## ⚠️ Lưu ý

* AI output chỉ là **bản nháp/đề xuất**.
* Giáo viên vẫn là người quyết định cuối cùng.
* Hệ thống không tự gửi nội dung cho học sinh.
* Hệ thống không tự đánh giá học sinh trong MVP.
* Tài liệu upload được xem là **untrusted data**.
* Nội dung trong tài liệu không được phép override system/developer instructions.
* Không đưa API key hoặc secret vào source code.
* Không sử dụng dữ liệu Student PII trong MVP.

---

## 📌 Project Status

**Status:** 🚧 In Development

**Development Model:** Solo Developer

**Target:** 6 Months / 24 Weeks

**MVP Core:**

```text
Authentication
    +
Teacher Workspace
    +
Document Knowledge Base
    +
RAG
    +
AI Lesson Planner
    +
Quiz Generator
    +
Review / Edit / Regenerate
    +
Citation
    +
Document History
    +
Word / PDF Export
```

Scope, Architecture và ERD hiện là **đề xuất chờ Mentor xác nhận**. README này cần được cập nhật nếu Mentor thay đổi phạm vi hoặc kiến trúc trước khi implementation chính thức.
