import { useEffect } from "react";

interface HotkeyHandlers {
  /** Move selection down (j). */
  onNext: () => void;
  /** Move selection up (k). */
  onPrev: () => void;
  /** Trigger "Convertir en projet" (v). */
  onConvert: () => void;
  /** Trigger "Demander complément" (c). */
  onAskCompletion: () => void;
  /** Trigger "Rejeter" (r). */
  onReject: () => void;
  /** Focus the search input (/). */
  onFocusSearch: () => void;
}

const TARGET_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useRequestHotkeys(handlers: HotkeyHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when the user is typing in an input/textarea -- except "/" which we always honor.
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (TARGET_TAGS.has(target.tagName) || (target as HTMLElement).isContentEditable);

      if (e.key === "/" && !inField) {
        e.preventDefault();
        handlers.onFocusSearch();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (inField) return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          handlers.onNext();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          handlers.onPrev();
          break;
        case "v":
        case "V":
          e.preventDefault();
          handlers.onConvert();
          break;
        case "c":
        case "C":
          e.preventDefault();
          handlers.onAskCompletion();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handlers.onReject();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, handlers]);
}
