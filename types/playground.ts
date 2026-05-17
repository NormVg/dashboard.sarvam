export interface PlaygroundConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  reasoningEffort: "low" | "medium" | "high";
  systemInstruction: string;
}

export const DEFAULT_PLAYGROUND_CONFIG: PlaygroundConfig = {
  model: "sarvam-105b",
  temperature: 0.8,
  maxTokens: 4096,
  topP: 1,
  reasoningEffort: "medium",
  systemInstruction: "",
};
