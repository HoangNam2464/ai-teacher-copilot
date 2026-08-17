"""
Async database connection using SQLAlchemy + asyncpg.
Provides session management for the AI service.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import structlog

from app.core.config import settings

logger = structlog.get_logger()

engine = create_async_engine(
    settings.database_url,
    echo=settings.FASTAPI_ENV == "development",
    pool_size=5,
    max_overflow=10,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    """Verify database connectivity on startup."""
    try:
        async with engine.begin() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        logger.info("database_connected", url=settings.POSTGRES_HOST)
    except Exception as e:
        logger.error("database_connection_failed", error=str(e))
        raise


async def close_db() -> None:
    """Close database connections on shutdown."""
    await engine.dispose()
    logger.info("database_disconnected")


async def get_db() -> AsyncSession:
    """Dependency — yields a database session."""
    async with async_session() as session:
        yield session
