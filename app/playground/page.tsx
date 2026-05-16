"use client";

import { useState } from "react";
import { PlaygroundMain } from "@/components/playground/PlaygroundMain";
import { ModelSettings } from "@/components/playground/ModelSettings";
import styles from "../dashboard.module.css";

export default function PlaygroundPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  return (
    <div className={styles.workspace}>
      <div className="flex-1 flex flex-row h-full overflow-hidden w-full">
        <PlaygroundMain 
          isSettingsOpen={isSettingsOpen} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
        <ModelSettings 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </div>
  );
}
