package com.aiteachercopilot.common.exception;

/**
 * Thrown when a user attempts to access a resource
 * that belongs to another workspace or user.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
