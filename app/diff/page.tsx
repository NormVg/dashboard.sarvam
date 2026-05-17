"use client";

import { useState, useEffect } from "react";
import { DiffMain } from "@/components/diff/DiffMain";
import { GitCompare } from "lucide-react";
import styles from "../dashboard.module.css";
import { DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";

export default function DiffViewPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Re-use the API key from the playground config if available
    try {
      const saved = localStorage.getItem("sarvam_playground_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="flex-1 bg-white h-full" />;

  return (
    <div className={`${styles.workspace} flex flex-col`}>
      {/* ——— Page Header ——— */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center">
            <GitCompare size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Model Output Diff</h1>
            <p className="text-xs text-gray-500">Compare outputs from two model configurations on the same prompt</p>
          </div>
        </div>
      </div>

      {/* ——— Diff Interface ——— */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <DiffMain
          apiKey={apiKey}
          initialConfigA={{ ...DEFAULT_PLAYGROUND_CONFIG, model: "sarvam-105b", provider: "sarvam" }}
          initialConfigB={{ ...DEFAULT_PLAYGROUND_CONFIG, model: "sarvam-30b", provider: "sarvam" }}
        />
      </div>
    </div>
  );
}
