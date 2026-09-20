import { useEffect, useRef } from "react";

/**
 * Returns a ref to attach to a floating container. While `enabled`, a pointer
 * press outside the container or the Escape key calls `onDismiss`.
 */
export function useOutsideDismiss<T extends HTMLElement>(enabled: boolean, onDismiss: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onDismiss]);

  return ref;
}
