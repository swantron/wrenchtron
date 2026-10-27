"use client";

import { useEffect } from "react";

/**
 * For overlays on a phone: opening one adds a history entry, so the back button
 * closes the overlay instead of leaving the page. Close it with the returned
 * function (it goes back through that entry); `onClose` runs once it has.
 */
export function useBackToClose(key: string, onClose: () => void): () => void {
  useEffect(() => {
    if (!window.history.state?.[key]) {
      window.history.pushState({ ...window.history.state, [key]: true }, "");
    }
    const handlePop = () => onClose();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("popstate", handlePop);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("popstate", handlePop);
      document.removeEventListener("keydown", handleKey);
    };
  }, [key, onClose]);

  return () => window.history.back();
}
