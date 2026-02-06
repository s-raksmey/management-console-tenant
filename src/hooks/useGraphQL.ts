// src/hooks/useGraphQL.ts
import { useState, useCallback } from 'react';
import { getAuthenticatedGqlClient } from '@/services/graphql-client';
import { useAuth } from '@/contexts/AuthContext';

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
}

export function useGraphQL() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const execute = useCallback(async <T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const client = getAuthenticatedGqlClient(token ?? undefined);
      const response = await client.request<T>(query, variables);
      return response;
    } catch (err: any) {
      console.error('🔴 GraphQL Error:', err);
      console.error('🔴 Error Response:', err.response);
      console.error('🔴 Error Message:', err.message);
      
      // Handle GraphQL errors
      if (err.response?.errors) {
        const errorMessages = err.response.errors.map((e: GraphQLError) => {
          console.error('🔴 GraphQL Error Detail:', {
            message: e.message,
            locations: e.locations,
            path: e.path
          });
          return e.message;
        }).join(', ');
        setError(errorMessages);
      } else {
        setError(err.message || 'An unknown error occurred');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const mutate = useCallback(async <T = any>(
    mutation: string,
    variables?: Record<string, any>
  ): Promise<T | null> => {
    return execute<T>(mutation, variables);
  }, [execute]);

  const query = useCallback(async <T = any>(
    queryString: string,
    variables?: Record<string, any>
  ): Promise<T | null> => {
    return execute<T>(queryString, variables);
  }, [execute]);

  return {
    loading,
    error,
    execute,
    mutate,
    query,
  };
}

// Specific hooks for common operations
export function useArticles() {
  const { query, loading, error } = useGraphQL();

  const getArticles = useCallback(async (filters?: {
    status?: string;
    categorySlug?: string;
    topic?: string;
    authorId?: string;
    take?: number;
    skip?: number;
  }) => {
    const ARTICLES_QUERY = `
      query GetArticles($status: ArticleStatus, $categorySlug: String, $topic: String, $authorId: ID, $take: Int, $skip: Int) {
        articles(status: $status, categorySlug: $categorySlug, topic: $topic, authorId: $authorId, take: $take, skip: $skip) {
          id
          title
          slug
          excerpt
          status
          topic
          coverImageUrl
          authorName
          isFeatured
          isEditorsPick
          isBreaking
          publishedAt
          createdAt
          updatedAt
          contentJson
          viewCount
          category {
            id
            name
            slug
          }
          author {
            id
          }
        }
      }
    `;

    return await query(ARTICLES_QUERY, filters);
  }, [query]);

  const getArticleById = useCallback(async (id: string) => {
    const ARTICLE_BY_ID_QUERY = `
      query GetArticleById($id: ID!) {
        articleById(id: $id) {
          id
          title
          slug
          excerpt
          contentJson
          status
          topic
          coverImageUrl
          authorName
          seoTitle
          seoDescription
          ogImageUrl
          isFeatured
          isEditorsPick
          isBreaking
          pinnedAt
          viewCount
          publishedAt
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
      }
    `;

    return await query(ARTICLE_BY_ID_QUERY, { id });
  }, [query]);

  const getArticleBySlug = useCallback(async (slug: string) => {
    const ARTICLE_BY_SLUG_QUERY = `
      query GetArticleBySlug($slug: String!) {
        articleBySlug(slug: $slug) {
          id
          title
          slug
          excerpt
          contentJson
          status
          topic
          coverImageUrl
          authorName
          seoTitle
          seoDescription
          ogImageUrl
          isFeatured
          isEditorsPick
          isBreaking
          pinnedAt
          viewCount
          publishedAt
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
      }
    `;

    return await query(ARTICLE_BY_SLUG_QUERY, { slug });
  }, [query]);

  return {
    getArticles,
    getArticleById,
    getArticleBySlug,
    loading,
    error,
  };
}

export function useArticleMutations() {
  const { mutate, loading, error } = useGraphQL();

  const upsertArticle = useCallback(async (id?: string, input?: any) => {
    const UPSERT_ARTICLE_MUTATION = `
      mutation UpsertArticle($id: ID, $input: UpsertArticleInput!) {
        upsertArticle(id: $id, input: $input) {
          id
          title
          slug
          excerpt
          contentJson
          status
          topic
          coverImageUrl
          authorName
          seoTitle
          seoDescription
          ogImageUrl
          isFeatured
          isEditorsPick
          isBreaking
          pinnedAt
          viewCount
          publishedAt
          createdAt
          updatedAt
          category {
            id
            name
            slug
          }
        }
      }
    `;

    return await mutate(UPSERT_ARTICLE_MUTATION, { id, input });
  }, [mutate]);

  const setArticleStatus = useCallback(async (id: string, status: string) => {
    const SET_ARTICLE_STATUS_MUTATION = `
      mutation SetArticleStatus($id: ID!, $status: ArticleStatus!) {
        setArticleStatus(id: $id, status: $status) {
          id
          status
          publishedAt
        }
      }
    `;

    return await mutate(SET_ARTICLE_STATUS_MUTATION, { id, status });
  }, [mutate]);

  const submitForReview = useCallback(async (id: string) => {
    const SUBMIT_FOR_REVIEW_MUTATION = `
      mutation SubmitForReview($id: ID!) {
        setArticleStatus(id: $id, status: REVIEW) {
          id
          status
          publishedAt
        }
      }
    `;

    return await mutate(SUBMIT_FOR_REVIEW_MUTATION, { id });
  }, [mutate]);


  const deleteArticle = useCallback(async (id: string) => {
    const DELETE_ARTICLE_MUTATION = `
      mutation DeleteArticle($id: ID!) {
        deleteArticle(id: $id)
      }
    `;

    return await mutate(DELETE_ARTICLE_MUTATION, { id });
  }, [mutate]);

  const requestBreakingNews = useCallback(async (articleId: string, reason?: string) => {
    const REQUEST_BREAKING_NEWS_MUTATION = `
      mutation RequestBreakingNews($articleId: ID!, $reason: String) {
        requestBreakingNews(articleId: $articleId, reason: $reason) {
          id
          status
          createdAt
        }
      }
    `;

    return await mutate(REQUEST_BREAKING_NEWS_MUTATION, { articleId, reason });
  }, [mutate]);

  const approveBreakingNewsRequest = useCallback(async (requestId: string, reviewComment?: string) => {
    const APPROVE_BREAKING_NEWS_MUTATION = `
      mutation ApproveBreakingNews($requestId: ID!, $reviewComment: String) {
        approveBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
          id
          isBreaking
        }
      }
    `;

    return await mutate(APPROVE_BREAKING_NEWS_MUTATION, { requestId, reviewComment });
  }, [mutate]);

  const rejectBreakingNewsRequest = useCallback(async (requestId: string, reviewComment?: string) => {
    const REJECT_BREAKING_NEWS_MUTATION = `
      mutation RejectBreakingNews($requestId: ID!, $reviewComment: String) {
        rejectBreakingNews(requestId: $requestId, reviewComment: $reviewComment) {
          id
          status
          reviewComment
        }
      }
    `;

    return await mutate(REJECT_BREAKING_NEWS_MUTATION, { requestId, reviewComment });
  }, [mutate]);

  const requestRevision = useCallback(async (input: { articleId: string; note?: string; changes: any }) => {
    const REQUEST_ARTICLE_REVISION_MUTATION = `
      mutation RequestArticleRevision($input: RequestArticleRevisionInput!) {
        requestArticleRevision(input: $input) {
          id
          status
          note
          proposedChanges
          createdAt
          requester {
            id
            name
            email
          }
        }
      }
    `;

    return await mutate(REQUEST_ARTICLE_REVISION_MUTATION, { input });
  }, [mutate]);

  const approveRevisionRequest = useCallback(async (requestId: string, reviewComment?: string) => {
    const APPROVE_ARTICLE_REVISION_MUTATION = `
      mutation ApproveArticleRevision($requestId: ID!, $reviewComment: String) {
        approveArticleRevision(requestId: $requestId, reviewComment: $reviewComment) {
          id
          title
          status
          revisionStatus
          updatedAt
        }
      }
    `;

    return await mutate(APPROVE_ARTICLE_REVISION_MUTATION, { requestId, reviewComment });
  }, [mutate]);

  const rejectRevisionRequest = useCallback(async (requestId: string, reviewComment?: string) => {
    const REJECT_ARTICLE_REVISION_MUTATION = `
      mutation RejectArticleRevision($requestId: ID!, $reviewComment: String) {
        rejectArticleRevision(requestId: $requestId, reviewComment: $reviewComment) {
          id
          status
          reviewComment
          reviewedAt
          reviewedBy {
            id
            name
          }
        }
      }
    `;

    return await mutate(REJECT_ARTICLE_REVISION_MUTATION, { requestId, reviewComment });
  }, [mutate]);

  return {
    upsertArticle,
    setArticleStatus,
    submitForReview,
    deleteArticle,
    requestBreakingNews,
    approveBreakingNewsRequest,
    rejectBreakingNewsRequest,
    requestRevision,
    approveRevisionRequest,
    rejectRevisionRequest,
    loading,
    error,
  };
}

export function useCategories() {
  const { query, loading, error } = useGraphQL();

  const getCategories = useCallback(async () => {
    const CATEGORIES_QUERY = `
      query GetCategories {
        categories {
          id
          name
          slug
          createdAt
          updatedAt
        }
      }
    `;

    return await query(CATEGORIES_QUERY);
  }, [query]);

  return {
    getCategories,
    loading,
    error,
  };
}

export function useSearch() {
  const { query, loading, error } = useGraphQL();

  const searchArticles = useCallback(async (searchInput: {
    query: string;
    categorySlug?: string;
    tags?: string[];
    authorName?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    take?: number;
    skip?: number;
  }) => {
    const SEARCH_ARTICLES_QUERY = `
      query SearchArticles($input: SearchInput!) {
        searchArticles(input: $input) {
          articles {
            id
            title
            slug
            excerpt
            status
            topic
            coverImageUrl
            authorName
            isFeatured
            isEditorsPick
            isBreaking
            viewCount
            publishedAt
            createdAt
            updatedAt
            category {
              id
              name
              slug
            }
          }
          totalCount
          hasMore
        }
      }
    `;

    return await query(SEARCH_ARTICLES_QUERY, { input: searchInput });
  }, [query]);

  const getSearchSuggestions = useCallback(async (searchQuery: string, limit = 5) => {
    const SEARCH_SUGGESTIONS_QUERY = `
      query SearchSuggestions($query: String!, $limit: Int) {
        searchSuggestions(query: $query, limit: $limit)
      }
    `;

    return await query(SEARCH_SUGGESTIONS_QUERY, { query: searchQuery, limit });
  }, [query]);

  return {
    searchArticles,
    getSearchSuggestions,
    loading,
    error,
  };
}

export function useRevisions() {
  const { query, loading, error } = useGraphQL();

  const getRevisionRequests = useCallback(async (articleId: string, status?: string) => {
    const REVISION_REQUESTS_QUERY = `
      query RevisionRequests($articleId: ID!, $status: RevisionRequestStatus) {
        revisionRequests(articleId: $articleId, status: $status) {
          id
          status
          note
          proposedChanges
          createdAt
          requester {
            id
            name
            email
          }
          reviewedAt
          reviewedBy {
            id
            name
          }
          reviewComment
        }
      }
    `;

    return await query(REVISION_REQUESTS_QUERY, { articleId, status });
  }, [query]);

  const getRevisionHistory = useCallback(async (articleId: string, limit = 20) => {
    const REVISION_HISTORY_QUERY = `
      query ArticleRevisionHistory($articleId: ID!, $limit: Int) {
        articleRevisionHistory(articleId: $articleId, limit: $limit) {
          id
          summary
          changes
          appliedAt
          appliedBy {
            id
            name
          }
          revisionRequest {
            id
            status
          }
        }
      }
    `;

    return await query(REVISION_HISTORY_QUERY, { articleId, limit });
  }, [query]);

  return {
    getRevisionRequests,
    getRevisionHistory,
    loading,
    error,
  };
}

// Re-export user management hook for convenience
export { useUserManagement } from './useUserManagement';
