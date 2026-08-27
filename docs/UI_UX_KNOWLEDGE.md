# AI_TEACHER_COPILOT_UI_UX_KNOWLEDGE

This document captures the comprehensive UI/UX design standards, Design System tokens, component specifications, and interaction patterns for the **AI Teacher Copilot for K-12 Teachers** frontend.

- **Stack**: React 18 · Vite · Tailwind CSS · Zustand (State Management) · Axios · Lucide Icons
- **Design Philosophy**: Calm, trustworthy, highly legible, teacher-centric productivity interface (not flashy or noisy AI aesthetic).

---

## 1. Executive Summary & Design Philosophy

Teachers operate in high-stress, time-constrained environments. AI Teacher Copilot's frontend is designed with 4 foundational UX pillars:

1. **Clarity & Trust First**: Clean surfaces, generous whitespace, legible typography, and emerald/green primary accents for calm authority.
2. **Transparent AI Process (No Black Box)**: Clearly indicate retrieval, generation, and validation states with progress indicators rather than generic indefinite loaders.
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
│   │   └── ui/                 ← Button.jsx, Card.jsx, Input.jsx, Badge.jsx, Spinner.jsx
│   ├── layouts/
│   │   ├── DashboardLayout.jsx ← Sidebar + Header + Main Container
│   │   ├── AuthLayout.jsx      ← Centered card layout for Login / Register
│   │   └── FocusLayout.jsx     ← Distraction-free full-screen editor layout
│   ├── store/                  ← authStore.js, workspaceStore.js (Zustand)
│   ├── services/               ← client.js (Axios + JWT interceptor), endpoints.js
│   └── utils/                  ← formatters.js, validators.js, downloadHelper.js
├── features/
│   ├── auth/                   ← LoginPage.jsx, RegisterPage.jsx, LoginForm.jsx
│   ├── workspace/              ← WorkspaceListPage.jsx, WorkspaceCard.jsx
│   ├── documents/              ← DocumentManagementPage.jsx, DocumentUploader.jsx
│   ├── lesson-planner/         ← LessonPlannerPage.jsx (Split View Form & Preview)
│   ├── quiz-generator/         ← QuizGeneratorPage.jsx (Bloom Taxonomy Selector)
│   └── history/                ← HistoryListPage.jsx, VersionComparisonModal.jsx
└── styles/
    ├── variables.css           ← CSS Custom Properties (Theme tokens)
    ├── base.css                ← Reset & base typography
    ├── components.css          ← Core UI component classes
    ├── layout.css              ← Shell, sidebar, grid utilities
    └── main.css                ← Root Tailwind imports
```

---

## 3. Design System & Tokens

### Color Palette

| Token | CSS Variable / Value | Purpose |
|---|---|---|
| **Primary** | `hsl(152, 69%, 40%)` (`#16a34a`) | Primary actions, CTA buttons, active navigation, success indicators |
| **Primary Foreground** | `hsl(0, 0%, 100%)` (`#ffffff`) | Text on primary buttons and badges |
| **Background** | `hsl(150, 30%, 99%)` (`#f8faf9`) | Main application canvas background |
| **Surface (Card)** | `hsl(0, 0%, 100%)` (`#ffffff`) | Card backgrounds, drawer panels, modal content |
| **Muted** | `hsl(210, 40%, 96.1%)` (`#f1f5f9`) | Secondary button background, table headers, hover states |
| **Muted Foreground** | `hsl(215.4, 16.3%, 46.9%)` (`#64748b`) | Subtitles, metadata, timestamps, helper text |
| **Border** | `hsl(214.3, 31.8%, 91.4%)` (`#e2e8f0`) | Card borders, dividers, table cell borders |
| **Text Primary** | `hsl(150, 20%, 10%)` (`#0f172a`) | Headings, body text, form input text |
| **Accent / Bloom** | HSL Curated Palette | Bloom Taxonomy tags (Remember, Understand, Apply, etc.) |

### Typography

- **Font Family**: `Inter, system-ui, -apple-system, sans-serif`
- **Heading 1 (Page Title)**: `text-2xl font-bold tracking-tight text-slate-900`
- **Heading 2 (Section Title)**: `text-lg font-semibold text-slate-800`
- **Body Text**: `text-sm font-normal text-slate-700 leading-relaxed`
- **Caption / Metadata**: `text-xs font-medium text-slate-500`

### Elevation & Shape

- **Border Radius**: `rounded-xl` (12px) for cards and modals; `rounded-lg` (8px) for buttons and inputs.
- **Shadows**:
  - `shadow-sm`: Standard resting card elevation
  - `shadow-md`: Hover elevation on interactive cards
  - `shadow-xl`: Modal dialogs and Citation Drawer

---

## 4. Key UI Components & Interaction Specs

### 1. Citation Badge (`CitationBadge.jsx`)
- **Visual**: Pill-shaped badge `[1]`, `[2]` in `bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-mono text-xs font-semibold cursor-pointer`.
- **Interaction**: Clicking badge slides open the **Citation Drawer** anchored to the right, highlighting the specific source excerpt and page number.

### 2. Citation Drawer (`CitationDrawer.jsx`)
- **Position**: Fixed slide-out drawer on right edge (`w-96`, full height, `z-50`).
- **Content**:
  - Source Document Title (e.g. `SGK_Toan_10_Tap1.pdf`)
  - Page Number badge (e.g. `Trang 42`)
  - Quoted Text Excerpt with highlighted matched context
  - Cosine Relevance Similarity score badge (e.g. `Relevance: 92%`)

### 3. Lesson Planner Split-View (`LessonPlannerPage.jsx`)
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

### 4. Quiz Generator (`QuizGeneratorPage.jsx`)
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

## 5. Micro-Interactions & States

| State / Trigger | Visual Feedback | Transition |
|---|---|---|
| **Button Hover** | Subtle darken `bg-emerald-600` → `bg-emerald-700`, slight shadow elevation | `transition-all duration-150 ease-out` |
| **Card Hover** | Border transitions to `border-emerald-300`, subtle upward float `translate-y-[-2px]` | `transition-transform duration-200` |
| **Drawer Open** | Slides in from right `translate-x-0` with backdrop fade `bg-black/40` | `transition-transform duration-300 ease-in-out` |
| **AI Generating** | Pulse skeleton shimmer on preview panel + step progress tracker (Parsing → Retrieving → Generating) | `animate-pulse` |
| **Citation Click** | Citation badge scales `scale-105`, drawer opens focused on chunk | `transition-transform duration-100` |

---

## 6. Bloom Taxonomy Visual Tag System

| Bloom Level (EN) | Cấp độ Bloom (VI) | Badge Style |
|---|---|---|
| **Remember** | Nhận biết | `bg-blue-50 text-blue-700 border-blue-200` |
| **Understand** | Thông hiểu | `bg-cyan-50 text-cyan-700 border-cyan-200` |
| **Apply** | Vận dụng | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| **Analyze** | Vận dụng cao (Phân tích) | `bg-amber-50 text-amber-700 border-amber-200` |
| **Evaluate** | Đánh giá | `bg-orange-50 text-orange-700 border-orange-200` |
| **Create** | Sáng tạo | `bg-purple-50 text-purple-700 border-purple-200` |

---

## 7. Accessibility (a11y) & Usability Standards

- **Keyboard Navigable**: All citation badges, modal dialogs, and form controls support standard `Tab`, `Enter`, and `Esc` key navigation.
- **Focus Rings**: High-contrast focus rings `focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2` on all interactive elements.
- **Contrast Ratios**: Body text on surface meets WCAG AA standard (contrast ratio ≥ 4.5:1).
- **Responsive Layout**: Full desktop split-view collapses gracefully into stacked tabs on tablet and mobile viewport screens.

---

*AI Teacher Copilot for K-12 Teachers · UI/UX Design System Specification*
