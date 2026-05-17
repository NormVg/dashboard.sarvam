"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowUp, Square, Mic, Loader2, Paperclip, X } from "lucide-react";
import { useMicrophone } from "../../hooks/useMicrophone";
import { playUISound } from "@thenormvg/web-have-sounds";

type Variant = "empty" | "thread";

export interface AttachedFile {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
}

interface PromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachments?: AttachedFile[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  variant: Variant;
  replyTo?: string | null;
  onClearReply?: () => void;
  allowAttachments?: boolean;
}

const MAX_ROWS = 6;
const LINE_HEIGHT = 24;
const BASE_PADDING = 24;

export function PromptBar({
  value,
  onChange,
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  variant,
  replyTo,
  onClearReply,
  allowAttachments = false,
}: PromptBarProps) {
  const sendDisabled = (disabled && !isStreaming) || (!value.trim() && !replyTo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);

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
          const response = await fetch("/api/speech", { method: "POST", body: formData });
          if (!response.ok) throw new Error("STT failed");
          const data = await response.json();
          if (data.transcript) onChange(value ? `${value} ${data.transcript}` : data.transcript);
          else if (data.text) onChange(value ? `${value} ${data.text}` : data.text);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    playUISound("pop", "aero");

    const newAttachments: AttachedFile[] = await Promise.all(
      files.map(
        (file) =>
          new Promise<AttachedFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              // strip the "data:...;base64," prefix for Ollama
              const base64 = dataUrl.split(",")[1];
              resolve({
                id: `${Date.now()}-${file.name}`,
                file,
                previewUrl: dataUrl,
                base64,
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
    // reset input so same file can be re-added
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    playUISound("drop", "aero");
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    playUISound("click", "aero");
    onSend(attachments.length > 0 ? attachments : undefined);
    setAttachments([]);
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const maxHeight = LINE_HEIGHT * MAX_ROWS + BASE_PADDING;
    el.style.transition = "none";
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    const targetHeight = Math.min(scrollHeight, maxHeight);
    const currentHeight = el.getBoundingClientRect().height;
    el.style.height = `${currentHeight}px`;
    requestAnimationFrame(() => {
      el.style.transition = "height 150ms ease-out";
      el.style.height = `${targetHeight}px`;
      el.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    });
  }, [value]);

  // Focus textarea when a reply is set
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  return (
    <div className="w-full relative shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[1.75rem] bg-white border border-gray-200 flex flex-col overflow-hidden transition-colors duration-300">

      {/* Reply quote bar */}
      <div
        style={{
          maxHeight: replyTo ? "80px" : "0px",
          opacity: replyTo ? 1 : 0,
          transition: "max-height 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
          overflow: "hidden",
        }}
      >
        <div className="flex items-start gap-2 px-4 pt-3 pb-1">
          <div className="w-0.5 self-stretch bg-gray-300 rounded-full flex-shrink-0" />
          <p className="flex-1 text-[12px] text-gray-500 leading-snug line-clamp-2 min-w-0">
            {replyTo}
          </p>
          <button
            onClick={() => {
              playUISound("drop", "aero");
              onClearReply?.();
            }}
            className="flex-shrink-0 p-0.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors mt-0.5"
            aria-label="Clear reply"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Image attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
          {attachments.map((att) => (
            <div key={att.id} className="relative group">
              <img
                src={att.previewUrl}
                alt={att.file.name}
                className="w-14 h-14 object-cover rounded-xl border border-gray-200"
              />
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove attachment"
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendDisabled) handleSend();
          }
        }}
        rows={1}
        aria-label="Message input"
        className={`w-full bg-transparent border-none outline-none resize-none focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-500 leading-6 transition-colors duration-300 ${
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
          {/* Mic button */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isProcessing}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse"
                : "text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            }`}
            title={isRecording ? "Stop recording" : "Voice input"}
            aria-label={isRecording ? "Stop recording" : "Voice input"}
            aria-pressed={isRecording}
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin text-gray-500" />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* File attachment button — Ollama only */}
          {allowAttachments && (
            <>
              <button
                type="button"
                onClick={() => {
                  playUISound("pop", "aero");
                  fileInputRef.current?.click();
                }}
                className="p-2 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                title="Attach image"
                aria-label="Attach image"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
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
            onClick={handleSend}
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
