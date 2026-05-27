"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_MINIMUM_VISIBLE_MS = 360;

/**
 * Prevents short requests from flashing loading content on and off.
 * Once loading is visible, it remains stable long enough to be perceived
 * as an intentional state rather than a rendering glitch.
 */
export function useStableLoading(
  isLoading: boolean,
  minimumVisibleMs = DEFAULT_MINIMUM_VISIBLE_MS,
) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      if (shownAtRef.current === null) {
        shownAtRef.current = Date.now();
      }
      if (!showLoading) {
        setShowLoading(true);
      }
      return;
    }

    if (!showLoading) {
      shownAtRef.current = null;
      return;
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(minimumVisibleMs - elapsed, 0);

    hideTimeout = setTimeout(() => {
      shownAtRef.current = null;
      setShowLoading(false);
    }, remaining);

    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isLoading, minimumVisibleMs, showLoading]);

  return showLoading;
}
