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
}
