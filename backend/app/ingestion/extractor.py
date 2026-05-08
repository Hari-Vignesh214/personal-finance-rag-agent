from __future__ import annotations

from langchain_anthropic import ChatAnthropic

from app.config import settings
from app.models import TransactionList

_SYSTEM = """You are a financial-statement parser. The user will paste raw text \
extracted from a bank or credit-card statement PDF. Your job is to identify every \
transaction line and return a clean, structured list.

Rules:
- Output one entry per transaction. Skip headers, footers, balances, page numbers, \
and summary rows.
- `amount` is signed: NEGATIVE for money leaving the account (purchases, withdrawals, \
fees, payments going out) and POSITIVE for money arriving (deposits, refunds, payroll).
- For credit-card statements, treat purchases as negative and payments/credits to the \
card as positive (from the cardholder's spending perspective).
- Use ISO date format (YYYY-MM-DD). If the year is not on the line, infer it from the \
statement period in the document text.
- `description` should be the merchant or memo as written, trimmed of leading/trailing \
whitespace and reference numbers when obvious.
- Pick the single best `category`. Use `other` only when nothing fits.
- Do NOT invent transactions. If the text contains zero parseable transactions, return \
an empty list.
"""


def extract_transactions(statement_text: str) -> TransactionList:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    llm = ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0,
        max_tokens=8192,
    )
    structured = llm.with_structured_output(TransactionList)
    result = structured.invoke(
        [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": statement_text},
        ]
    )
    return result  # type: ignore[return-value]
