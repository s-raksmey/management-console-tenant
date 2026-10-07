const QUERY_CACHE_TTL_MS = 15_000;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const queryCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function isMutationDocument(document: string) {
  return /^\s*mutation[\s({]/i.test(document) || /\bmutation[\s({]/i.test(document);
}

function documentText(document: unknown): string {
  if (typeof document === "string") return document;
  if (document && typeof document === "object" && "loc" in document) {
    const loc = (document as { loc?: { source?: { body?: string } } }).loc;
    if (loc?.source?.body) return loc.source.body;
  }
  return String(document ?? "");
}

export function makeConsoleQueryCacheKey(
  audience: string,
  tenantId: string | null | undefined,
  document: unknown,
  variables?: unknown,
) {
  return [
    audience,
    tenantId || "",
    documentText(document).replace(/\s+/g, " ").trim(),
    JSON.stringify(variables ?? {}),
  ].join("::");
}

export function clearConsoleQueryCache() {
  queryCache.clear();
  inFlight.clear();
}

export async function consoleCachedRequest<T>(
  key: string,
  document: unknown,
  run: () => Promise<T>,
): Promise<T> {
  if (isMutationDocument(documentText(document))) {
    const result = await run();
    clearConsoleQueryCache();
    return result;
  }

  const hit = queryCache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const pending = inFlight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = run()
    .then((value) => {
      queryCache.set(key, {
        value,
        expiresAt: Date.now() + QUERY_CACHE_TTL_MS,
      });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}
