import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { CONSOLE_AUDIENCE, SELECTED_TENANT_ID_KEY } from '@/services/graphql-client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL || '/graphql',
    credentials: 'include',
    fetch: (uri, options) => {
      const headers = new Headers(options?.headers);

      headers.set('x-console-audience', CONSOLE_AUDIENCE);

      if (typeof window !== 'undefined') {
        const tenantId = localStorage.getItem(SELECTED_TENANT_ID_KEY);
        if (tenantId) {
          headers.set('x-tenant-id', tenantId);
        }
      }

      return fetch(uri, {
        ...options,
        headers,
      });
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
