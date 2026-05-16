import { Info, ChevronDown, Code2, RotateCcw, X } from "lucide-react";

interface ModelSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSettings({ isOpen, onClose }: ModelSettingsProps) {
  return (
    <div 
      className={`border-l border-gray-200 bg-[#FAFAFA] flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${
        isOpen ? "w-[340px]" : "w-0 border-l-0"
      }`}
    >
      <div className="w-[340px] flex-1 flex flex-col h-full overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Run settings</h3>
          <div className="flex items-center gap-1 text-gray-400">
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors text-xs font-medium">
              <Code2 size={14} />
              Get code
            </button>
            <button className="p-1 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors">
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
          
          {/* Model Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-gray-300 transition-colors relative">
            <h4 className="font-semibold text-gray-900 text-[15px] mb-1">Sarvam 105B Instruct</h4>
            <p className="text-xs text-gray-400 font-mono mb-2">sarvam-105b-instruct-v1</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our most intelligent model built for understanding and generating multiple Indian languages with superior context.
            </p>
          </div>

          {/* System Instructions Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-gray-300 transition-colors">
            <h4 className="font-medium text-gray-900 text-[14px] mb-1.5">System instructions</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Optional tone and style instructions for the model.
            </p>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[14px] font-medium text-gray-700">Temperature</label>
              <div className="w-12 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-sm text-gray-900 shadow-sm">
                1
              </div>
            </div>
            <input type="range" min="0" max="2" step="0.1" defaultValue="1" className="w-full accent-gray-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
          </div>

          {/* Thinking Level */}
          <div>
            <label className="text-[14px] font-medium text-gray-700 block mb-2">Thinking level</label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-sm cursor-pointer">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="w-full h-[1px] bg-gray-200"></div>

          {/* Tools Section */}
          <div>
            <div className="flex items-center justify-between mb-4 cursor-pointer">
              <label className="text-[14px] font-medium text-gray-700">Tools</label>
              <ChevronDown size={16} className="text-gray-400 rotate-180" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">Structured outputs</span>
                <div className="flex items-center gap-3">
                  <button className="text-[12px] text-blue-600 font-medium hidden hover:underline">Edit</button>
                  <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">Code execution</span>
                <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">Function calling</span>
                <div className="flex items-center gap-3">
                  <button className="text-[12px] text-gray-400 font-medium hover:text-gray-600 transition-colors">Edit</button>
                  <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[13px] text-gray-900 font-medium block">Grounding with Search</span>
                  <span className="text-[11px] text-gray-400">Source: Web Search</span>
                </div>
                <div className="w-9 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">URL context</span>
                <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
