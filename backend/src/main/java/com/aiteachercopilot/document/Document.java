package com.aiteachercopilot.document;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Document entity — metadata for uploaded teaching materials.
 * The actual file is stored in MinIO. Processing is handled by FastAPI.
 */
@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "minio_object_key", nullable = false)
    private String minioObjectKey;

    @Column(name = "processing_status", nullable = false)
    @Builder.Default
    private String processingStatus = "PENDING";

    private String subject;

    @Column(name = "grade_level")
    private String gradeLevel;

    private String topic;

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
