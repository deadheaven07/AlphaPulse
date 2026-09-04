import { useEffect } from "react";
import type { NavPage } from "../components/Sidebar";

interface UseKeyboardShortcutsProps {
  onSelectPage: (page: NavPage) => void;
  onToggleTheme: () => void;
  onToggleAi: () => void;
  onToggleQuickLook?: () => void;
  isModalOpen?: boolean;
}

const PAGE_HOTKEYS: Record<string, NavPage> = {
  "1": "overview",
  "2": "radar",
  "3": "studio",
  "4": "intraday",
  "5": "simulator",
  "6": "dividend",
  "7": "planner",
  "8": "portfolio",
};

export function useKeyboardShortcuts({
  onSelectPage,
  onToggleTheme,
  onToggleAi,
  onToggleQuickLook,
  isModalOpen = false,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is actively typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Spacebar for macOS Spacebar QuickLook
      if (e.code === "Space" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (onToggleQuickLook) onToggleQuickLook();
        return;
      }

      // Cmd+K / Ctrl+K for Spotlight AI Copilot
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onToggleAi();
        return;
      }

      // 'T' / 't' for Theme Toggle
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey && !isModalOpen) {
        e.preventDefault();
        onToggleTheme();
        return;
      }

      // 1-8 Numeric Jump
      if (PAGE_HOTKEYS[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey && !isModalOpen) {
        e.preventDefault();
        onSelectPage(PAGE_HOTKEYS[e.key]);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSelectPage, onToggleTheme, onToggleAi, onToggleQuickLook, isModalOpen]);
}
