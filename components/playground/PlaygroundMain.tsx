"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PromptBar, AttachedFile } from "./PromptBar";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ReasoningBlock } from "./ReasoningBlock";
import { Settings2, Copy, Check, CornerDownLeft, Zap, AlertTriangle, Aperture } from "lucide-react";
import { streamSarvamChat } from "../../lib/sarvam-api";
import { streamOllamaChat, fetchOllamaModelCapabilities, OllamaCapabilities } from "../../lib/ollama-api";
import { PlaygroundConfig, StreamMetrics } from "@/types/playground";
import { playUISound } from "@thenormvg/web-have-sounds";

interface PlaygroundMainProps {
  isSettingsOpen: boolean;
  onOpenSettings: () => void;
  config: PlaygroundConfig;
  ollamaCaps: OllamaCapabilities;
}

interface PlaygroundMessage {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  error?: string;
  images?: string[]; // data URLs for display
  replyTo?: string;  // the quoted text shown in the bubble
}


const API_URL = "/api/chat";

export function PlaygroundMain({ isSettingsOpen, onOpenSettings, config, ollamaCaps }: PlaygroundMainProps) {
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    tokenCount: 0,
    tokensPerSecond: 0,
    avgTps: 0,
    startTime: 0,
    isStreaming: false,
    tpsSamples: [],
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tokenCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserScrolledUpRef = useRef(false);

  // Abort active stream on unmount (prevents page-switch hang)
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isEmpty = messages.length === 0;

  // Track if user has scrolled up (away from bottom)
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUpRef.current = distanceFromBottom > 80;
  }, []);

  // Only auto-scroll if user is near the bottom
  const scrollToBottom = useCallback(() => {
    if (isUserScrolledUpRef.current) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: isLoading ? "auto" : "smooth"
    });
  }, [isLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleCopy = useCallback((content: string, index: number) => {
    playUISound("success", "glass");
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleReply = useCallback((content: string) => {
    playUISound("pop", "aero");
    setReplyTo(content);
  }, []);

  const runSimulatedError = async (
    type: "network" | "timeout" | "interrupted",
    onError: (err: Error) => void
  ) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    let localTokenCount = 0;

    const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(new Error("AbortError"));

      const timeout = setTimeout(resolve, ms);

      const onAbort = () => {
        clearTimeout(timeout);
        reject(new Error("AbortError"));
      };

      signal.addEventListener("abort", onAbort);
    });

    try {
      // Simulate initial loading lag
      await sleep(1000);

      // 1. Reasoning Phase
      const reasoningChunks = [
        "Analyzing user prompt parameters...\n",
        "Structuring simulated story context...\n",
        "Validating safety filters and parameters...\n"
      ];

      for (const chunk of reasoningChunks) {
        if (signal.aborted) throw new Error("AbortError");

        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          const last = prev[lastIdx];
          if (last.role !== "assistant") return prev;
          return [
            ...prev.slice(0, lastIdx),
            { ...last, reasoning: (last.reasoning || "") + chunk }
          ];
        });

        await sleep(400);
      }

      // 2. Content Phase (except for Timeout which hangs early)
      if (type === "network") {
        const contentChunks = [
          "Here is a mock response demonstrating a ",
          "sudden network drop mid-way through generation. ",
          "Any text generated so far will be safely preserved, ",
          "and a red interrupted warning banner will be displayed ",
          "under this message bubble to alert the user."
        ];

        for (const chunk of contentChunks) {
          if (signal.aborted) throw new Error("AbortError");

          // Update metrics
          localTokenCount += chunk.split(/\s+/).filter(Boolean).length || 1;
          tokenCountRef.current = localTokenCount;
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          const tps = elapsed > 0 ? localTokenCount / elapsed : 0;

          setMetrics((prev) => {
            const samples = [...prev.tpsSamples, tps].slice(-20);
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            return {
              tokenCount: localTokenCount,
              tokensPerSecond: Math.round(tps * 10) / 10,
              avgTps: Math.round(avg * 10) / 10,
              startTime: startTimeRef.current,
              isStreaming: true,
              tpsSamples: samples,
            };
          });

          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            const last = prev[lastIdx];
            if (last.role !== "assistant") return prev;
            return [...prev.slice(0, lastIdx), { ...last, content: last.content + chunk }];
          });

          await sleep(250);
        }

        // Trigger Network Drop Error
        throw new TypeError("Failed to fetch: Network connection dropped unexpectedly (Simulated Network Drop)");

      } else if (type === "interrupted") {
        const contentChunks = [
          "This is a longer mock stream designed to show a ",
          "stream interruption error. ",
          "The generation starts perfectly and streams smoothly. ",
          "Elias the cartographer was drawing a new map under the oak tree. ",
          "He paused to drink some water and felt a gentle breeze rustling the leaves. ",
          "Just as he was about to draw the final mountain range, ",
          "the stream connection was severed by the host server."
        ];

        for (const chunk of contentChunks) {
          if (signal.aborted) throw new Error("AbortError");

          // Update metrics
          localTokenCount += chunk.split(/\s+/).filter(Boolean).length || 1;
          tokenCountRef.current = localTokenCount;
          const elapsed = (performance.now() - startTimeRef.current) / 1000;
          const tps = elapsed > 0 ? localTokenCount / elapsed : 0;

          setMetrics((prev) => {
            const samples = [...prev.tpsSamples, tps].slice(-20);
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            return {
              tokenCount: localTokenCount,
              tokensPerSecond: Math.round(tps * 10) / 10,
              avgTps: Math.round(avg * 10) / 10,
              startTime: startTimeRef.current,
              isStreaming: true,
              tpsSamples: samples,
            };
          });

          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            const last = prev[lastIdx];
            if (last.role !== "assistant") return prev;
            return [...prev.slice(0, lastIdx), { ...last, content: last.content + chunk }];
          });

          await sleep(250);
        }

        // Trigger Stream Interrupted Error
        throw new Error("Stream connection terminated unexpectedly by remote endpoint (Simulated Stream Interruption)");

      } else if (type === "timeout") {
        // Wait 20 seconds to realistically simulate the timeout
        await sleep(20000);
        if (signal.aborted) throw new Error("AbortError");
        throw new Error("Request timed out: No data was received from the model for over 20 seconds. Please check your connection and try again.");
      }

    } catch (err: any) {
      if (err.message === "AbortError" || signal.aborted) {
        // Manually stopped
      } else {
        onError(err);
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setMetrics((prev) => ({ ...prev, isStreaming: false }));
    }
  };

  const handleSubmit = async (attachments?: AttachedFile[]) => {
    if (!input.trim() && !replyTo && (!attachments || attachments.length === 0)) return;

    // Build the final message content (plain text for the API)
    const userContent = input.trim();
    const userMessage: PlaygroundMessage = {
      role: "user",
      content: userContent,
      replyTo: replyTo ? replyTo.split("\n")[0].slice(0, 120) : undefined,
      images: attachments?.map((a) => a.previewUrl),
    };

    // Build API messages — include reply as a quote prefix in the API content
    const apiContent = replyTo
      ? `> ${replyTo.split("\n")[0].slice(0, 120)}\n\n${userContent}`
      : userContent;
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setReplyTo(null);
    setIsLoading(true);
    isUserScrolledUpRef.current = false; // Reset on new message

    // Reset metrics
    tokenCountRef.current = 0;
    startTimeRef.current = performance.now();
    setMetrics({ tokenCount: 0, tokensPerSecond: 0, avgTps: 0, startTime: performance.now(), isStreaming: true, tpsSamples: [] });

    const handleStreamError = (error: Error) => {
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx < 0) return prev;
        const last = prev[lastIdx];
        if (last.role !== "assistant") return prev;
        return [...prev.slice(0, lastIdx), { ...last, error: error.message }];
      });
    };

    // Build API-level messages (reply quoted inline)
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const apiUserMessage = { role: "user" as const, content: apiContent };

    // If simulation is enabled, run custom simulation stream
    if (config.simulatedError && config.simulatedError !== "none") {
      await runSimulatedError(config.simulatedError, handleStreamError);
      return;
    }

    let lastChunkTime = performance.now();
    const checkInactivity = setInterval(() => {
      const elapsed = (performance.now() - lastChunkTime) / 1000;
      if (elapsed > 20) { // 20 second inactivity timeout
        clearInterval(checkInactivity);
        abortControllerRef.current?.abort();
        handleStreamError(new Error("Request timed out: No data was received from the model for over 20 seconds. Please check your connection and try again."));
      }
    }, 2000);

    try {
      abortControllerRef.current = new AbortController();

      const requestMessages: PlaygroundMessage[] = [];
      if (config.systemInstruction.trim()) {
        requestMessages.push({ role: "system", content: config.systemInstruction.trim() });
      }
      requestMessages.push(...apiMessages, apiUserMessage);

      const handleChunk = (content: string) => {
        lastChunkTime = performance.now();
        const newTokens = content.split(/[\s]+/).filter(Boolean).length || 1;
        tokenCountRef.current += newTokens;
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const tps = elapsed > 0 ? tokenCountRef.current / elapsed : 0;

        setMetrics((prev) => {
          const samples = [...prev.tpsSamples, tps].slice(-20); // keep last 20
          const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
          return {
            tokenCount: tokenCountRef.current,
            tokensPerSecond: Math.round(tps * 10) / 10,
            avgTps: Math.round(avg * 10) / 10,
            startTime: startTimeRef.current,
            isStreaming: true,
            tpsSamples: samples,
          };
        });

        setMessages((prev) => {
          const lastIdx = prev.length - 1;
          const last = prev[lastIdx];
          if (last.role !== "assistant") return prev;
          return [...prev.slice(0, lastIdx), { ...last, content: last.content + content }];
        });
      };

      if (config.provider === "ollama") {
        if (!config.ollamaUrl) {
          throw new Error("Ollama URL is not configured. Please set it in the settings.");
        }
        await streamOllamaChat({
          url: config.ollamaUrl,
          messages: requestMessages,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
          images: attachments?.map((a) => a.base64),
          think: config.ollamaThinking ?? false,
          signal: abortControllerRef.current.signal,
          onReasoningChunk: (reasoningContent) => {
            lastChunkTime = performance.now();
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              const last = prev[lastIdx];
              if (last.role !== "assistant") return prev;
              return [
                ...prev.slice(0, lastIdx),
                { ...last, reasoning: (last.reasoning || "") + reasoningContent },
              ];
            });
          },
          onChunk: handleChunk,
          onError: handleStreamError,
          onFinish: () => { }
        });
      } else {
        const apiKey = (process.env.NEXT_PUBLIC_SARVAM_API_KEY ?? "").trim();
        if (!apiKey) {
          throw new Error("No API key configured. Please set NEXT_PUBLIC_SARVAM_API_KEY in your environment.");
        }
        await streamSarvamChat({
          messages: requestMessages,
          apiKey,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP,
          reasoningEffort: config.reasoningEffort,
          signal: abortControllerRef.current.signal,
          onReasoningChunk: (reasoningContent) => {
            lastChunkTime = performance.now();
            setMessages((prev) => {
              const lastIdx = prev.length - 1;
              const last = prev[lastIdx];
              if (last.role !== "assistant") return prev;
              return [
                ...prev.slice(0, lastIdx),
                { ...last, reasoning: (last.reasoning || "") + reasoningContent }
              ];
            });
          },
          onChunk: handleChunk,
          onError: handleStreamError,
          onFinish: () => { }
        });
      }


    } catch (error: any) {
      if (error.name !== "AbortError") {
        handleStreamError(error);
      }
    } finally {
      clearInterval(checkInactivity);
      abortControllerRef.current = null;
      setIsLoading(false);
      setMetrics((prev) => ({ ...prev, isStreaming: false }));
    }
  };

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const streamingIndex = isLoading ? messages.length - 1 : -1;

  return (
    <div className="flex-1 relative flex flex-col bg-white overflow-hidden">
      {/* Settings Toggle */}
      {!isSettingsOpen && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => {
              playUISound("pop", "aero");
              onOpenSettings();
            }}
            className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            title="Open settings"
            aria-label="Open settings"
          >
            <Settings2 size={18} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto pb-[240px]"
      >
        <div
          className={`max-w-3xl w-full mx-auto px-6 pt-10 transition-opacity duration-300 ${isEmpty ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          <div className="space-y-6">
            {messages.map((msg, i) => {
              const isStreamingThis = i === streamingIndex && msg.role === "assistant";
              const isAssistant = msg.role === "assistant";

              return (
                <div key={i} className={`group flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col max-w-[85%]">
                    {/* User bubble */}
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {/* Reply quote strip */}
                        {msg.replyTo && (
                          <div className="flex items-start gap-2 bg-gray-100 rounded-2xl rounded-br-sm px-3 py-2 max-w-full">
                            <div className="w-0.5 self-stretch bg-gray-400 rounded-full flex-shrink-0" />
                            <p className="text-[12px] text-gray-500 leading-snug line-clamp-2 min-w-0">
                              {msg.replyTo}
                            </p>
                          </div>
                        )}
                        {/* Image thumbnails */}
                        {msg.images && msg.images.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {msg.images.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                alt={`attachment ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded-xl border border-gray-200"
                              />
                            ))}
                          </div>
                        )}
                        {/* Text bubble */}
                        {msg.content && (
                          <div className="bg-[#F4F4F4] text-gray-900 rounded-[1.25rem] rounded-br-md px-4 py-3 text-[15px]">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="relative text-[15px] text-gray-800"
                      >
                        {msg.content || msg.reasoning || msg.error ? (
                          <div className="relative">
                            {msg.reasoning && (
                              <ReasoningBlock
                                content={msg.reasoning}
                                isStreaming={isStreamingThis && !msg.content}
                              />
                            )}
                            {msg.content && <MarkdownRenderer content={msg.content} />}
                            {msg.error && (
                              <div className="mt-3 flex items-start gap-2.5 text-red-700 bg-red-50/50 border border-red-100 rounded-xl p-3.5 text-[13px] leading-relaxed select-none">
                                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
                                <div className="flex-1">
                                  <span className="font-semibold block mb-0.5 text-red-800">Generation Interrupted</span>
                                  <span className="text-red-750/90">{msg.error}</span>
                                </div>
                              </div>
                            )}
                            {/* Streaming blur edge effect */}
                            {isStreamingThis && (
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center py-1">
                            <Aperture size={16} className="spin-spring text-gray-500" />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons & Metrics — assistant only */}
                    {msg.content && isAssistant && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1.5 justify-start">
                        {/* Action buttons — visible when complete */}
                        {!isStreamingThis && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.content, i)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                              title="Copy message"
                              aria-label="Copy message"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check size={13} />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReply(msg.content)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                              title="Reply to message"
                              aria-label="Reply to message"
                            >
                              <CornerDownLeft size={13} />
                              <span>Reply</span>
                            </button>
                          </div>
                        )}

                        {/* Inline Token Metrics — Minimal Style */}
                        {((isStreamingThis) || (i === messages.length - 1 && metrics.tokenCount > 0)) && (
                          <div className="flex items-center gap-2.5 text-[11px] text-gray-500 select-none transition-all duration-300">
                            <span className="flex items-center gap-1">
                              <Zap size={11} className="text-amber-450" />
                              <span className="tabular-nums font-mono text-gray-500 font-semibold">{metrics.tokenCount}</span>
                              <span>tokens</span>
                            </span>
                            <span className="w-px h-2 bg-gray-200" />
                            <span className="flex items-center gap-0.5">
                              <span className="tabular-nums font-mono text-gray-500 font-semibold">{metrics.tokensPerSecond}</span>
                              <span>tok/s</span>
                            </span>
                            <span className="w-px h-2 bg-gray-200" />
                            <span className="flex items-center gap-0.5">
                              <span className="text-gray-500">avg</span>
                              <span className="tabular-nums font-mono text-gray-500 font-semibold">{metrics.avgTps}</span>
                              <span>tok/s</span>
                            </span>
                            <span className="w-px h-2 bg-gray-200" />
                            <div className="flex items-center gap-1">
                              {metrics.isStreaming ? (
                                <>
                                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                                  <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">streaming</span>
                                </>
                              ) : (
                                <>
                                  <Check size={11} className="text-emerald-500 font-bold" />
                                  <span className="text-[9px] uppercase tracking-wider text-gray-450 font-semibold">complete</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer — uses transform for smooth center-to-bottom animation */}
      <div
        className="absolute inset-0 pointer-events-none flex items-start justify-center"
      >
        <div
          className="pointer-events-auto flex flex-col items-center w-full px-6 sm:px-8 max-w-3xl"
          style={{
            position: "absolute",
            left: "50%",
            transform: isEmpty
              ? "translate(-50%, -50%)"
              : "translate(-50%, 0)",
            top: isEmpty ? "50%" : undefined,
            bottom: isEmpty ? undefined : "24px",
            transition: "all 500ms cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {/* Title */}
          <h1
            className="text-[2rem] sm:text-[2.25rem] font-medium text-gray-900 tracking-tight text-center overflow-hidden"
            style={{
              opacity: isEmpty ? 1 : 0,
              maxHeight: isEmpty ? "80px" : "0px",
              marginBottom: isEmpty ? "32px" : "0px",
              transform: isEmpty ? "translateY(0)" : "translateY(-16px)",
              transition: "all 400ms ease-out",
              pointerEvents: isEmpty ? "auto" : "none",
            }}
          >
            Explore Sarvam Playground
          </h1>

          {/* Prompt Bar */}
          <div className="w-full">
            <PromptBar
              value={input}
              onChange={setInput}
              onSend={handleSubmit}
              onStop={handleStop}
              disabled={isLoading}
              isStreaming={isLoading}
              variant={isEmpty ? "empty" : "thread"}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              allowAttachments={config.provider === "ollama" && ollamaCaps.vision}
            />
          </div>

          {/* Hint */}
          <p
            className="text-xs text-gray-500 text-center overflow-hidden"
            style={{
              opacity: isEmpty ? 1 : 0,
              maxHeight: isEmpty ? "30px" : "0px",
              marginTop: isEmpty ? "16px" : "0px",
              transition: "all 300ms ease-out",
              pointerEvents: isEmpty ? "auto" : "none",
            }}
          >
            {config.model} · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
