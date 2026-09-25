package com.aiteachercopilot.export;

import com.aiteachercopilot.auth.JwtTokenProvider;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ExportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    private User teacherB;
    private String tokenA;
    private String tokenB;
    private Workspace workspaceA;
    private Workspace workspaceB;
    private GeneratedContent lessonContentA;
    private Document docA;
    private DocumentChunk chunkA;

    @BeforeEach
    void setUp() {
        contentCitationRepository.deleteAll();
        generatedContentRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        teacherA = userRepository.save(User.builder()
                .email("teacherA.export@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Cô Lê Thu Hà")
                .role("TEACHER")
                .isActive(true)
                .build());

        teacherB = userRepository.save(User.builder()
                .email("teacherB.export@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Thầy Vũ Đức Đam")
                .role("TEACHER")
                .isActive(true)
                .build());

        tokenA = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());
        tokenB = jwtTokenProvider.generateToken(teacherB.getId(), teacherB.getEmail());

        workspaceA = workspaceRepository.save(Workspace.builder()
                .name("Toán 10 - Tổ Tự Nhiên")
                .ownerId(teacherA.getId())
                .subject("Toán")
                .gradeLevel("10")
                .build());

        workspaceB = workspaceRepository.save(Workspace.builder()
                .name("Vật Lý 10")
                .ownerId(teacherB.getId())
                .subject("Vật Lý")
                .gradeLevel("10")
                .build());

        docA = documentRepository.save(Document.builder()
                .workspaceId(workspaceA.getId())
                .uploadedBy(teacherA.getId())
                .fileName("SGK_Toan_10_KetNoiTriThuc.pdf")
                .fileType("application/pdf")
                .fileSize(2048L)
                .minioObjectKey("docs/SGK_Toan_10_KetNoiTriThuc.pdf")
                .processingStatus("COMPLETED")
                .build());

        chunkA = documentChunkRepository.save(DocumentChunk.builder()
                .documentId(docA.getId())
                .workspaceId(workspaceA.getId())
                .chunkIndex(0)
                .content("Véc tơ là một đoạn thẳng có hướng, nghĩa là trong hai điểm mút của đoạn thẳng đã chỉ rõ điểm nào là điểm đầu, điểm nào là điểm cuối.")
                .subject("Toán")
                .gradeLevel("10")
                .sourcePage(45)
                .sourceLocation("Bài 7. Các khái niệm mở đầu")
                .build());

        Map<String, Object> contentData = Map.of(
                "title", "Giáo án Bài 7: Khái niệm véc tơ",
                "subject", "Toán",
                "grade_level", "10",
                "duration_minutes", 45,
                "objectives", List.of(
                        "Hiểu định nghĩa véc tơ, véc tơ-không, hai véc tơ cùng phương.",
                        "Biết biểu diễn hình học của véc tơ và vận dụng vào bài toán thực tiễn."
                ),
                "materials_needed", List.of("Sách giáo khoa Toán 10", "Thước thẳng và compa"),
                "sections", List.of(
                        Map.of(
                                "title", "Khởi động",
                                "duration_minutes", 7,
                                "content", "Giáo viên cho học sinh quan sát hướng chuyển động của thuyền buồm xuôi gió."
                        ),
                        Map.of(
                                "title", "Hình thành kiến thức",
                                "duration_minutes", 23,
                                "content", "Định nghĩa: Véc tơ là đoạn thẳng có hướng."
                        )
                ),
                "assessment", "Đánh giá qua bài tập trắc nghiệm nhanh 4 câu hỏi cuối giờ."
        );

        lessonContentA = generatedContentRepository.save(GeneratedContent.builder()
                .workspaceId(workspaceA.getId())
                .createdBy(teacherA.getId())
                .contentType("LESSON_PLAN")
                .title("Giáo án Bài 7: Khái niệm véc tơ")
                .subject("Toán")
                .gradeLevel("10")
                .topic("Khái niệm véc tơ")
                .contentData(contentData)
                .reviewStatus("APPROVED")
                .build());

        contentCitationRepository.save(ContentCitation.builder()
                .contentId(lessonContentA.getId())
                .chunkId(chunkA.getId())
                .documentId(docA.getId())
                .citationText("Véc tơ là một đoạn thẳng có hướng...")
                .relevanceScore(0.96)
                .build());
    }

    @Test
    @DisplayName("POST /workspaces/{id}/export/{id}?format=DOCX - returns 200 OK with valid DOCX binary stream [BE-022]")
    void testExportPost_Success() throws Exception {
        ExportRequestDto req = ExportRequestDto.builder()
                .includeCitations(true)
                .build();

        MvcResult result = mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "DOCX")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.DOCX_MIME_TYPE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment;")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".docx")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        assertThat(body.length).isGreaterThan(1000);

        // Verify that the body is indeed a valid Word document
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(body))) {
            String fullDoc = document.getParagraphs().stream()
                    .map(p -> p.getText())
                    .reduce("", (a, b) -> a + "\n" + b);

            assertThat(fullDoc).contains("KẾ HOẠCH BÀI DẠY (GIÁO ÁN)");
            assertThat(fullDoc).contains("BÀI DẠY: GIÁO ÁN BÀI 7: KHÁI NIỆM VÉC TƠ");
            assertThat(fullDoc).contains("V. CĂN CỨ TRÍCH DẪN & TÀI LIỆU THAM KHẢO");

            // Verify Citation Reference table
            String tableContent = document.getTables().stream()
                    .flatMap(t -> t.getRows().stream())
                    .flatMap(r -> r.getTableCells().stream())
                    .map(c -> c.getText())
                    .reduce("", (a, b) -> a + " " + b);

            assertThat(tableContent).contains("SGK_Toan_10_KetNoiTriThuc.pdf");
            assertThat(tableContent).contains("Trang: 45");
            assertThat(tableContent).contains("Cô Lê Thu Hà");
        }
    }

    @Test
    @DisplayName("GET /workspaces/{id}/export/{id}?format=DOCX - returns 200 OK with valid DOCX [BE-022]")
    void testExportGet_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "DOCX")
                        .param("includeCitations", "true"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.DOCX_MIME_TYPE))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        assertThat(body.length).isGreaterThan(1000);
    }

    @Test
    @DisplayName("POST /workspaces/{id}/export/{id}?format=PDF - returns 200 OK with valid PDF binary stream [BE-023]")
    void testExportPdfPost_Success() throws Exception {
        ExportRequestDto req = ExportRequestDto.builder()
                .includeCitations(true)
                .build();

        MvcResult result = mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "PDF")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.PDF_MIME_TYPE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment;")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        assertThat(body.length).isGreaterThan(1000);

        String pdfHeader = new String(body, 0, Math.min(8, body.length), java.nio.charset.StandardCharsets.US_ASCII);
        assertThat(pdfHeader).startsWith("%PDF-");
    }

    @Test
    @DisplayName("GET /workspaces/{id}/export/{id}?format=PDF - returns 200 OK with valid PDF [BE-023]")
    void testExportPdfGet_Success() throws Exception {
        MvcResult result = mockMvc.perform(get("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "PDF")
                        .param("includeCitations", "true"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, ExportService.PDF_MIME_TYPE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment;")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString(".pdf")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotNull();
        assertThat(body.length).isGreaterThan(1000);

        String pdfHeader = new String(body, 0, Math.min(8, body.length), java.nio.charset.StandardCharsets.US_ASCII);
        assertThat(pdfHeader).startsWith("%PDF-");
    }

    @Test
    @DisplayName("POST /workspaces/{id}/export/{id} - cross-workspace access by unauthorized teacher returns 403 Forbidden")
    void testExportPost_CrossWorkspace_Returns403() throws Exception {
        // Teacher B attempts to export Teacher A's content in Workspace A
        mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .param("format", "DOCX"))
                .andExpect(status().isForbidden());

        // Teacher B attempts to export Teacher A's content using Workspace B
        mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceB.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .param("format", "DOCX"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /workspaces/{id}/export/{id} - non-existent generationId returns 404 Not Found")
    void testExportPost_NotFound() throws Exception {
        mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "DOCX"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /workspaces/{id}/export/{id} - unsupported format returns 400 Bad Request")
    void testExportPost_UnsupportedFormat_Returns400() throws Exception {
        mockMvc.perform(post("/workspaces/{workspaceId}/export/{generationId}",
                        workspaceA.getId(), lessonContentA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .param("format", "UNKNOWN_FORMAT"))
                .andExpect(status().isBadRequest());
    }
}
