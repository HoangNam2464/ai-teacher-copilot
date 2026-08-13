package com.aiteachercopilot.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for Document entity.
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

    long countByWorkspaceId(UUID workspaceId);
}
