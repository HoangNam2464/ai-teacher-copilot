package com.aiteachercopilot.generation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request DTO for updating lesson content and review status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLessonContentRequestDto {

    private Map<String, Object> contentData;

    private String reviewStatus;

    private String title;
}
