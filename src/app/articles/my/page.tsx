'use client';

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useArticles, useArticleMutations, useRevisions } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Article, ArticleStatus } from "@/types/article";
import { StatusBadge } from "@/components/ui/status-badge";
import { useVisibilityPolling } from "@/hooks/usePolling";
import { useToastHelpers } from "@/components/ui/toast";
import { getStatusChangeNotification } from "@/utils/workflowNotifications";
import { Permission } from "@/components/permissions/PermissionGuard";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function MyArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [previousArticles, setPreviousArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [isPolling, setIsPolling] = useState(true);
  const [revisionRequestStatusById, setRevisionRequestStatusById] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    onConfirm: () => {},
  });
  
  const { getArticles, loading, error } = useArticles();
  const { getLatestRevisionRequest } = useRevisions();
  const { setArticleStatus, performWorkflowAction, deleteArticle, loading: mutationLoading } = useArticleMutations();
  const { user } = useAuth();
  const { userRole, hasPermission } = usePermissions();
  const { showSuccess, showError, showInfo } = useToastHelpers();

  useEffect(() => {
    loadMyArticles();
  }, [statusFilter, user]);

  const loadRevisionStatuses = useCallback(async (list: Article[]) => {
    if (!list.length) {
      setRevisionRequestStatusById({});
      return;
    }

    try {
      const results = await Promise.all(
        list.map(async (article) => {
          const data = await getLatestRevisionRequest(article.id);
          const latest = data?.latestRevisionRequest;
          if (latest?.consumedAt) {
            return [article.id, 'CONSUMED'] as const;
          }
          return [article.id, latest?.status] as const;
        })
      );

      const nextMap: Record<string, string> = {};
      results.forEach(([id, status]) => {
        if (status) {
          nextMap[id] = status;
        }
      });
      setRevisionRequestStatusById(nextMap);
    } catch (error) {
      console.error('Failed to load revision request statuses:', error);
    }
  }, [getLatestRevisionRequest]);

  // Polling function to check for status changes
  const pollForUpdates = useCallback(async () => {
    if (!user?.id || loading) return;
    
    try {
      const response = await getArticles({ 
        status: statusFilter,
        authorId: user.id 
      });
      
      if (response?.articles) {
        const newArticles = response.articles;
        
        // Check for status changes
        if (previousArticles.length > 0) {
          newArticles.forEach((newArticle: { id: string; status: ArticleStatus; }) => {
            const oldArticle = previousArticles.find(a => a.id === newArticle.id);
            if (oldArticle && oldArticle.status !== newArticle.status) {
              const notification = getStatusChangeNotification(
                oldArticle.status,
                newArticle.status,
                userRole || 'AUTHOR'
              );
              
              if (notification) {
                if (notification.type === 'success') {
                  showSuccess(notification.title, notification.message);
                } else if (notification.type === 'warning') {
                  showError(notification.title, notification.message);
                } else {
                  showInfo(notification.title, notification.message);
                }
              }
            }
          });
        }
        
        setPreviousArticles(articles);
        setArticles(newArticles);
        await loadRevisionStatuses(newArticles);
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Don't show error toast for polling failures to avoid spam
    }
  }, [user?.id, statusFilter, loading, articles, previousArticles, userRole, showSuccess, showError, showInfo, getArticles, loadRevisionStatuses]);

  // Set up 10-second polling
  useVisibilityPolling(pollForUpdates, {
    interval: 10000, // 10 seconds
    enabled: isPolling && !!user?.id,
    immediate: false
  });

  const loadMyArticles = async () => {
    if (!user?.id) {
      return;
    }
    const response = await getArticles({ 
      status: statusFilter,
      authorId: user.id // Filter to only current user's articles
    });
    
    if (response?.articles) {
      setArticles(response.articles);
      await loadRevisionStatuses(response.articles);
    } else {
      setArticles([]);
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: ArticleStatus) => {
    try {
      const article = articles.find(a => a.id === articleId);
      const oldStatus = article?.status;
      const result = oldStatus === 'DRAFT' && newStatus === 'REVIEW'
        ? await performWorkflowAction({
            articleId,
            action: 'SUBMIT_FOR_REVIEW',
          })
        : await setArticleStatus(articleId, newStatus);
      
      if (!result) {
        throw new Error('No response from server. Please try again.');
      }
      
      // Show notification for status change
      if (oldStatus) {
        const notification = getStatusChangeNotification(
          oldStatus,
          newStatus,
          userRole || 'AUTHOR'
        );
        
        if (notification) {
          if (notification.type === 'success') {
            showSuccess(notification.title, notification.message);
          } else if (notification.type === 'warning') {
            showError(notification.title, notification.message);
          } else {
            showInfo(notification.title, notification.message);
          }
        }
      }
      
      loadMyArticles(); // Reload articles after status change
    } catch (error) {
      console.error('❌ Error updating article status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status. Please try again or contact support';
      showError('Failed to update status', errorMessage);
    }
  };

  const requestAction = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
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

  const handleDelete = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      loadMyArticles(); // Reload articles after deletion
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your articles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading articles: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Articles</h1>
          <div className="flex items-center space-x-4">
            <p className="text-muted-foreground">
              Manage your personal articles
            </p>
            {isPolling && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Auto-updating every 10s</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolling(!isPolling)}
          >
            {isPolling ? 'Pause Updates' : 'Resume Updates'}
          </Button>
          {hasPermission(Permission.CREATE_ARTICLE) && (
            <Link href="/articles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Article
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status: {statusFilter || 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('DRAFT')}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('REVIEW')}>
              Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('PUBLISHED')}>
              Published
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ARCHIVED')}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Articles Table */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Updated</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    {user?.id ? 'No articles found. Create your first article!' : 'Please log in to view your articles.'}
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <Link 
                          href={`/articles/${article.id}`}
                          className="font-medium hover:underline"
                        >
                          {article.title}
                        </Link>
                        {article.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {article.excerpt.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge status={article.status} />
                        {article.isBreaking && (
                          <Badge variant="destructive" className="text-xs">Breaking</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'PENDING' && (
                          <Badge variant="outline" className="bg-purple-50 border-purple-200">📝 Revision Requested</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'APPROVED' && (
                          <Badge variant="outline" className="bg-green-50 border-green-200">✅ Revision Approved</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'REJECTED' && (
                          <Badge variant="outline" className="bg-red-50 border-red-200">❌ Revision Rejected</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'CONSUMED' && (
                          <Badge variant="outline" className="bg-slate-50 border-slate-200">✔ Revision End</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {article.category?.name || 'Uncategorized'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(article.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasPermission(Permission.UPDATE_OWN_ARTICLE) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/articles/${article.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {article.status === 'DRAFT' && hasPermission(Permission.CREATE_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: "Submit for Review?",
                                  description: `Submit "${article.title}" to the review queue?`,
                                  confirmText: "Submit",
                                  onConfirm: () => handleStatusChange(article.id, 'REVIEW'),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              Submit for Review
                            </DropdownMenuItem>
                          )}
                          {article.status === 'REVIEW' && hasPermission && hasPermission(Permission.REVIEW_ARTICLES) && (
                            <>
                              <DropdownMenuItem 
                                onClick={() =>
                                  requestAction({
                                    title: "Publish Article?",
                                    description: `Publish "${article.title}" now?`,
                                    confirmText: "Publish",
                                    onConfirm: () => handleStatusChange(article.id, 'PUBLISHED'),
                                  })
                                }
                                disabled={mutationLoading}
                              >
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() =>
                                  requestAction({
                                    title: "Send Back to Draft?",
                                    description: `Move "${article.title}" back to draft?`,
                                    confirmText: "Send Back",
                                    onConfirm: () => handleStatusChange(article.id, 'DRAFT'),
                                  })
                                }
                                disabled={mutationLoading}
                              >
                                Send Back to Draft
                              </DropdownMenuItem>
                            </>
                          )}
                          {article.status === 'PUBLISHED' && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: "Archive Article?",
                                  description: `Archive "${article.title}"?`,
                                  confirmText: "Archive",
                                  variant: "destructive",
                                  onConfirm: () => handleStatusChange(article.id, 'ARCHIVED'),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              Archive
                            </DropdownMenuItem>
                          )}
                          {hasPermission(Permission.DELETE_OWN_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: "Delete Article?",
                                  description: `Delete "${article.title}"? This action cannot be undone.`,
                                  confirmText: "Delete Article",
                                  variant: "destructive",
                                  onConfirm: () => handleDelete(article.id),
                                })
                              }
                              disabled={mutationLoading}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  );
}
