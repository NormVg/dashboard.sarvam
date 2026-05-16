import { ChatComposer } from "./ChatComposer";
import { ChatSuggestions } from "./ChatSuggestions";

export function ChatEmptyState({
  input,
  setInput,
  onSend,
  disabled,
}: {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-5xl text-center">
        <h1 className="text-[3.25rem] leading-[1.05] font-serif text-gray-900 mb-8 tracking-tight">
          How can I help you today?
        </h1>

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={onSend}
          disabled={disabled}
          variant="empty"
        />

        <div className="mt-8">
          <ChatSuggestions
            onSelect={(value) => {
              setInput(value + " ");
            }}
          />
        </div>
      </div>
    </div>
  );
}
