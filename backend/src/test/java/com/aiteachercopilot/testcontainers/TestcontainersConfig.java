package com.aiteachercopilot.testcontainers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.List;

/**
 * Testcontainers Integration Test Harness Configuration [BE-032].
 *
 * Provides:
 * 1. Managed PostgreSQL 16 container with pgvector extension support.
 * 2. Managed MinIO object storage container for S3 file upload/export tests.
 * 3. Dynamic Spring datasource and MinIO properties registration.
 * 4. Database test isolation utility to truncate tables between test executions.
 * 5. Docker availability check to gracefully handle non-Docker execution environments.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    private static final Logger log = LoggerFactory.getLogger(TestcontainersConfig.class);

    public static final String PGVECTOR_IMAGE = "pgvector/pgvector:pg16";
    public static final String POSTGRES_FALLBACK_IMAGE = "postgres:16-alpine";
    public static final String MINIO_IMAGE = "minio/minio:latest";

    private static final boolean DOCKER_AVAILABLE;

    public static PostgreSQLContainer<?> postgresContainer;
    public static GenericContainer<?> minioContainer;

    static {
        boolean available = false;
        try {
            available = DockerClientFactory.instance().isDockerAvailable();
            if (available) {
                log.info("Docker daemon detected. Initializing Testcontainers harness for PostgreSQL and MinIO...");

                // 1. PostgreSQL + pgvector Container
                DockerImageName pgImage = DockerImageName.parse(PGVECTOR_IMAGE)
                        .asCompatibleSubstituteFor("postgres");

                postgresContainer = new PostgreSQLContainer<>(pgImage)
                        .withDatabaseName("aiteachercopilot_test")
                        .withUsername("testuser")
                        .withPassword("testpassword")
                        .withReuse(false);
                postgresContainer.start();
                log.info("PostgreSQL Testcontainer started at: {}", postgresContainer.getJdbcUrl());

                // 2. MinIO S3 Container
                minioContainer = new GenericContainer<>(DockerImageName.parse(MINIO_IMAGE))
                        .withEnv("MINIO_ROOT_USER", "minioadmin")
                        .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
                        .withCommand("server /data")
                        .withExposedPorts(9000)
                        .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000).withStartupTimeout(Duration.ofSeconds(30)));
                minioContainer.start();
                log.info("MinIO Testcontainer started at: {}:{}", minioContainer.getHost(), minioContainer.getMappedPort(9000));
            } else {
                log.warn("Docker daemon not available. Testcontainers harness will be disabled for this environment.");
            }
        } catch (Throwable t) {
            log.warn("Unable to start Testcontainers (Docker not accessible or failed to start: {}). Using in-memory fallback.", t.getMessage());
            available = false;
        }
        DOCKER_AVAILABLE = available;
    }

    public static boolean isDockerAvailable() {
        return DOCKER_AVAILABLE && postgresContainer != null && postgresContainer.isRunning();
    }

    /**
     * Registers dynamic connection properties from active containers into Spring environment.
     */
    @DynamicPropertySource
    public static void registerDynamicProperties(DynamicPropertyRegistry registry) {
        if (isDockerAvailable()) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
            registry.add("spring.datasource.username", postgresContainer::getUsername);
            registry.add("spring.datasource.password", postgresContainer::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");

            if (minioContainer != null && minioContainer.isRunning()) {
                String minioEndpoint = "http://" + minioContainer.getHost() + ":" + minioContainer.getMappedPort(9000);
                registry.add("app.minio.endpoint", () -> minioEndpoint);
                registry.add("app.minio.access-key", () -> "minioadmin");
                registry.add("app.minio.secret-key", () -> "minioadmin");
            }
        }
    }

    /**
     * Truncates application tables in reverse foreign key order to guarantee test isolation (AC-4).
     */
    public static void cleanDatabase(JdbcTemplate jdbcTemplate) {
        if (jdbcTemplate == null) {
            return;
        }

        List<String> tables = List.of(
                "content_citations",
                "generated_contents",
                "document_chunks",
                "documents",
                "workspaces",
                "users"
        );

        for (String table : tables) {
            try {
                jdbcTemplate.execute("TRUNCATE TABLE " + table + " CASCADE");
            } catch (Exception e) {
                // Ignore if table does not exist in lightweight test schemas
                try {
                    jdbcTemplate.execute("DELETE FROM " + table);
                } catch (Exception ignored) {
                }
            }
        }
    }
}
