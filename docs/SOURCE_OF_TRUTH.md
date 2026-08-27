# SOURCE_OF_TRUTH.md — Nguồn Chân Lý Duy Nhất cho AI Teacher Copilot

> File này là nơi DUY NHẤT định nghĩa: màu/token, component rule, phân loại trang,
> và công thức tạo độ "đẹp/chỉn chu" (craft). Mọi file khác (UI_UX_KNOWLEDGE.md,
> MASTER.md, COMPONENT_SPECS.md, FRONTEND_ARCHITECTURE.md, UIUX_MIGRATION_GUIDE.md...)
> KHÔNG còn quyền định nghĩa lại các mục dưới đây — nếu chúng có nội dung trùng,
> phải sửa để trỏ về file này thay vì lặp lại.
>
> Được tổng hợp từ: (1) Báo cáo Audit mâu thuẫn tài liệu, (2) Guardrails.md (ngưỡng
> composition), (3) mã nguồn thật `frontend/src` của Studyield (để lấy công thức
> "đẹp" thật, không phải suy diễn).

---

## PHẦN 1 — DESIGN TOKENS (đã sửa theo Audit, thay thế mọi bản cũ)

```css
:root {
  --background: 172 25% 98%;
  --foreground: 222 47% 11%;

  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  --primary: 172 84% 32%;          /* Academic Teal #0D9488 — KHÔNG dùng Emerald 152 69% 40% cũ nữa */
  --primary-foreground: 0 0% 100%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222 47% 11%;

  --accent: 25 95% 48%;            /* Amber #EA580C — CHỈ dùng cho nút biệt lập (Xuất bản/Tạo đề), KHÔNG dùng làm .btn-primary */
  --accent-foreground: 0 0% 100%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 172 84% 32%;             /* KHÔNG hardcode rgba(59,130,246,...) xanh dương nữa */

  --radius: 0.5rem;                /* 8px — Input/Button */
}
```

**Radius hierarchy (thống nhất, thay mọi bảng cũ):**
| Đối tượng | Giá trị |
|---|---|
| Input / Button | 8px (`rounded-lg`) |
| Card / Dialog | 12–16px (`rounded-xl` đến `rounded-2xl`) |
| Chat bubble / Slide | 16px |
| Avatar / Badge / Pill | `rounded-full` |

### 1.1. Bloom Taxonomy Badge Tokens (bắt buộc, dùng cho Citation/Quiz Bloom Tag — Nhóm C/D)

Đây là palette CỐ ĐỊNH, không được tự thêm màu mới ngoài 6 cặp dưới đây. Mỗi badge
dùng cặp `bg` (nền nhạt) + `fg` (chữ đậm cùng tông) để đảm bảo contrast ≥ 4.5:1,
tách biệt hoàn toàn khỏi `--primary`/`--accent` để không phá luật "tối đa 2 màu
accent trên 1 màn hình" — nhóm badge này được tính là 1 hệ thống riêng, không tính
vào ngân sách màu accent thông thường.

```css
:root {
  /* Nhận biết (Remember) */
  --bloom-remember-bg: 214 100% 96%;
  --bloom-remember-fg: 214 84% 40%;

  /* Thông hiểu (Understand) */
  --bloom-understand-bg: 189 94% 95%;
  --bloom-understand-fg: 192 82% 31%;

  /* Vận dụng (Apply) — dùng lại họ màu primary để giữ liên kết thị giác */
  --bloom-apply-bg: 172 60% 94%;
  --bloom-apply-fg: 172 84% 24%;

  /* Vận dụng cao / Phân tích (Analyze) */
  --bloom-analyze-bg: 38 100% 95%;
  --bloom-analyze-fg: 32 81% 33%;

  /* Đánh giá (Evaluate) */
  --bloom-evaluate-bg: 270 60% 96%;
  --bloom-evaluate-fg: 271 60% 42%;

  /* Sáng tạo (Create) */
  --bloom-create-bg: 340 82% 96%;
  --bloom-create-fg: 336 68% 38%;
}
```

**Cách dùng chuẩn (Badge component):**
```css
.bloom-badge--remember  { background: hsl(var(--bloom-remember-bg));  color: hsl(var(--bloom-remember-fg)); }
.bloom-badge--understand{ background: hsl(var(--bloom-understand-bg)); color: hsl(var(--bloom-understand-fg)); }
.bloom-badge--apply     { background: hsl(var(--bloom-apply-bg));     color: hsl(var(--bloom-apply-fg)); }
.bloom-badge--analyze   { background: hsl(var(--bloom-analyze-bg));   color: hsl(var(--bloom-analyze-fg)); }
.bloom-badge--evaluate  { background: hsl(var(--bloom-evaluate-bg));  color: hsl(var(--bloom-evaluate-fg)); }
.bloom-badge--create    { background: hsl(var(--bloom-create-bg));   color: hsl(var(--bloom-create-fg)); }
```

**Luật cứng:** 6 cặp trên là toàn bộ palette được phép cho Bloom Tag. Không tự
phối thêm màu thứ 7. Không dùng các cặp này cho mục đích khác ngoài Bloom Tag
(ví dụ không dùng `--bloom-analyze-fg` làm màu warning chung — warning dùng
`--destructive` hoặc `--accent` đã định nghĩa ở trên).

**Cấm tuyệt đối (theo Audit loại 1 & 4):**
- Không hardcode hex trong code mẫu (`#F0FDFA`, `#0D948820`...) → luôn dùng `hsl(var(--token) / alpha)`
- Không dùng lại class Tailwind cũ `bg-emerald-*`, `text-emerald-*`, `ring-emerald-*` của Studyield gốc
- Không dùng Emoji làm icon hệ thống (⏳ 📭 📄 ⚠️) → luôn dùng SVG/Lucide icon
- Focus ring không hardcode xanh dương → `box-shadow: 0 0 0 2px hsl(var(--ring) / 0.15)`

---

## PHẦN 2 — PHÂN LOẠI TRANG & NGÂN SÁCH (nguyên văn từ Guardrails.md, giữ nguyên quyền cao nhất)

| Nhóm | Ví dụ | Mật độ | Composition được phép |
|---|---|---|---|
| **A. Action** | Login, Register, Confirm | Tối giản, ≤8 dòng chữ | Không badge, không feature card, không blob động |
| **B. Marketing** | Landing, Pricing | Giàu hình ảnh, cho phép chuyển động | Blob nền, gradient text, demo mockup động, tối đa 3-4 feature card |
| **C. Workspace** | Lesson Planner, Exam Generator | Dense, nhiều dữ liệu | Badge dữ liệu lặp lại được, nhưng màu accent tối đa 2 |
| **D. Data** | Class list, Analytics | Dense, dạng bảng | Ưu tiên bảng/số liệu, hạn chế trang trí |

Toàn bộ pattern "tinh hoa" (Citation Drawer, Agent Timeline, GDPT badge, Class Quick
Switcher...) trong UIUX_MIGRATION_GUIDE.md **chỉ áp dụng cho Nhóm C**, cấm xuất hiện ở Nhóm A.

---

## PHẦN 2.1 — ÁNH XẠ TRANG THẬT → NHÓM (bắt buộc tra bảng này trước khi code, không tự suy đoán)

| Trang thật (theo FRONTEND_ARCHITECTURE.md) | Nhóm | Ghi chú |
|---|---|---|
| LoginPage | A | Tối giản tuyệt đối, xem Phần 2 |
| RegisterPage | A | Tối đa 4 field theo ngân sách Nhóm A |
| ForgotPasswordPage | A | Không tồn tại trong bản hiện tại — PHẢI bổ sung |
| HomePage / Landing (nếu có) | B | Áp dụng đầy đủ công thức craft Phần 3 |
| WorkspaceListPage | D | Danh sách, ưu tiên card/table gọn, không cần blob/gradient |
| DocumentManagementPage | D | Bảng dữ liệu + uploader, mật độ cao nhưng không trang trí |
| LessonPlannerPage / LessonDetailPage | C | Dual-pane, áp dụng craft mức "tối giản" theo bảng Phần 4 |
| QuizGeneratorPage / QuizDetailPage | C | Tương tự Lesson Planner |
| HistoryListPage | D | Dạng bảng/lịch sử, không trang trí |
| ClassAnalyticsPage / AnalyticsPage | D | Ưu tiên biểu đồ/số liệu, không blob |
| SettingsPage | A | Cùng độ tối giản với Action Screen dù không phải form đăng nhập |

**Luật bắt buộc:** khi có trang mới ngoài danh sách trên, phải bổ sung dòng mới vào
đúng bảng này (không được code trước, phân loại sau). Nếu chưa chắc nhóm nào, mặc
định chọn nhóm **thấp mật độ hơn** (A/D) rồi mới nâng lên nếu thực sự cần — không
mặc định chọn nhóm cao (B/C) vì rủi ro nhồi nhét luôn cao hơn rủi ro quá đơn giản.

---

## PHẦN 3 — CÔNG THỨC "ĐẸP" (Craft Formula, trích thật từ code Studyield `HeroSection.tsx`)

Đây là phần audit trước chưa xử lý: **khác biệt giữa "đúng token" và "đẹp" nằm ở đây.**
Studyield đẹp không phải vì màu đúng, mà vì 4 kỹ thuật craft sau — chỉ dùng ở **Nhóm B (Marketing)**,
dùng rất tiết chế ở Nhóm C, và **không dùng ở Nhóm A (Action Screen)**.

### 3.1. Blob nền chuyển động (Ambient Background)
```
- 2-3 khối blur-3xl, kích thước 500-800px, đặt lệch góc (không đối xứng)
- Opacity cực thấp: 0.15 - 0.4, và tự dao động theo thời gian (scale + opacity animate)
- Thời lượng animation dài: 8-15s, easeInOut, lặp vô hạn — KHÔNG nhấp nháy nhanh
- Luôn phủ thêm 1 lớp gradient-to-b từ background/0 → background phía dưới để
  hoà tan blob vào nền, tránh viền cứng
```
Áp dụng: Nhóm B toàn phần. Nhóm C: được phép 1 blob rất nhẹ (opacity ≤0.1) nếu cần, không bắt buộc.
Nhóm A: **cấm hoàn toàn** — đây chính là lỗi đã xảy ra ở màn Login trước đó.

### 3.2. Gradient Text cho từ khoá (không phải cả câu)
```
- Chỉ tô gradient lên 1 CỤM TỪ trong headline (vd riêng "kế hoạch bài dạy"),
  không tô cả headline
- Gradient 3 điểm dừng cùng họ màu (vd green→emerald→teal), không pha màu đối lập
- Có thể thêm 1 nét gạch chân SVG vẽ tay bên dưới cụm từ đó (path animate pathLength 0→1)
```
Áp dụng: Nhóm B (headline landing). Nhóm A: headline giữ 1 màu foreground, không gradient.

### 3.3. Motion rhythm cho nội dung xuất hiện (Stagger + Ease)
```
- Container dùng staggerChildren: 0.1, delayChildren: 0.2
- Từng item: initial opacity 0 + y:30 → animate opacity 1 + y:0
- Easing dùng cubic-bezier tuỳ chỉnh [0.22, 1, 0.36, 1] (ease-out mạnh, không linear)
- Nút CTA: thêm micro-motion nhẹ liên tục (icon mũi tên lắc x:[0,4,0] lặp vô hạn 1.5s)
```
Áp dụng: mọi nhóm được dùng stagger khi nội dung load lần đầu — đây là polish rẻ,
an toàn, không vi phạm ngân sách chữ/màu. Nhóm A dùng phiên bản tối giản: chỉ
fade+slide nhẹ cho card đăng nhập khi trang load, không lặp vô hạn.

### 3.4. Layering & Elevation (Card nổi khối thật, không phải shadow phẳng)
```
- Card chính: bg-card/95 + backdrop-blur-xl + border border-border/50 + shadow-2xl
- Thêm 1 lớp "glow" phía sau card: absolute -inset-3, cùng gradient màu chủ đạo,
  blur-2xl, opacity dao động nhẹ 0.1→0.2→0.1 (tạo cảm giác card "phát sáng nhẹ")
- Titlebar/header phụ bên trong card (nếu có) dùng nền muted/50 + 1 dải sáng
  gradient chạy ngang lặp vô hạn (x: -100%→100%, linear, 4s) — hiệu ứng "đang hoạt động"
```
Áp dụng: Nhóm B/C cho khối demo/preview chính. Nhóm A: chỉ dùng dòng đầu (card nổi
khối cơ bản), KHÔNG dùng lớp glow động hay dải sáng chạy — quá thừa cho 1 form đăng nhập.

---

## PHẦN 4 — QUY TẮC ÁP DỤNG CRAFT THEO NHÓM TRANG (bảng quyết định nhanh)

| Kỹ thuật craft | Nhóm A (Login) | Nhóm B (Landing) | Nhóm C (Workspace) |
|---|---|---|---|
| Blob nền động | ❌ | ✅ đầy đủ | ⚠️ tối giản, tuỳ chọn |
| Gradient text | ❌ | ✅ 1 cụm từ | ❌ |
| Stagger motion khi load | ✅ bản tối giản | ✅ đầy đủ | ✅ bản tối giản |
| Glow layer sau card | ❌ | ✅ | ⚠️ chỉ cho khối AI streaming chính |
| Dải sáng chạy (shimmer) | ❌ | ✅ | ✅ khi AI đang generate |
| Micro-motion nút CTA | ✅ 1 hiệu ứng nhẹ | ✅ | ✅ |

**Luật đọc bảng:** ✅ = dùng thoải mái theo công thức mục 3. ⚠️ = dùng nhưng giảm
cường độ (opacity/duration thấp hơn). ❌ = cấm, nếu AI tự thêm phải xoá ngay theo
Gate Checklist của Guardrails.md.

---

## PHẦN 4.1 — IMPLEMENTATION CODE THẬT CHO CÔNG THỨC CRAFT (thay thế mô tả bằng lời)

Mô tả bằng lời ở Phần 3 dễ bị mỗi lần code lại hiểu khác nhau một chút → độ "đẹp"
trôi dần qua từng trang. Do đó 3 file dưới đây là **implementation chuẩn duy nhất**,
mọi trang PHẢI `import`, KHÔNG được tự viết lại blob/gradient/stagger từ mô tả:

| File | Công thức tương ứng | Dùng ở |
|---|---|---|
| `craft/AmbientBackground.tsx` | Phần 3.1 — Blob nền động | Nhóm B (`intensity="full"`), Nhóm C (`intensity="subtle"`) |
| `craft/GradientText.tsx` | Phần 3.2 — Gradient text | Chỉ Nhóm B |
| `craft/motion-variants.ts` | Phần 3.3 — Motion rhythm | `fullContainerVariants`/`fullItemVariants` cho Nhóm B; `minimalContainerVariants`/`minimalItemVariants` cho Nhóm A/C |

**Luật cứng:** nếu 1 file code khác định nghĩa lại `staggerChildren`, giá trị
`duration` blob, hoặc gradient stop màu khác với 3 file trên → coi là lỗi trùng
lặp (giống lỗi Bloom token đã xảy ra), phải xoá và import lại từ nguồn.

---

## PHẦN 5.1 — QUY TẮC CHỐNG TRÙNG LẶP CODE COMPONENT (Button, Card, Input...)

Hiện tượng đã xảy ra: code `Button` bị dán lặp nguyên văn ở `MASTER.md`,
`COMPONENT_SPECS.md`, `UIUX_MIGRATION_GUIDE.md` — 3 bản có thể trôi lệch nhau bất
cứ lúc nào ai đó sửa 1 bản mà quên bản kia (đúng cơ chế đã gây ra lỗi thiếu Bloom
token).

**Luật bắt buộc áp dụng ngay:**
1. Chỉ tồn tại **1 nơi duy nhất** chứa code thật của mỗi component:
   `frontend/src/core/components/ui/Button.jsx` (và tương tự cho Card, Input...).
2. Mọi tài liệu khác (`MASTER.md`, `COMPONENT_SPECS.md`, `UIUX_MIGRATION_GUIDE.md`)
   KHÔNG được dán lại toàn bộ code — chỉ được:
   - Mô tả **props/API/behavior** bằng bảng (không phải code triển khai)
   - Trỏ đường dẫn: `Xem implementation tại core/components/ui/Button.jsx`
3. Nếu 1 file bắt buộc cần ví dụ code để minh hoạ cách dùng (usage example), ví dụ
   đó chỉ được chứa đoạn **gọi component** (`<Button variant="accent">...`), không
   được chứa đoạn **định nghĩa component** (`const buttonVariants = cva(...)`).

---

## PHẦN 5 — CÁCH CÁC FILE KHÁC PHẢI TRỎ VỀ FILE NÀY

Thêm dòng sau vào đầu mỗi file cũ (`UI_UX_KNOWLEDGE.md`, `MASTER.md`,
`COMPONENT_SPECS.md`, `UIUX_MIGRATION_GUIDE.md`, `FRONTEND_ARCHITECTURE.md`):

```
> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về
> SOURCE_OF_TRUTH.md. File này chỉ giữ lại phần đặc tả nghiệp vụ/component logic
> riêng, không được định nghĩa lại token hay quy tắc composition.
```

Sau đó xoá khỏi các file cũ: mọi bảng màu HSL/hex, mọi định nghĩa radius, mọi đoạn
mô tả "nên thêm/gợi ý bổ sung" không kèm giới hạn nhóm trang.

---

## PHẦN 7 — QA CHECKLIST ĐỐI CHIẾU TRỰC QUAN (bắt buộc trước khi merge bất kỳ trang nào)

Token/luật đúng trên giấy không đảm bảo kết quả render đẹp — bước này bắt buộc
bằng mắt, không thể thay thế bằng đọc code:

1. [ ] Chụp screenshot trang vừa code (desktop 1440px + mobile 390px).
2. [ ] Đặt cạnh 1 screenshot tương ứng của Studyield thật (cùng loại trang nếu
       có, hoặc trang gần nhất về vai trò — vd Login đối chiếu Login).
3. [ ] Tự hỏi: nhìn thoáng qua 3 giây, trang có cảm giác "chỉn chu, có chủ đích"
       như bản đối chiếu không, hay có cảm giác "AI generate, nhồi nhét"?
4. [ ] Đếm nhanh số màu nền/accent xuất hiện — đối chiếu với trần ở Phần 5.
5. [ ] Nếu là Nhóm A: che nửa dưới màn hình — nửa trên có đứng vững, không mất
       trọng tâm không? (xem Guardrails.md mục 7)
6. [ ] Kiểm tra `prefers-reduced-motion` có được tôn trọng không (test bằng
       DevTools emulate hoặc OS setting).
7. [ ] Nếu bất kỳ mục nào ở trên "Không đạt" → quay lại sửa, KHÔNG merge trước,
       sửa sau.

**Lưu ý:** bước này không thể giao hoàn toàn cho AI tự đánh giá qua mô tả text —
cần người thật nhìn ảnh chụp thật và so sánh, vì đây là bước duy nhất bắt được
sai lệch về "cảm giác" mà không có ngưỡng số nào đo được chính xác.