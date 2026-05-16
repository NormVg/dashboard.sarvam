import { ArrowUp, Paperclip, Mic } from "lucide-react";

type Variant = "empty" | "thread";

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  variant,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  variant: Variant;
}) {
  const sendDisabled = disabled || !value.trim();

  return (
    <div className="w-full relative shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[1.75rem] bg-white border border-gray-200 flex flex-col overflow-hidden transition-all duration-300">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendDisabled) onSend();
          }
        }}
        className={`w-full bg-transparent border-none outline-none resize-none focus:outline-none focus:ring-0 text-gray-700 placeholder:text-gray-400 transition-all duration-300 ${
          variant === "empty"
            ? "h-[80px] sm:h-[96px] px-6 py-5 text-lg sm:text-xl"
            : "h-[64px] px-4 py-3 text-[15px]"
        }`}
        placeholder="What's on your mind?"
        disabled={disabled}
      />

      <div className="flex items-center justify-between px-3 pb-3">
        {variant !== "empty" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Voice input"
            >
              <Mic size={18} />
            </button>
          </div>
        ) : (
          <div /> /* Spacer */
        )}

        <button
          type="button"
          onClick={onSend}
          disabled={sendDisabled}
          className={`flex items-center justify-center bg-[#9CA3AF] text-white rounded-full hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${
            variant === "empty" ? "w-11 h-11 ml-auto mr-1" : "w-9 h-9 ml-auto"
          }`}
          title="Send"
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
}
