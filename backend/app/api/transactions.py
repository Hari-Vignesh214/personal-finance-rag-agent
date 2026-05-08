from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Query

from app.models import StoredTransaction
from app.storage import db

router = APIRouter(prefix="/api", tags=["transactions"])


@router.get("/transactions", response_model=list[StoredTransaction])
def list_transactions(
    limit: int = Query(default=200, ge=1, le=2000),
    category: str | None = None,
    since: date | None = None,
) -> list[StoredTransaction]:
    sql = "SELECT id, date, description, amount, category, source_file FROM transactions"
    clauses: list[str] = []
    params: list = []
    if category:
        clauses.append("category = ?")
        params.append(category)
    if since:
        clauses.append("date >= ?")
        params.append(since)
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY date DESC, id DESC LIMIT ?"
    params.append(limit)

    cols, rows = db.run_select(sql, params)
    return [
        StoredTransaction(
            id=r[0], date=r[1], description=r[2], amount=r[3], category=r[4], source_file=r[5]
        )
        for r in rows
    ]
