package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.user.User;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class DocxQuizExporterTest {

    private DocxQuizExporter exporter;
    private GeneratedContent testQuizContent;
    private User testTeacher;
    private List<CitationResolutionDto> testCitations;

    @BeforeEach
    void setUp() {
        exporter = new DocxQuizExporter();

        testTeacher = User.builder()
                .id(UUID.randomUUID())
                .fullName("Thầy Hoàng Nam")
                .email("nam.hoang@school.edu.vn")
                .build();

        Map<String, Object> contentData = Map.of(
                "title", "Đề kiểm tra 15 phút - Khái niệm Véc tơ",
                "subject", "Toán học",
                "grade_level", "10",
                "topic", "Véc tơ và các phép toán",
                "questions", List.of(
                        Map.of(
                                "question_number", 1,
                                "type", "MCQ",
                                "question_text", "Véc tơ là gì?",
                                "options", List.of(
                                        "Một đoạn thẳng có hướng",
                                        "Một đường thẳng không có hướng",
                                        "Một điểm nằm trên mặt phẳng",
                                        "Một tia bất kì"
                                ),
                                "correct_answer", "A",
                                "explanation", "Theo SGK Toán 10, véc tơ là một đoạn thẳng có hướng.",
                                "bloom_taxonomy_level", "Remember"
                        ),
                        Map.of(
                                "question_number", 2,
                                "type", "MCQ",
                                "question_text", "Cho tam giác ABC. Số véc tơ khác véc tơ-không có điểm đầu và điểm cuối là các đỉnh của tam giác là:",
                                "options", List.of("3", "6", "9", "12"),
                                "correct_answer", "B",
                                "explanation", "Có 6 véc tơ tạo từ 3 đỉnh: AB, BA, BC, CB, CA, AC.",
                                "bloom_taxonomy_level", "Apply"
                        ),
                        Map.of(
                                "question_number", 3,
                                "type", "SHORT_ANSWER",
                                "question_text", "Nêu định nghĩa hai véc tơ cùng phương và vẽ hình minh hoạ.",
                                "correct_answer", "Hai véc tơ được gọi là cùng phương nếu giá của chúng song song hoặc trùng nhau.",
                                "explanation", "Cần nêu rõ điều kiện về giá của hai véc tơ song song hoặc trùng nhau.",
                                "bloom_taxonomy_level", "Understand"
                        )
                )
        );

        testQuizContent = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(UUID.randomUUID())
                .createdBy(testTeacher.getId())
                .contentType("QUIZ")
                .title("Đề kiểm tra 15 phút - Khái niệm Véc tơ")
                .subject("Toán học")
                .gradeLevel("10")
                .topic("Véc tơ")
                .contentData(contentData)
                .reviewStatus("REVIEWED")
                .build();

        testCitations = List.of(
                CitationResolutionDto.builder()
                        .citationId(UUID.randomUUID())
                        .contentId(testQuizContent.getId())
                        .chunkId(UUID.randomUUID())
                        .fileName("SGK_Toan_10_Tap1.pdf")
                        .sourcePage(14)
                        .sourceLocation("Bài 1. Khái niệm véc tơ")
                        .excerpt("Đoạn thẳng có hướng là đoạn thẳng đã chỉ rõ điểm đầu và điểm cuối.")
                        .relevanceScore(0.95)
                        .build()
        );
    }

    private String extractAllDocumentText(XWPFDocument document) {
        StringBuilder sb = new StringBuilder();
        for (XWPFParagraph p : document.getParagraphs()) {
            sb.append(p.getText()).append("\n");
        }
        for (XWPFTable t : document.getTables()) {
            for (XWPFTableRow r : t.getRows()) {
                for (XWPFTableCell c : r.getTableCells()) {
                    sb.append(c.getText()).append(" ");
                }
                sb.append("\n");
            }
        }
        return sb.toString();
    }

    @Test
    @DisplayName("[BE-030] Export student exam sheet in DOCX without answers, explanations, or internal Bloom metadata")
    void shouldExportStudentExamSheetWithoutAnswersSuccessfully() throws IOException {
        // Act: mode STUDENT_EXAM
        byte[] docxBytes = exporter.exportQuiz(testQuizContent, null, testCitations, false, "STUDENT_EXAM", testTeacher);

        // Assert: Valid non-empty DOCX
        assertThat(docxBytes).isNotNull();
        assertThat(docxBytes.length).isGreaterThan(1000);

        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            // 1. Check Student Exam Header Elements
            assertThat(fullText).contains("BÀI KIỂM TRA ĐÁNH GIÁ");
            assertThat(fullText).contains("Môn: Toán học — Khối 10");
            assertThat(fullText).contains("Thời gian làm bài:");
            assertThat(fullText).contains("Chủ đề: VÉC TƠ VÀ CÁC PHÉP TOÁN");
            assertThat(fullText).contains("HỌ VÀ TÊN: .......................................................");
            assertThat(fullText).contains("LỚP: .......................... SBD: .................................");
            assertThat(fullText).contains("TRƯỜNG: ..............................................................");

            // 2. Check Score and Teacher Feedback Table
            assertThat(fullText).contains("ĐIỂM SỐ");
            assertThat(fullText).contains("NHẬN XÉT CỦA GIÁO VIÊN");

            // 3. Check Questions and Options exist
            assertThat(fullText).contains("Câu 1: Véc tơ là gì?");
            assertThat(fullText).contains("A. Một đoạn thẳng có hướng");
            assertThat(fullText).contains("B. Một đường thẳng không có hướng");
            assertThat(fullText).contains("C. Một điểm nằm trên mặt phẳng");
            assertThat(fullText).contains("D. Một tia bất kì");

            assertThat(fullText).contains("Câu 2: Cho tam giác ABC.");
            assertThat(fullText).contains("Câu 3: Nêu định nghĩa hai véc tơ cùng phương và vẽ hình minh hoạ.");
            assertThat(fullText).contains("Trả lời: ...........................................................................................................................................................");

            // 4. Check Exam End notice
            assertThat(fullText).contains("---------- HẾT ----------");
            assertThat(fullText).contains("(Cán bộ coi thi không giải thích gì thêm)");

            // 5. CRITICAL: Verify NO answer leaks or internal metadata
            assertThat(fullText).doesNotContain("Đáp án đúng");
            assertThat(fullText).doesNotContain("Lời giải / Hướng dẫn");
            assertThat(fullText).doesNotContain("Theo SGK Toán 10, véc tơ là một đoạn thẳng có hướng");
            assertThat(fullText).doesNotContain("Có 6 véc tơ tạo từ 3 đỉnh");
            assertThat(fullText).doesNotContain("HƯỚNG DẪN CHẤM & MA TRẬN ĐÁP ÁN");
            assertThat(fullText).doesNotContain("Mức độ Bloom");
            assertThat(fullText).doesNotContain("SGK_Toan_10_Tap1.pdf");
        }
    }

    @Test
    @DisplayName("[BE-031] Export teacher answer key in DOCX includes answers, explanations, and Bloom taxonomy matrix")
    void shouldExportTeacherKeyWithAnswersAndMatrixSuccessfully() throws IOException {
        // Act: mode TEACHER_KEY
        byte[] docxBytes = exporter.exportQuiz(testQuizContent, null, testCitations, true, "TEACHER_KEY", testTeacher);

        assertThat(docxBytes).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            // Verify teacher headers and answer information
            assertThat(fullText).contains("HƯỚNG DẪN CHẤM & ĐÁP ÁN");
            assertThat(fullText).contains("HƯỚNG DẪN CHẤM & MA TRẬN ĐÁP ÁN (DÀNH CHO GIÁO VIÊN)");
            assertThat(fullText).contains("▶ Đáp án đúng: A");
            assertThat(fullText).contains("▶ Đáp án đúng: B");
            assertThat(fullText).contains("Lời giải / Hướng dẫn: Theo SGK Toán 10, véc tơ là một đoạn thẳng có hướng.");
            assertThat(fullText).contains("[Mức độ Bloom: Remember]");

            // Verify Grading Guide and Scoring
            assertThat(fullText).contains("I. NGUYÊN TẮC CHẤM & BIỂU ĐIỂM (GRADING GUIDE)");
            assertThat(fullText).contains("Thang điểm chuẩn: 10.0 điểm toàn bài");
            assertThat(fullText).contains("II. MA TRẬN ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT");
            assertThat(fullText).contains("Biểu điểm");
            assertThat(fullText).contains("III. PHÂN BỔ MỨC ĐỘ NHẬN THỨC THEO BLOOM");

            // Check Matrix Table
            assertThat(fullText).contains("Cấp độ nhận thức (Bloom)");
            assertThat(fullText).contains("SGK_Toan_10_Tap1.pdf");
        }
    }

    @Test
    @DisplayName("Export with client overrides uses updated question text and title")
    void shouldHonorClientOverridesWhenExportingQuiz() throws IOException {
        Map<String, Object> overrideData = Map.of(
                "title", "Đề kiểm tra 45 phút - Hình học 10",
                "subject", "Toán học nâng cao",
                "questions", List.of(
                        Map.of(
                                "question_number", 1,
                                "type", "MCQ",
                                "question_text", "Câu hỏi chỉnh sửa đặc biệt?",
                                "options", List.of("Lựa chọn 1", "Lựa chọn 2"),
                                "correct_answer", "A"
                        )
                )
        );

        byte[] docxBytes = exporter.exportQuiz(testQuizContent, overrideData, null, false, "STUDENT_EXAM", testTeacher);

        assertThat(docxBytes).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            assertThat(fullText).contains("Môn: Toán học nâng cao");
            assertThat(fullText).contains("Câu 1: Câu hỏi chỉnh sửa đặc biệt?");
            assertThat(fullText).contains("A. Lựa chọn 1");
            assertThat(fullText).contains("B. Lựa chọn 2");
            assertThat(fullText).doesNotContain("Đáp án đúng");
        }
    }
}
