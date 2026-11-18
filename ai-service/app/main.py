"""
AI Teacher Copilot — FastAPI AI Service Entry Point.

Responsible for:
- Document processing (parsing, chunking, embedding)
- Retrieval / RAG
- LLM integration & structured generation
- AI evaluation
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import init_db, close_db
from app.api.routes import health, ingestion, retrieval, generation, evaluation
from app.ingestion.exceptions import (
    DocumentIngestionError,
    CorruptFileError,
    EmptyTextError,
)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CorruptFileError)
async def corrupt_file_handler(request: Request, exc: CorruptFileError):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": exc.message, "error_code": exc.error_code}
    )


@app.exception_handler(EmptyTextError)
async def empty_text_handler(request: Request, exc: EmptyTextError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": exc.message, "error_code": exc.error_code}
    )


@app.exception_handler(DocumentIngestionError)
async def document_ingestion_handler(request: Request, exc: DocumentIngestionError):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": exc.message, "error_code": exc.error_code}
    )


app.include_router(health.router, tags=["Health"])
app.include_router(ingestion.router, prefix="/ingestion", tags=["Ingestion"])
app.include_router(retrieval.router, prefix="/retrieval", tags=["Retrieval"])
app.include_router(generation.router, prefix="/generation", tags=["Generation"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])
