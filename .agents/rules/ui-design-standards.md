---
description: >-
  Rules for UI/UX implementation in AI Teacher Copilot.
  Enforces strict template fidelity to frontend1, minimalism,
  forbids unnecessary text/decorations and prevents "too AI" clutter.
trigger: always_on
---

# Feature Rules: UI/UX & Template Standards

## 1. Core Mandate: Template Fidelity (`frontend1/`)
- Khi xây dựng hoặc chỉnh sửa giao diện cho bất kỳ chức năng nào (Authentication, Workspace, Documents, Lesson Planner, Quiz Generator, History, v.v.), **BẮT BUỘC** phải mở và đối chiếu trực tiếp với trang/component tương ứng trong thư mục mẫu [frontend1/src/](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend1/src).
- Tuân thủ cấu trúc bố cục, tỷ lệ kích thước (ví dụ: kích thước nút social `w-14 h-14 rounded-xl`, độ bo tròn card, khoảng cách padding) và phân cấp thông tin của bản mẫu.
- Không tự ý thay đổi cấu trúc cốt lõi nếu không có yêu cầu cụ thể từ người dùng.

---

## 2. Anti-Clutter & "Không quá AI" (Tránh giao diện mang cảm giác máy móc)
1. **Không thêm văn bản thừa thãi**:
   - Tránh chèn các đoạn văn giải thích lê thê, các khối hướng dẫn "Bước 1, Bước 2, Bước 3..." dài dòng nếu bản mẫu không có.
   - Các nhãn, tiêu đề, placeholder phải ngắn gọn, súc tích, tự nhiên và thực tế với người dùng Việt Nam.
2. **Không tự ý nhồi nhét tính năng & thành phần**:
   - Không tự ý bổ sung các mạng xã hội ngoài mẫu (ví dụ: mẫu chỉ có Google & Apple thì không tự thêm Facebook, Twitter, GitHub...).
   - Không đặt thêm thanh header/footer lặp lại bên ngoài nếu bản mẫu là thẻ Card độc lập căn giữa màn hình.
3. **Thẩm mỹ tinh tế, tự nhiên**:
   - Giữ khoảng trắng (spacing) hợp lý để giao diện thoáng đãng, dễ tập trung.
   - Nền mờ ảo ambient glow và hiệu ứng kính mờ `backdrop-blur-xl` phải dịu nhẹ, sang trọng, không chói gắt.
   - Màu sắc chủ đạo bám sát bảng màu thương hiệu (xanh Emerald / Teal giáo dục) kết hợp hài hòa với phong cách bản mẫu.

---

## 3. Checklist khi hoàn thiện một màn hình UI
- [ ] Đã mở file tương ứng trong `frontend1/` để đối chiếu trực tiếp?
- [ ] Bố cục đã gọn gàng, đơn giản, không bị thừa chi tiết so với mẫu?
- [ ] Đã loại bỏ hết các đoạn text "AI hướng dẫn" rườm rà, máy móc?
- [ ] Các trạng thái rỗng (empty state), đang tải (loading) và lỗi (error) tinh giản, đúng vị trí?
- [ ] Trải nghiệm người dùng mượt mà, tự nhiên và thân thiện với giáo viên K-12?
