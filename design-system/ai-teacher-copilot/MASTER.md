# Design System Master File

> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về SOURCE_OF_TRUTH.md. File này chỉ giữ phần đặc tả nghiệp vụ/component logic riêng, không được định nghĩa lại token hay quy tắc composition.

**Project:** AI Teacher Copilot  
**Category:** Productivity Tool for K-12 Teachers  

---

## Global Rules

> Xem [SOURCE_OF_TRUTH.md](../../docs/SOURCE_OF_TRUTH.md) để tra cứu đầy đủ HSL Semantic Tokens, Spacing scale, Radius hierarchy và Quy tắc Composition theo nhóm trang (A/B/C/D).

### Typography

- **Heading Font:** Inter
- **Body Font:** Inter
- **Mood:** Clean, academic, trustworthy, high-contrast, professional utility
- **Google Fonts:** [Inter + Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

---

## Component Specs (Tham chiếu theo SOURCE_OF_TRUTH.md)

### Buttons

```css
/* Primary Button (Gradient 2 tông Academic Teal) */
.btn-primary, .btn-default {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(172 84% 27%) 100%);
  color: hsl(var(--primary-foreground));
  padding: 0 1rem;
  height: 40px;
  border-radius: var(--radius); /* 8px */
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
}

.btn-primary:hover, .btn-default:hover {
  background: linear-gradient(135deg, hsl(172 84% 30%) 0%, hsl(172 84% 24%) 100%);
}

/* Secondary Button */
.btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--border));
  padding: 0 1rem;
  height: 40px;
  border-radius: var(--radius); /* 8px */
  font-weight: 500;
  transition: all 150ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius-2xl); /* 16px max */
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  transition: all 150ms ease;
}
```

### Inputs

```css
.input {
  height: 40px;
  padding: 0 0.875rem;
  border: 1px solid hsl(var(--input));
  border-radius: var(--radius); /* 8px */
  font-size: 14px;
  background-color: hsl(var(--card));
  color: hsl(var(--foreground));
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.input:focus {
  border-color: hsl(var(--ring));
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.15);
}
```

---

## Page Patterns (Chỉ áp dụng cho Nhóm B — Marketing / Landing Page)

> ⚠️ Các quy tắc dưới đây CHỈ áp dụng cho **Nhóm B (Marketing / Landing Page)** theo phân loại trong `SOURCE_OF_TRUTH.md`. CẤM áp dụng cho Nhóm A (Action Screen như Login/Register) hoặc Nhóm C (Workspace).

**Pattern Name:** Product Demo + Features (Nhóm B Only)
- **Section Order:** Hero > Product video/mockup (center) > Feature breakdown per section > Comparison (optional) > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ **Emojis as icons** — Use Vector SVG icons (Lucide/Phosphor)
- ❌ **Hardcoded hex values** — Always use `hsl(var(--token))`
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout bounds
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio (WCAG AA)
- ❌ **Instant state changes** — Always use transitions (150-200ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] Xác định đúng nhóm trang (A/B/C/D) theo `SOURCE_OF_TRUTH.md`
- [ ] No emojis used as icons (use Vector SVG instead)
- [ ] All icons from consistent icon set (Lucide/Phosphor)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible (`box-shadow: 0 0 0 2px hsl(var(--ring) / 0.15)`)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
