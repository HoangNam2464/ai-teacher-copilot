package com.aiteachercopilot.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for DocumentChunk entity.
 */
@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(UUID documentId);

    List<DocumentChunk> findByWorkspaceId(UUID workspaceId);

    void deleteByDocumentId(UUID documentId);
}
