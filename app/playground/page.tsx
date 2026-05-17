"use client";

import { useState, useEffect } from "react";
import { PlaygroundMain } from "@/components/playground/PlaygroundMain";
import { ModelSettings } from "@/components/playground/ModelSettings";
import styles from "../dashboard.module.css";
import { PlaygroundConfig, DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";
import { fetchOllamaModelCapabilities, OllamaCapabilities } from "@/lib/ollama-api";

export default function PlaygroundPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_PLAYGROUND_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ollamaCaps, setOllamaCaps] = useState<OllamaCapabilities>({ vision: false, thinking: false });

  // Update Ollama capabilities when the selected model changes
  useEffect(() => {
    if (config.provider === "ollama" && config.model) {
      fetchOllamaModelCapabilities(config.ollamaUrl, config.model).then(setOllamaCaps);
    }
  }, [config.provider, config.model, config.ollamaUrl]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("sarvam_playground_config");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Merge with defaults so new fields (like provider) don't break old cached configs
        setConfig({ 
          ...DEFAULT_PLAYGROUND_CONFIG, 
          ...parsed,
          provider: (parsed.provider === "ollama" || parsed.provider === "sarvam") ? parsed.provider : "sarvam"
        });
      } catch (e) {
        console.error("Failed to load playground config", e);
      }
    }

    const savedOpen = localStorage.getItem("sarvam_playground_settings_open");
    if (savedOpen !== null) {
      setIsSettingsOpen(savedOpen === "true");
    }
    
    setIsLoaded(true);
  }, []);

  const handleConfigChange = (newConfig: PlaygroundConfig) => {
    setConfig(newConfig);
    localStorage.setItem("sarvam_playground_config", JSON.stringify(newConfig));
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setIsSettingsOpen(open);
    localStorage.setItem("sarvam_playground_settings_open", String(open));
  };

  // Prevent flash of defaults by rendering only when loaded (standard SSR safety)
  if (!isLoaded) {
    return <div className="flex-1 bg-white h-full" />;
  }

  return (
    <div className={styles.workspace}>
      <div className="flex-1 flex flex-row h-full overflow-hidden w-full">
        <PlaygroundMain 
          isSettingsOpen={isSettingsOpen} 
          onOpenSettings={() => handleSettingsOpenChange(true)} 
          config={config}
          ollamaCaps={ollamaCaps}
        />
        <ModelSettings 
          isOpen={isSettingsOpen} 
          onClose={() => handleSettingsOpenChange(false)} 
          config={config}
          onChange={handleConfigChange}
          ollamaCaps={ollamaCaps}
        />
      </div>
    </div>
  );
}
