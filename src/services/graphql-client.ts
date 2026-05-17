// src/services/graphql-client.ts
import { GraphQLClient } from "graphql-request"

export const SELECTED_TENANT_ID_KEY = "pulse_news_admin_selected_tenant_id";

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
  return new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql"
  )
}

export function getAuthenticatedGqlClient(token?: string) {
  const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql",
    {
      errorPolicy: 'all', // Return both data and errors
      requestMiddleware: (request) => {
        // Add debug logging if enabled
        return request;
      },
      responseMiddleware: (response) => {
        // Add debug logging if enabled
        
        // Check for null data responses that might indicate resolver issues
        if (response && 'data' in response && response.data && Object.values(response.data).some(value => value === null)) {
          console.warn('GraphQL response contains null values:', response.data);
        }
      }
    }
  );
  
  // Get token from localStorage if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('pulse_news_admin_token') : null);
  
  if (authToken) {
    client.setHeader('Authorization', `Bearer ${authToken}`);
  }

  const selectedTenantId = getSelectedTenantId();
  if (selectedTenantId) {
    client.setHeader("x-tenant-id", selectedTenantId);
  }
  
  return client;
}
