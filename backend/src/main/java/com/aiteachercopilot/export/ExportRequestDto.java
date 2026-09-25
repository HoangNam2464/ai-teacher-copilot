package com.aiteachercopilot.export;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Request payload for exporting generated content (Lesson Plan or Quiz) to DOCX or PDF.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequestDto {

    @Builder.Default
    private Boolean includeCitations = true;

    private String fileName;

    private Map<String, Object> contentData;
}
