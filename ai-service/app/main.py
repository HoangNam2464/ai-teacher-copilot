"""
AI Teacher Copilot — FastAPI AI Service Entry Point.

Responsible for:
- Document processing (parsing, chunking, embedding)
- Retrieval / RAG
- LLM integration & structured generation
- AI evaluation
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import init_db, close_db
from app.api.routes import health, ingestion, retrieval, generation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    setup_logging()
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="AI Teacher Copilot — AI Service",
    description="Internal AI service for document processing, RAG, and content generation",
    version="0.1.0",
    docs_url="/docs" if settings.FASTAPI_ENV == "development" else None,
    lifespan=lifespan,
)

# CORS — only needed if accessed directly during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, tags=["Health"])
app.include_router(ingestion.router, prefix="/ingestion", tags=["Ingestion"])
app.include_router(retrieval.router, prefix="/retrieval", tags=["Retrieval"])
app.include_router(generation.router, prefix="/generation", tags=["Generation"])
