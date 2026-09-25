package com.aiteachercopilot.generation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Standard response DTO for generated teaching materials conforming to Rule 4.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationResponseDto {

    private UUID id;
    private String contentType;
    private String title;
    private Map<String, Object> contentData;
    private String reviewStatus;
    private Integer version;
    private UUID parentId;
    private Instant createdAt;
    private Instant updatedAt;

    public static GenerationResponseDto fromEntity(GeneratedContent entity) {
        if (entity == null) {
            return null;
        }
        return GenerationResponseDto.builder()
                .id(entity.getId())
                .contentType(entity.getContentType())
                .title(entity.getTitle())
                .contentData(entity.getContentData())
                .reviewStatus(entity.getReviewStatus())
                .version(entity.getVersion())
                .parentId(entity.getParentId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
