from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, transactions, upload
from app.config import settings
from app.storage import db

app = FastAPI(
    title="Personal Finance RAG Agent",
    description="Upload bank statements; ask questions in natural language.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(transactions.router)


@app.on_event("startup")
def _startup() -> None:
    settings.ensure_dirs()
    db.get_connection().close()


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "model": settings.anthropic_model,
        "transactions_indexed": db.count_transactions(),
    }


@app.get("/")
def root() -> dict:
    return {
        "name": "personal-finance-rag-agent",
        "docs": "/docs",
        "endpoints": ["/api/health", "/api/upload", "/api/chat", "/api/transactions"],
    }
