export const BRAND_CACHE_COOKIE = "tenant-console-brand";

export type CachedBrand = {
  name: string;
  logoUrl: string;
  kind: "console" | "tenant";
};

function isSafeLogoUrl(url: string) {
  return url.startsWith("/") || url.startsWith("http://") || url.startsWith("https://");
}

export function parseCachedBrand(value: string | undefined | null): CachedBrand | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<CachedBrand>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const logoUrl = typeof parsed.logoUrl === "string" ? parsed.logoUrl.trim() : "";
    const kind = parsed.kind === "tenant" || parsed.kind === "console" ? parsed.kind : null;
    if (!name || name.length > 120 || !logoUrl || logoUrl.length > 2000 || !isSafeLogoUrl(logoUrl) || !kind) {
      return null;
    }
    return { name, logoUrl, kind };
  } catch {
    return null;
  }
}

export function rememberBrand(brand: CachedBrand) {
  if (typeof document === "undefined") return;

  const payload = encodeURIComponent(JSON.stringify(brand));
  if (payload.length > 3500) return;

  document.cookie = `${BRAND_CACHE_COOKIE}=${payload}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
