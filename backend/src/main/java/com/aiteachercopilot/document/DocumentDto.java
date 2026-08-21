package com.aiteachercopilot.document;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

public final class DocumentDto {

    private DocumentDto() {}

    @Data
    public static class UploadResponse {
        private UUID id;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private String processingStatus;
        private Instant createdAt;

        public static UploadResponse fromEntity(Document doc) {
            UploadResponse r = new UploadResponse();
            r.setId(doc.getId());
            r.setFileName(doc.getFileName());
            r.setFileType(doc.getFileType());
            r.setFileSize(doc.getFileSize());
            r.setProcessingStatus(doc.getProcessingStatus());
            r.setCreatedAt(doc.getCreatedAt());
            return r;
        }
    }

    @Data
    public static class ListResponse {
        private UUID id;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private String processingStatus;
        private String subject;
        private String gradeLevel;
        private String topic;
        private Integer chunkCount;
        private Instant createdAt;

        public static ListResponse fromEntity(Document doc) {
            ListResponse r = new ListResponse();
            r.setId(doc.getId());
            r.setFileName(doc.getFileName());
            r.setFileType(doc.getFileType());
            r.setFileSize(doc.getFileSize());
            r.setProcessingStatus(doc.getProcessingStatus());
            r.setSubject(doc.getSubject());
            r.setGradeLevel(doc.getGradeLevel());
            r.setTopic(doc.getTopic());
            r.setChunkCount(doc.getChunkCount());
            r.setCreatedAt(doc.getCreatedAt());
            return r;
        }
    }
}
