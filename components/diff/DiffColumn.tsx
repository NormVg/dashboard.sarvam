"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Copy, Check, Zap, Settings2, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/playground/MarkdownRenderer";
import { ReasoningBlock } from "@/components/playground/ReasoningBlock";
import { ModelSettings } from "@/components/playground/ModelSettings";
import { DiffTurn } from "@/types/diff";
import { PlaygroundConfig, StreamMetrics } from "@/types/playground";
import { fetchOllamaModelCapabilities, OllamaCapabilities } from "@/lib/ollama-api";
import { DiffAlgorithm, DiffOp, computeDiff } from "@/lib/diff-utils";
import { playUISound } from "@thenormvg/web-have-sounds";
import { motion, AnimatePresence } from "framer-motion";

interface DiffColumnProps {
  label: string;
  side: "A" | "B";
  config: PlaygroundConfig;
  onConfigChange: (c: PlaygroundConfig) => void;
  turns: DiffTurn[];
  diffMode?: DiffAlgorithm;
}

export function DiffColumn({ label, side, config, onConfigChange, turns, diffMode = "none" }: DiffColumnProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [ollamaCaps, setOllamaCaps] = useState<OllamaCapabilities>({ vision: false, thinking: false });

  // Update Ollama capabilities whenever model changes
  useEffect(() => {
    if (config.provider === "ollama" && config.model) {
      fetchOllamaModelCapabilities(config.ollamaUrl ?? "http://localhost:11434", config.model)
        .then(setOllamaCaps);
    } else {
      setOllamaCaps({ vision: false, thinking: false });
    }
  }, [config.provider, config.model, config.ollamaUrl]);

  // Auto-close settings when a new turn arrives (user sent a message)
  const prevTurnCount = useRef(turns.length);
  useEffect(() => {
    if (turns.length > prevTurnCount.current) {
      setIsSettingsOpen(false);
    }
    prevTurnCount.current = turns.length;
  }, [turns.length]);

  // Compute diffs asynchronously to avoid blocking the main thread
  const [turnDiffs, setTurnDiffs] = useState<({ diffA: DiffOp[], diffB: DiffOp[] } | null)[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  // Track whether any turn is actively streaming
  const isAnyStreaming = turns.some(t => t.isStreamingA || t.isStreamingB);

  useEffect(() => {
    // When diffMode is none, don't touch state at all — just bail out
    if (!diffMode || diffMode === "none") return;

    // While streaming, don't compute diffs (avoid cascading state updates)
    if (isAnyStreaming) return;

    setIsComputing(true);
    let active = true;

    // Yield to let React show the loader
    const timer = setTimeout(async () => {
      const results = await Promise.all(
        turns.map(t => computeDiff(diffMode, t.contentA, t.contentB))
      );
      if (active) {
        setTurnDiffs(results);
        setIsComputing(false);
      }
    }, 10);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isAnyStreaming, diffMode]);

  const getContent   = (t: DiffTurn) => side === "A" ? t.contentA   : t.contentB;
  const getReasoning = (t: DiffTurn) => side === "A" ? t.reasoningA : t.reasoningB;
  const getError     = (t: DiffTurn) => side === "A" ? t.errorA     : t.errorB;
  const getMetrics   = (t: DiffTurn): StreamMetrics => side === "A" ? t.metricsA : t.metricsB;
  const isStreaming   = (t: DiffTurn) => side === "A" ? t.isStreamingA : t.isStreamingB;

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

  const handleCopy = useCallback((content: string, i: number) => {
    playUISound("success", "glass");
    navigator.clipboard.writeText(content);
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const modelLabel = config.provider === "sarvam"
    ? (config.model === "sarvam-105b" ? "Sarvam 105B" : "Sarvam 30B")
    : config.model || "No model";

  const openSettings = () => {
    playUISound("pop", "aero");
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 border-r border-gray-200 last:border-r-0">

      {/* ——— Header (always visible) ——— */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0 ${
            side === "A" ? "bg-indigo-500" : "bg-emerald-500"
          }`}>
            {side}
          </span>
          <span className="text-[13px] font-semibold text-gray-700 truncate">{label}</span>
          <span className="hidden sm:inline text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
            {modelLabel}
          </span>
        </div>

        <button
          onClick={isSettingsOpen ? closeSettings : openSettings}
          aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
          aria-pressed={isSettingsOpen}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 ${
            isSettingsOpen
              ? "bg-gray-900 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Settings2 size={15} />
        </button>
      </div>

      {/* ——— Animated content area ——— */}
      <div className="flex-1 relative overflow-hidden">

        {/* ——— Chat layer — slides left when settings opens ——— */}
        <div
          className="absolute inset-0 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: isSettingsOpen ? "translateX(-24px)" : "translateX(0)",
            opacity: isSettingsOpen ? 0 : 1,
            pointerEvents: isSettingsOpen ? "none" : "auto",
          }}
        >
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
                  <span className={`text-xl font-bold ${side === "A" ? "text-indigo-400" : "text-emerald-400"}`}>
                    {side}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{modelLabel}</p>
                <p className="text-xs text-gray-400 mt-1">Output will appear here</p>
                <button
                  onClick={openSettings}
                  className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Settings2 size={12} />
                  Configure model
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {turns.map((turn, i) => {
                  const content   = getContent(turn);
                  const reasoning = getReasoning(turn);
                  const error     = getError(turn);
                  const metrics   = getMetrics(turn);
                  const streaming = isStreaming(turn);
                  const isLast    = i === turns.length - 1;

                  return (
                    <div key={turn.id} className="space-y-3">
                      {/* User prompt bubble */}
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
                              {reasoning && <ReasoningBlock content={reasoning} isStreaming={streaming && !content} />}
                              
                              <AnimatePresence mode="wait">
                                {isComputing ? (
                                  <motion.div
                                    key="computing"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2 bg-gray-50/50 rounded-xl border border-gray-100"
                                  >
                                    <Loader2 size={18} className="animate-spin text-gray-400" />
                                    <span className="text-[11px] font-medium tracking-wide">Computing diff...</span>
                                  </motion.div>
                                ) : turnDiffs[i] && diffMode !== "none" ? (
                                  <motion.div
                                    key="diff"
                                    initial={{ opacity: 0, filter: "blur(2px)", y: 5 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    exit={{ opacity: 0, filter: "blur(2px)", y: -5 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                  >
                                    <DiffRenderer ops={side === "A" ? turnDiffs[i]!.diffA : turnDiffs[i]!.diffB} side={side} />
                                  </motion.div>
                                ) : content ? (
                                  <motion.div
                                    key="markdown"
                                    initial={{ opacity: 0, filter: "blur(2px)", y: 5 }}
                                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                    exit={{ opacity: 0, filter: "blur(2px)", y: -5 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                  >
                                    <MarkdownRenderer content={content} />
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>

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

                        {/* Copy + metrics */}
                        {content && !streaming && (
                          <div className="flex items-center gap-3 mt-1.5">
                            <button
                              onClick={() => handleCopy(content, i)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                              aria-label="Copy response"
                            >
                              {copiedIdx === i ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedIdx === i ? "Copied" : "Copy"}</span>
                            </button>
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

                        {/* Live streaming metrics */}
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

        {/* ——— Settings layer — slides in from right ——— */}
        <div
          className="absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: isSettingsOpen ? "translateX(0)" : "translateX(100%)",
            opacity: isSettingsOpen ? 1 : 0,
            pointerEvents: isSettingsOpen ? "auto" : "none",
          }}
        >
          <ModelSettings
            isOpen={true}
            fullWidth
            onClose={closeSettings}
            config={config}
            onChange={onConfigChange}
            ollamaCaps={ollamaCaps}
          />
        </div>
      </div>
    </div>
  );
}

// Local helper to render diff
function DiffRenderer({ ops, side }: { ops: DiffOp[], side: "A" | "B" }) {
  return (
    <div className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed break-words bg-gray-50/50 p-4 rounded-xl border border-gray-100">
      {ops.map((op, i) => {
        if (op.type === "equal") {
          return (
            <span
              key={i}
              className="underline decoration-indigo-500/70 decoration-2 underline-offset-4 text-gray-900 font-medium"
              title="Common Token Sequence"
            >
              {op.text}
            </span>
          );
        }
        if (side === "A" && op.type === "delete") {
          return (
            <span
              key={i}
              className="bg-red-50 text-red-600 px-1 py-0.5 rounded font-normal"
              title="Uncommon Token (Not in B)"
            >
              {op.text}
            </span>
          );
        }
        if (side === "B" && op.type === "insert") {
          return (
            <span
              key={i}
              className="bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded font-normal"
              title="Uncommon Token (Not in A)"
            >
              {op.text}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}
