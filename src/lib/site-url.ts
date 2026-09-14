export function isLoopbackSiteUrl(value?: string | null) {
  if (!value?.trim()) return false;

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

export function displaySiteUrl(value?: string | null) {
  if (!value?.trim() || isLoopbackSiteUrl(value)) return "";
  return value;
}
