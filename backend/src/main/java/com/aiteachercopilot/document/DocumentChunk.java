package com.aiteachercopilot.document;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * DocumentChunk entity — parsed and chunked text segments from uploaded documents.
 * Note: embedding column is managed by FastAPI/pgvector and omitted here to maintain dialect independence.
 */
@Entity
@Table(name = "document_chunks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "token_count")
    private Integer tokenCount;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "grade_level", length = 50)
    private String gradeLevel;

    @Column(name = "topic", length = 255)
    private String topic;

    @Column(name = "source_page")
    private Integer sourcePage;

    @Column(name = "source_location", columnDefinition = "TEXT")
    private String sourceLocation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
