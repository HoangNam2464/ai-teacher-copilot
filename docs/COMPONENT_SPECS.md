# AI Teacher Copilot — Component Specifications

> Tài liệu đặc tả chính thức các UI component trong `frontend/src/core/components/`.
> Mọi component đều sử dụng CSS design tokens từ `styles/variables.css` — không hard-code màu hay spacing.

---

## 1. Button

**File**: [`core/components/ui/Button.jsx`](../frontend/src/core/components/ui/Button.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Nội dung bên trong button |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Kiểu hiển thị button |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Kích thước button |
| `disabled` | `boolean` | `false` | Vô hiệu hóa button |
| `loading` | `boolean` | `false` | Hiển thị spinner, disable tương tác |
| `className` | `string` | `''` | Class bổ sung |
| `...props` | `HTMLButtonAttributes` | — | Chuyển tiếp xuống `<button>` |

### Behavior & Interactions

- **Hover**: `primary` → màu đậm hơn + shadow nhẹ; `secondary` → background subtle
- **Loading state**: Button bị disable, icon ⏳ xuất hiện bên trái
- **Disabled state**: opacity 0.6, cursor `not-allowed`
- **Transition**: `150ms cubic-bezier(0.4, 0, 0.2, 1)` trên tất cả properties

### CSS Classes
`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.btn-lg`

---

## 2. Input & Textarea

**File**: [`core/components/ui/Input.jsx`](../frontend/src/core/components/ui/Input.jsx)

### Props — Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | ID unique, dùng để link `<label>` |
| `label` | `string` | — | Label hiển thị phía trên input |
| `type` | `string` | `'text'` | HTML input type (`text`, `email`, `password`, ...) |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | — | Giá trị controlled |
| `onChange` | `function` | — | Handler khi value thay đổi |
| `error` | `string` | `''` | Thông báo lỗi (hiển thị màu đỏ bên dưới) |
| `hint` | `string` | `''` | Gợi ý helper (hiển thị màu xám, chỉ khi không có error) |
| `disabled` | `boolean` | `false` | Vô hiệu hóa input |
| `required` | `boolean` | `false` | Đánh dấu field bắt buộc (dấu `*` đỏ) |
| `className` | `string` | `''` | Class bổ sung cho form-group wrapper |

### Props — Textarea (tương tự Input, thêm)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `4` | Số hàng hiển thị |

### Behavior & Interactions

- **Focus**: border xanh `--color-border-focus` + ring glow `rgba(59,130,246,0.15)`
- **Error state**: border đỏ + ring đỏ nhạt + message dưới với `role="alert"`
- **Accessibility**: `aria-invalid`, `aria-describedby` tự động được set khi có error/hint

### CSS Classes
`.form-group`, `.form-label`, `.form-input`, `.form-textarea`, `.form-input--error`, `.form-error`, `.form-hint`, `.form-required`

---

## 3. Card

**File**: [`core/components/ui/Card.jsx`](../frontend/src/core/components/ui/Card.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Nội dung bên trong card |
| `hoverable` | `boolean` | `false` | Kích hoạt hiệu ứng hover (shadow + border đậm hơn) |
| `className` | `string` | `''` | Class bổ sung |
| `...props` | `HTMLDivAttributes` | — | Chuyển tiếp xuống `<div>` |

### Behavior & Interactions

- **Default**: background trắng, border nhẹ, border-radius `12px`, shadow nhỏ
- **Hoverable**: hover → shadow tăng + border đậm hơn (transition 150ms)

### CSS Classes
`.card`, `.card-hover`

---

## 4. Badge

**File**: [`core/components/ui/Badge.jsx`](../frontend/src/core/components/ui/Badge.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Nội dung text |
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'neutral'` | Màu sắc semantic |
| `className` | `string` | `''` | Class bổ sung |

### CSS Classes
`.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-neutral`

---

## 5. Spinner

**File**: [`core/components/ui/Spinner.jsx`](../frontend/src/core/components/ui/Spinner.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Kích thước icon |
| `message` | `string` | `'Đang tải...'` | Text hiển thị bên dưới icon. `''` để ẩn |

### Behavior
- Icon ⏳ với `animation: spin 1s linear infinite`
- Layout column center, thích hợp dùng trong page-level loading states

---

## 6. Toast & ToastContainer

**File**: [`core/components/feedback/Toast.jsx`](../frontend/src/core/components/feedback/Toast.jsx)

### Props — Toast

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string\|number` | **required** | ID unique để tracking và ARIA |
| `message` | `string` | — | Nội dung thông báo |
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Kiểu thông báo |
| `duration` | `number` | `4000` | Thời gian tự đóng (ms). `0` = không tự đóng |
| `onClose` | `function(id)` | — | Callback khi toast được đóng |

### Props — ToastContainer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `toasts` | `Array<ToastProps>` | `[]` | Danh sách toast đang hiển thị |
| `onClose` | `function(id)` | — | Callback propagated tới từng Toast |

### Behavior & Interactions

- **Position**: Fixed bottom-right, z-index 9999
- **Animation**: Slide in từ phải (`translateX`) khi xuất hiện
- **Auto-dismiss**: Timer reset khi `duration` thay đổi
- **Close button**: Nút `✕` ở góc phải, opacity 0.6 → 1 khi hover
- **Accessibility**: `role="alert"`, `aria-live="assertive"` trên mỗi Toast

### Usage Pattern
```jsx
const [toasts, setToasts] = useState([]);
const addToast = (message, variant = 'info') =>
  setToasts(prev => [...prev, { id: Date.now(), message, variant }]);
const removeToast = (id) =>
  setToasts(prev => prev.filter(t => t.id !== id));

// In render:
<ToastContainer toasts={toasts} onClose={removeToast} />
```

---

## 7. ConfirmModal

**File**: [`core/components/feedback/ConfirmModal.jsx`](../frontend/src/core/components/feedback/ConfirmModal.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Controls visibility |
| `title` | `string` | — | Tiêu đề dialog |
| `message` | `string` | — | Nội dung mô tả hành động |
| `confirmLabel` | `string` | `'Xác nhận'` | Label nút xác nhận |
| `cancelLabel` | `string` | `'Hủy'` | Label nút hủy |
| `variant` | `'danger' \| 'primary'` | `'danger'` | Style nút confirm |
| `loading` | `boolean` | `false` | Loading state trên nút confirm |
| `onConfirm` | `function` | — | Callback khi xác nhận |
| `onCancel` | `function` | — | Callback khi hủy hoặc đóng |

### Behavior & Interactions

- **Open**: Nút Cancel được focus tự động (safer UX — tránh confirm vô tình)
- **Escape key**: Tự động gọi `onCancel`
- **Backdrop click**: Click bên ngoài modal box → gọi `onCancel`
- **Loading state**: Cả hai nút bị disable, nút confirm hiển thị `'Đang xử lý...'`
- **Animation**: overlay fade-in + modal scale + slide up

---

## 8. EmptyState

**File**: [`core/components/feedback/EmptyState.jsx`](../frontend/src/core/components/feedback/EmptyState.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | `'📭'` | Emoji/icon character |
| `title` | `string` | — | Tiêu đề chính |
| `description` | `string` | — | Text mô tả thứ cấp |
| `action` | `ReactNode` | — | Slot cho action (thường là `<Button>`) |
| `className` | `string` | `''` | Class bổ sung |

### Usage Pattern
```jsx
<EmptyState
  icon="📄"
  title="Chưa có tài liệu nào"
  description="Tải lên tài liệu đầu tiên để bắt đầu xây dựng kho tri thức."
  action={<Button onClick={handleUpload}>Tải tài liệu lên</Button>}
/>
```

---

## 9. ErrorBoundary

**File**: [`core/components/feedback/ErrorBoundary.jsx`](../frontend/src/core/components/feedback/ErrorBoundary.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Component subtree được bảo vệ |
| `fallback` | `ReactNode \| function({error, reset})` | — | UI fallback tùy chỉnh |

### Behavior

- **Default fallback**: Icon ⚠️ + title đỏ + message + nút "Thử lại"
- **Custom fallback (ReactNode)**: Render trực tiếp
- **Custom fallback (function)**: Nhận `{ error, reset }` — `reset()` xóa error state
- **`componentDidCatch`**: Log to console trong dev; tích hợp Sentry/monitoring trong production

### Usage Pattern
```jsx
// Bao bọc từng feature page:
<ErrorBoundary>
  <LessonPlannerPage />
</ErrorBoundary>

// Custom fallback với reset:
<ErrorBoundary fallback={({ error, reset }) => (
  <EmptyState
    icon="⚠️"
    title="Có lỗi xảy ra"
    description={error.message}
    action={<Button onClick={reset}>Thử lại</Button>}
  />
)}>
  <QuizGeneratorPage />
</ErrorBoundary>
```

---

## 10. CitationBadge & CitationDrawer

**File**: [`core/components/citation/CitationBadge.jsx`](../frontend/src/core/components/citation/CitationBadge.jsx)
**File**: [`core/components/citation/CitationDrawer.jsx`](../frontend/src/core/components/citation/CitationDrawer.jsx)

> Xem chi tiết trong [feature-citation rule](../.agents/rules/feature-citation.md).

---

## 11. ExportDropdown

**File**: [`core/components/export/ExportDropdown.jsx`](../frontend/src/core/components/export/ExportDropdown.jsx)

> Xem chi tiết trong [feature-export rule](../.agents/rules/feature-export.md).
