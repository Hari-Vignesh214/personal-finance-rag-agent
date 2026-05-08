from __future__ import annotations

from typing import Iterable

import chromadb

from app.config import settings
from app.models import StoredTransaction

_COLLECTION = "transactions"


def _client() -> chromadb.PersistentClient:
    settings.ensure_dirs()
    return chromadb.PersistentClient(path=settings.chroma_path)


def _collection():
    return _client().get_or_create_collection(_COLLECTION)


def _document_for(tx: StoredTransaction) -> str:
    sign = "expense" if tx.amount < 0 else "income"
    return (
        f"{tx.date.isoformat()} | {tx.description} | "
        f"{sign} ${abs(tx.amount):.2f} | category: {tx.category}"
    )


def index_transactions(txs: Iterable[StoredTransaction]) -> int:
    txs = list(txs)
    if not txs:
        return 0
    coll = _collection()
    coll.add(
        ids=[str(t.id) for t in txs],
        documents=[_document_for(t) for t in txs],
        metadatas=[
            {
                "date": t.date.isoformat(),
                "amount": float(t.amount),
                "category": t.category,
                "source_file": t.source_file or "",
            }
            for t in txs
        ],
    )
    return len(txs)


def semantic_search(query: str, k: int = 8) -> list[dict]:
    coll = _collection()
    if coll.count() == 0:
        return []
    res = coll.query(query_texts=[query], n_results=min(k, coll.count()))
    out: list[dict] = []
    ids = res.get("ids", [[]])[0]
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]
    for i, doc, meta, dist in zip(ids, docs, metas, dists):
        out.append({"id": i, "document": doc, "metadata": meta, "distance": dist})
    return out
