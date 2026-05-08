from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.ingestion import extractor, pdf_parser
from app.models import UploadResponse
from app.storage import db, vector

router = APIRouter(prefix="/api", tags=["ingestion"])


@router.post("/upload", response_model=UploadResponse)
async def upload_statement(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename or not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(400, "Only .pdf and .txt files are supported")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")

    settings.ensure_dirs()
    saved_path = Path(settings.upload_dir) / file.filename
    saved_path.write_bytes(data)

    if file.filename.lower().endswith(".pdf"):
        try:
            text = pdf_parser.extract_text_from_bytes(data)
        except Exception as e:
            raise HTTPException(400, f"Failed to parse PDF: {e}")
    else:
        text = data.decode("utf-8", errors="replace")

    if not text.strip():
        raise HTTPException(400, "No extractable text found in file")

    try:
        tx_list = extractor.extract_transactions(text)
    except Exception as e:
        raise HTTPException(500, f"LLM extraction failed: {e}")

    stored = db.insert_transactions(tx_list.transactions, source_file=file.filename)
    vector.index_transactions(stored)

    return UploadResponse(
        filename=file.filename,
        transactions_extracted=len(stored),
        transactions=stored,
    )
