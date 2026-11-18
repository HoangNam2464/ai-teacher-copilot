package com.aiteachercopilot.common.exception;

/**
 * Thrown when an error occurs during document extraction, chunking, or ingestion [BE-035].
 */
public class DocumentProcessingException extends RuntimeException {

    public DocumentProcessingException(String message) {
        super(message);
    }

    public DocumentProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
