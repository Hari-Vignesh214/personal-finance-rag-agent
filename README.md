# Personal Finance RAG Agent

A natural-language interface for your bank and credit-card statements. Upload a PDF;
ask questions like *"how much did I spend on dining in Q1?"* or *"find subscriptions
I forgot about"* and get answers grounded in your actual transaction history.

Built end-to-end as a portfolio project demonstrating **agentic LLMs**, **structured
output**, **hybrid retrieval (SQL + vector)**, and **tool use** — all wired together
with LangGraph and Claude Sonnet.

> Phase 1 (this repo): Python backend — FastAPI + LangGraph agent + DuckDB + Chroma.
> Phase 2 (planned): Next.js frontend.

---

## Architecture

```
                ┌─────────────────────┐
   PDF upload ─►│  pdfplumber → text  │
                └─────────┬───────────┘
                          ▼
                ┌─────────────────────┐
                │  Claude (structured │  ← Pydantic schema enforces
                │  output: Tx list)   │    typed, categorized rows
                └─────────┬───────────┘
                          ▼
              ┌───────────┴────────────┐
              ▼                        ▼
       ┌────────────┐            ┌────────────┐
       │  DuckDB    │            │  Chroma    │
       │ (SQL store)│            │ (vector    │
       └─────┬──────┘            │  index)    │
             │                   └─────┬──────┘
             │                         │
             └──────────┬──────────────┘
                        ▼
            ┌──────────────────────────┐
            │   LangGraph ReAct agent  │
            │  ┌────────────────────┐  │
            │  │ tool: SQL query    │  │
            │  │ tool: vector search│  │
            │  │ tool: calculator   │  │
            │  └────────────────────┘  │
            └────────────┬─────────────┘
                         ▼
                  natural-language
                       answer
```

**Why hybrid retrieval?** SQL is exact and great for *"sum dining in March"*. Vector
search is fuzzy and great for *"find every coffee purchase"* (which won't all be
categorized as `dining`). The agent picks the right tool for each question.

---

## Stack

| Layer            | Tech                                            |
|------------------|-------------------------------------------------|
| LLM              | Claude Sonnet 4.6 (Anthropic API)               |
| Agent framework  | LangGraph (`create_react_agent` + checkpointer) |
| Structured I/O   | Pydantic v2 + `with_structured_output`          |
| Relational store | DuckDB                                          |
| Vector store     | Chroma (persistent)                             |
| PDF parsing      | pdfplumber                                      |
| API              | FastAPI + Uvicorn                               |
| Frontend (Phase 2)| Next.js                                        |

---

## Setup

Requires Python 3.11+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
uvicorn app.main:app --reload
```

The API will be at `http://localhost:8000` and interactive docs at
`http://localhost:8000/docs`.

---

## Usage

### Upload a statement

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@backend/tests/sample_statement.txt"
```

Response:

```json
{
  "filename": "sample_statement.txt",
  "transactions_extracted": 19,
  "transactions": [
    {"id": 1, "date": "2026-04-02", "description": "STARBUCKS STORE #1234 SEATTLE WA",
     "amount": -6.45, "category": "dining", "source_file": "sample_statement.txt"},
    ...
  ]
}
```

### Ask a question

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend on dining in April 2026?"}'
```

Response includes the agent's reply *and* a trace of the tools it called:

```json
{
  "reply": "You spent $41.80 on dining in April 2026 across 4 transactions...",
  "tool_calls": [
    {"name": "query_transactions_sql", "args": {"sql": "SELECT SUM(amount) ..."}}
  ],
  "thread_id": "a1b2c3..."
}
```

Pass the same `thread_id` back on subsequent requests to keep conversational memory.

### Example queries

- "What were my top 3 spending categories last month?"
- "Find subscriptions I might have forgotten about."
- "How much would I save in a year if I cut coffee shop spending in half?"
- "What's my average grocery spend per week?"
- "Show me anything that looks unusual."

---

## Project layout

```
backend/
├── app/
│   ├── main.py              # FastAPI entrypoint, CORS, routers
│   ├── config.py            # pydantic-settings + .env loading
│   ├── models.py            # Pydantic schemas (Transaction, ChatRequest, ...)
│   ├── agent/
│   │   ├── graph.py         # LangGraph ReAct agent + memory checkpointer
│   │   ├── tools.py         # SQL, vector, calculator tools (LangChain @tool)
│   │   └── prompts.py       # System prompt
│   ├── ingestion/
│   │   ├── pdf_parser.py    # pdfplumber → text
│   │   └── extractor.py     # text → TransactionList (structured output)
│   ├── storage/
│   │   ├── db.py            # DuckDB schema, insert, read-only SELECT runner
│   │   └── vector.py        # Chroma collection wrapper
│   └── api/
│       ├── upload.py        # POST /api/upload
│       └── chat.py          # POST /api/chat
└── tests/
    ├── test_smoke.py        # No-API-key smoke tests (DB, SQL guard, calculator)
    └── sample_statement.txt # Fake statement for local testing
```

---

## Design notes

- **The SQL tool is read-only.** `db.run_select` rejects anything that isn't a `SELECT`
  or `WITH ... SELECT`, and screens for forbidden keywords. The agent cannot mutate
  data — even if it tried.
- **The calculator tool is AST-restricted.** `eval` is never used; only numeric
  literals and arithmetic operators are accepted, so `__import__` and friends won't
  parse.
- **Conversation memory** is held in-process via LangGraph's `MemorySaver`. Pass a
  stable `thread_id` to continue a conversation. (Production would swap this for a
  persistent checkpointer.)
- **Statements are LLM-parsed**, not regex-parsed. Bank PDF formats vary wildly;
  letting Claude do the structured extraction (constrained by a Pydantic schema) is
  far more robust than trying to write per-bank parsers.
- **Categorization is part of extraction**, not a second pass — Claude assigns a
  category in the same call that pulls out the row, so we save a roundtrip.

---

## Tests

Smoke tests run without an API key (they don't hit the LLM):

```bash
cd backend
pytest tests/ -v
```

End-to-end testing (extraction + agent) requires `ANTHROPIC_API_KEY` and is best done
via the running API.

---

## Roadmap

- [ ] **Phase 2: Next.js frontend** — chat UI + upload dropzone + transaction table.
- [ ] Streaming chat responses (SSE) instead of single-shot.
- [ ] Persistent agent checkpointer (Postgres / SQLite).
- [ ] Multi-account support with account-level filtering.
- [ ] CSV upload alongside PDF.
- [ ] Auto-detect duplicate transactions across overlapping statements.

---

## License

MIT
