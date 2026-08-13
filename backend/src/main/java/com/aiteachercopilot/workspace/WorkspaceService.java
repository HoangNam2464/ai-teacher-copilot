package com.aiteachercopilot.workspace;

import com.aiteachercopilot.common.exception.ForbiddenException;
import com.aiteachercopilot.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Workspace service — CRUD operations with owner-based isolation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;

    @Transactional
    public WorkspaceDto.Response create(UUID ownerId, WorkspaceDto.CreateRequest request) {
        Workspace ws = Workspace.builder()
                .ownerId(ownerId)
                .name(request.getName())
                .description(request.getDescription())
                .subject(request.getSubject())
                .gradeLevel(request.getGradeLevel())
                .build();
        ws = workspaceRepository.save(ws);
        log.info("Workspace created: {} by user {}", ws.getId(), ownerId);
        return WorkspaceDto.Response.fromEntity(ws);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceDto.Response> listByOwner(UUID ownerId) {
        return workspaceRepository.findByOwnerIdAndIsActiveTrue(ownerId).stream()
                .map(WorkspaceDto.Response::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceDto.Response getById(UUID workspaceId, UUID ownerId) {
        Workspace ws = findAndAuthorize(workspaceId, ownerId);
        return WorkspaceDto.Response.fromEntity(ws);
    }

    @Transactional
    public WorkspaceDto.Response update(UUID workspaceId, UUID ownerId,
                                         WorkspaceDto.UpdateRequest request) {
        Workspace ws = findAndAuthorize(workspaceId, ownerId);

        if (request.getName() != null) ws.setName(request.getName());
        if (request.getDescription() != null) ws.setDescription(request.getDescription());
        if (request.getSubject() != null) ws.setSubject(request.getSubject());
        if (request.getGradeLevel() != null) ws.setGradeLevel(request.getGradeLevel());

        ws = workspaceRepository.save(ws);
        return WorkspaceDto.Response.fromEntity(ws);
    }

    @Transactional
    public void delete(UUID workspaceId, UUID ownerId) {
        Workspace ws = findAndAuthorize(workspaceId, ownerId);
        ws.setIsActive(false);
        workspaceRepository.save(ws);
        log.info("Workspace soft-deleted: {}", workspaceId);
    }

    /**
     * Verify workspace exists and belongs to the requesting user.
     * Enforces workspace isolation.
     */
    public Workspace findAndAuthorize(UUID workspaceId, UUID ownerId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace", workspaceId));
        if (!ws.getOwnerId().equals(ownerId)) {
            throw new ForbiddenException("You do not have access to this workspace");
        }
        if (!ws.getIsActive()) {
            throw new ResourceNotFoundException("Workspace", workspaceId);
        }
        return ws;
    }
}
