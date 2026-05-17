export interface PlaygroundConfig {
  provider: "sarvam" | "ollama";
  ollamaUrl: string;
  ollamaThinking: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  reasoningEffort: "low" | "medium" | "high";
  systemInstruction: string;
  simulatedError: "none" | "network" | "timeout" | "interrupted";
}

export const DEFAULT_PLAYGROUND_CONFIG: PlaygroundConfig = {
  provider: "sarvam",
  ollamaUrl: "http://localhost:11434",
  ollamaThinking: false,
  model: "sarvam-105b",
  temperature: 0.8,
  maxTokens: 4096,
  topP: 1,
  reasoningEffort: "medium",
  systemInstruction: "",
  simulatedError: "none",
};
