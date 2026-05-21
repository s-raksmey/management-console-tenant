// src/components/dashboard/AuthorDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Permission } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthorStats } from '@/hooks/useAuthorStats';

type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

const statusStyles: Record<ArticleStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ARCHIVED: 'bg-rose-100 text-rose-800 border-rose-200',
};

function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'Unknown';

  const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-600">{helper}</p>
          </div>
          <div className="rounded-md bg-blue-50 p-2 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AuthorDashboard: React.FC = () => {
  const { hasPermission } = usePermissions();
  const {
    loading,
    error,
    getAuthorStats,
    getAuthorArticles,
    getAuthorInsights,
  } = useAuthorStats();

  const [stats, setStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [statsData, articlesData, insightsData] = await Promise.all([
        getAuthorStats(),
        getAuthorArticles(6),
        getAuthorInsights(),
      ]);

      setStats(statsData);
      setArticles(articlesData || []);
      setInsights(insightsData);
    } catch (err) {
      console.error('Failed to load author dashboard data:', err);
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

  const monthlyProgress = stats?.monthlyProgress ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 0;
  const goalPercent = monthlyGoal > 0 ? Math.min((monthlyProgress / monthlyGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Author Workspace</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950">Dashboard</h1>
              <p className="mt-1 text-slate-600">Track your drafts, submissions, and published articles.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {hasPermission(Permission.CREATE_ARTICLE) && (
                <Button asChild>
                  <Link href="/articles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Article
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">Error loading dashboard data: {error}</CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Articles" value={loading || !stats ? '-' : stats.totalArticles} helper="Total content created" icon={FileText} />
          <KpiCard label="Published" value={loading || !stats ? '-' : stats.publishedArticles} helper={`${stats?.approvalRate ?? 0}% approval rate`} icon={CheckCircle} />
          <KpiCard label="In Review" value={loading || !stats ? '-' : stats.inReviewArticles} helper="Waiting for editorial review" icon={Clock} />
          <KpiCard label="Views" value={loading || !stats ? '-' : (stats.totalViews ?? 0).toLocaleString()} helper="Total public reads" icon={Eye} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Recent Articles</CardTitle>
                  <CardDescription>Your latest drafts and submissions.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/articles/my">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-md bg-slate-100" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-950">No articles yet</p>
                  <p className="mt-1 text-sm text-slate-600">Create your first draft to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {articles.map((article) => (
                    <div key={article.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{article.title}</h3>
                          <Badge className={statusStyles[(article.status as ArticleStatus) || 'DRAFT']}>
                            {article.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {article.category?.name || 'Uncategorized'} · Updated {formatTimeAgo(article.updatedAt)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/articles/${article.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Monthly Goal</CardTitle>
                <CardDescription>Articles created this month.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-950">{monthlyProgress}</p>
                    <p className="text-sm text-slate-600">of {monthlyGoal || 0} articles</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{Math.round(goalPercent)}%</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${goalPercent}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Simple writing metrics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Average views</span>
                  <span className="font-semibold text-slate-950">{stats?.avgViewsPerArticle ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Articles this week</span>
                  <span className="font-semibold text-slate-950">{insights?.recentActivity?.articlesThisWeek ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Writing streak</span>
                  <span className="font-semibold text-slate-950">{insights?.writingStreak?.current ?? 0} days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Top Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(insights?.categoryDistribution || []).slice(0, 4).map((category: any) => (
                  <div key={category.category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{category.category}</span>
                    <span className="font-semibold text-slate-950">{category.count}</span>
                  </div>
                ))}
                {(!insights?.categoryDistribution || insights.categoryDistribution.length === 0) && (
                  <p className="text-sm text-slate-500">No category data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorDashboard;
