export function getForwardedTenantHeaders(req: Request): Record<string, string> {
  const tenantId = req.headers.get("x-tenant-id")?.trim();
  if (tenantId) {
    return { "x-tenant-id": tenantId };
  }

  const host =
    req.headers.get("x-tenant-host")?.trim() ||
    req.headers.get("x-forwarded-host")?.trim() ||
    req.headers.get("host")?.trim();

  if (host) {
    return { "x-tenant-host": host.toLowerCase() };
  }

  return {};
}
