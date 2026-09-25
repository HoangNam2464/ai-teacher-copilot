package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.user.User;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageSz;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Engine for exporting AI-generated Lesson Plans into professional DOCX documents
 * with pedagogical formatting and citation footnotes / references (BE-022 / ATC-72).
 */
@Slf4j
@Component
public class DocxLessonExporter {

    private static final String FONT_FAMILY = "Segoe UI";
    private static final String COLOR_PRIMARY = "1E3A8A";   // Deep Indigo/Navy
    private static final String COLOR_ACCENT = "0D9488";    // Emerald/Teal
    private static final String COLOR_TEXT_DARK = "1F2937"; // Charcoal Dark
    private static final String COLOR_MUTED = "4B5563";     // Muted Gray
    private static final String COLOR_BORDER = "CBD5E1";    // Soft Slate
    private static final String COLOR_BG_HEADER = "F1F5F9"; // Light Header Tint
    private static final String COLOR_BG_CARD = "F8FAFC";   // Soft Card Tint

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    /**
     * Exports a lesson plan entity and its citations into a fully formatted DOCX byte array.
     */
    public byte[] exportLessonPlan(GeneratedContent content,
                                  Map<String, Object> overrideContentData,
                                  List<CitationResolutionDto> citations,
                                  boolean includeCitations,
                                  User teacher) {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            setupPageLayout(document);

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
            renderActivities(document, data, citations);

            // 6. Section IV: Assessment & Homework
            renderAssessment(document, data);

            // 7. Section V: Citations & References Appendix (if requested)
            if (includeCitations && citations != null && !citations.isEmpty()) {
                renderCitationsSection(document, citations);
            }

            // 8. Footer
            renderFooter(document);

            document.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate DOCX lesson plan", e);
            throw new IllegalStateException("Error generating DOCX document: " + e.getMessage(), e);
        }
    }

    private void setupPageLayout(XWPFDocument document) {
        CTSectPr sectPr = document.getDocument().getBody().isSetSectPr()
                ? document.getDocument().getBody().getSectPr()
                : document.getDocument().getBody().addNewSectPr();

        CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
        // 1 inch standard margins = 1440 twips
        pageMar.setTop(BigInteger.valueOf(1440));
        pageMar.setBottom(BigInteger.valueOf(1440));
        pageMar.setLeft(BigInteger.valueOf(1440));
        pageMar.setRight(BigInteger.valueOf(1440));

        CTPageSz pageSize = sectPr.isSetPgSz() ? sectPr.getPgSz() : sectPr.addNewPgSz();
        // Standard A4: 11906 x 16838 twips
        pageSize.setW(BigInteger.valueOf(11906));
        pageSize.setH(BigInteger.valueOf(16838));
    }

    private void renderHeader(XWPFDocument document, String title, String topic) {
        // Tagline / Institution
        XWPFParagraph tagPara = document.createParagraph();
        tagPara.setAlignment(ParagraphAlignment.CENTER);
        tagPara.setSpacingAfter(80);
        XWPFRun tagRun = tagPara.createRun();
        tagRun.setText("BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG TRỢ LÝ GIÁO VIÊN AI");
        tagRun.setFontFamily(FONT_FAMILY);
        tagRun.setFontSize(9);
        tagRun.setBold(true);
        tagRun.setColor(COLOR_MUTED);

        // Main Title
        XWPFParagraph titlePara = document.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        titlePara.setSpacingBefore(60);
        titlePara.setSpacingAfter(100);
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setText("KẾ HOẠCH BÀI DẠY (GIÁO ÁN)");
        titleRun.setFontFamily(FONT_FAMILY);
        titleRun.setFontSize(18);
        titleRun.setBold(true);
        titleRun.setColor(COLOR_PRIMARY);

        // Lesson Title / Topic
        XWPFParagraph subTitlePara = document.createParagraph();
        subTitlePara.setAlignment(ParagraphAlignment.CENTER);
        subTitlePara.setSpacingAfter(240);
        XWPFRun subTitleRun = subTitlePara.createRun();
        String displayTopic = (title != null && !title.isBlank()) ? title : topic;
        subTitleRun.setText("BÀI DẠY: " + displayTopic.toUpperCase());
        subTitleRun.setFontFamily(FONT_FAMILY);
        subTitleRun.setFontSize(13);
        subTitleRun.setBold(true);
        subTitleRun.setColor(COLOR_ACCENT);
    }

    private void renderMetadataTable(XWPFDocument document,
                                     String subject,
                                     String gradeLevel,
                                     int durationMinutes,
                                     String reviewStatus,
                                     User teacher,
                                     GeneratedContent content) {
        XWPFTable table = document.createTable(3, 2);
        table.setWidth("100%");
        styleTableBorders(table);

        String teacherName = (teacher != null && teacher.getFullName() != null)
                ? teacher.getFullName()
                : "Giáo viên bộ môn";

        String exportTime = content != null && content.getCreatedAt() != null
                ? DATE_FORMATTER.format(content.getCreatedAt())
                : DATE_FORMATTER.format(java.time.Instant.now());

        String statusLabel = switch (reviewStatus.toUpperCase()) {
            case "APPROVED" -> "Đã phê duyệt (APPROVED)";
            case "REVIEWED" -> "Đã rà soát sư phạm (REVIEWED)";
            default -> "Bản thảo (DRAFT)";
        };

        fillTableRow(table.getRow(0),
                "Môn học & Khối lớp", subject + (gradeLevel.isBlank() ? "" : " — Khối " + gradeLevel),
                "Thời lượng giảng dạy", durationMinutes + " phút");

        fillTableRow(table.getRow(1),
                "Giáo viên thực hiện", teacherName,
                "Trạng thái tài liệu", statusLabel);

        fillTableRow(table.getRow(2),
                "Thời điểm lập giáo án", exportTime,
                "Hệ thống thẩm định", "AI Teacher Copilot — RAG Grounded");

        // Spacing after table
        XWPFParagraph gap = document.createParagraph();
        gap.setSpacingAfter(200);
    }

    private void fillTableRow(XWPFTableRow row, String label1, String val1, String label2, String val2) {
        // Cell 1
        XWPFTableCell c1 = row.getCell(0);
        c1.setColor(COLOR_BG_HEADER);
        c1.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
        c1.removeParagraph(0);
        XWPFParagraph p1 = c1.addParagraph();
        p1.setSpacingBefore(40);
        p1.setSpacingAfter(40);
        XWPFRun r1Label = p1.createRun();
        r1Label.setText(label1 + ": ");
        r1Label.setBold(true);
        r1Label.setFontSize(10);
        r1Label.setFontFamily(FONT_FAMILY);
        r1Label.setColor(COLOR_TEXT_DARK);
        XWPFRun r1Val = p1.createRun();
        r1Val.setText(val1);
        r1Val.setFontSize(10);
        r1Val.setFontFamily(FONT_FAMILY);

        // Cell 2
        XWPFTableCell c2 = row.getCell(1);
        c2.setColor(COLOR_BG_CARD);
        c2.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
        c2.removeParagraph(0);
        XWPFParagraph p2 = c2.addParagraph();
        p2.setSpacingBefore(40);
        p2.setSpacingAfter(40);
        XWPFRun r2Label = p2.createRun();
        r2Label.setText(label2 + ": ");
        r2Label.setBold(true);
        r2Label.setFontSize(10);
        r2Label.setFontFamily(FONT_FAMILY);
        r2Label.setColor(COLOR_TEXT_DARK);
        XWPFRun r2Val = p2.createRun();
        r2Val.setText(val2);
        r2Val.setFontSize(10);
        r2Val.setFontFamily(FONT_FAMILY);
    }

    private void renderObjectives(XWPFDocument document, Map<String, Object> data) {
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

    private void renderMaterials(XWPFDocument document, Map<String, Object> data) {
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

    private void renderActivities(XWPFDocument document, Map<String, Object> data, List<CitationResolutionDto> citations) {
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

                    renderActivityCard(document, index, title, duration, content, citations);
                    index++;
                } else if (item instanceof String strItem) {
                    renderActivityCard(document, index, "Hoạt động " + index, 10, strItem, citations);
                    index++;
                }
            }
        } else {
            renderParagraph(document, "Nội dung hoạt động dạy học đang được cập nhật.");
        }
    }

    private void renderActivityCard(XWPFDocument document,
                                   int index,
                                   String title,
                                   int durationMinutes,
                                   String content,
                                   List<CitationResolutionDto> citations) {
        // Activity Header
        XWPFParagraph pHeader = document.createParagraph();
        pHeader.setSpacingBefore(180);
        pHeader.setSpacingAfter(60);

        XWPFRun rNum = pHeader.createRun();
        rNum.setText("Hoạt động " + index + ": " + title);
        rNum.setBold(true);
        rNum.setFontSize(11);
        rNum.setFontFamily(FONT_FAMILY);
        rNum.setColor(COLOR_PRIMARY);

        XWPFRun rDur = pHeader.createRun();
        rDur.setText("  (" + durationMinutes + " phút)");
        rDur.setItalic(true);
        rDur.setFontSize(10);
        rDur.setFontFamily(FONT_FAMILY);
        rDur.setColor(COLOR_MUTED);

        // Activity Content
        if (content != null && !content.isBlank()) {
            String[] lines = content.split("\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                XWPFParagraph pContent = document.createParagraph();
                pContent.setSpacingBefore(30);
                pContent.setSpacingAfter(60);

                if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*")) {
                    pContent.setIndentationLeft(360);
                    trimmed = trimmed.replaceFirst("^[-•*]\\s*", "");
                    XWPFRun rBullet = pContent.createRun();
                    rBullet.setText("•  ");
                    rBullet.setFontFamily(FONT_FAMILY);
                    rBullet.setColor(COLOR_ACCENT);
                }

                XWPFRun rText = pContent.createRun();
                rText.setText(trimmed);
                rText.setFontFamily(FONT_FAMILY);
                rText.setFontSize(10);
                rText.setColor(COLOR_TEXT_DARK);
            }
        }
    }

    private void renderAssessment(XWPFDocument document, Map<String, Object> data) {
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

    private void renderCitationsSection(XWPFDocument document, List<CitationResolutionDto> citations) {
        // Section Title
        renderSectionHeading(document, "V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO (GROUNDING CITATIONS)");

        // Explanatory Note
        XWPFParagraph noteP = document.createParagraph();
        noteP.setSpacingAfter(120);
        XWPFRun noteR = noteP.createRun();
        noteR.setText("Toàn bộ các trích dẫn dưới đây được trích xuất trực tiếp từ hồ sơ tài liệu học tập trong không gian làm việc để phục vụ đối chiếu, thẩm định căn cứ sư phạm:");
        noteR.setItalic(true);
        noteR.setFontSize(9);
        noteR.setFontFamily(FONT_FAMILY);
        noteR.setColor(COLOR_MUTED);

        // Citations Table
        XWPFTable table = document.createTable();
        table.setWidth("100%");
        styleTableBorders(table);

        // Table Header
        XWPFTableRow headerRow = table.getRow(0);
        headerRow.getCell(0).setText("STT");
        headerRow.getCell(0).setColor(COLOR_BG_HEADER);
        headerRow.addNewTableCell().setText("Tài liệu & Vị trí");
        headerRow.getCell(1).setColor(COLOR_BG_HEADER);
        headerRow.addNewTableCell().setText("Nội dung trích dẫn làm căn cứ (Excerpt)");
        headerRow.getCell(2).setColor(COLOR_BG_HEADER);

        styleHeaderCell(headerRow.getCell(0));
        styleHeaderCell(headerRow.getCell(1));
        styleHeaderCell(headerRow.getCell(2));

        int index = 1;
        for (CitationResolutionDto cite : citations) {
            XWPFTableRow row = table.createRow();

            // Cell 0: Footnote Index
            XWPFTableCell c0 = row.getCell(0);
            c0.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
            c0.removeParagraph(0);
            XWPFParagraph p0 = c0.addParagraph();
            p0.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun r0 = p0.createRun();
            r0.setText("[" + index + "]");
            r0.setBold(true);
            r0.setFontFamily(FONT_FAMILY);
            r0.setFontSize(10);
            r0.setColor(COLOR_PRIMARY);

            // Cell 1: Document & Location
            XWPFTableCell c1 = row.getCell(1);
            c1.removeParagraph(0);
            XWPFParagraph p1 = c1.addParagraph();
            p1.setSpacingBefore(30);
            p1.setSpacingAfter(30);

            XWPFRun rDoc = p1.createRun();
            rDoc.setText(cite.getFileName() != null ? cite.getFileName() : "Tài liệu học liệu");
            rDoc.setBold(true);
            rDoc.setFontFamily(FONT_FAMILY);
            rDoc.setFontSize(9);
            rDoc.setColor(COLOR_TEXT_DARK);

            if (cite.getSourcePage() != null) {
                p1.createRun().addBreak();
                XWPFRun rPage = p1.createRun();
                rPage.setText("Trang: " + cite.getSourcePage());
                rPage.setFontFamily(FONT_FAMILY);
                rPage.setFontSize(9);
                rPage.setColor(COLOR_MUTED);
            }

            if (cite.getSourceLocation() != null && !cite.getSourceLocation().isBlank()) {
                p1.createRun().addBreak();
                XWPFRun rLoc = p1.createRun();
                rLoc.setText("Vị trí: " + cite.getSourceLocation());
                rLoc.setFontFamily(FONT_FAMILY);
                rLoc.setFontSize(8);
                rLoc.setColor(COLOR_MUTED);
            }

            // Cell 2: Excerpt
            XWPFTableCell c2 = row.getCell(2);
            c2.removeParagraph(0);
            XWPFParagraph p2 = c2.addParagraph();
            p2.setSpacingBefore(30);
            p2.setSpacingAfter(30);

            XWPFRun rExcerpt = p2.createRun();
            String excerpt = cite.getExcerpt();
            if (excerpt == null || excerpt.isBlank()) {
                excerpt = cite.getCitationText();
            }
            if (excerpt == null || excerpt.isBlank()) {
                excerpt = "(Không có trích đoạn)";
            }
            rExcerpt.setText("\"" + excerpt + "\"");
            rExcerpt.setItalic(true);
            rExcerpt.setFontFamily(FONT_FAMILY);
            rExcerpt.setFontSize(9);
            rExcerpt.setColor(COLOR_TEXT_DARK);

            index++;
        }

        // Spacing after table
        XWPFParagraph gap = document.createParagraph();
        gap.setSpacingAfter(200);
    }

    private void renderFooter(XWPFDocument document) {
        XWPFParagraph p = document.createParagraph();
        p.setAlignment(ParagraphAlignment.RIGHT);
        p.setSpacingBefore(300);
        XWPFRun r = p.createRun();
        r.setText("AI Teacher Copilot • Được khởi tạo và thẩm định bởi Hệ thống Trợ lý Giáo viên");
        r.setItalic(true);
        r.setFontSize(8);
        r.setFontFamily(FONT_FAMILY);
        r.setColor(COLOR_MUTED);
    }

    private void renderSectionHeading(XWPFDocument document, String text) {
        XWPFParagraph p = document.createParagraph();
        p.setSpacingBefore(240);
        p.setSpacingAfter(100);

        XWPFRun r = p.createRun();
        r.setText(text);
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(12);
        r.setBold(true);
        r.setColor(COLOR_PRIMARY);
    }

    private void renderBulletedItem(XWPFDocument document, String text) {
        XWPFParagraph p = document.createParagraph();
        p.setIndentationLeft(360);
        p.setSpacingBefore(30);
        p.setSpacingAfter(60);

        XWPFRun rBullet = p.createRun();
        rBullet.setText("•  ");
        rBullet.setFontFamily(FONT_FAMILY);
        rBullet.setFontSize(10);
        rBullet.setBold(true);
        rBullet.setColor(COLOR_ACCENT);

        XWPFRun rText = p.createRun();
        rText.setText(text);
        rText.setFontFamily(FONT_FAMILY);
        rText.setFontSize(10);
        rText.setColor(COLOR_TEXT_DARK);
    }

    private void renderParagraph(XWPFDocument document, String text) {
        XWPFParagraph p = document.createParagraph();
        p.setSpacingBefore(40);
        p.setSpacingAfter(80);

        XWPFRun r = p.createRun();
        r.setText(text);
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(10);
        r.setColor(COLOR_TEXT_DARK);
    }

    private void styleHeaderCell(XWPFTableCell cell) {
        cell.setVerticalAlignment(XWPFTableCell.XWPFVertAlign.CENTER);
        for (XWPFParagraph p : cell.getParagraphs()) {
            for (XWPFRun r : p.getRuns()) {
                r.setBold(true);
                r.setFontSize(9);
                r.setFontFamily(FONT_FAMILY);
                r.setColor(COLOR_PRIMARY);
            }
        }
    }

    private void styleTableBorders(XWPFTable table) {
        table.setTopBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setBottomBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setLeftBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setRightBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setInsideHBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setInsideVBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
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
}
