package com.aiteachercopilot.generation;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.workspace.Workspace;
import com.aiteachercopilot.workspace.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Service orchestrating AI Generation requests with FastAPI and persisting
 * structured results and provenance citations into PostgreSQL (BE-019).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GenerationService {

    private final WorkspaceService workspaceService;
    private final WebClient aiServiceWebClient;
    private final GeneratedContentRepository generatedContentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ContentCitationRepository contentCitationRepository;

    /**
     * Generates a curriculum-grounded structured lesson plan via FastAPI,
     * persists the draft in generated_contents, and records citation links (BE-019).
     */
    @Transactional
    public GenerationResponseDto generateLessonPlan(UUID workspaceId, UUID userId, GenerationRequestDto req) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("workspace_id", workspaceId.toString());
        aiRequest.put("subject", req.getSubject());
        aiRequest.put("grade_level", req.getGradeLevel());
        aiRequest.put("topic", req.getTopic());
        if (req.getObjectives() != null && !req.getObjectives().isEmpty()) {
            aiRequest.put("objectives", req.getObjectives());
        }
        if (req.getDurationMinutes() != null) {
            aiRequest.put("duration_minutes", req.getDurationMinutes());
        }
        if (req.getInstructions() != null && !req.getInstructions().isBlank()) {
            aiRequest.put("instructions", req.getInstructions());
        }
        if (req.getDocumentIds() != null && !req.getDocumentIds().isEmpty()) {
            aiRequest.put("document_ids", req.getDocumentIds().stream().map(UUID::toString).toList());
        }

        long startTime = System.currentTimeMillis();
        Map<String, Object> responseBody;

        try {
            responseBody = aiServiceWebClient.post()
                    .uri("/generation/lesson-plan")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException e) {
            log.error("AI Service returned error status {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect to AI Service: {}", e.getMessage(), e);
            throw e;
        }

        long durationMs = System.currentTimeMillis() - startTime;

        @SuppressWarnings("unchecked")
        Map<String, Object> contentData = (responseBody != null && responseBody.get("data") instanceof Map)
                ? (Map<String, Object>) responseBody.get("data")
                : (responseBody != null ? responseBody : Collections.emptyMap());

        String title = (contentData.get("title") != null && !contentData.get("title").toString().isBlank())
                ? contentData.get("title").toString()
                : req.getTopic();

        GeneratedContent generatedContent = GeneratedContent.builder()
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType("LESSON_PLAN")
                .title(title)
                .subject(req.getSubject())
                .gradeLevel(req.getGradeLevel())
                .topic(req.getTopic())
                .contentData(contentData)
                .promptInput(req.getInstructions() != null && !req.getInstructions().isBlank()
                        ? req.getInstructions()
                        : req.getTopic())
                .reviewStatus("DRAFT")
                .version(1)
                .modelUsed("gemini-1.5-flash")
                .generationTimeMs((int) durationMs)
                .build();

        GeneratedContent savedContent = generatedContentRepository.save(generatedContent);
        log.info("Persisted generated lesson plan {} for workspace {}", savedContent.getId(), workspaceId);

        // Record citations if source_chunk_ids are present
        persistCitations(savedContent.getId(), contentData);

        return GenerationResponseDto.fromEntity(savedContent);
    }

    private void persistCitations(UUID contentId, Map<String, Object> contentData) {
        if (contentData == null || !contentData.containsKey("source_chunk_ids")) {
            return;
        }

        Object rawChunkIdsObj = contentData.get("source_chunk_ids");
        if (!(rawChunkIdsObj instanceof List<?> rawChunkIds) || rawChunkIds.isEmpty()) {
            return;
        }

        List<UUID> chunkUuids = rawChunkIds.stream()
                .map(item -> {
                    try {
                        return UUID.fromString(item.toString());
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();

        if (chunkUuids.isEmpty()) {
            return;
        }

        List<DocumentChunk> chunks = documentChunkRepository.findAllById(chunkUuids);
        if (chunks.isEmpty()) {
            log.debug("No matching document_chunks found in DB for chunk IDs {}", chunkUuids);
            return;
        }

        List<ContentCitation> citations = new ArrayList<>();
        for (DocumentChunk chunk : chunks) {
            String excerpt = chunk.getContent();
            if (excerpt != null && excerpt.length() > 200) {
                excerpt = excerpt.substring(0, 200);
            }

            ContentCitation citation = ContentCitation.builder()
                    .contentId(contentId)
                    .chunkId(chunk.getId())
                    .documentId(chunk.getDocumentId())
                    .citationText(excerpt)
                    .build();
            citations.add(citation);
        }

        contentCitationRepository.saveAll(citations);
        log.info("Persisted {} content citations for generated content {}", citations.size(), contentId);
    }

    public Object generateQuiz(UUID workspaceId, UUID userId, GenerationRequestDto req) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        return aiServiceWebClient.post()
                .uri(builder -> builder.path("/generation/quiz")
                        .queryParam("workspace_id", workspaceId)
                        .queryParam("subject", req.getSubject())
                        .queryParam("grade_level", req.getGradeLevel())
                        .queryParam("topic", req.getTopic())
                        .queryParam("instructions", req.getInstructions())
                        .queryParam("num_questions", req.getNumQuestions())
                        .build())
                .retrieve()
                .bodyToMono(Object.class)
                .block();
    }

    /**
     * Updates lesson plan content, review status, and/or title directly without invoking LLM (BE-021).
     * Enforces teacher authority and workspace ownership.
     */
    @Transactional
    public GenerationResponseDto updateLessonContent(UUID workspaceId, UUID contentId, UUID userId, UpdateLessonContentRequestDto req) {
        Workspace workspace = workspaceService.findAndAuthorize(workspaceId, userId);

        if (req == null) {
            throw new IllegalArgumentException("Update request cannot be null");
        }

        boolean hasContentData = req.getContentData() != null;
        boolean hasReviewStatus = req.getReviewStatus() != null && !req.getReviewStatus().isBlank();
        boolean hasTitle = req.getTitle() != null && !req.getTitle().isBlank();

        if (!hasContentData && !hasReviewStatus && !hasTitle) {
            throw new IllegalArgumentException("Update request must specify at least one field to update (contentData, reviewStatus, title)");
        }

        if (hasContentData && req.getContentData().isEmpty()) {
            throw new IllegalArgumentException("contentData cannot be empty");
        }

        if (hasReviewStatus && !ReviewStatus.isValid(req.getReviewStatus())) {
            throw new IllegalArgumentException("Invalid review status: " + req.getReviewStatus() + ". Allowed values: DRAFT, REVIEWED, APPROVED");
        }

        GeneratedContent content = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        if (!workspaceId.equals(content.getWorkspaceId())) {
            log.warn("Cross-workspace update attempted: content {} belongs to workspace {}, requested for workspace {}",
                    contentId, content.getWorkspaceId(), workspaceId);
            throw new ForbiddenException("Cross-workspace content modification is forbidden");
        }

        if (content.getCreatedBy() != null && !content.getCreatedBy().equals(userId) && !workspace.getOwnerId().equals(userId)) {
            log.warn("Unauthorized content edit attempted: content {} created by {}, requested by {}",
                    contentId, content.getCreatedBy(), userId);
            throw new ForbiddenException("Only the workspace owner or content creator can modify this lesson plan");
        }

        if (hasContentData) {
            content.setContentData(req.getContentData());
        }
        if (hasReviewStatus) {
            content.setReviewStatus(req.getReviewStatus().trim().toUpperCase());
        }
        if (hasTitle) {
            content.setTitle(req.getTitle().trim());
        }

        content = generatedContentRepository.save(content);
        log.info("Updated generated content {} (reviewStatus={}) in workspace {} by user {}",
                contentId, content.getReviewStatus(), workspaceId, userId);

        return GenerationResponseDto.fromEntity(content);
    }

    /**
     * Retrieves a generated content record by ID, ensuring workspace isolation.
     */
    @Transactional(readOnly = true)
    public GenerationResponseDto getGeneratedContentById(UUID workspaceId, UUID contentId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        GeneratedContent content = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        if (!workspaceId.equals(content.getWorkspaceId())) {
            throw new ForbiddenException("Cross-workspace content access is forbidden");
        }

        return GenerationResponseDto.fromEntity(content);
    }

    /**
     * Lists generation history for a workspace, ordered by newest first.
     */
    @Transactional(readOnly = true)
    public List<GenerationResponseDto> getWorkspaceGenerationHistory(UUID workspaceId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        List<GeneratedContent> list = generatedContentRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        return list.stream().map(GenerationResponseDto::fromEntity).toList();
    }
}
