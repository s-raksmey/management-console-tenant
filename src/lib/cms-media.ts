export function getApiOrigin() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql")
    .replace(/\/graphql\/?$/, "")
    .replace(/\/+$/, "");
}

export function resolveCmsMediaSrc(value: string) {
  if (value.startsWith("/media/files/")) {
    return `${getApiOrigin()}${value}`;
  }
  return value;
}
