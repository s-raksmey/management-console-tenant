"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { List, Plus } from "lucide-react";

export function AdsNavigation({ canCreate = true }: { canCreate?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId");
  const createHref = `/ads/new${tenantId ? `?tenantId=${tenantId}` : ""}`;
  const listActive = pathname === "/ads";
  const createActive = pathname === "/ads/new";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4" aria-label="Ads management">
      <Link
        href="/ads"
        className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
          listActive
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <List className="h-4 w-4" />
        All Advertisements
      </Link>
      {canCreate && (
        <Link
          href={createHref}
          className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
            createActive
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Plus className="h-4 w-4" />
          Create New
        </Link>
      )}
    </nav>
  );
}
