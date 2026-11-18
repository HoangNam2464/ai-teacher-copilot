package com.aiteachercopilot.common.exception;

/**
 * Thrown when an uploaded file is empty or contains zero processable bytes/content [BE-035].
 */
public class EmptyFileException extends RuntimeException {

    public EmptyFileException(String message) {
        super(message);
    }
}
