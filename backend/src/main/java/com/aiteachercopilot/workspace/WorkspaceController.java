package com.aiteachercopilot.workspace;

import com.aiteachercopilot.common.dto.ApiResponse;
import com.aiteachercopilot.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Workspace REST controller.
 * All endpoints require authentication and enforce workspace ownership.
 */
@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    /**
     * Creates a new workspace for the authenticated teacher.
     * @param user The authenticated user
     * @param request The workspace details (name, description, subject, grade level)
     * @return The created workspace data
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceDto.Response>> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody WorkspaceDto.CreateRequest request) {
        WorkspaceDto.Response response = workspaceService.create(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Workspace created", response));
    }

    /**
     * Lists all active workspaces owned by the authenticated teacher.
     * @param user The authenticated user
     * @return List of workspaces
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceDto.Response>>> list(
            @AuthenticationPrincipal User user) {
        List<WorkspaceDto.Response> workspaces = workspaceService.listByOwner(user.getId());
        return ResponseEntity.ok(ApiResponse.success(workspaces));
    }

    /**
     * Gets a specific workspace by ID, enforcing ownership.
     * @param user The authenticated user
     * @param id The workspace ID
     * @return The workspace details
     * @throws ForbiddenException if the user is not the owner
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceDto.Response>> getById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        WorkspaceDto.Response response = workspaceService.getById(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Updates an existing workspace. Only the owner can perform this action.
     * @param user The authenticated user
     * @param id The workspace ID
     * @param request The updated workspace details
     * @return The updated workspace data
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceDto.Response>> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody WorkspaceDto.UpdateRequest request) {
        WorkspaceDto.Response response = workspaceService.update(id, user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Workspace updated", response));
    }

    /**
     * Soft-deletes a workspace. Only the owner can perform this action.
     * @param user The authenticated user
     * @param id The workspace ID
     * @return Empty response on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        workspaceService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Workspace deleted", null));
    }
}
