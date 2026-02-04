'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useArticles, useArticleMutations } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Article, ArticleStatus } from "@/types/article";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Plus } from "lucide-react";
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
  const { getArticles, loading, error } = useArticles();
  const { setArticleStatus, deleteArticle, loading: mutationLoading } = useArticleMutations();
  const { user } = useAuth();
  const { userRole, hasPermission, isAdmin } = usePermissions();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Frontend Debug - Articles page loaded');
    console.log('🔍 Frontend Debug - User:', user);
    console.log('🔍 Frontend Debug - User Role:', userRole);
    console.log('🔍 Frontend Debug - Is Admin:', isAdmin);
    console.log('🔍 Frontend Debug - Has CREATE_ARTICLE permission:', hasPermission && hasPermission('CREATE_ARTICLE' as any));
  }, [user, userRole, isAdmin, hasPermission]);

  useEffect(() => {
    loadArticles();
  }, [statusFilter, user?.id]);

  const loadArticles = async () => {
    console.log('🔍 Frontend Debug - Loading articles with filter:', statusFilter);
    const response = await getArticles({ 
      status: statusFilter,
      take: 50, 
      skip: 0 
    });
    
    console.log('🔍 Frontend Debug - Articles response:', response);
    if (response?.articles) {
      console.log('🔍 Frontend Debug - Articles loaded:', response.articles.length);
      const filteredArticles = response.articles.filter((article: Article) => {
        if (article.status !== 'DRAFT') return true;
        return article.author?.id === user?.id;
      });
      setArticles(filteredArticles);
    } else {
      console.log('🔍 Frontend Debug - No articles in response');
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

  const articleUrl = (article: Article) => {
    const category = article.category?.slug ?? "news";
    const topic = article.topic ?? "latest";
    return `/${category}/${topic}/${article.slug}`;
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

      {/* Debug Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2">🔍 Debug Information</h3>
        <div className="space-y-1 text-blue-700">
          <p><strong>User Email:</strong> {user?.email || 'Not loaded'}</p>
          <p><strong>User Role:</strong> {userRole || 'Not loaded'}</p>
          <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Articles Count:</strong> {articles.length}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
        </div>
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
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  /{article.slug}
                  {article.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {article.isEditorsPick && <Badge variant="secondary" className="text-xs">Editor's Pick</Badge>}
                  {article.isBreaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
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
                      <Link href={articleUrl(article)} target="_blank">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
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
