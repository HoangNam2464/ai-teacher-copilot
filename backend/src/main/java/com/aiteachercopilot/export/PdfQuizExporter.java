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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Engine for exporting AI-generated Quizzes into professional PDF exam sheets.
 * Implements BE-030 (Student Quiz Sheet without Answers) with OpenPDF and full Vietnamese typography.
 */
@Slf4j
@Component
public class PdfQuizExporter {

    private static final Color COLOR_PRIMARY = new Color(30, 58, 138);    // Deep Navy #1E3A8A
    private static final Color COLOR_ACCENT = new Color(13, 148, 136);    // Emerald/Teal #0D9488
    private static final Color COLOR_TEXT_DARK = new Color(31, 41, 55);   // Charcoal #1F2937
    private static final Color COLOR_MUTED = new Color(100, 116, 139);    // Slate Muted #64748B
    private static final Color COLOR_BORDER = new Color(203, 213, 225);   // Slate Border #CBD5E1
    private static final Color COLOR_BG_HEADER = new Color(241, 245, 249);// Light Header #F1F5F9

    private final BaseFont baseFont;

    public PdfQuizExporter() {
        this.baseFont = initializeBaseFont();
    }

    /**
     * Exports a quiz into a structured PDF document byte array.
     * In STUDENT_EXAM mode, strictly excludes answers, explanations, Bloom levels, and citations.
     */
    public byte[] exportQuiz(GeneratedContent content,
                             Map<String, Object> overrideContentData,
                             List<CitationResolutionDto> citations,
                             boolean includeCitations,
                             String exportMode,
                             User teacher) {
        String mode = (exportMode != null && !exportMode.isBlank())
                ? exportMode.trim().toUpperCase()
                : "STUDENT_EXAM";

        boolean isStudentExam = "STUDENT_EXAM".equals(mode);
        boolean isTeacherKey = "TEACHER_KEY".equals(mode);
        boolean isBoth = "BOTH".equals(mode);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // A4 page with 36pt (0.5 in) margins
            Document document = new Document(PageSize.A4, 36f, 36f, 36f, 40f);
            PdfWriter writer = PdfWriter.getInstance(document, out);

            // Register running footer with page numbers
            writer.setPageEvent(new QuizPageEventHelper(baseFont, isStudentExam));

            document.open();

            Map<String, Object> data = (overrideContentData != null && !overrideContentData.isEmpty())
                    ? overrideContentData
                    : (content != null && content.getContentData() != null ? content.getContentData() : Collections.emptyMap());

            String title = resolveString(data, "title", content != null ? content.getTitle() : "Bài kiểm tra đánh giá");
            String subject = resolveString(data, "subject", content != null ? content.getSubject() : "Chung");
            String gradeLevel = resolveString(data, "grade_level",
                    resolveString(data, "gradeLevel", content != null ? content.getGradeLevel() : ""));
            String topic = resolveString(data, "topic", content != null ? content.getTopic() : "");
            List<DocxQuizExporter.QuizQuestionItem> questions = extractQuestions(data);

            int estimatedDuration = calculateDuration(questions.size());

            // 1. Header & Student Info Box
            renderHeader(document, title, subject, gradeLevel, topic, estimatedDuration, isStudentExam);

            // 2. Questions
            renderQuestions(document, questions, isStudentExam);

            // 3. End Notice
            renderEndNotice(document);

            // 4. Teacher Answer Key (if TEACHER_KEY or BOTH)
            if (isTeacherKey || isBoth) {
                if (isBoth) {
                    document.newPage();
                }
                renderTeacherKeySection(document, questions, citations, includeCitations);
            }

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            log.error("Failed to generate PDF quiz sheet", e);
            throw new IllegalStateException("Error generating PDF quiz sheet: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error during PDF quiz sheet generation", e);
            throw new IllegalStateException("Unexpected error generating PDF quiz: " + e.getMessage(), e);
        }
    }

    private void renderHeader(Document document,
                              String title,
                              String subject,
                              String gradeLevel,
                              String topic,
                              int durationMinutes,
                              boolean isStudentExam) throws DocumentException {
        // Top 2-column Table: School info (left) & Exam Title (right)
        PdfPTable topTable = new PdfPTable(2);
        topTable.setWidthPercentage(100f);
        topTable.setWidths(new float[]{50f, 50f});
        topTable.setSpacingAfter(6f);

        // Left cell: Student identification fields
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setPadding(2f);

        Paragraph pSchool = new Paragraph("TRƯỜNG: ..............................................................",
                new Font(baseFont, 9.5f, Font.BOLD, COLOR_MUTED));
        Paragraph pClass = new Paragraph("LỚP: .......................... SBD: .................................",
                new Font(baseFont, 9.5f, Font.NORMAL, COLOR_TEXT_DARK));
        Paragraph pName = new Paragraph("HỌ VÀ TÊN: .......................................................",
                new Font(baseFont, 9.5f, Font.BOLD, COLOR_TEXT_DARK));

        pSchool.setSpacingAfter(3f);
        pClass.setSpacingAfter(3f);
        leftCell.addElement(pSchool);
        leftCell.addElement(pClass);
        leftCell.addElement(pName);
        topTable.addCell(leftCell);

        // Right cell: Exam title & Subject
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setPadding(2f);
        rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        String mainHeader = isStudentExam ? "BÀI KIỂM TRA ĐÁNH GIÁ" : "HƯỚNG DẪN CHẤM & ĐÁP ÁN";
        Paragraph pTitle = new Paragraph(mainHeader, new Font(baseFont, 12f, Font.BOLD, COLOR_PRIMARY));
        pTitle.setAlignment(Element.ALIGN_CENTER);
        pTitle.setSpacingAfter(2f);

        String subjGrade = subject + (gradeLevel.isBlank() ? "" : " — Khối " + gradeLevel);
        Paragraph pSubj = new Paragraph("Môn: " + subjGrade, new Font(baseFont, 10f, Font.BOLD, COLOR_ACCENT));
        pSubj.setAlignment(Element.ALIGN_CENTER);
        pSubj.setSpacingAfter(2f);

        Paragraph pTime = new Paragraph("Thời gian làm bài: " + durationMinutes + " phút",
                new Font(baseFont, 8.5f, Font.ITALIC, COLOR_MUTED));
        pTime.setAlignment(Element.ALIGN_CENTER);

        rightCell.addElement(pTitle);
        rightCell.addElement(pSubj);
        rightCell.addElement(pTime);
        topTable.addCell(rightCell);

        document.add(topTable);

        // Topic Banner if provided
        if (topic != null && !topic.isBlank()) {
            Paragraph pTopic = new Paragraph("Chủ đề: " + topic.toUpperCase(),
                    new Font(baseFont, 10.5f, Font.BOLD, COLOR_PRIMARY));
            pTopic.setAlignment(Element.ALIGN_CENTER);
            pTopic.setSpacingBefore(2f);
            pTopic.setSpacingAfter(6f);
            document.add(pTopic);
        }

        // Student Score and Teacher Feedback Box (for student exam sheet)
        if (isStudentExam) {
            PdfPTable scoreTable = new PdfPTable(2);
            scoreTable.setWidthPercentage(100f);
            scoreTable.setWidths(new float[]{35f, 65f});
            scoreTable.setSpacingBefore(4f);
            scoreTable.setSpacingAfter(8f);

            PdfPCell cScore = new PdfPCell();
            cScore.setBorderColor(COLOR_BORDER);
            cScore.setBackgroundColor(COLOR_BG_HEADER);
            cScore.setPadding(4f);
            Paragraph pScoreH = new Paragraph("ĐIỂM SỐ", new Font(baseFont, 9.5f, Font.BOLD, COLOR_PRIMARY));
            pScoreH.setAlignment(Element.ALIGN_CENTER);
            cScore.addElement(pScoreH);
            // Height placeholder for teacher mark
            cScore.setFixedHeight(45f);
            scoreTable.addCell(cScore);

            PdfPCell cFeedback = new PdfPCell();
            cFeedback.setBorderColor(COLOR_BORDER);
            cFeedback.setBackgroundColor(COLOR_BG_HEADER);
            cFeedback.setPadding(4f);
            Paragraph pFeedH = new Paragraph("NHẬN XÉT CỦA GIÁO VIÊN", new Font(baseFont, 9.5f, Font.BOLD, COLOR_PRIMARY));
            pFeedH.setAlignment(Element.ALIGN_CENTER);
            cFeedback.addElement(pFeedH);
            cFeedback.setFixedHeight(45f);
            scoreTable.addCell(cFeedback);

            document.add(scoreTable);
        }

        // Separator rule
        Paragraph sep = new Paragraph("_____________________________________________________________________________________________",
                new Font(baseFont, 6f, Font.NORMAL, COLOR_BORDER));
        sep.setAlignment(Element.ALIGN_CENTER);
        sep.setSpacingAfter(8f);
        document.add(sep);
    }

    private void renderQuestions(Document document,
                                 List<DocxQuizExporter.QuizQuestionItem> questions,
                                 boolean isStudentExam) throws DocumentException {
        if (questions == null || questions.isEmpty()) {
            Paragraph emptyP = new Paragraph("(Đề thi chưa có câu hỏi)", new Font(baseFont, 10f, Font.ITALIC, COLOR_MUTED));
            document.add(emptyP);
            return;
        }

        for (int i = 0; i < questions.size(); i++) {
            DocxQuizExporter.QuizQuestionItem q = questions.get(i);
            int qNum = q.questionNumber > 0 ? q.questionNumber : (i + 1);

            Paragraph qPara = new Paragraph();
            qPara.setSpacingBefore(6f);
            qPara.setSpacingAfter(3f);

            Phrase numPhrase = new Phrase("Câu " + qNum + ": ", new Font(baseFont, 10.5f, Font.BOLD, COLOR_PRIMARY));
            Phrase textPhrase = new Phrase(q.questionText != null ? q.questionText : "",
                    new Font(baseFont, 10.5f, Font.NORMAL, COLOR_TEXT_DARK));

            qPara.add(numPhrase);
            qPara.add(textPhrase);
            document.add(qPara);

            // Handle Question Types
            if ("SHORT_ANSWER".equalsIgnoreCase(q.type) || (q.options == null || q.options.isEmpty())) {
                // Short answer blank lines
                Paragraph ansLine = new Paragraph("Trả lời: ...........................................................................................................................................................",
                        new Font(baseFont, 9.5f, Font.NORMAL, COLOR_MUTED));
                ansLine.setIndentationLeft(18f);
                ansLine.setSpacingAfter(2f);
                document.add(ansLine);

                Paragraph line2 = new Paragraph("...........................................................................................................................................................................",
                        new Font(baseFont, 9.5f, Font.NORMAL, COLOR_MUTED));
                line2.setIndentationLeft(18f);
                line2.setSpacingAfter(4f);
                document.add(line2);
            } else {
                // MCQ: Render options
                for (int optIdx = 0; optIdx < q.options.size(); optIdx++) {
                    String formattedOpt = formatOptionPrefix(optIdx, q.options.get(optIdx));
                    Paragraph optPara = new Paragraph(formattedOpt, new Font(baseFont, 10f, Font.NORMAL, COLOR_TEXT_DARK));
                    optPara.setIndentationLeft(18f);
                    optPara.setSpacingAfter(2f);
                    document.add(optPara);
                }
            }

            // In TEACHER_KEY mode, render inline explanation
            if (!isStudentExam) {
                Paragraph expPara = new Paragraph();
                expPara.setIndentationLeft(18f);
                expPara.setSpacingBefore(2f);
                expPara.setSpacingAfter(4f);

                Phrase ansPhrase = new Phrase("▶ Đáp án đúng: " + (q.correctAnswer != null ? q.correctAnswer : "—") + "    ",
                        new Font(baseFont, 9.5f, Font.BOLD, COLOR_ACCENT));
                expPara.add(ansPhrase);

                if (q.bloomLevel != null && !q.bloomLevel.isBlank()) {
                    Phrase bloomPhrase = new Phrase("[Bloom: " + q.bloomLevel + "]",
                            new Font(baseFont, 9f, Font.ITALIC, COLOR_MUTED));
                    expPara.add(bloomPhrase);
                }
                document.add(expPara);

                if (q.explanation != null && !q.explanation.isBlank()) {
                    Paragraph detailPara = new Paragraph("Lời giải: " + q.explanation,
                            new Font(baseFont, 9.5f, Font.ITALIC, COLOR_TEXT_DARK));
                    detailPara.setIndentationLeft(18f);
                    detailPara.setSpacingAfter(4f);
                    document.add(detailPara);
                }
            }
        }
    }

    private void renderEndNotice(Document document) throws DocumentException {
        Paragraph endP = new Paragraph("---------- HẾT ----------\n(Cán bộ coi thi không giải thích gì thêm)",
                new Font(baseFont, 9.5f, Font.BOLD, COLOR_MUTED));
        endP.setAlignment(Element.ALIGN_CENTER);
        endP.setSpacingBefore(14f);
        endP.setSpacingAfter(8f);
        document.add(endP);
    }

    private void renderTeacherKeySection(Document document,
                                         List<DocxQuizExporter.QuizQuestionItem> questions,
                                         List<CitationResolutionDto> citations,
                                         boolean includeCitations) throws DocumentException {
        Paragraph title = new Paragraph("HƯỚNG DẪN CHẤM & MA TRẬN ĐÁP ÁN (DÀNH CHO GIÁO VIÊN)",
                new Font(baseFont, 12f, Font.BOLD, COLOR_PRIMARY));
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(12f);
        title.setSpacingAfter(8f);
        document.add(title);

        int totalQ = (questions != null) ? questions.size() : 0;
        double pointsPerQ = totalQ > 0 ? (double) Math.round((10.0 / totalQ) * 100) / 100 : 0.0;
        String pointStr = String.format(java.util.Locale.US, "%.2f", pointsPerQ);

        // I. Nguyên tắc chấm & Biểu điểm
        Paragraph gHead = new Paragraph("I. NGUYÊN TẮC CHẤM & BIỂU ĐIỂM (GRADING GUIDE)",
                new Font(baseFont, 10f, Font.BOLD, COLOR_PRIMARY));
        gHead.setSpacingBefore(8f);
        gHead.setSpacingAfter(4f);
        document.add(gHead);

        Paragraph g1 = new Paragraph("• Thang điểm chuẩn: 10.0 điểm toàn bài (" + totalQ + " câu hỏi, trung bình +" + pointStr + " điểm/câu).",
                new Font(baseFont, 8.5f, Font.NORMAL, COLOR_TEXT_DARK));
        g1.setIndentationLeft(8f);
        document.add(g1);

        Paragraph g2 = new Paragraph("• Câu hỏi trắc nghiệm (MCQ): Chọn đúng đáp án nhận trọn số điểm câu hỏi; chọn sai nhận 0 điểm.",
                new Font(baseFont, 8.5f, Font.NORMAL, COLOR_TEXT_DARK));
        g2.setIndentationLeft(8f);
        document.add(g2);

        Paragraph g3 = new Paragraph("• Câu hỏi tự luận ngắn: Đúng khái niệm cốt lõi (60%), lập luận logic (30%), trình bày khoa học (10%). Chấp nhận cách giải đúng khác.",
                new Font(baseFont, 8.5f, Font.NORMAL, COLOR_TEXT_DARK));
        g3.setIndentationLeft(8f);
        g3.setSpacingAfter(6f);
        document.add(g3);

        // II. Ma trận đáp án & Biểu điểm chi tiết
        Paragraph aHead = new Paragraph("II. MA TRẬN ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT",
                new Font(baseFont, 10f, Font.BOLD, COLOR_PRIMARY));
        aHead.setSpacingBefore(6f);
        aHead.setSpacingAfter(4f);
        document.add(aHead);

        if (questions != null && !questions.isEmpty()) {
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{10f, 20f, 32f, 23f, 15f});
            table.setSpacingAfter(8f);

            table.addCell(createHeaderCell("Câu"));
            table.addCell(createHeaderCell("Dạng câu hỏi"));
            table.addCell(createHeaderCell("Đáp án đúng"));
            table.addCell(createHeaderCell("Cấp độ Bloom"));
            table.addCell(createHeaderCell("Biểu điểm"));

            for (int i = 0; i < questions.size(); i++) {
                DocxQuizExporter.QuizQuestionItem q = questions.get(i);
                int qNum = q.questionNumber > 0 ? q.questionNumber : (i + 1);
                String typeLabel = "MCQ".equalsIgnoreCase(q.type) ? "Trắc nghiệm" : "Tự luận ngắn";

                table.addCell(createBodyCell(String.valueOf(qNum), true));
                table.addCell(createBodyCell(typeLabel, false));
                table.addCell(createBodyCell(q.correctAnswer != null ? q.correctAnswer : "—", true));
                table.addCell(createBodyCell(q.bloomLevel != null ? q.bloomLevel : "Understand", false));
                table.addCell(createBodyCell("+" + pointStr + " đ", true));
            }
            document.add(table);
        }

        // III. Phân bổ mức độ nhận thức theo Bloom
        Paragraph bHead = new Paragraph("III. PHÂN BỔ MỨC ĐỘ NHẬN THỨC THEO BLOOM",
                new Font(baseFont, 10f, Font.BOLD, COLOR_PRIMARY));
        bHead.setSpacingBefore(6f);
        bHead.setSpacingAfter(4f);
        document.add(bHead);

        int rememberCount = 0;
        int understandCount = 0;
        int applyCount = 0;
        int higherCount = 0;
        if (questions != null) {
            for (DocxQuizExporter.QuizQuestionItem q : questions) {
                String bl = (q.bloomLevel != null) ? q.bloomLevel.trim().toLowerCase() : "";
                if (bl.contains("remember") || bl.contains("nhận biết") || bl.contains("nhan biet")) {
                    rememberCount++;
                } else if (bl.contains("understand") || bl.contains("thông hiểu") || bl.contains("thong hieu")) {
                    understandCount++;
                } else if (bl.contains("apply") || bl.contains("vận dụng thấp") || bl.contains("van dung thap") || bl.equals("vận dụng")) {
                    applyCount++;
                } else {
                    higherCount++;
                }
            }
        }

        PdfPTable mTable = new PdfPTable(4);
        mTable.setWidthPercentage(100f);
        mTable.setWidths(new float[]{25f, 45f, 15f, 15f});
        mTable.setSpacingAfter(8f);

        mTable.addCell(createHeaderCell("Mức độ nhận thức"));
        mTable.addCell(createHeaderCell("Đặc trưng yêu cầu cần đạt"));
        mTable.addCell(createHeaderCell("Số câu"));
        mTable.addCell(createHeaderCell("Tỷ lệ"));

        addMatrixPdfRow(mTable, "Nhận biết (Remember)", "Tái hiện định nghĩa, công thức cơ bản", rememberCount, totalQ);
        addMatrixPdfRow(mTable, "Thông hiểu (Understand)", "Hiểu bản chất, giải thích, phân biệt", understandCount, totalQ);
        addMatrixPdfRow(mTable, "Vận dụng (Apply)", "Giải quyết bài tập, tình huống cơ bản", applyCount, totalQ);
        addMatrixPdfRow(mTable, "Vận dụng cao (Higher)", "Phân tích, tổng hợp, giải bài toán phức hợp", higherCount, totalQ);
        document.add(mTable);

        // IV. Citations references appendix
        if (includeCitations && citations != null && !citations.isEmpty()) {
            Paragraph citH = new Paragraph("IV. TÀI LIỆU NGUỒN CĂN CỨ BIÊN SOẠN (PROVENANCE CITATIONS)",
                    new Font(baseFont, 10f, Font.BOLD, COLOR_PRIMARY));
            citH.setSpacingBefore(8f);
            citH.setSpacingAfter(4f);
            document.add(citH);

            for (int i = 0; i < citations.size(); i++) {
                CitationResolutionDto c = citations.get(i);
                String fileName = c.getFileName() != null ? c.getFileName() : "Tài liệu nguồn";
                String page = c.getSourcePage() != null ? " (Trang " + c.getSourcePage() + ")" : "";
                String excerpt = (c.getExcerpt() != null && !c.getExcerpt().isBlank())
                        ? " — \"" + c.getExcerpt() + "\""
                        : "";
                Paragraph cP = new Paragraph("[" + (i + 1) + "] " + fileName + page + excerpt,
                        new Font(baseFont, 8.5f, Font.NORMAL, COLOR_MUTED));
                cP.setIndentationLeft(12f);
                cP.setSpacingAfter(2f);
                document.add(cP);
            }
        }
    }

    private void addMatrixPdfRow(PdfPTable table, String level, String desc, int count, int total) {
        int percent = total > 0 ? (int) Math.round(((double) count / total) * 100) : 0;
        table.addCell(createBodyCell(level, true));
        table.addCell(createBodyCell(desc, false));
        table.addCell(createBodyCell(String.valueOf(count), false));
        table.addCell(createBodyCell(percent + "%", true));
    }

    private PdfPCell createHeaderCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(baseFont, 9.5f, Font.BOLD, COLOR_PRIMARY)));
        cell.setBackgroundColor(COLOR_BG_HEADER);
        cell.setBorderColor(COLOR_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(4f);
        return cell;
    }

    private PdfPCell createBodyCell(String text, boolean bold) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(baseFont, 9f, bold ? Font.BOLD : Font.NORMAL, COLOR_TEXT_DARK)));
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(3.5f);
        return cell;
    }

    private String formatOptionPrefix(int index, String optionText) {
        if (optionText == null || optionText.isBlank()) return "";
        String trimmed = optionText.trim();
        char letter = (char) ('A' + index);
        if (trimmed.startsWith(letter + ".") || trimmed.startsWith(letter + ")") || trimmed.startsWith(letter + ":")) {
            return trimmed;
        }
        return letter + ". " + trimmed;
    }

    private int calculateDuration(int questionCount) {
        if (questionCount <= 5) return 15;
        if (questionCount <= 10) return 20;
        if (questionCount <= 20) return 45;
        if (questionCount <= 40) return 60;
        return 90;
    }

    private List<DocxQuizExporter.QuizQuestionItem> extractQuestions(Map<String, Object> data) {
        List<DocxQuizExporter.QuizQuestionItem> result = new ArrayList<>();
        if (data == null) return result;

        Object rawQuestions = data.get("questions");
        if (rawQuestions instanceof List<?> list) {
            for (Object obj : list) {
                if (obj instanceof Map<?, ?> qMap) {
                    DocxQuizExporter.QuizQuestionItem item = new DocxQuizExporter.QuizQuestionItem();
                    Object qNum = qMap.get("question_number");
                    if (qNum == null) qNum = qMap.get("questionNumber");
                    if (qNum instanceof Number n) {
                        item.questionNumber = n.intValue();
                    }

                    Object qType = qMap.get("type");
                    item.type = qType != null ? qType.toString() : "MCQ";

                    Object qText = qMap.get("question_text");
                    if (qText == null) qText = qMap.get("questionText");
                    item.questionText = qText != null ? qText.toString() : "";

                    Object opts = qMap.get("options");
                    if (opts instanceof List<?> optList) {
                        List<String> optStrings = new ArrayList<>();
                        for (Object o : optList) {
                            if (o != null) optStrings.add(o.toString());
                        }
                        item.options = optStrings;
                    }

                    Object cAns = qMap.get("correct_answer");
                    if (cAns == null) cAns = qMap.get("correctAnswer");
                    item.correctAnswer = cAns != null ? cAns.toString() : "";

                    Object exp = qMap.get("explanation");
                    item.explanation = exp != null ? exp.toString() : "";

                    Object bloom = qMap.get("bloom_taxonomy_level");
                    if (bloom == null) bloom = qMap.get("bloomTaxonomyLevel");
                    item.bloomLevel = bloom != null ? bloom.toString() : "Understand";

                    result.add(item);
                }
            }
        }
        return result;
    }

    private String resolveString(Map<String, Object> data, String key, String defaultValue) {
        if (data != null && data.containsKey(key) && data.get(key) != null) {
            String val = data.get(key).toString().trim();
            if (!val.isBlank()) return val;
        }
        return defaultValue != null ? defaultValue : "";
    }

    private BaseFont initializeBaseFont() {
        try {
            String[] fontCandidates = {
                    "Segoe UI", "Arial", "Times New Roman", "Tahoma",
                    "Liberation Sans", "DejaVu Sans"
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

            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            log.warn("Could not load preferred TrueType font for PDF quiz, using Helvetica fallback: {}", e.getMessage());
            try {
                return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to initialize PDF base font for quiz", ex);
            }
        }
    }

    private static class QuizPageEventHelper extends PdfPageEventHelper {
        private final Font footerFont;
        private final boolean isStudentExam;

        public QuizPageEventHelper(BaseFont baseFont, boolean isStudentExam) {
            this.footerFont = new Font(baseFont, 7.5f, Font.ITALIC, COLOR_MUTED);
            this.isStudentExam = isStudentExam;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            String footerLeft = isStudentExam
                    ? "AI Teacher Copilot • Đề thi học sinh — Bảo mật & Công bằng học đường"
                    : "AI Teacher Copilot • Hướng dẫn chấm & Đáp án nội bộ giáo viên";

            ColumnText.showTextAligned(
                    writer.getDirectContent(),
                    Element.ALIGN_LEFT,
                    new Phrase(footerLeft, footerFont),
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
