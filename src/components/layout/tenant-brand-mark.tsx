"use client";

import Image from "next/image";
import { resolveCmsMediaSrc, shouldBypassImageOptimizer } from "@/lib/cms-media";

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
      className={`relative aspect-square shrink-0 overflow-hidden bg-transparent ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="36px"
          unoptimized={shouldBypassImageOptimizer(src)}
          className="object-contain"
        />
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
