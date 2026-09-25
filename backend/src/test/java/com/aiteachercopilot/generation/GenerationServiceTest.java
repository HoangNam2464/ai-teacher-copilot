package com.aiteachercopilot.generation;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"rawtypes", "unchecked"})
public class GenerationServiceTest {

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private WebClient aiServiceWebClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @Mock
    private GeneratedContentRepository generatedContentRepository;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private ContentCitationRepository contentCitationRepository;

    @Captor
    private ArgumentCaptor<GeneratedContent> contentCaptor;

    @Captor
    private ArgumentCaptor<List<ContentCitation>> citationsCaptor;

    private GenerationService generationService;

    private final UUID workspaceId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID chunkId1 = UUID.randomUUID();
    private final UUID chunkId2 = UUID.randomUUID();
    private final UUID documentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        generationService = new GenerationService(
                workspaceService,
                aiServiceWebClient,
                generatedContentRepository,
                documentChunkRepository,
                contentCitationRepository
        );
    }

    @Test
    @DisplayName("Should successfully generate lesson plan, persist draft, record metadata and citations [BE-019]")
    void shouldGenerateAndPersistLessonPlan() {
        // Arrange
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Toán")
                .gradeLevel("10")
                .topic("Hàm số bậc hai")
                .objectives(List.of("Hiểu định nghĩa hàm số bậc hai", "Vẽ đồ thị parabol"))
                .durationMinutes(45)
                .instructions("Nhấn mạnh ứng dụng thực tế")
                .documentIds(List.of(documentId))
                .build();

        Workspace workspace = Workspace.builder()
                .id(workspaceId)
                .ownerId(userId)
                .name("Toán 10")
                .build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        Map<String, Object> aiPlanData = new HashMap<>();
        aiPlanData.put("title", "Giáo án: Hàm số bậc hai và ứng dụng");
        aiPlanData.put("subject", "Toán");
        aiPlanData.put("grade_level", "10");
        aiPlanData.put("duration_minutes", 45);
        aiPlanData.put("objectives", List.of("Hiểu định nghĩa hàm số bậc hai", "Vẽ đồ thị parabol"));
        aiPlanData.put("sections", List.of(
                Map.of("title", "Khởi động", "duration_minutes", 5, "content", "Quan sát chuyển động parabol"),
                Map.of("title", "Khám phá", "duration_minutes", 20, "content", "Định nghĩa và tính chất")
        ));
        aiPlanData.put("materials_needed", List.of("Máy chiếu", "SGK Toán 10"));
        aiPlanData.put("source_chunk_ids", List.of(chunkId1.toString(), chunkId2.toString()));
        aiPlanData.put("insufficient_evidence", false);

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "lesson_plan",
                "data", aiPlanData
        );

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(eq("/generation/lesson-plan"));
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GeneratedContent savedEntity = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("LESSON_PLAN")
                .title("Giáo án: Hàm số bậc hai và ứng dụng")
                .subject("Toán")
                .gradeLevel("10")
                .topic("Hàm số bậc hai")
                .contentData(aiPlanData)
                .promptInput("Nhấn mạnh ứng dụng thực tế")
                .reviewStatus("DRAFT")
                .version(1)
                .modelUsed("gemini-1.5-flash")
                .generationTimeMs(120)
                .createdAt(Instant.now())
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedEntity);

        DocumentChunk chunk1 = DocumentChunk.builder()
                .id(chunkId1)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(0)
                .content("Nội dung bài học hàm số bậc hai trong SGK...")
                .build();
        DocumentChunk chunk2 = DocumentChunk.builder()
                .id(chunkId2)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(1)
                .content("Công thức tọa độ đỉnh parabol...")
                .build();
        when(documentChunkRepository.findAllById(any())).thenReturn(List.of(chunk1, chunk2));

        // Act
        GenerationResponseDto response = generationService.generateLessonPlan(workspaceId, userId, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("LESSON_PLAN");
        assertThat(response.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getTitle()).isEqualTo("Giáo án: Hàm số bậc hai và ứng dụng");
        assertThat(response.getContentData()).isNotNull();

        // Verify entity persistence
        verify(generatedContentRepository).save(contentCaptor.capture());
        GeneratedContent captured = contentCaptor.getValue();
        assertThat(captured.getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(captured.getCreatedBy()).isEqualTo(userId);
        assertThat(captured.getContentType()).isEqualTo("LESSON_PLAN");
        assertThat(captured.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(captured.getVersion()).isEqualTo(1);
        assertThat(captured.getModelUsed()).isEqualTo("gemini-1.5-flash");
        assertThat(captured.getGenerationTimeMs()).isNotNull();

        // Verify citation persistence
        verify(contentCitationRepository).saveAll(citationsCaptor.capture());
        List<ContentCitation> capturedCitations = citationsCaptor.getValue();
        assertThat(capturedCitations).hasSize(2);
        assertThat(capturedCitations.get(0).getContentId()).isEqualTo(savedEntity.getId());
        assertThat(capturedCitations.get(0).getDocumentId()).isEqualTo(documentId);
    }

    @Test
    @DisplayName("Should throw ForbiddenException when user does not own workspace")
    void shouldThrowForbiddenWhenUserUnauthorized() {
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Toán")
                .gradeLevel("10")
                .topic("Hàm số")
                .build();

        doThrow(new ForbiddenException("Access denied to workspace"))
                .when(workspaceService).findAndAuthorize(workspaceId, userId);

        assertThatThrownBy(() -> generationService.generateLessonPlan(workspaceId, userId, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied");

        verifyNoInteractions(aiServiceWebClient);
        verifyNoInteractions(generatedContentRepository);
    }
}
