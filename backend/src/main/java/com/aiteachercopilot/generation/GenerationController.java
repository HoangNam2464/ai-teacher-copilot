package com.aiteachercopilot.generation;

import com.aiteachercopilot.citation.CitationResolutionDto;
import com.aiteachercopilot.citation.CitationService;
import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({
        "/workspaces/{workspaceId}/generation",
        "/workspaces/{workspaceId}/generations",
        "/workspaces/{workspaceId}/generate"
})
@RequiredArgsConstructor
public class GenerationController {

    private final GenerationService generationService;
    private final CitationService citationService;

    @PostMapping("/lesson-plan")
    public ResponseEntity<ApiResponse<GenerationResponseDto>> generateLessonPlan(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @Valid @RequestBody GenerationRequestDto request) {

        GenerationResponseDto result = generationService.generateLessonPlan(workspaceId, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Object>> generateQuiz(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @RequestBody GenerationRequestDto request) {

        Object result = generationService.generateQuiz(workspaceId, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{contentId}/citations")
    public ResponseEntity<ApiResponse<List<CitationResolutionDto>>> getContentCitations(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID contentId) {

        List<CitationResolutionDto> results = citationService.resolveByContentId(
                workspaceId, user.getId(), contentId);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GenerationResponseDto>> updateLessonContent(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id,
            @RequestBody UpdateLessonContentRequestDto request) {

        GenerationResponseDto result = generationService.updateLessonContent(
                workspaceId, id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Lesson updated successfully", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GenerationResponseDto>> getGeneratedContentById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId,
            @PathVariable UUID id) {

        GenerationResponseDto result = generationService.getGeneratedContentById(
                workspaceId, id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping({"/history", ""})
    public ResponseEntity<ApiResponse<List<GenerationResponseDto>>> getGenerationHistory(
            @AuthenticationPrincipal User user,
            @PathVariable UUID workspaceId) {

        List<GenerationResponseDto> history = generationService.getWorkspaceGenerationHistory(
                workspaceId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
