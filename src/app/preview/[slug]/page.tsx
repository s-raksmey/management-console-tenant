'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useArticles, useArticleMutations } from '@/hooks/useGraphQL';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/components/permissions/PermissionGuard';
import ArticlePreview from '@/components/preview/ArticlePreview';
import PreviewHeader from '@/components/preview/PreviewHeader';
// Removed Alert import - using inline div pattern instead
import { Loader2, AlertTriangle } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentJson: string;
  status: string;
  topic?: string;
  coverImageUrl?: string;
  authorName: string;
  authorId?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  isFeatured: boolean;
  isEditorsPick: boolean;
  isBreaking: boolean;
  pinnedAt?: string;
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ArticlePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { getArticleBySlug } = useArticles();
  const { setArticleStatus } = useArticleMutations();
  const { hasPermission, user, isLoading: permissionsLoading } = usePermissions();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Check if user has permission to preview this article
  const canPreview = (article: Article | null) => {
    if (!article || !user) {
      return false;
    }

    const currentUserRole = user.role?.toString().toUpperCase();

    if (currentUserRole === 'ADMIN' || currentUserRole === 'EDITOR') {
      return true;
    }

    if (currentUserRole === 'AUTHOR') {
      const isAuthor = article.authorId === user.id ||
        article.authorName === user.email ||
        article.authorName === user.name;

      return isAuthor;
    }

    return false;
  };

  // Fetch article data
  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug || permissionsLoading) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getArticleBySlug(slug);
        
        if (response?.articleBySlug) {
          const articleData = response.articleBySlug;
          
          // Check permissions
          if (!canPreview(articleData)) {
            setError('You do not have permission to preview this article.');
            return;
          }
          
          setArticle(articleData);
        } else {
          setError('Article not found.');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, getArticleBySlug, permissionsLoading, user]);

  // Handle article actions
  const handlePublish = async () => {
    if (!article || !hasPermission(Permission.PUBLISH_ARTICLE)) return;
    
    try {
      setUpdating(true);
      await setArticleStatus(article.id, 'PUBLISHED');
      setArticle({ ...article, status: 'PUBLISHED' });
      // You might want to show a success toast here
      alert('Article published successfully!');
    } catch (err) {
      console.error('Error publishing article:', err);
      alert('Failed to publish article. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    if (!article || !hasPermission(Permission.APPROVE_ARTICLES)) return;
    
    try {
      setUpdating(true);
      await setArticleStatus(article.id, 'PUBLISHED');
      setArticle({ ...article, status: 'PUBLISHED' });
      alert('Article approved and published!');
    } catch (err) {
      console.error('Error approving article:', err);
      alert('Failed to approve article. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!article || !hasPermission(Permission.REJECT_ARTICLES)) return;
    
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      setUpdating(true);
      await setArticleStatus(article.id, 'DRAFT');
      setArticle({ ...article, status: 'DRAFT' });
      alert('Article rejected and sent back to draft.');
    } catch (err) {
      console.error('Error rejecting article:', err);
      alert('Failed to reject article. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Loading state
  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading article preview...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto pt-16 px-6">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <div className="text-red-800">
                {error}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/articles')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Return to Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No article found
  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto pt-16 px-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">
            The article you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push('/articles')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Return to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <PreviewHeader
        article={article}
        onPublish={handlePublish}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Loading overlay for updates */}
      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Updating article...</span>
          </div>
        </div>
      )}

      {/* Article Preview */}
      <div className="py-8">
        <ArticlePreview article={article} isPreview={true} />
      </div>
    </div>
  );
}
