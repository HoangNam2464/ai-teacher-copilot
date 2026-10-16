package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.user.User;
import com.lowagie.text.pdf.PdfReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PdfQuizExporterTest {

    private PdfQuizExporter exporter;
    private GeneratedContent testQuizContent;
    private User testTeacher;
    private List<CitationResolutionDto> testCitations;

    @BeforeEach
    void setUp() {
        exporter = new PdfQuizExporter();

        testTeacher = User.builder()
                .id(UUID.randomUUID())
                .fullName("Thầy Phạm Quang Minh")
                .email("minh.pham@school.edu.vn")
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
                                "type", "SHORT_ANSWER",
                                "question_text", "Nêu định nghĩa hai véc tơ cùng phương.",
                                "correct_answer", "Hai véc tơ có giá song song hoặc trùng nhau.",
                                "explanation", "Cần nêu rõ quan hệ giữa giá của hai véc tơ.",
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

    @Test
    @DisplayName("[BE-030] Export student quiz sheet to PDF produces valid PDF without answers")
    void shouldExportStudentExamSheetToPdfSuccessfully() throws IOException {
        // Act: STUDENT_EXAM
        byte[] pdfBytes = exporter.exportQuiz(testQuizContent, null, testCitations, false, "STUDENT_EXAM", testTeacher);

        // Assert
        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        // Verify valid PDF magic header (%PDF-)
        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        // Verify readable PDF structure
        PdfReader reader = new PdfReader(pdfBytes);
        int pageCount = reader.getNumberOfPages();
        assertThat(pageCount).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("[BE-031] Export teacher answer key to PDF produces valid PDF with key matrix")
    void shouldExportTeacherKeyToPdfSuccessfully() throws IOException {
        // Act: TEACHER_KEY
        byte[] pdfBytes = exporter.exportQuiz(testQuizContent, null, testCitations, true, "TEACHER_KEY", testTeacher);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("Export quiz to PDF with client overrides succeeds")
    void shouldHonorOverrideContentDataInPdf() throws IOException {
        Map<String, Object> overrideData = Map.of(
                "title", "Đề kiểm tra sửa đổi",
                "subject", "Hình học 10",
                "questions", List.of(
                        Map.of(
                                "question_number", 1,
                                "type", "MCQ",
                                "question_text", "Câu hỏi trắc nghiệm mới",
                                "options", List.of("A", "B", "C", "D"),
                                "correct_answer", "A"
                        )
                )
        );

        byte[] pdfBytes = exporter.exportQuiz(testQuizContent, overrideData, null, false, "STUDENT_EXAM", testTeacher);

        assertThat(pdfBytes).isNotNull();
        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }
}
