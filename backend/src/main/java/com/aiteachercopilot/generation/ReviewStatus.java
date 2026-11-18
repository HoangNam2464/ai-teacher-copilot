package com.aiteachercopilot.generation;

/**
 * Review status lifecycle for generated contents: DRAFT -> REVIEWED -> APPROVED.
 */
public enum ReviewStatus {
    DRAFT,
    REVIEWED,
    APPROVED;

    /**
     * Checks whether the provided status string corresponds to a valid ReviewStatus enum value.
     */
    public static boolean isValid(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        for (ReviewStatus s : values()) {
            if (s.name().equalsIgnoreCase(status.trim())) {
                return true;
            }
        }
        return false;
    }
}
