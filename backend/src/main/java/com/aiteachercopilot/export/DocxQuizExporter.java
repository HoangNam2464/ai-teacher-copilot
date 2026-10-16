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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Engine for exporting AI-generated Quizzes into professional Word (DOCX) exam sheets.
 * Implements BE-030 (Student Quiz Sheet without Answers) and supports BE-031 (Teacher Answer Key).
 */
@Slf4j
@Component
public class DocxQuizExporter {

    private static final String FONT_FAMILY = "Segoe UI";
    private static final String COLOR_PRIMARY = "1E3A8A";   // Deep Indigo/Navy
    private static final String COLOR_ACCENT = "0D9488";    // Emerald/Teal
    private static final String COLOR_TEXT_DARK = "1F2937"; // Charcoal Dark
    private static final String COLOR_MUTED = "4B5563";     // Muted Gray
    private static final String COLOR_BORDER = "CBD5E1";    // Soft Slate
    private static final String COLOR_BG_HEADER = "F1F5F9"; // Light Header Tint

    /**
     * Exports a quiz into a professional DOCX document byte array.
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

        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            setupPageLayout(document);

            Map<String, Object> data = (overrideContentData != null && !overrideContentData.isEmpty())
                    ? overrideContentData
                    : (content != null && content.getContentData() != null ? content.getContentData() : Collections.emptyMap());

            String title = resolveString(data, "title", content != null ? content.getTitle() : "Bài kiểm tra đánh giá");
            String subject = resolveString(data, "subject", content != null ? content.getSubject() : "Chung");
            String gradeLevel = resolveString(data, "grade_level",
                    resolveString(data, "gradeLevel", content != null ? content.getGradeLevel() : ""));
            String topic = resolveString(data, "topic", content != null ? content.getTopic() : "");
            List<QuizQuestionItem> questions = extractQuestions(data);

            int estimatedDuration = calculateDuration(questions.size());

            // 1. Header Information & Student Identification Table
            renderStudentExamHeader(document, title, subject, gradeLevel, topic, estimatedDuration, isStudentExam);

            // 2. Questions Section
            renderQuestionsSection(document, questions, isStudentExam);

            // 3. Exam End Notice for Students
            renderExamEndNotice(document);

            // 4. Teacher Answer Key & Scoring Guide (rendered only in TEACHER_KEY or BOTH modes)
            if (isTeacherKey || isBoth) {
                if (isBoth) {
                    XWPFParagraph breakPara = document.createParagraph();
                    breakPara.setPageBreak(true);
                }
                renderTeacherAnswerKeySection(document, questions, citations, includeCitations);
            }

            // 5. Running Footer
            renderFooter(document, isStudentExam);

            document.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate DOCX quiz sheet", e);
            throw new IllegalStateException("Error generating DOCX quiz sheet: " + e.getMessage(), e);
        }
    }

    private void setupPageLayout(XWPFDocument document) {
        CTSectPr sectPr = document.getDocument().getBody().isSetSectPr()
                ? document.getDocument().getBody().getSectPr()
                : document.getDocument().getBody().addNewSectPr();

        CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
        // 0.75 inch margins = 1080 twips for clean print layout
        pageMar.setTop(BigInteger.valueOf(1080));
        pageMar.setBottom(BigInteger.valueOf(1080));
        pageMar.setLeft(BigInteger.valueOf(1080));
        pageMar.setRight(BigInteger.valueOf(1080));

        CTPageSz pageSize = sectPr.isSetPgSz() ? sectPr.getPgSz() : sectPr.addNewPgSz();
        // Standard A4: 11906 x 16838 twips
        pageSize.setW(BigInteger.valueOf(11906));
        pageSize.setH(BigInteger.valueOf(16838));
    }

    private void renderStudentExamHeader(XWPFDocument document,
                                        String title,
                                        String subject,
                                        String gradeLevel,
                                        String topic,
                                        int durationMinutes,
                                        boolean isStudentExam) {
        // Upper banner: School / Exam title 2-column table
        XWPFTable headerTable = document.createTable(1, 2);
        headerTable.setWidth("100%");
        styleTableNoBorders(headerTable);

        XWPFTableRow headerRow = headerTable.getRow(0);

        // Left cell: Institution / Student input box
        XWPFTableCell leftCell = headerRow.getCell(0);
        leftCell.setWidth("50%");
        XWPFParagraph pLeft1 = leftCell.getParagraphs().get(0);
        pLeft1.setSpacingAfter(40);
        XWPFRun rL1 = pLeft1.createRun();
        rL1.setText("TRƯỜNG: ..............................................................");
        rL1.setFontFamily(FONT_FAMILY);
        rL1.setFontSize(10);
        rL1.setBold(true);
        rL1.setColor(COLOR_MUTED);

        XWPFParagraph pLeft2 = leftCell.addParagraph();
        pLeft2.setSpacingAfter(40);
        XWPFRun rL2 = pLeft2.createRun();
        rL2.setText("LỚP: .......................... SBD: .................................");
        rL2.setFontFamily(FONT_FAMILY);
        rL2.setFontSize(10);
        rL2.setColor(COLOR_TEXT_DARK);

        XWPFParagraph pLeft3 = leftCell.addParagraph();
        pLeft3.setSpacingAfter(60);
        XWPFRun rL3 = pLeft3.createRun();
        rL3.setText("HỌ VÀ TÊN: .......................................................");
        rL3.setFontFamily(FONT_FAMILY);
        rL3.setFontSize(10);
        rL3.setBold(true);
        rL3.setColor(COLOR_TEXT_DARK);

        // Right cell: Exam title & subject
        XWPFTableCell rightCell = headerRow.getCell(1);
        rightCell.setWidth("50%");
        XWPFParagraph pRight1 = rightCell.getParagraphs().get(0);
        pRight1.setAlignment(ParagraphAlignment.CENTER);
        pRight1.setSpacingAfter(40);
        XWPFRun rR1 = pRight1.createRun();
        rR1.setText(isStudentExam ? "BÀI KIỂM TRA ĐÁNH GIÁ" : "HƯỚNG DẪN CHẤM & ĐÁP ÁN");
        rR1.setFontFamily(FONT_FAMILY);
        rR1.setFontSize(12);
        rR1.setBold(true);
        rR1.setColor(COLOR_PRIMARY);

        XWPFParagraph pRight2 = rightCell.addParagraph();
        pRight2.setAlignment(ParagraphAlignment.CENTER);
        pRight2.setSpacingAfter(40);
        XWPFRun rR2 = pRight2.createRun();
        String subjGrade = subject + (gradeLevel.isBlank() ? "" : " — Khối " + gradeLevel);
        rR2.setText("Môn: " + subjGrade);
        rR2.setFontFamily(FONT_FAMILY);
        rR2.setFontSize(10);
        rR2.setBold(true);
        rR2.setColor(COLOR_ACCENT);

        XWPFParagraph pRight3 = rightCell.addParagraph();
        pRight3.setAlignment(ParagraphAlignment.CENTER);
        pRight3.setSpacingAfter(60);
        XWPFRun rR3 = pRight3.createRun();
        rR3.setText("Thời gian làm bài: " + durationMinutes + " phút (không kể phát đề)");
        rR3.setFontFamily(FONT_FAMILY);
        rR3.setFontSize(9);
        rR3.setItalic(true);
        rR3.setColor(COLOR_MUTED);

        // Topic / Title line
        if (topic != null && !topic.isBlank()) {
            XWPFParagraph topicPara = document.createParagraph();
            topicPara.setAlignment(ParagraphAlignment.CENTER);
            topicPara.setSpacingBefore(60);
            topicPara.setSpacingAfter(80);
            XWPFRun rTopic = topicPara.createRun();
            rTopic.setText("Chủ đề: " + topic.toUpperCase());
            rTopic.setFontFamily(FONT_FAMILY);
            rTopic.setFontSize(11);
            rTopic.setBold(true);
            rTopic.setColor(COLOR_PRIMARY);
        }

        // Student Score & Teacher Feedback Box (for student exam sheet)
        if (isStudentExam) {
            XWPFTable scoreTable = document.createTable(1, 2);
            scoreTable.setWidth("100%");
            styleTableBorders(scoreTable);

            XWPFTableRow sRow = scoreTable.getRow(0);

            XWPFTableCell cScore = sRow.getCell(0);
            cScore.setWidth("35%");
            XWPFParagraph pScoreH = cScore.getParagraphs().get(0);
            pScoreH.setAlignment(ParagraphAlignment.CENTER);
            pScoreH.setSpacingAfter(40);
            XWPFRun rScoreH = pScoreH.createRun();
            rScoreH.setText("ĐIỂM SỐ");
            rScoreH.setFontFamily(FONT_FAMILY);
            rScoreH.setFontSize(10);
            rScoreH.setBold(true);
            rScoreH.setColor(COLOR_PRIMARY);

            // Empty space for teacher's grade
            XWPFParagraph pScoreSpace = cScore.addParagraph();
            pScoreSpace.setSpacingBefore(120);
            pScoreSpace.setSpacingAfter(120);

            XWPFTableCell cFeedback = sRow.getCell(1);
            cFeedback.setWidth("65%");
            XWPFParagraph pFeedH = cFeedback.getParagraphs().get(0);
            pFeedH.setAlignment(ParagraphAlignment.CENTER);
            pFeedH.setSpacingAfter(40);
            XWPFRun rFeedH = pFeedH.createRun();
            rFeedH.setText("NHẬN XÉT CỦA GIÁO VIÊN");
            rFeedH.setFontFamily(FONT_FAMILY);
            rFeedH.setFontSize(10);
            rFeedH.setBold(true);
            rFeedH.setColor(COLOR_PRIMARY);

            XWPFParagraph pFeedSpace = cFeedback.addParagraph();
            pFeedSpace.setSpacingBefore(120);
            pFeedSpace.setSpacingAfter(120);
        }

        // Decorative separator line
        XWPFParagraph sepPara = document.createParagraph();
        sepPara.setSpacingBefore(100);
        sepPara.setSpacingAfter(120);
        XWPFRun sepRun = sepPara.createRun();
        sepRun.setText("_________________________________________________________________________________");
        sepRun.setFontFamily(FONT_FAMILY);
        sepRun.setFontSize(8);
        sepRun.setColor(COLOR_BORDER);
    }

    private void renderQuestionsSection(XWPFDocument document,
                                        List<QuizQuestionItem> questions,
                                        boolean isStudentExam) {
        if (questions == null || questions.isEmpty()) {
            XWPFParagraph emptyPara = document.createParagraph();
            XWPFRun r = emptyPara.createRun();
            r.setText("(Đề thi chưa có câu hỏi)");
            r.setFontFamily(FONT_FAMILY);
            r.setFontSize(10);
            r.setItalic(true);
            r.setColor(COLOR_MUTED);
            return;
        }

        for (int i = 0; i < questions.size(); i++) {
            QuizQuestionItem q = questions.get(i);
            int qNum = q.questionNumber > 0 ? q.questionNumber : (i + 1);

            // Question prompt paragraph
            XWPFParagraph qPara = document.createParagraph();
            qPara.setSpacingBefore(120);
            qPara.setSpacingAfter(60);

            XWPFRun rNum = qPara.createRun();
            rNum.setText("Câu " + qNum + ": ");
            rNum.setFontFamily(FONT_FAMILY);
            rNum.setFontSize(10.5);
            rNum.setBold(true);
            rNum.setColor(COLOR_PRIMARY);

            XWPFRun rText = qPara.createRun();
            rText.setText(q.questionText != null ? q.questionText : "");
            rText.setFontFamily(FONT_FAMILY);
            rText.setFontSize(10.5);
            rText.setColor(COLOR_TEXT_DARK);

            // Handle Question Types
            if ("SHORT_ANSWER".equalsIgnoreCase(q.type) || (q.options == null || q.options.isEmpty())) {
                // Short answer: Provide student answering lines
                XWPFParagraph ansLine1 = document.createParagraph();
                ansLine1.setIndentationLeft(360);
                ansLine1.setSpacingAfter(40);
                XWPFRun rL1 = ansLine1.createRun();
                rL1.setText("Trả lời: ...........................................................................................................................................................");
                rL1.setFontFamily(FONT_FAMILY);
                rL1.setFontSize(10);
                rL1.setColor(COLOR_MUTED);

                XWPFParagraph ansLine2 = document.createParagraph();
                ansLine2.setIndentationLeft(360);
                ansLine2.setSpacingAfter(40);
                XWPFRun rL2 = ansLine2.createRun();
                rL2.setText("............................................................................................................................................................................");
                rL2.setFontFamily(FONT_FAMILY);
                rL2.setFontSize(10);
                rL2.setColor(COLOR_MUTED);

                XWPFParagraph ansLine3 = document.createParagraph();
                ansLine3.setIndentationLeft(360);
                ansLine3.setSpacingAfter(80);
                XWPFRun rL3 = ansLine3.createRun();
                rL3.setText("............................................................................................................................................................................");
                rL3.setFontFamily(FONT_FAMILY);
                rL3.setFontSize(10);
                rL3.setColor(COLOR_MUTED);
            } else {
                // MCQ: Render 4 options A, B, C, D
                for (int optIdx = 0; optIdx < q.options.size(); optIdx++) {
                    String optText = q.options.get(optIdx);
                    String formattedOpt = formatOptionPrefix(optIdx, optText);

                    XWPFParagraph optPara = document.createParagraph();
                    optPara.setIndentationLeft(360);
                    optPara.setSpacingAfter(30);

                    XWPFRun rOpt = optPara.createRun();
                    rOpt.setText(formattedOpt);
                    rOpt.setFontFamily(FONT_FAMILY);
                    rOpt.setFontSize(10);
                    rOpt.setColor(COLOR_TEXT_DARK);
                }
            }

            // In TEACHER_KEY mode, inline explanation is printed (NOT in STUDENT_EXAM)
            if (!isStudentExam) {
                renderTeacherExplanationInline(document, q);
            }
        }
    }

    private void renderTeacherExplanationInline(XWPFDocument document, QuizQuestionItem q) {
        XWPFParagraph expPara = document.createParagraph();
        expPara.setIndentationLeft(360);
        expPara.setSpacingBefore(40);
        expPara.setSpacingAfter(80);

        XWPFRun rAns = expPara.createRun();
        rAns.setText("▶ Đáp án đúng: " + (q.correctAnswer != null ? q.correctAnswer : "—") + "    ");
        rAns.setFontFamily(FONT_FAMILY);
        rAns.setFontSize(9.5);
        rAns.setBold(true);
        rAns.setColor(COLOR_ACCENT);

        if (q.bloomLevel != null && !q.bloomLevel.isBlank()) {
            XWPFRun rBloom = expPara.createRun();
            rBloom.setText("[Mức độ Bloom: " + q.bloomLevel + "]    ");
            rBloom.setFontFamily(FONT_FAMILY);
            rBloom.setFontSize(9);
            rBloom.setColor(COLOR_MUTED);
        }

        if (q.explanation != null && !q.explanation.isBlank()) {
            XWPFParagraph detailPara = document.createParagraph();
            detailPara.setIndentationLeft(360);
            detailPara.setSpacingAfter(80);
            XWPFRun rExp = detailPara.createRun();
            rExp.setText("Lời giải / Hướng dẫn: " + q.explanation);
            rExp.setFontFamily(FONT_FAMILY);
            rExp.setFontSize(9.5);
            rExp.setItalic(true);
            rExp.setColor(COLOR_TEXT_DARK);
        }
    }

    private void renderExamEndNotice(XWPFDocument document) {
        XWPFParagraph endPara = document.createParagraph();
        endPara.setAlignment(ParagraphAlignment.CENTER);
        endPara.setSpacingBefore(200);
        endPara.setSpacingAfter(100);

        XWPFRun rEnd1 = endPara.createRun();
        rEnd1.setText("---------- HẾT ----------\n");
        rEnd1.setFontFamily(FONT_FAMILY);
        rEnd1.setFontSize(10);
        rEnd1.setBold(true);
        rEnd1.setColor(COLOR_MUTED);

        XWPFRun rEnd2 = endPara.createRun();
        rEnd2.setText("(Cán bộ coi thi không giải thích gì thêm)");
        rEnd2.setFontFamily(FONT_FAMILY);
        rEnd2.setFontSize(9);
        rEnd2.setItalic(true);
        rEnd2.setColor(COLOR_MUTED);
    }

    private void renderTeacherAnswerKeySection(XWPFDocument document,
                                              List<QuizQuestionItem> questions,
                                              List<CitationResolutionDto> citations,
                                              boolean includeCitations) {
        // Section Title
        XWPFParagraph titlePara = document.createParagraph();
        titlePara.setAlignment(ParagraphAlignment.CENTER);
        titlePara.setSpacingBefore(120);
        titlePara.setSpacingAfter(100);
        XWPFRun rTitle = titlePara.createRun();
        rTitle.setText("HƯỚNG DẪN CHẤM & MA TRẬN ĐÁP ÁN (DÀNH CHO GIÁO VIÊN)");
        rTitle.setFontFamily(FONT_FAMILY);
        rTitle.setFontSize(13);
        rTitle.setBold(true);
        rTitle.setColor(COLOR_PRIMARY);

        // Answer Key Table
        if (questions != null && !questions.isEmpty()) {
            XWPFTable ansTable = document.createTable(questions.size() + 1, 4);
            ansTable.setWidth("100%");
            styleTableBorders(ansTable);

            // Header row
            XWPFTableRow hRow = ansTable.getRow(0);
            fillTableHeaderCell(hRow.getCell(0), "Câu", "15%");
            fillTableHeaderCell(hRow.getCell(1), "Dạng câu hỏi", "25%");
            fillTableHeaderCell(hRow.getCell(2), "Đáp án đúng", "30%");
            fillTableHeaderCell(hRow.getCell(3), "Cấp độ nhận thức (Bloom)", "30%");

            for (int i = 0; i < questions.size(); i++) {
                QuizQuestionItem q = questions.get(i);
                XWPFTableRow row = ansTable.getRow(i + 1);
                int qNum = q.questionNumber > 0 ? q.questionNumber : (i + 1);

                String typeLabel = "MCQ".equalsIgnoreCase(q.type) ? "Trắc nghiệm" : "Tự luận ngắn";
                String answerLabel = q.correctAnswer != null ? q.correctAnswer : "—";
                String bloomLabel = q.bloomLevel != null ? q.bloomLevel : "Understand";

                fillTableCell(row.getCell(0), String.valueOf(qNum), true);
                fillTableCell(row.getCell(1), typeLabel, false);
                fillTableCell(row.getCell(2), answerLabel, true);
                fillTableCell(row.getCell(3), bloomLabel, false);
            }
        }

        // Citations references appendix
        if (includeCitations && citations != null && !citations.isEmpty()) {
            XWPFParagraph citHeader = document.createParagraph();
            citHeader.setSpacingBefore(180);
            citHeader.setSpacingAfter(60);
            XWPFRun rCit = citHeader.createRun();
            rCit.setText("TÀI LIỆU NGUỒN CĂN CỨ BIÊN SOẠN (PROVENANCE CITATIONS)");
            rCit.setFontFamily(FONT_FAMILY);
            rCit.setFontSize(11);
            rCit.setBold(true);
            rCit.setColor(COLOR_PRIMARY);

            for (int i = 0; i < citations.size(); i++) {
                CitationResolutionDto c = citations.get(i);
                XWPFParagraph cPara = document.createParagraph();
                cPara.setIndentationLeft(360);
                cPara.setSpacingAfter(40);
                XWPFRun rC = cPara.createRun();
                String fileName = c.getFileName() != null ? c.getFileName() : "Tài liệu nguồn";
                String page = c.getSourcePage() != null ? " (Trang " + c.getSourcePage() + ")" : "";
                String excerpt = (c.getExcerpt() != null && !c.getExcerpt().isBlank())
                        ? " — \"" + c.getExcerpt() + "\""
                        : "";
                rC.setText("[" + (i + 1) + "] " + fileName + page + excerpt);
                rC.setFontFamily(FONT_FAMILY);
                rC.setFontSize(9);
                rC.setColor(COLOR_MUTED);
            }
        }
    }

    private void renderFooter(XWPFDocument document, boolean isStudentExam) {
        XWPFParagraph footerPara = document.createParagraph();
        footerPara.setAlignment(ParagraphAlignment.RIGHT);
        footerPara.setSpacingBefore(200);
        XWPFRun r = footerPara.createRun();
        String footerText = isStudentExam
                ? "AI Teacher Copilot • Đề thi học sinh — Bảo mật & Công bằng học đường"
                : "AI Teacher Copilot • Tài liệu nội bộ giáo viên — Không phát cho học sinh";
        r.setText(footerText);
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(8);
        r.setItalic(true);
        r.setColor(COLOR_MUTED);
    }

    // --- Utility Parsing & Styling Helpers ---

    private void styleTableNoBorders(XWPFTable table) {
        table.setInsideHBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
        table.setInsideVBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
        table.setTopBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
        table.setBottomBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
        table.setLeftBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
        table.setRightBorder(XWPFTable.XWPFBorderType.NONE, 0, 0, null);
    }

    private void styleTableBorders(XWPFTable table) {
        table.setInsideHBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setInsideVBorder(XWPFTable.XWPFBorderType.SINGLE, 4, 0, COLOR_BORDER);
        table.setTopBorder(XWPFTable.XWPFBorderType.SINGLE, 6, 0, COLOR_BORDER);
        table.setBottomBorder(XWPFTable.XWPFBorderType.SINGLE, 6, 0, COLOR_BORDER);
        table.setLeftBorder(XWPFTable.XWPFBorderType.SINGLE, 6, 0, COLOR_BORDER);
        table.setRightBorder(XWPFTable.XWPFBorderType.SINGLE, 6, 0, COLOR_BORDER);
    }

    private void fillTableHeaderCell(XWPFTableCell cell, String text, String width) {
        cell.setWidth(width);
        cell.setColor(COLOR_BG_HEADER);
        XWPFParagraph p = cell.getParagraphs().get(0);
        p.setAlignment(ParagraphAlignment.CENTER);
        p.setSpacingBefore(40);
        p.setSpacingAfter(40);
        XWPFRun r = p.createRun();
        r.setText(text);
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(9.5);
        r.setBold(true);
        r.setColor(COLOR_PRIMARY);
    }

    private void fillTableCell(XWPFTableCell cell, String text, boolean bold) {
        XWPFParagraph p = cell.getParagraphs().get(0);
        p.setSpacingBefore(30);
        p.setSpacingAfter(30);
        XWPFRun r = p.createRun();
        r.setText(text != null ? text : "");
        r.setFontFamily(FONT_FAMILY);
        r.setFontSize(9.5);
        r.setBold(bold);
        r.setColor(COLOR_TEXT_DARK);
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

    private List<QuizQuestionItem> extractQuestions(Map<String, Object> data) {
        List<QuizQuestionItem> result = new ArrayList<>();
        if (data == null) return result;

        Object rawQuestions = data.get("questions");
        if (rawQuestions instanceof List<?> list) {
            for (Object obj : list) {
                if (obj instanceof Map<?, ?> qMap) {
                    QuizQuestionItem item = new QuizQuestionItem();
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

    public static class QuizQuestionItem {
        public int questionNumber;
        public String type = "MCQ";
        public String questionText = "";
        public List<String> options = new ArrayList<>();
        public String correctAnswer = "";
        public String explanation = "";
        public String bloomLevel = "Understand";
    }
}
