/**
 * Client-side document formatter for lesson plans and educational materials.
 * Generates formatted Word (.docx / .doc) and printable PDF documents.
 */

export function generateFormattedDocumentBlob({
  plan,
  title = 'Kế Hoạch Bài Dạy',
  subject = '',
  gradeLevel = '',
  durationMinutes = 45,
  includeCitations = true,
  format = 'DOCX',
}) {
  const safeTitle = plan?.title || title || 'Kế Hoạch Bài Dạy';
  const safeDuration = plan?.duration_minutes || durationMinutes || 45;

  const objectives = Array.isArray(plan?.objectives)
    ? plan.objectives
    : plan?.objective
    ? [plan.objective]
    : [];

  const materials = Array.isArray(plan?.materials_needed) ? plan.materials_needed : [];
  const sections = Array.isArray(plan?.sections) ? plan.sections : [];

  const citations = Array.isArray(plan?.citations)
    ? plan.citations
    : Array.isArray(plan?.source_chunk_ids)
    ? plan.source_chunk_ids.map((id, idx) => ({
        fileName: `Tài liệu học liệu (Mục ${idx + 1})`,
        sourcePage: idx + 1,
        excerpt: 'Trích đoạn tham khảo từ tài liệu bài học trong không gian làm việc.',
      }))
    : [];

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(safeTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.6;
      color: #111827;
      margin: 0;
      padding: 10px;
    }
    .header-block {
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 2px solid #059669;
      padding-bottom: 16px;
    }
    h1 {
      font-size: 18pt;
      color: #065f46;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      font-weight: bold;
    }
    .meta-info {
      font-size: 11pt;
      color: #4b5563;
      margin: 4px 0;
    }
    h2 {
      font-size: 14pt;
      color: #047857;
      border-bottom: 1px solid #d1fae5;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    h3 {
      font-size: 12pt;
      color: #1f2937;
      margin: 12px 0 4px 0;
    }
    ul {
      margin: 6px 0 12px 20px;
      padding: 0;
    }
    li {
      margin-bottom: 6px;
    }
    .section-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 14px;
    }
    .section-header {
      font-weight: bold;
      color: #065f46;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
    }
    .section-content {
      white-space: pre-line;
      color: #374151;
      font-size: 12pt;
    }
    .citations-box {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px dashed #9ca3af;
      font-size: 11pt;
      color: #4b5563;
    }
    .citation-item {
      margin-bottom: 8px;
      padding-left: 12px;
      border-left: 3px solid #10b981;
    }
    .footer-note {
      text-align: center;
      font-size: 10pt;
      color: #9ca3af;
      margin-top: 30px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header-block">
    <h1>${escapeHtml(safeTitle)}</h1>
    <div class="meta-info">
      ${subject ? `<span>Môn học: <strong>${escapeHtml(subject)}</strong></span> | ` : ''}
      ${gradeLevel ? `<span>Khối lớp: <strong>${escapeHtml(gradeLevel)}</strong></span> | ` : ''}
      <span>Thời lượng: <strong>${safeDuration} phút</strong></span>
    </div>
  </div>

  ${
    objectives.length > 0
      ? `
    <h2>I. MỤC TIÊU BÀI DẠY</h2>
    <ul>
      ${objectives.map((obj) => `<li>${escapeHtml(obj)}</li>`).join('')}
    </ul>
  `
      : ''
  }

  ${
    materials.length > 0
      ? `
    <h2>II. THIẾT BỊ VÀ HỌC LIỆU DẠY HỌC</h2>
    <ul>
      ${materials.map((mat) => `<li>${escapeHtml(mat)}</li>`).join('')}
    </ul>
  `
      : ''
  }

  ${
    sections.length > 0
      ? `
    <h2>III. TIẾN TRÌNH HOẠT ĐỘNG DẠY HỌC</h2>
    ${sections
      .map(
        (sec, idx) => `
      <div class="section-card">
        <div class="section-header">
          <span>${idx + 1}. ${escapeHtml(sec.title || 'Hoạt động')}</span>
          ${sec.duration_minutes ? `<span>(${sec.duration_minutes} phút)</span>` : ''}
        </div>
        <div class="section-content">${escapeHtml(sec.content || '')}</div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

  ${
    includeCitations && citations.length > 0
      ? `
    <div class="citations-box">
      <h2>IV. TÀI LIỆU VÀ NGUỒN HỌC LIỆU THAM KHẢO</h2>
      ${citations
        .map(
          (cite, idx) => `
        <div class="citation-item">
          <strong>[${idx + 1}] ${escapeHtml(cite.fileName || 'Tài liệu nguồn')}</strong> 
          ${cite.sourcePage ? `<em>(Trang ${cite.sourcePage})</em>` : ''}
          ${cite.excerpt ? `<p style="margin: 4px 0 0 0; font-size: 10pt; color: #6b7280;">"${escapeHtml(cite.excerpt)}"</p>` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''
  }

  <div class="footer-note">
    Kế hoạch bài dạy được tạo bởi AI Teacher Copilot — Đối chiếu chuẩn xác theo tài liệu bài học.
  </div>
</body>
</html>
  `.trim();

  if (format === 'PDF') {
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  }

  // Word (.docx / .doc) compatible blob
  return new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
}

/**
 * Client-side document formatter for Quiz / Exams (FE-019 / ATC-406).
 * Formats either Student Exam Sheet (strictly no answers/explanations)
 * or Teacher Answer Key (complete answers, explanations, and Bloom tagging).
 */
export function generateFormattedQuizBlob({
  quiz,
  title = 'Đề Kiểm Tra',
  subject = '',
  gradeLevel = '',
  exportMode = 'STUDENT_EXAM', // 'STUDENT_EXAM' | 'TEACHER_KEY'
  includeCitations = true,
  format = 'DOCX',
}) {
  let quizObj = quiz;
  if (typeof quizObj === 'string') {
    try {
      quizObj = JSON.parse(quizObj);
    } catch {
      // ignore
    }
  }

  const rawQuestions =
    quizObj?.questions ||
    quizObj?.contentData?.questions ||
    (Array.isArray(quizObj) ? quizObj : []);

  const safeTitle = quizObj?.title || title || 'Đề Kiểm Tra Trắc Nghiệm';
  const optionLabels = ['A', 'B', 'C', 'D'];
  const isStudent = exportMode === 'STUDENT_EXAM';

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(safeTitle)} - ${isStudent ? 'Đề Thi Học Sinh' : 'Đáp Án Giáo Viên'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12.5pt;
      line-height: 1.5;
      color: #111827;
      margin: 0;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-bottom: 2px solid ${isStudent ? '#2563eb' : '#059669'};
      padding-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      padding: 4px;
    }
    .main-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      color: ${isStudent ? '#1e40af' : '#065f46'};
      margin: 14px 0 6px 0;
    }
    .sub-title {
      text-align: center;
      font-size: 11pt;
      font-style: italic;
      color: #4b5563;
      margin-bottom: 16px;
    }
    .student-info-box {
      border: 1px solid #9ca3af;
      padding: 8px 14px;
      margin-bottom: 20px;
      font-size: 11pt;
      background-color: #f9fafb;
    }
    .question-block {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .question-title {
      font-weight: bold;
      margin-bottom: 6px;
      color: #111827;
    }
    .options-table {
      width: 100%;
      border-collapse: collapse;
      margin-left: 12px;
      margin-bottom: 8px;
    }
    .options-table td {
      padding: 4px 8px;
      vertical-align: top;
      font-size: 12pt;
    }
    .answer-key-box {
      margin-top: 6px;
      padding: 6px 12px;
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      font-size: 11pt;
    }
    .explanation-box {
      margin-top: 4px;
      padding: 6px 12px;
      background-color: #f3f4f6;
      border-left: 4px solid #f59e0b;
      font-size: 10.5pt;
      color: #374151;
      font-style: italic;
    }
    .quick-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 24px 0;
      text-align: center;
    }
    .quick-table th, .quick-table td {
      border: 1px solid #d1d5db;
      padding: 6px 8px;
      font-size: 11pt;
    }
    .quick-table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .sheet-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      page-break-before: auto;
    }
    .sheet-grid th, .sheet-grid td {
      border: 1px solid #9ca3af;
      padding: 6px;
      text-align: center;
      font-size: 10pt;
    }
    .bubble {
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      border: 1px solid #4b5563;
      border-radius: 50%;
      text-align: center;
      font-size: 9pt;
      margin: 0 3px;
    }
    .footer-note {
      text-align: center;
      font-size: 9.5pt;
      color: #9ca3af;
      margin-top: 30px;
      border-top: 1px dashed #d1d5db;
      padding-top: 10px;
      font-style: italic;
    }
  </style>
</head>
<body>

  <!-- Top School / Exam Header -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO</strong><br>
        <strong>TRƯỜNG THPT: .......................................</strong>
      </td>
      <td style="width: 50%; text-align: right;">
        <strong>KỲ THI / KIỂM TRA ĐỊNH KỲ</strong><br>
        ${subject ? `Môn: <strong>${escapeHtml(subject)}</strong> | ` : ''}
        ${gradeLevel ? `Khối: <strong>${escapeHtml(gradeLevel)}</strong>` : ''}<br>
        <em>Thời gian làm bài: 45 phút (không kể thời gian giao đề)</em>
      </td>
    </tr>
  </table>

  <div class="main-title">
    ${escapeHtml(safeTitle)}
  </div>
  <div class="sub-title">
    ${isStudent ? '— ĐỀ THI CHÍNH THỨC (Dành cho học sinh) —' : '— ĐÁP ÁN & HƯỚNG DẪN CHẤM (Bản giáo viên) —'}
  </div>

  ${
    isStudent
      ? `
    <!-- Student Identification Box -->
    <div class="student-info-box">
      Họ và tên thí sinh: .................................................................... Lớp: ................. SBD: ....................<br>
      <em>(Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm)</em>
    </div>
  `
      : ''
  }

  ${
    !isStudent && rawQuestions.length > 0
      ? `
    <!-- Quick Answer Key Table for Teacher -->
    <h3 style="color: #065f46; border-bottom: 1px solid #10b981; padding-bottom: 4px;">
      I. BẢNG ĐÁP ÁN NHANH
    </h3>
    <table class="quick-table">
      <tr>
        ${rawQuestions.map((_, i) => `<th>Câu ${i + 1}</th>`).join('')}
      </tr>
      <tr>
        ${rawQuestions
          .map((q) => {
            const correctIdx = q.correct_answer_index;
            let ans =
              correctIdx !== undefined && optionLabels[correctIdx]
                ? optionLabels[correctIdx]
                : q.correct_answer || q.correctAnswer || '—';
            return `<td style="font-weight: bold; color: #047857;">${escapeHtml(ans)}</td>`;
          })
          .join('')}
      </tr>
    </table>
    <h3 style="color: #065f46; border-bottom: 1px solid #10b981; padding-bottom: 4px; margin-top: 24px;">
      II. HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT
    </h3>
  `
      : ''
  }

  <!-- Questions Body -->
  <div class="questions-container">
    ${rawQuestions
      .map((q, idx) => {
        const correctIdx = q.correct_answer_index;
        const correctText =
          q.correct_answer ||
          q.correctAnswer ||
          (correctIdx !== undefined && q.options?.[correctIdx]
            ? `${optionLabels[correctIdx] || ''}. ${q.options[correctIdx]}`
            : '');

        const optA = q.options?.[0] ? escapeHtml(q.options[0]) : '';
        const optB = q.options?.[1] ? escapeHtml(q.options[1]) : '';
        const optC = q.options?.[2] ? escapeHtml(q.options[2]) : '';
        const optD = q.options?.[3] ? escapeHtml(q.options[3]) : '';

        return `
      <div class="question-block">
        <div class="question-title">
          Câu ${idx + 1}: ${escapeHtml(q.question_text || q.question || '')}
          ${!isStudent && q.bloom_taxonomy_level ? ` <span style="font-size: 9.5pt; font-weight: normal; color: #6b7280;">[Chuẩn Bloom: ${escapeHtml(q.bloom_taxonomy_level)}]</span>` : ''}
        </div>

        <table class="options-table">
          <tr>
            <td style="width: 50%;"><strong>A.</strong> ${optA}</td>
            <td style="width: 50%;"><strong>B.</strong> ${optB}</td>
          </tr>
          <tr>
            <td style="width: 50%;"><strong>C.</strong> ${optC}</td>
            <td style="width: 50%;"><strong>D.</strong> ${optD}</td>
          </tr>
        </table>

        ${
          !isStudent
            ? `
          ${
            correctText
              ? `<div class="answer-key-box"><strong>✓ Đáp án đúng:</strong> ${escapeHtml(correctText)}</div>`
              : ''
          }
          ${
            q.explanation
              ? `<div class="explanation-box"><strong>💡 Lời giải chi tiết:</strong> ${escapeHtml(q.explanation)}</div>`
              : ''
          }
        `
            : ''
        }
      </div>
    `;
      })
      .join('')}
  </div>

  ${
    isStudent && rawQuestions.length > 0
      ? `
    <!-- Student Answer Bubbles Form -->
    <div style="margin-top: 30px; border-top: 2px dashed #9ca3af; padding-top: 14px;">
      <h4 style="text-align: center; margin: 0 0 10px 0; text-transform: uppercase;">
        PHIẾU TÔ ĐÁP ÁN TRẮC NGHIỆM CỦA THÍ SINH
      </h4>
      <table class="sheet-grid">
        <tr>
          <th>Câu</th>
          <th>Phương án chọn</th>
          <th>Câu</th>
          <th>Phương án chọn</th>
        </tr>
        ${Array.from({ length: Math.ceil(rawQuestions.length / 2) })
          .map((_, rowIdx) => {
            const q1 = rowIdx + 1;
            const q2 = rowIdx + 1 + Math.ceil(rawQuestions.length / 2);

            return `
            <tr>
              <td style="font-weight: bold;">Câu ${q1}</td>
              <td>
                <span class="bubble">A</span>
                <span class="bubble">B</span>
                <span class="bubble">C</span>
                <span class="bubble">D</span>
              </td>
              ${
                q2 <= rawQuestions.length
                  ? `
                <td style="font-weight: bold;">Câu ${q2}</td>
                <td>
                  <span class="bubble">A</span>
                  <span class="bubble">B</span>
                  <span class="bubble">C</span>
                  <span class="bubble">D</span>
                </td>
              `
                  : '<td></td><td></td>'
              }
            </tr>
          `;
          })
          .join('')}
      </table>
    </div>
  `
      : ''
  }

  <div class="footer-note">
    ${
      isStudent
        ? '— HẾT — (Cán bộ coi thi thu lại toàn bộ đề thi và phiếu làm bài)'
        : 'Tài liệu đáp án và hướng dẫn chấm được tạo bởi AI Teacher Copilot.'
    }
  </div>
</body>
</html>
  `.trim();

  if (format === 'PDF') {
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  }

  return new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

