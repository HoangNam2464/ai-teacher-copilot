package com.aiteachercopilot.generation;

import com.aiteachercopilot.auth.JwtTokenProvider;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@SuppressWarnings({"rawtypes", "unchecked"})
public class GenerationIntegrationTest {

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
    private DocumentChunk chunk1;

    @BeforeEach
    void setUp() {
        contentCitationRepository.deleteAll();
        generatedContentRepository.deleteAll();
        documentChunkRepository.deleteAll();
        documentRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();

        teacherA = userRepository.save(User.builder()
                .email("teacherA@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Cô Nguyễn Thị A")
                .role("TEACHER")
                .isActive(true)
                .build());

        teacherB = userRepository.save(User.builder()
                .email("teacherB@school.edu.vn")
                .passwordHash(passwordEncoder.encode("Password123@"))
                .fullName("Thầy Trần Văn B")
                .role("TEACHER")
                .isActive(true)
                .build());

        tokenA = jwtTokenProvider.generateToken(teacherA.getId(), teacherA.getEmail());
        tokenB = jwtTokenProvider.generateToken(teacherB.getId(), teacherB.getEmail());

        workspaceA = workspaceRepository.save(Workspace.builder()
                .name("Toán 10 Chân Trời Sáng Tạo")
                .ownerId(teacherA.getId())
                .subject("Toán")
                .gradeLevel("10")
                .build());

        Document doc = documentRepository.save(Document.builder()
                .workspaceId(workspaceA.getId())
                .uploadedBy(teacherA.getId())
                .fileName("Toan10_Tap1.pdf")
                .fileType("application/pdf")
                .fileSize(1024L)
                .minioObjectKey("docs/Toan10_Tap1.pdf")
                .processingStatus("COMPLETED")
                .build());

        chunk1 = documentChunkRepository.save(DocumentChunk.builder()
                .documentId(doc.getId())
                .workspaceId(workspaceA.getId())
                .chunkIndex(0)
                .content("Khái niệm cơ bản về véc tơ và các phép toán véc tơ trong mặt phẳng.")
                .subject("Toán")
                .gradeLevel("10")
                .sourcePage(12)
                .build());
    }

    @Test
    @DisplayName("POST /workspaces/{id}/generation/lesson-plan - successfully persists lesson plan and citations [BE-019]")
    void shouldGenerateAndPersistLessonPlanSuccessfully() throws Exception {
        // Arrange
        WebClient.RequestBodyUriSpec requestBodyUriSpec = mock(WebClient.RequestBodyUriSpec.class);
        WebClient.RequestBodySpec requestBodySpec = mock(WebClient.RequestBodySpec.class);
        WebClient.RequestHeadersSpec<?> requestHeadersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(anyString());
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();

        Map<String, Object> aiPlanData = Map.of(
                "title", "Giáo án: Khái niệm Véc tơ",
                "subject", "Toán",
                "grade_level", "10",
                "duration_minutes", 45,
                "objectives", List.of("Hiểu khái niệm véc tơ", "Xác định hướng và độ dài"),
                "sections", List.of(
                        Map.of("title", "Khởi động", "duration_minutes", 5, "content", "Quan sát mũi tên chỉ hướng gió"),
                        Map.of("title", "Hình thành kiến thức", "duration_minutes", 20, "content", "Định nghĩa đoạn thẳng có hướng")
                ),
                "materials_needed", List.of("Thước kẻ", "SGK"),
                "source_chunk_ids", List.of(chunk1.getId().toString()),
                "insufficient_evidence", false
        );

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "lesson_plan",
                "data", aiPlanData
        );

        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GenerationRequestDto requestDto = GenerationRequestDto.builder()
                .subject("Toán")
                .gradeLevel("10")
                .topic("Véc tơ")
                .instructions("Soạn ngắn gọn, sinh động")
                .build();

        // Act & Assert
        mockMvc.perform(post("/workspaces/" + workspaceA.getId() + "/generation/lesson-plan")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.contentType", is("LESSON_PLAN")))
                .andExpect(jsonPath("$.data.reviewStatus", is("DRAFT")))
                .andExpect(jsonPath("$.data.version", is(1)))
                .andExpect(jsonPath("$.data.title", is("Giáo án: Khái niệm Véc tơ")))
                .andExpect(jsonPath("$.data.id", notNullValue()));

        // Assert database persistence
        List<GeneratedContent> allContents = generatedContentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceA.getId());
        assertThat(allContents).hasSize(1);

        GeneratedContent saved = allContents.get(0);
        assertThat(saved.getContentType()).isEqualTo("LESSON_PLAN");
        assertThat(saved.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(saved.getVersion()).isEqualTo(1);
        assertThat(saved.getCreatedBy()).isEqualTo(teacherA.getId());
        assertThat(saved.getWorkspaceId()).isEqualTo(workspaceA.getId());
        assertThat(saved.getSubject()).isEqualTo("Toán");
        assertThat(saved.getGradeLevel()).isEqualTo("10");
        assertThat(saved.getTopic()).isEqualTo("Véc tơ");
        assertThat(saved.getModelUsed()).isEqualTo("gemini-1.5-flash");
        assertThat(saved.getGenerationTimeMs()).isNotNull();

        // Assert citation persistence
        var citations = contentCitationRepository.findByContentId(saved.getId());
        assertThat(citations).hasSize(1);
        assertThat(citations.get(0).getChunkId()).isEqualTo(chunk1.getId());
        assertThat(citations.get(0).getDocumentId()).isEqualTo(chunk1.getDocumentId());
    }

    @Test
    @DisplayName("Cross-workspace generation request should return 403 Forbidden")
    void shouldReturnForbiddenForCrossWorkspaceAccess() throws Exception {
        GenerationRequestDto requestDto = GenerationRequestDto.builder()
                .subject("Toán")
                .gradeLevel("10")
                .topic("Véc tơ")
                .build();

        mockMvc.perform(post("/workspaces/" + workspaceA.getId() + "/generation/lesson-plan")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Validation failure on missing required fields should return 400 Bad Request")
    void shouldReturnBadRequestWhenMissingFields() throws Exception {
        GenerationRequestDto requestDto = GenerationRequestDto.builder()
                .subject("") // Invalid blank subject
                .gradeLevel("10")
                .topic("")
                .build();

        mockMvc.perform(post("/workspaces/" + workspaceA.getId() + "/generation/lesson-plan")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
