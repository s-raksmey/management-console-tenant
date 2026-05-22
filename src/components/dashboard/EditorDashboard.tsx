// src/components/dashboard/EditorDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Star,
  Users,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Input } from '@/components/ui/input';
import { useEditorial } from '@/hooks/useEditorial';
import type { ActivityItem } from './shared';

function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'Unknown';

  const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function priorityClass(priority?: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">{value}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{helper}</p>
          </div>
          <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const EditorDashboard: React.FC = () => {
  const {
    loading,
    error,
    getEditorialStats,
    getPendingArticles,
    getRecentActions,
    getAuthorPerformance,
    approveArticle,
    rejectArticle,
    featureArticle,
  } = useEditorial();

  const [stats, setStats] = useState<any>(null);
  const [pendingArticles, setPendingArticles] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<ActivityItem[]>([]);
  const [authorPerformance, setAuthorPerformance] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const loadDashboardData = async () => {
    try {
      const [statsData, articlesData] = await Promise.all([
        getEditorialStats(),
        getPendingArticles(8),
      ]);

      setStats(statsData);
      setPendingArticles(articlesData || []);

      try {
        const actionsData = await getRecentActions(6);
        setRecentActions(
          actionsData.map((action) => ({
            id: action.id,
            type: action.type as any,
            title: action.articleTitle,
            description: `by ${action.authorName}`,
            user: { name: action.editorName },
            timestamp: action.timestamp,
            metadata: { category: 'Editorial' },
          })),
        );
      } catch (actionsError) {
        console.warn('Failed to load editorial actions:', actionsError);
        setRecentActions([]);
      }

      try {
        setAuthorPerformance(await getAuthorPerformance(5));
      } catch (performanceError) {
        console.warn('Failed to load author performance:', performanceError);
        setAuthorPerformance([]);
      }
    } catch (err) {
      console.error('Failed to load editor dashboard data:', err);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const runArticleAction = async (action: 'approve' | 'reject' | 'feature', articleId: string) => {
    if (action === 'approve') await approveArticle(articleId);
    if (action === 'reject') await rejectArticle(articleId);
    if (action === 'feature') await featureArticle(articleId);
    await loadDashboardData();
  };

  const requestArticleAction = (
    action: 'approve' | 'reject' | 'feature',
    article: any,
  ) => {
    const copy = {
      approve: {
        title: 'Approve Article?',
        description: `"${article.title}" will be published on the public website.`,
        confirmText: 'Approve',
        variant: 'default' as const,
      },
      reject: {
        title: 'Reject Article?',
        description: `"${article.title}" will be sent back and will not be published.`,
        confirmText: 'Reject',
        variant: 'destructive' as const,
      },
      feature: {
        title: 'Feature Article?',
        description: `"${article.title}" will be marked as featured content.`,
        confirmText: 'Feature',
        variant: 'default' as const,
      },
    }[action];

    setConfirmation({
      open: true,
      ...copy,
      onConfirm: () => runArticleAction(action, article.id),
    });
  };

  const filteredArticles = pendingArticles.filter((article) => {
    const value = searchTerm.toLowerCase();
    return (
      article.title?.toLowerCase().includes(value) ||
      article.authorName?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Editorial Workspace</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">Dashboard</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Review submissions, publish approved content, and monitor editorial flow.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button asChild>
                <Link href="/review">
                  <FileText className="mr-2 h-4 w-4" />
                  Review Queue
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              Error loading dashboard data: {error}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Pending" value={loading || !stats ? '-' : stats.pendingReviews} helper="Articles waiting for review" icon={Clock} />
          <KpiCard label="Approved Today" value={loading || !stats ? '-' : stats.approvedToday} helper="Editorial decisions today" icon={CheckCircle} />
          <KpiCard label="Published Week" value={loading || !stats ? '-' : stats.publishedThisWeek} helper="Articles published this week" icon={Eye} />
          <KpiCard label="Featured" value={loading || !stats ? '-' : stats.featuredArticles} helper="Featured public content" icon={Star} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Review Queue</CardTitle>
                  <CardDescription>Articles that need an editorial decision.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search articles or authors..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-md bg-slate-100" />
                  ))}
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-950 dark:text-slate-100">No articles pending review</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">The queue is clear.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredArticles.map((article) => (
                    <div key={article.id} className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{article.title}</h3>
                            <Badge className={priorityClass(article.priority)}>
                              {article.priority || 'normal'}
                            </Badge>
                            <Badge variant="outline">{article.category?.name || 'Uncategorized'}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            By {article.authorName || 'Unknown'} · Submitted {formatTimeAgo(article.submittedAt)}
                            {article.wordCount ? ` · ${article.wordCount} words` : ''}
                          </p>
                          {article.excerpt && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{article.excerpt}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button variant="outline" size="sm" onClick={() => requestArticleAction('feature', article)}>
                            <Star className="mr-2 h-4 w-4" />
                            Feature
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestArticleAction('reject', article)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => requestArticleAction('approve', article)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Editorial Metrics</CardTitle>
                <CardDescription>Current workflow performance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Average review time</span>
                  <span className="font-semibold text-slate-950">{stats?.avgReviewTime?.toFixed?.(1) || '0.0'}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Approval rate</span>
                  <span className="font-semibold text-slate-950">{stats?.approvalRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Quality score</span>
                  <span className="font-semibold text-slate-950">{stats?.contentScore || 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle>Recent Decisions</CardTitle>
                <CardDescription>Latest editorial activity.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActions.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent actions yet.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex gap-3">
                        <div className="mt-1 rounded-md bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {action.type === 'approve' ? <CheckCircle className="h-4 w-4" /> : action.type === 'reject' ? <XCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{action.title}</p>
                          <p className="text-xs text-slate-500">{formatTimeAgo(action.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Author Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authorPerformance.length === 0 ? (
                  <p className="text-sm text-slate-500">No author data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {authorPerformance.slice(0, 4).map((author) => (
                      <div key={author.authorId} className="flex items-center justify-between text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <Users className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate text-slate-700">{author.name}</span>
                        </div>
                        <span className="font-semibold text-slate-950">{author.articlesSubmitted}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={(open) => setConfirmation((current) => ({ ...current, open }))}
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        variant={confirmation.variant}
        onConfirm={confirmation.onConfirm}
      />
    </div>
  );
};

export default EditorDashboard;
