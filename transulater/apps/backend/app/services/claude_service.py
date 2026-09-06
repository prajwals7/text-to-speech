import asyncio
import json
from typing import AsyncGenerator, List, Dict
from anthropic import AsyncAnthropic
from app.config import settings

class ClaudeService:
    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.client = AsyncAnthropic(api_key=self.api_key) if self.api_key else None

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model: str = "",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        chosen_model = model or settings.anthropic_model or "claude-3-5-sonnet-20241022"

        # If Anthropic API key is configured, stream from Claude
        if self.client and self.api_key:
            try:
                # Format messages for Anthropic SDK (role: 'user' | 'assistant')
                anthropic_messages = []
                for msg in messages:
                    if msg.get("role") in ["user", "assistant"]:
                        anthropic_messages.append({
                            "role": msg["role"],
                            "content": msg["content"],
                        })

                if not anthropic_messages:
                    anthropic_messages = [{"role": "user", "content": "Hello"}]

                async with self.client.messages.stream(
                    model=chosen_model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=anthropic_messages,
                ) as stream:
                    async for text in stream.text_stream:
                        yield f"data: {json.dumps({'delta': text})}\n\n"
                    yield "data: [DONE]\n\n"
                return
            except Exception as e:
                error_msg = f"Claude API call failed: {str(e)}"
                print(f"[ERROR] {errorMsg}")
                yield f"data: {json.dumps({'delta': f' (Error: {error_msg})'})}\n\n"
                yield "data: [DONE]\n\n"
                return

        # Fallback informative mock streaming if no ANTHROPIC_API_KEY is configured yet
        user_query = messages[-1].get("content", "hello") if messages else "hello"
        fallback_text = (
            f"Hello! I heard your message: \"{user_query}\". "
            "Your voice pipeline is working smoothly! "
            "To unlock full conversational intelligence with Claude Sonnet 4.6, "
            "please add your ANTHROPIC_API_KEY to the .env file or Settings panel."
        )

        # Simulate natural streaming
        words = fallback_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'delta': chunk})}\n\n"
            await asyncio.sleep(0.04)

        yield "data: [DONE]\n\n"

claude_service = ClaudeService()
