package com.aiteachercopilot.workspace;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public final class WorkspaceDto {

    private WorkspaceDto() {}

    @Data
    public static class CreateRequest {
        @NotBlank(message = "Workspace name is required")
        private String name;
        private String description;
        private String subject;
        private String gradeLevel;
    }

    @Data
    public static class UpdateRequest {
        private String name;
        private String description;
        private String subject;
        private String gradeLevel;
    }

    @Data
    public static class Response {
        private UUID id;
        private String name;
        private String description;
        private String subject;
        private String gradeLevel;
        private Instant createdAt;
        private Instant updatedAt;

        public static Response fromEntity(Workspace ws) {
            Response r = new Response();
            r.setId(ws.getId());
            r.setName(ws.getName());
            r.setDescription(ws.getDescription());
            r.setSubject(ws.getSubject());
            r.setGradeLevel(ws.getGradeLevel());
            r.setCreatedAt(ws.getCreatedAt());
            r.setUpdatedAt(ws.getUpdatedAt());
            return r;
        }
    }
}
