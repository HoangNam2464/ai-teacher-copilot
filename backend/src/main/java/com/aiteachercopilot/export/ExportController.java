package com.aiteachercopilot.export;

import com.aiteachercopilot.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * REST controller for exporting generated teaching content (Lesson Plans) to DOCX.
 * Follows official contract from feature-export.md.
 */
@Slf4j
@RestController
@RequestMapping("/workspaces/{workspaceId}/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * POST /api/workspaces/{workspaceId}/export/{generationId}?format=DOCX
     * Streams binary document directly in HTTP response.
     */
    @PostMapping("/{generationId}")
    public ResponseEntity<byte[]> exportPost(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID generationId,
            @RequestParam(value = "format", defaultValue = "DOCX") String format,
            @RequestBody(required = false) ExportRequestDto request) {

        log.info("Export POST requested for generation {} in workspace {} by user {} (format={})",
                generationId, workspaceId, user != null ? user.getId() : "anonymous", format);

        ExportResult result = exportService.exportDocument(workspaceId, generationId, user.getId(), format, request);
        return buildFileResponse(result);
    }

    /**
     * GET /api/workspaces/{workspaceId}/export/{generationId}?format=DOCX
     * Convenience GET endpoint for direct browser downloads.
     */
    @GetMapping("/{generationId}")
    public ResponseEntity<byte[]> exportGet(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID generationId,
            @RequestParam(value = "format", defaultValue = "DOCX") String format,
            @RequestParam(value = "includeCitations", defaultValue = "true") Boolean includeCitations) {

        log.info("Export GET requested for generation {} in workspace {} by user {} (format={})",
                generationId, workspaceId, user != null ? user.getId() : "anonymous", format);

        ExportRequestDto request = ExportRequestDto.builder()
                .includeCitations(includeCitations)
                .build();

        ExportResult result = exportService.exportDocument(workspaceId, generationId, user.getId(), format, request);
        return buildFileResponse(result);
    }

    private ResponseEntity<byte[]> buildFileResponse(ExportResult result) {
        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(result.getFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .contentType(MediaType.parseMediaType(result.getContentType()))
                .contentLength(result.getData().length)
                .body(result.getData());
    }
}
