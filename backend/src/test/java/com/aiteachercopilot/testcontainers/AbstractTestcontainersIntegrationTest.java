package com.aiteachercopilot.testcontainers;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Abstract Base Class for Testcontainers Integration Tests [BE-032].
 *
 * Guarantees:
 * 1. Automatic container lifecycle management (PostgreSQL 16 + pgvector, MinIO).
 * 2. Dynamic datasource and S3 configuration injection.
 * 3. Strict database isolation between tests via table truncation.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractTestcontainersIntegrationTest {

    @Autowired(required = false)
    protected JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        TestcontainersConfig.registerDynamicProperties(registry);
    }

    @BeforeEach
    void setUpDatabaseIsolation() {
        if (jdbcTemplate != null) {
            TestcontainersConfig.cleanDatabase(jdbcTemplate);
        }
    }

    @AfterEach
    void tearDownDatabaseIsolation() {
        if (jdbcTemplate != null) {
            TestcontainersConfig.cleanDatabase(jdbcTemplate);
        }
    }
}
