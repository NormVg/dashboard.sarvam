import { AlertCircle } from "lucide-react";

export function ComparePanel({ title, modelName, content, isChanged }: { title: string, modelName: string, content: string, isChanged?: boolean }) {
  return (
    <div className="flex-1 flex flex-col h-full border-r border-gray-200 last:border-r-0 bg-white">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600 shadow-sm">
          {modelName}
        </span>
      </div>
      <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-gray-800">
        {isChanged ? (
          <div className="bg-red-50 text-red-900 px-2 py-1 rounded -mx-2 line-through opacity-80 mb-2">
            {"const output = await model.generate(prompt);"}
          </div>
        ) : null}
        
        {isChanged ? (
          <div className="bg-green-50 text-green-900 px-2 py-1 rounded -mx-2">
            {"const output = await client.completions.create({ prompt });"}
          </div>
        ) : (
          <div>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
