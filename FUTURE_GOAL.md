# 🚀 FUTURE GOAL — Lộ trình Mở rộng Sau MVP

> Tài liệu này vạch ra các tính năng và phương hướng phát triển dự án **AI Teacher Copilot for K-12 Teachers** sau khi hoàn thành MVP v1.0.0.
> Mọi mục trong đây đều là **deferred / out of scope** cho MVP hiện tại.

---

## 🎯 MVP v1.0.0 — Mục tiêu hiện tại (6 tháng)

Trước khi nhìn vào tương lai, đây là 8 tính năng bắt buộc phải hoàn thành:

| # | Tính năng | Trạng thái |
| :--- | :--- | :--- |
| 1 | Authentication & User Management | 🚧 In Progress |
| 2 | Teacher Workspace | 🚧 In Progress |
| 3 | Document Upload & Knowledge Base | 🔲 Planned |
| 4 | Document Processing (parse → chunk → embed → pgvector) | 🔲 Planned |
| 5 | RAG Retrieval (metadata filter + vector similarity) | 🔲 Planned |
| 6 | AI Lesson Planner (structured output + citations) | 🔲 Planned |
| 7 | Quiz Generator (MCQ + Short Answer + Bloom Taxonomy) | 🔲 Planned |
| 8 | Review / Edit / Regenerate & Document History | 🔲 Planned |
| 9 | Citation Traceability | 🔲 Planned |
| 10 | Word / PDF Export | 🔲 Planned |

---

## 📅 Phase 2 — Nên có (Should-Have, sau MVP)

### 2.1 Rubric Generator
- Tạo rubric chấm điểm tự động từ knowledge base
- Tái sử dụng pipeline structured output (Pydantic) của Quiz Generator
- Output: Rubric theo tiêu chí + mức độ điểm tương ứng với Bloom Taxonomy

### 2.2 AI Metrics Dashboard (Cơ bản)
- Hiển thị các chỉ số chất lượng RAG đã được log trong MVP:
  - Retrieval relevance score (cosine similarity distribution)
  - Generation latency per feature
  - Insufficient evidence rate
- Stack: Chart.js hoặc Recharts trên React frontend

### 2.3 Cải tiến RAG Pipeline
- **Reranker**: Cross-encoder reranking (sau khi baseline có đủ metric để đo)
- **Hybrid Search**: Kết hợp BM25 (full-text) + pgvector (semantic) với RRF fusion
- **Parent-Child Chunking**: Retrieve chunk nhỏ, expand ra parent chunk để cung cấp context đầy đủ hơn

### 2.4 Batch Document Upload
- Upload nhiều file cùng lúc (ZIP hoặc multi-file picker)
- Xử lý bất đồng bộ với job queue (Spring Boot + async FastAPI)
- Progress tracking realtime qua WebSocket hoặc SSE

---

## 🌟 Phase 3 — Mở rộng lớn (Long-term Vision)

### 3.1 Chatbot Trợ giảng Tương tác (Interactive Teaching Assistant)
- Chat interface thời gian thực với giáo viên
- RAG-powered: trả lời câu hỏi về tài liệu đã upload
- Streaming response qua Server-Sent Events (SSE)
- Citation inline trong mỗi câu trả lời

### 3.2 Tích hợp LMS (Learning Management System)
- **Google Classroom**: Import danh sách lớp học, export bài tập trực tiếp
- **Canvas LMS**: Tích hợp API Canvas để đồng bộ lesson plan và quiz
- **Microsoft Teams**: Plugin tích hợp vào Teams Education

### 3.3 AI Chấm điểm Tự luận (Automated Short Answer Grading)
- Giáo viên upload rubric + bài làm học sinh (PDF/scan)
- AI chấm điểm theo rubric với giải thích chi tiết từng tiêu chí
- Human-in-the-loop: Giáo viên review và confirm trước khi lưu điểm

### 3.4 Slide Generator (Tạo slide bài giảng)
- Từ lesson plan đã duyệt → tạo outline slide PowerPoint/Google Slides
- Template đa dạng theo môn học và cấp lớp
- Export PPTX trực tiếp từ giao diện

### 3.5 Bloom Taxonomy Question Bank
- Ngân hàng câu hỏi theo Bloom Taxonomy cấu trúc hóa
- Tìm kiếm, filter, tái sử dụng câu hỏi từ các lần generate trước
- Cho phép giáo viên chỉnh sửa và đóng góp vào ngân hàng đề

### 3.6 Cộng tác Nhiều Giáo viên (Team Collaboration)
- Workspace dùng chung cho nhóm giáo viên trong cùng trường/bộ môn
- Role-based access: Owner, Editor, Viewer
- Comment và annotation trực tiếp trên lesson plan/quiz
- Real-time co-editing (Operational Transformation hoặc CRDT)

### 3.7 Analytics & KPI Dashboard (Đầy đủ)
- Theo dõi mức độ sử dụng theo môn học, cấp lớp, giáo viên
- Export báo cáo (Excel/PDF) cho ban giám hiệu
- Trend phân tích Bloom Taxonomy usage theo thời gian

### 3.8 Mobile App (iOS & Android)
- React Native app cho giáo viên review và approve AI output trên mobile
- Push notification khi document processing hoàn tất
- Offline mode cho phép đọc/review lesson plan không cần internet

---

## 🔬 Nghiên cứu & Thử nghiệm (R&D)

| Hướng nghiên cứu | Mô tả |
| :--- | :--- |
| **Fine-tuning** | Fine-tune Gemini/GPT trên curriculum Việt Nam K-12 khi có đủ data |
| **Multi-agent Orchestration** | CrewAI/LangGraph agents cho workflow phức tạp (research → plan → quiz) |
| **Knowledge Graph** | Xây dựng knowledge graph từ curriculum documents để improve retrieval |
| **Evaluation Framework** | RAGAS / DeepEval tích hợp vào CI pipeline để đo chất lượng RAG tự động |
| **Web Search Augmentation** | Tích hợp Tavily/Perplexity API để bổ sung context từ internet |
| **Multimodal RAG** | Xử lý hình ảnh, đồ thị, bảng biểu trong tài liệu PDF (GPT-4 Vision / Gemini Vision) |

---

## 📌 Nguyên tắc Ra quyết định cho Future Features

> Trích từ Engineering Principles trong Project Foundation Rules:

1. **Evidence-Driven**: Không thêm complexity (queues, caches, rerankers) nếu chưa có metric đo được bottleneck
2. **Vertical Slice First**: Hoàn thành end-to-end loop MVP trước khi mở rộng ngang
3. **Baseline Before Optimization**: Baseline hoạt động → đo metric → optimize có chỗ đau thực sự
4. **Teacher-in-the-loop**: AI output luôn là bản nháp — giáo viên là người ra quyết định cuối cùng

---

*Tài liệu này được cập nhật định kỳ sau mỗi milestone lớn.*
*Lần cập nhật cuối: 2026-08-27*
