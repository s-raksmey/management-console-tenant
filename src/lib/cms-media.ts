export function normalizeCmsMediaUrl(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^https?:\/+(\/?(?:media\/files|uploads)\/.+)$/i);
  if (!match) return trimmed;
  return match[1].startsWith("/") ? match[1] : `/${match[1]}`;
}

export function getApiOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql")
    .replace(/\/graphql\/?$/, "")
    .replace(/\/+$/, "");
}

export function resolveCmsMediaSrc(value: string) {
  const normalized = normalizeCmsMediaUrl(value);
  if (normalized.startsWith("/media/files/")) {
    return `${getApiOrigin()}${normalized}`;
  }
  return normalized;
}
