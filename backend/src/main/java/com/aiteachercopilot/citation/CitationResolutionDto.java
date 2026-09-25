package com.aiteachercopilot.citation;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO representing a resolved source citation with document metadata,
 * chunk index, page number, and safe excerpt preview.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CitationResolutionDto {

    private UUID citationId;
    private UUID contentId;
    private UUID chunkId;
    private UUID documentId;
    private String fileName;
    private Integer sourcePage;
    private String sourceLocation;
    private String excerpt;
    private String citationText;
    private Double relevanceScore;
    private Integer chunkIndex;
    private String topic;
    private String subject;
    private String gradeLevel;
}
