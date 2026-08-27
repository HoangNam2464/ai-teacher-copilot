# AI Teacher Copilot — Component Specifications

> ⚠️ Token màu, radius, phân loại trang, và công thức craft/polish đã chuyển về SOURCE_OF_TRUTH.md. File này chỉ giữ phần đặc tả nghiệp vụ/component logic riêng, không được định nghĩa lại token hay quy tắc composition.
> Mọi component đều sử dụng CSS design tokens từ `styles/variables.css` — không hard-code màu hay spacing.

---

## 1. Button

**File**: [`core/components/ui/Button.jsx`](../frontend/src/core/components/ui/Button.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Nội dung bên trong button |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'` | `'default'` | Kiểu hiển thị button |
| `size` | `'sm' \| 'default' \| 'lg' \| 'icon'` | `'default'` | Kích thước button (cố định) |
| `disabled` | `boolean` | `false` | Vô hiệu hóa button |
| `loading` | `boolean` | `false` | Hiển thị spinner SVG, disable tương tác |
| `loadingText` | `string` | `''` | Text thay thế khi loading |
| `className` | `string` | `''` | Class bổ sung |
| `...props` | `HTMLButtonAttributes` | — | Chuyển tiếp xuống `<button>` |

### Behavior & Interactions

- **Hover**: `default/primary` → gradient Teal đậm hơn; `secondary` → background subtle
- **Loading state**: Button bị disable, vector spinner xoay mượt mà xuất hiện bên trái, text đổi sang `loadingText` nếu có
- **Disabled state**: opacity 0.5, pointer-events `none`, cursor `not-allowed`
- **Transition**: `150ms cubic-bezier(0.4, 0, 0.2, 1)` trên tất cả properties

### CSS Classes
`.btn`, `.btn-default`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-destructive`, `.btn-sm`, `.btn-lg`, `.btn-icon`

---

## 2. Input & Textarea

**File**: [`core/components/ui/Input.jsx`](../frontend/src/core/components/ui/Input.jsx)

### Props — Input

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **required** | ID unique, dùng để link `<label>` |
| `label` | `string` | — | Label hiển thị phía trên input |
| `labelRight` | `ReactNode` | `null` | Phần tử bên phải hàng label (vd "Quên mật khẩu?") |
| `type` | `string` | `'text'` | HTML input type (`text`, `email`, `password`, ...) |
| `placeholder` | `string` | `''` | Placeholder text |
| `value` | `string` | — | Giá trị controlled |
| `onChange` | `function` | — | Handler khi value thay đổi |
| `onBlur` | `function` | — | Handler khi blur (inline validation) |
| `error` | `string` | `''` | Thông báo lỗi (hiển thị màu đỏ bên dưới với role="alert") |
| `hint` | `string` | `''` | Gợi ý helper (hiển thị màu xám, chỉ khi không có error) |
| `disabled` | `boolean` | `false` | Vô hiệu hóa input |
| `required` | `boolean` | `false` | Đánh dấu field bắt buộc (dấu `*` đỏ) |
| `leftIcon` | `ReactNode` | `null` | Leading icon bên trong input |
| `rightAction` | `ReactNode` | `null` | Trailing action (vd nút toggle ẩn/hiện mật khẩu) |
| `className` | `string` | `''` | Class bổ sung cho form-group wrapper |

### Props — Textarea (tương tự Input, thêm)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | `4` | Số hàng hiển thị |

### Behavior & Interactions

- **Focus**: border `--color-border-focus` + ring glow `hsl(var(--ring) / 0.15)`
- **Error state**: border đỏ `hsl(var(--destructive))` + message dưới với `role="alert"`
- **Accessibility**: `aria-invalid`, `aria-describedby` tự động được set khi có error/hint

### CSS Classes
`.form-group`, `.form-label-row`, `.form-label`, `.form-label-right`, `.form-input`, `.form-textarea`, `.form-input--error`, `.form-error`, `.form-hint`, `.form-required`

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

- **Default**: background `hsl(var(--card))`, border `hsl(var(--border))`, border-radius `12–16px` (`var(--radius-2xl)`), shadow `var(--shadow-card)`
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

## 5. Alert

**File**: [`core/components/ui/Alert.jsx`](../frontend/src/core/components/ui/Alert.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'destructive' \| 'success' \| 'warning' \| 'default'` | `'default'` | Kiểu thông báo |
| `title` | `string` | `''` | Tiêu đề thông báo |
| `children` | `ReactNode` | — | Nội dung thông báo |
| `className` | `string` | `''` | Class bổ sung |

### CSS Classes
`.alert`, `.alert-destructive`, `.alert-success`, `.alert-warning`, `.alert-icon`, `.alert-body`, `.alert-title`, `.alert-description`

---

## 6. Spinner

**File**: [`core/components/ui/Spinner.jsx`](../frontend/src/core/components/ui/Spinner.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Kích thước icon |
| `message` | `string` | `'Đang tải...'` | Text hiển thị bên dưới icon. `''` để ẩn |

### Behavior
- Vector SVG Spinner với `animation: spin 1s linear infinite`
- Layout column center, thích hợp dùng trong page-level loading states

---

## 7. Toast & ToastContainer

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

---

## 8. ConfirmModal

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

---

## 9. EmptyState

**File**: [`core/components/feedback/EmptyState.jsx`](../frontend/src/core/components/feedback/EmptyState.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | `<Inbox />` | Vector SVG icon component |
| `title` | `string` | — | Tiêu đề chính |
| `description` | `string` | — | Text mô tả thứ cấp |
| `action` | `ReactNode` | — | Slot cho action (thường là `<Button>`) |
| `className` | `string` | `''` | Class bổ sung |

### Usage Pattern
```jsx
<EmptyState
  icon={<FileText size={32} className="text-muted-foreground" />}
  title="Chưa có tài liệu nào"
  description="Tải lên tài liệu đầu tiên để bắt đầu xây dựng kho tri thức."
  action={<Button onClick={handleUpload}>Tải tài liệu lên</Button>}
/>
```

---

## 10. ErrorBoundary

**File**: [`core/components/feedback/ErrorBoundary.jsx`](../frontend/src/core/components/feedback/ErrorBoundary.jsx)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Component subtree được bảo vệ |
| `fallback` | `ReactNode \| function({error, reset})` | — | UI fallback tùy chỉnh |

---

## 11. CitationBadge & CitationDrawer

**File**: [`core/components/citation/CitationBadge.jsx`](../frontend/src/core/components/citation/CitationBadge.jsx)  
**File**: [`core/components/citation/CitationDrawer.jsx`](../frontend/src/core/components/citation/CitationDrawer.jsx)  

> Xem chi tiết trong [feature-citation rule](../.agents/rules/feature-citation.md).
