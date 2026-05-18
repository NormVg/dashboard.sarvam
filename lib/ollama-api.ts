import { ChatMessage } from "./sarvam-api";

export interface OllamaCapabilities {
  vision: boolean;
  thinking: boolean;
}

export function detectOllamaCapabilities(modelName: string): OllamaCapabilities {
  const name = (modelName || "").toLowerCase();
  return {
    vision: name.includes("vision") || name.includes("vl") || name.includes("llava") || name.includes("moondream") || name.includes("minicpm") || name.includes("pixtral") || name.includes("qwen"),
    thinking: name.includes("-r1") || name.includes("qwq") || name.includes("think") || name.includes("reason") || name.includes("qwen"),
  };
}

export async function fetchOllamaModelCapabilities(url: string, modelName: string): Promise<OllamaCapabilities> {
  if (!modelName) return { vision: false, thinking: false };
  const baseUrl = (url ?? "http://localhost:11434").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: modelName }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.capabilities) {
        return {
          vision: data.capabilities.includes("vision"),
          thinking: data.capabilities.includes("thinking"),
        };
      }
    }
  } catch (e) {
    console.warn("Failed to fetch capabilities natively, falling back to name detection");
  }
  return detectOllamaCapabilities(modelName);
}

export interface FetchOllamaModelsOptions {
  url: string;
}

export async function fetchOllamaModels({ url }: FetchOllamaModelsOptions): Promise<string[]> {
  const baseUrl = (url ?? "http://localhost:11434").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Ollama (${response.status})`);
    }

    const data = await response.json();
    return data.models.map((m: any) => m.name);
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Ollama server unreachable. Make sure it is running and CORS is enabled.");
    }
    console.error("Error fetching Ollama models:", error);
    throw error;
  }
}

export interface StreamOllamaChatOptions {
  url: string;
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  images?: string[];
  think?: boolean;
  signal?: AbortSignal;
  onChunk: (content: string) => void;
  onReasoningChunk?: (content: string) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
}

export async function streamOllamaChat({
  url,
  messages,
  model,
  temperature = 0.8,
  maxTokens = 4096,
  topP = 1,
  images,
  think = false,
  signal,
  onChunk,
  onReasoningChunk,
  onError,
  onFinish,
}: StreamOllamaChatOptions) {
  const baseUrl = (url ?? "http://localhost:11434").replace(/\/$/, "");

  if (!model) {
    onError?.(new Error("No model selected. Please click Refresh to load your local Ollama models, then select one."));
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        // Attach images to the last user message if provided
        messages: images?.length
          ? [
              ...messages.slice(0, -1),
              { ...messages[messages.length - 1], images },
            ]
          : messages,
        stream: true,
        think,
        options: {
          temperature,
          top_p: topP,
          num_predict: maxTokens,
        },
      }),
      signal,
    });

    if (!response.ok) {
      let detail = "";
      try { detail = await response.text(); } catch {}
      throw new Error(`Ollama error ${response.status}: ${detail || "Unknown error"}`);
    }

    if (!response.body) {
      throw new Error("No response body returned from Ollama API.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const chunk = JSON.parse(trimmed);
          // Thinking content (qwen3, deepseek-r1, etc.)
          if (chunk.message?.thinking && onReasoningChunk) {
            onReasoningChunk(chunk.message.thinking);
          }
          // Regular content
          if (chunk.message?.content) {
            onChunk(chunk.message.content);
          }
          if (chunk.done) break;
        } catch (e) {
          console.error("Error parsing Ollama chunk", e, "Data:", trimmed);
        }
      }
    }

    onFinish?.();
  } catch (error: any) {
    if (error.name === "AbortError") {
      onFinish?.();
    } else {
      onError?.(error);
    }
  }
}
