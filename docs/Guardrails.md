# GUARDRAILS.md — Ngưỡng An Toàn Composition cho AI Teacher Copilot

> Tài liệu này KHÔNG thay thế Design Tokens / Component Rules đã có (màu, radius, spacing).
> Nó bổ sung phần bị thiếu: **giới hạn số lượng & mật độ** — thứ quyết định giao diện
> có bị "lòe loẹt, nhồi chữ" hay không, bất kể token đúng hay sai.
>
> Nguyên tắc gốc: Token trả lời "trông như thế nào". Guardrail trả lời "được phép có bao nhiêu".
> Thiếu guardrail = có token đúng vẫn ra giao diện sai.

---

## 0. LUẬT ƯU TIÊN (đọc trước mọi tài liệu khác)

Khi một tài liệu thiết kế khác (component spec, migration guide...) mâu thuẫn với
guardrail này về SỐ LƯỢNG hoặc MẬT ĐỘ, **guardrail này thắng**. Các tài liệu khác chỉ
có quyền quyết định màu sắc / component API, không có quyền quyết định "thêm bao nhiêu thứ".

---

## 1. PHÂN LOẠI TRANG (Page Classification) — làm bước đầu tiên, bắt buộc

Trước khi thiết kế BẤT KỲ màn hình nào, phải trả lời: **trang này thuộc nhóm nào?**
Mỗi nhóm có ngân sách riêng, không được mượn ngân sách của nhóm khác.

| Nhóm | Ví dụ | Mục tiêu chính |
|---|---|---|
| **A. Action Screen** | Login, Register, Forgot Password, Confirm Dialog | Hoàn thành 1 hành động nhanh nhất có thể |
| **B. Marketing Screen** | Landing page, Pricing | Thuyết phục, xây uy tín |
| **C. Workspace Screen** | Lesson Planner, Exam Generator, Grading | Làm việc sâu, mật độ cao được phép |
| **D. Data Screen** | Class list, Analytics, Rubric table | Quét thông tin nhanh, ưu tiên bảng/số liệu |

**Luật cứng:** Trang nhóm A **không bao giờ** được mượn pattern của nhóm B (badge uy tín,
feature card, social proof, nhiều màu accent). Đây chính là lỗi đã xảy ra ở màn Login.

---

## 2. NGÂN SÁCH CHO NHÓM A — ACTION SCREEN (Login/Register/...)

Đây là danh sách **đóng** — không tự thêm phần tử ngoài danh sách này:

1. 1 icon/logo hero
2. 1 headline (≤ 5 từ, cảm xúc, KHÔNG mô tả tính năng)
3. 1 dòng subtext (≤ 12 từ)
4. (tuỳ chọn) Social login — tối đa 3 nút
5. Form fields cần thiết tối thiểu (Login: 2 field. Register: tối đa 4 field)
6. 1 CTA chính, full-width, 1 từ hoặc cụm ngắn (≤ 3 từ)
7. 1 link phụ trợ mỗi field nếu cần (vd "Quên mật khẩu?")
8. 1 dòng chuyển trang ở cuối ("Chưa có tài khoản? Đăng ký")

**Cấm tuyệt đối trên nhóm A:**
- Badge chuẩn/chứng nhận (GDPT, 5512, ISO...)
- Feature card / danh sách tính năng
- Trust footer / bảo mật text
- Social proof (đánh giá, số liệu người dùng)
- Cột phụ / split-pane bán nội dung marketing

**Ngưỡng số:**
- Tổng số dòng chữ hiển thị (không tính placeholder): **≤ 8 dòng**
- Số màu accent khác `primary`: **0**
- Số icon trang trí ngoài icon hero: **0**

Nếu bản thiết kế vượt bất kỳ ngưỡng nào ở trên → tự động fail, phải cắt bớt trước khi duyệt.

---

## 3. NGÂN SÁCH CHO NHÓM B — MARKETING SCREEN

Nhóm này MỚI được phép dùng: badge, feature card, social proof, split-pane.
Nhưng vẫn có trần:
- Feature card: tối đa 3–4
- Badge chứng nhận: tối đa 1–2, đặt 1 vị trí duy nhất (không lặp lại ở nhiều chỗ)
- Màu accent ngoài primary: tối đa 1 (vd amber cho CTA nổi bật)

---

## 4. NGÂN SÁCH CHO NHÓM C — WORKSPACE SCREEN

Mật độ cao được phép (đúng như doc migration guide đã nêu), NHƯNG:
- Mật độ cao nghĩa là **nhiều dữ liệu/nhiều trường nhập liệu**, KHÔNG phải nhiều màu
  hoặc nhiều hiệu ứng trang trí.
- Màu accent tối đa vẫn là 2 (primary + 1 accent, vd amber cho nút "Xuất bản").
- Badge trạng thái (Bloom level, citation, processing...) được phép lặp lại nhiều lần
  vì nó mang dữ liệu, nhưng bảng màu của badge phải cố định, không tự sáng tạo thêm màu mới
  ngoài palette đã định nghĩa (xem mục Bloom Tag trong Design Tokens).

---

## 5. LUẬT MÀU TOÀN CỤC (áp dụng mọi nhóm)

- **Tối đa 1 màu accent ngoài primary** trên bất kỳ màn hình đơn lẻ nào, trừ badge dữ liệu
  có palette cố định (Bloom tags) ở nhóm C/D.
- Primary chỉ xuất hiện ở: heading nhấn mạnh, CTA chính, link, trạng thái active/focus.
  Không tô primary lên background lớn, icon trang trí, hoặc nhiều box cùng lúc.
- Nếu 1 màn hình có ≥ 3 màu nền khác nhau (không tính trắng/xám) → tự động fail.

---

## 6. LUẬT CHỮ (Copy Density)

- Headline không được liệt kê tính năng hoặc chuẩn/tiêu chuẩn. Headline chỉ diễn đạt
  cảm xúc hoặc hành động ("Chào mừng trở lại", không phải "Kiến tạo kế hoạch bài dạy chuẩn...").
- Nội dung "uy tín/chuẩn mực" (GDPT, 5512...) chỉ được xuất hiện ở nhóm B hoặc trong
  trang About/Landing, không ở màn hành động.
- 1 ý tưởng = 1 dòng. Không ghép 2 thông điệp vào 1 câu dài.

---

## 7. QUY TRÌNH DUYỆT TRƯỚC KHI SHIP (Gate Checklist)

Trước khi coi 1 màn hình là "xong", trả lời tuần tự — nếu 1 câu trả lời "Không đạt",
quay lại sửa, không tiếp tục:

1. [ ] Đã xác định đúng Nhóm (A/B/C/D) chưa?
2. [ ] Có phần tử nào KHÔNG nằm trong danh sách ngân sách của nhóm đó không? → xoá.
3. [ ] Đếm số màu nền/accent xuất hiện — có vượt trần mục 5 không?
4. [ ] Đếm số dòng chữ hiển thị — có vượt trần của nhóm không?
5. [ ] Che nửa dưới màn hình lại — nửa trên có vẫn đứng vững, dễ hiểu, không mất trọng tâm không?
6. [ ] Nếu là nhóm A: xoá thử phần "uy tín/badge" khỏi thiết kế — có làm mất chức năng
      chính (đăng nhập) không? Nếu không mất gì → nghĩa là phần đó vốn dĩ thừa, giữ nguyên
      quyết định xoá.

---

## 8. TẠI SAO CÓ TOKEN ĐÚNG VẪN RA KẾT QUẢ SAI (ghi lại để không lặp lại)

- Token/component code kiểm soát **chất lượng chi tiết** (radius, shadow, màu chính xác).
- Guardrail này kiểm soát **số lượng chi tiết** (bao nhiêu badge, bao nhiêu màu, bao nhiêu dòng chữ).
- Hai tài liệu (`UIUX_MIGRATION_GUIDE`, `AI_TEACHER_COPILOT_UI_UX_KNOWLEDGE`) đều đúng về
  token nhưng không có cơ chế phân loại trang → dẫn đến việc áp "mật độ cao cho workspace"
  nhầm sang màn login.
- Từ nay: mọi prompt sinh UI phải kèm theo **Nhóm trang (A/B/C/D)** ngay từ đầu, và
  guardrail của nhóm đó là luật cao nhất, cao hơn mọi mô tả tính năng/uy tín trong brief.