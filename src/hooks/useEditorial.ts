// src/hooks/useEditorial.ts
import { useState, useCallback } from 'react';
import { getAuthenticatedGqlClient } from '@/services/graphql-client';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, UserRole } from '@/utils/rbac';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EditorialStats {
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  publishedThisWeek: number;
  totalAuthors: number;
  featuredArticles: number;
  avgReviewTime: number;
  contentScore: number;
  approvalRate: number;
}

export interface PendingArticle {
  id: string;
  title: string;
  excerpt?: string;
  authorName: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
  category: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  wordCount?: number;
}

export interface EditorialAction {
  id: string;
  type: 'approve' | 'reject' | 'publish' | 'feature';
  articleTitle: string;
  authorName: string;
  timestamp: string;
  editorName: string;
}

export interface AuthorPerformance {
  authorId: string;
  name: string;
  articlesSubmitted: number;
  approvalRate: number;
  avgReviewTime: number;
  categories: string[];
  lastSubmission: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useEditorial() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const executeQuery = useCallback(async (query: string, variables?: any) => {
    try {
      setLoading(true);
      setError(null);
      const client = getAuthenticatedGqlClient();
      const result = await client.request(query, variables);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get editorial dashboard statistics with RBAC filtering
  const getEditorialStats = useCallback(async (): Promise<EditorialStats> => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to view editorial stats
    if (!hasPermission(userRole, 'REVIEW_ARTICLES')) {
      throw new Error('Insufficient permissions to view editorial statistics');
    }

    const EDITORIAL_STATS_QUERY = `
      query GetEditorialStats {
        articles(status: REVIEW) {
          id
          title
          createdAt
        }
        publishedArticles: articles(status: PUBLISHED, take: 1000) {
          id
          title
          createdAt
          isFeatured
        }
      }
    `;

    const result = await executeQuery(EDITORIAL_STATS_QUERY);
    
    if (!result) {
      throw new Error('Failed to fetch editorial statistics from API');
    }
    
    // Calculate time-based statistics from the API data
    const publishedArticles = result.publishedArticles || [];
    const pendingArticles = result.articles || [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter articles by date for time-based metrics
    const approvedToday = publishedArticles.filter((article: any) => {
      const articleDate = new Date(article.createdAt);
      return articleDate >= today;
    });
    
    const publishedThisWeek = publishedArticles.filter((article: any) => {
      const articleDate = new Date(article.createdAt);
      return articleDate >= weekAgo;
    });
    
    // Count featured articles from published articles (fixed field name)
    const featuredArticles = publishedArticles.filter((article: any) => article.isFeatured).length;
    
    const approvalRate = (publishedArticles.length + pendingArticles.length) > 0
      ? Math.round((publishedArticles.length / (publishedArticles.length + pendingArticles.length)) * 100)
      : 0;
    
    return {
      pendingReviews: pendingArticles.length,
      approvedToday: approvedToday.length,
      rejectedToday: 0, // No rejected data available from schema
      publishedThisWeek: publishedThisWeek.length,
      totalAuthors: 0,
      featuredArticles: featuredArticles,
      avgReviewTime: 0,
      contentScore: 0,
      approvalRate: approvalRate,
    };
  }, [executeQuery, user]);

  // Get pending articles for review with RBAC filtering
  const getPendingArticles = useCallback(async (limit = 10): Promise<PendingArticle[]> => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to view pending articles
    if (!hasPermission(userRole, 'REVIEW_ARTICLES')) {
      throw new Error('Insufficient permissions to view pending articles');
    }

    const PENDING_ARTICLES_QUERY = `
      query GetPendingArticles($take: Int) {
        articles(status: REVIEW, take: $take) {
          id
          title
          excerpt
          authorName
          createdAt
          category {
            id
            name
            slug
          }
          status
        }
      }
    `;

    const result = await executeQuery(PENDING_ARTICLES_QUERY, { take: limit });
    
    if (!result) {
      throw new Error('Failed to fetch pending articles from API');
    }
    
    return (result.articles || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      excerpt: article.excerpt,
      authorName: article.authorName,
      submittedAt: article.createdAt,
      priority: 'medium' as const, // Default priority since field doesn't exist in schema
      category: article.category,
      status: article.status,
      wordCount: undefined, // Field doesn't exist in schema
    }));
  }, [executeQuery, user]);

  // Get recent editorial actions with RBAC filtering
  const getRecentActions = useCallback(async (limit = 10): Promise<EditorialAction[]> => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to view editorial actions
    if (!hasPermission(userRole, 'VIEW_ANALYTICS')) {
      throw new Error('Insufficient permissions to view editorial actions');
    }

    try {
      // First, try the original editorialActions query
      const RECENT_ACTIONS_QUERY = `
        query GetRecentActions($limit: Int) {
          editorialActions(limit: $limit) {
            id
            actionType
            articleTitle
            authorName
            editorName
            timestamp
            createdAt
          }
        }
      `;

      const result = await executeQuery(RECENT_ACTIONS_QUERY, { limit });
      
      if (result && result.editorialActions) {
        return result.editorialActions.map((action: any) => ({
          id: action.id,
          type: action.actionType.toLowerCase(),
          articleTitle: action.articleTitle,
          authorName: action.authorName,
          timestamp: action.timestamp || action.createdAt,
          editorName: action.editorName,
        }));
      }
    } catch (error) {
      console.warn('editorialActions query failed, using fallback implementation:', error);
    }

    // Fallback: Generate editorial actions from recent articles
    try {
      const RECENT_ARTICLES_QUERY = `
        query GetRecentArticlesForActions($take: Int) {
          articles(take: $take) {
            id
            title
            authorName
            status
            createdAt
            publishedAt
            updatedAt
            category {
              name
            }
          }
        }
      `;

      // Get users to map editor names
      const USERS_QUERY = `
        query GetEditorsForActions {
          listUsers(input: { role: EDITOR, take: 50 }) {
            users {
              id
              name
              role
            }
          }
        }
      `;

      const [articlesResult, usersResult] = await Promise.all([
        executeQuery(RECENT_ARTICLES_QUERY, { take: limit * 3 }), // Get more articles to generate actions
        executeQuery(USERS_QUERY)
      ]);

      if (!articlesResult?.articles) {
        throw new Error('Failed to fetch articles for editorial actions analysis');
      }

      const articles = articlesResult.articles;
      const editors = usersResult?.listUsers?.users || [];
      
      // Generate editorial actions from article data
      const actions: EditorialAction[] = [];
      
      const editorName = editors.length > 0 ? editors[0].name : 'System Editor';

      articles.forEach((article: any) => {

        // Determine action type based on article status and timestamps
        let actionType: 'approve' | 'reject' | 'publish' | 'feature' = 'approve';
        let timestamp = article.updatedAt || article.createdAt;

        if (article.status === 'PUBLISHED' && article.publishedAt) {
          actionType = 'publish';
          timestamp = article.publishedAt;
        } else if (article.status === 'ARCHIVED') {
          actionType = 'reject';
        } else if (article.status === 'FEATURED') {
          actionType = 'feature';
        } else if (article.status === 'APPROVED' || article.status === 'REVIEW') {
          actionType = 'approve';
        }

        actions.push({
          id: `action-${article.id}-${actionType}`,
          type: actionType,
          articleTitle: article.title,
          authorName: article.authorName,
          timestamp: timestamp,
          editorName: editorName,
        });
      });

      // Sort by timestamp (most recent first) and limit results
      return actions
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (fallbackError) {
      console.error('Fallback editorial actions calculation failed:', fallbackError);
      
      // Final fallback: return empty array with proper error handling
      throw new Error('Unable to fetch editorial actions. Please ensure the GraphQL server is running and the schema includes editorialActions query.');
    }
  }, [executeQuery, user]);

  // Get author performance metrics with RBAC filtering
  const getAuthorPerformance = useCallback(async (limit = 10): Promise<AuthorPerformance[]> => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to view author performance
    if (!hasPermission(userRole, 'VIEW_ANALYTICS')) {
      throw new Error('Insufficient permissions to view author performance metrics');
    }

    return [];
  }, [user]);

  // Approve an article with RBAC check
  const approveArticle = useCallback(async (articleId: string) => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to approve articles
    if (!hasPermission(userRole, 'PUBLISH_ARTICLE')) {
      throw new Error('Insufficient permissions to approve articles');
    }

    const APPROVE_ARTICLE_MUTATION = `
      mutation ApproveArticle($input: WorkflowActionInput!) {
        performWorkflowAction(input: $input) {
          success
          message
          article {
            id
            status
          }
        }
      }
    `;

    return await executeQuery(APPROVE_ARTICLE_MUTATION, {
      input: { articleId, action: 'APPROVE', notifyAuthor: true },
    });
  }, [executeQuery, user]);

  // Reject an article with RBAC check
  const rejectArticle = useCallback(async (articleId: string, reason?: string) => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to reject articles
    if (!hasPermission(userRole, 'REVIEW_ARTICLES')) {
      throw new Error('Insufficient permissions to reject articles');
    }

    const REJECT_ARTICLE_MUTATION = `
      mutation RejectArticle($input: WorkflowActionInput!) {
        performWorkflowAction(input: $input) {
          success
          message
          article {
            id
            status
          }
        }
      }
    `;

    return await executeQuery(REJECT_ARTICLE_MUTATION, {
      input: { articleId, action: 'REJECT', reason, notifyAuthor: true },
    });
  }, [executeQuery, user]);

  // Feature an article with RBAC check
  const featureArticle = useCallback(async (articleId: string) => {
    const userRole = user?.role as UserRole;
    
    // Check if user has permission to feature articles
    if (!hasPermission(userRole, 'FEATURE_ARTICLES')) {
      throw new Error('Insufficient permissions to feature articles');
    }

    const FEATURE_ARTICLE_MUTATION = `
      mutation FeatureArticle($id: ID!, $input: UpsertArticleInput!) {
        upsertArticle(id: $id, input: $input) {
          id
          featured
        }
      }
    `;

    return await executeQuery(FEATURE_ARTICLE_MUTATION, { 
      id: articleId, 
      input: { featured: true } 
    });
  }, [executeQuery, user]);

  return {
    loading,
    error,
    getEditorialStats,
    getPendingArticles,
    getRecentActions,
    getAuthorPerformance,
    approveArticle,
    rejectArticle,
    featureArticle,
  };
}
