import { useState, useEffect } from "react";
import { Aperture, ChevronRight } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ReasoningBlockProps {
  content: string;
  isStreaming: boolean;
}

export function ReasoningBlock({ content, isStreaming }: ReasoningBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [duration, setDuration] = useState(0);

  // Auto-collapse when streaming finishes
  useEffect(() => {
    if (!isStreaming) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isStreaming]);

  // Timer while streaming
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="mb-4 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      >
        <Aperture 
          size={16} 
          className={isStreaming ? "animate-spin" : ""} 
          style={isStreaming ? { animationDuration: '3s' } : undefined} 
        />
        <span className="font-medium text-[13px]">
          {isStreaming ? `Thinking (${duration}s)...` : `Thought for ${duration}s`}
        </span>
        <ChevronRight 
          size={14} 
          className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} 
        />
      </button>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pl-4 ml-4 border-l-2 border-gray-200 text-gray-500">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
