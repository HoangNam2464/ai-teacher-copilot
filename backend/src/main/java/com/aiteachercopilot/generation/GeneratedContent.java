package com.aiteachercopilot.generation;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * GeneratedContent entity — records all AI-generated teaching materials (Lesson Plans, Quizzes, Rubrics).
 * Stores structured JSON output along with workspace ownership, review status, and version lineage.
 */
@Entity
@Table(name = "generated_contents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedContent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "subject", length = 100)
    private String subject;

    @Column(name = "grade_level", length = 50)
    private String gradeLevel;

    @Column(name = "topic", length = 255)
    private String topic;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_data", nullable = false)
    private Map<String, Object> contentData;

    @Column(name = "prompt_input", columnDefinition = "TEXT")
    private String promptInput;

    @Column(name = "review_status", nullable = false, length = 50)
    @Builder.Default
    private String reviewStatus = "DRAFT";

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "model_used", length = 100)
    private String modelUsed;

    @Column(name = "generation_time_ms")
    private Integer generationTimeMs;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
