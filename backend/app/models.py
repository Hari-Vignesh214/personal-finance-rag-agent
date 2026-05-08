from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

Category = Literal[
    "groceries",
    "dining",
    "transport",
    "entertainment",
    "utilities",
    "rent_housing",
    "healthcare",
    "shopping",
    "subscriptions",
    "travel",
    "transfer",
    "income",
    "fees",
    "other",
]


class Transaction(BaseModel):
    """A single financial transaction extracted from a statement."""

    date: date = Field(description="Posting date of the transaction")
    description: str = Field(description="Merchant or description as it appears on the statement")
    amount: float = Field(
        description="Signed amount in account currency. Negative = money out (expense), positive = money in (income/refund)."
    )
    category: Category = Field(description="High-level spending category")


class TransactionList(BaseModel):
    transactions: list[Transaction]


class StoredTransaction(Transaction):
    id: int
    source_file: Optional[str] = None


class UploadResponse(BaseModel):
    filename: str
    transactions_extracted: int
    transactions: list[StoredTransaction]


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = Field(default=None, description="Conversation id for memory")


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[dict] = Field(default_factory=list)
    thread_id: str
