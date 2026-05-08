from __future__ import annotations

from pathlib import Path

import pdfplumber


def extract_text(pdf_path: str | Path) -> str:
    """Extract all text from a PDF, joined page by page."""
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(path)

    pages: list[str] = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append(f"--- Page {i} ---\n{text}")
    return "\n\n".join(pages)


def extract_text_from_bytes(data: bytes) -> str:
    """Extract text from raw PDF bytes (e.g. an upload)."""
    import io

    pages: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append(f"--- Page {i} ---\n{text}")
    return "\n\n".join(pages)
