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

    /**
     * Generates a curriculum-grounded structured quiz via FastAPI,
     * persists the draft in generated_contents, and records citation links (BE-025).
     */
    @Transactional
    public GenerationResponseDto generateQuiz(UUID workspaceId, UUID userId, GenerationRequestDto req) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("workspace_id", workspaceId.toString());
        aiRequest.put("subject", req.getSubject());
        aiRequest.put("grade_level", req.getGradeLevel());
        aiRequest.put("topic", req.getTopic());
        if (req.getNumQuestions() != null) {
            aiRequest.put("num_questions", req.getNumQuestions());
        }
        if (req.getQuestionTypes() != null && !req.getQuestionTypes().isEmpty()) {
            aiRequest.put("question_types", req.getQuestionTypes());
        }
        if (req.getDifficulty() != null && !req.getDifficulty().isBlank()) {
            aiRequest.put("difficulty", req.getDifficulty());
        }
        if (req.getTargetBloomLevel() != null && !req.getTargetBloomLevel().isBlank()) {
            aiRequest.put("target_bloom_level", req.getTargetBloomLevel());
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
                    .uri("/generation/quiz")
                    .bodyValue(aiRequest)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException e) {
            log.error("AI Service returned error status {} for quiz generation: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect to AI Service for quiz generation: {}", e.getMessage(), e);
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
                .contentType("QUIZ")
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
        log.info("Persisted generated quiz {} for workspace {}", savedContent.getId(), workspaceId);

        // Record citations from quiz-level and question-level source_chunk_ids
        persistQuizCitations(savedContent.getId(), contentData);

        return GenerationResponseDto.fromEntity(savedContent);
    }

    /**
     * Persists citations from quiz content data, aggregating both quiz-level
     * and per-question source_chunk_ids for complete citation traceability (BE-025).
     */
    private void persistQuizCitations(UUID contentId, Map<String, Object> contentData) {
        if (contentData == null) {
            return;
        }

        List<String> allChunkIdStrings = new ArrayList<>();

        // Collect quiz-level source_chunk_ids
        if (contentData.get("source_chunk_ids") instanceof List<?> quizLevelIds) {
            for (Object item : quizLevelIds) {
                if (item != null) {
                    allChunkIdStrings.add(item.toString());
                }
            }
        }

        // Collect per-question source_chunk_ids
        if (contentData.get("questions") instanceof List<?> questions) {
            for (Object qObj : questions) {
                if (qObj instanceof Map<?, ?> question) {
                    Object qChunkIds = question.get("source_chunk_ids");
                    if (qChunkIds instanceof List<?> questionChunkIds) {
                        for (Object item : questionChunkIds) {
                            if (item != null) {
                                allChunkIdStrings.add(item.toString());
                            }
                        }
                    }
                }
            }
        }

        // Deduplicate and convert to UUIDs
        List<UUID> chunkUuids = allChunkIdStrings.stream()
                .distinct()
                .map(item -> {
                    try {
                        return UUID.fromString(item);
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
            log.debug("No matching document_chunks found in DB for quiz chunk IDs {}", chunkUuids);
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
        log.info("Persisted {} content citations for generated quiz {}", citations.size(), contentId);
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

    /**
     * Regenerates content with user-provided refinement instructions (BE-027 / FE-016).
     * Creates a new version record linked to the root parent without mutating prior versions.
     */
    @Transactional
    public GenerationResponseDto regenerateContent(UUID workspaceId, UUID contentId, UUID userId, String instructions) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        GeneratedContent parent = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        if (!workspaceId.equals(parent.getWorkspaceId())) {
            log.warn("Cross-workspace regeneration attempted: content {} in workspace {}, requested for workspace {}",
                    contentId, parent.getWorkspaceId(), workspaceId);
            throw new ForbiddenException("Cross-workspace content regeneration is forbidden");
        }

        UUID rootParentId = parent.getParentId() != null ? parent.getParentId() : parent.getId();

        // Calculate next version by finding the maximum version in this lineage to prevent version collisions
        List<GeneratedContent> existingLineage = generatedContentRepository.findByParentIdOrderByVersionAsc(rootParentId);
        int maxVersion = parent.getVersion() != null ? parent.getVersion() : 1;
        for (GeneratedContent item : existingLineage) {
            if (item.getVersion() != null && item.getVersion() > maxVersion) {
                maxVersion = item.getVersion();
            }
        }
        GeneratedContent rootContent = generatedContentRepository.findById(rootParentId).orElse(null);
        if (rootContent != null && rootContent.getVersion() != null && rootContent.getVersion() > maxVersion) {
            maxVersion = rootContent.getVersion();
        }
        int nextVersion = maxVersion + 1;

        String combinedInstructions = (parent.getPromptInput() != null ? parent.getPromptInput() : "")
                + (instructions != null && !instructions.isBlank() ? "\n[Refinement]: " + instructions.trim() : "");

        @SuppressWarnings("unchecked")
        Map<String, Object> contentData = parent.getContentData() != null
                ? new HashMap<>(parent.getContentData())
                : new HashMap<>();

        // If AI Service is configured and instructions are provided, attempt AI re-prompting
        if (aiServiceWebClient != null && instructions != null && !instructions.isBlank()) {
            try {
                String endpoint = "QUIZ".equalsIgnoreCase(parent.getContentType())
                        ? "/generation/quiz"
                        : "/generation/lesson-plan";

                Map<String, Object> aiRequest = new HashMap<>();
                aiRequest.put("workspace_id", workspaceId.toString());
                aiRequest.put("subject", parent.getSubject() != null ? parent.getSubject() : "");
                aiRequest.put("grade_level", parent.getGradeLevel() != null ? parent.getGradeLevel() : "");
                aiRequest.put("topic", parent.getTopic() != null ? parent.getTopic() : parent.getTitle());
                aiRequest.put("instructions", combinedInstructions);

                Map<String, Object> responseBody = aiServiceWebClient.post()
                        .uri(endpoint)
                        .bodyValue(aiRequest)
                        .retrieve()
                        .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                        .block();

                if (responseBody != null) {
                    if (responseBody.get("data") instanceof Map<?, ?> dataMap) {
                        contentData = (Map<String, Object>) dataMap;
                    } else if (responseBody.get("contentData") instanceof Map<?, ?> cdMap) {
                        contentData = (Map<String, Object>) cdMap;
                    } else if (!responseBody.isEmpty() && !responseBody.containsKey("error")) {
                        contentData = responseBody;
                    }
                }
            } catch (Exception e) {
                log.info("AI service re-prompting skipped or not available during regeneration ({}), preserving parent contentData", e.getMessage());
            }
        }

        GeneratedContent newContent = GeneratedContent.builder()
                .workspaceId(workspaceId)
                .createdBy(userId)
                .contentType(parent.getContentType())
                .title(parent.getTitle())
                .subject(parent.getSubject())
                .gradeLevel(parent.getGradeLevel())
                .topic(parent.getTopic())
                .contentData(contentData)
                .promptInput(combinedInstructions)
                .reviewStatus("DRAFT")
                .version(nextVersion)
                .parentId(rootParentId)
                .modelUsed(parent.getModelUsed() != null ? parent.getModelUsed() : "gemini-1.5-flash")
                .build();

        newContent = generatedContentRepository.save(newContent);

        // Persist citations if present in re-generated content
        persistCitations(newContent.getId(), contentData);

        log.info("Regenerated content {} creating version {} (parentId={}) in workspace {}",
                contentId, nextVersion, rootParentId, workspaceId);

        return GenerationResponseDto.fromEntity(newContent);
    }

    /**
     * Retrieves all version lineage items for a given generated content record (BE-027).
     */
    @Transactional(readOnly = true)
    public List<GenerationResponseDto> getContentVersions(UUID workspaceId, UUID contentId, UUID userId) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        GeneratedContent target = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        if (!workspaceId.equals(target.getWorkspaceId())) {
            throw new ForbiddenException("Cross-workspace content access is forbidden");
        }

        UUID rootId = target.getParentId() != null ? target.getParentId() : target.getId();
        GeneratedContent root = generatedContentRepository.findById(rootId).orElse(target);

        List<GeneratedContent> children = generatedContentRepository.findByParentIdOrderByVersionAsc(rootId);
        List<GeneratedContent> all = new ArrayList<>();
        all.add(root);
        for (GeneratedContent child : children) {
            if (!child.getId().equals(root.getId())) {
                all.add(child);
            }
        }
        all.sort(java.util.Comparator.comparingInt(c -> c.getVersion() != null ? c.getVersion() : 1));

        return all.stream().map(GenerationResponseDto::fromEntity).toList();
    }
}
