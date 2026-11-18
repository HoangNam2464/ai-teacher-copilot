package com.aiteachercopilot.generation;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Generation History and Version Tree Lineage API [BE-028 / ATC-404 / ATC-90].
 * Provides dedicated endpoints for workspace history, content type filtering,
 * hierarchical version tree navigation, and lineage traceability.
 */
@RestController
@RequiredArgsConstructor
public class HistoryController {

    private final GenerationService generationService;

    /**
     * Lists generation history for a workspace, ordered by newest first (BE-028).
     * Supports optional contentType filter (e.g., QUIZ, LESSON_PLAN).
     */
    @GetMapping("/workspaces/{workspaceId}/history")
    public ResponseEntity<ApiResponse<List<GenerationResponseDto>>> getWorkspaceHistory(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @RequestParam(required = false) String contentType) {

        List<GenerationResponseDto> history = generationService.getWorkspaceGenerationHistory(
                workspaceId, user.getId(), contentType);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * Retrieves a specific history item within a workspace, enforcing workspace isolation.
     */
    @GetMapping("/workspaces/{workspaceId}/history/{id}")
    public ResponseEntity<ApiResponse<GenerationResponseDto>> getHistoryItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id) {

        GenerationResponseDto result = generationService.getGeneratedContentById(
                workspaceId, id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Retrieves all version lineage records for a given content item within a workspace.
     */
    @GetMapping({"/workspaces/{workspaceId}/history/{id}/lineage", "/workspaces/{workspaceId}/history/{id}/versions"})
    public ResponseEntity<ApiResponse<List<GenerationResponseDto>>> getHistoryLineage(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id) {

        List<GenerationResponseDto> versions = generationService.getContentVersions(
                workspaceId, id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(versions));
    }

    /**
     * Retrieves the complete hierarchical version tree and lineage metadata (BE-028).
     * Includes rootId, currentId, currentVersion, latestVersion, totalVersions, and ordered version list.
     */
    @GetMapping({"/workspaces/{workspaceId}/history/{id}/tree", "/workspaces/{workspaceId}/history/{id}/version-tree"})
    public ResponseEntity<ApiResponse<VersionTreeDto>> getHistoryVersionTree(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id) {

        VersionTreeDto tree = generationService.getVersionTree(
                workspaceId, id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    /**
     * Direct retrieval of history item by ID with ownership authorization check.
     */
    @GetMapping("/history/{id}")
    public ResponseEntity<ApiResponse<GenerationResponseDto>> getHistoryItemById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {

        GenerationResponseDto result = generationService.getGeneratedContentById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Deletes a history item within a workspace with strict ownership validation.
     */
    @DeleteMapping("/workspaces/{workspaceId}/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkspaceHistoryItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id) {

        generationService.deleteGeneratedContent(workspaceId, id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Nội dung đã được xóa thành công", null));
    }

    /**
     * Direct deletion of history item by ID with ownership authorization check.
     */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryItemById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {

        generationService.deleteGeneratedContent(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Nội dung đã được xóa thành công", null));
    }
}
