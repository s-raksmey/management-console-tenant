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
import { useStableLoading } from '@/hooks/useStableLoading';
import { useAdminLocale } from '@/hooks/useAdminLocale';
import type { ActivityItem } from './shared';

const editorDashboardCopy = {
  en: {
    unknown: 'Unknown',
    justNow: 'Just now',
    minutesAgo: (count: number) => `${count}m ago`,
    hoursAgo: (count: number) => `${count}h ago`,
    daysAgo: (count: number) => `${count}d ago`,
    confirm: 'Confirm',
    by: (name: string) => `by ${name}`,
    editorial: 'Editorial',
    approveTitle: 'Approve Article?',
    approveDescription: (title: string) => `"${title}" will be published on the public website.`,
    approve: 'Approve',
    rejectTitle: 'Reject Article?',
    rejectDescription: (title: string) => `"${title}" will be sent back and will not be published.`,
    reject: 'Reject',
    featureTitle: 'Feature Article?',
    featureDescription: (title: string) => `"${title}" will be marked as featured content.`,
    feature: 'Feature',
    workspace: 'Editorial Workspace',
    dashboard: 'Dashboard',
    description: 'Review submissions, publish approved content, and monitor editorial flow.',
    refresh: 'Refresh',
    reviewQueue: 'Review Queue',
    loadError: 'Error loading dashboard data:',
    pending: 'Pending',
    pendingHelper: 'Articles waiting for review',
    approvedToday: 'Approved Today',
    approvedTodayHelper: 'Editorial decisions today',
    publishedWeek: 'Published Week',
    publishedWeekHelper: 'Articles published this week',
    featured: 'Featured',
    featuredHelper: 'Featured public content',
    queueDescription: 'Articles that need an editorial decision.',
    searchPlaceholder: 'Search articles or authors...',
    emptyQueueTitle: 'No articles pending review',
    emptyQueueDescription: 'The queue is clear.',
    normal: 'normal',
    uncategorized: 'Uncategorized',
    byline: (author: string, time: string, words?: number) =>
      `By ${author} · Submitted ${time}${words ? ` · ${words} words` : ''}`,
    metrics: 'Editorial Metrics',
    metricsDescription: 'Current workflow performance.',
    averageReviewTime: 'Average review time',
    approvalRate: 'Approval rate',
    qualityScore: 'Quality score',
    recentDecisions: 'Recent Decisions',
    recentDecisionsDescription: 'Latest editorial activity.',
    noRecentActions: 'No recent actions yet.',
    authorActivity: 'Author Activity',
    noAuthorData: 'No author data yet.',
    priority: {
      high: 'high',
      medium: 'medium',
      low: 'low',
      normal: 'normal',
    },
  },
  km: {
    unknown: 'មិនស្គាល់',
    justNow: 'ទើបតែឥឡូវ',
    minutesAgo: (count: number) => `${count} នាទីមុន`,
    hoursAgo: (count: number) => `${count} ម៉ោងមុន`,
    daysAgo: (count: number) => `${count} ថ្ងៃមុន`,
    confirm: 'បញ្ជាក់',
    by: (name: string) => `ដោយ ${name}`,
    editorial: 'វិចារណកិច្ច',
    approveTitle: 'អនុម័តអត្ថបទ?',
    approveDescription: (title: string) => `"${title}" នឹងត្រូវបានផ្សព្វផ្សាយលើគេហទំព័រសាធារណៈ។`,
    approve: 'អនុម័ត',
    rejectTitle: 'បដិសេធអត្ថបទ?',
    rejectDescription: (title: string) => `"${title}" នឹងត្រូវបានផ្ញើត្រឡប់ ហើយមិនត្រូវបានផ្សព្វផ្សាយទេ។`,
    reject: 'បដិសេធ',
    featureTitle: 'កំណត់ជាអត្ថបទពិសេស?',
    featureDescription: (title: string) => `"${title}" នឹងត្រូវបានកំណត់ជាមាតិកាពិសេស។`,
    feature: 'ពិសេស',
    workspace: 'កន្លែងការងារអ្នកកែសម្រួល',
    dashboard: 'ផ្ទាំងគ្រប់គ្រង',
    description: 'ត្រួតពិនិត្យការដាក់ស្នើ ផ្សព្វផ្សាយមាតិកាដែលបានអនុម័ត និងតាមដានលំហូរកែសម្រួល។',
    refresh: 'ធ្វើបច្ចុប្បន្នភាព',
    reviewQueue: 'ជួរត្រួតពិនិត្យ',
    loadError: 'មានបញ្ហាផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រង៖',
    pending: 'កំពុងរង់ចាំ',
    pendingHelper: 'អត្ថបទកំពុងរង់ចាំការត្រួតពិនិត្យ',
    approvedToday: 'បានអនុម័តថ្ងៃនេះ',
    approvedTodayHelper: 'ការសម្រេចវិចារណកិច្ចថ្ងៃនេះ',
    publishedWeek: 'បានផ្សព្វផ្សាយសប្តាហ៍នេះ',
    publishedWeekHelper: 'អត្ថបទដែលបានផ្សព្វផ្សាយសប្តាហ៍នេះ',
    featured: 'ពិសេស',
    featuredHelper: 'មាតិកាពិសេសសាធារណៈ',
    queueDescription: 'អត្ថបទដែលត្រូវការការសម្រេចពីអ្នកកែសម្រួល។',
    searchPlaceholder: 'ស្វែងរកអត្ថបទ ឬអ្នកនិពន្ធ...',
    emptyQueueTitle: 'មិនមានអត្ថបទកំពុងរង់ចាំការត្រួតពិនិត្យ',
    emptyQueueDescription: 'ជួរត្រួតពិនិត្យទំនេរ។',
    normal: 'ធម្មតា',
    uncategorized: 'មិនមានប្រភេទ',
    byline: (author: string, time: string, words?: number) =>
      `ដោយ ${author} · បានដាក់ស្នើ ${time}${words ? ` · ${words} ពាក្យ` : ''}`,
    metrics: 'រង្វាស់វិចារណកិច្ច',
    metricsDescription: 'ប្រសិទ្ធភាពលំហូរការងារបច្ចុប្បន្ន។',
    averageReviewTime: 'ពេលត្រួតពិនិត្យមធ្យម',
    approvalRate: 'អត្រាអនុម័ត',
    qualityScore: 'ពិន្ទុគុណភាព',
    recentDecisions: 'ការសម្រេចថ្មីៗ',
    recentDecisionsDescription: 'សកម្មភាពវិចារណកិច្ចថ្មីៗ។',
    noRecentActions: 'មិនទាន់មានសកម្មភាពថ្មីៗទេ។',
    authorActivity: 'សកម្មភាពអ្នកនិពន្ធ',
    noAuthorData: 'មិនទាន់មានទិន្នន័យអ្នកនិពន្ធទេ។',
    priority: {
      high: 'ខ្ពស់',
      medium: 'មធ្យម',
      low: 'ទាប',
      normal: 'ធម្មតា',
    },
  },
} as const;

type EditorCopy = typeof editorDashboardCopy.en | typeof editorDashboardCopy.km;

function formatTimeAgo(timestamp: string | undefined, copy: EditorCopy): string {
  if (!timestamp) return copy.unknown;

  const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffInMinutes < 1) return copy.justNow;
  if (diffInMinutes < 60) return copy.minutesAgo(diffInMinutes);
  if (diffInMinutes < 1440) return copy.hoursAgo(Math.floor(diffInMinutes / 60));
  return copy.daysAgo(Math.floor(diffInMinutes / 1440));
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
  const { locale } = useAdminLocale();
  const copy = editorDashboardCopy[locale];
  const {
    loading: requestLoading,
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
  const [initialLoading, setInitialLoading] = useState(true);
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
    confirmText: copy.confirm,
    onConfirm: () => {},
  });
  const loading = useStableLoading(initialLoading || requestLoading);

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
            description: copy.by(action.authorName),
            user: { name: action.editorName },
            timestamp: action.timestamp,
            metadata: { category: copy.editorial },
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
    } finally {
      setInitialLoading(false);
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
    const dialogCopy = {
      approve: {
        title: copy.approveTitle,
        description: copy.approveDescription(article.title),
        confirmText: copy.approve,
        variant: 'default' as const,
      },
      reject: {
        title: copy.rejectTitle,
        description: copy.rejectDescription(article.title),
        confirmText: copy.reject,
        variant: 'destructive' as const,
      },
      feature: {
        title: copy.featureTitle,
        description: copy.featureDescription(article.title),
        confirmText: copy.feature,
        variant: 'default' as const,
      },
    }[action];

    setConfirmation({
      open: true,
      ...dialogCopy,
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
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{copy.workspace}</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">{copy.dashboard}</h1>
              <p className="mt-1 text-slate-600 dark:text-slate-400">{copy.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {copy.refresh}
              </Button>
              <Button asChild>
                <Link href="/review">
                  <FileText className="mr-2 h-4 w-4" />
                  {copy.reviewQueue}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {copy.loadError} {error}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label={copy.pending} value={loading || !stats ? '-' : stats.pendingReviews} helper={copy.pendingHelper} icon={Clock} />
          <KpiCard label={copy.approvedToday} value={loading || !stats ? '-' : stats.approvedToday} helper={copy.approvedTodayHelper} icon={CheckCircle} />
          <KpiCard label={copy.publishedWeek} value={loading || !stats ? '-' : stats.publishedThisWeek} helper={copy.publishedWeekHelper} icon={Eye} />
          <KpiCard label={copy.featured} value={loading || !stats ? '-' : stats.featuredArticles} helper={copy.featuredHelper} icon={Star} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{copy.reviewQueue}</CardTitle>
                  <CardDescription>{copy.queueDescription}</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={copy.searchPlaceholder}
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
                  <p className="mt-3 font-semibold text-slate-950 dark:text-slate-100">{copy.emptyQueueTitle}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{copy.emptyQueueDescription}</p>
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
                              {copy.priority[(article.priority as keyof typeof copy.priority) || 'normal'] ?? copy.normal}
                            </Badge>
                            <Badge variant="outline">{article.category?.name || copy.uncategorized}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {copy.byline(article.authorName || copy.unknown, formatTimeAgo(article.submittedAt, copy), article.wordCount)}
                          </p>
                          {article.excerpt && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{article.excerpt}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button variant="outline" size="sm" onClick={() => requestArticleAction('feature', article)}>
                            <Star className="mr-2 h-4 w-4" />
                            {copy.feature}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => requestArticleAction('reject', article)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            {copy.reject}
                          </Button>
                          <Button size="sm" onClick={() => requestArticleAction('approve', article)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {copy.approve}
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
                <CardTitle>{copy.metrics}</CardTitle>
                <CardDescription>{copy.metricsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.averageReviewTime}</span>
                  <span className="font-semibold text-slate-950">{stats?.avgReviewTime?.toFixed?.(1) || '0.0'}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.approvalRate}</span>
                  <span className="font-semibold text-slate-950">{stats?.approvalRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{copy.qualityScore}</span>
                  <span className="font-semibold text-slate-950">{stats?.contentScore || 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle>{copy.recentDecisions}</CardTitle>
                <CardDescription>{copy.recentDecisionsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActions.length === 0 ? (
                  <p className="text-sm text-slate-500">{copy.noRecentActions}</p>
                ) : (
                  <div className="space-y-4">
                    {recentActions.slice(0, 5).map((action) => (
                      <div key={action.id} className="flex gap-3">
                        <div className="mt-1 rounded-md bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {action.type === 'approve' ? <CheckCircle className="h-4 w-4" /> : action.type === 'reject' ? <XCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{action.title}</p>
                          <p className="text-xs text-slate-500">{formatTimeAgo(action.timestamp, copy)}</p>
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
                  {copy.authorActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authorPerformance.length === 0 ? (
                  <p className="text-sm text-slate-500">{copy.noAuthorData}</p>
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
