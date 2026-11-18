package com.aiteachercopilot.generation;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * ContentCitation entity — records provenance links between generated contents and original document chunks.
 */
@Entity
@Table(name = "content_citations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentCitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "content_id", nullable = false)
    private UUID contentId;

    @Column(name = "chunk_id", nullable = false)
    private UUID chunkId;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "citation_text", columnDefinition = "TEXT")
    private String citationText;

    @Column(name = "relevance_score")
    private Double relevanceScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
