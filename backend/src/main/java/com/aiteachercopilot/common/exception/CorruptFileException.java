package com.aiteachercopilot.common.exception;

/**
 * Thrown when an uploaded document file is corrupted, malformed, or unreadable [BE-035].
 */
public class CorruptFileException extends RuntimeException {

    public CorruptFileException(String message) {
        super(message);
    }

    public CorruptFileException(String message, Throwable cause) {
        super(message, cause);
    }
}
