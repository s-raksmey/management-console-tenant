"use client";

import Image from "next/image";
import { resolveCmsMediaSrc, shouldBypassImageOptimizer } from "@/lib/cms-media";

export function TenantBrandMark({
  name,
  logoUrl,
  className = "h-8 w-8",
}: {
  name: string;
  logoUrl?: string | null;
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
        <div className="h-full w-full rounded-md bg-muted" aria-hidden="true" />
      )}
    </div>
  );
}
