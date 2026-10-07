// src/services/graphql-client.ts
import { GraphQLClient } from "graphql-request";
import {
  clearConsoleQueryCache,
  consoleCachedRequest,
  makeConsoleQueryCacheKey,
} from "@/services/graphql-query-cache";

export const SELECTED_TENANT_ID_KEY = "management_console_tenant_selected_tenant_id";
export const COOKIE_SESSION_TOKEN = "cookie-session";
export const CONSOLE_AUDIENCE = "tenant";
const SESSION_EXPIRED_EVENT = "management-console:session-expired";
const REFRESH_SESSION_MUTATION = "mutation RefreshSession { refreshSession { success } }";

let refreshInFlight: Promise<boolean> | null = null;

function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";
}

function isAuthFailurePayload(body: string) {
  return body.includes("Authentication required");
}

function shouldSkipRefresh(body: string) {
  return /refreshSession|mutation Login|mutation Logout|logoutAll|verifyTwoFactorLogin/.test(
    body,
  );
}

export function refreshConsoleSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(apiUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-console-audience": CONSOLE_AUDIENCE,
      },
      body: JSON.stringify({ query: REFRESH_SESSION_MUTATION }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        return payload?.data?.refreshSession?.success === true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function rebuildResponse(source: Response, body: string) {
  return new Response(body, {
    status: source.status,
    statusText: source.statusText,
    headers: source.headers,
  });
}

export async function fetchWithSessionRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const operation = typeof init?.body === "string" ? init.body : "";
  const response = await fetch(input, init);
  if (shouldSkipRefresh(operation)) return response;

  // Read once. Avoid response.clone().text() on the hot path.
  const payload = await response.text();
  if (!isAuthFailurePayload(payload)) {
    return rebuildResponse(response, payload);
  }

  const refreshed = await refreshConsoleSession();
  if (!refreshed) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return rebuildResponse(response, payload);
  }

  return fetch(input, init);
}

export function isBearerToken(token?: string | null) {
  return Boolean(token && token !== COOKIE_SESSION_TOKEN);
}

export function getSelectedTenantId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_TENANT_ID_KEY);
}

export function setSelectedTenantId(tenantId: string | null) {
  if (typeof window === "undefined") return;

  clearConsoleQueryCache();
  if (tenantId) {
    localStorage.setItem(SELECTED_TENANT_ID_KEY, tenantId);
  } else {
    localStorage.removeItem(SELECTED_TENANT_ID_KEY);
  }
}

function applyTenantHeaders(
  client: GraphQLClient,
  options?: { includeSelectedTenant?: boolean; hostOnly?: boolean },
) {
  client.setHeader("x-console-audience", CONSOLE_AUDIENCE);
  const includeSelectedTenant = options?.includeSelectedTenant !== false;
  const selectedTenantId = includeSelectedTenant ? getSelectedTenantId() : null;
  if (selectedTenantId && !options?.hostOnly) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }

  // The management console host is shared. Never send it as x-tenant-host or
  // the API will bind requests to a sub-tenant that stored this URL as adminBaseUrl.
}

function withQueryCache(
  client: GraphQLClient,
  options?: { includeSelectedTenant?: boolean },
): GraphQLClient {
  const rawRequest = client.request.bind(client) as (
    document: unknown,
    variables?: unknown,
    requestHeaders?: HeadersInit,
  ) => Promise<unknown>;

  client.request = (async (document: unknown, variables?: unknown, requestHeaders?: HeadersInit) => {
    const tenantId =
      options?.includeSelectedTenant === false ? null : getSelectedTenantId();
    const key = makeConsoleQueryCacheKey(
      CONSOLE_AUDIENCE,
      tenantId,
      document,
      variables,
    );

    return consoleCachedRequest(key, document, () =>
      rawRequest(document, variables, requestHeaders),
    );
  }) as GraphQLClient["request"];

  return client;
}

export function getGqlClient() {
  const client = new GraphQLClient(apiUrl(), {
    credentials: "include",
    fetch: fetchWithSessionRefresh,
  });

  applyTenantHeaders(client);
  return withQueryCache(client);
}

export function getAuthenticatedGqlClient(
  token?: string,
  options?: { includeSelectedTenant?: boolean },
) {
  const client = new GraphQLClient(apiUrl(), {
    credentials: "include",
    fetch: fetchWithSessionRefresh,
  });

  if (isBearerToken(token)) {
    client.setHeader("Authorization", `Bearer ${token}`);
  }

  applyTenantHeaders(client, options);
  return withQueryCache(client, options);
}

export function getHostBoundGqlClient(token?: string) {
  const client = new GraphQLClient(apiUrl(), {
    credentials: "include",
    fetch: fetchWithSessionRefresh,
  });

  if (isBearerToken(token)) {
    client.setHeader("Authorization", `Bearer ${token}`);
  }

  applyTenantHeaders(client, { hostOnly: true, includeSelectedTenant: false });
  return withQueryCache(client, { includeSelectedTenant: false });
}

export function getAuthFetchHeaders(options?: { includeSelectedTenant?: boolean }) {
  const headers: Record<string, string> = {
    "x-console-audience": CONSOLE_AUDIENCE,
  };

  if (typeof window === "undefined") return headers;

  if (options?.includeSelectedTenant === false) {
    return headers;
  }

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    headers["x-tenant-id"] = selectedTenantId;
  }

  return headers;
}

export { clearConsoleQueryCache };
