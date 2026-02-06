'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useArticles, useArticleMutations } from '@/hooks/useGraphQL';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, PermissionGuard } from '@/components/permissions/PermissionGuard';
import { useToastHelpers } from '@/components/ui/toast';
import { getApprovalNotification, getRejectionNotification } from '@/utils/workflowNotifications';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Loader2,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import type { Article } from '@/types/article';

export default function ReviewQueuePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const { getArticles, loading, error } = useArticles();
  const { setArticleStatus, loading: mutationLoading } = useArticleMutations();
  const { hasPermission, userRole } = usePermissions();
  const { showSuccess, showError } = useToastHelpers();

  useEffect(() => {
    loadReviewArticles();
  }, []);

  const loadReviewArticles = async () => {
    try {
      const response = await getArticles({ status: 'REVIEW' });
      if (response?.articles) {
        setArticles(response.articles);
      }
    } catch (error) {
      console.error('Failed to load review articles:', error);
      showError('Failed to load articles', 'Please refresh the page to try again');
    }
  };

  const handleApprove = async (articleId: string) => {
    if (processingIds.has(articleId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(articleId));
      await setArticleStatus(articleId, 'PUBLISHED');
      
      const notification = getApprovalNotification();
      showSuccess(notification.title, notification.message);
      
      // Remove from list
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Failed to approve article:', error);
      showError('Failed to approve article', 'Please try again');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleReject = async (articleId: string) => {
    if (processingIds.has(articleId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(articleId));
      await setArticleStatus(articleId, 'ARCHIVED');
      
      const notification = getRejectionNotification();
      showSuccess(notification.title, notification.message);
      
      // Remove from list
      setArticles(prev => prev.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Failed to reject article:', error);
      showError('Failed to reject article', 'Please try again');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissions={[Permission.REVIEW_ARTICLES]} showError>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Queue</h1>
            <p className="text-gray-600 mt-2">
              Articles awaiting editorial review and approval
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {articles.length} article{articles.length !== 1 ? 's' : ''} pending review
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Failed to load articles. Please refresh the page.</p>
          </div>
        )}

        {articles.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles in review</h3>
            <p className="text-gray-600">
              All articles have been reviewed. New submissions will appear here.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {article.title}
                    </h3>
                    <StatusBadge status={article.status} />
                    {article.isBreaking && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Breaking News
                      </span>
                    )}
                  </div>

                  {article.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{article.authorName || 'Unknown Author'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Submitted {format(new Date(article.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {article.category && (
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{article.category.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <Link href={`/preview/id/${article.id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </Link>

                  {hasPermission(Permission.UPDATE_ANY_ARTICLE) && (
                    <Link href={`/articles/${article.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  )}

                  {hasPermission(Permission.APPROVE_ARTICLES) && (
                    <Button
                      onClick={() => handleApprove(article.id)}
                      disabled={processingIds.has(article.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {processingIds.has(article.id) ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  )}

                  {hasPermission(Permission.REJECT_ARTICLES) && (
                    <Button
                      onClick={() => handleReject(article.id)}
                      disabled={processingIds.has(article.id)}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      {processingIds.has(article.id) ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
}
