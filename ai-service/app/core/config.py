from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """AI Service configuration — all values from environment."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "aiteachercopilot"
    POSTGRES_USER: str = "aiteacher"
    POSTGRES_PASSWORD: str = "changeme_db_password"

    FASTAPI_PORT: int = 8000
    FASTAPI_ENV: str = "development"
    AI_SERVICE_API_KEY: str = "changeme_internal_api_key"

    AI_PROVIDER: str = "gemini"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "changeme_minio_password"
    MINIO_BUCKET_DOCUMENTS: str = "documents"

    @property
    def database_url(self) -> str:
        """Async PostgreSQL connection URL."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url_sync(self) -> str:
        """Sync PostgreSQL connection URL (for migrations/scripts)."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

settings = Settings()
