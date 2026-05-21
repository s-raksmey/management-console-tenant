// src/components/workflow/ReviewQueue.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useWorkflowPermissions } from '../../hooks/usePermissions';
import { PermissionGuard, Permission } from '../permissions/PermissionGuard';
import { getAuthenticatedGqlClient } from '../../services/graphql-client';
import { 
  REVIEW_QUEUE_QUERY, 
  ReviewQueueData, 
  ReviewQueueFilters, 
  ReviewQueueResponse 
} from '../../graphql/queries/reviewQueue';
import { 
  PERFORM_WORKFLOW_ACTION_MUTATION, 
  PerformWorkflowActionVariables, 
  PerformWorkflowActionResponse 
} from '../../graphql/mutations/articleWorkflow';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

interface WorkflowActionResult {
  success: boolean;
  message: string;
}

/**
 * Review Queue Component for Editors
 */
export const ReviewQueue: React.FC = () => {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueData>({
    articles: [],
    totalCount: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingArticles, setProcessingArticles] = useState<Set<string>>(new Set());
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [confirmation, setConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });
  const [filters, setFilters] = useState({
    categoryId: '',
    authorId: '',
    limit: 20,
    offset: 0,
  });

  const { canReview, canApprove, canReject } = useWorkflowPermissions();

  // Fetch review queue from server
  useEffect(() => {
    const fetchReviewQueue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const client = getAuthenticatedGqlClient();
        
        // Prepare filters for GraphQL query
        const queryFilters: ReviewQueueFilters = {};
        if (filters.categoryId) queryFilters.categoryId = filters.categoryId;
        if (filters.authorId) queryFilters.authorId = filters.authorId;
        if (filters.limit) queryFilters.limit = filters.limit;
        if (filters.offset) queryFilters.offset = filters.offset;
        
        const response = await client.request<ReviewQueueResponse>(
          REVIEW_QUEUE_QUERY,
          { filters: queryFilters }
        );
        
        setReviewQueue(response.reviewQueue);
      } catch (err: any) {
        console.error('Review queue error:', err);
        
        // Handle specific error types
        if (err.response?.errors) {
          const errorMessage = err.response.errors[0]?.message || 'Failed to load review queue';
          setError(errorMessage);
        } else if (err.message?.includes('Permission denied')) {
          setError('You do not have permission to access the review queue');
        } else {
          setError('Failed to load review queue. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user has review permissions
    if (canReview) {
      fetchReviewQueue();
    } else {
      setLoading(false);
      setError('You do not have permission to access the review queue');
    }
  }, [filters, canReview]);

  const handleWorkflowAction = async (articleId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    if (!canApprove && action === 'APPROVE') {
      alert('You do not have permission to approve articles');
      return;
    }
    if (!canReject && action === 'REJECT') {
      alert('You do not have permission to reject articles');
      return;
    }

    setProcessingArticles(prev => new Set(prev).add(articleId));

    try {
      const client = getAuthenticatedGqlClient();
      
      const response = await client.request<PerformWorkflowActionResponse>(
        PERFORM_WORKFLOW_ACTION_MUTATION,
        {
          input: {
            articleId,
            action,
            reason,
            notifyAuthor: true,
          },
        } as PerformWorkflowActionVariables
      );

      if (response.performWorkflowAction?.success) {
        // Remove article from review queue since it's no longer in REVIEW status
        setReviewQueue(prev => ({
          ...prev,
          articles: prev.articles.filter(article => article.id !== articleId),
          totalCount: prev.totalCount - 1,
        }));
        
        // Remove from selected articles
        setSelectedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });

        alert(`Article ${action.toLowerCase()}d successfully`);
      }
    } catch (err: any) {
      console.error('Workflow action error:', err);
      
      // Handle specific error types
      if (err.response?.errors) {
        const errorMessage = err.response.errors[0]?.message || `Failed to ${action.toLowerCase()} article`;
        alert(errorMessage);
      } else if (err.message?.includes('Permission denied')) {
        alert(`You do not have permission to ${action.toLowerCase()} articles`);
      } else {
        alert(`Failed to ${action.toLowerCase()} article. Please try again.`);
      }
    } finally {
      setProcessingArticles(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action: 'APPROVE' | 'REJECT') => {
    if (selectedArticles.size === 0) {
      alert('Please select articles to process');
      return;
    }

    try {
      throw new Error('Bulk actions are not available yet. Please process articles individually.');
    } catch (err) {
      console.error('Bulk workflow action error:', err);
      alert(`Failed to perform bulk ${action.toLowerCase()}`);
    }
  };

  const requestWorkflowAction = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmation({
      open: true,
      title: input.title,
      description: input.description,
      confirmText: input.confirmText,
      variant: input.variant,
      onConfirm: input.onConfirm,
    });
  };

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const selectAllArticles = () => {
    if (selectedArticles.size === reviewQueue.articles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(reviewQueue.articles.map(article => article.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading review queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <PermissionGuard permissions={[Permission.REVIEW_ARTICLES]} showError>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Queue</h2>
            <p className="text-gray-600 mt-1">
              {reviewQueue.totalCount} article{reviewQueue.totalCount !== 1 ? 's' : ''} pending review
            </p>
          </div>
          
          {/* Bulk Actions */}
          {selectedArticles.size > 0 && (
            <div className="flex space-x-2">
              <PermissionGuard permissions={[Permission.APPROVE_ARTICLES]}>
                <button
                  onClick={() => handleBulkAction('APPROVE')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Approve Selected ({selectedArticles.size})
                </button>
              </PermissionGuard>
              <PermissionGuard permissions={[Permission.REJECT_ARTICLES]}>
                <button
                  onClick={() => handleBulkAction('REJECT')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject Selected ({selectedArticles.size})
                </button>
              </PermissionGuard>
            </div>
          )}
        </div>

        {/* Articles List */}
        {reviewQueue.articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No articles pending review</div>
            <p className="text-gray-400 mt-2">All caught up! 🎉</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Select All Header */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedArticles.size === reviewQueue.articles.length && reviewQueue.articles.length > 0}
                  onChange={selectAllArticles}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all ({reviewQueue.articles.length})
                </span>
              </label>
            </div>

            {/* Articles */}
            <div className="divide-y divide-gray-200">
              {reviewQueue.articles.map((article) => (
                <div key={article.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedArticles.has(article.id)}
                      onChange={() => toggleArticleSelection(article.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>By {article.author.name}</span>
                            {article.category && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {article.category.name}
                              </span>
                            )}
                            <span>
                              Submitted {new Date(article.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 ml-4">
                          <PermissionGuard permissions={[Permission.APPROVE_ARTICLES]}>
                            <button
                              onClick={() =>
                                requestWorkflowAction({
                                  title: 'Approve Article?',
                                  description: `Approve "${article.title}"?`,
                                  confirmText: 'Approve',
                                  onConfirm: () => handleWorkflowAction(article.id, 'APPROVE'),
                                })
                              }
                              disabled={processingArticles.has(article.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {processingArticles.has(article.id) ? 'Processing...' : 'Approve'}
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permissions={[Permission.REJECT_ARTICLES]}>
                            <button
                              onClick={() =>
                                requestWorkflowAction({
                                  title: 'Reject Article?',
                                  description: `Reject "${article.title}"?`,
                                  confirmText: 'Reject',
                                  variant: 'destructive',
                                  onConfirm: () => handleWorkflowAction(article.id, 'REJECT'),
                                })
                              }
                              disabled={processingArticles.has(article.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {processingArticles.has(article.id) ? 'Processing...' : 'Reject'}
                            </button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <ConfirmationDialog
          open={confirmation.open}
          onOpenChange={(open) =>
            setConfirmation((current) => ({ ...current, open }))
          }
          title={confirmation.title}
          description={confirmation.description}
          confirmText={confirmation.confirmText}
          cancelText="Cancel"
          variant={confirmation.variant}
          onConfirm={() => {
            void confirmation.onConfirm();
          }}
        />
      </div>
    </PermissionGuard>
  );
};

export default ReviewQueue;
