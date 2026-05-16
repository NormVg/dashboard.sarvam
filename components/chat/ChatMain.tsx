"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { ChatComposer } from "./ChatComposer";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatThread, type ChatMessage } from "./ChatThread";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "/api/chat";

export function ChatMain() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resolvedApiKey = useMemo(() => {
    return apiKey.trim() || (process.env.NEXT_PUBLIC_SARVAM_API_KEY ?? "").trim();
  }, [apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || !resolvedApiKey) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const messagesForRequest = [...messages, userMessage];

    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "API-Subscription-Key": resolvedApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sarvam-105b",
          messages: messagesForRequest,
          temperature: 0.8,
          top_p: 1,
          max_tokens: 4096,
          stream: true,
          reasoning_effort: "medium",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
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
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") break;

          try {
            const chunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            if (!content) continue;
            setMessages((prev) => {
              if (prev.length === 0) return prev;
              const lastIdx = prev.length - 1;
              const last = prev[lastIdx];
              if (last.role !== "assistant") return prev;
              const updated = { ...last, content: last.content + content };
              return [...prev.slice(0, lastIdx), updated];
            });
          } catch (e) {
            console.error("Error parsing chunk", e);
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        if (last.role !== "assistant") return prev;
        const updated = {
          ...last,
          content: `Error: ${error.message}. Please check your API key.`,
        };
        return [...prev.slice(0, lastIdx), updated];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;
  const isComposerDisabled = isLoading || !resolvedApiKey;

  return (
    <div className="flex-1 h-full bg-white relative overflow-hidden flex flex-col">
      {!(process.env.NEXT_PUBLIC_SARVAM_API_KEY ?? "").trim() && (
        <div className="absolute top-4 right-6 z-30 flex items-center gap-3">
          <input
            type="password"
            placeholder="API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 w-56 shadow-sm"
          />
          <button
            type="button"
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors border border-transparent shadow-sm"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 w-full overflow-y-auto pb-[140px] pt-4">
        <AnimatePresence>
          {!isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <ChatThread messages={messages} />
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer Area Container */}
      <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-end ${isEmpty ? 'justify-center' : 'pb-6'}`}>
        <motion.div
          layout
          initial={false}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className={`pointer-events-auto flex flex-col items-center w-full px-4 sm:px-8 ${isEmpty ? 'max-w-4xl' : 'max-w-3xl'}`}
        >
          {/* Header */}
          <AnimatePresence mode="popLayout">
            {isEmpty && (
              <motion.h1
                initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(4px)", transition: { duration: 0.2 } }}
                className="text-[3rem] sm:text-[3.25rem] leading-[1.05] font-serif text-gray-900 mb-8 tracking-tight text-center w-full"
              >
                How can I help you today?
              </motion.h1>
            )}
          </AnimatePresence>

          {/* Composer */}
          <motion.div layout className="w-full">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={handleSubmit}
              disabled={isComposerDisabled}
              variant={isEmpty ? "empty" : "thread"}
            />
          </motion.div>

          {/* Suggestions */}
          <AnimatePresence mode="popLayout">
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 20, filter: "blur(4px)", transition: { duration: 0.2 } }}
                className="w-full mt-8"
              >
                <ChatSuggestions
                  onSelect={(val) => setInput(val + " ")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
