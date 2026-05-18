export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamSarvamChatOptions {
  messages: ChatMessage[];
  apiKey: string;
  signal?: AbortSignal;
  onChunk: (content: string) => void;
  onReasoningChunk?: (content: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
  /** Defaults to "/api/chat" which proxies to Sarvam */
  apiUrl?: string;
  /** Defaults to "sarvam-105b" */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  reasoningEffort?: "low" | "medium" | "high";
}

export async function streamSarvamChat({
  messages,
  apiKey,
  signal,
  onChunk,
  onReasoningChunk,
  onError,
  onFinish,
  apiUrl = "/api/chat",
  model = "sarvam-105b",
  temperature = 0.8,
  maxTokens = 4096,
  topP = 1,
  reasoningEffort = "medium",
}: StreamSarvamChatOptions) {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "API-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        stream: true,
        reasoning_effort: reasoningEffort,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body returned from the API.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isReasoning = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      let contentBatch = "";
      let reasoningBatch = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") break;

        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta;
          
          if (delta?.reasoning_content) {
            if (!isReasoning) {
              isReasoning = true;
              if (!onReasoningChunk) {
                contentBatch += "> **Thinking Process**\n> \n> ";
              }
            }
            if (onReasoningChunk) {
              reasoningBatch += delta.reasoning_content;
            } else {
              contentBatch += delta.reasoning_content.replace(/\n/g, "\n> ");
            }
          } else if (delta?.content) {
            if (isReasoning) {
              isReasoning = false;
              if (!onReasoningChunk) {
                contentBatch += "\n\n---\n\n";
              }
            }
            contentBatch += delta.content;
          }
        } catch (e) {
          console.error("Error parsing streaming chunk", e, "Data:", data);
        }
      }

      if (reasoningBatch && onReasoningChunk) {
        onReasoningChunk(reasoningBatch);
      }
      if (contentBatch) {
        onChunk(contentBatch);
      }
    }

    onFinish?.();
  } catch (error: any) {
    if (error.name === "AbortError") {
      // Stream manually aborted, not a real error
      onFinish?.();
    } else {
      onError?.(error);
    }
  }
}
