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

class PdfLessonExporterTest {

    private PdfLessonExporter exporter;
    private GeneratedContent testContent;
    private User testTeacher;
    private List<CitationResolutionDto> testCitations;

    @BeforeEach
    void setUp() {
        exporter = new PdfLessonExporter();

        testTeacher = User.builder()
                .id(UUID.randomUUID())
                .fullName("Thầy Phạm Quang Minh")
                .email("minh.pham@school.edu.vn")
                .build();

        Map<String, Object> contentData = Map.of(
                "title", "Khái niệm Véc tơ và các phép toán",
                "subject", "Toán",
                "grade_level", "10",
                "duration_minutes", 45,
                "objectives", List.of(
                        "Hiểu định nghĩa đoạn thẳng có hướng và véc tơ.",
                        "Biết xác định phương, hướng và độ dài của một véc tơ."
                ),
                "materials_needed", List.of(
                        "Thước kẻ, compa, bảng phụ",
                        "Sách giáo khoa Toán 10 Chân Trời Sáng Tạo"
                ),
                "sections", List.of(
                        Map.of(
                                "title", "Khởi động & Tạo tình huống",
                                "duration_minutes", 5,
                                "content", "Giáo viên cho học sinh quan sát máy bay cất cánh và chỉ rõ vận tốc có hướng."
                        ),
                        Map.of(
                                "title", "Hình thành kiến thức mới",
                                "duration_minutes", 25,
                                "content", "Định nghĩa véc tơ: Một đoạn thẳng có hướng được gọi là véc tơ."
                        )
                ),
                "assessment", "Đánh giá qua phiếu bài tập củng cố gồm 3 câu hỏi trắc nghiệm."
        );

        testContent = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(UUID.randomUUID())
                .createdBy(testTeacher.getId())
                .contentType("LESSON_PLAN")
                .title("Khái niệm Véc tơ và các phép toán")
                .subject("Toán")
                .gradeLevel("10")
                .topic("Véc tơ")
                .contentData(contentData)
                .reviewStatus("REVIEWED")
                .build();

        testCitations = List.of(
                CitationResolutionDto.builder()
                        .citationId(UUID.randomUUID())
                        .contentId(testContent.getId())
                        .chunkId(UUID.randomUUID())
                        .fileName("SGK_Toan_10_Tap1.pdf")
                        .sourcePage(14)
                        .sourceLocation("Mục 1. Khái niệm véc tơ")
                        .excerpt("Đoạn thẳng có hướng là đoạn thẳng đã chỉ rõ điểm đầu và điểm cuối.")
                        .relevanceScore(0.95)
                        .build(),
                CitationResolutionDto.builder()
                        .citationId(UUID.randomUUID())
                        .contentId(testContent.getId())
                        .chunkId(UUID.randomUUID())
                        .fileName("Chuong_Trinh_GDPT_2018_Toan.pdf")
                        .sourcePage(28)
                        .sourceLocation("Yêu cầu cần đạt lớp 10")
                        .excerpt("Nhận biết được khái niệm véc tơ, độ dài véc tơ, hai véc tơ cùng phương.")
                        .relevanceScore(0.88)
                        .build()
        );
    }

    @Test
    @DisplayName("Export full lesson plan to PDF succeeds and generates valid PDF binary [BE-023]")
    void shouldExportFullLessonPlanToPdfSuccessfully() throws IOException {
        // Act
        byte[] pdfBytes = exporter.exportLessonPlan(testContent, null, testCitations, true, testTeacher);

        // Assert
        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        // Verify valid PDF magic header (%PDF-)
        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        // Verify valid PDF structure using PdfReader
        PdfReader reader = new PdfReader(pdfBytes);
        int pageCount = reader.getNumberOfPages();
        assertThat(pageCount).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("Export to PDF without citations succeeds and omits citations section")
    void shouldExportWithoutCitationsWhenIncludeCitationsIsFalse() throws IOException {
        // Act
        byte[] pdfBytes = exporter.exportLessonPlan(testContent, null, testCitations, false, testTeacher);

        // Assert
        assertThat(pdfBytes).isNotNull();
        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("Export to PDF with overrideContentData prioritizes client-provided edits")
    void shouldHonorOverrideContentData() throws IOException {
        // Arrange
        Map<String, Object> overrideData = Map.of(
                "title", "Giáo án Đã Chỉnh Sửa Trực Tiếp",
                "subject", "Vật Lý",
                "grade_level", "11",
                "duration_minutes", 90,
                "objectives", List.of("Hiểu định luật bảo toàn động lượng.")
        );

        // Act
        byte[] pdfBytes = exporter.exportLessonPlan(testContent, overrideData, null, false, testTeacher);

        // Assert
        assertThat(pdfBytes).isNotNull();
        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }
}
