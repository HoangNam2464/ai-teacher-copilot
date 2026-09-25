package com.aiteachercopilot.export;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.citation.CitationService;
import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import com.aiteachercopilot.generation.GeneratedContent;
import com.aiteachercopilot.generation.GeneratedContentRepository;
import com.aiteachercopilot.user.User;
import com.aiteachercopilot.user.UserRepository;
import com.aiteachercopilot.workspace.WorkspaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * ExportService — coordinates authorization, content and citation resolution,
 * and delegates to format-specific exporters (DOCX via Apache POI).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    public static final String DOCX_MIME_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    public static final String PDF_MIME_TYPE = "application/pdf";

    private static final DateTimeFormatter TIMESTAMP_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");

    private final WorkspaceService workspaceService;
    private final GeneratedContentRepository generatedContentRepository;
    private final CitationService citationService;
    private final DocxLessonExporter docxLessonExporter;
    private final PdfLessonExporter pdfLessonExporter;
    private final UserRepository userRepository;

    /**
     * Exports a generated document to DOCX or PDF format with citation footnotes and professional styling.
     * Enforces strict workspace multi-tenant authorization.
     */
    @Transactional(readOnly = true)
    public ExportResult exportDocument(UUID workspaceId,
                                       UUID contentId,
                                       UUID userId,
                                       String format,
                                       ExportRequestDto request) {
        // 1. Authorize workspace
        workspaceService.findAndAuthorize(workspaceId, userId);

        // 2. Retrieve generated content
        GeneratedContent content = generatedContentRepository.findById(contentId)
                .orElseThrow(() -> new ResourceNotFoundException("GeneratedContent", contentId));

        // 3. Multi-tenant isolation check
        if (!workspaceId.equals(content.getWorkspaceId())) {
            log.warn("Cross-workspace export attempt: content {} (workspace {}) requested from workspace {}",
                    contentId, content.getWorkspaceId(), workspaceId);
            throw new ForbiddenException("Cross-workspace content access is forbidden: " + contentId);
        }

        // 4. Validate export format
        String targetFormat = (format != null && !format.isBlank()) ? format.trim().toUpperCase() : "DOCX";
        if (!"DOCX".equals(targetFormat) && !"PDF".equals(targetFormat)) {
            throw new IllegalArgumentException("Unsupported export format: " + targetFormat + ". Currently supported: DOCX, PDF");
        }

        // 5. Citations resolution
        boolean includeCitations = (request == null || request.getIncludeCitations() == null) || request.getIncludeCitations();
        List<CitationResolutionDto> citations = Collections.emptyList();
        if (includeCitations) {
            try {
                citations = citationService.resolveByContentId(workspaceId, userId, contentId);
            } catch (Exception e) {
                log.warn("Could not resolve citations for content {}: {}", contentId, e.getMessage());
            }
        }

        // 6. Teacher details
        User teacher = null;
        if (content.getCreatedBy() != null) {
            teacher = userRepository.findById(content.getCreatedBy()).orElse(null);
        }
        if (teacher == null) {
            teacher = userRepository.findById(userId).orElse(null);
        }

        // 7. Render document binary based on requested format
        String extension = targetFormat.toLowerCase();
        String fileName = resolveFileName(request, content, extension);
        byte[] exportBytes;
        String mimeType;

        if ("PDF".equals(targetFormat)) {
            exportBytes = pdfLessonExporter.exportLessonPlan(
                    content,
                    request != null ? request.getContentData() : null,
                    citations,
                    includeCitations,
                    teacher
            );
            mimeType = PDF_MIME_TYPE;
            log.info("Successfully exported lesson plan {} to PDF ({} bytes) in workspace {}",
                    contentId, exportBytes.length, workspaceId);
        } else {
            exportBytes = docxLessonExporter.exportLessonPlan(
                    content,
                    request != null ? request.getContentData() : null,
                    citations,
                    includeCitations,
                    teacher
            );
            mimeType = DOCX_MIME_TYPE;
            log.info("Successfully exported lesson plan {} to DOCX ({} bytes) in workspace {}",
                    contentId, exportBytes.length, workspaceId);
        }

        return ExportResult.builder()
                .data(exportBytes)
                .fileName(fileName)
                .contentType(mimeType)
                .build();
    }

    private String resolveFileName(ExportRequestDto request, GeneratedContent content, String extension) {
        if (request != null && request.getFileName() != null && !request.getFileName().isBlank()) {
            String clientName = request.getFileName().trim();
            if (!clientName.toLowerCase().endsWith("." + extension)) {
                clientName += "." + extension;
            }
            return sanitizeFileName(clientName);
        }

        String contentTypePrefix = "lesson-plan";
        if (content.getContentType() != null && !content.getContentType().isBlank()) {
            contentTypePrefix = slugify(content.getContentType());
        }

        String topicSlug = "tai-lieu";
        if (content.getTopic() != null && !content.getTopic().isBlank()) {
            topicSlug = slugify(content.getTopic());
        } else if (content.getTitle() != null && !content.getTitle().isBlank()) {
            topicSlug = slugify(content.getTitle());
        }

        String timestamp = TIMESTAMP_FORMATTER.format(Instant.now());
        return String.format("%s_%s_%s.%s", contentTypePrefix, topicSlug, timestamp, extension);
    }

    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            return "tai-lieu";
        }
        String replaced = input.trim().replace('_', '-');
        String nowhitespace = WHITESPACE.matcher(replaced).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        slug = slug.replaceAll("-+", "-").toLowerCase(Locale.ENGLISH);
        if (slug.startsWith("-")) slug = slug.substring(1);
        if (slug.endsWith("-")) slug = slug.substring(0, slug.length() - 1);
        return slug.isBlank() ? "tai-lieu" : slug;
    }

    private String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
    }
}
