// src/services/graphql-client.ts
import { GraphQLClient } from "graphql-request"

export const SELECTED_TENANT_ID_KEY = "pulse_news_admin_selected_tenant_id";
export const COOKIE_SESSION_TOKEN = "cookie-session";

export function isBearerToken(token?: string | null) {
  return Boolean(token && token !== COOKIE_SESSION_TOKEN);
}

export function getSelectedTenantId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SELECTED_TENANT_ID_KEY);
}

export function setSelectedTenantId(tenantId: string | null) {
  if (typeof window === "undefined") return;

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
  const includeSelectedTenant = options?.includeSelectedTenant !== false;
  const selectedTenantId = includeSelectedTenant ? getSelectedTenantId() : null;
  if (selectedTenantId && !options?.hostOnly) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }

  // The management console host is shared. Never send it as x-tenant-host or
  // the API will bind requests to a sub-tenant that stored this URL as adminBaseUrl.
}

export function getGqlClient() {
  const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      credentials: "include",
    },
  );

  applyTenantHeaders(client);
  return client;
}

export function getAuthenticatedGqlClient(
  token?: string,
  options?: { includeSelectedTenant?: boolean },
) {
  const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      credentials: "include",
      requestMiddleware: (request) => {
        // Add debug logging if enabled
        return request;
      },
      responseMiddleware: (response) => {
        // GraphQL errors should reject the request so form controls can display them.
      }
    }
  );
  
  if (isBearerToken(token)) {
    client.setHeader("Authorization", `Bearer ${token}`);
  }

  applyTenantHeaders(client, options);
  return client;
}

export function getHostBoundGqlClient(token?: string) {
  const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      credentials: "include",
    },
  );

  if (isBearerToken(token)) {
    client.setHeader("Authorization", `Bearer ${token}`);
  }

  applyTenantHeaders(client, { hostOnly: true, includeSelectedTenant: false });
  return client;
}

export function getAuthFetchHeaders(options?: { includeSelectedTenant?: boolean }) {
  const headers: Record<string, string> = {};

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
