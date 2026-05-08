from __future__ import annotations

import ast
import json
import operator
from typing import Any

from langchain_core.tools import tool

from app.storage import db, vector

_SAFE_BINOPS: dict[type, Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_SAFE_UNARY: dict[type, Any] = {ast.UAdd: operator.pos, ast.USub: operator.neg}


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp) and type(node.op) in _SAFE_BINOPS:
        return _SAFE_BINOPS[type(node.op)](_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _SAFE_UNARY:
        return _SAFE_UNARY[type(node.op)](_eval_node(node.operand))
    raise ValueError(f"Unsupported expression element: {ast.dump(node)}")


@tool
def calculator(expression: str) -> str:
    """Evaluate a numeric expression safely.

    Supports +, -, *, /, //, %, ** and parentheses on numeric literals.
    Example: '1234.56 * 0.15' or '(120 + 80) / 2'.
    """
    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval_node(tree.body)
        return f"{result}"
    except Exception as e:
        return f"ERROR: {e}"


@tool
def query_transactions_sql(sql: str) -> str:
    """Run a read-only SELECT (or WITH ... SELECT) against the `transactions` table.

    Schema:
      id BIGINT, date DATE, description VARCHAR, amount DOUBLE,
      category VARCHAR, source_file VARCHAR

    `amount` is signed: negative = expense, positive = income.
    Returns up to 100 rows as JSON. INSERT/UPDATE/DELETE/DDL are rejected.
    """
    try:
        cols, rows = db.run_select(sql)
    except Exception as e:
        return f"ERROR: {e}"
    rows = rows[:100]
    payload = {
        "columns": cols,
        "rows": [[_jsonable(v) for v in row] for row in rows],
        "row_count": len(rows),
    }
    return json.dumps(payload, default=str)


@tool
def search_transactions_semantic(query: str, k: int = 8) -> str:
    """Semantic search over transaction descriptions (vector similarity).

    Use for fuzzy concept queries like "coffee shops" or "streaming subscriptions"
    where exact category/description filtering won't work. Returns up to `k` matches.
    """
    try:
        results = vector.semantic_search(query, k=k)
    except Exception as e:
        return f"ERROR: {e}"
    if not results:
        return json.dumps({"results": [], "note": "no transactions indexed yet"})
    return json.dumps({"results": results}, default=str)


def _jsonable(v: Any) -> Any:
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return v


ALL_TOOLS = [query_transactions_sql, search_transactions_semantic, calculator]
