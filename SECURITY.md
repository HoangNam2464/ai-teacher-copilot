# 🔒 Security Policy — AI Teacher Copilot for K-12 Teachers

## Supported Versions

| Version | Status | Security Updates |
| :--- | :--- | :--- |
| `main` (latest) | ✅ Active | ✅ Yes |
| Older commits | ❌ Unsupported | ❌ No |

> This project is currently in active MVP development. Only the latest commit on `main` receives security patches.

---

## 🛡️ Reporting a Vulnerability (Responsible Disclosure)

Nếu bạn phát hiện lỗ hổng bảo mật trong dự án này, vui lòng **KHÔNG** mở GitHub Issue công khai.

**Thay vào đó, hãy báo cáo riêng qua:**

- 📧 Email: `[hoangnam01012005@gmail.com]`
- Tiêu đề email: `[SECURITY] AI Teacher Copilot - <Mô tả ngắn gọn>`

### Thông tin cần cung cấp:

```
1. Mô tả lỗ hổng (loại lỗi, component bị ảnh hưởng)
2. Các bước tái hiện lỗi (Proof of Concept nếu có)
3. Tác động tiềm năng (data leak, RCE, SSRF, v.v.)
4. Môi trường phát hiện (OS, phiên bản Java/Python/Node.js)
```

### Cam kết phản hồi:

| Bước | Thời gian |
| :--- | :--- |
| Xác nhận nhận báo cáo | Trong vòng **48 giờ** |
| Đánh giá mức độ nghiêm trọng | Trong vòng **5 ngày** |
| Phát hành bản vá (nếu xác nhận) | Trong vòng **30 ngày** |

---

## 🔐 Kiến trúc Bảo mật Hiện tại (Security Architecture)

### Authentication & Authorization
- JWT-based authentication qua Spring Boot Spring Security
- Token expiry ngắn + Refresh token rotation
- FastAPI chỉ chấp nhận request từ Spring Boot internal network (không expose public)

### Prompt Security (AI Governance)
- **Prompt Injection Prevention**: Document content từ RAG retrieval được wrap trong `<sources>...</sources>` boundary — tuyệt đối không inject vào system instructions
- **Workspace Isolation**: Mọi pgvector query bắt buộc có `workspace_id` filter — cross-workspace access trả về `403 Forbidden`
- **Structured Output Validation**: Toàn bộ AI output được validate qua Pydantic v2 schema trước khi lưu hoặc trả về client
- **Insufficient Evidence**: Pipeline trả `insufficient_evidence` thay vì hallucinate khi context không đủ

### Data & Storage
- File lưu trữ trên MinIO (object storage) — không lưu file trực tiếp trên filesystem
- Database credentials được load qua environment variables (`.env`) — không hardcode trong source code
- `.env` đã có trong `.gitignore` — không bao giờ commit credentials lên Git

### API Security
- CORS được cấu hình chặt chẽ — không sử dụng wildcard `*` trong production
- Input validation bắt buộc tại cả Spring Boot (Bean Validation) và FastAPI (Pydantic)
- Không bao giờ expose Entity JPA trực tiếp ra API response (DTO pattern)

---

## 📋 Out of Scope (Ngoài phạm vi báo cáo)

Các mục sau **KHÔNG phải** lỗ hổng bảo mật và sẽ không được xử lý:

- Lỗi chức năng không liên quan đến bảo mật
- Vấn đề về hiệu năng (performance)
- Missing rate limiting (chưa được implement trong MVP)
- Thiếu HTTPS trong môi trường local development (dùng HTTP là bình thường)
- Social engineering attacks

---

## 🏫 Ghi chú cho Môi trường Học thuật

Dự án này được phát triển như **đồ án tốt nghiệp** (capstone project) và **không phải hệ thống production thương mại**.

- Không xử lý thông tin cá nhân học sinh (Student PII) theo cam kết MVP
- Không yêu cầu người dùng thật submit thông tin nhạy cảm trong môi trường demo
- API keys trong file `.env.example` là placeholder — không có giá trị thực

---

*Security Policy này được cập nhật lần cuối: 2026-08-27*
*Tác giả: Nguyen Hoang Nam*
