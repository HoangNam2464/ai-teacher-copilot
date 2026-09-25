package com.aiteachercopilot.generation;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
