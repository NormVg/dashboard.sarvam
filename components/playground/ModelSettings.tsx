import { useState } from "react";
import { Info, ChevronDown, Code2, RotateCcw, X, Copy, Check } from "lucide-react";
import { PlaygroundConfig, DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";

interface ModelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlaygroundConfig;
  onChange: (config: PlaygroundConfig) => void;
}

export function ModelSettings({ isOpen, onClose, config, onChange }: ModelSettingsProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCodeSnippet = () => {
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
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className={`bg-[#FAFAFA] flex flex-col h-full overflow-hidden shrink-0 transition-[width,border-width] duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        isOpen ? "w-[340px] border-l border-gray-200" : "w-0 border-l-0"
      }`}
    >
      <div 
        className={`w-[340px] flex-1 flex flex-col h-full overflow-y-auto transition-opacity duration-300 delay-100 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">settings</h3>
          <div className="flex items-center gap-1 text-gray-400">
            <button 
              onClick={() => setShowCode(true)}
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors text-xs font-medium"
            >
              <Code2 size={14} />
              Get code
            </button>
            <button
              onClick={() => onChange(DEFAULT_PLAYGROUND_CONFIG)}
              className="p-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-6 shrink-0">

          {/* Model Selection */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">Model</label>
            <div className="relative">
              <select
                value={config.model}
                onChange={(e) => onChange({ ...config, model: e.target.value })}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm cursor-pointer"
              >
                <option value="sarvam-105b">Sarvam 105B</option>
                <option value="sarvam-30b">Sarvam 30B</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {config.model === "sarvam-105b"
                ? "Most intelligent model, best for complex logic."
                : "Faster model, great for standard queries."}
            </p>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* System Instructions */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">System instructions</label>
            <textarea
              value={config.systemInstruction}
              onChange={(e) => onChange({ ...config, systemInstruction: e.target.value })}
              placeholder="You are a helpful assistant..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24"
            />
            <p className="text-xs text-gray-400 mt-2">
              Optional tone and style instructions for the model.
            </p>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[14px] font-medium text-gray-700">Temperature</label>
              <div className="w-12 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm text-gray-900 shadow-sm">
                {config.temperature}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full accent-gray-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[14px] font-medium text-gray-700">Top P</label>
              <div className="w-12 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm text-gray-900 shadow-sm">
                {config.topP}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.topP}
              onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
              className="w-full accent-gray-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">Max Tokens</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) || 1 })}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          {/* Thinking Level / Reasoning Effort */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">Reasoning effort</label>
            <div className="relative">
              <select
                value={config.reasoningEffort}
                onChange={(e) => onChange({ ...config, reasoningEffort: e.target.value as any })}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Error Simulation */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">Simulate stream error</label>
            <div className="relative">
              <select
                value={config.simulatedError}
                onChange={(e) => onChange({ ...config, simulatedError: e.target.value as any })}
                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm cursor-pointer animate-pulse-subtle"
              >
                <option value="none">None (Normal Stream)</option>
                <option value="network">Simulate Network Drop</option>
                <option value="timeout">Simulate Timeout</option>
                <option value="interrupted">Simulate Stream Interrupted</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Forces the next generation to fail mid-stream to verify UX resilience.
            </p>
          </div>

        </div>
      </div>

      {/* Code Snippet Modal Overlay */}
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          showCode 
            ? "opacity-100 pointer-events-auto bg-black/40 backdrop-blur-[2px]" 
            : "opacity-0 pointer-events-none bg-black/0 backdrop-blur-none"
        }`}
      >
        <div 
          className={`bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[85vh] transition-all duration-300 transform ${
            showCode ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
          }`}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Node.js Integration</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button
                onClick={() => setShowCode(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto bg-[#F6F8FA]">
            <pre className="text-[13px] leading-[1.6] font-mono text-gray-800 whitespace-pre-wrap break-all">
              {getCodeSnippet()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
