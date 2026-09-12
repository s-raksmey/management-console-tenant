export type TenantDisplaySource = {
  name?: string | null;
  isMainTenant?: boolean | null;
  sites?: Array<{
    name?: string | null;
    logoUrl?: string | null;
    isPrimary?: boolean | null;
    isActive?: boolean | null;
  }> | null;
};

export function getTenantSite(tenant: TenantDisplaySource | null | undefined) {
  const sites = tenant?.sites ?? [];
  return (
    sites.find((site) => site.isPrimary && site.isActive) ||
    sites.find((site) => site.isPrimary) ||
    sites[0] ||
    null
  );
}

export function getTenantDisplayName(
  tenant: TenantDisplaySource | null | undefined,
  fallback: string,
) {
  if (tenant?.isMainTenant) return fallback;

  const siteName = getTenantSite(tenant)?.name?.trim();
  const tenantName = tenant?.name?.trim();
  return siteName || tenantName || fallback;
}

export function isSubTenantDisplay(
  tenant: TenantDisplaySource | null | undefined,
) {
  return Boolean(tenant) && tenant?.isMainTenant !== true;
}

export function getTenantLogoUrl(
  tenant: TenantDisplaySource | null | undefined,
) {
  if (!isSubTenantDisplay(tenant)) return null;
  const logoUrl = getTenantSite(tenant)?.logoUrl?.trim();
  return logoUrl || null;
}

export function withTenantLogoUrl<T extends TenantDisplaySource>(
  tenant: T,
  logoUrl?: string | null,
) {
  const nextLogoUrl = logoUrl?.trim();
  if (!nextLogoUrl || tenant.isMainTenant) return tenant;

  const sites = tenant.sites ?? [];
  if (sites.length === 0) {
    return {
      ...tenant,
      sites: [{ logoUrl: nextLogoUrl, isPrimary: true, isActive: true }],
    };
  }

  const target =
    sites.find((site) => site.isPrimary && site.isActive) ||
    sites.find((site) => site.isPrimary) ||
    sites[0];

  return {
    ...tenant,
    sites: sites.map((site) =>
      site === target ? { ...site, logoUrl: nextLogoUrl } : site,
    ),
  };
}
