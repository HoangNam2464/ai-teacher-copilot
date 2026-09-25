package com.aiteachercopilot.generation;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request payload for lesson plan and quiz generation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationRequestDto {

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Grade level is required")
    private String gradeLevel;

    @NotBlank(message = "Topic is required")
    private String topic;

    private List<String> objectives;

    private Integer durationMinutes;

    private String instructions;

    private List<UUID> documentIds;

    private Integer numQuestions; // For quiz
}
