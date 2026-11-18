# 05 - FIGMA / DESIGN TASKS

> Tổng hợp toàn bộ các task thuộc nhóm DES để Designer thực thi (đảm bảo rõ ràng từng Deliverable trong Figma).

- **ATC-105** ➔ **[DES-001] Define Figma Design System & Color Tokens** | Deliverable: *Figma Design System* — Status: *DONE*
- **ATC-201** ➔ **[DES-002] Design Teacher Registration Screen in Figma** | Deliverable: *Figma Register Screen* — Status: *DONE*
- **ATC-202** ➔ **[DES-003] Design Teacher Login Screen in Figma** | Deliverable: *Figma Login Screen* — Status: *DONE*
- **ATC-204** ➔ **[DES-004] Design Workspace Dashboard and Creation Modal in Figma** | Deliverable: *Figma Workspace Screens* — Status: *DONE*
- **ATC-205** ➔ **[DES-005] Design Document Upload Drag-and-Drop and File List in Figma** | Deliverable: *Figma Document Screens* — Status: *DONE*
- **ATC-304** ➔ **[DES-006] Design Lesson Planner Input Form and Output View in Figma** | Deliverable: *Figma Lesson Planner Screens* — Status: *TO DO*
- **ATC-305** ➔ **[DES-007] Design Citation Badges, Tooltips and Source Drawer in Figma** | Deliverable: *Figma Citation Components* — Status: *TO DO*
- **ATC-306** ➔ **[DES-008] Design Lesson Plan Inline Editor and Review Status in Figma** | Deliverable: *Figma Inline Review Screen* — Status: *TO DO*
- **ATC-307** ➔ **[DES-009] Design Document Export Modal and Layout Options in Figma** | Deliverable: *Figma Export Modal* — Status: *TO DO*
- **ATC-401** ➔ **[DES-010] Design Quiz Generator Form and Preview Interface in Figma** | Deliverable: *Figma Quiz Screens* — Status: *DONE*
- **ATC-402** ➔ **[DES-011] Design Bloom Taxonomy Level Badges and Distribution in Figma** | Deliverable: *Figma Bloom Badges* — Status: *DONE*
- **ATC-403** ➔ **[DES-012] Design Regeneration Prompt Modal and Version Diff in Figma** | Deliverable: *Figma Regeneration Screens* — Status: *DONE*
- **ATC-404** ➔ **[DES-013] Design Generation History Timeline and Version Tree in Figma** | Deliverable: *Figma History Screens* — Status: *DONE*
- **ATC-405** ➔ **[DES-014] Design Assessment Rubric Matrix and Criteria Editor in Figma** | Deliverable: *Figma Rubric Screens* — Status: *DONE*
- **ATC-406** ➔ **[DES-015] Design Student Exam Sheet and Teacher Answer Key in Figma** | Deliverable: *Figma Quiz Export Layouts* — Status: *DONE*

---

### Ghi Chú Tiến Độ Kiểm Thử Thực Tế (Audit Notes)

* **[DES-010] Quiz Generator (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`QuizGeneratorPage.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/pages/quiz-generator/QuizGeneratorPage.jsx) đã hoàn thiện 100%.
* **[DES-011] Bloom's Taxonomy Level Badges & Distribution (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`BloomBadge.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/quiz/BloomBadge.jsx) và [`BloomFilter.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/quiz/BloomFilter.jsx) đã hoàn thiện 100% (đầy đủ 6 badge cấp độ, ma trận phân bổ tỉ lệ %, thanh tiến trình đa tầng và bộ lọc tương tác 2 chiều).
* **[DES-012] Regeneration Prompt Modal & Version Diff (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`RegenerationModal.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/generation/RegenerationModal.jsx) và [`VersionSelector.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/generation/VersionSelector.jsx) (hỗ trợ nhập chỉ dẫn tinh chỉnh, gợi ý nhanh, thông báo giữ nguyên bản gốc, chuyển đổi mượt mà giữa các version).
* **[DES-013] Generation History Timeline & Version Tree (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`VersionTimeline.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/history/VersionTimeline.jsx) và [`HistoryListPage.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/pages/history/HistoryListPage.jsx) (cây phả hệ phiên bản trực quan, highlight phiên bản đang chọn, đầy đủ empty/loading/error states).
* **[DES-014] Assessment Rubric Matrix & Criteria Editor (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`RubricTableView.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/rubric/RubricTableView.jsx) (ma trận đánh giá 4 mức L1..L4, chỉnh sửa tiêu chí inline, cân bằng trọng số tự động 100%).
* **[DES-015] Student Exam Sheet & Teacher Answer Key (Cập nhật 12/11/2026):**
  * **Trạng thái:** Đã nghiệm thu DONE dựa trên mã nguồn Frontend [`QuizExportControls.jsx`](file:///d:/DU_AN_2026/Python/ai-teacher-copilot/frontend/src/components/export/QuizExportControls.jsx) kết hợp Backend Exporters (`DocxQuizExporter.java`, `PdfQuizExporter.java`) đã qua kiểm thử tự động QA-028 (đảm bảo không leak đáp án trong đề học sinh, layout chuẩn A4 in ấn).
