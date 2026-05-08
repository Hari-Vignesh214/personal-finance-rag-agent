from __future__ import annotations

from typing import Any, Iterable

import duckdb

from app.config import settings
from app.models import StoredTransaction, Transaction

_SCHEMA = """
CREATE SEQUENCE IF NOT EXISTS seq_tx_id START 1;
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT PRIMARY KEY,
    date DATE NOT NULL,
    description VARCHAR NOT NULL,
    amount DOUBLE NOT NULL,
    category VARCHAR NOT NULL,
    source_file VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
"""


def get_connection() -> duckdb.DuckDBPyConnection:
    settings.ensure_dirs()
    conn = duckdb.connect(settings.duckdb_path)
    conn.execute(_SCHEMA)
    return conn


def insert_transactions(
    txs: Iterable[Transaction], source_file: str | None = None
) -> list[StoredTransaction]:
    conn = get_connection()
    stored: list[StoredTransaction] = []
    try:
        for tx in txs:
            row = conn.execute(
                """
                INSERT INTO transactions (id, date, description, amount, category, source_file)
                VALUES (nextval('seq_tx_id'), ?, ?, ?, ?, ?)
                RETURNING id
                """,
                [tx.date, tx.description, tx.amount, tx.category, source_file],
            ).fetchone()
            stored.append(StoredTransaction(id=row[0], source_file=source_file, **tx.model_dump()))
    finally:
        conn.close()
    return stored


def run_select(sql: str, params: list[Any] | None = None) -> tuple[list[str], list[tuple]]:
    """Execute a read-only SELECT and return (columns, rows). Rejects non-SELECT statements."""
    stripped = sql.strip().rstrip(";").strip()
    lowered = stripped.lower()
    if not lowered.startswith(("select", "with")):
        raise ValueError("Only SELECT/WITH queries are allowed.")
    forbidden = (
        "insert ",
        "update ",
        "delete ",
        "drop ",
        "alter ",
        "create ",
        "attach ",
        "copy ",
        "pragma ",
    )
    if any(tok in lowered for tok in forbidden):
        raise ValueError("Statement contains forbidden keywords.")

    conn = get_connection()
    try:
        cur = conn.execute(stripped, params or [])
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = cur.fetchall()
        return cols, rows
    finally:
        conn.close()


def count_transactions() -> int:
    conn = get_connection()
    try:
        (n,) = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()
        return int(n)
    finally:
        conn.close()
