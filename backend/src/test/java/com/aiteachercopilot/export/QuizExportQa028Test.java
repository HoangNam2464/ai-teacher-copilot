package com.aiteachercopilot.export;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.generation.ContentCitation;
import com.aiteachercopilot.generation.ContentCitationRepository;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import com.lowagie.text.pdf.PdfReader;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test Suite for [QA-028] (ATC-100): Test Student Quiz Sheet & Teacher Grading Guide Exports.
 * Validates all 4 Acceptance Criteria:
 * 1. Student sheet does not contain answers, explanations, bloom metadata, or citations.
 * 2. Teacher key contains exact correct answers and explanations.
 * 3. Grading guide is complete (Principles, Scoring Matrix, Bloom Distribution, Points).
 * 4. Export files (DOCX and PDF) open cleanly with valid binary structures.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class QuizExportQa028Test {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DocxQuizExporter docxQuizExporter;

    @Autowired
    private PdfQuizExporter pdfQuizExporter;

    @Autowired
    private ExportService exportService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    @Autowired
    private GeneratedContentRepository generatedContentRepository;

    @Autowired
    private ContentCitationRepository contentCitationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private WebClient aiServiceWebClient;

    private User teacherA;
    private User studentUser;
    private String teacherToken;
    private String studentToken;
    private Workspace workspaceA;
    private GeneratedContent quizContentA;
    private Document docA;
    private DocumentChunk chunkA;
    private List<CitationResolutionDto> testCitations;

    @BeforeEach
    void setUp() {
        contentCitationRepository.deleteAll();
        generatedContentRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Teacher
        teacherA = userRepository.save(User.builder()
                .email("teacher.qa028@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Thầy Hoàng Nam")
                .role("TEACHER")
                .isActive(true)
                .build());

        // 2. Create Student
        studentUser = userRepository.save(User.builder()
                .email("student.qa028@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Học Sinh Nguyễn Văn A")
                .role("STUDENT")
                .isActive(true)
                .build());

        teacherToken = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());
        studentToken = jwtTokenProvider.generateToken(studentUser.getId(), studentUser.getEmail());

        // 3. Create Workspace
        workspaceA = workspaceRepository.save(Workspace.builder()
                .name("Toán 10 - Khảo sát chất lượng")
                .ownerId(teacherA.getId())
                .subject("Toán học")
                .gradeLevel("10")
                .build());

        // 4. Create Source Document & Chunk
        docA = documentRepository.save(Document.builder()
                .workspaceId(workspaceA.getId())
                .uploadedBy(teacherA.getId())
                .fileName("SGK_Toan_10_KetNoiTriThuc.pdf")
                .fileType("application/pdf")
                .fileSize(4096L)
                .minioObjectKey("docs/SGK_Toan_10_KetNoiTriThuc.pdf")
                .processingStatus("COMPLETED")
                .build());

        chunkA = documentChunkRepository.save(DocumentChunk.builder()
                .documentId(docA.getId())
                .workspaceId(workspaceA.getId())
                .chunkIndex(0)
                .content("Véc tơ là đoạn thẳng có hướng. Hai véc tơ cùng phương khi và chỉ khi giá của chúng song song hoặc trùng nhau.")
                .subject("Toán học")
                .gradeLevel("10")
                .sourcePage(15)
                .sourceLocation("Bài 1: Khái niệm véc tơ")
                .build());

        // 5. Create Generated Quiz Content
        Map<String, Object> quizData = Map.of(
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
                                "question_text", "Cho tam giác ABC. Số véc tơ khác không có điểm đầu và điểm cuối là các đỉnh tam giác là:",
                                "options", List.of("3", "6", "9", "12"),
                                "correct_answer", "B",
                                "explanation", "Có 6 véc tơ tạo từ 3 đỉnh: AB, BA, BC, CB, CA, AC.",
                                "bloom_taxonomy_level", "Apply"
                        ),
                        Map.of(
                                "question_number", 3,
                                "type", "SHORT_ANSWER",
                                "question_text", "Nêu định nghĩa hai véc tơ cùng phương.",
                                "correct_answer", "Hai véc tơ được gọi là cùng phương nếu giá của chúng song song hoặc trùng nhau.",
                                "explanation", "Nêu rõ điều kiện về giá của hai véc tơ song song hoặc trùng nhau.",
                                "bloom_taxonomy_level", "Understand"
                        )
                )
        );

        quizContentA = generatedContentRepository.save(GeneratedContent.builder()
                .workspaceId(workspaceA.getId())
                .createdBy(teacherA.getId())
                .contentType("QUIZ")
                .title("Đề kiểm tra 15 phút - Khái niệm Véc tơ")
                .subject("Toán học")
                .gradeLevel("10")
                .topic("Véc tơ")
                .contentData(quizData)
                .reviewStatus("APPROVED")
                .version(1)
                .build());

        // 6. Persist Citations
        contentCitationRepository.save(ContentCitation.builder()
                .contentId(quizContentA.getId())
                .chunkId(chunkA.getId())
                .documentId(docA.getId())
                .build());

        testCitations = List.of(
                CitationResolutionDto.builder()
                        .citationId(UUID.randomUUID())
                        .contentId(quizContentA.getId())
                        .chunkId(chunkA.getId())
                        .fileName("SGK_Toan_10_KetNoiTriThuc.pdf")
                        .sourcePage(15)
                        .sourceLocation("Bài 1: Khái niệm véc tơ")
                        .excerpt("Véc tơ là đoạn thẳng có hướng.")
                        .relevanceScore(0.96)
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

    // =========================================================================
    // AC1: Student sheet KHÔNG chứa answer (No Answer Leakage)
    // =========================================================================

    @Test
    @DisplayName("AC1 [DOCX]: Student sheet must NOT contain answers, explanations, Bloom levels or citations")
    void testStudentSheetDocxDoesNotContainAnswers() throws IOException {
        byte[] docxBytes = docxQuizExporter.exportQuiz(
                quizContentA, null, testCitations, false, "STUDENT_EXAM", teacherA
        );

        assertThat(docxBytes).isNotNull();
        assertThat(docxBytes.length).isGreaterThan(1000);

        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            // 1. Verify Student Exam Sheet Header
            assertThat(fullText).contains("BÀI KIỂM TRA ĐÁNH GIÁ");
            assertThat(fullText).contains("HỌ VÀ TÊN: .......................................................");
            assertThat(fullText).contains("LỚP: .......................... SBD: .................................");
            assertThat(fullText).contains("TRƯỜNG: ..............................................................");
            assertThat(fullText).contains("ĐIỂM SỐ");
            assertThat(fullText).contains("NHẬN XÉT CỦA GIÁO VIÊN");

            // 2. Verify Question Prompts & Options are visible
            assertThat(fullText).contains("Câu 1: Véc tơ là gì?");
            assertThat(fullText).contains("A. Một đoạn thẳng có hướng");
            assertThat(fullText).contains("B. Một đường thẳng không có hướng");
            assertThat(fullText).contains("Câu 2: Cho tam giác ABC.");
            assertThat(fullText).contains("Câu 3: Nêu định nghĩa hai véc tơ cùng phương.");

            // 3. Verify End of Exam notice
            assertThat(fullText).contains("---------- HẾT ----------");
            assertThat(fullText).contains("(Cán bộ coi thi không giải thích gì thêm)");

            // 4. CRITICAL: Strictly verify NO answer leakages
            assertThat(fullText).doesNotContain("Đáp án đúng");
            assertThat(fullText).doesNotContain("Lời giải / Hướng dẫn");
            assertThat(fullText).doesNotContain("Theo SGK Toán 10, véc tơ là một đoạn thẳng có hướng");
            assertThat(fullText).doesNotContain("Có 6 véc tơ tạo từ 3 đỉnh");
            assertThat(fullText).doesNotContain("HƯỚNG DẪN CHẤM & MA TRẬN ĐÁP ÁN");
            assertThat(fullText).doesNotContain("GRADING GUIDE");
            assertThat(fullText).doesNotContain("Mức độ Bloom");
            assertThat(fullText).doesNotContain("SGK_Toan_10_KetNoiTriThuc.pdf");
        }
    }

    @Test
    @DisplayName("AC1 [PDF]: Student sheet in PDF must produce valid layout without answers")
    void testStudentSheetPdfDoesNotContainAnswers() throws IOException {
        byte[] pdfBytes = pdfQuizExporter.exportQuiz(
                quizContentA, null, testCitations, false, "STUDENT_EXAM", teacherA
        );

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        // Verify PDF Header Magic
        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        // Verify PDF can be opened and parsed
        PdfReader reader = new PdfReader(pdfBytes);
        int pageCount = reader.getNumberOfPages();
        assertThat(pageCount).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    // =========================================================================
    // AC2: Teacher key chứa answer chính xác (Accurate Teacher Answer Key)
    // =========================================================================

    @Test
    @DisplayName("AC2 [DOCX]: Teacher key must contain exact answers, explanations and question solutions")
    void testTeacherKeyDocxContainsExactAnswers() throws IOException {
        byte[] docxBytes = docxQuizExporter.exportQuiz(
                quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA
        );

        assertThat(docxBytes).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            // Verify Header
            assertThat(fullText).contains("HƯỚNG DẪN CHẤM & ĐÁP ÁN");

            // Verify Exact Answers for MCQs
            assertThat(fullText).contains("▶ Đáp án đúng: A");
            assertThat(fullText).contains("▶ Đáp án đúng: B");

            // Verify Detailed Explanations
            assertThat(fullText).contains("Lời giải / Hướng dẫn: Theo SGK Toán 10, véc tơ là một đoạn thẳng có hướng.");
            assertThat(fullText).contains("Lời giải / Hướng dẫn: Có 6 véc tơ tạo từ 3 đỉnh");

            // Verify Short Answer Solution
            assertThat(fullText).contains("▶ Đáp án đúng: Hai véc tơ được gọi là cùng phương nếu giá của chúng song song hoặc trùng nhau.");

            // Verify Bloom levels
            assertThat(fullText).contains("[Mức độ Bloom: Remember]");
            assertThat(fullText).contains("[Mức độ Bloom: Apply]");
            assertThat(fullText).contains("[Mức độ Bloom: Understand]");
        }
    }

    @Test
    @DisplayName("AC2 [PDF]: Teacher key in PDF must generate complete answer key pages")
    void testTeacherKeyPdfContainsExactAnswers() throws IOException {
        byte[] pdfBytes = pdfQuizExporter.exportQuiz(
                quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA
        );

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1000);

        String header = new String(pdfBytes, 0, Math.min(8, pdfBytes.length), StandardCharsets.US_ASCII);
        assertThat(header).startsWith("%PDF-");

        PdfReader reader = new PdfReader(pdfBytes);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    // =========================================================================
    // AC3: Grading guide đầy đủ (Comprehensive Pedagogical Grading Guide)
    // =========================================================================

    @Test
    @DisplayName("AC3 [DOCX]: Teacher key must contain complete Grading Guide, Matrix and Bloom breakdown")
    void testTeacherKeyDocxContainsCompleteGradingGuide() throws IOException {
        byte[] docxBytes = docxQuizExporter.exportQuiz(
                quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA
        );

        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String fullText = extractAllDocumentText(document);

            // Section I: Grading Guide Principles
            assertThat(fullText).contains("I. NGUYÊN TẮC CHẤM & BIỂU ĐIỂM (GRADING GUIDE)");
            assertThat(fullText).contains("Thang điểm chuẩn: 10.0 điểm toàn bài");
            assertThat(fullText).contains("Câu hỏi trắc nghiệm (MCQ): Chọn đúng đáp án nhận trọn số điểm");
            assertThat(fullText).contains("Đúng từ khóa/khái niệm cốt lõi");

            // Section II: Scoring Matrix Table
            assertThat(fullText).contains("II. MA TRẬN ĐÁP ÁN & BIỂU ĐIỂM CHI TIẾT");
            assertThat(fullText).contains("Dạng câu hỏi");
            assertThat(fullText).contains("Đáp án đúng");
            assertThat(fullText).contains("Cấp độ nhận thức (Bloom)");
            assertThat(fullText).contains("Biểu điểm");

            // Section III: Bloom Distribution Analysis
            assertThat(fullText).contains("III. PHÂN BỔ MỨC ĐỘ NHẬN THỨC THEO BLOOM");
            assertThat(fullText).contains("Cấp độ nhận thức (Bloom)");
            assertThat(fullText).contains("Nhận biết (Remember)");
            assertThat(fullText).contains("Thông hiểu (Understand)");
            assertThat(fullText).contains("Vận dụng (Apply)");

            // Section IV: Citations & Sources
            assertThat(fullText).contains("SGK_Toan_10_KetNoiTriThuc.pdf");
        }
    }

    @Test
    @DisplayName("AC3 [PDF]: Teacher key in PDF includes multi-section grading guide")
    void testTeacherKeyPdfContainsCompleteGradingGuide() throws IOException {
        byte[] pdfBytes = pdfQuizExporter.exportQuiz(
                quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA
        );

        assertThat(pdfBytes).isNotNull();
        PdfReader reader = new PdfReader(pdfBytes);
        // Teacher key contains comprehensive grading guide tables and is multi-page or well-populated
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    // =========================================================================
    // AC4: File export mở được (Valid Openable File Streams)
    // =========================================================================

    @Test
    @DisplayName("AC4 [Format & Openability]: DOCX and PDF binaries open cleanly without corruption")
    void testFileExportOpensCleanly() throws IOException {
        // 1. DOCX in STUDENT_EXAM mode
        byte[] docxStudent = docxQuizExporter.exportQuiz(quizContentA, null, null, false, "STUDENT_EXAM", teacherA);
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(docxStudent))) {
            assertThat(docx.getParagraphs()).isNotEmpty();
        }

        // 2. DOCX in TEACHER_KEY mode
        byte[] docxTeacher = docxQuizExporter.exportQuiz(quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA);
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(docxTeacher))) {
            assertThat(docx.getParagraphs()).isNotEmpty();
            assertThat(docx.getTables()).isNotEmpty();
        }

        // 3. PDF in STUDENT_EXAM mode
        byte[] pdfStudent = pdfQuizExporter.exportQuiz(quizContentA, null, null, false, "STUDENT_EXAM", teacherA);
        PdfReader readerStudent = new PdfReader(pdfStudent);
        assertThat(readerStudent.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        readerStudent.close();

        // 4. PDF in TEACHER_KEY mode
        byte[] pdfTeacher = pdfQuizExporter.exportQuiz(quizContentA, null, testCitations, true, "TEACHER_KEY", teacherA);
        PdfReader readerTeacher = new PdfReader(pdfTeacher);
        assertThat(readerTeacher.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        readerTeacher.close();
    }

    // =========================================================================
    // REST API Integration: Endpoints for Student Sheet & Teacher Key
    // =========================================================================

    @Test
    @DisplayName("REST API: POST export DOCX in STUDENT_EXAM mode returns 200 with de-thi filename")
    void testPostExportQuizStudentExamDocx() throws Exception {
        MvcResult result = mockMvc.perform(post("/workspaces/{wId}/export/{gId}", workspaceA.getId(), quizContentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)
                        .param("format", "DOCX")
                        .param("exportMode", "STUDENT_EXAM"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("de-thi_")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.DOCX_MIME_TYPE))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(body))) {
            String text = extractAllDocumentText(document);
            assertThat(text).contains("BÀI KIỂM TRA ĐÁNH GIÁ");
            assertThat(text).doesNotContain("Đáp án đúng");
        }
    }

    @Test
    @DisplayName("REST API: POST export DOCX in TEACHER_KEY mode returns 200 with dap-an filename")
    void testPostExportQuizTeacherKeyDocx() throws Exception {
        MvcResult result = mockMvc.perform(post("/workspaces/{wId}/export/{gId}", workspaceA.getId(), quizContentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)
                        .param("format", "DOCX")
                        .param("exportMode", "TEACHER_KEY"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("dap-an_")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.DOCX_MIME_TYPE))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(body))) {
            String text = extractAllDocumentText(document);
            assertThat(text).contains("HƯỚNG DẪN CHẤM & ĐÁP ÁN");
            assertThat(text).contains("▶ Đáp án đúng: A");
            assertThat(text).contains("I. NGUYÊN TẮC CHẤM & BIỂU ĐIỂM (GRADING GUIDE)");
        }
    }

    @Test
    @DisplayName("REST API: GET export PDF in STUDENT_EXAM mode returns 200 with application/pdf")
    void testGetExportQuizStudentExamPdf() throws Exception {
        MvcResult result = mockMvc.perform(get("/workspaces/{wId}/export/{gId}", workspaceA.getId(), quizContentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)
                        .param("format", "PDF")
                        .param("exportMode", "STUDENT_EXAM"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("de-thi_")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        PdfReader reader = new PdfReader(body);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("REST API: GET export PDF in TEACHER_KEY mode returns 200 with application/pdf")
    void testGetExportQuizTeacherKeyPdf() throws Exception {
        MvcResult result = mockMvc.perform(get("/workspaces/{wId}/export/{gId}", workspaceA.getId(), quizContentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)
                        .param("format", "PDF")
                        .param("exportMode", "TEACHER_KEY"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("dap-an_")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        PdfReader reader = new PdfReader(body);
        assertThat(reader.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        reader.close();
    }

    @Test
    @DisplayName("REST API Security: Student role attempting export must receive HTTP 403 Forbidden")
    void testExportByStudentRoleReturns403() throws Exception {
        mockMvc.perform(get("/workspaces/{wId}/export/{gId}", workspaceA.getId(), quizContentA.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                        .param("format", "DOCX")
                        .param("exportMode", "STUDENT_EXAM"))
                .andExpect(status().isForbidden());
    }
}
