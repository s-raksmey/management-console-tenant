'use client';

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useArticles, useArticleMutations, useRevisions } from "@/hooks/useGraphQL";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Q_REVISION_REQUESTS, Q_PENDING_BREAKING_NEWS_REQUESTS } from "@/services/article.gql";
import { Button } from "@/components/ui/button";
import { Article, ArticleStatus } from "@/types/article";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/components/permissions/PermissionGuard";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800", 
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800"
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [pendingBreakingNews, setPendingBreakingNews] = useState<any[]>([]);
  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const { getArticles, loading, error } = useArticles();
  const { setArticleStatus, deleteArticle, approveBreakingNewsRequest, rejectBreakingNewsRequest, approveRevisionRequest, rejectRevisionRequest, loading: mutationLoading } = useArticleMutations();
  const { user } = useAuth();
  const { userRole, hasPermission, isAdmin } = usePermissions();

  useEffect(() => {
    loadArticles();
    loadPendingBreakingNews();
  }, [statusFilter, user?.id]);

  const loadArticles = async () => {
    const response = await getArticles({ 
      status: statusFilter,
      take: 50, 
      skip: 0 
    });
    
    if (response?.articles) {
      const filteredArticles = response.articles.filter((article: Article) => {
        if (article.status !== 'DRAFT') return true;
        return article.author?.id === user?.id;
      });
      setArticles(filteredArticles);
    } else {
    }
  };

  const loadPendingBreakingNews = async () => {
    try {
      const data = await client.request(Q_PENDING_BREAKING_NEWS_REQUESTS);
      if (data?.pendingBreakingNewsRequests) {
        setPendingBreakingNews(data.pendingBreakingNewsRequests);
      }
    } catch (err) {
      console.error('Error loading pending breaking news:', err);
    }
  };

  const handleStatusChange = async (articleId: string, newStatus: ArticleStatus) => {
    const response = await setArticleStatus(articleId, newStatus);
    if (response) {
      // Refresh the list
      loadArticles();
    }
  };

  const handleDelete = async (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const response = await deleteArticle(articleId);
      if (response) {
        // Refresh the list
        loadArticles();
      }
    }
  };

  const handleApproveBreakingNews = async (requestId: string) => {
    try {
      const response = await approveBreakingNewsRequest(requestId);
      if (response) {
        loadArticles();
        loadPendingBreakingNews();
      }
    } catch (err) {
      console.error('Error approving breaking news:', err);
    }
  };

  const handleRejectBreakingNews = async (requestId: string) => {
    try {
      const response = await rejectBreakingNewsRequest(requestId);
      if (response) {
        loadArticles();
        loadPendingBreakingNews();
      }
    } catch (err) {
      console.error('Error rejecting breaking news:', err);
    }
  };

  const handleApproveBreakingNewsFromArticle = async (articleId: string) => {
    try {
      // Fetch the pending breaking news request for this article
      const data = await client.request(Q_PENDING_BREAKING_NEWS_REQUESTS);
      if (data?.pendingBreakingNewsRequests) {
        const request = data.pendingBreakingNewsRequests.find((r: any) => r.article?.id === articleId);
        if (request) {
          await handleApproveBreakingNews(request.id);
        }
      }
    } catch (err) {
      console.error('Error finding breaking news request:', err);
    }
  };

  const handleRejectBreakingNewsFromArticle = async (articleId: string) => {
    try {
      // Fetch the pending breaking news request for this article
      const data = await client.request(Q_PENDING_BREAKING_NEWS_REQUESTS);
      if (data?.pendingBreakingNewsRequests) {
        const request = data.pendingBreakingNewsRequests.find((r: any) => r.article?.id === articleId);
        if (request) {
          await handleRejectBreakingNews(request.id);
        }
      }
    } catch (err) {
      console.error('Error finding breaking news request:', err);
    }
  };

  // Helper function to check if article has a pending breaking news request
  const hasPendingBreakingNewsRequest = (articleId: string) => {
    return pendingBreakingNews.some((r: any) => r.article?.id === articleId);
  };

  if (loading && articles.length === 0) {
    return (
      <main className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Articles</h2>
            <p className="text-sm text-slate-600">Loading articles...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Articles</h2>
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Articles</h2>
          <p className="text-sm text-slate-600">Create, edit, and publish articles.</p>
        </div>
        <Link href="/articles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as ArticleStatus[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Pending Breaking News Requests */}
      {hasPermission(Permission.APPROVE_ARTICLES) && pendingBreakingNews.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50">
          <div className="border-b border-orange-200 bg-orange-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-orange-900">⚡ Pending Breaking News Requests ({pendingBreakingNews.length})</h3>
          </div>
          <div className="divide-y">
            {pendingBreakingNews.map((request: any) => (
              <div key={request.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-orange-900">
                    {request.article?.title}
                  </p>
                  <p className="text-xs text-orange-700">
                    Requested by <span className="font-medium">{request.requester?.name}</span> on {format(new Date(request.createdAt), 'MMM d, yyyy')}
                  </p>
                  {request.reason && (
                    <p className="text-xs text-orange-600 italic mt-2">
                      "{request.reason}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveBreakingNews(request.id)}
                    disabled={mutationLoading}
                  >
                    ✓ Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectBreakingNews(request.id)}
                    disabled={mutationLoading}
                  >
                    ✕ Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Topic</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            No articles found. <Link href="/articles/new" className="text-blue-600 hover:underline">Create your first article</Link>
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="grid grid-cols-12 items-center px-4 py-3 text-sm border-b last:border-b-0 hover:bg-slate-50">
              <div className="col-span-4">
                <div className="font-medium">{article.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  /{article.slug}
                  {article.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {article.isEditorsPick && <Badge variant="secondary" className="text-xs">Editor's Pick</Badge>}
                  {article.isBreaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
                  {hasPendingBreakingNewsRequest(article.id) && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">🔔 Breaking Request</Badge>
                  )}
                  {article.revisionStatus === 'REQUESTED' && (
                    <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">📝 Revision Requested</Badge>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <Badge className={`text-xs ${statusColors[article.status]}`}>
                  {article.status}
                </Badge>
              </div>
              <div className="col-span-2 text-slate-600 text-xs">
                {article.category?.name ?? "—"}
              </div>
              <div className="col-span-1 text-slate-600 text-xs">
                {article.topic ?? "—"}
              </div>
              <div className="col-span-2 text-slate-600 text-xs">
                {format(new Date(article.updatedAt), 'MMM d, yyyy')}
              </div>
              <div className="col-span-1 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/articles/${article.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {article.status === 'DRAFT' && hasPermission(Permission.PUBLISH_ARTICLE) && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(article.id, 'PUBLISHED')}
                        disabled={mutationLoading}
                      >
                        Publish
                      </DropdownMenuItem>
                    )}
                    {article.status === 'REVIEW' && hasPermission(Permission.APPROVE_ARTICLES) && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(article.id, 'PUBLISHED')}
                        disabled={mutationLoading}
                      >
                        Approve & Publish
                      </DropdownMenuItem>
                    )}
                    {article.status === 'REVIEW' && hasPermission(Permission.REJECT_ARTICLES) && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(article.id, 'ARCHIVED')}
                        disabled={mutationLoading}
                      >
                        Reject
                      </DropdownMenuItem>
                    )}
                    {article.status === 'PUBLISHED' && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(article.id, 'DRAFT')}
                        disabled={mutationLoading}
                      >
                        Unpublish
                      </DropdownMenuItem>
                    )}
                    {article.breakingNewsRequestStatus === 'PENDING' && hasPermission(Permission.SET_BREAKING_NEWS) && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleApproveBreakingNewsFromArticle(article.id)}
                          disabled={mutationLoading}
                        >
                          ✓ Approve Breaking News
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRejectBreakingNewsFromArticle(article.id)}
                          disabled={mutationLoading}
                        >
                          ✗ Reject Breaking News
                        </DropdownMenuItem>
                      </>
                    )}
                    {article.revisionStatus === 'REQUESTED' && hasPermission(Permission.APPROVE_ARTICLES) && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleApproveRevision(article.id)}
                          disabled={mutationLoading}
                        >
                          ✓ Approve Revision
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRejectRevision(article.id)}
                          disabled={mutationLoading}
                        >
                          ✗ Reject Revision
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDelete(article.id)}
                      disabled={mutationLoading}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

  const handleApproveRevision = async (articleId: string) => {
    try {
      // Fetch the pending revision request
      const data = await client.request(Q_REVISION_REQUESTS, { 
        articleId, 
        status: 'PENDING' 
      });
      
      if (data?.revisionRequests && data.revisionRequests.length > 0) {
        const requestId = data.revisionRequests[0].id;
        const response = await approveRevisionRequest(requestId);
        if (response) {
          loadArticles();
        }
      }
    } catch (err) {
      console.error('Error approving revision:', err);
    }
  };

  const handleRejectRevision = async (articleId: string) => {
    try {
      // Fetch the pending revision request
      const data = await client.request(Q_REVISION_REQUESTS, { 
        articleId, 
        status: 'PENDING' 
      });
      
      if (data?.revisionRequests && data.revisionRequests.length > 0) {
        const requestId = data.revisionRequests[0].id;
        const response = await rejectRevisionRequest(requestId);
        if (response) {
          loadArticles();
        }
      }
    } catch (err) {
      console.error('Error rejecting revision:', err);
    }
  };
  const handleApproveBreakingNews = async (requestId: string) => {
    try {
      const response = await approveBreakingNewsRequest(requestId, '');
      if (response) {
        loadArticles();
        loadPendingBreakingNews();
      }
    } catch (err) {
      console.error('Error approving breaking news:', err);
    }
  };

  const handleRejectBreakingNews = async (requestId: string) => {
    try {
      const response = await rejectBreakingNewsRequest(requestId, '');
      if (response) {
        loadArticles();
        loadPendingBreakingNews();
      }
    } catch (err) {
      console.error('Error rejecting breaking news:', err);
    }
  };