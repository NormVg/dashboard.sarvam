import { AlignLeft, Languages, PenLine, Grip } from "lucide-react";

const suggestions = [
  {
    label: "Summarize a topic",
    icon: AlignLeft,
    value: "Summarize this topic in a few bullet points:",
  },
  {
    label: "Translate text",
    icon: Languages,
    value: "Translate this text to Hindi:",
  },
  {
    label: "Draft an email",
    icon: PenLine,
    value: "Draft a professional email about:",
  },
  {
    label: "Explain a concept",
    icon: Grip,
    value: "Explain this concept simply:",
  },
] as const;

export function ChatSuggestions({
  onSelect,
}: {
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {suggestions.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelect(s.value)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Icon size={16} className="text-gray-400" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
