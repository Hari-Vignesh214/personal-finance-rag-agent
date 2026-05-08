# Backend

FastAPI + LangGraph + DuckDB + Chroma. See the [root README](../README.md) for the full
project overview, architecture, and example queries.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# set ANTHROPIC_API_KEY in .env
uvicorn app.main:app --reload
```

Then open <http://localhost:8000/docs>.

## Tests

```bash
pytest tests/ -v
```

The smoke tests don't require an API key.
