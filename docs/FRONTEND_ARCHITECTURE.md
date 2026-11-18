# AI Teacher Copilot — Đặc Tả Kiến Trúc & Quy Chuẩn Tổ Chức Frontend

> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về SOURCE_OF_TRUTH.md. File này chỉ giữ phần đặc tả nghiệp vụ/component logic riêng, không được định nghĩa lại token hay quy tắc composition.
> Stack: React 18, Vite, Zustand, React Router v6, Axios, Vanilla CSS / SCSS Tokens.

---

## 1. TỔNG QUAN NGUYÊN TẮC THIẾT KẾ FRONTEND

Cấu trúc Frontend của AI Teacher Copilot được xây dựng theo mô hình **Domain-Driven Modular Architecture (Feature-First)** kết hợp với **Shared Core Layer**, tuân thủ 4 nguyên tắc cốt lõi:

1. **Feature-Sliced**: Toàn bộ mã nguồn liên quan đến một nghiệp vụ nằm trọn trong thư mục feature tương ứng (`components/`, `hooks/`, `services/`, `types/`, `pages/`).
2. **Pure Shared Core**: Tầng `core/` chỉ chứa các thành phần dùng chung độc lập, **zero-domain-logic**, được tái sử dụng bởi ít nhất 2 feature trở lên.
3. **Single Source of Truth (SSOT) Routing**: Toàn bộ URL đường dẫn được tập trung hóa trong file hằng số `paths.js`.
4. **Unidirectional Dependency (Quy tắc phụ thuộc một chiều)**: Kiểm soát chặt chẽ ranh giới import giữa các tầng.

---

## 2. BẢN ĐỒ CẤU TRÚC THƯ MỤC CHI TIẾT (`frontend/src/`)

```text
frontend/src/
├── app/                                    # TẦNG 1: BOOTSTRAP & ROUTING
│   ├── routes/
│   │   ├── paths.js                        # SSOT Dictionary URL (/login, /workspaces, /lesson-planner,...)
│   │   ├── AppRoutes.jsx                   # Master Routes & Layout Wrappers (<Outlet />)
│   │   └── PrivateRoute.jsx                # Route Guard (Auth & Active Workspace verification)
│   └── App.jsx                             # Root Component bọc Providers & Layout
│
├── core/                                   # TẦNG 2: SHARED CORE (Zero-Domain-Logic)
│   ├── components/                         # UI Primitives & Shared Widgets
│   │   ├── ui/                             # Button, Input, Dropdown, Card, Badge, Spinner, Alert
│   │   ├── feedback/                       # Toast, ConfirmModal, EmptyState, ErrorBoundary
│   │   ├── datatable/                      # DataTableWrapper (Table bọc phân trang & lọc)
│   │   ├── export/                         # ExportDropdown.jsx (Nút bấm xuất file PDF/Word)
│   │   └── citation/                       # CitationBadge.jsx, CitationDrawer.jsx
│   │
│   ├── layouts/                            # Master Layouts (React Router Outlet)
│   │   ├── DashboardLayout.jsx             # Sidebar + Header + Workspace Selector + <Outlet />
│   │   ├── AuthLayout.jsx                  # Clean centered layout cho Login/Register (Nhóm A - xem SOURCE_OF_TRUTH.md)
│   │   └── FocusLayout.jsx                 # Fullscreen layout cho editor soạn giáo án/đề thi
│   │
│   ├── services/                           # Shared Infrastructure Services
│   │   ├── client.js                       # Axios instance (Base URL, JWT Bearer, 401 Interceptor)
│   │   ├── endpoints.js                    # Hằng số URL endpoint backend
│   │   └── exportService.js                # Service xử lý download Blob file (Word/PDF)
│   │
│   ├── store/                              # Global State (Zustand)
│   │   ├── authStore.js                    # Token, User profile, isAuthenticated, login, logout
│   │   └── workspaceStore.js               # Active workspace, workspace list, switchWorkspace
│   │
│   ├── hooks/                              # Shared Custom Hooks
│   │   ├── useAuth.js                      # Tiện ích đăng nhập/đăng xuất
│   │   ├── useWorkspace.js                 # Hook lấy và chuyển đổi workspace
│   │   ├── useDebounce.js                  # Hỗ trợ tìm kiếm realtime
│   │   └── useClipboard.js                 # Copy nội dung giáo án / đề thi
│   │
│   ├── utils/                              # Pure Helper Functions
│   │   ├── downloadHelper.js               # Kích hoạt tải file từ Blob stream
│   │   ├── formatters.js                   # formatDate, formatFileSize
│   │   └── validators.js                   # validateEmail, sanitizeInput
│   │
│   ├── types/                              # Shared Data Types
│   │   ├── common.types.js                 # ApiResponse, PaginationMeta
│   │   └── citation.types.js               # CitationSource, ProvenanceMetadata
│   │
│   └── constants/                          # System Constants
│       ├── sidebarData.js                  # Config-driven menu thanh bên
│       └── appConfig.js                    # File upload limits (50MB), default configs
│
├── features/                               # TẦNG 3: DOMAIN-DRIVEN FEATURE MODULES
│   │
│   ├── auth/                               # Phân hệ Xác thực
│   │   ├── components/                     # LoginForm.jsx, RegisterForm.jsx, PasswordStrengthMeter.jsx
│   │   ├── services/                       # authApi.js (login, register)
│   │   ├── types/                          # auth.types.js (LoginRequest, AuthResponse)
│   │   └── pages/                          # LoginPage.jsx, RegisterPage.jsx
│   │
│   ├── workspace/                          # Phân hệ Quản lý Workspace
│   │   ├── components/                     # WorkspaceCard.jsx, CreateWorkspaceModal.jsx
│   │   ├── services/                       # workspaceApi.js
│   │   ├── types/                          # workspace.types.js (Workspace, CreateWorkspaceDto)
│   │   └── pages/                          # WorkspaceListPage.jsx
│   │
│   ├── documents/                          # Phân hệ Tài liệu & Knowledge Base
│   │   ├── components/                     # DocumentUploader.jsx (Dropzone), DocumentTable.jsx
│   │   ├── services/                       # documentApi.js (upload, list, delete)
│   │   ├── types/                          # document.types.js (Document, ProcessingStatus)
│   │   └── pages/                          # DocumentManagementPage.jsx
│   │
│   ├── lesson-planner/                     # Phân hệ Soạn Giáo Án AI
│   │   ├── components/                     # LessonConfigForm.jsx, LessonSectionCard.jsx, RegenerateModal.jsx
│   │   ├── hooks/                          # useLessonPlanEditor.js
│   │   ├── services/                       # lessonPlannerApi.js
│   │   ├── types/                          # lessonPlan.types.js (LessonPlan, LessonSection, Objective)
│   │   └── pages/                          # LessonPlannerPage.jsx, LessonDetailPage.jsx
│   │
│   ├── quiz-generator/                     # Phân hệ Sinh Đề Thi / Câu Hỏi AI
│   │   ├── components/                     # QuizConfigForm.jsx, MCQQuestionCard.jsx, BloomTaxonomyTag.jsx
│   │   ├── hooks/                          # useQuizEditor.js
│   │   ├── services/                       # quizApi.js
│   │   ├── types/                          # quiz.types.js (Quiz, QuizQuestion, MCQOption, BloomLevel)
│   │   └── pages/                          # QuizGeneratorPage.jsx, QuizDetailPage.jsx
│   │
│   └── history/                            # Phân hệ Lịch sử & Review
│       ├── components/                     # VersionLineageTree.jsx, HistoryTable.jsx, ReviewStatusBadge.jsx
│       ├── services/                       # historyApi.js
│       ├── types/                          # history.types.js (GenerationHistoryRecord, VersionChain)
│       └── pages/                          # HistoryListPage.jsx
│
├── styles/                                 # TẦNG 4: DESIGN SYSTEM & TOKENS
│   ├── variables.css                       # HSL Color tokens, Typography, Spacing, Shadows
│   ├── base.css                            # CSS Reset & base element styling
│   ├── components.css                      # Styling cho các shared UI components
│   ├── layout.css                          # Styling cho Header, Sidebar, Dashboard grid
│   └── main.css                            # Entry point gom toàn bộ styles
│
├── main.jsx                                # React Root Bootstrap
└── index.html
```

---

## 3. QUY TẮC PHỤ THUỘC BẤT KHẢ XÂM PHẠM (DEPENDENCY RULES)

```text
┌─────────────────────────────────────────────────────────────┐
│                          app/                               │
│              (Bootstrap, Routing, Providers)                │
│└───────────────┬─────────────────────────────┬──────────────┘
│                │                             │
│                ▼                             ▼
┌───────────────────────────────┐     ┌───────────────────────┐
│          features/*           │ ──> │         core/         │
│ (auth, workspace, lesson,...) │     │ (UI, services, store) │
└───────────────────────────────┘     └───────────────────────┘
                │                                 ▲
                │         NGHIÊM CẤM:             │
                ├─────────────────────────────────┘
                │ Core KHÔNG ĐƯỢC import Feature
                │
                ▼
        NGHIÊM CẤM: Feature A ──x──> Feature B
        (Không import chéo giữa các Feature)
```

1. **Rule 1 (`app` → `features` & `core`)**: `app/` được phép import từ cả `features/` và `core/`.
2. **Rule 2 (`features` → `core`)**: Mọi feature được phép import từ `core/`.
3. **Rule 3 (`core` ❌ `features`)**: `core/` tuyệt đối **không** được import từ `features/`.
4. **Rule 4 (`feature A` ❌ `feature B`)**: Các feature **không** được import trực tiếp file nội bộ của nhau. Nếu cần dùng chung, hãy chuyển component/logic đó lên `core/`.

---

## 4. TIÊU CHUẨN ĐƯA CODE VÀO `core/` (BỘ LỌC 3 TIÊU CHÍ)

Để tránh biến `core/` thành "thùng rác chứa code tạm bợ", chỉ đưa vào `core/` khi thỏa mãn đồng thời:
1. **Zero Domain Logic**: Không chứa nghiệp vụ đặc thù (môn học, Bloom taxonomy, schema giáo án).
2. **Multi-Feature Usage**: Được sử dụng thực tế ở **ít nhất 2 feature trở lên**.
3. **High Reusability**: Là UI primitive (Button, Modal, Card), hạ tầng mạng (Axios), hoặc State dùng chung toàn app (Auth, Workspace).

---

## 5. QUY CHUẨN DATA CONTRACT & TYPES PER FEATURE

Mỗi feature bắt buộc có thư mục `types/` định nghĩa cấu trúc dữ liệu, đồng bộ 1:1 với Pydantic schema của FastAPI và DTO của Spring Boot:

- `features/lesson-planner/types/lessonPlan.types.js`:
  ```javascript
  /**
   * @typedef {Object} LessonSection
   * @property {string} title
   * @property {number} duration_minutes
   * @property {string} content
   * 
   * @typedef {Object} LessonPlan
   * @property {string} title
   * @property {string} subject
   * @property {string} grade_level
   * @property {number} duration_minutes
   * @property {string[]} objectives
   * @property {LessonSection[]} sections
   * @property {string[]} materials_needed
   * @property {string[]} source_chunk_ids
   * @property {boolean} insufficient_evidence
   */
  ```

- `features/quiz-generator/types/quiz.types.js`:
  ```javascript
  /**
   * @typedef {Object} QuizQuestion
   * @property {number} question_number
   * @property {"MCQ" | "SHORT_ANSWER"} type
   * @property {string} question_text
   * @property {string[]|null} options
   * @property {string} correct_answer
   * @property {string} explanation
   * @property {string} bloom_taxonomy_level
   * @property {string[]} source_chunk_ids
   * 
   * @typedef {Object} Quiz
   * @property {string} title
   * @property {string} subject
   * @property {string} grade_level
   * @property {string} topic
   * @property {"EASY" | "MEDIUM" | "HARD"} difficulty
   * @property {QuizQuestion[]} questions
   * @property {boolean} insufficient_evidence
   */
  ```

---

## 6. XỬ LÝ KHẢ NĂNG XUẤT BẢN WORD / PDF (EXPORT CAPABILITY)

Export không phải là một Page độc lập mà là một **Shared Capability**.
- **Service**: `core/services/exportService.js` gọi `POST /api/workspaces/{id}/export/{generationId}?format=PDF|DOCX` nhận binary blob.
- **Component**: `core/components/export/ExportDropdown.jsx` hiển thị nút dropdown "Xuất tài liệu (Word/PDF)" gắn trên thanh công cụ của Lesson Planner, Quiz Generator, và History Page.
- **Helper**: `core/utils/downloadHelper.js` kích hoạt trình duyệt lưu file về máy giáo viên.
