"use client";

import { useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { rememberBrand } from "@/lib/brand-cache";
import {
  getTenantDisplayName,
  getTenantLogoUrl,
  isSubTenantDisplay,
} from "@/lib/tenant-display";

export function useConsoleBrand(consoleName: string) {
  const { activeTenant, managementLogoUrl, cachedBrand, brandResolved } = useTenant();
  const viewingSubTenant = isSubTenantDisplay(activeTenant);
  const liveLogo = viewingSubTenant ? getTenantLogoUrl(activeTenant) : managementLogoUrl;
  const brandName = viewingSubTenant
    ? getTenantDisplayName(activeTenant, consoleName)
    : !brandResolved && cachedBrand?.kind === "tenant"
      ? cachedBrand.name
      : consoleName;
  const brandLogoUrl = liveLogo || (!brandResolved ? cachedBrand?.logoUrl ?? null : null);

  useEffect(() => {
    if (!brandResolved || !brandLogoUrl) return;
    rememberBrand({
      name: brandName,
      logoUrl: brandLogoUrl,
      kind: viewingSubTenant ? "tenant" : "console",
    });
  }, [brandLogoUrl, brandName, brandResolved, viewingSubTenant]);

  return { brandName, brandLogoUrl };
}
