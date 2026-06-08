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

export function getGqlClient() {
  const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      credentials: "include",
    },
  );

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }

  return client;
}

export function getAuthenticatedGqlClient(token?: string) {
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

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }
  
  return client;
}

export function getAuthFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window === "undefined") return headers;

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    headers["x-tenant-id"] = selectedTenantId;
  }

  return headers;
}
