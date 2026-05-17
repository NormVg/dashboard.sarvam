"use client";

import { useState } from "react";
import { PlaygroundMain } from "@/components/playground/PlaygroundMain";
import { ModelSettings } from "@/components/playground/ModelSettings";
import styles from "../dashboard.module.css";
import { PlaygroundConfig, DEFAULT_PLAYGROUND_CONFIG } from "@/types/playground";

export default function PlaygroundPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_PLAYGROUND_CONFIG);

  return (
    <div className={styles.workspace}>
      <div className="flex-1 flex flex-row h-full overflow-hidden w-full">
        <PlaygroundMain 
          isSettingsOpen={isSettingsOpen} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          config={config}
        />
        <ModelSettings 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          config={config}
          onChange={setConfig}
        />
      </div>
    </div>
  );
}
