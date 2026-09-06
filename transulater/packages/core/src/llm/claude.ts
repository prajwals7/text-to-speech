import { LLMConfig, LLMMessage, LLMStreamChunk } from '../types/llm';

export class ClaudeLLMClient {
  private config: LLMConfig;
  private conversationHistory: LLMMessage[] = [];
  private abortController: AbortController | null = null;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getHistory(): LLMMessage[] {
    return [...this.conversationHistory];
  }

  public clearHistory(): void {
    this.conversationHistory = [];
  }

  public addMessage(message: LLMMessage): void {
    this.conversationHistory.push(message);
  }

  public async streamChat(
    userPrompt: string,
    onChunk: (chunk: LLMStreamChunk) => void,
    systemPromptOverride?: string
  ): Promise<string> {
    this.abort();
    this.abortController = new AbortController();

    // Append user message to history
    this.conversationHistory.push({ role: 'user', content: userPrompt });

    const endpoint = this.config.endpointUrl || 'http://localhost:8000/api/llm/chat/stream';
    let fullResponse = '';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          messages: this.conversationHistory,
          model: this.config.model,
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 1024,
          system_prompt: systemPromptOverride || this.config.systemPrompt,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(`Claude API error (${response.status}): ${errorMsg}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              onChunk({ delta: '', fullText: fullResponse, done: true });
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.delta || parsed.text || '';
              if (delta) {
                fullResponse += delta;
                onChunk({ delta, fullText: fullResponse, done: false });
              }
            } catch {
              // Direct text line
              fullResponse += dataStr;
              onChunk({ delta: dataStr, fullText: fullResponse, done: false });
            }
          }
        }
      }

      // Add assistant response to history
      this.conversationHistory.push({ role: 'assistant', content: fullResponse });
      onChunk({ delta: '', fullText: fullResponse, done: true });
      return fullResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return fullResponse;
      }
      console.error('Claude LLM streaming error:', err);
      throw err;
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
