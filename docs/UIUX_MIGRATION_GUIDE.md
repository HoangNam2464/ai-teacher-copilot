# BÁO CÁO PHÂN TÍCH VÀ HƯỚNG DẪN CHUYỂN ĐỔI UI/UX + KIẾN TRÚC FRONTEND
## REFERENCE TỪ STUDYIELD $\to$ ÁP DỤNG CHO DỰ ÁN **AI TEACHER COPILOT**

> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về SOURCE_OF_TRUTH.md. File này chỉ giữ phần đặc tả nghiệp vụ/component logic riêng, không được định nghĩa lại token hay quy tắc composition.

---

## MỤC LỤC
1. [Phân Tích Kiến Trúc Frontend Của Studyield](#1-phân-tích-kiến-trúc-frontend-của-studyield)
2. [Phân Tích Studyield Design System & Design Tokens](#2-phân-tích-studyield-design-system--design-tokens)
3. [Các UI/UX Patterns Tinh Hoa Cần Kế Thừa](#3-các-uiux-patterns-tinh-hoa-cần-kế-thừa)
4. [So Sánh Nghiệp Vụ: Studyield vs. AI Teacher Copilot](#4-so-sánh-nghiệp-vụ-studyield-vs-ai-teacher-copilot)
5. [Nguyên Tắc: Điểm Nên Áp Dụng & Điểm Không Nên Áp Dụng](#5-nguyên-tắc-điểm-nên-áp-dụng--điểm-không-nên-áp-dụng)
6. [Đề Xuất Cấu Trúc Mã Nguồn Chuẩn Cho AI Teacher Copilot](#6-đề-xuất-cấu-trúc-mã-nguồn-chuẩn-cho-ai-teacher-copilot)
7. [Hướng Dẫn Chuyển Đổi Chi Tiết Từng Bước (Step-by-Step Migration Guide)](#7-hướng-dẫn-chuyển-đổi-chi-tiết-từng-bước)
   * [Bước 1: Cài đặt Dependencies & Cấu hình Tailwind + CSS Tokens](#bước-1-cài-đặt-dependencies--cấu-hình-tailwind--css-tokens)
   * [Bước 2: Xây dựng Bộ Primitives UI (Atoms Layer)](#bước-2-xây-dựng-bộ-primitives-ui-atoms-layer)
   * [Bước 3: Xây dựng Shell Layout (Teacher Sidebar + Header + Quick Switcher)](#bước-3-xây-dựng-shell-layout)
   * [Bước 4: Xây dựng Dual-Pane Workspace (AI Lesson Planner)](#bước-4-xây-dựng-dual-pane-workspace-ai-lesson-planner)
   * [Bước 5: Xây dựng Token Streaming & Citation Drawer (RAG Grounding SGK)](#bước-5-xây-dựng-token-streaming--citation-drawer)
   * [Bước 6: Xây dựng Bộ Soạn Đề Thi STEM & KaTeX Formula Engine](#bước-6-xây-dựng-bộ-soạn-đề-thi-stem--katex-formula-engine)
   * [Bước 7: Xây dựng Module Chấm Bài & So Khớp Rubric](#bước-7-xây-dựng-module-chấm-bài--so-khớp-rubric)
8. [Lộ Trình Triển Khai Theo Giai Đoạn (Phased Roadmap)](#8-lộ-trình-triển-khai-theo-giai-đoạn)

---

## 1. PHÂN TÍCH KIẾN TRÚC FRONTEND CỦA STUDYIELD

### 1.1. Công nghệ nền tảng (Tech Stack)
* **Core:** React 18/19 + TypeScript / JavaScript + Vite.
* **Styling:** Tailwind CSS + Biến HSL CSS Variables (shadcn/ui style).
* **UI Primitives:** Radix UI primitives kết hợp `class-variance-authority` (CVA) và `tailwind-merge`.
* **State Management:** Zustand với store tách biệt theo từng domain chức năng.
* **Rich Content & Toán học:** `KaTeX` + `react-katex`, `react-markdown` + `remark-gfm`.

---

## 2. PHÂN TÍCH STUDYIELD DESIGN SYSTEM & DESIGN TOKENS

> Xem [SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md), mục **PHẦN 1 — DESIGN TOKENS** để xem toàn bộ bảng HSL tokens, radius hierarchy và shadow tokens chuẩn của AI Teacher Copilot.

---

## 3. CÁC UI/UX PATTERNS TINH HOA CẦN KẾ THỪA (CHỈ ÁP DỤNG CHO NHÓM C — WORKSPACE SCREEN)

> ⚠️ Toàn bộ các pattern dưới đây CHỈ áp dụng cho **Nhóm C (Workspace Screen)** (Lesson Planner, Exam Generator, Grading). **CẤM áp dụng vào Nhóm A (Action Screen như Login/Register)** theo quy tắc trong `SOURCE_OF_TRUTH.md`.

### 3.1. AI Token Streaming & Typewriter UX (Nhóm C)
* Phản hồi của AI stream từng token theo thời gian thực kèm con trỏ nhấp nháy `span.animate-pulse`.
* Khi stream hoàn tất, tự động hiển thị các action buttons: **Sao chép (Copy)**, **Xuất bản (Export Word/PDF)**, **Tạo lại (Regenerate)**.

### 3.2. RAG Citation & Evidence Grounding Drawer (Nhóm C)
* Tự động chuyển đổi các ký hiệu trích dẫn `[1]`, `[2]` thành các **Citation Badge** có thể bấm được.
* Khi giáo viên click vào badge trích dẫn, một Panel trích dẫn (`CitationDrawer`) trượt ra, hiển thị đoạn trích nguyên văn từ SGK/Tài liệu kèm chỉ số tin cậy.

### 3.3. Multi-Agent Reasoning Step Decomposition (Nhóm C)
* Chia quy trình AI xử lý bài toán/giáo án phức tạp thành các bước rõ ràng:
  $$\text{Chuẩn đầu ra (Bloom)} \longrightarrow \text{Ma trận kiến thức} \longrightarrow \text{Kịch bản hoạt động} \longrightarrow \text{Đánh giá Rubric}$$

### 3.4. Dual-Pane Split Workspace (Nhóm C)
* **Cột trái (35% - 40%):** Tham số đầu vào (Chọn bài, Chọn mức độ, Thêm yêu cầu sư phạm).
* **Cột phải (60% - 65%):** Khung xem trước tài liệu trực tiếp (Live Preview Markdown + KaTeX, cho phép sửa trực tiếp như Word).

---

## 4. SO SÁNH NGHIỆP VỤ: STUDYIELD VS. AI TEACHER COPILOT

| Tiêu chí | Studyield (Học sinh/Sinh viên) | AI Teacher Copilot (Giáo viên & Nhà trường) |
|---|---|---|
| **Mục đích sử dụng** | Tự học, làm bài tập cá nhân, ôn bài | Soạn giáo án, ra đề thi theo ma trận, quản lý lớp |
| **Bản sắc thị giác** | Xanh lục Emerald (`#10B981`) + Gamification | Xanh Teal học thuật (`#0D9488` / `172 84% 32%`) + Neutral Slate |
| **Mật độ thông tin** | Thoáng (Spacious) | Nhóm C (Workspace) có mật độ cao; Nhóm A (Action) tối giản |
| **Đơn vị xử lý chính** | Flashcard, Quiz câu hỏi đơn lẻ | Kế hoạch bài dạy (KHBD), Ma trận đề thi, Bảng Rubric |
| **Định dạng đầu ra** | Web interactive | Tệp tài liệu sư phạm chuẩn: `.docx` (Word), `.pdf` |

---

## 5. NGUYÊN TẮC: ĐIỂM NÊN ÁP DỤNG & ĐIỂM KHÔNG NÊN ÁP DỤNG

###  ĐIỂM NÊN HỌC TẬP (Áp dụng đúng nhóm trang):
1. **Kiến trúc Shell hiện đại (Nhóm C):** Sidebar phân nhóm nghiệp vụ + Header chọn Ngữ cảnh (Môn/Lớp).
2. **Design Tokens & Theme System:** Tách biệt biến màu CSS Variables HSL.
3. **Dual-Pane Editor Layout (Nhóm C):** Bố cục 2 cột chia đôi màn hình cho soạn thảo.
4. **Interactive Citation & RAG Grounding (Nhóm C):** Trích dẫn chuẩn trang SGK.
5. **STEM Math Rendering Engine (Nhóm C):** Sử dụng KaTeX cho công thức toán học.

###  ĐIỂM KHÔNG NÊN ÁP DỤNG:
1. **Không mang yếu tố Gamification của học sinh vào:** Loại bỏ điểm thưởng XP, Level, Streak, Leaderboard.
2. **Không sao chép nhận diện thương hiệu:** Tuyệt đối không dùng logo, tên gọi, hình ảnh hay bảng màu xanh lá của Studyield.
3. **Không áp dụng mật độ cao vào màn Action (Nhóm A):** Màn Login/Register phải tuyệt đối tinh gọn theo `SOURCE_OF_TRUTH.md`.

---

## 6. ĐỀ XUẤT CẤU TRÚC MÃ NGUỒN CHUẨN CHO AI TEACHER COPILOT

> Xem [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md) để xem chi tiết bản đồ cấu trúc thư mục chuẩn của dự án.

---

## 7. HƯỚNG DẪN CHUYỂN ĐỔI CHI TIẾT TỪNG BƯỚC (STEP-BY-STEP MIGRATION GUIDE)

### BƯỚC 1: CÀI ĐẶT DEPENDENCIES & CẤU HÌNH TAILWIND + CSS TOKENS

#### 1.1. Cài đặt các thư viện cần thiết
```bash
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs class-variance-authority clsx tailwind-merge lucide-react framer-motion zustand @tanstack/react-query react-markdown remark-gfm katex react-katex
```

#### 1.2. Cấu hình bảng màu AI Teacher Copilot trong `index.css`
Tạo hoặc cập nhật file `src/index.css` với HSL Semantic Tokens theo `SOURCE_OF_TRUTH.md`:

```css
@layer base {
  :root {
    --background: 172 25% 98%;
    --foreground: 222 47% 11%;

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    --primary: 172 84% 32%;
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222 47% 11%;

    --accent: 25 95% 48%;
    --accent-foreground: 0 0% 100%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 172 84% 32%;

    --radius: 0.5rem; /* 8px chuẩn */
  }
}
```

---

### BƯỚC 2: XÂY DỰNG BỘ PRIMITIVES UI (ATOMS LAYER)

#### 2.1. Utility `src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### 2.2. Button Component (`src/components/ui/button.tsx`)
```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border bg-background hover:bg-muted text-foreground",
        ghost: "hover:bg-muted text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

### BƯỚC 3: XÂY DỰNG SHELL LAYOUT (TEACHER SIDEBAR + HEADER — NHÓM C WORKSPACE)

```tsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  FileQuestion,
  GraduationCap,
  Library,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navGroups = [
  {
    group: "Soạn giảng & Đánh giá",
    items: [
      { label: "Soạn giáo án (Kế hoạch bài dạy)", icon: BookOpen, href: "/lesson-planner" },
      { label: "Ngân hàng & Tạo đề thi", icon: FileQuestion, href: "/exam-bank" },
      { label: "Trợ lý chấm bài & Rubrics", icon: GraduationCap, href: "/auto-grading" },
    ]
  },
  {
    group: "Kho học liệu & Học sinh",
    items: [
      { label: "Kho SGK & Chuẩn GDPT", icon: Library, href: "/knowledge-hub" },
      { label: "Quản lý Lớp & Học sinh", icon: Users, href: "/classes" },
      { label: "Báo cáo phân tích chất lượng", icon: BarChart3, href: "/analytics" },
    ]
  }
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState("Lớp 10A1 - Môn Toán");

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Giáo viên */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-foreground tracking-tight block">AI Teacher Copilot</span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Trợ lý Sư phạm</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((grp, idx) => (
            <div key={idx}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {grp.group}
              </p>
              <div className="space-y-1">
                {grp.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt hệ thống</span>
          </Link>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground hidden sm:inline">Ngữ cảnh:</span>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60 hover:bg-muted text-xs font-semibold border border-border">
              <span>{currentClass}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="accent" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soạn nhanh bằng AI</span>
            </Button>
          </div>
        </header>

        <main className="p-4 lg:p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
```

---

### BƯỚC 4: XÂY DỰNG DUAL-PANE WORKSPACE (AI LESSON PLANNER — NHÓM C)

```tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, BookOpen, Check, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function LessonPlanWorkspace() {
  const [topic, setTopic] = useState("Định luật II Newton - Vật lý 10");
  const [grade, setGrade] = useState("Lớp 10");
  const [duration, setDuration] = useState("45 phút (1 tiết)");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessonContent, setLessonContent] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLessonContent("");
    
    const sampleOutput = `
# KẾ HOẠCH BÀI DẠY: ĐỊNH LUẬT II NEWTON
**Môn học:** Vật lí -- **Khối:** 10 -- **Thời lượng:** 45 phút

---

## I. MỤC TIÊU BÀI HỌC (THEO CHUẨN GDPT 2018)
### 1. Kiến thức & Năng lực vật lí
* Phát biểu được định luật II Newton và viết được hệ thức: $\\vec{F} = m\\vec{a}$ [1].
* Nêu được định nghĩa đơn vị lực Newton ($1\\text{ N} = 1\\text{ kg}\\cdot\\text{m/s}^2$).
    `;

    let current = "";
    for (let i = 0; i < sampleOutput.length; i += 8) {
      await new Promise((r) => setTimeout(r, 20));
      current += sampleOutput.slice(i, i + 8);
      setLessonContent(current);
    }
    setIsGenerating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-8rem)]">
      <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-full flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-base">Cấu hình Kế hoạch Bài dạy</h2>
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tên bài học / Chủ đề</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background outline-none"
              >
                <option>Lớp 10</option>
                <option>Lớp 11</option>
                <option>Lớp 12</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Thời lượng</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background outline-none"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          loading={isGenerating}
          className="w-full gap-2 shadow-sm font-semibold"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "AI đang soạn giáo án..." : "Tạo Kế Hoạch Bài Dạy"}
        </Button>
      </div>

      <div className="lg:col-span-8 bg-card border border-border rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary" /> Văn bản Kế hoạch bài dạy
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(lessonContent);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              disabled={!lessonContent}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? "Đã chép" : "Sao chép"}
            </Button>
            <Button size="sm" variant="accent" disabled={!lessonContent} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Word (.docx)</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none dark:prose-invert leading-relaxed">
          {lessonContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonContent}</ReactMarkdown>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 py-20">
              <BookOpen className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm">Chưa có nội dung. Điền thông tin bên trái và bấm nút Tạo để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### BƯỚC 5: XÂY DỰNG TOKEN STREAMING & CITATION DRAWER (NHÓM C)

```tsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CitationItem {
  id: number;
  bookTitle: string;
  page: number;
  snippet: string;
  relevanceScore: number;
}

export function CitationDrawer({
  citation,
  onClose,
}: {
  citation: CitationItem | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {citation && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-16 bottom-0 w-80 sm:w-96 bg-card border-l border-border shadow-2xl z-40 p-5 flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                {citation.id}
              </div>
              <span className="font-bold text-sm">Nguồn Trích Dẫn SGK</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-1">
              <span className="text-xs font-semibold text-primary block">{citation.bookTitle}</span>
              <span className="text-xs text-muted-foreground">Trang: {citation.page}</span>
              <div className="flex items-center gap-1 text-[11px] text-primary font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Độ tương đồng: {Math.round(citation.relevanceScore * 100)}%
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5 uppercase">
                Trích đoạn nguyên văn:
              </label>
              <blockquote className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary text-xs leading-relaxed italic text-foreground">
                "{citation.snippet}"
              </blockquote>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button size="sm" variant="outline" className="w-full gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Mở trang SGK ({citation.page})
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### BƯỚC 6: XÂY DỰNG BỘ SOẠN ĐỀ THI STEM & KATEX FORMULA ENGINE (NHÓM C)

```tsx
import React from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionProps {
  index: number;
  level: "Nhận biết" | "Thông hiểu" | "Vận dụng" | "Vận dụng cao";
  content: string;
  mathFormula?: string;
  options: string[];
  correctAnswer: number;
}

export function MathQuestionCard({ index, level, content, mathFormula, options, correctAnswer }: QuestionProps) {
  return (
    <Card className="border-border">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-primary">Câu {index + 1}</CardTitle>
        <Badge variant="outline" className="text-xs font-medium">
          {level}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-1 space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{content}</p>
        
        {mathFormula && (
          <div className="p-2.5 bg-muted/40 rounded-lg text-center overflow-x-auto">
            <BlockMath math={mathFormula} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {options.map((opt, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                i === correctAnswer
                  ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px]">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### BƯỚC 7: XÂY DỰNG MODULE CHẤM BÀI & SO KHỚP RUBRIC (NHÓM C)

```tsx
import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface RubricCriteria {
  name: string;
  maxScore: number;
  awardedScore: number;
  feedback: string;
}

export function RubricEvaluationTable({ criteria }: { criteria: RubricCriteria[] }) {
  const totalScore = criteria.reduce((sum, c) => sum + c.awardedScore, 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-sm">Bảng Đánh Giá Theo Rubric</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          Tổng điểm: {totalScore} / {maxTotal}
        </span>
      </div>

      <div className="divide-y divide-border text-xs">
        {criteria.map((c, i) => (
          <div key={i} className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-foreground">{c.name}</span>
              <span className="text-primary font-bold">{c.awardedScore} / {c.maxScore} đ</span>
            </div>
            <p className="text-muted-foreground leading-relaxed flex items-start gap-1.5">
              {c.awardedScore === c.maxScore ? (
                <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
              )}
              {c.feedback}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN (PHASED ROADMAP)

```
Sprint 1: Design Tokens & Layout Shell (Tokens, Button, Card, Sidebar, Header)
   └── Sprint 2: AI Lesson Planner (Dual-Pane Workspace, Stream Engine, Export Docx)
          └── Sprint 3: Smart Exam & KaTeX Engine (Ma trận 4 cấp độ, Sinh trắc nghiệm)
                 └── Sprint 4: RAG Knowledge Hub (Upload SGK, Citation Drawer)
                        └── Sprint 5: Auto-Grading & Analytics (Rubric Matcher, Dashboard Lớp)
```
