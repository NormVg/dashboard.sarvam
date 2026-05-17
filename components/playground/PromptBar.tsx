"use client";

import { useRef, useEffect } from "react";
import { ArrowUp, Square, Mic, Loader2 } from "lucide-react";
import { useMicrophone } from "../../hooks/useMicrophone";
import { playUISound } from "@thenormvg/web-have-sounds";

type Variant = "empty" | "thread";

interface PromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  variant: Variant;
}

const MAX_ROWS = 6;
const LINE_HEIGHT = 24; // px per line
const BASE_PADDING = 24; // vertical padding

export function PromptBar({
  value,
  onChange,
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  variant,
}: PromptBarProps) {
  const sendDisabled = (disabled && !isStreaming) || !value.trim();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isRecording, isProcessing, setIsProcessing, startRecording, stopRecording } = useMicrophone();

  const handleMicClick = async () => {
    if (isRecording) {
      playUISound("drop", "aero");
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      if (audioBlob) {
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");

          const response = await fetch("/api/speech", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("STT failed");

          const data = await response.json();
          // Sarvam REST API usually returns { transcript: "..." }
          if (data.transcript) {
            onChange(value ? `${value} ${data.transcript}` : data.transcript);
          } else if (data.text) {
            onChange(value ? `${value} ${data.text}` : data.text);
          }
        } catch (error) {
          console.error("Transcription error:", error);
        }
      }
      setIsProcessing(false);
    } else {
      playUISound("pop", "aero");
      startRecording();
    }
  };

  // Auto-resize textarea with smooth height animation
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const maxHeight = LINE_HEIGHT * MAX_ROWS + BASE_PADDING;

    // Step 1: measure the natural height (no transition, reset to auto)
    el.style.transition = "none";
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    const targetHeight = Math.min(scrollHeight, maxHeight);

    // Grab current rendered height before we change anything
    const currentHeight = el.getBoundingClientRect().height;

    // Step 2: snap back to current height instantly
    el.style.height = `${currentHeight}px`;

    // Step 3: in the next frame, enable transition and set target
    requestAnimationFrame(() => {
      el.style.transition = "height 150ms ease-out";
      el.style.height = `${targetHeight}px`;
      el.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    });
  }, [value]);

  return (
    <div className="w-full relative shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[1.75rem] bg-white border border-gray-200 flex flex-col overflow-hidden transition-colors duration-300">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendDisabled) {
              playUISound("click", "aero");
              onSend();
            }
          }
        }}
        rows={1}
        className={`w-full bg-transparent border-none outline-none resize-none focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400 leading-6 transition-colors duration-300 ${
          variant === "empty"
            ? "px-5 py-4 text-[17px]"
            : "px-5 py-3 text-[15px]"
        }`}
        style={{ minHeight: variant === "empty" ? "80px" : "56px" }}
        placeholder="What's on your mind?"
        disabled={disabled}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse" 
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
            aria-label={isRecording ? "Stop recording" : "Voice input"}
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Mic size={18} />
            )}
          </button>
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={() => {
              playUISound("drop", "aero");
              onStop?.();
            }}
            className={`flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
              variant === "empty" ? "w-10 h-10 ml-auto" : "w-9 h-9 ml-auto"
            }`}
            title="Stop generating"
            aria-label="Stop generating"
          >
            <Square size={14} fill="white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playUISound("click", "aero");
              onSend();
            }}
            disabled={sendDisabled}
            suppressHydrationWarning
            className={`flex items-center justify-center text-white rounded-full transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 ${
              sendDisabled 
                ? "bg-[#9CA3AF] cursor-not-allowed opacity-50" 
                : "bg-black hover:bg-gray-800"
            } ${
              variant === "empty" ? "w-10 h-10 ml-auto" : "w-9 h-9 ml-auto"
            }`}
            title="Send message"
            aria-label="Send message"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
