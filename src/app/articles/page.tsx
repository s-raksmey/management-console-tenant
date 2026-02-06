'use client';

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useArticles, useArticleMutations, useRevisions } from "@/hooks/useGraphQL";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Q_REVISION_REQUESTS } from "@/services/article.gql";
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
  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const { getArticles, loading, error } = useArticles();
  const { setArticleStatus, deleteArticle, approveRevisionRequest, rejectRevisionRequest, loading: mutationLoading } = useArticleMutations();
  const { user } = useAuth();
  const { userRole, hasPermission, isAdmin } = usePermissions();

  useEffect(() => {
    loadArticles();
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

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Articles</h1>
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
                  {article.breakingNewsRequestStatus === 'PENDING' && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200">🔔 Breaking Request: Pending</Badge>
                  )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) && article.breakingNewsRequestStatus === 'APPROVED' && (
                    <Badge variant="outline" className="text-xs bg-green-50 border-green-200">✅ Breaking Request: Approved</Badge>
                  )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) && article.breakingNewsRequestStatus === 'REJECTED' && (
                    <Badge variant="outline" className="text-xs bg-red-50 border-red-200">❌ Breaking Request: Rejected</Badge>
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