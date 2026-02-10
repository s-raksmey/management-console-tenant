"use client";
import { ApolloProvider } from '@apollo/client/react';
import client from '@/lib/apolloClient';

export function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
