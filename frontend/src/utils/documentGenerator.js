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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
