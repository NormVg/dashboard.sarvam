"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Code2, GitCompare } from "lucide-react";
import { playUISound } from "@thenormvg/web-have-sounds";
import styles from "../app/dashboard.module.css";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    playUISound("toggle", "aero");
  };

  const navLinks = [
    { href: "/playground", label: "Playground", icon: Code2 },
    { href: "/diff", label: "Diff View", icon: GitCompare },
  ];

  return (
    <aside 
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}
    >
      {/* Header & Collapse Toggle */}
      <div className="flex items-center w-full box-border p-4">
        <div className={`${styles.logoWrapper} ${isCollapsed ? styles.logoWrapperCollapsed : styles.logoWrapperExpanded}`}>
          <h1 className={styles.logo}>
            sarvam
          </h1>
        </div>
        <div className="flex items-center justify-center ml-auto">
          <button 
            onClick={toggleSidebar}
            className={styles.toggleButton}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`${styles.sidebarContent} px-3 py-4 space-y-1`} aria-label="Main Navigation">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={isCollapsed ? link.label : undefined}
            >
              <Icon size={18} className={`shrink-0 ${isActive ? "text-gray-900" : "text-gray-500"}`} />
              <span 
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                  isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
