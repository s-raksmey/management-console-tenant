import { CONSOLE_AUDIENCE } from "@/services/graphql-client";

export function getForwardedTenantHeaders(req: Request): Record<string, string> {
  const audience = { "x-console-audience": CONSOLE_AUDIENCE };
  const tenantId = req.headers.get("x-tenant-id")?.trim();
  if (tenantId) {
    return { ...audience, "x-tenant-id": tenantId };
  }

  const host =
    req.headers.get("x-tenant-host")?.trim() ||
    req.headers.get("x-forwarded-host")?.trim() ||
    req.headers.get("host")?.trim();

  if (host) {
    return { ...audience, "x-tenant-host": host.toLowerCase() };
  }

  return audience;
}
