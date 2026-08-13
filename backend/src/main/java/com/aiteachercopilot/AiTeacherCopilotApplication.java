package com.aiteachercopilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * AI Teacher Copilot — Spring Boot Application Entry Point.
 *
 * Core backend responsible for:
 * - Authentication & JWT
 * - Workspace management
 * - Document metadata
 * - Content history & review state
 * - REST API gateway
 * - Communication with FastAPI AI Service
 */
@SpringBootApplication
public class AiTeacherCopilotApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiTeacherCopilotApplication.class, args);
    }
}
