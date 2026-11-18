package com.aiteachercopilot.generation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for ContentCitation entity.
 */
@Repository
public interface ContentCitationRepository extends JpaRepository<ContentCitation, UUID> {

    List<ContentCitation> findByContentId(UUID contentId);

    List<ContentCitation> findByDocumentId(UUID documentId);

    List<ContentCitation> findByChunkId(UUID chunkId);

    void deleteByContentId(UUID contentId);
}
