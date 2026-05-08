from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from app.agent.graph import run_agent
from app.models import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    if not req.message.strip():
        raise HTTPException(400, "Empty message")

    thread_id = req.thread_id or uuid.uuid4().hex
    try:
        result = run_agent(req.message, thread_id=thread_id)
    except Exception as e:
        raise HTTPException(500, f"Agent error: {e}")

    return ChatResponse(reply=result["reply"], tool_calls=result["tool_calls"], thread_id=thread_id)
