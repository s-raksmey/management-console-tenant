// src/hooks/useAuthorStats.ts
import { useState, useCallback } from 'react';
import { getAuthenticatedGqlClient } from '@/services/graphql-client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface AuthorStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  inReviewArticles: number;
  rejectedArticles: number;
  totalViews: number;
  monthlyGoal: number;
  monthlyProgress: number;
  approvalRate: number;
  avgViewsPerArticle: number;
}

export interface AuthorArticle {
  id: string;
  title: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  views?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  excerpt?: string;
  feedback?: string;
}

export interface WritingGoal {
  id: string;
  target: number;
  current: number;
  period: 'weekly' | 'monthly' | 'yearly';
  deadline: string;
}

export interface AuthorInsights {
  topPerformingArticles: AuthorArticle[];
  recentActivity: {
    articlesThisWeek: number;
    viewsThisWeek: number;
    approvalRate: number;
  };
  categoryDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  writingStreak: {
    current: number;
    longest: number;
  };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useAuthorStats() {
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

  // Get author's personal statistics
  const getAuthorStats = useCallback(async (): Promise<AuthorStats> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const AUTHOR_STATS_QUERY = `
      query GetAuthorStats($authorId: ID!) {
        allArticles: articles(authorId: $authorId, take: 1000) {
          id
          status
          publishedAt
          createdAt
          viewCount
        }
        publishedArticles: articles(authorId: $authorId, status: PUBLISHED, take: 1000) {
          id
          publishedAt
          viewCount
        }
        draftArticles: articles(authorId: $authorId, status: DRAFT, take: 1000) {
          id
        }
        pendingArticles: articles(authorId: $authorId, status: REVIEW, take: 1000) {
          id
        }
      }
    `;

    const result = await executeQuery(AUTHOR_STATS_QUERY, { authorId: user.id });

    const userArticles = result.allArticles || [];
    const publishedByUser = result.publishedArticles || [];
    const draftsByUser = result.draftArticles || [];
    const pendingByUser = result.pendingArticles || [];

    const totalViews = publishedByUser.reduce((sum: number, article: any) => sum + (article.viewCount || 0), 0);

    const totalSubmitted = userArticles.filter((a: any) => a.status !== 'DRAFT').length;
    const approved = publishedByUser.length;
    const approvalRate = totalSubmitted > 0 ? (approved / totalSubmitted) * 100 : 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyProgress = publishedByUser.filter((article: any) => 
      article.publishedAt && new Date(article.publishedAt) >= thisMonth
    ).length;

    return {
      totalArticles: userArticles.length,
      publishedArticles: publishedByUser.length,
      draftArticles: draftsByUser.length,
      inReviewArticles: pendingByUser.length,
      rejectedArticles: userArticles.filter((a: any) => a.status === 'ARCHIVED').length,
      totalViews,
      monthlyGoal: 0,
      monthlyProgress,
      approvalRate: Math.round(approvalRate),
      avgViewsPerArticle: publishedByUser.length > 0 ? Math.round(totalViews / publishedByUser.length) : 0,
    };
  }, [executeQuery, user]);

  // Get author's articles with details
  const getAuthorArticles = useCallback(async (limit = 20): Promise<AuthorArticle[]> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const AUTHOR_ARTICLES_QUERY = `
      query GetAuthorArticles($authorId: ID!, $take: Int) {
        articles(authorId: $authorId, take: $take) {
          id
          title
          status
          publishedAt
          createdAt
          updatedAt
          excerpt
          viewCount
          category {
            id
            name
            slug
          }
        }
      }
    `;

    const result = await executeQuery(AUTHOR_ARTICLES_QUERY, { authorId: user.id, take: limit });
    const userArticles = result.articles || [];

    return userArticles.map((article: any) => ({
      id: article.id,
      title: article.title,
      status: article.status,
      views: article.viewCount || 0,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: article.category,
      excerpt: article.excerpt,
    }));
  }, [executeQuery, user]);

  // Get author insights and analytics
  const getAuthorInsights = useCallback(async (): Promise<AuthorInsights> => {
    if (!user?.name) {
      throw new Error('User not authenticated');
    }

    const articles = await getAuthorArticles(50); // Get more for analysis
    
    // Top performing articles (by views)
    const topPerformingArticles = articles
      .filter(article => article.status === 'PUBLISHED' && article.views)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    // Recent activity (this week)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const articlesThisWeek = articles.filter(article => 
      new Date(article.createdAt) >= oneWeekAgo
    ).length;
    
    const publishedThisWeek = articles.filter(article => 
      article.status === 'PUBLISHED' && 
      article.publishedAt && 
      new Date(article.publishedAt) >= oneWeekAgo
    );
    
    const viewsThisWeek = publishedThisWeek.reduce((sum, article) => 
      sum + (article.views || 0), 0
    );

    // Category distribution
    const categoryCount: { [key: string]: number } = {};
    articles.forEach(article => {
      const categoryName = article.category.name;
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: articles.length > 0 ? Math.round((count / articles.length) * 100) : 0
    }));

    // Writing streak (simplified - would need more sophisticated tracking)
    const writingStreak = {
      current: 0,
      longest: 0
    };

    const stats = await getAuthorStats();

    return {
      topPerformingArticles,
      recentActivity: {
        articlesThisWeek,
        viewsThisWeek,
        approvalRate: stats.approvalRate
      },
      categoryDistribution,
      writingStreak
    };
  }, [getAuthorArticles, getAuthorStats, user]);

  // Get writing goals
  const getWritingGoals = useCallback(async (): Promise<WritingGoal[]> => {
    return [];
  }, []);

  // Update writing goal
  const updateWritingGoal = useCallback(async () => {
    return { success: false, message: 'Writing goals are not available.' };
  }, []);

  return {
    loading,
    error,
    getAuthorStats,
    getAuthorArticles,
    getAuthorInsights,
    getWritingGoals,
    updateWritingGoal,
  };
}
