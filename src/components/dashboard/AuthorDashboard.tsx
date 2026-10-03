// src/components/dashboard/AuthorDashboard.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Plus,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Permission } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthorStats } from '@/hooks/useAuthorStats';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useAdminLocale } from '@/hooks/useAdminLocale';

type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

const statusStyles: Record<ArticleStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ARCHIVED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const authorDashboardCopy = {
  en: {
    unknown: 'Unknown',
    justNow: 'Just now',
    minutesAgo: (count: number) => `${count}m ago`,
    hoursAgo: (count: number) => `${count}h ago`,
    daysAgo: (count: number) => `${count}d ago`,
    workspace: 'Author Workspace',
    dashboard: 'Dashboard',
    description: 'Track your drafts, submissions, and published articles.',
    newArticle: 'New Article',
    loadError: 'Error loading dashboard data:',
    articles: 'Articles',
    totalContent: 'Total content created',
    published: 'Published',
    approvalRate: (rate: number) => `${rate}% approval rate`,
    inReview: 'In Review',
    waitingReview: 'Waiting for editorial review',
    views: 'Views',
    totalReads: 'Total public reads',
    recentArticles: 'Recent Articles',
    recentDescription: 'Your latest drafts and submissions.',
    viewAll: 'View All',
    emptyTitle: 'No articles yet',
    emptyDescription: 'Create your first draft to get started.',
    uncategorized: 'Uncategorized',
    updated: 'Updated',
    edit: 'Edit',
    monthlyGoal: 'Monthly Goal',
    monthlyGoalDescription: 'Articles created this month.',
    ofArticles: (count: number) => `of ${count} articles`,
    performance: 'Performance',
    performanceDescription: 'Simple writing metrics.',
    averageViews: 'Average views',
    articlesThisWeek: 'Articles this week',
    writingStreak: 'Writing streak',
    days: (count: number) => `${count} days`,
    topCategories: 'Top Categories',
    noCategoryData: 'No category data yet.',
    status: {
      DRAFT: 'Draft',
      REVIEW: 'Review',
      PUBLISHED: 'Published',
      ARCHIVED: 'Archived',
    },
  },
  km: {
    unknown: 'មិនស្គាល់',
    justNow: 'ទើបតែឥឡូវ',
    minutesAgo: (count: number) => `${count} នាទីមុន`,
    hoursAgo: (count: number) => `${count} ម៉ោងមុន`,
    daysAgo: (count: number) => `${count} ថ្ងៃមុន`,
    workspace: 'កន្លែងការងារអ្នកនិពន្ធ',
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    description: 'តាមដានព្រាង ការដាក់ស្នើ និងអត្ថបទដែលបានផ្សព្វផ្សាយ។',
    newArticle: 'អត្ថបទថ្មី',
    loadError: 'មានបញ្ហាផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រង៖',
    articles: 'អត្ថបទ',
    totalContent: 'មាតិកាសរុបដែលបានបង្កើត',
    published: 'បានផ្សព្វផ្សាយ',
    approvalRate: (rate: number) => `អត្រាអនុម័ត ${rate}%`,
    inReview: 'កំពុងត្រួតពិនិត្យ',
    waitingReview: 'កំពុងរង់ចាំការត្រួតពិនិត្យ',
    views: 'ចំនួនមើល',
    totalReads: 'ចំនួនអានសាធារណៈសរុប',
    recentArticles: 'អត្ថបទថ្មីៗ',
    recentDescription: 'ព្រាង និងការដាក់ស្នើថ្មីៗរបស់អ្នក។',
    viewAll: 'មើលទាំងអស់',
    emptyTitle: 'មិនទាន់មានអត្ថបទទេ',
    emptyDescription: 'បង្កើតព្រាងដំបូងរបស់អ្នក ដើម្បីចាប់ផ្តើម។',
    uncategorized: 'មិនមានប្រភេទ',
    updated: 'បានធ្វើបច្ចុប្បន្នភាព',
    edit: 'កែសម្រួល',
    monthlyGoal: 'គោលដៅប្រចាំខែ',
    monthlyGoalDescription: 'អត្ថបទដែលបានបង្កើតក្នុងខែនេះ។',
    ofArticles: (count: number) => `ក្នុងចំណោម ${count} អត្ថបទ`,
    performance: 'ប្រសិទ្ធភាព',
    performanceDescription: 'ស្ថិតិសរសេរមូលដ្ឋាន។',
    averageViews: 'ចំនួនមើលមធ្យម',
    articlesThisWeek: 'អត្ថបទសប្តាហ៍នេះ',
    writingStreak: 'ចំនួនថ្ងៃសរសេរជាប់គ្នា',
    days: (count: number) => `${count} ថ្ងៃ`,
    topCategories: 'ប្រភេទកំពូល',
    noCategoryData: 'មិនទាន់មានទិន្នន័យប្រភេទទេ។',
    status: {
      DRAFT: 'ព្រាង',
      REVIEW: 'ត្រួតពិនិត្យ',
      PUBLISHED: 'បានផ្សព្វផ្សាយ',
      ARCHIVED: 'បានដាក់ប័ណ្ណសារ',
    },
  },
} as const;

function formatTimeAgo(timestamp: string | undefined, copy: typeof authorDashboardCopy.en | typeof authorDashboardCopy.km): string {
  if (!timestamp) return copy.unknown;

  const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffInMinutes < 1) return copy.justNow;
  if (diffInMinutes < 60) return copy.minutesAgo(diffInMinutes);
  if (diffInMinutes < 1440) return copy.hoursAgo(Math.floor(diffInMinutes / 60));
  return copy.daysAgo(Math.floor(diffInMinutes / 1440));
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
    <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
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

export const AuthorDashboard: React.FC = () => {
  const { locale } = useAdminLocale();
  const copy = authorDashboardCopy[locale];
  const { hasPermission } = usePermissions();
  const {
    loading: requestLoading,
    error,
    getAuthorStats,
    getAuthorArticles,
    getAuthorInsights,
  } = useAuthorStats();

  const [stats, setStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const loading = useStableLoading(initialLoading || requestLoading);

  const loadDashboardData = useCallback(async () => {
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
    } finally {
      setInitialLoading(false);
    }
  }, [getAuthorArticles, getAuthorInsights, getAuthorStats]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const monthlyProgress = stats?.monthlyProgress ?? 0;
  const monthlyGoal = stats?.monthlyGoal ?? 0;
  const goalPercent = monthlyGoal > 0 ? Math.min((monthlyProgress / monthlyGoal) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{copy.workspace}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">{copy.dashboard}</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{copy.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasPermission(Permission.CREATE_ARTICLE) && (
                <Button asChild>
                  <Link href="/articles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {copy.newArticle}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{copy.loadError} {error}</CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={copy.articles} value={loading || !stats ? '-' : stats.totalArticles} helper={copy.totalContent} icon={FileText} />
          <KpiCard label={copy.published} value={loading || !stats ? '-' : stats.publishedArticles} helper={copy.approvalRate(stats?.approvalRate ?? 0)} icon={CheckCircle} />
          <KpiCard label={copy.inReview} value={loading || !stats ? '-' : stats.inReviewArticles} helper={copy.waitingReview} icon={Clock} />
          <KpiCard label={copy.views} value={loading || !stats ? '-' : (stats.totalViews ?? 0).toLocaleString()} helper={copy.totalReads} icon={Eye} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{copy.recentArticles}</CardTitle>
                  <CardDescription>{copy.recentDescription}</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/articles/my">{copy.viewAll}</Link>
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
                  <p className="mt-3 font-semibold text-slate-950 dark:text-slate-100">{copy.emptyTitle}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy.emptyDescription}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {articles.map((article) => (
                    <div key={article.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{article.title}</h3>
                          <Badge className={statusStyles[(article.status as ArticleStatus) || 'DRAFT']}>
                            {copy.status[(article.status as ArticleStatus) || 'DRAFT']}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {article.category?.name || copy.uncategorized} · {copy.updated} {formatTimeAgo(article.updatedAt, copy)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/articles/${article.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {copy.edit}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle>{copy.monthlyGoal}</CardTitle>
                <CardDescription>{copy.monthlyGoalDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-950">{monthlyProgress}</p>
                    <p className="text-sm text-slate-600">{copy.ofArticles(monthlyGoal || 0)}</p>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{Math.round(goalPercent)}%</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${goalPercent}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle>{copy.performance}</CardTitle>
                <CardDescription>{copy.performanceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.averageViews}</span>
                  <span className="font-semibold text-slate-950">{stats?.avgViewsPerArticle ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.articlesThisWeek}</span>
                  <span className="font-semibold text-slate-950">{insights?.recentActivity?.articlesThisWeek ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.writingStreak}</span>
                  <span className="font-semibold text-slate-950">{copy.days(insights?.writingStreak?.current ?? 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  {copy.topCategories}
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
                  <p className="text-sm text-slate-500">{copy.noCategoryData}</p>
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
