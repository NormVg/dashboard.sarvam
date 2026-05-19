"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { DiffColumn } from "./DiffColumn";
import { PromptBar, AttachedFile } from "@/components/playground/PromptBar";
import { DiffTurn } from "@/types/diff";
import { PlaygroundConfig, StreamMetrics, DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";
import { streamSarvamChat } from "@/lib/sarvam-api";
import { streamOllamaChat, fetchOllamaModels } from "@/lib/ollama-api";
import { playUISound } from "@thenormvg/web-have-sounds";

const EMPTY_METRICS = (): StreamMetrics => ({
  tokenCount: 0,
  tokensPerSecond: 0,
  avgTps: 0,
  startTime: 0,
  isStreaming: false,
  tpsSamples: [],
});

function newTurn(prompt: string): DiffTurn {
  return {
    id: crypto.randomUUID(),
    prompt,
    contentA: "",
    reasoningA: undefined,
    errorA: undefined,
    metricsA: EMPTY_METRICS(),
    isStreamingA: true,
    contentB: "",
    reasoningB: undefined,
    errorB: undefined,
    metricsB: EMPTY_METRICS(),
    isStreamingB: true,
  };
}

import { DiffAlgorithm } from "@/lib/diff-utils";

interface DiffMainProps {
  initialConfigA?: PlaygroundConfig;
  initialConfigB?: PlaygroundConfig;
  apiKey?: string;
  diffMode?: DiffAlgorithm;
}

export function DiffMain({
  initialConfigA,
  initialConfigB,
  apiKey = "",
  diffMode = "none",
}: DiffMainProps) {
  const [configA, setConfigA] = useState<PlaygroundConfig>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("sarvam_diff_config_a") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialConfigA ?? { ...DEFAULT_PLAYGROUND_CONFIG, model: "sarvam-105b", provider: "sarvam" };
  });
  const [configB, setConfigB] = useState<PlaygroundConfig>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("sarvam_diff_config_b") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialConfigB ?? { ...DEFAULT_PLAYGROUND_CONFIG, model: "sarvam-30b", provider: "sarvam" };
  });

  const handleConfigAChange = (newConfig: PlaygroundConfig) => {
    setConfigA(newConfig);
    try {
      localStorage.setItem("sarvam_diff_config_a", JSON.stringify(newConfig));
    } catch {}
  };

  const handleConfigBChange = (newConfig: PlaygroundConfig) => {
    setConfigB(newConfig);
    try {
      localStorage.setItem("sarvam_diff_config_b", JSON.stringify(newConfig));
    } catch {}
  };
  const [turns, setTurns] = useState<DiffTurn[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const abortA = useRef<AbortController | null>(null);
  const abortB = useRef<AbortController | null>(null);
  const tokenCountA = useRef(0);
  const tokenCountB = useRef(0);
  const startTimeA = useRef(0);
  const startTimeB = useRef(0);

  // Abort active streams on unmount (prevents page-switch hang)
  useEffect(() => {
    return () => {
      abortA.current?.abort();
      abortB.current?.abort();
    };
  }, []);

  // ——————————————————————————————————————
  // Helpers to update a single turn by id
  // ——————————————————————————————————————
  const patchTurn = useCallback((id: string, patch: Partial<DiffTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  // ——————————————————————————————————————
  // Build one-side streaming handler
  // ——————————————————————————————————————
  function buildStreamHandlers(
    turnId: string,
    side: "A" | "B",
    tokenCountRef: React.MutableRefObject<number>,
    startTimeRef: React.MutableRefObject<number>
  ) {
    const onChunk = (content: string) => {
      const newTokens = content.split(/[\s]+/).filter(Boolean).length || 1;
      tokenCountRef.current += newTokens;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const tps = elapsed > 0 ? tokenCountRef.current / elapsed : 0;

      setTurns((prev) =>
        prev.map((t) => {
          if (t.id !== turnId) return t;
          const prevMetrics = side === "A" ? t.metricsA : t.metricsB;
          const samples = [...prevMetrics.tpsSamples, tps].slice(-20);
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          const updatedMetrics: StreamMetrics = {
            tokenCount: tokenCountRef.current,
            tokensPerSecond: Math.round(tps * 10) / 10,
            avgTps: Math.round(avg * 10) / 10,
            startTime: startTimeRef.current,
            isStreaming: true,
            tpsSamples: samples,
          };
          if (side === "A") {
            return { ...t, contentA: t.contentA + content, metricsA: updatedMetrics };
          } else {
            return { ...t, contentB: t.contentB + content, metricsB: updatedMetrics };
          }
        })
      );
    };

    const onReasoningChunk = (content: string) => {
      setTurns((prev) =>
        prev.map((t) => {
          if (t.id !== turnId) return t;
          if (side === "A") return { ...t, reasoningA: (t.reasoningA || "") + content };
          return { ...t, reasoningB: (t.reasoningB || "") + content };
        })
      );
    };

    const onError = (error: Error) => {
      setTurns((prev) =>
        prev.map((t) => {
          if (t.id !== turnId) return t;
          if (side === "A") return { ...t, errorA: error.message, isStreamingA: false };
          return { ...t, errorB: error.message, isStreamingB: false };
        })
      );
    };

    const onFinish = () => {
      setTurns((prev) =>
        prev.map((t) => {
          if (t.id !== turnId) return t;
          if (side === "A") {
            return {
              ...t,
              isStreamingA: false,
              metricsA: { ...t.metricsA, isStreaming: false },
            };
          }
          return {
            ...t,
            isStreamingB: false,
            metricsB: { ...t.metricsB, isStreaming: false },
          };
        })
      );

      // If both sides done, unset loading
      setTurns((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        if (!last.isStreamingA && !last.isStreamingB) {
          setIsLoading(false);
        }
        return prev;
      });
    };

    return { onChunk, onReasoningChunk, onError, onFinish };
  }

  // ——————————————————————————————————————
  // Kick off a stream for one side
  // ——————————————————————————————————————
  async function runStream(
    config: PlaygroundConfig,
    side: "A" | "B",
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[],
    turnId: string,
    tokenCountRef: React.MutableRefObject<number>,
    startTimeRef: React.MutableRefObject<number>,
    abortRef: React.MutableRefObject<AbortController | null>
  ) {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const { onChunk, onReasoningChunk, onError, onFinish } = buildStreamHandlers(
      turnId,
      side,
      tokenCountRef,
      startTimeRef
    );

    const messages = [
      ...(config.systemInstruction.trim()
        ? [{ role: "system" as const, content: config.systemInstruction.trim() }]
        : []),
      ...history,
      { role: "user" as const, content: prompt },
    ];

    if (config.provider === "sarvam") {
      await streamSarvamChat({
        messages,
        apiKey,
        signal,
        onChunk,
        onReasoningChunk,
        onError,
        onFinish,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        reasoningEffort: config.reasoningEffort,
      });
    } else {
      await streamOllamaChat({
        url: config.ollamaUrl ?? "http://localhost:11434",
        messages,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        think: config.ollamaThinking,
        signal,
        onChunk,
        onReasoningChunk,
        onError,
        onFinish,
      });
    }
  }

  // ——————————————————————————————————————
  // Main send handler
  // ——————————————————————————————————————
  const handleSend = useCallback(
    async (_attachments?: AttachedFile[]) => {
      const prompt = input.trim();
      if (!prompt || isLoading) return;
      playUISound("pop", "aero");

      // Build conversation history from previous turns (simple user/assistant pairs)
      const history: { role: "user" | "assistant"; content: string }[] = turns.flatMap((t) => [
        { role: "user", content: t.prompt },
        { role: "assistant", content: t.contentA }, // Use A side for context
      ]);

      const turn = newTurn(prompt);
      setTurns((prev) => [...prev, turn]);
      setInput("");
      setIsLoading(true);

      tokenCountA.current = 0;
      tokenCountB.current = 0;
      startTimeA.current = performance.now();
      startTimeB.current = performance.now();

      // Fire both concurrently
      await Promise.allSettled([
        runStream(configA, "A", prompt, history, turn.id, tokenCountA, startTimeA, abortA),
        runStream(configB, "B", prompt, history, turn.id, tokenCountB, startTimeB, abortB),
      ]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configA, configB, turns, isLoading, apiKey, input]
  );

  const handleStop = useCallback(() => {
    playUISound("drop", "aero");
    abortA.current?.abort();
    abortB.current?.abort();
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Two-column comparison area */}
      <div className="flex flex-1 overflow-hidden">
        <DiffColumn
          label="Model A"
          side="A"
          config={configA}
          onConfigChange={handleConfigAChange}
          turns={turns}
          diffMode={diffMode}
        />
        <DiffColumn
          label="Model B"
          side="B"
          config={configB}
          onConfigChange={handleConfigBChange}
          turns={turns}
          diffMode={diffMode}
        />
      </div>

      {/* ——— Shared prompt bar ——— */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-gray-100 bg-white">
        <PromptBar
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
          isStreaming={isLoading}
          onStop={handleStop}
          allowAttachments={false}
          variant={turns.length === 0 ? "empty" : "thread"}
        />
        <p className="text-xs text-gray-500 text-center mt-2 overflow-hidden"
          style={{
            opacity: turns.length === 0 ? 1 : 0,
            maxHeight: turns.length === 0 ? "20px" : "0px",
            transition: "opacity 0.3s, max-height 0.3s",
          }}
        >
          Responses will stream simultaneously on both sides
        </p>
      </div>
    </div>
  );
}
