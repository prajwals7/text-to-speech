from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.claude_service import claude_service

router = APIRouter(prefix="/api/llm", tags=["LLM Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatStreamRequest(BaseModel):
    messages: List[ChatMessage]
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024

@router.post("/chat/stream")
async def stream_chat(request: ChatStreamRequest):
    try:
        dict_messages = [{"role": m.role, "content": m.content} for m in request.messages]
        stream_gen = claude_service.stream_chat(
            messages=dict_messages,
            system_prompt=request.system_prompt or "",
            model=request.model or "",
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 1024,
        )

        return StreamingResponse(
            stream_gen,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM streaming error: {str(e)}")
