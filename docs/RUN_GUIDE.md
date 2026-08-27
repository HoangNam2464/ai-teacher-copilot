# 🚀 Hướng Dẫn Khởi Chạy Hệ Thống (System Run Guide)

> **Tài liệu ghi nhớ cách vận hành hệ thống AI Teacher Copilot for K-12 Teachers.**

---

## 🌟 CÁCH 1: Khởi Chạy Trọn Gói 1 Lệnh (All-In-One Docker)
> **Khuyên dùng khi:** Dự án hoàn thành, chạy thử nghiệm toàn diện, Demo bảo vệ đồ án hoặc Deploy máy chủ.

Toàn bộ **5 dịch vụ** (PostgreSQL 16 + pgvector, MinIO, FastAPI AI, Spring Boot 3, React 18 + Nginx) sẽ tự động build và chạy chỉ với **1 câu lệnh duy nhất**:

### 1. Lệnh khởi chạy:
```bash
docker compose -f docker-compose.full.yml up --build -d
```

### 2. Địa chỉ truy cập các dịch vụ:
| Dịch vụ | Địa chỉ URL | Ghi chú |
|---|---|---|
| 🖥️ **Frontend Web Client** | **`http://localhost:3000`** | Giao diện React phục vụ qua Nginx |
| 🛡️ **Spring Boot Backend** | `http://localhost:8080/api` | REST API Gateway |
| 🧠 **FastAPI AI Engine** | `http://localhost:8000` | AI RAG Service nội bộ |
| 🗄️ **MinIO S3 Console** | `http://localhost:9001` | Quản lý file (User: `minioadmin` / Pass: `changeme_minio_password`) |
| 🐘 **PostgreSQL pgvector** | `localhost:5432` | Database & Vector Embeddings |

### 3. Lệnh dừng hệ thống:
```bash
docker compose -f docker-compose.full.yml down
```

---

## 🛠️ CÁCH 2: Khởi Chạy Chế Độ Lập Trình (Dev Mode — Hot Reload)
> **Khuyên dùng khi:** Đang code tính năng mới, cần sửa code giao diện hoặc backend và thấy kết quả ngay trong 0.5s.

Cần mở 4 cửa sổ Terminal riêng biệt:

### Terminal 1: Infrastructure (Docker Database & MinIO)
```bash
docker compose up -d
```
*(Đợi 5 giây cho PostgreSQL và MinIO sẵn sàng)*

### Terminal 2: FastAPI AI Service (Python 3.12)
```bash
cd ai-service
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Spring Boot Core Backend (Java 17)
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# Mac/Linux:
# ./mvnw spring-boot:run
```

### Terminal 4: React Frontend (Vite)
```bash
cd frontend
npm run dev
```
*(Truy cập `http://localhost:5173` để code với Hot-Reload)*

---

## 🧹 Các Lệnh Xử Lý & Dọn Dẹp Hữu Ích

### 1. Xem Log lỗi của Docker:
```bash
# Xem log toàn bộ
docker compose -f docker-compose.full.yml logs -f

# Xem log riêng 1 dịch vụ (vd: backend hoặc ai-service)
docker compose -f docker-compose.full.yml logs -f backend
docker compose -f docker-compose.full.yml logs -f ai-service
```

### 2. Xóa sạch dữ liệu Database để reset từ đầu:
```bash
docker compose -f docker-compose.full.yml down -v
```

---

*Lưu trữ tại `docs/RUN_GUIDE.md` · AI Teacher Copilot for K-12 Teachers*
