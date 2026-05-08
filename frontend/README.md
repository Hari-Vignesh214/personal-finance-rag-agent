# Frontend

Next.js (App Router) chat UI for the personal finance agent. See the
[root README](../README.md) for the full project.

## Stack

- Next.js 16 + React 19 (App Router)
- TypeScript
- Tailwind CSS v4

## Quick start

The backend must be running first (see [backend/README.md](../backend/README.md)).

```bash
npm install
cp .env.local.example .env.local
# edit .env.local if your backend isn't on http://localhost:8000
npm run dev
```

Open <http://localhost:3000>.

## Layout

```
app/
├── layout.tsx              # root layout, fonts, metadata
├── page.tsx                # main 3-column app
└── globals.css             # Tailwind import + theme tokens

components/
├── Chat.tsx                # message thread, suggestions, input
├── ToolCallTrace.tsx       # expandable trace below assistant replies
├── UploadDropzone.tsx      # drag/drop or click to upload PDF/.txt
├── TransactionTable.tsx    # filterable table with category pills
└── HealthBadge.tsx         # backend status + model + indexed count

lib/
├── api.ts                  # fetch wrappers for /api/*
└── types.ts                # TS mirrors of backend Pydantic models
```

## Env

| Variable             | Default                 | Notes                        |
|----------------------|-------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL`| `http://localhost:8000` | Backend FastAPI base URL.    |

## Notes

- All components that hit the API are client components (`"use client"`).
- The chat keeps a `thread_id` in component state; resetting the page resets the conversation.
- Uploading a statement triggers a `refreshKey` bump that re-fetches the transaction table and the health badge.
