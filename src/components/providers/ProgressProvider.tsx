"use client";

import { ProgressProvider as BProgressProvider } from "@bprogress/next/app";

type ProgressProviderProps = {
  children: React.ReactNode;
};

export function ProgressProvider({ children }: ProgressProviderProps) {
  return (
    <BProgressProvider
      height="3px"
      color="var(--primary)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </BProgressProvider>
  );
}
