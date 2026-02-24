import { useState, useEffect, useCallback } from 'react';
import { getAuthenticatedGqlClient } from '@/services/graphql-client';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UseTopicsResult {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  loadTopicsForCategory: (categorySlug: string) => Promise<void>;
  clearTopics: () => void;
}

const TOPICS_BY_CATEGORY_QUERY = `
  query GetTopicsByCategory($categorySlug: String!) {
    topicsByCategory(categorySlug: $categorySlug) {
      id
      slug
      title
      description
      category {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`;

export function useTopics(): UseTopicsResult {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopicsForCategory = useCallback(async (categorySlug: string) => {
    if (!categorySlug) {
      setTopics([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const client = getAuthenticatedGqlClient();
      const result = await client.request(TOPICS_BY_CATEGORY_QUERY, { categorySlug });
      setTopics(result.topicsByCategory || []);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTopics = useCallback(() => {
    setTopics([]);
    setError(null);
  }, []);

  return {
    topics,
    loading,
    error,
    loadTopicsForCategory,
    clearTopics,
  };
}
