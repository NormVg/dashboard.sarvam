import { PlaygroundConfig, StreamMetrics } from "./playground";

export interface DiffTurn {
  id: string;
  prompt: string;
  // Model A State
  contentA: string;
  reasoningA?: string;
  errorA?: string;
  metricsA: StreamMetrics;
  isStreamingA: boolean;
  // Model B State
  contentB: string;
  reasoningB?: string;
  errorB?: string;
  metricsB: StreamMetrics;
  isStreamingB: boolean;
}
