package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.user.User;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Engine for exporting AI-generated Lesson Plans into professional PDF documents
 * with pedagogical formatting and citation footnotes / references (BE-023 / ATC-73).
 * Uses OpenPDF (iText fork) with automatic pagination and Vietnamese Unicode support.
 */
@Slf4j
@Component
public class PdfLessonExporter {

    private static final Color COLOR_PRIMARY = new Color(30, 58, 138);    // Deep Navy #1E3A8A
    private static final Color COLOR_ACCENT = new Color(13, 148, 136);    // Emerald/Teal #0D9488
    private static final Color COLOR_TEXT_DARK = new Color(31, 41, 55);   // Charcoal #1F2937
    private static final Color COLOR_MUTED = new Color(100, 116, 139);    // Slate Muted #64748B
    private static final Color COLOR_BORDER = new Color(203, 213, 225);   // Slate Border #CBD5E1
    private static final Color COLOR_BG_HEADER = new Color(241, 245, 249);// Light Header #F1F5F9
    private static final Color COLOR_BG_CARD = new Color(248, 250, 252);  // Light Card #F8FAFC

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final BaseFont baseFont;

    public PdfLessonExporter() {
        this.baseFont = initializeBaseFont();
    }

    /**
     * Exports a lesson plan into a structured PDF document.
     */
    public byte[] exportLessonPlan(GeneratedContent content,
                                  Map<String, Object> overrideContentData,
                                  List<CitationResolutionDto> citations,
                                  boolean includeCitations,
                                  User teacher) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 page with 36pt (0.5 in) left/right, 40pt top/bottom margins
            Document document = new Document(PageSize.A4, 36f, 36f, 40f, 45f);
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Register page numbering and header/footer event
            writer.setPageEvent(new PedagogicalPageEventHelper(baseFont));

            document.open();

            Map<String, Object> data = (overrideContentData != null && !overrideContentData.isEmpty())
                    ? overrideContentData
                    : (content != null && content.getContentData() != null ? content.getContentData() : Collections.emptyMap());

            String title = resolveString(data, "title", content != null ? content.getTitle() : "Kế hoạch bài dạy");
            String subject = resolveString(data, "subject", content != null ? content.getSubject() : "Chung");
            String gradeLevel = resolveString(data, "grade_level",
                    resolveString(data, "gradeLevel", content != null ? content.getGradeLevel() : ""));
            String topic = resolveString(data, "topic", content != null ? content.getTopic() : "");
            int durationMinutes = resolveDuration(data);
            String reviewStatus = (content != null && content.getReviewStatus() != null)
                    ? content.getReviewStatus()
                    : "DRAFT";

            // 1. Header Banner & Title
            renderHeader(document, title, topic);

            // 2. Metadata Table
            renderMetadataTable(document, subject, gradeLevel, durationMinutes, reviewStatus, teacher, content);

            // 3. Section I: Objectives
            renderObjectives(document, data);

            // 4. Section II: Materials & Equipment
            renderMaterials(document, data);

            // 5. Section III: Instructional Activities / Process
            renderActivities(document, data);

            // 6. Section IV: Assessment & Homework
            renderAssessment(document, data);

            // 7. Section V: Citations & References (if requested)
            if (includeCitations && citations != null && !citations.isEmpty()) {
                renderCitationsSection(document, citations);
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            log.error("Failed to generate PDF lesson plan", e);
            throw new IllegalStateException("Error generating PDF document: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during PDF lesson plan generation", e);
            throw new IllegalStateException("Unexpected error generating PDF: " + e.getMessage(), e);
        }
    }

    private void renderHeader(Document document, String title, String topic) throws DocumentException {
        // Tagline / Institution
        Paragraph tagPara = new Paragraph("BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG TRỢ LÝ GIÁO VIÊN AI",
                new Font(baseFont, 8, Font.BOLD, COLOR_MUTED));
        tagPara.setAlignment(Element.ALIGN_CENTER);
        tagPara.setSpacingAfter(4f);
        document.add(tagPara);

        // Main Title
        Paragraph titlePara = new Paragraph("KẾ HOẠCH BÀI DẠY (GIÁO ÁN)",
                new Font(baseFont, 16, Font.BOLD, COLOR_PRIMARY));
        titlePara.setAlignment(Element.ALIGN_CENTER);
        titlePara.setSpacingBefore(2f);
        titlePara.setSpacingAfter(4f);
        document.add(titlePara);

        // Lesson Title / Topic
        String displayTopic = (title != null && !title.isBlank()) ? title : topic;
        Paragraph subTitlePara = new Paragraph("BÀI DẠY: " + displayTopic.toUpperCase(),
                new Font(baseFont, 12, Font.BOLD, COLOR_ACCENT));
        subTitlePara.setAlignment(Element.ALIGN_CENTER);
        subTitlePara.setSpacingAfter(14f);
        document.add(subTitlePara);
    }

    private void renderMetadataTable(Document document,
                                     String subject,
                                     String gradeLevel,
                                     int durationMinutes,
                                     String reviewStatus,
                                     User teacher,
                                     GeneratedContent content) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingBefore(4f);
        table.setSpacingAfter(14f);

        String teacherName = (teacher != null && teacher.getFullName() != null)
                ? teacher.getFullName()
                : "Giáo viên bộ môn";

        String exportTime = (content != null && content.getCreatedAt() != null)
                ? DATE_FORMATTER.format(content.getCreatedAt())
                : DATE_FORMATTER.format(java.time.Instant.now());

        String statusLabel = switch (reviewStatus.toUpperCase()) {
            case "APPROVED" -> "Đã phê duyệt (APPROVED)";
            case "REVIEWED" -> "Đã rà soát sư phạm (REVIEWED)";
            default -> "Bản thảo (DRAFT)";
        };

        addMetadataCell(table, "Môn học & Khối lớp", subject + (gradeLevel.isBlank() ? "" : " — Khối " + gradeLevel), COLOR_BG_HEADER);
        addMetadataCell(table, "Thời lượng giảng dạy", durationMinutes + " phút", COLOR_BG_CARD);

        addMetadataCell(table, "Giáo viên thực hiện", teacherName, COLOR_BG_HEADER);
        addMetadataCell(table, "Trạng thái tài liệu", statusLabel, COLOR_BG_CARD);

        addMetadataCell(table, "Thời điểm lập giáo án", exportTime, COLOR_BG_HEADER);
        addMetadataCell(table, "Hệ thống thẩm định", "AI Teacher Copilot — RAG Grounded", COLOR_BG_CARD);

        document.add(table);
    }

    private void addMetadataCell(PdfPTable table, String label, String value, Color bgColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bgColor);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);

        Paragraph p = new Paragraph();
        p.setLeading(12f);
        p.add(new Phrase(label + ": ", new Font(baseFont, 9, Font.BOLD, COLOR_TEXT_DARK)));
        p.add(new Phrase(value, new Font(baseFont, 9, Font.NORMAL, COLOR_TEXT_DARK)));
        cell.addElement(p);

        table.addCell(cell);
    }

    private void renderObjectives(Document document, Map<String, Object> data) throws DocumentException {
        renderSectionHeading(document, "I. MỤC TIÊU BÀI HỌC (LEARNING OBJECTIVES)");

        Object objRaw = data.get("objectives");
        if (objRaw == null) {
            objRaw = data.get("learning_objectives");
        }

        List<String> objectives = extractStringList(objRaw);
        if (objectives.isEmpty()) {
            renderBulletedItem(document, "Nắm vững các khái niệm trọng tâm, kỹ năng giải quyết vấn đề và vận dụng kiến thức vào thực tiễn.");
        } else {
            for (String obj : objectives) {
                renderBulletedItem(document, obj);
            }
        }
    }

    private void renderMaterials(Document document, Map<String, Object> data) throws DocumentException {
        renderSectionHeading(document, "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU");

        Object matRaw = data.get("materials_needed");
        if (matRaw == null) {
            matRaw = data.get("materials");
        }

        List<String> materials = extractStringList(matRaw);
        if (materials.isEmpty()) {
            renderBulletedItem(document, "Giáo viên: Sách giáo khoa, kế hoạch bài dạy, bài giảng trình chiếu, phiếu học tập.");
            renderBulletedItem(document, "Học sinh: Sách giáo khoa, vở ghi, đồ dùng học tập theo yêu cầu.");
        } else {
            for (String mat : materials) {
                renderBulletedItem(document, mat);
            }
        }
    }

    private void renderActivities(Document document, Map<String, Object> data) throws DocumentException {
        renderSectionHeading(document, "III. TIẾN TRÌNH DẠY HỌC (INSTRUCTIONAL ACTIVITIES)");

        Object secRaw = data.get("sections");
        if (secRaw == null) {
            secRaw = data.get("activities");
        }

        if (secRaw instanceof List<?> list && !list.isEmpty()) {
            int index = 1;
            for (Object item : list) {
                if (item instanceof Map<?, ?> secMap) {
                    Object titleObj = secMap.get("title");
                    String title = (titleObj != null) ? String.valueOf(titleObj) : "Hoạt động " + index;
                    Object durObj = secMap.get("duration_minutes");
                    int duration = durObj instanceof Number n ? n.intValue() : 10;
                    Object contentObj = secMap.get("content");
                    String content = (contentObj != null) ? String.valueOf(contentObj) : "";

                    renderActivityCard(document, index, title, duration, content);
                    index++;
                } else if (item instanceof String strItem) {
                    renderActivityCard(document, index, "Hoạt động " + index, 10, strItem);
                    index++;
                }
            }
        } else {
            renderParagraph(document, "Nội dung hoạt động dạy học đang được cập nhật.");
        }
    }

    private void renderActivityCard(Document document,
                                   int index,
                                   String title,
                                   int durationMinutes,
                                   String content) throws DocumentException {
        Paragraph pHeader = new Paragraph();
        pHeader.setSpacingBefore(8f);
        pHeader.setSpacingAfter(4f);
        pHeader.setLeading(14f);

        pHeader.add(new Phrase("Hoạt động " + index + ": " + title,
                new Font(baseFont, 10.5f, Font.BOLD, COLOR_PRIMARY)));
        pHeader.add(new Phrase("  (" + durationMinutes + " phút)",
                new Font(baseFont, 9.5f, Font.ITALIC, COLOR_MUTED)));
        document.add(pHeader);

        if (content != null && !content.isBlank()) {
            String[] lines = content.split("\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                Paragraph pLine = new Paragraph();
                pLine.setLeading(13f);
                pLine.setSpacingBefore(2f);
                pLine.setSpacingAfter(3f);

                if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                    pLine.setIndentationLeft(16f);
                    trimmed = trimmed.replaceFirst("^[-•*]\\s*", "");
                    pLine.add(new Phrase("•  ", new Font(baseFont, 9.5f, Font.BOLD, COLOR_ACCENT)));
                }

                pLine.add(new Phrase(trimmed, new Font(baseFont, 9.5f, Font.NORMAL, COLOR_TEXT_DARK)));
                document.add(pLine);
            }
        }
    }

    private void renderAssessment(Document document, Map<String, Object> data) throws DocumentException {
        renderSectionHeading(document, "IV. ĐÁNH GIÁ VÀ HƯỚNG DẪN TỰ HỌC");

        Object assessRaw = data.get("assessment");
        if (assessRaw == null) {
            assessRaw = data.get("evaluation");
        }

        if (assessRaw instanceof String assessStr && !assessStr.isBlank()) {
            renderParagraph(document, assessStr);
        } else if (assessRaw instanceof List<?> list && !list.isEmpty()) {
            for (Object item : list) {
                renderBulletedItem(document, String.valueOf(item));
            }
        } else {
            renderBulletedItem(document, "Đánh giá thường xuyên: Quan sát mức độ tích cực tham gia thảo luận, trả lời câu hỏi và thực hiện nhiệm vụ học tập của học sinh.");
            renderBulletedItem(document, "Đánh giá kết quả: Căn cứ vào độ chính xác của bài tập vận dụng và phiếu học tập được giao.");
            renderBulletedItem(document, "Hướng dẫn tự học: Xem lại kiến thức trọng tâm trong sách giáo khoa, hoàn thiện bài tập rèn luyện và chuẩn bị bài học tiếp theo.");
        }
    }

    private void renderCitationsSection(Document document, List<CitationResolutionDto> citations) throws DocumentException {
        renderSectionHeading(document, "V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO (GROUNDING CITATIONS)");

        Paragraph noteP = new Paragraph("Toàn bộ các trích dẫn dưới đây được trích xuất trực tiếp từ hồ sơ tài liệu học tập trong không gian làm việc để phục vụ đối chiếu, thẩm định căn cứ sư phạm:",
                new Font(baseFont, 8.5f, Font.ITALIC, COLOR_MUTED));
        noteP.setSpacingAfter(8f);
        noteP.setLeading(11f);
        document.add(noteP);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100f);
        table.setWidths(new float[]{0.8f, 2.7f, 5.5f});
        table.setSpacingBefore(4f);
        table.setSpacingAfter(12f);
        table.setSplitLate(false);
        table.setSplitRows(true);

        // Header cells
        addTableHeaderCell(table, "STT");
        addTableHeaderCell(table, "Tài liệu & Vị trí");
        addTableHeaderCell(table, "Nội dung trích dẫn làm căn cứ (Excerpt)");

        int index = 1;
        for (CitationResolutionDto cite : citations) {
            // Cell 0: Index badge
            PdfPCell c0 = new PdfPCell();
            c0.setPadding(6f);
            c0.setBorderColor(COLOR_BORDER);
            c0.setHorizontalAlignment(Element.ALIGN_CENTER);
            c0.setVerticalAlignment(Element.ALIGN_MIDDLE);
            c0.setBackgroundColor(index % 2 == 0 ? COLOR_BG_CARD : Color.WHITE);
            Paragraph p0 = new Paragraph("[" + index + "]", new Font(baseFont, 9, Font.BOLD, COLOR_PRIMARY));
            p0.setAlignment(Element.ALIGN_CENTER);
            c0.addElement(p0);
            table.addCell(c0);

            // Cell 1: Document & Location
            PdfPCell c1 = new PdfPCell();
            c1.setPadding(6f);
            c1.setBorderColor(COLOR_BORDER);
            c1.setBackgroundColor(index % 2 == 0 ? COLOR_BG_CARD : Color.WHITE);
            Paragraph pDoc = new Paragraph();
            pDoc.setLeading(12f);
            pDoc.add(new Phrase(cite.getFileName() != null ? cite.getFileName() : "Tài liệu học liệu",
                    new Font(baseFont, 8.5f, Font.BOLD, COLOR_TEXT_DARK)));

            if (cite.getSourcePage() != null) {
                pDoc.add(new Phrase("\nTrang: " + cite.getSourcePage(),
                        new Font(baseFont, 8f, Font.NORMAL, COLOR_MUTED)));
            }
            if (cite.getSourceLocation() != null && !cite.getSourceLocation().isBlank()) {
                pDoc.add(new Phrase("\nVị trí: " + cite.getSourceLocation(),
                        new Font(baseFont, 7.5f, Font.NORMAL, COLOR_MUTED)));
            }
            c1.addElement(pDoc);
            table.addCell(c1);

            // Cell 2: Excerpt
            PdfPCell c2 = new PdfPCell();
            c2.setPadding(6f);
            c2.setBorderColor(COLOR_BORDER);
            c2.setBackgroundColor(index % 2 == 0 ? COLOR_BG_CARD : Color.WHITE);

            String excerpt = cite.getExcerpt();
            if (excerpt == null || excerpt.isBlank()) {
                excerpt = cite.getCitationText();
            }
            if (excerpt == null || excerpt.isBlank()) {
                excerpt = "(Không có trích đoạn)";
            }

            Paragraph pExcerpt = new Paragraph();
            pExcerpt.setLeading(12f);
            pExcerpt.add(new Phrase("\"" + excerpt + "\"",
                    new Font(baseFont, 8.5f, Font.ITALIC, COLOR_TEXT_DARK)));
            c2.addElement(pExcerpt);
            table.addCell(c2);

            index++;
        }

        document.add(table);
    }

    private void addTableHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_BG_HEADER);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        Paragraph p = new Paragraph(text, new Font(baseFont, 8.5f, Font.BOLD, COLOR_PRIMARY));
        cell.addElement(p);
        table.addCell(cell);
    }

    private void renderSectionHeading(Document document, String text) throws DocumentException {
        Paragraph p = new Paragraph(text, new Font(baseFont, 11f, Font.BOLD, COLOR_PRIMARY));
        p.setSpacingBefore(12f);
        p.setSpacingAfter(5f);
        p.setLeading(15f);
        document.add(p);
    }

    private void renderBulletedItem(Document document, String text) throws DocumentException {
        Paragraph p = new Paragraph();
        p.setIndentationLeft(16f);
        p.setLeading(13f);
        p.setSpacingBefore(2f);
        p.setSpacingAfter(3f);

        p.add(new Phrase("•  ", new Font(baseFont, 9.5f, Font.BOLD, COLOR_ACCENT)));
        p.add(new Phrase(text, new Font(baseFont, 9.5f, Font.NORMAL, COLOR_TEXT_DARK)));
        document.add(p);
    }

    private void renderParagraph(Document document, String text) throws DocumentException {
        Paragraph p = new Paragraph(text, new Font(baseFont, 9.5f, Font.NORMAL, COLOR_TEXT_DARK));
        p.setSpacingBefore(3f);
        p.setSpacingAfter(6f);
        p.setLeading(13f);
        document.add(p);
    }

    private String resolveString(Map<String, Object> map, String key, String defaultVal) {
        if (map == null) return defaultVal;
        Object val = map.get(key);
        if (val == null) return defaultVal;
        String s = String.valueOf(val).trim();
        return s.isBlank() ? defaultVal : s;
    }

    private int resolveDuration(Map<String, Object> map) {
        if (map == null) return 45;
        Object val = map.get("duration_minutes");
        if (val == null) {
            val = map.get("durationMinutes");
        }
        if (val instanceof Number n) {
            return n.intValue();
        }
        if (val instanceof String s) {
            try {
                return Integer.parseInt(s.replaceAll("[^0-9]", ""));
            } catch (Exception ignored) {
            }
        }
        return 45;
    }

    private List<String> extractStringList(Object obj) {
        if (obj == null) {
            return Collections.emptyList();
        }
        if (obj instanceof List<?> list) {
            List<String> res = new ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    res.add(String.valueOf(item));
                }
            }
            return res;
        }
        if (obj instanceof String str) {
            return Arrays.stream(str.split("\n"))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .toList();
        }
        return Collections.emptyList();
    }

    /**
     * Initializes a Unicode-capable BaseFont with cross-platform fallback mechanisms.
     */
    private BaseFont initializeBaseFont() {
        try {
            FontFactory.registerDirectories();
            String[] fontCandidates = {
                    "Arial",
                    "DejaVu Sans",
                    "Liberation Sans",
                    "Segoe UI",
                    "Tahoma",
                    "Times New Roman",
                    "Verdana"
            };

            for (String name : fontCandidates) {
                if (FontFactory.isRegistered(name)) {
                    try {
                        Font f = FontFactory.getFont(name, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                        if (f != null && f.getBaseFont() != null) {
                            return f.getBaseFont();
                        }
                    } catch (Exception ignored) {
                    }
                }
            }

            // Direct file path candidates for Windows and Linux
            String[] pathCandidates = {
                    "C:/Windows/Fonts/arial.ttf",
                    "C:/Windows/Fonts/segoeui.ttf",
                    "C:/Windows/Fonts/times.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
            };

            for (String path : pathCandidates) {
                File file = new File(path);
                if (file.exists() && file.canRead()) {
                    try {
                        return BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                    } catch (Exception ignored) {
                    }
                }
            }

            // Fallback to standard Helvetica
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            log.warn("Could not load preferred TrueType font, using Helvetica fallback: {}", e.getMessage());
            try {
                return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to initialize PDF base font", ex);
            }
        }
    }

    /**
     * Helper for drawing running headers on subsequent pages and running footers with page numbers.
     */
    private static class PedagogicalPageEventHelper extends PdfPageEventHelper {

        private final Font footerFont;

        public PedagogicalPageEventHelper(BaseFont baseFont) {
            this.footerFont = new Font(baseFont, 7.5f, Font.ITALIC, COLOR_MUTED);
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            // Running header on page 2 and later
            if (writer.getPageNumber() > 1) {
                ColumnText.showTextAligned(
                        writer.getDirectContent(),
                        Element.ALIGN_LEFT,
                        new Phrase("AI Teacher Copilot • Kế hoạch bài dạy (Giáo án)", footerFont),
                        document.left(),
                        document.top() + 10f,
                        0
                );
            }

            // Running footer on every page
            ColumnText.showTextAligned(
                    writer.getDirectContent(),
                    Element.ALIGN_LEFT,
                    new Phrase("AI Teacher Copilot • Bản thảo phục vụ rà soát sư phạm", footerFont),
                    document.left(),
                    document.bottom() - 15f,
                    0
            );

            ColumnText.showTextAligned(
                    writer.getDirectContent(),
                    Element.ALIGN_RIGHT,
                    new Phrase("Trang " + writer.getPageNumber(), footerFont),
                    document.right(),
                    document.bottom() - 15f,
                    0
            );
        }
    }
}
