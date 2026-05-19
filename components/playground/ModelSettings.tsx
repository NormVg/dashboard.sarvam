import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Info, ChevronDown, Code2, RotateCcw, X, Copy, Check } from "lucide-react";
import { PlaygroundConfig, DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";
import { playUISound } from "@thenormvg/web-have-sounds";
import { fetchOllamaModels, OllamaCapabilities } from "../../lib/ollama-api";
import { motion } from "framer-motion";

interface ModelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlaygroundConfig;
  onChange: (config: PlaygroundConfig) => void;
  ollamaCaps?: OllamaCapabilities;
  /** When true the panel fills 100% of the parent container (no fixed 340px width / slide animation) */
  fullWidth?: boolean;
}

export function ModelSettings({ isOpen, onClose, config, onChange, ollamaCaps, fullWidth = false }: ModelSettingsProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFetchOllamaModels = async () => {
    setIsFetchingModels(true);
    setModelError(null);
    try {
      const models = await fetchOllamaModels({ url: config.ollamaUrl ?? "http://localhost:11434" });
      setOllamaModels(models);
      if (models.length > 0 && !models.includes(config.model)) {
        onChange({ ...config, model: models[0] });
      }
    } catch (err: any) {
      setModelError(err.message || "Failed to fetch models");
    } finally {
      setIsFetchingModels(false);
    }
  };

  // Auto-fetch Ollama models only when provider is ollama
  useEffect(() => {
    if (config.provider === "ollama") {
      handleFetchOllamaModels();
    }
  }, [config.provider]);

  const getCodeSnippet = () => {
    if (config.provider === "ollama") {
      const ollamaUrl = (config.ollamaUrl ?? "http://localhost:11434").replace(/\/$/, "");
      return `const OLLAMA_URL = "${ollamaUrl}/api/chat";

async function chatOllamaStream() {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "${config.model}",
            "messages": [
                ${config.systemInstruction.trim() ? `{\n                    "role": "system",\n                    "content": ${JSON.stringify(config.systemInstruction.trim())}\n                },\n                ` : ""}{
                    "role": "user",
                    "content": "<YOUR_MESSAGE>"
                }
            ],
            "stream": true,
            "options": {
                "temperature": ${config.temperature},
                "top_p": ${config.topP},
                "num_predict": ${config.maxTokens}
            }
        })
    });

    if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const chunk = JSON.parse(trimmed);
            if (chunk.message?.content) {
                process.stdout.write(chunk.message.content);
            }
        }
    }

    console.log(); // newline at end
}

chatOllamaStream();`;
    }

    return `const API_KEY = "YOUR_API_SUBSCRIPTION_KEY";
const API_URL = "https://api.sarvam.ai/v1/chat/completions";

async function chatCompletionsStream() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "API-Subscription-Key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "${config.model}",
            "messages": [
                ${config.systemInstruction.trim() ? `{\n                    "role": "system",\n                    "content": ${JSON.stringify(config.systemInstruction.trim())}\n                },\n                ` : ""}{
                    "role": "user",
                    "content": "<YOUR_MESSAGE>"
                }
            ],
            "temperature": ${config.temperature},
            "top_p": ${config.topP},
            "max_tokens": ${config.maxTokens},
            "stream": true,
            "reasoning_effort": "${config.reasoningEffort}"
        })
    });

    if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") break;

            const chunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            if (content) process.stdout.write(content);
        }
    }

    console.log(); // newline at end
}

chatCompletionsStream();`;
  };

  const handleCopyCode = () => {
    playUISound("success", "glass");
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className={fullWidth
        ? "bg-[#FAFAFA] flex flex-col h-full overflow-hidden w-full"
        : `bg-[#FAFAFA] flex flex-col h-full overflow-hidden shrink-0 transition-[width,border-width] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isOpen ? "w-[340px] border-l border-gray-200" : "w-0 border-l-0"}`
      }
    >
      <div
        className={fullWidth
          ? "flex-1 flex flex-col h-full overflow-y-auto"
          : `w-[340px] flex-1 flex flex-col h-full overflow-y-auto transition-opacity duration-300 delay-100 ${isOpen ? "opacity-100" : "opacity-0"}`
        }
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">settings</h3>
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => {
                playUISound("pop", "aero");
                setShowCode(true);
              }}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <Code2 size={14} />
              Get code
            </button>
            <button
              onClick={() => {
                playUISound("success", "aero");
                onChange(DEFAULT_PLAYGROUND_CONFIG);
              }}
              className="p-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              title="Reset to defaults"
              aria-label="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                playUISound("drop", "aero");
                onClose();
              }}
              className="p-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              title="Close settings"
              aria-label="Close settings"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-6 shrink-0 pb-10">

          {/* Provider Selection */}
          <div>
            <label id="provider-label" className="text-[14px] font-medium text-gray-700 block mb-2">Provider</label>
            <div className="flex bg-gray-100 p-1 rounded-xl relative" role="radiogroup" aria-labelledby="provider-label">
              <button
                role="radio"
                aria-checked={config.provider === "sarvam"}
                onClick={() => {
                  playUISound("pop", "aero");
                  onChange({ ...config, provider: "sarvam", model: "sarvam-105b" });
                }}
                className={`relative flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors z-10 ${config.provider === "sarvam"
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {config.provider === "sarvam" && (
                  <motion.span
                    layoutId="active-provider-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                Sarvam AI
              </button>
              <button
                role="radio"
                aria-checked={config.provider === "ollama"}
                onClick={() => {
                  playUISound("pop", "aero");
                  onChange({ ...config, provider: "ollama", model: ollamaModels[0] || "" });
                }}
                className={`relative flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors z-10 ${config.provider === "ollama"
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {config.provider === "ollama" && (
                  <motion.span
                    layoutId="active-provider-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                Local Ollama
              </button>
            </div>
            {config.provider === "ollama" && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-2">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Run Ollama with CORS enabled</p>
                <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <code className="text-[12px] font-mono text-gray-700 select-all leading-none">
                    OLLAMA_ORIGINS="*" ollama serve
                  </code>
                  <button
                    onClick={() => {
                      playUISound("success", "glass");
                      navigator.clipboard.writeText('OLLAMA_ORIGINS="*" ollama serve');
                    }}
                    className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    title="Copy command"
                    aria-label="Copy Ollama command"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Ollama URL Input */}
          {config.provider === "ollama" && (
            <>
              <div>
                <label htmlFor="ollamaUrl" className="text-[14px] font-medium text-gray-700 block mb-2">Ollama URL</label>
                <div className="flex items-center gap-2 w-full">
                  <input
                    id="ollamaUrl"
                    type="text"
                    value={config.ollamaUrl ?? "http://localhost:11434"}
                    onChange={(e) => onChange({ ...config, ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <button
                    onClick={() => {
                      playUISound("click", "aero");
                      handleFetchOllamaModels();
                    }}
                    disabled={isFetchingModels}
                    className="flex-shrink-0 w-[96px] flex items-center justify-center px-3 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isFetchingModels ? "Fetching..." : "Refresh"}
                  </button>
                </div>
                {modelError && (
                  <p className="text-xs text-red-500 mt-2">{modelError}</p>
                )}
              </div>
              <div className="w-full h-[1px] bg-gray-200"></div>
            </>
          )}

          {/* Model Selection */}
          <div>
            <label htmlFor="modelSelect" className="text-[14px] font-medium text-gray-700 block mb-2">Model</label>
            <div className="relative">
              {config.provider === "sarvam" ? (
                <select
                  id="modelSelect"
                  value={config.model}
                  onChange={(e) => {
                    playUISound("pop", "aero");
                    onChange({ ...config, model: e.target.value });
                  }}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm cursor-pointer"
                  aria-label="Select Model"
                >
                  <option value="sarvam-105b">Sarvam 105B</option>
                  <option value="sarvam-30b">Sarvam 30B</option>
                </select>
              ) : (
                <select
                  id="modelSelect"
                  value={config.model}
                  onChange={(e) => {
                    playUISound("pop", "aero");
                    onChange({ ...config, model: e.target.value });
                  }}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm cursor-pointer"
                  aria-label="Select Ollama Model"
                >
                  {ollamaModels.length === 0 && <option value="">No models found</option>}
                  {ollamaModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {config.provider === "sarvam" && (
              <p className="text-xs text-gray-500 mt-2">
                {config.model === "sarvam-105b"
                  ? "Most intelligent model, best for complex logic."
                  : "Faster model, great for standard queries."}
              </p>
            )}
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* System Instructions */}
          <div>
            <label htmlFor="systemInstruction" className="text-[14px] font-medium text-gray-700 block mb-2">System instructions</label>
            <textarea
              id="systemInstruction"
              value={config.systemInstruction}
              onChange={(e) => onChange({ ...config, systemInstruction: e.target.value })}
              placeholder="You are a helpful assistant..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24"
            />
            <p className="text-xs text-gray-500 mt-2">
              Optional tone and style instructions for the model.
            </p>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="temperatureInput" className="text-[14px] font-medium text-gray-700">Temperature</label>
              <div className="w-12 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm text-gray-900 shadow-sm" aria-hidden="true">
                {config.temperature}
              </div>
            </div>
            <input
              id="temperatureInput"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onMouseDown={() => playUISound("click", "aero")}
              onMouseUp={() => playUISound("toggle", "aero")}
              onTouchStart={() => playUISound("click", "aero")}
              onTouchEnd={() => playUISound("toggle", "aero")}
              onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full accent-gray-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="topPInput" className="text-[14px] font-medium text-gray-700">Top P</label>
              <div className="w-12 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm text-gray-900 shadow-sm" aria-hidden="true">
                {config.topP}
              </div>
            </div>
            <input
              id="topPInput"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.topP}
              onMouseDown={() => playUISound("click", "aero")}
              onMouseUp={() => playUISound("toggle", "aero")}
              onTouchStart={() => playUISound("click", "aero")}
              onTouchEnd={() => playUISound("toggle", "aero")}
              onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
              className="w-full accent-gray-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label htmlFor="maxTokens" className="text-[14px] font-medium text-gray-700 block mb-2">Max Tokens</label>
            <input
              id="maxTokens"
              type="number"
              value={config.maxTokens}
              onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) || 1 })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          {/* Thinking Level / Reasoning Effort - Only for Sarvam */}
          {config.provider === "sarvam" && (
            <>
              <div>
                <label htmlFor="reasoningEffort" className="text-[14px] font-medium text-gray-700 block mb-2">Reasoning effort</label>
                <div className="relative">
                  <select
                    id="reasoningEffort"
                    value={config.reasoningEffort}
                    onChange={(e) => {
                      playUISound("pop", "aero");
                      onChange({ ...config, reasoningEffort: e.target.value as any });
                    }}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="w-full h-[1px] bg-gray-200"></div>
            </>
          )}

          {/* Ollama Model Capabilities */}
          {config.provider === "ollama" && ollamaCaps && (ollamaCaps.vision || ollamaCaps.thinking) && (
            <>
              <div>
                <label className="text-[14px] font-medium text-gray-700 block mb-1.5">Model capabilities</label>
                <p className="text-xs text-gray-400 mb-3">Features for {config.model}.</p>

                {/* Thinking toggle */}
                {ollamaCaps.thinking && (
                  <div className="flex items-center justify-between py-2.5 px-3 bg-white border border-gray-200 rounded-xl mb-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-800">Thinking</span>
                      <span className="text-[11px] text-gray-400">Enable model-specific internal reasoning blocks.</span>
                    </div>
                    <button
                      role="switch"
                      aria-checked={config.ollamaThinking ?? false}
                      aria-label="Toggle Thinking Capabilities"
                      onClick={() => {
                        playUISound("pop", "aero");
                        onChange({ ...config, ollamaThinking: !(config.ollamaThinking ?? false) });
                      }}
                      className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex-shrink-0 ${(config.ollamaThinking ?? false) ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      style={{ height: "22px", width: "40px" }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200"
                        style={{ transform: (config.ollamaThinking ?? false) ? "translateX(18px)" : "translateX(0)" }}
                      />
                    </button>
                  </div>
                )}

                {/* Vision note */}
                {ollamaCaps.vision && (
                  <div className="flex items-center gap-2.5 py-2.5 px-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span className="text-sm font-medium text-gray-800">Vision</span>
                      <span className="text-[11px] text-gray-500">Multimodal architecture detected.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full h-[1px] bg-gray-200"></div>
            </>
          )}

          {/* Error Simulation */}
          <div>
            <label htmlFor="simulatedError" className="text-[14px] font-medium text-gray-700 block mb-2">Simulate stream error</label>
            <div className="relative">
              <select
                id="simulatedError"
                value={config.simulatedError}
                onChange={(e) => {
                  playUISound("pop", "aero");
                  onChange({ ...config, simulatedError: e.target.value as any });
                }}
                className="w-full appearance-none bg-white border border-red-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-sm cursor-pointer"
                aria-label="Simulated Stream Error"
              >
                <option value="none">None (Normal Stream)</option>
                <option value="network">Simulate Network Drop</option>
                <option value="timeout">Simulate Timeout</option>
                <option value="interrupted">Simulate Stream Interrupted</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Forces the next generation to fail mid-stream to verify UX resilience.
            </p>
          </div>

        </div>
      </div>

      {/* Code Snippet Modal — portalled to body to escape parent CSS transform stacking context */}
      {isMounted && createPortal(
        <div
          className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${showCode
              ? "opacity-100 pointer-events-auto bg-black/40 backdrop-blur-[2px]"
              : "opacity-0 pointer-events-none bg-black/0 backdrop-blur-none"
            }`}
        >
          <div
            className={`bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[85vh] transition-all duration-300 transform ${showCode ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
              }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Integration Code</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                  title="Copy code"
                  aria-label="Copy code"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => {
                    playUISound("drop", "aero");
                    setShowCode(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  aria-label="Close code snippet"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-[#F6F8FA]">
              <pre className="text-[13px] leading-[1.6] font-mono text-gray-800 whitespace-pre-wrap break-all">
                {getCodeSnippet()}
              </pre>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
