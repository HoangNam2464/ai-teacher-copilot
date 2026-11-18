package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.user.User;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class DocxLessonExporterTest {

    private DocxLessonExporter exporter;
    private GeneratedContent testContent;
    private User testTeacher;
    private List<CitationResolutionDto> testCitations;

    @BeforeEach
    void setUp() {
        exporter = new DocxLessonExporter();

        testTeacher = User.builder()
                .id(UUID.randomUUID())
                .fullName("Cô Nguyễn Thị Ánh")
                .email("anh.nguyen@school.edu.vn")
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
    @DisplayName("Export full lesson plan to DOCX with citations succeeds and satisfies formatting standards")
    void shouldExportFullLessonPlanToDocxSuccessfully() throws IOException {
        // Act
        byte[] docxBytes = exporter.exportLessonPlan(testContent, null, testCitations, true, testTeacher);

        // Assert
        assertThat(docxBytes).isNotNull();
        assertThat(docxBytes.length).isGreaterThan(1000);

        // Verify valid OOXML DOCX by parsing it back
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            List<String> paragraphTexts = document.getParagraphs().stream()
                    .map(XWPFParagraph::getText)
                    .toList();

            String fullText = String.join("\n", paragraphTexts);

            // Check Document Title and Header
            assertThat(fullText).contains("KẾ HOẠCH BÀI DẠY (GIÁO ÁN)");
            assertThat(fullText).contains("BÀI DẠY: KHÁI NIỆM VÉC TƠ VÀ CÁC PHÉP TOÁN");

            // Check Sections
            assertThat(fullText).contains("I. MỤC TIÊU BÀI HỌC (LEARNING OBJECTIVES)");
            assertThat(fullText).contains("Hiểu định nghĩa đoạn thẳng có hướng và véc tơ.");
            assertThat(fullText).contains("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU");
            assertThat(fullText).contains("Sách giáo khoa Toán 10 Chân Trời Sáng Tạo");
            assertThat(fullText).contains("III. TIẾN TRÌNH DẠY HỌC (INSTRUCTIONAL ACTIVITIES)");
            assertThat(fullText).contains("Hoạt động 1: Khởi động & Tạo tình huống");
            assertThat(fullText).contains("Hoạt động 2: Hình thành kiến thức mới");
            assertThat(fullText).contains("IV. ĐÁNH GIÁ VÀ HƯỚNG DẪN TỰ HỌC");
            assertThat(fullText).contains("Đánh giá qua phiếu bài tập củng cố");

            // Check Grounding Citations Section
            assertThat(fullText).contains("V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO (GROUNDING CITATIONS)");

            // Check Table Content (Metadata and Citations)
            List<XWPFTable> tables = document.getTables();
            assertThat(tables).hasSizeGreaterThanOrEqualTo(2);

            String tableText = tables.stream()
                    .flatMap(t -> t.getRows().stream())
                    .flatMap(r -> r.getTableCells().stream())
                    .map(c -> c.getText())
                    .reduce("", (a, b) -> a + " " + b);

            assertThat(tableText).contains("Cô Nguyễn Thị Ánh");
            assertThat(tableText).contains("Toán — Khối 10");
            assertThat(tableText).contains("45 phút");
            assertThat(tableText).contains("SGK_Toan_10_Tap1.pdf");
            assertThat(tableText).contains("Chuong_Trinh_GDPT_2018_Toan.pdf");
            assertThat(tableText).contains("Đoạn thẳng có hướng là đoạn thẳng đã chỉ rõ điểm đầu và điểm cuối.");
        }
    }

    @Test
    @DisplayName("Export without citations omits the citations appendix")
    void shouldExportWithoutCitationsWhenIncludeCitationsIsFalse() throws IOException {
        // Act
        byte[] docxBytes = exporter.exportLessonPlan(testContent, null, testCitations, false, testTeacher);

        // Assert
        assertThat(docxBytes).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            List<String> paragraphTexts = document.getParagraphs().stream()
                    .map(XWPFParagraph::getText)
                    .toList();
            String fullText = String.join("\n", paragraphTexts);

            assertThat(fullText).doesNotContain("V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO");
        }
    }

    @Test
    @DisplayName("Export with overrideContentData prioritizes client-provided edits")
    void shouldHonorOverrideContentData() throws IOException {
        // Arrange
        Map<String, Object> overrideData = Map.of(
                "title", "Giáo án Đã Chỉnh Sửa Trực Tiếp",
                "subject", "Toán Học Nâng Cao",
                "grade_level", "11",
                "duration_minutes", 90,
                "objectives", List.of("Mục tiêu chỉnh sửa 1")
        );

        // Act
        byte[] docxBytes = exporter.exportLessonPlan(testContent, overrideData, null, false, testTeacher);

        // Assert
        assertThat(docxBytes).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = document.getParagraphs().stream()
                    .map(XWPFParagraph::getText)
                    .reduce("", (a, b) -> a + "\n" + b);

            assertThat(fullText).contains("BÀI DẠY: GIÁO ÁN ĐÃ CHỈNH SỬA TRỰC TIẾP");
            assertThat(fullText).contains("Mục tiêu chỉnh sửa 1");
        }
    }
}
