package com.aiteachercopilot.generation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for GeneratedContent entity.
 */
@Repository
public interface GeneratedContentRepository extends JpaRepository<GeneratedContent, UUID> {

    List<GeneratedContent> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    List<GeneratedContent> findByWorkspaceIdAndContentTypeOrderByCreatedAtDesc(UUID workspaceId, String contentType);

    Optional<GeneratedContent> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

    List<GeneratedContent> findByParentIdOrderByVersionAsc(UUID parentId);

    void deleteByWorkspaceIdIn(List<UUID> workspaceIds);
}
