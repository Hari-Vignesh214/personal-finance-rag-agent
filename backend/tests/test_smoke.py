"""Smoke tests that don't require an Anthropic API key."""
from __future__ import annotations

import os
import tempfile
from datetime import date

import pytest


@pytest.fixture(autouse=True)
def _isolated_paths(monkeypatch):
    tmp = tempfile.mkdtemp()
    monkeypatch.setenv("DUCKDB_PATH", os.path.join(tmp, "test.duckdb"))
    monkeypatch.setenv("CHROMA_PATH", os.path.join(tmp, "chroma"))
    monkeypatch.setenv("UPLOAD_DIR", os.path.join(tmp, "uploads"))
    from app import config as cfg

    cfg.settings = cfg.Settings()
    yield


def test_db_insert_and_query():
    from app.models import Transaction
    from app.storage import db

    txs = [
        Transaction(date=date(2026, 1, 5), description="Starbucks", amount=-5.50, category="dining"),
        Transaction(date=date(2026, 1, 6), description="Payroll", amount=2500.00, category="income"),
        Transaction(date=date(2026, 1, 7), description="Whole Foods", amount=-87.32, category="groceries"),
    ]
    stored = db.insert_transactions(txs, source_file="test.pdf")
    assert len(stored) == 3
    assert all(s.id > 0 for s in stored)

    cols, rows = db.run_select(
        "SELECT category, ROUND(SUM(amount), 2) FROM transactions WHERE amount < 0 GROUP BY category"
    )
    assert "category" in cols
    cats = {r[0]: r[1] for r in rows}
    assert cats["dining"] == -5.50
    assert cats["groceries"] == -87.32


def test_sql_rejects_writes():
    from app.storage import db

    for bad in ["DELETE FROM transactions", "DROP TABLE transactions", "INSERT INTO transactions VALUES (1)"]:
        with pytest.raises(ValueError):
            db.run_select(bad)


def test_calculator_safe():
    from app.agent.tools import calculator

    assert calculator.invoke({"expression": "1234.56 * 0.15"}) == "185.184"
    assert calculator.invoke({"expression": "(120 + 80) / 2"}) == "100.0"
    err = calculator.invoke({"expression": "__import__('os').system('ls')"})
    assert err.startswith("ERROR")
