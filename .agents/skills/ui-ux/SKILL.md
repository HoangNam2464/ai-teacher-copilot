---
name: ui-ux
description: >-
  Chuyên gia thiết kế UI/UX và giao diện người dùng cho AI Teacher Copilot (React 18,
  Tailwind CSS, Design System, Component Library, Citation Drawer, Split View, Bloom Taxonomy).
  Kích hoạt khi người dùng gõ /ui-ux hoặc yêu cầu thiết kế, chỉnh sửa giao diện và trải nghiệm giáo viên.
---

# UI/UX Expert Skill — AI Teacher Copilot

Kỹ năng này cung cấp hướng dẫn thiết kế, chuẩn Design System, Tokens và Component Patterns để xây dựng giao diện giáo viên (Teacher Workspace) chuẩn xác, thẩm mỹ cao và đáng tin cậy.

---

## 🎨 1. Triết lý Thiết kế (Design Philosophy)

1. **Tin cậy & Rõ ràng (Clarity & Trust)**: Giao diện nền sáng nhẹ (`#f8faf9`), thẻ Card trắng tinh tế, viền mảnh (`#e2e8f0`), điểm nhấn màu xanh lục Emerald (`#16a34a`).
2. **Minh bạch tiến trình AI (No Black Box)**: Hiển thị rõ các trạng thái xử lý (Đang trích xuất → Tìm kiếm ngữ nghĩa → Đang sinh nội dung → Xác thực Pydantic).
3. **Hiển thị Trích dẫn trực quan (Citation Drawer)**: Badge trích dẫn `[1]`, `[2]` có thể click để mở Drawer hiển thị đoạn văn bản gốc và số trang sách.
4. **Giáo viên là người quyết định cuối cùng**: Mọi nội dung AI sinh ra là bản nháp có thể chỉnh sửa trực tiếp (Inline Edit) hoặc yêu cầu tạo lại (Regenerate).

---

## 💎 2. Bảng Màu Chuẩn (Design Tokens)

| Token | Giá trị CSS / Hex | Mục đích sử dụng |
|---|---|---|
| **Primary** | `hsl(152, 69%, 40%)` (`#16a34a`) | Nút CTA chính, Tab đang chọn, icon nổi bật |
| **Primary Hover** | `hsl(152, 69%, 34%)` (`#15803d`) | Hover trên nút chính |
| **Background** | `hsl(150, 30%, 99%)` (`#f8faf9`) | Nền toàn bộ ứng dụng |
| **Surface (Card)** | `#ffffff` | Nền thẻ Card, Modal, Sidebar |
| **Border** | `hsl(214.3, 31.8%, 91.4%)` (`#e2e8f0`) | Đường viền thẻ, phân cách bảng |
| **Text Primary** | `hsl(150, 20%, 10%)` (`#0f172a`) | Tiêu đề, văn bản chính |
| **Text Muted** | `hsl(215.4, 16.3%, 46.9%)` (`#64748b`) | Phụ đề, timestamp, nhãn phụ |

---

## 🏷️ 3. Thẻ Phân loại Bloom Taxonomy

Khi hiển thị câu hỏi hoặc mục tiêu giáo án, sử dụng bảng màu quy chuẩn sau:

- **Remember (Nhận biết)**: `bg-blue-50 text-blue-700 border-blue-200`
- **Understand (Thông hiểu)**: `bg-cyan-50 text-cyan-700 border-cyan-200`
- **Apply (Vận dụng)**: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Analyze (Phân tích / Vận dụng cao)**: `bg-amber-50 text-amber-700 border-amber-200`
- **Evaluate (Đánh giá)**: `bg-orange-50 text-orange-700 border-orange-200`
- **Create (Sáng tạo)**: `bg-purple-50 text-purple-700 border-purple-200`

---

## 🧩 4. Quy tắc Triển khai Component (React 18)

1. **State Management**: Sử dụng Zustand store (`workspaceStore`, `authStore`) thay vì prop drilling.
2. **Icons**: Sử dụng bộ thư viện `lucide-react` nhất quán kích thước `size={18}` hoặc `size={20}`.
3. **Animation & Transition**: Chuyển động nhẹ nhàng (`transition-all duration-150 ease-out`), tránh animation giật mắt hoặc làm chậm thao tác giáo viên.
4. **Form Controls**: Bắt buộc có trạng thái `focus-visible:ring-2 focus-visible:ring-emerald-500` và hiển thị thông báo lỗi rõ ràng.

---

*Tham khảo tài liệu đầy đủ tại [`docs/UI_UX_KNOWLEDGE.md`](file:///D:/DU_AN_2026/Python/ai-teacher-copilot/docs/UI_UX_KNOWLEDGE.md).*
