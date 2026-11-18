package com.aiteachercopilot.generation;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
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

    @Test
    @DisplayName("Should update lesson plan content and transition review status from DRAFT to REVIEWED [BE-021]")
    void shouldUpdateLessonContentAndReviewStatusSuccessfully() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent existing = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .title("Giáo án gốc")
                .reviewStatus("DRAFT")
                .contentData(Map.of("topic", "Cũ"))
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(existing));
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .title("Giáo án mới cập nhật")
                .contentData(Map.of("topic", "Mới", "sections", List.of("Phần 1")))
                .reviewStatus("REVIEWED")
                .build();

        GenerationResponseDto response = generationService.updateLessonContent(workspaceId, contentId, userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Giáo án mới cập nhật");
        assertThat(response.getReviewStatus()).isEqualTo("REVIEWED");
        assertThat(response.getContentData()).containsEntry("topic", "Mới");

        verify(generatedContentRepository).save(contentCaptor.capture());
        GeneratedContent saved = contentCaptor.getValue();
        assertThat(saved.getTitle()).isEqualTo("Giáo án mới cập nhật");
        assertThat(saved.getReviewStatus()).isEqualTo("REVIEWED");
        assertThat(saved.getContentData()).containsEntry("topic", "Mới");
    }

    @Test
    @DisplayName("Should update review status to APPROVED [BE-021]")
    void shouldUpdateReviewStatusToApprovedSuccessfully() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent existing = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .reviewStatus("REVIEWED")
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(existing));
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .reviewStatus("APPROVED")
                .build();

        GenerationResponseDto response = generationService.updateLessonContent(workspaceId, contentId, userId, request);

        assertThat(response.getReviewStatus()).isEqualTo("APPROVED");
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when review status is invalid [BE-021]")
    void shouldThrowIllegalArgumentWhenReviewStatusIsInvalid() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .reviewStatus("INVALID_STATUS")
                .build();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid review status");

        verify(generatedContentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when contentData is empty map [BE-021]")
    void shouldThrowIllegalArgumentWhenContentDataIsEmpty() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .contentData(Map.of())
                .build();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("contentData cannot be empty");

        verify(generatedContentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when request has no update fields [BE-021]")
    void shouldThrowIllegalArgumentWhenRequestHasNoFields() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        UpdateLessonContentRequestDto request = new UpdateLessonContentRequestDto();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least one field");
    }

    @Test
    @DisplayName("Should throw ForbiddenException when user does not own content [BE-021]")
    void shouldThrowForbiddenWhenUserDoesNotOwnContent() {
        UUID contentId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(otherUserId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent existing = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(otherUserId)
                .reviewStatus("DRAFT")
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(existing));

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .reviewStatus("REVIEWED")
                .build();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only the workspace owner or content creator");
    }

    @Test
    @DisplayName("Should throw ForbiddenException on cross-workspace update [BE-021]")
    void shouldThrowForbiddenWhenContentBelongsToDifferentWorkspace() {
        UUID contentId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent existing = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .createdBy(userId)
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(existing));

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .reviewStatus("REVIEWED")
                .build();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content modification is forbidden");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when content does not exist [BE-021]")
    void shouldThrowNotFoundWhenContentDoesNotExist() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.empty());

        UpdateLessonContentRequestDto request = UpdateLessonContentRequestDto.builder()
                .reviewStatus("REVIEWED")
                .build();

        assertThatThrownBy(() -> generationService.updateLessonContent(workspaceId, contentId, userId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("GeneratedContent");
    }

    @Test
    @DisplayName("Should retrieve generated content by ID [BE-021]")
    void shouldGetGeneratedContentByIdSuccessfully() {
        UUID contentId = UUID.randomUUID();
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent existing = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .title("Giáo án xem chi tiết")
                .build();
        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(existing));

        GenerationResponseDto response = generationService.getGeneratedContentById(workspaceId, contentId, userId);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Giáo án xem chi tiết");
    }

    @Test
    @DisplayName("Should retrieve workspace generation history [BE-021]")
    void shouldGetWorkspaceGenerationHistorySuccessfully() {
        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        GeneratedContent c1 = GeneratedContent.builder().id(UUID.randomUUID()).workspaceId(workspaceId).title("Bài 1").build();
        GeneratedContent c2 = GeneratedContent.builder().id(UUID.randomUUID()).workspaceId(workspaceId).title("Bài 2").build();
        when(generatedContentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId)).thenReturn(List.of(c1, c2));

        List<GenerationResponseDto> history = generationService.getWorkspaceGenerationHistory(workspaceId, userId);

        assertThat(history).hasSize(2);
        assertThat(history.get(0).getTitle()).isEqualTo("Bài 1");
        assertThat(history.get(1).getTitle()).isEqualTo("Bài 2");
    }

    // ===== [BE-025] Quiz Content Persistence Tests =====

    @Test
    @DisplayName("Should generate quiz, persist as QUIZ draft, and record citations from quiz and question level [BE-025]")
    void shouldGenerateAndPersistQuiz() {
        // Arrange
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Vật lí")
                .gradeLevel("11")
                .topic("Động lực học chất điểm")
                .numQuestions(3)
                .questionTypes(List.of("MCQ", "SHORT_ANSWER"))
                .difficulty("MEDIUM")
                .targetBloomLevel("Apply")
                .instructions("Tập trung vào định luật Newton")
                .documentIds(List.of(documentId))
                .build();

        Workspace workspace = Workspace.builder()
                .id(workspaceId)
                .ownerId(userId)
                .name("Vật lí 11")
                .build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        // Build AI quiz response with quiz-level and per-question source_chunk_ids
        Map<String, Object> question1 = new HashMap<>();
        question1.put("question_number", 1);
        question1.put("type", "MCQ");
        question1.put("question_text", "Theo định luật II Newton, F = ?");
        question1.put("options", List.of("ma", "mv", "mgh", "½mv²"));
        question1.put("correct_answer", "A");
        question1.put("correct_answer_index", 0);
        question1.put("explanation", "Theo định luật II Newton F = ma");
        question1.put("bloom_taxonomy_level", "Remember");
        question1.put("source_chunk_ids", List.of(chunkId1.toString()));

        Map<String, Object> question2 = new HashMap<>();
        question2.put("question_number", 2);
        question2.put("type", "SHORT_ANSWER");
        question2.put("question_text", "Phát biểu định luật III Newton");
        question2.put("correct_answer", "Khi vật A tác dụng lên vật B một lực...");
        question2.put("explanation", "Định luật III Newton về cặp lực tương tác");
        question2.put("bloom_taxonomy_level", "Understand");
        question2.put("source_chunk_ids", List.of(chunkId2.toString()));

        Map<String, Object> aiQuizData = new HashMap<>();
        aiQuizData.put("title", "Kiểm tra Động lực học chất điểm");
        aiQuizData.put("subject", "Vật lí");
        aiQuizData.put("grade_level", "11");
        aiQuizData.put("topic", "Động lực học chất điểm");
        aiQuizData.put("difficulty", "MEDIUM");
        aiQuizData.put("questions", List.of(question1, question2));
        aiQuizData.put("source_chunk_ids", List.of(chunkId1.toString(), chunkId2.toString()));
        aiQuizData.put("insufficient_evidence", false);

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "quiz",
                "data", aiQuizData
        );

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(eq("/generation/quiz"));
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GeneratedContent savedEntity = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("QUIZ")
                .title("Kiểm tra Động lực học chất điểm")
                .subject("Vật lí")
                .gradeLevel("11")
                .topic("Động lực học chất điểm")
                .contentData(aiQuizData)
                .promptInput("Tập trung vào định luật Newton")
                .reviewStatus("DRAFT")
                .version(1)
                .modelUsed("gemini-1.5-flash")
                .generationTimeMs(200)
                .createdAt(Instant.now())
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedEntity);

        DocumentChunk chunk1 = DocumentChunk.builder()
                .id(chunkId1)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(0)
                .content("Nội dung về các định luật Newton...")
                .build();
        DocumentChunk chunk2 = DocumentChunk.builder()
                .id(chunkId2)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(1)
                .content("Định luật III Newton về lực và phản lực...")
                .build();
        when(documentChunkRepository.findAllById(any())).thenReturn(List.of(chunk1, chunk2));

        // Act
        GenerationResponseDto response = generationService.generateQuiz(workspaceId, userId, request);

        // Assert - AC1: Quiz saved successfully
        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("QUIZ");
        assertThat(response.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getTitle()).isEqualTo("Kiểm tra Động lực học chất điểm");

        // Assert - AC2: Questions saved fully (contentData contains questions)
        assertThat(response.getContentData()).isNotNull();
        assertThat(response.getContentData()).containsKey("questions");

        // Assert - AC4: Generation metadata preserved
        verify(generatedContentRepository).save(contentCaptor.capture());
        GeneratedContent captured = contentCaptor.getValue();
        assertThat(captured.getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(captured.getCreatedBy()).isEqualTo(userId);
        assertThat(captured.getContentType()).isEqualTo("QUIZ");
        assertThat(captured.getSubject()).isEqualTo("Vật lí");
        assertThat(captured.getGradeLevel()).isEqualTo("11");
        assertThat(captured.getTopic()).isEqualTo("Động lực học chất điểm");
        assertThat(captured.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(captured.getVersion()).isEqualTo(1);
        assertThat(captured.getModelUsed()).isEqualTo("gemini-1.5-flash");
        assertThat(captured.getGenerationTimeMs()).isNotNull();
        assertThat(captured.getPromptInput()).isEqualTo("Tập trung vào định luật Newton");

        // Verify citation persistence (deduplicated from quiz + question level)
        verify(contentCitationRepository).saveAll(citationsCaptor.capture());
        List<ContentCitation> capturedCitations = citationsCaptor.getValue();
        assertThat(capturedCitations).hasSize(2);
        assertThat(capturedCitations.get(0).getContentId()).isEqualTo(savedEntity.getId());
        assertThat(capturedCitations.get(0).getDocumentId()).isEqualTo(documentId);
    }

    @Test
    @DisplayName("Should throw ForbiddenException when user does not own workspace for quiz generation [BE-025]")
    void shouldThrowForbiddenWhenUserUnauthorizedForQuiz() {
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Toán")
                .gradeLevel("10")
                .topic("Hàm số")
                .numQuestions(5)
                .build();

        doThrow(new ForbiddenException("Access denied to workspace"))
                .when(workspaceService).findAndAuthorize(workspaceId, userId);

        assertThatThrownBy(() -> generationService.generateQuiz(workspaceId, userId, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied");

        verifyNoInteractions(generatedContentRepository);
    }

    @Test
    @DisplayName("Should persist quiz with correct contentType QUIZ and version 1 as DRAFT [BE-025]")
    void shouldPersistQuizWithCorrectMetadata() {
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Hóa học")
                .gradeLevel("12")
                .topic("Phản ứng hóa học")
                .build();

        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).name("Hóa 12").build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        Map<String, Object> aiQuizData = new HashMap<>();
        aiQuizData.put("title", "Kiểm tra Phản ứng hóa học");
        aiQuizData.put("subject", "Hóa học");
        aiQuizData.put("grade_level", "12");
        aiQuizData.put("topic", "Phản ứng hóa học");
        aiQuizData.put("difficulty", "EASY");
        aiQuizData.put("questions", List.of());

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "quiz",
                "data", aiQuizData
        );

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(eq("/generation/quiz"));
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GeneratedContent savedEntity = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("QUIZ")
                .title("Kiểm tra Phản ứng hóa học")
                .subject("Hóa học")
                .gradeLevel("12")
                .topic("Phản ứng hóa học")
                .contentData(aiQuizData)
                .promptInput("Phản ứng hóa học")
                .reviewStatus("DRAFT")
                .version(1)
                .createdAt(Instant.now())
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedEntity);

        GenerationResponseDto response = generationService.generateQuiz(workspaceId, userId, request);

        assertThat(response.getContentType()).isEqualTo("QUIZ");
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getReviewStatus()).isEqualTo("DRAFT");

        verify(generatedContentRepository).save(contentCaptor.capture());
        GeneratedContent captured = contentCaptor.getValue();
        assertThat(captured.getContentType()).isEqualTo("QUIZ");
        assertThat(captured.getSubject()).isEqualTo("Hóa học");
        assertThat(captured.getGradeLevel()).isEqualTo("12");
        assertThat(captured.getTopic()).isEqualTo("Phản ứng hóa học");
        assertThat(captured.getPromptInput()).isEqualTo("Phản ứng hóa học");
    }

    @Test
    @DisplayName("Should persist quiz without citations when no source_chunk_ids present [BE-025]")
    void shouldPersistQuizWithoutCitationsWhenNoChunkIds() {
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Sinh học")
                .gradeLevel("10")
                .topic("Tế bào")
                .build();

        Workspace workspace = Workspace.builder().id(workspaceId).ownerId(userId).name("Sinh 10").build();
        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(workspace);

        Map<String, Object> aiQuizData = new HashMap<>();
        aiQuizData.put("title", "Kiểm tra Tế bào");
        aiQuizData.put("questions", List.of());

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "quiz",
                "data", aiQuizData
        );

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(eq("/generation/quiz"));
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GeneratedContent savedEntity = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("QUIZ")
                .title("Kiểm tra Tế bào")
                .contentData(aiQuizData)
                .reviewStatus("DRAFT")
                .version(1)
                .createdAt(Instant.now())
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedEntity);

        GenerationResponseDto response = generationService.generateQuiz(workspaceId, userId, request);

        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("QUIZ");
        verify(generatedContentRepository).save(any(GeneratedContent.class));
        verifyNoInteractions(documentChunkRepository);
        verify(contentCitationRepository, never()).saveAll(any());
    }

    // =========================================================================
    // [BE-027] Content Regeneration API with Version Lineage Unit Tests
    // =========================================================================

    @Test
    @DisplayName("regenerateContent creates version 2 with parentId pointing to root [BE-027]")
    void shouldRegenerateContentCreatingVersion2WithRootParentId() {
        UUID rootId = UUID.randomUUID();
        GeneratedContent v1 = GeneratedContent.builder()
                .id(rootId)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("QUIZ")
                .title("Đề kiểm tra Đại số 10")
                .subject("Toán")
                .gradeLevel("10")
                .topic("Hàm số")
                .contentData(Map.of("topic", "Hàm số"))
                .promptInput("Soạn đề 10 câu")
                .reviewStatus("REVIEWED")
                .version(1)
                .parentId(null)
                .build();

        when(generatedContentRepository.findById(rootId)).thenReturn(Optional.of(v1));
        when(generatedContentRepository.findByParentIdOrderByVersionAsc(rootId)).thenReturn(List.of());

        GeneratedContent savedV2 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("QUIZ")
                .title(v1.getTitle())
                .subject(v1.getSubject())
                .gradeLevel(v1.getGradeLevel())
                .topic(v1.getTopic())
                .contentData(v1.getContentData())
                .promptInput(v1.getPromptInput() + "\n[Refinement]: Thêm câu hỏi thực tiễn")
                .reviewStatus("DRAFT")
                .version(2)
                .parentId(rootId)
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedV2);

        GenerationResponseDto result = generationService.regenerateContent(
                workspaceId, rootId, userId, "Thêm câu hỏi thực tiễn");

        assertThat(result).isNotNull();
        assertThat(result.getVersion()).isEqualTo(2);
        assertThat(result.getParentId()).isEqualTo(rootId);
        assertThat(result.getReviewStatus()).isEqualTo("DRAFT");

        ArgumentCaptor<GeneratedContent> captor = ArgumentCaptor.forClass(GeneratedContent.class);
        verify(generatedContentRepository).save(captor.capture());
        GeneratedContent captured = captor.getValue();
        assertThat(captured.getVersion()).isEqualTo(2);
        assertThat(captured.getParentId()).isEqualTo(rootId);
        assertThat(captured.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(captured.getPromptInput()).contains("[Refinement]: Thêm câu hỏi thực tiễn");
    }

    @Test
    @DisplayName("regenerateContent from child version creates version 3 with root parentId [BE-027]")
    void shouldRegenerateFromChildVersionCreatingVersion3WithSameRootParent() {
        UUID rootId = UUID.randomUUID();
        UUID v2Id = UUID.randomUUID();

        GeneratedContent v1 = GeneratedContent.builder()
                .id(rootId)
                .workspaceId(workspaceId)
                .version(1)
                .parentId(null)
                .build();

        GeneratedContent v2 = GeneratedContent.builder()
                .id(v2Id)
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("LESSON_PLAN")
                .title("Giáo án Lịch sử 11")
                .subject("Lịch sử")
                .gradeLevel("11")
                .topic("Cách mạng tháng Mười")
                .contentData(Map.of("topic", "Cách mạng"))
                .promptInput("Bản gốc\n[Refinement]: Bổ sung tư liệu")
                .reviewStatus("APPROVED")
                .version(2)
                .parentId(rootId)
                .build();

        when(generatedContentRepository.findById(v2Id)).thenReturn(Optional.of(v2));
        when(generatedContentRepository.findById(rootId)).thenReturn(Optional.of(v1));
        when(generatedContentRepository.findByParentIdOrderByVersionAsc(rootId)).thenReturn(List.of(v2));

        GeneratedContent savedV3 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .version(3)
                .parentId(rootId)
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedV3);

        GenerationResponseDto result = generationService.regenerateContent(
                workspaceId, v2Id, userId, "Tăng cường hoạt động thảo luận nhóm");

        assertThat(result).isNotNull();
        assertThat(result.getVersion()).isEqualTo(3);
        assertThat(result.getParentId()).isEqualTo(rootId);

        ArgumentCaptor<GeneratedContent> captor = ArgumentCaptor.forClass(GeneratedContent.class);
        verify(generatedContentRepository).save(captor.capture());
        GeneratedContent captured = captor.getValue();
        assertThat(captured.getVersion()).isEqualTo(3);
        assertThat(captured.getParentId()).isEqualTo(rootId);
        assertThat(captured.getPromptInput()).contains("[Refinement]: Tăng cường hoạt động thảo luận nhóm");
    }

    @Test
    @DisplayName("regenerateContent from v1 when v2 exists creates version 3 without version collision [BE-027]")
    void shouldRegenerateFromV1WhenV2ExistsCreatingVersion3WithoutCollision() {
        UUID rootId = UUID.randomUUID();
        GeneratedContent v1 = GeneratedContent.builder()
                .id(rootId)
                .workspaceId(workspaceId)
                .version(1)
                .parentId(null)
                .build();

        GeneratedContent existingV2 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .version(2)
                .parentId(rootId)
                .build();

        when(generatedContentRepository.findById(rootId)).thenReturn(Optional.of(v1));
        when(generatedContentRepository.findByParentIdOrderByVersionAsc(rootId)).thenReturn(List.of(existingV2));

        when(generatedContentRepository.save(any(GeneratedContent.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        GenerationResponseDto result = generationService.regenerateContent(
                workspaceId, rootId, userId, "Nhánh mới từ bản gốc v1");

        assertThat(result.getVersion()).isEqualTo(3);
        assertThat(result.getParentId()).isEqualTo(rootId);
    }

    @Test
    @DisplayName("regenerateContent rejects cross-workspace attempt with ForbiddenException [BE-027]")
    void shouldThrowForbiddenWhenRegeneratingCrossWorkspace() {
        UUID contentId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();

        GeneratedContent contentInOtherWorkspace = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .version(1)
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(contentInOtherWorkspace));

        assertThatThrownBy(() -> generationService.regenerateContent(workspaceId, contentId, userId, "Thử hack"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content regeneration is forbidden");

        verify(generatedContentRepository, never()).save(any());
    }

    @Test
    @DisplayName("regenerateContent throws ResourceNotFoundException when content does not exist [BE-027]")
    void shouldThrowResourceNotFoundWhenRegeneratingNonExistentContent() {
        UUID nonExistentId = UUID.randomUUID();
        when(generatedContentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> generationService.regenerateContent(workspaceId, nonExistentId, userId, "Instruction"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(generatedContentRepository, never()).save(any());
    }

    @Test
    @DisplayName("getContentVersions returns complete sorted version lineage [BE-027]")
    void shouldGetContentVersionsReturningAllVersionsSorted() {
        UUID rootId = UUID.randomUUID();
        GeneratedContent v1 = GeneratedContent.builder()
                .id(rootId)
                .workspaceId(workspaceId)
                .title("Bản gốc")
                .version(1)
                .parentId(null)
                .build();

        GeneratedContent v2 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .title("Bản v2")
                .version(2)
                .parentId(rootId)
                .build();

        GeneratedContent v3 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .title("Bản v3")
                .version(3)
                .parentId(rootId)
                .build();

        when(generatedContentRepository.findById(v2.getId())).thenReturn(Optional.of(v2));
        when(generatedContentRepository.findById(rootId)).thenReturn(Optional.of(v1));
        when(generatedContentRepository.findByParentIdOrderByVersionAsc(rootId)).thenReturn(List.of(v2, v3));

        List<GenerationResponseDto> versions = generationService.getContentVersions(workspaceId, v2.getId(), userId);

        assertThat(versions).hasSize(3);
        assertThat(versions.get(0).getVersion()).isEqualTo(1);
        assertThat(versions.get(1).getVersion()).isEqualTo(2);
        assertThat(versions.get(2).getVersion()).isEqualTo(3);
    }

    @Test
    @DisplayName("getContentVersions rejects cross-workspace access with ForbiddenException [BE-027]")
    void shouldThrowForbiddenWhenGettingVersionsCrossWorkspace() {
        UUID contentId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();

        GeneratedContent target = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> generationService.getContentVersions(workspaceId, contentId, userId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content access is forbidden");
    }

    @Test
    @DisplayName("getWorkspaceGenerationHistory filters by contentType when provided [BE-028]")
    void shouldGetWorkspaceGenerationHistoryFilteredByContentType() {
        GeneratedContent quizItem = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .contentType("QUIZ")
                .title("Đề kiểm tra 15p")
                .version(1)
                .build();

        when(generatedContentRepository.findByWorkspaceIdAndContentTypeOrderByCreatedAtDesc(workspaceId, "QUIZ"))
                .thenReturn(List.of(quizItem));

        List<GenerationResponseDto> history = generationService.getWorkspaceGenerationHistory(workspaceId, userId, "QUIZ");

        assertThat(history).hasSize(1);
        assertThat(history.get(0).getContentType()).isEqualTo("QUIZ");
        assertThat(history.get(0).getTitle()).isEqualTo("Đề kiểm tra 15p");
        verify(generatedContentRepository).findByWorkspaceIdAndContentTypeOrderByCreatedAtDesc(workspaceId, "QUIZ");
    }

    @Test
    @DisplayName("getWorkspaceGenerationHistory returns all items when contentType is null or blank [BE-028]")
    void shouldGetWorkspaceGenerationHistoryAllWhenContentTypeNullOrBlank() {
        GeneratedContent item1 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .contentType("LESSON_PLAN")
                .title("Giáo án 1")
                .build();
        GeneratedContent item2 = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .contentType("QUIZ")
                .title("Bài kiểm tra 1")
                .build();

        when(generatedContentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId))
                .thenReturn(List.of(item1, item2));

        List<GenerationResponseDto> resultNull = generationService.getWorkspaceGenerationHistory(workspaceId, userId, null);
        List<GenerationResponseDto> resultBlank = generationService.getWorkspaceGenerationHistory(workspaceId, userId, "   ");

        assertThat(resultNull).hasSize(2);
        assertThat(resultBlank).hasSize(2);
        verify(generatedContentRepository, times(2)).findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
    }

    @Test
    @DisplayName("getVersionTree returns structured tree with root, current, latest, and ordered versions [BE-028]")
    void shouldGetVersionTreeWithCompleteHierarchyAndMetadata() {
        UUID rootId = UUID.randomUUID();
        UUID v2Id = UUID.randomUUID();
        UUID v3Id = UUID.randomUUID();

        GeneratedContent v1 = GeneratedContent.builder()
                .id(rootId)
                .workspaceId(workspaceId)
                .title("Bản gốc")
                .version(1)
                .parentId(null)
                .build();

        GeneratedContent v2 = GeneratedContent.builder()
                .id(v2Id)
                .workspaceId(workspaceId)
                .title("Bản v2")
                .version(2)
                .parentId(rootId)
                .build();

        GeneratedContent v3 = GeneratedContent.builder()
                .id(v3Id)
                .workspaceId(workspaceId)
                .title("Bản v3")
                .version(3)
                .parentId(rootId)
                .build();

        when(generatedContentRepository.findById(v2Id)).thenReturn(Optional.of(v2));
        when(generatedContentRepository.findById(rootId)).thenReturn(Optional.of(v1));
        when(generatedContentRepository.findByParentIdOrderByVersionAsc(rootId)).thenReturn(List.of(v2, v3));

        VersionTreeDto tree = generationService.getVersionTree(workspaceId, v2Id, userId);

        assertThat(tree).isNotNull();
        assertThat(tree.getRootId()).isEqualTo(rootId);
        assertThat(tree.getCurrentId()).isEqualTo(v2Id);
        assertThat(tree.getCurrentVersion()).isEqualTo(2);
        assertThat(tree.getLatestVersion()).isEqualTo(3);
        assertThat(tree.getTotalVersions()).isEqualTo(3);
        assertThat(tree.getVersions()).hasSize(3);
        assertThat(tree.getVersions().get(0).getVersion()).isEqualTo(1);
        assertThat(tree.getVersions().get(1).getVersion()).isEqualTo(2);
        assertThat(tree.getVersions().get(2).getVersion()).isEqualTo(3);
    }

    @Test
    @DisplayName("getVersionTree rejects cross-workspace access with ForbiddenException [BE-028]")
    void shouldThrowForbiddenWhenGettingVersionTreeCrossWorkspace() {
        UUID contentId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();

        GeneratedContent target = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(target));

        assertThatThrownBy(() -> generationService.getVersionTree(workspaceId, contentId, userId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content access is forbidden");
    }

    @Test
    @DisplayName("getGeneratedContentById directly retrieves content and authorizes workspace [BE-028]")
    void shouldGetGeneratedContentByIdDirectly() {
        UUID contentId = UUID.randomUUID();
        GeneratedContent content = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .title("Nội dung tra cứu")
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));

        GenerationResponseDto result = generationService.getGeneratedContentById(contentId, userId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(contentId);
        assertThat(result.getTitle()).isEqualTo("Nội dung tra cứu");
        verify(workspaceService).findAndAuthorize(workspaceId, userId);
    }

    @Test
    @DisplayName("deleteGeneratedContent removes content and related citations [BE-028]")
    void shouldDeleteGeneratedContentWithCitations() {
        UUID contentId = UUID.randomUUID();
        GeneratedContent content = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(workspaceId)
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));

        generationService.deleteGeneratedContent(workspaceId, contentId, userId);

        verify(contentCitationRepository).deleteByContentId(contentId);
        verify(generatedContentRepository).delete(content);
    }

    @Test
    @DisplayName("deleteGeneratedContent throws ForbiddenException on cross-workspace deletion [BE-028]")
    void shouldThrowForbiddenWhenDeletingCrossWorkspace() {
        UUID contentId = UUID.randomUUID();
        UUID otherWorkspaceId = UUID.randomUUID();
        GeneratedContent content = GeneratedContent.builder()
                .id(contentId)
                .workspaceId(otherWorkspaceId)
                .build();

        when(generatedContentRepository.findById(contentId)).thenReturn(Optional.of(content));

        assertThatThrownBy(() -> generationService.deleteGeneratedContent(workspaceId, contentId, userId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Cross-workspace content deletion is forbidden");

        verify(generatedContentRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should successfully generate rubric, persist draft with content_type='RUBRIC', and save citations [BE-029]")
    void shouldGenerateAndPersistRubricSuccessfully() {
        // Arrange
        GenerationRequestDto request = GenerationRequestDto.builder()
                .subject("Hóa học")
                .gradeLevel("10")
                .topic("Bảng tuần hoàn các nguyên tố hóa học")
                .objectives(List.of("Nắm quy luật biến đổi tuần hoàn", "Giải thích bán kính nguyên tử"))
                .instructions("Ma trận đánh giá bài tập nhóm")
                .numCriteria(3)
                .scaleType("PERCENTAGE")
                .build();

        when(workspaceService.findAndAuthorize(workspaceId, userId)).thenReturn(mock(Workspace.class));

        Map<String, Object> aiRubricData = new HashMap<>();
        aiRubricData.put("title", "Ma trận Rubric Đánh giá Bảng tuần hoàn");
        aiRubricData.put("subject", "Hóa học");
        aiRubricData.put("grade_level", "10");
        aiRubricData.put("topic", "Bảng tuần hoàn các nguyên tố hóa học");
        aiRubricData.put("scale_type", "PERCENTAGE");
        aiRubricData.put("levels", List.of(
                Map.of("id", "L4", "name", "Xuất sắc", "points", 4.0),
                Map.of("id", "L3", "name", "Tốt", "points", 3.0),
                Map.of("id", "L2", "name", "Đạt", "points", 2.0),
                Map.of("id", "L1", "name", "Cần cố gắng", "points", 1.0)
        ));
        aiRubricData.put("criteria", List.of(
                Map.of("id", "crit-1", "name", "Cấu hình electron", "weight", 30, "descriptors", Map.of("L4", "Rất tốt")),
                Map.of("id", "crit-2", "name", "Quy luật tuần hoàn", "weight", 40, "descriptors", Map.of("L4", "Rất tốt")),
                Map.of("id", "crit-3", "name", "Vận dụng thực tế", "weight", 30, "descriptors", Map.of("L4", "Rất tốt"))
        ));
        aiRubricData.put("curriculum_alignment", "YCCĐ GDPT 2018 môn Hóa học");
        aiRubricData.put("source_chunk_ids", List.of(chunkId1.toString(), chunkId2.toString()));

        Map<String, Object> aiResponse = Map.of(
                "status", "success",
                "content_type", "rubric",
                "data", aiRubricData
        );

        doReturn(requestBodyUriSpec).when(aiServiceWebClient).post();
        doReturn(requestBodySpec).when(requestBodyUriSpec).uri(eq("/generation/rubric"));
        doReturn(requestHeadersSpec).when(requestBodySpec).bodyValue(any());
        doReturn(responseSpec).when(requestHeadersSpec).retrieve();
        doReturn(Mono.just(aiResponse)).when(responseSpec).bodyToMono(any(ParameterizedTypeReference.class));

        GeneratedContent savedEntity = GeneratedContent.builder()
                .id(UUID.randomUUID())
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("RUBRIC")
                .title("Ma trận Rubric Đánh giá Bảng tuần hoàn")
                .subject("Hóa học")
                .gradeLevel("10")
                .topic("Bảng tuần hoàn các nguyên tố hóa học")
                .contentData(aiRubricData)
                .promptInput("Ma trận đánh giá bài tập nhóm")
                .reviewStatus("DRAFT")
                .version(1)
                .modelUsed("gemini-1.5-flash")
                .generationTimeMs(150)
                .createdAt(Instant.now())
                .build();
        when(generatedContentRepository.save(any(GeneratedContent.class))).thenReturn(savedEntity);

        DocumentChunk chunk1 = DocumentChunk.builder()
                .id(chunkId1)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(0)
                .content("Bảng tuần hoàn các nguyên tố...")
                .build();
        DocumentChunk chunk2 = DocumentChunk.builder()
                .id(chunkId2)
                .documentId(documentId)
                .workspaceId(workspaceId)
                .chunkIndex(1)
                .content("Quy luật biến đổi tính kim loại...")
                .build();
        when(documentChunkRepository.findAllById(any())).thenReturn(List.of(chunk1, chunk2));

        // Act
        GenerationResponseDto response = generationService.generateRubric(workspaceId, userId, request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("RUBRIC");
        assertThat(response.getReviewStatus()).isEqualTo("DRAFT");
        assertThat(response.getVersion()).isEqualTo(1);
        assertThat(response.getTitle()).isEqualTo("Ma trận Rubric Đánh giá Bảng tuần hoàn");
        assertThat(response.getContentData()).containsKey("criteria");
        assertThat(response.getContentData()).containsKey("levels");

        verify(generatedContentRepository).save(contentCaptor.capture());
        GeneratedContent captured = contentCaptor.getValue();
        assertThat(captured.getContentType()).isEqualTo("RUBRIC");
        assertThat(captured.getWorkspaceId()).isEqualTo(workspaceId);
        assertThat(captured.getCreatedBy()).isEqualTo(userId);

        verify(contentCitationRepository).saveAll(citationsCaptor.capture());
        List<ContentCitation> capturedCitations = citationsCaptor.getValue();
        assertThat(capturedCitations).hasSize(2);
    }
}
