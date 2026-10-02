"use client";

import { useState } from "react";

/** Stays false until the first request finishes, then stays ready during later refreshes. */
export function useInitialPageReady(isLoading: boolean) {
  const [settled, setSettled] = useState(false);

  if (!isLoading && !settled) {
    setSettled(true);
  }

  return settled;
}
