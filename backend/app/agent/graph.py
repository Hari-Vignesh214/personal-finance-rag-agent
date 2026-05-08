from __future__ import annotations

from functools import lru_cache

from langchain_anthropic import ChatAnthropic
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import ALL_TOOLS
from app.config import settings


@lru_cache(maxsize=1)
def get_agent():
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    llm = ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0,
        max_tokens=4096,
    )
    checkpointer = MemorySaver()
    return create_react_agent(
        llm,
        tools=ALL_TOOLS,
        prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )


def run_agent(message: str, thread_id: str) -> dict:
    """Run the agent and return the final reply plus any tool calls made."""
    agent = get_agent()
    config = {"configurable": {"thread_id": thread_id}}
    result = agent.invoke({"messages": [{"role": "user", "content": message}]}, config=config)

    messages = result.get("messages", [])
    reply = ""
    tool_calls: list[dict] = []
    for msg in messages:
        msg_type = getattr(msg, "type", None) or msg.__class__.__name__.lower()
        if msg_type in ("ai", "aimessage"):
            calls = getattr(msg, "tool_calls", None) or []
            for c in calls:
                tool_calls.append(
                    {"name": c.get("name"), "args": c.get("args", {})}
                )
            content = getattr(msg, "content", "")
            if isinstance(content, list):
                text_parts = [
                    p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text"
                ]
                content = "".join(text_parts)
            if content:
                reply = content

    return {"reply": reply, "tool_calls": tool_calls}
