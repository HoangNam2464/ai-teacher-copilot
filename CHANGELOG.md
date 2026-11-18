# 📋 CHANGELOG — AI Teacher Copilot for K-12 Teachers

Tất cả các thay đổi đáng chú ý của dự án được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Phiên bản tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Đang phát triển

### 🚧 In Progress
- [ ] Document Upload — Spring Boot nhận file PDF/DOCX, lưu MinIO, lưu metadata PostgreSQL
- [ ] Document Processing — FastAPI parse PDF/DOCX, chunking, embedding với pgvector
- [ ] RAG Retrieval — Query embedding + metadata-filtered vector search
- [ ] AI Lesson Planner — Structured output với citation traceability
- [ ] Quiz Generator — MCQ + Short Answer với Bloom Taxonomy tagging
- [ ] Review / Edit / Regenerate — Teacher inline revision + document history
- [ ] Word / PDF Export — DOCX và PDF với citation footer

---

## [0.2.0] — 2026-08-27

### ✅ Added
- Thiết lập bộ tài liệu dự án chuẩn: `CONTRIBUTING.md`, `CHANGELOG.md`, `FUTURE_GOAL.md`
- `CONTRIBUTING.md`: Quy chuẩn Git branching, Conventional Commits, coding standards cho Java/Python/TypeScript, checklist PR
- `FUTURE_GOAL.md`: Lộ trình mở rộng sau MVP (Phase 2 & Phase 3)
- `API_DOCS.md`: Tài liệu REST API đầy đủ cho Spring Boot Backend
- `AI_TEACHER_COPILOT_BLUEPRINT.md`: Thiết kế kiến trúc 3-tier toàn hệ thống
- Cấu hình CI/CD GitHub Actions: `backend-ci.yml`, `ai-service-ci.yml`, `frontend-ci.yml`, `ci.yml`
- `docker-compose.yml`: Infrastructure stack (PostgreSQL 16 + pgvector, MinIO)
- `.env.example`: Template biến môi trường cho cả 3 service
- `.gitignore`: Patterns cho Java, Python, Node.js, Docker

### 🔧 Changed
- Cập nhật `README.md` với hướng dẫn khởi động 4-Terminal đầy đủ

---

## [0.1.0] — 2026-08-26

### ✅ Added
- Khởi tạo repository dự án `ai-teacher-copilot`
- Thiết lập cấu trúc monorepo 3-service:
  - `backend/` — Spring Boot 3 (Java 17, Maven, Flyway, PostgreSQL)
  - `ai-service/` — FastAPI (Python 3.12, pgvector, Pydantic v2)
  - `frontend/` — React 18 + Vite + TypeScript + Zustand
- Cấu hình Spring Security với JWT authentication
- Thiết lập PostgreSQL 16 với pgvector extension
- MinIO object storage cho document files
- Pydantic v2 provider abstraction (`providers/base.py`) cho Gemini/OpenAI
- Flyway database migrations
- `README.md` ban đầu với mô tả dự án và kiến trúc hệ thống

---

## Ghi chú Phiên bản

| Phiên bản | Trạng thái | Mô tả |
| :--- | :--- | :--- |
| `0.x.x` | Development | Giai đoạn phát triển MVP (6 tháng) |
| `1.0.0` | MVP Release | Hoàn thành đầy đủ 8 tính năng Must-Have |
| `1.x.x` | Stable | Bản vá và cải tiến sau MVP |
| `2.0.0` | Phase 2 | Mở rộng tính năng theo FUTURE_GOAL.md |
