"use client";

import { useRef, useEffect, useState } from "react";
import { Copy, Check, Zap, ChevronDown } from "lucide-react";
import { MarkdownRenderer } from "@/components/playground/MarkdownRenderer";
import { ReasoningBlock } from "@/components/playground/ReasoningBlock";
import { DiffTurn } from "@/types/diff";
import { PlaygroundConfig, StreamMetrics } from "@/types/playground";
import { playUISound } from "@thenormvg/web-have-sounds";

interface DiffColumnProps {
  label: string;
  side: "A" | "B";
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
  turns: DiffTurn[];
  ollamaModels?: string[];
}

const EMPTY_METRICS: StreamMetrics = {
  tokenCount: 0,
  tokensPerSecond: 0,
  avgTps: 0,
  startTime: 0,
  isStreaming: false,
  tpsSamples: [],
};

const SARVAM_MODELS = [
  { value: "sarvam-105b", label: "Sarvam 105B" },
  { value: "sarvam-30b", label: "Sarvam 30B" },
];

export function DiffColumn({ label, side, config, onConfigChange, turns, ollamaModels = [] }: DiffColumnProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const getContent = (t: DiffTurn) => side === "A" ? t.contentA : t.contentB;
  const getReasoning = (t: DiffTurn) => side === "A" ? t.reasoningA : t.reasoningB;
  const getError = (t: DiffTurn) => side === "A" ? t.errorA : t.errorB;
  const getMetrics = (t: DiffTurn): StreamMetrics => side === "A" ? t.metricsA : t.metricsB;
  const isStreaming = (t: DiffTurn) => side === "A" ? t.isStreamingA : t.isStreamingB;

  const isEmpty = turns.length === 0;

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isUserScrolledUpRef.current = el.scrollHeight - el.scrollTop - el.clientHeight > 80;
  };

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns]);

  const handleCopy = (content: string, i: number) => {
    playUISound("success", "glass");
    navigator.clipboard.writeText(content);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 border-r border-gray-200 last:border-r-0">
      {/* ——— Inline model selector header ——— */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0 ${side === "A" ? "bg-indigo-500" : "bg-emerald-500"}`}>
            {side}
          </span>
          <span className="text-[13px] font-semibold text-gray-700">{label}</span>
        </div>

        {/* Provider radio + model select */}
        <div className="flex items-center gap-2">
          {/* Provider toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs" role="radiogroup" aria-label="Provider">
            <button
              role="radio"
              aria-checked={config.provider === "sarvam"}
              onClick={() => {
                playUISound("pop", "aero");
                onConfigChange({ ...config, provider: "sarvam", model: "sarvam-105b" });
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                config.provider === "sarvam"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sarvam
            </button>
            <button
              role="radio"
              aria-checked={config.provider === "ollama"}
              onClick={() => {
                playUISound("pop", "aero");
                onConfigChange({ ...config, provider: "ollama", model: ollamaModels[0] || "" });
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                config.provider === "ollama"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Ollama
            </button>
          </div>

          {/* Model dropdown */}
          <div className="relative">
            <select
              value={config.model}
              onChange={(e) => {
                playUISound("pop", "aero");
                onConfigChange({ ...config, model: e.target.value });
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
              aria-label={`Select model for side ${side}`}
            >
              {config.provider === "sarvam"
                ? SARVAM_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))
                : ollamaModels.length === 0
                  ? <option value="">No local models</option>
                  : ollamaModels.map((m) => <option key={m} value={m}>{m}</option>)
              }
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ——— Messages scroll area ——— */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}
      >
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              side === "A" ? "bg-indigo-50" : "bg-emerald-50"
            }`}>
              <span className={`text-xl font-bold ${side === "A" ? "text-indigo-400" : "text-emerald-400"}`}>{side}</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">
              {config.provider === "sarvam"
                ? config.model === "sarvam-105b" ? "Sarvam 105B" : "Sarvam 30B"
                : config.model || "No model"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Output will appear here</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {turns.map((turn, i) => {
              const content = getContent(turn);
              const reasoning = getReasoning(turn);
              const error = getError(turn);
              const metrics = getMetrics(turn);
              const streaming = isStreaming(turn);
              const isLast = i === turns.length - 1;

              return (
                <div key={turn.id} className="space-y-3">
                  {/* User prompt */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
                      {turn.prompt}
                    </div>
                  </div>

                  {/* Assistant response */}
                  <div className="space-y-1">
                    <div className="text-[13px] text-gray-800 leading-relaxed">
                      {content || reasoning || error ? (
                        <div className="relative">
                          {reasoning && (
                            <ReasoningBlock content={reasoning} isStreaming={streaming && !content} />
                          )}
                          {content && <MarkdownRenderer content={content} />}
                          {error && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                              {error}
                            </div>
                          )}
                          {streaming && (
                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Action row */}
                    {content && !streaming && (
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          onClick={() => handleCopy(content, i)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                          aria-label="Copy response"
                        >
                          {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedIdx === i ? "Copied" : "Copy"}</span>
                        </button>

                        {/* Metrics — last turn only */}
                        {isLast && metrics.tokenCount > 0 && (
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 select-none">
                            <Zap size={11} className="text-amber-400" />
                            <span className="tabular-nums font-mono font-semibold">{metrics.tokenCount}</span>
                            <span>tokens</span>
                            <span className="w-px h-2 bg-gray-200" />
                            <span className="tabular-nums font-mono font-semibold">{metrics.avgTps}</span>
                            <span>tok/s avg</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Streaming metrics */}
                    {streaming && metrics.tokenCount > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 select-none mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="tabular-nums font-mono font-semibold">{metrics.tokenCount}</span>
                        <span>tokens</span>
                        <span className="w-px h-2 bg-gray-200" />
                        <span className="tabular-nums font-mono font-semibold">{metrics.tokensPerSecond}</span>
                        <span>tok/s</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
