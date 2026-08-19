---
description: >-
  Rules for implementing Word and PDF Export in AI Teacher Copilot.
  Renders structured lesson plans and quizzes into professional DOCX
  and PDF documents with citation footers.
trigger: model_decision
---

# Feature Rules: Word & PDF Export

## 1. Scope

### Includes
- Exporting generated lesson plans to formatted PDF and DOCX (Word)
- Exporting generated quizzes to formatted PDF and DOCX (with question keys and explanations)
- Appending source citation references (document name, page number) at the document footer
- Direct streaming download via browser HTTP response

### Excludes (Deferred / Out of Scope)
- PowerPoint / Slide export
- Direct Google Docs / Cloud Drive export integrations
- Asynchronous batch export queue

---

## 2. Architecture & Responsibility

- **Owner Service**: Spring Boot (`backend/`)
- **Package**: `com.aiteachercopilot.export`
- **Rendering Libraries**:
  - DOCX: Apache POI (`poi-ooxml`)
  - PDF: Apache PDFBox or iText
- **FastAPI Involvement**: None. Document formatting is managed entirely in the Core Backend.

---

## 3. Implementation & Security Constraints

1. **Authorization**: Export requests must verify that the requesting user owns the workspace containing the target `generationId`.
2. **Citation Inclusion**: Exported files must include a "Tài liệu tham khảo / Sources" section at the end, listing all cited document names and source page numbers.
3. **Quiz Format**: Exported quizzes must cleanly format questions, options (for MCQs), and include an answer key with explanations at the end of the document.
4. **Streaming Response**: Generated binaries must be streamed directly to the HTTP response with standard `Content-Disposition: attachment; filename="..."` headers.
5. **Standard Naming**: File names must follow: `{content_type}_{topic}_{timestamp}.{pdf|docx}` (e.g., `lesson-plan_toan10_20260819.pdf`).

---

## 4. API Contract

```text
POST /api/workspaces/{workspaceId}/export/{generationId}?format=PDF
Response: 200 OK
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="lesson-plan_toan10_20260819.pdf"
  Body: [binary stream]

POST /api/workspaces/{workspaceId}/export/{generationId}?format=DOCX
Response: 200 OK
  Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
  Content-Disposition: attachment; filename="lesson-plan_toan10_20260819.docx"
  Body: [binary stream]

Errors: 403 Forbidden, 404 Not Found
```

---

## 5. Definition of Done

- [ ] Lesson plan exports cleanly to PDF and DOCX with formatted section headings.
- [ ] Quiz exports cleanly to PDF and DOCX with MCQ options and answer key.
- [ ] Cited source document names and page numbers appear in the document references section.
- [ ] Export requests verify workspace ownership.
- [ ] Automated tests pass in CI (`backend-ci.yml`).
