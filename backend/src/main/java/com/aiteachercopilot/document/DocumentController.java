package com.aiteachercopilot.document;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Document REST controller.
 * Handles file upload and document listing within a workspace.
 */
@RestController
@RequestMapping("/workspaces/{workspaceId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * POST /api/workspaces/{workspaceId}/documents — Upload a document.
     * Validates the multipart file, uploads it to MinIO, and persists metadata.
     * Triggers the AI backend for async processing.
     * 
     * @param user The authenticated teacher
     * @param workspaceId The target workspace ID
     * @param file The document file (PDF, DOCX, TXT)
     * @param subject Optional subject metadata
     * @param gradeLevel Optional grade level metadata
     * @param topic Optional topic metadata
     * @return Upload response with saved metadata and processing status
     */
    @PostMapping(value = {"", "/upload"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentDto.UploadResponse>> upload(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            org.springframework.web.multipart.MultipartHttpServletRequest multipartRequest,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String gradeLevel,
            @RequestParam(required = false) String topic) {
        if (file == null && multipartRequest != null && !multipartRequest.getFileMap().isEmpty()) {
            file = multipartRequest.getFileMap().values().iterator().next();
        }
        if (file == null) {
            throw new IllegalArgumentException("File is required");
        }
        DocumentDto.UploadResponse response = documentService.upload(
                workspaceId, user.getId(), file, subject, gradeLevel, topic);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded", response));
    }

    /**
     * GET /api/workspaces/{workspaceId}/documents — List documents.
     * Retrieves all documents within a workspace owned by the user.
     * 
     * @param user The authenticated teacher
     * @param workspaceId The target workspace ID
     * @return List of documents in the workspace
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentDto.ListResponse>>> list(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId) {
        List<DocumentDto.ListResponse> documents =
                documentService.listByWorkspace(workspaceId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(documents));
    }

    /**
     * DELETE /api/workspaces/{workspaceId}/documents/{documentId} — Delete a document.
     */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID documentId) {
        documentService.deleteDocument(documentId, workspaceId, user.getId());
        return ResponseEntity.noContent().build();
    }
}
