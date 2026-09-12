"use client";

import { resolveCmsMediaSrc } from "@/lib/cms-media";

export function TenantBrandMark({
  name,
  logoUrl,
  initials,
  className = "h-8 w-8",
}: {
  name: string;
  logoUrl?: string | null;
  initials: string;
  className?: string;
}) {
  const src = logoUrl ? resolveCmsMediaSrc(logoUrl) : null;

  return (
    <div
      className={`aspect-square shrink-0 overflow-hidden bg-transparent ${className}`}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-900 dark:bg-slate-800">
          <span className="text-sm font-semibold text-white">
            {initials || "PN"}
          </span>
        </div>
      )}
    </div>
  );
}
