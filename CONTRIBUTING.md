# 📖 QUY CHUẨN PHÁT TRIỂN & ĐÓNG GÓP DỰ ÁN

> Áp dụng cho toàn bộ quá trình phát triển hệ thống **AI Teacher Copilot for K-12 Teachers**.
> Mọi thay đổi mã nguồn phải tuân thủ các quy chuẩn dưới đây trước khi được tích hợp vào nhánh `develop` hoặc `main`.

---

## 🌳 1. Quy chuẩn Quản lý Nhánh Git (Git Branching Strategy)

Hệ thống sử dụng mô hình **Git Feature Branch Workflow**. Tuyệt đối **KHÔNG** push code trực tiếp lên nhánh `main` hoặc `develop`.

```
feature/<name>  →  develop  →  main
```

| Nhánh | Mô tả |
| :--- | :--- |
| `main` | Nhánh production ổn định, chỉ chứa code đã kiểm tra kỹ và sẵn sàng demo/triển khai |
| `develop` | Nhánh tích hợp chính, nhận merge từ các nhánh `feature/*` sau khi CI pass |
| `feature/*` | Nhánh phát triển tính năng mới, tạo từ `develop` |
| `fix/*` | Nhánh sửa lỗi trong quá trình phát triển |
| `hotfix/*` | Nhánh sửa lỗi khẩn cấp trực tiếp từ `main` |
| `refactor/*` | Nhánh tái cấu trúc mã nguồn |
| `docs/*` | Nhánh cập nhật tài liệu |

### Cú pháp đặt tên nhánh:

| Loại nhánh | Cú pháp | Ví dụ |
| :--- | :--- | :--- |
| Tính năng mới | `feature/<module>-<tên-ngắn>` | `feature/rag-citation-builder` · `feature/bloom-quiz-generator` · `feature/word-export` |
| Sửa lỗi | `fix/<module>-<mô-tả-lỗi>` | `fix/pdf-parse-page-number` · `fix/workspace-isolation-query` |
| Tái cấu trúc | `refactor/<tên-module>` | `refactor/spring-security-jwt` · `refactor/minio-storage-service` |
| Tài liệu | `docs/<nội-dung>` | `docs/update-api-readme` · `docs/rag-retrieval-spec` |

---

## 📝 2. Quy chuẩn Viết Commit (Conventional Commits)

Mỗi commit message phải thể hiện rõ mục đích theo định dạng:

```
<type>(<scope>): <mô tả ngắn gọn>
```

**Scope gợi ý theo service:** `backend` · `ai-service` · `frontend` · `infra` · `docs`

| Type | Mục đích | Ví dụ |
| :--- | :--- | :--- |
| `feat` | Thêm tính năng mới | `feat(ai-service): add bloom taxonomy prompt orchestration` |
| `fix` | Sửa lỗi | `fix(backend): fix 403 forbidden on ai generation endpoint` |
| `docs` | Cập nhật tài liệu, README, chú thích | `docs: update system architecture blueprint` |
| `style` | Định dạng code (không đổi logic) | `style(frontend): apply prettier formatting` |
| `refactor` | Tái cấu trúc không thêm tính năng | `refactor(ai-service): optimize pgvector hnsw index query` |
| `test` | Thêm hoặc sửa unit/integration test | `test(backend): add workspace isolation integration test` |
| `chore` | Cập nhật thư viện, cấu hình Docker | `chore: upgrade spring-boot to 3.3.0` |
| `ci` | Cập nhật CI/CD workflows | `ci: add ai-service pytest job to github actions` |

---

## 🎨 3. Quy chuẩn Định dạng Code (Code Formatting Standards)

### A. Frontend — React 18 + TypeScript + Vite

**Quy tắc đặt tên:**
- Component & File component: `PascalCase` → `LessonPlanner.tsx`, `QuizCard.tsx`
- Custom Hooks: `camelCase` bắt đầu bằng `use` → `useLessonPlan.ts`, `useWorkspace.ts`
- Utils / Services / Stores: `camelCase` → `apiClient.ts`, `workspaceStore.ts`

**Kiến trúc Component:**
- Sử dụng **Functional Components** với TypeScript Interfaces/Types rõ ràng
- Không viết logic gọi API trực tiếp trong UI — gom vào `src/services/`
- State management toàn cục qua **Zustand** (`src/stores/`)
- Axios client tập trung với interceptors JWT tại `src/lib/apiClient.ts`
- **Tuyệt đối không** lưu secrets hay API keys trong biến môi trường frontend

### B. Backend — Java 17 + Spring Boot 3

**Kiến trúc phân tầng:**
```
Controller → Service (Interface + Impl) → Repository → Entity / DTO
```

**Quy tắc:**
- Bắt buộc dùng **DTO** khi nhận và trả dữ liệu ra API — không expose Entity JPA trực tiếp
- Dùng **Lombok** (`@Getter`, `@Setter`, `@RequiredArgsConstructor`, `@Builder`) để giảm boilerplate
- Bắt buộc xử lý ngoại lệ tập trung qua `@RestControllerAdvice` (Global Exception Handler)
- Package theo **feature**: `auth/`, `workspace/`, `document/`, `generation/`, `user/`
- Test class phải dùng `@ActiveProfiles("test")` (H2 in-memory, Flyway disabled)

### C. AI Service — Python 3.12 + FastAPI

**Chuẩn PEP 8 & Type Hints:**
- Mọi hàm **bắt buộc** có type hint:
  ```python
  async def generate_quiz(query: str, top_k: int = 5) -> QuizResponse:
  ```
- Format code bằng **Black**, lint bằng **Flake8**

**Validation & Security:**
- Bắt buộc dùng **Pydantic v2** (`BaseModel`, `Field`) cho tất cả request/response schema và structured LLM output
- Retrieved document content là **UNTRUSTED DATA** — bắt buộc wrap trong `<sources>...</sources>` boundary trước khi truyền vào prompt
- FastAPI chỉ là **internal service** — mọi request phải đi qua Spring Boot authentication gateway

---

## 🔀 4. Quy trình Tạo Pull Request (PR)

### Checklist trước khi tạo PR:

- [ ] Đã chạy linter và format: `npm run lint` (frontend) · `mvn clean compile` (backend) · `black . && flake8` (ai-service)
- [ ] Code chạy thành công trên môi trường local, không phát sinh lỗi
- [ ] Không vô tình commit file nhạy cảm: `.env`, credentials, `node_modules/`, `target/`, `__pycache__/`
- [ ] Đã viết hoặc cập nhật test cho logic thay đổi

### Tiêu đề PR:

Tuân thủ quy chuẩn Conventional Commit:
```
[FEAT] Tích hợp trích dẫn Citation vào AI Lesson Planner
[FIX] Sửa lỗi workspace isolation khi query pgvector
```

### Mẫu mô tả PR (PR Description Template):

```markdown
### 📌 Mục đích thay đổi
- Mô tả ngắn gọn lý do tạo PR này.

### 🛠️ Các thay đổi chính
- [ ] Thay đổi 1
- [ ] Thay đổi 2

### 🧪 Kết quả kiểm thử
- Mô tả kết quả test thực tế

### 🔗 Liên kết liên quan
- Fixes #<issue_number> (nếu có)
```

### Nguyên tắc Merge:

- Sử dụng **Squash and Merge** để giữ lịch sử commit gọn gàng
- Chỉ merge khi tất cả CI checks pass

---

## 🏗️ 5. Môi trường Phát triển Local

### Yêu cầu:

| Công cụ | Phiên bản |
| :--- | :--- |
| Java (JDK) | 17+ |
| Python | 3.12+ |
| Node.js | 20+ |
| Docker & Docker Compose | Latest |
| PostgreSQL | 16 (với pgvector extension) |

### Khởi động 4 Terminal:

```bash
# Terminal 1 — Infrastructure (PostgreSQL + MinIO)
docker compose up -d postgres minio

# Terminal 2 — Spring Boot Backend
cd backend
./mvnw spring-boot:run

# Terminal 3 — FastAPI AI Service
cd ai-service
uvicorn app.main:app --reload --port 8001

# Terminal 4 — React Frontend
cd frontend
npm run dev
```

### Biến môi trường:

Sao chép `.env.example` thành `.env` và điền giá trị thực:
```bash
cp .env.example .env
```

> **QUAN TRỌNG**: File `.env` đã được `.gitignore`. Tuyệt đối không commit file `.env` chứa credentials thực lên Git.

---

## 🛡️ 6. Nguyên tắc Bảo mật & AI Governance

1. **Prompt Injection Prevention**: Retrieved document content phải được đặt trong `<sources>...</sources>` — không bao giờ được inject vào system instructions
2. **Workspace Isolation**: Mọi query pgvector bắt buộc có `workspace_id` filter — vi phạm trả về `403 Forbidden`
3. **Structured Output**: Tất cả AI output phải được validate qua Pydantic schema trước khi lưu hoặc trả về client
4. **Insufficient Evidence**: Khi context không đủ, pipeline phải trả `insufficient_evidence` thay vì hallucinate nội dung
5. **Student PII**: Thông tin cá nhân học sinh (tên, điểm, mã học sinh) nằm **ngoài phạm vi MVP** — nghiêm cấm xử lý

---

## ❓ 7. Câu hỏi & Hỗ trợ

- Xem tài liệu thiết kế hệ thống: [`AI_TEACHER_COPILOT_BLUEPRINT.md`](./AI_TEACHER_COPILOT_BLUEPRINT.md)
- Xem tài liệu API: [`API_DOCS.md`](./API_DOCS.md)
- Xem lịch sử thay đổi: [`CHANGELOG.md`](./CHANGELOG.md)
- Xem lộ trình tương lai: [`FUTURE_GOAL.md`](./FUTURE_GOAL.md)
