import { Bot, User } from "lucide-react";
import { ReasoningBlock } from "../playground/ReasoningBlock";
import { MarkdownRenderer } from "../playground/MarkdownRenderer";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

export function ChatThread({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-40 pt-8 px-8">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user"
                ? "bg-gray-900 text-white"
                : "bg-[#FAFAFA] border border-gray-200 text-gray-700"
            }`}
          >
            {msg.role === "user" ? (
              <User size={16} />
            ) : (
              <Bot 
                size={16} 
                className={idx === messages.length - 1 && !msg.content ? "animate-spin" : ""} 
                style={idx === messages.length - 1 && !msg.content ? { animationDuration: '3s' } : undefined}
              />
            )}
          </div>
          <div
            className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === "user"
                ? "bg-gray-100 text-gray-900"
                : "bg-transparent text-gray-800 w-full"
            }`}
          >
            {msg.reasoning && (
              <ReasoningBlock 
                content={msg.reasoning}
                isStreaming={idx === messages.length - 1 && !msg.content}
              />
            )}
            {msg.role === "user" ? (
              msg.content
            ) : (
              msg.content ? <MarkdownRenderer content={msg.content} /> : <span className="animate-pulse">...</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
