# AI_TEACHER_COPILOT_UI_UX_KNOWLEDGE

> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về SOURCE_OF_TRUTH.md. File này chỉ giữ phần đặc tả nghiệp vụ/component logic riêng, không được định nghĩa lại token hay quy tắc composition.

This document captures the comprehensive UI/UX design standards, component specifications, and interaction patterns for the **AI Teacher Copilot for K-12 Teachers** frontend.

- **Stack**: React 18 · Vite · Tailwind CSS · Zustand (State Management) · Axios · Lucide Icons
- **Design Philosophy**: Calm, trustworthy, highly legible, teacher-centric productivity interface (not flashy or noisy AI aesthetic).

---

## 1. Executive Summary & Design Philosophy

Teachers operate in high-stress, time-constrained environments. AI Teacher Copilot's frontend is designed with 4 foundational UX pillars:

1. **Clarity & Trust First**: Clean surfaces, legible typography, and academic teal primary accents for calm authority.
2. **Transparent AI Process (No Black Box)**: Clearly indicate retrieval, generation, and validation states during AI workflows (Workspace Screen Nhóm C) with progress indicators rather than generic indefinite loaders.
3. **Citation & Provenance Visibility**: Inline citation badges (`[1]`, `[2]`) linked directly to an interactive Citation Drawer displaying original document text and page numbers.
4. **Teacher in the Loop (Editable Drafts)**: AI output is presented as an editable proposal (Split-View or Structured Form) with inline editing, regeneration prompts, and version history.

---

## 2. Frontend Architecture Map

```
frontend/src/
├── app/
│   └── routes/                 ← AppRoutes.jsx, PrivateRoute.jsx, paths.js
├── core/
│   ├── components/
│   │   ├── citation/           ← CitationBadge.jsx, CitationDrawer.jsx
│   │   ├── export/             ← ExportDropdown.jsx (Word & PDF)
│   │   ├── feedback/           ← Toast.jsx, ErrorBoundary.jsx, EmptyState.jsx
│   │   └── ui/                 ← Button.jsx, Card.jsx, Input.jsx, Badge.jsx, Spinner.jsx, Alert.jsx
│   ├── layouts/
│   │   ├── DashboardLayout.jsx ← Sidebar + Header + Main Container
│   │   ├── AuthLayout.jsx      ← Centered card layout for Login / Register (Nhóm A)
│   │   └── FocusLayout.jsx     ← Distraction-free full-screen editor layout
│   ├── store/                  ← authStore.js, workspaceStore.js (Zustand)
│   ├── services/               ← client.js (Axios + JWT interceptor), endpoints.js
│   └── utils/                  ← formatters.js, validators.js, downloadHelper.js
├── features/
│   ├── auth/                   ← LoginPage.jsx, RegisterPage.jsx, LoginForm.jsx, RegisterForm.jsx
│   ├── workspace/              ← WorkspaceListPage.jsx, WorkspaceCard.jsx
│   ├── documents/              ← DocumentManagementPage.jsx, DocumentUploader.jsx
│   ├── lesson-planner/         ← LessonPlannerPage.jsx (Split View Form & Preview)
│   ├── quiz-generator/         ← QuizGeneratorPage.jsx (Bloom Taxonomy Selector)
│   └── history/                ← HistoryListPage.jsx, VersionComparisonModal.jsx
└── styles/
    ├── variables.css           ← CSS Custom Properties (HSL Theme tokens)
    ├── base.css                ← Reset & base typography
    ├── components.css          ← Core UI component classes
    ├── layout.css              ← Shell, sidebar, grid utilities
    └── main.css                ← Root styles entry point
```

---

## 3. Design System & Tokens

> Xem [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md), mục **PHẦN 1 — DESIGN TOKENS** để xem toàn bộ bảng HSL tokens, radius hierarchy và shadow tokens chuẩn.

---

## 4. Key UI Components & Interaction Specs

### 1. Citation Badge (`CitationBadge.jsx`)
- **Visual**: Pill-shaped badge `[1]`, `[2]` sử dụng class `.citation-badge` với màu `hsl(var(--primary))` nhẹ nhàng, font mono, cursor-pointer.
- **Interaction**: Clicking badge slides open the **Citation Drawer** anchored to the right, highlighting the specific source excerpt and page number.

### 2. Citation Drawer (`CitationDrawer.jsx`)
- **Position**: Fixed slide-out drawer on right edge (`w-96`, full height, `z-50`).
- **Content**:
  - Source Document Title (e.g. `SGK_Toan_10_Tap1.pdf`)
  - Page Number badge (e.g. `Trang 42`)
  - Quoted Text Excerpt with highlighted matched context
  - Cosine Relevance Similarity score badge (e.g. `Relevance: 92%`)

### 3. Lesson Planner Split-View (`LessonPlannerPage.jsx` — Nhóm C Workspace)
- **Left Panel (Parameters & Prompts)**:
  - Subject, Grade Level, Topic input
  - Duration selector (45m, 90m)
  - Knowledge Base document selector checkboxes
  - Special requirements prompt textarea
- **Right Panel (Interactive Lesson Plan Document)**:
  - Document Title & Metadata
  - Objectives (Knowledge, Skills, Attitude)
  - Teaching Activities table with editable fields and inline citation badges
  - Action Toolbar: Save Draft, Regenerate Section, Export Word/PDF

### 4. Quiz Generator (`QuizGeneratorPage.jsx` — Nhóm C Workspace)
- **Bloom Taxonomy Distribution Slider / Inputs**:
  - Specify question counts per Bloom level: Nhận biết (Remember), Thông hiểu (Understand), Vận dụng (Apply), Vận dụng cao (Analyze/Create).
- **Interactive Question Cards**:
  - Question text with inline editable field
  - Option list with radio button indicating correct answer
  - Explanation box with grounding citation badge
  - Bloom tag badge with dedicated color coding

### 5. Document Management (`DocumentManagementPage.jsx`)
- **Drag-and-Drop Uploader**: PDF & DOCX validation, progress bar for upload & embedding indexing.
- **Document List Grid**: File icon, title, page count, chunk count, indexing status badge (`Processing`, `Indexed`, `Failed`), delete action.

---

## 5. Micro-Interactions & States (Workspace Screen — Nhóm C)

| State / Trigger | Visual Feedback | Transition |
|---|---|---|
| **Button Hover** | Subtle color shift, slight shadow elevation | `transition-colors duration-150 ease-out` |
| **Card Hover** | Border transitions to `hsl(var(--primary) / 0.4)`, subtle lift | `transition-transform duration-200` |
| **Drawer Open** | Slides in from right `translate-x-0` with backdrop fade | `transition-transform duration-300 ease-in-out` |
| **AI Generating (Nhóm C)** | Shimmer indicator on preview panel + step progress tracker (Parsing → Retrieving → Generating) | `animate-pulse` |
| **Citation Click** | Citation badge scales `scale-105`, drawer opens focused on chunk | `transition-transform duration-100` |

---

## 6. Bloom Taxonomy Visual Tag System

Chuẩn bảng màu cố định 6 cặp token `bg` / `fg` (Contrast ratio ≥ 4.5:1) và hệ thống CSS class theo [`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md#11-bloom-taxonomy-badge-tokens-bắt-buộc-dùng-cho-citationquiz-bloom-tag--nhóm-cd):

| Bloom Level (EN) | Cấp độ Bloom (VI) | CSS Class | Token HSL Pairs (bg / fg) |
|---|---|---|---|
| **Remember** | Nhận biết | `.bloom-badge--remember` | `--bloom-remember-bg` / `--bloom-remember-fg` |
| **Understand** | Thông hiểu | `.bloom-badge--understand` | `--bloom-understand-bg` / `--bloom-understand-fg` |
| **Apply** | Vận dụng | `.bloom-badge--apply` | `--bloom-apply-bg` / `--bloom-apply-fg` |
| **Analyze** | Vận dụng cao (Phân tích) | `.bloom-badge--analyze` | `--bloom-analyze-bg` / `--bloom-analyze-fg` |
| **Evaluate** | Đánh giá | `.bloom-badge--evaluate` | `--bloom-evaluate-bg` / `--bloom-evaluate-fg` |
| **Create** | Sáng tạo | `.bloom-badge--create` | `--bloom-create-bg` / `--bloom-create-fg` |

```css
/* Badge Primitive & Bloom Taxonomy Badges */
.bloom-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  line-height: 1.25;
  white-space: nowrap;
}

.bloom-badge--remember   { background: hsl(var(--bloom-remember-bg));   color: hsl(var(--bloom-remember-fg)); }
.bloom-badge--understand { background: hsl(var(--bloom-understand-bg)); color: hsl(var(--bloom-understand-fg)); }
.bloom-badge--apply      { background: hsl(var(--bloom-apply-bg));      color: hsl(var(--bloom-apply-fg)); }
.bloom-badge--analyze    { background: hsl(var(--bloom-analyze-bg));    color: hsl(var(--bloom-analyze-fg)); }
.bloom-badge--evaluate   { background: hsl(var(--bloom-evaluate-bg));   color: hsl(var(--bloom-evaluate-fg)); }
.bloom-badge--create     { background: hsl(var(--bloom-create-bg));     color: hsl(var(--bloom-create-fg)); }
```

---

## 7. Accessibility (a11y) & Usability Standards

- **Keyboard Navigable**: All citation badges, modal dialogs, and form controls support standard `Tab`, `Enter`, and `Esc` key navigation.
- **Focus Rings**: High-contrast focus rings `box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2)` on all interactive elements.
- **Contrast Ratios**: Body text on surface meets WCAG AA standard (contrast ratio ≥ 4.5:1).
- **Responsive Layout**: Full desktop split-view collapses gracefully into stacked tabs on tablet and mobile viewport screens.

---

*AI Teacher Copilot for K-12 Teachers · UI/UX Design System Specification*
