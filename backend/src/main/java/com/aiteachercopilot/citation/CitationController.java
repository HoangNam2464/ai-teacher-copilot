package com.aiteachercopilot.citation;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for citation resolution and provenance tracking.
 * Exposes endpoints for frontend citation badges, source drawers, and verification panels.
 */
@RestController
@RequestMapping({
        "/workspaces/{workspaceId}/citations",
        "/workspaces/{workspaceId}/citation"
})
@RequiredArgsConstructor
public class CitationController {

    private final CitationService citationService;

    /**
     * Resolves chunk IDs or citation IDs to document metadata and safe excerpts.
     * Complies with GET /api/workspaces/{workspaceId}/citations/resolve?chunkIds=UUID1,UUID2
     */
    @GetMapping("/resolve")
    public ResponseEntity<ApiResponse<List<CitationResolutionDto>>> resolve(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @RequestParam(value = "chunkIds", required = false) List<String> rawChunkIds,
            @RequestParam(value = "citationIds", required = false) List<String> rawCitationIds) {

        List<UUID> chunkIds = parseUuidList(rawChunkIds);
        List<UUID> citationIds = parseUuidList(rawCitationIds);

        if (!chunkIds.isEmpty()) {
            List<CitationResolutionDto> results = citationService.resolveByChunkIds(
                    workspaceId, user.getId(), chunkIds);
            return ResponseEntity.ok(ApiResponse.success(results));
        } else if (!citationIds.isEmpty()) {
            List<CitationResolutionDto> results = citationService.resolveByCitationIds(
                    workspaceId, user.getId(), citationIds);
            return ResponseEntity.ok(ApiResponse.success(results));
        }

        return ResponseEntity.ok(ApiResponse.success(Collections.emptyList()));
    }

    /**
     * Resolves a single citation ID to its source document, page, and chunk excerpt.
     * GET /api/workspaces/{workspaceId}/citations/{citationId}
     */
    @GetMapping("/{citationId}")
    public ResponseEntity<ApiResponse<CitationResolutionDto>> getCitationById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID citationId) {

        CitationResolutionDto result = citationService.resolveByCitationId(
                workspaceId, user.getId(), citationId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * Resolves all citations associated with a specific generated content.
     * GET /api/workspaces/{workspaceId}/citations/content/{contentId}
     */
    @GetMapping("/content/{contentId}")
    public ResponseEntity<ApiResponse<List<CitationResolutionDto>>> getCitationsByContentId(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID contentId) {

        List<CitationResolutionDto> results = citationService.resolveByContentId(
                workspaceId, user.getId(), contentId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    private List<UUID> parseUuidList(List<String> rawList) {
        if (rawList == null || rawList.isEmpty()) {
            return Collections.emptyList();
        }
        return rawList.stream()
                .filter(Objects::nonNull)
                .flatMap(s -> Arrays.stream(s.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
