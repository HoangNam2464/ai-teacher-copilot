package com.aiteachercopilot.generation;

import lombok.Data;

@Data
public class GenerationRequestDto {
    private String subject;
    private String gradeLevel;
    private String topic;
    private String instructions;
    private Integer numQuestions;
}
