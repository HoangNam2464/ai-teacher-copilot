package com.aiteachercopilot.citation;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.document.Document;
import com.aiteachercopilot.document.DocumentChunk;
import com.aiteachercopilot.document.DocumentChunkRepository;
import com.aiteachercopilot.document.DocumentRepository;
import com.aiteachercopilot.generation.ContentCitation;
import com.aiteachercopilot.generation.ContentCitationRepository;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
import com.aiteachercopilot.workspace.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * CitationService — resolves citations and source chunks to documents, pages, and excerpts
 * while enforcing strict workspace isolation and excerpt sanitization.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CitationService {

    private static final int MAX_EXCERPT_LENGTH = 200;

    private final WorkspaceService workspaceService;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentRepository documentRepository;
    private final ContentCitationRepository contentCitationRepository;
    private final GeneratedContentRepository generatedContentRepository;

    /**
     * Resolves a list of chunk IDs to their corresponding document references and excerpts.
     * Enforces tenant isolation: all chunk IDs must belong to the caller's workspace.
     */
    @Transactional(readOnly = true)
    public List<CitationResolutionDto> resolveByChunkIds(UUID workspaceId, UUID userId, List<UUID> chunkIds) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        if (chunkIds == null || chunkIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<CitationResolutionDto> results = new ArrayList<>();
        for (UUID chunkId : chunkIds) {
            if (chunkId == null) {
                continue;
            }

            DocumentChunk chunk = documentChunkRepository.findById(chunkId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document chunk not found: " + chunkId));

            if (!workspaceId.equals(chunk.getWorkspaceId())) {
                log.warn("Cross-workspace chunk access attempted: chunk {} in workspace {}, requested for workspace {}",
                        chunkId, chunk.getWorkspaceId(), workspaceId);
                throw new ForbiddenException("Cross-workspace chunk access is forbidden: " + chunkId);
            }

            Document doc = documentRepository.findById(chunk.getDocumentId()).orElse(null);
            if (doc != null && !workspaceId.equals(doc.getWorkspaceId())) {
                log.warn("Cross-workspace document access attempted: document {} in workspace {}, requested for workspace {}",
                        doc.getId(), doc.getWorkspaceId(), workspaceId);
                throw new ForbiddenException("Cross-workspace document access is forbidden: " + doc.getId());
            }

            results.add(CitationResolutionDto.builder()
                    .chunkId(chunk.getId())
                    .documentId(chunk.getDocumentId())
                    .fileName(doc != null ? doc.getFileName() : "Unknown Document")
                    .sourcePage(chunk.getSourcePage())
                    .sourceLocation(chunk.getSourceLocation())
                    .excerpt(sanitizeExcerpt(chunk.getContent()))
                    .chunkIndex(chunk.getChunkIndex())
                    .topic(chunk.getTopic())
                    .subject(chunk.getSubject())
                    .gradeLevel(chunk.getGradeLevel())
                    .build());
        }

        return results;
    }

    /**
     * Resolves a single citation ID to its full source provenance.
     * Enforces workspace isolation: citation must belong to caller's workspace.
     */
    @Transactional(readOnly = true)
    public CitationResolutionDto resolveByCitationId(UUID workspaceId, UUID userId, UUID citationId) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        ContentCitation citation = contentCitationRepository.findById(citationId)
                .orElseThrow(() -> new ResourceNotFoundException("Citation", citationId));

        DocumentChunk chunk = documentChunkRepository.findById(citation.getChunkId()).orElse(null);
        if (chunk != null && !workspaceId.equals(chunk.getWorkspaceId())) {
            log.warn("Cross-workspace citation chunk access attempted: citation {}, chunk workspace {}",
                    citationId, chunk.getWorkspaceId());
            throw new ForbiddenException("Cross-workspace citation access is forbidden: " + citationId);
        }

        GeneratedContent content = generatedContentRepository.findById(citation.getContentId()).orElse(null);
        if (content != null && !workspaceId.equals(content.getWorkspaceId())) {
            log.warn("Cross-workspace citation content access attempted: citation {}, content workspace {}",
                    citationId, content.getWorkspaceId());
            throw new ForbiddenException("Cross-workspace citation access is forbidden: " + citationId);
        }

        Document doc = documentRepository.findById(citation.getDocumentId()).orElse(null);
        if (doc != null && !workspaceId.equals(doc.getWorkspaceId())) {
            log.warn("Cross-workspace citation document access attempted: citation {}, doc workspace {}",
                    citationId, doc.getWorkspaceId());
            throw new ForbiddenException("Cross-workspace citation access is forbidden: " + citationId);
        }

        String rawContent = (chunk != null && chunk.getContent() != null && !chunk.getContent().isBlank())
                ? chunk.getContent()
                : citation.getCitationText();

        return CitationResolutionDto.builder()
                .citationId(citation.getId())
                .contentId(citation.getContentId())
                .chunkId(citation.getChunkId())
                .documentId(citation.getDocumentId())
                .fileName(doc != null ? doc.getFileName() : "Unknown Document")
                .sourcePage(chunk != null ? chunk.getSourcePage() : null)
                .sourceLocation(chunk != null ? chunk.getSourceLocation() : null)
                .excerpt(sanitizeExcerpt(rawContent))
                .citationText(citation.getCitationText())
                .relevanceScore(citation.getRelevanceScore())
                .chunkIndex(chunk != null ? chunk.getChunkIndex() : null)
                .topic(chunk != null ? chunk.getTopic() : null)
                .subject(chunk != null ? chunk.getSubject() : null)
                .gradeLevel(chunk != null ? chunk.getGradeLevel() : null)
                .build();
    }

    /**
     * Resolves a list of citation IDs.
     */
    @Transactional(readOnly = true)
    public List<CitationResolutionDto> resolveByCitationIds(UUID workspaceId, UUID userId, List<UUID> citationIds) {
        if (citationIds == null || citationIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<CitationResolutionDto> results = new ArrayList<>();
        for (UUID citationId : citationIds) {
            if (citationId != null) {
                results.add(resolveByCitationId(workspaceId, userId, citationId));
            }
        }
        return results;
    }

    /**
     * Resolves all citations associated with a specific generated content.
     */
    @Transactional(readOnly = true)
    public List<CitationResolutionDto> resolveByContentId(UUID workspaceId, UUID userId, UUID contentId) {
        workspaceService.findAndAuthorize(workspaceId, userId);

        GeneratedContent content = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        if (!workspaceId.equals(content.getWorkspaceId())) {
            log.warn("Cross-workspace content citation query attempted: content {} belongs to workspace {}",
                    contentId, content.getWorkspaceId());
            throw new ForbiddenException("Cross-workspace content access is forbidden: " + contentId);
        }

        List<ContentCitation> citations = contentCitationRepository.findByContentId(contentId);
        List<CitationResolutionDto> results = new ArrayList<>();
        for (ContentCitation citation : citations) {
            results.add(resolveByCitationId(workspaceId, userId, citation.getId()));
        }
        return results;
    }

    /**
     * Sanitizes source chunk text into a safe preview (first 200 characters)
     * as required by Rule 3 & 4.
     */
    public static String sanitizeExcerpt(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String trimmed = text.trim();
        if (trimmed.length() <= MAX_EXCERPT_LENGTH) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_EXCERPT_LENGTH).trim() + "...";
    }
}
