# Git Workflow & Coding Governance Rules

## 1. Branch Naming Standards

- **Format chuẩn**: `feature/<feature-name>`
  - Ví dụ hợp lệ: `feature/lesson-planner`, `feature/quiz-generator`, `feature/workspace`, `feature/document-upload`, `feature/history-export`
- **Quy tắc bất di bất dịch**:
  1. **TUYỆT ĐỐI KHÔNG** dùng mã task (như `fe-010`, `BE-002`, `TASK-123`, `bug-456`) để đặt tên nhánh.
  2. Tên nhánh phải là **tên chung của tính năng** (feature domain).
  3. **Tính kế thừa & bền vững**: Nhánh `feature/<feature-name>` được dùng xuyên suốt cho tính năng đó. Khi có yêu cầu cập nhật, nâng cấp hay sửa lỗi tiếp theo cho tính năng này, TIẾP TỤC code trên chính nhánh tính năng đó thay vì tạo nhánh mới mang tên task khác.

---

## 2. Commit Message & Task ID Linking

- **Quy tắc gắn mã Task**: Mã task **CHỈ ĐƯỢC PHÉP** xuất hiện trong Commit Message, **KHÔNG BAO GIỜ** xuất hiện trong tên nhánh.
- **Format Commit chuẩn**:
  ```text
  <type>(<scope>): <mô tả ngắn gọn> [<TASK-ID>]
  ```
  - Ví dụ:
    - `feat(frontend): implement lesson planner generation form and viewer [FE-010]`
    - `fix(ai-service): handle edge case when context chunks are empty [BE-012]`
    - `refactor(backend): optimize workspace permission check [BE-005]`
- **Các types hợp lệ**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.

---

## 3. Quy trình PR (Pull Request) & Tích hợp

```text
feature/<feature-name>  ──(Pull Request)──>  develop  ──(Release)──>  main
```

1. **Khởi tạo**: Tách nhánh `feature/<feature-name>` từ `develop`.
2. **Phát triển**: Code, test kỹ lưỡng bằng build/tests cục bộ.
3. **Commit**: Tuân thủ format kèm mã `[TASK-ID]` trong message.
4. **Pull Request**: Tạo PR từ `feature/<feature-name>` vào `develop` để chạy CI và tiến hành kiểm thử.
5. **Nâng cấp sau này**: Khi có task mới nâng cấp tính năng tương ứng, checkout lại chính nhánh `feature/<feature-name>`, pull code mới nhất từ `develop`, tiếp tục code và tạo PR tiếp theo.

---

## 4. Quy tắc ngôn ngữ giao diện (UI Copywriting) — Thân thiện, không dùng thuật ngữ kỹ thuật

- **Đối tượng người dùng**: Giáo viên K-12 phổ thông Việt Nam.
- **Tiêu chuẩn ngôn ngữ**:
  - Tuyệt đối **KHÔNG** đưa các từ ngữ kỹ thuật nội bộ, từ viết tắt hoặc thuật ngữ AI/Backend lên giao diện người dùng (ví dụ: `RAG`, `vector search`, `chunk`, `Insufficient Evidence`, `embedding`, `payload`, `token`, `endpoint`).
  - Thay thế bằng các cụm từ tự nhiên, sư phạm:
    - Thay `RAG vector search` bằng: *Sách giáo khoa, tài liệu bài học, học liệu giảng dạy*.
    - Thay `Insufficient Evidence` bằng: *Chưa tìm thấy đủ tài liệu bài học liên quan trong không gian làm việc. Thầy/Cô vui lòng nạp thêm tài liệu để AI soạn bài chính xác nhất.*
    - Thay `Chunk` bằng: *Đoạn trích dẫn tham khảo, mục tham khảo*.
    - Thay `Citation Drawer` bằng: *Tài liệu tham khảo bài dạy*.
