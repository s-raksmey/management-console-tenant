// src/components/dashboard/AdminDashboard.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Database,
  Globe,
  Zap,
  Eye,
  UserCheck,
  Calendar,
  Server,
  Lock,
  Unlock,
  UserPlus,
  FileEdit,
  Trash2,
  Star,
  Newspaper,
  Award,
  Plus,
  Edit,
  X,
  ThumbsUp,
  MessageCircle,
  Target,
  Filter,
  Search,
  BookOpen,
  CheckSquare,
  XCircle,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActivityItem } from "./activity-item";
import { UserStats, useUserManagement } from '@/hooks/useUserManagement';
import { useArticles } from '@/hooks/useGraphQL';
import { useEditorial } from '@/hooks/useEditorial';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Permission } from '@/components/permissions/PermissionGuard';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@radix-ui/react-progress';
import { useTenant } from '@/contexts/TenantContext';
import { getTenantDisplayName } from '@/lib/tenant-display';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface SystemHealth {
  uptime: number;
  responseTime: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  lastUpdated: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  pendingReviews: number;
  approvalRate: number;
  userGrowth: number;
  articleGrowth: number;
  reviewGrowth: number;
  // Author-specific properties
  myArticles?: number;
  myPublishedArticles?: number;
  myDraftArticles?: number;
  myPendingArticles?: number;
  totalViews?: number;
  averageRating?: number;
  totalComments?: number;
  monthlyArticles?: number;
  weeklyWords?: number;
  writingStreak?: number;
  bestMonth?: number;
  recentArticles?: Array<{
    id: string;
    title: string;
    status: 'published' | 'draft' | 'pending' | 'rejected';
    updatedAt: string;
    views?: number;
  }>;
  // Editor-specific properties
  articlesReviewed?: number;
  articlesApproved?: number;
  articlesRejected?: number;
  featuredArticles?: number;
  breakingNewsCount?: number;
  editorsPickCount?: number;
  averageReviewTime?: number;
  weeklyReviews?: number;
  monthlyApprovals?: number;
  qualityScore?: number;
  pendingQueue?: Array<{
    id: string;
    title: string;
    author: string;
    submittedAt: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
  }>;
  recentReviews?: Array<{
    id: string;
    title: string;
    author: string;
    action: 'approved' | 'rejected' | 'featured';
    reviewedAt: string;
    category: string;
  }>;
}

const adminDashboardCopy = {
  en: {
    tenant: 'Sub-tenant',
    unknown: 'Unknown',
    uncategorized: 'Uncategorized',
    system: 'System',
    systemCategory: 'System',
    activityFallback: (type: string) => `${type} activity`,
    byUser: (name: string) => `by ${name}`,
    dashboardTitle: (tenantName: string) => `${tenantName} Dashboard`,
    adminDescription: 'Manage content, users, settings, and public website configuration',
    settings: 'Settings',
    loadError: 'Error loading dashboard data:',
    responseTime: 'Response Time',
    totalUsers: 'Total Users',
    publishedArticles: 'Published Articles',
    live: 'Live',
    activeConnections: 'Active Connections',
    userManagement: 'User Management',
    userManagementDescription: 'Sub-tenant users by role and management tools',
    manageUsers: 'Manage Users',
    admins: 'Admins',
    editors: 'Editors',
    authors: 'Authors',
    manage: 'Manage',
    websiteAnalytics: 'Website Analytics',
    websiteAnalyticsDescription: 'Content performance and approval metrics',
    published: 'Published',
    view: 'View',
    pendingReview: 'Pending Review',
    review: 'Review',
    drafts: 'Drafts',
    edit: 'Edit',
    approvalRate: 'Approval Rate',
    analytics: 'Analytics',
    systemHealth: 'System Health',
    systemHealthDescription: 'Real-time system monitoring',
    uptime: 'Uptime',
    memory: 'Memory',
    cpu: 'CPU',
    responseTimeLabel: 'Response Time:',
    connections: 'Connections:',
    systemActivity: 'System Activity',
    systemActivityDescription: 'Recent sub-tenant activity',
    noRecentActivity: 'No recent activity',
    viewAuditLogs: 'View Audit Logs',
    accessDenied: 'Access Denied',
    accessDeniedDescription: "You don't have permission to access this dashboard.",
    currentRole: (role: string) => `Current role: ${role}`,
    editorDashboard: 'Editor Dashboard',
    editorDescription: 'Content management and editorial control',
    total: 'Total',
    articlesReviewed: 'Articles Reviewed',
    approved: 'Approved',
    pending: 'Pending',
    clear: 'Clear',
    featured: 'Featured',
    mainContentComing: 'Main content sections coming...',
    sidebarContentComing: 'Sidebar content coming...',
    authorDashboard: 'Author Dashboard',
    authorDescription: 'Content creation and personal analytics',
    newArticle: 'New Article',
    draft: 'Draft',
    myArticles: 'My Articles',
    inReview: 'In Review',
    myRecentArticles: 'My Recent Articles',
    myRecentDescription: 'Your latest articles and their status',
    createArticle: 'Create Article',
    views: (count: number) => `${count} views`,
    noArticlesYet: 'No articles yet',
    createFirstArticle: 'Create Your First Article',
    writingAnalytics: 'Writing Analytics',
    writingAnalyticsDescription: 'Your content performance and writing metrics',
    totalViews: 'Total Views',
    avgRating: 'Avg Rating',
    comments: 'Comments',
    writingGoals: 'Writing Goals',
    writingGoalsDescription: 'Track your writing progress',
    monthlyArticles: 'Monthly Articles',
    wordsThisWeek: 'Words This Week',
    streak: 'Streak:',
    days: (count: number) => `${count} days`,
    bestMonth: 'Best Month:',
    articlesCount: (count: number) => `${count} articles`,
    recentActivity: 'Recent Activity',
    recentWritingActivity: 'Your recent writing activity',
    statusLabel: {
      published: 'published',
      draft: 'draft',
      pending: 'pending',
      rejected: 'rejected',
    },
  },
  km: {
    tenant: 'គេហទំព័រ',
    unknown: 'មិនស្គាល់',
    uncategorized: 'មិនមានប្រភេទ',
    system: 'ប្រព័ន្ធ',
    systemCategory: 'ប្រព័ន្ធ',
    activityFallback: (type: string) => `សកម្មភាព ${type}`,
    byUser: (name: string) => `ដោយ ${name}`,
    dashboardTitle: (tenantName: string) => `ផ្ទាំងគ្រប់គ្រង ${tenantName}`,
    adminDescription: 'គ្រប់គ្រងមាតិកា អ្នកប្រើ ការកំណត់ និងការរៀបចំគេហទំព័រសាធារណៈ',
    settings: 'ការកំណត់',
    loadError: 'មានបញ្ហាផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រង៖',
    responseTime: 'ពេលឆ្លើយតប',
    totalUsers: 'អ្នកប្រើសរុប',
    publishedArticles: 'អត្ថបទដែលបានផ្សព្វផ្សាយ',
    live: 'កំពុងដំណើរការ',
    activeConnections: 'ការតភ្ជាប់សកម្ម',
    userManagement: 'គ្រប់គ្រងអ្នកប្រើ',
    userManagementDescription: 'អ្នកប្រើតាមតួនាទី និងឧបករណ៍គ្រប់គ្រង',
    manageUsers: 'គ្រប់គ្រងអ្នកប្រើ',
    admins: 'អ្នកគ្រប់គ្រង',
    editors: 'អ្នកកែសម្រួល',
    authors: 'អ្នកនិពន្ធ',
    manage: 'គ្រប់គ្រង',
    websiteAnalytics: 'វិភាគគេហទំព័រ',
    websiteAnalyticsDescription: 'ប្រសិទ្ធភាពមាតិកា និងរង្វាស់អនុម័ត',
    published: 'បានផ្សព្វផ្សាយ',
    view: 'មើល',
    pendingReview: 'កំពុងរង់ចាំត្រួតពិនិត្យ',
    review: 'ត្រួតពិនិត្យ',
    drafts: 'ព្រាង',
    edit: 'កែសម្រួល',
    approvalRate: 'អត្រាអនុម័ត',
    analytics: 'វិភាគ',
    systemHealth: 'សុខភាពប្រព័ន្ធ',
    systemHealthDescription: 'ការតាមដានប្រព័ន្ធពេលវេលាជាក់ស្តែង',
    uptime: 'ពេលដំណើរការ',
    memory: 'Memory',
    cpu: 'CPU',
    responseTimeLabel: 'ពេលឆ្លើយតប៖',
    connections: 'ការតភ្ជាប់៖',
    systemActivity: 'សកម្មភាពប្រព័ន្ធ',
    systemActivityDescription: 'សកម្មភាពអង្គភាពថ្មីៗ',
    noRecentActivity: 'មិនទាន់មានសកម្មភាពថ្មីៗទេ',
    viewAuditLogs: 'មើលកំណត់ហេតុសវនកម្ម',
    accessDenied: 'គ្មានសិទ្ធិចូល',
    accessDeniedDescription: 'អ្នកមិនមានសិទ្ធិចូលប្រើផ្ទាំងគ្រប់គ្រងនេះទេ។',
    currentRole: (role: string) => `តួនាទីបច្ចុប្បន្ន៖ ${role}`,
    editorDashboard: 'ផ្ទាំងគ្រប់គ្រងអ្នកកែសម្រួល',
    editorDescription: 'គ្រប់គ្រងមាតិកា និងការត្រួតពិនិត្យវិចារណកិច្ច',
    total: 'សរុប',
    articlesReviewed: 'អត្ថបទបានត្រួតពិនិត្យ',
    approved: 'បានអនុម័ត',
    pending: 'កំពុងរង់ចាំ',
    clear: 'ទំនេរ',
    featured: 'ពិសេស',
    mainContentComing: 'ផ្នែកមាតិកាចម្បងនឹងមកដល់...',
    sidebarContentComing: 'មាតិកា sidebar នឹងមកដល់...',
    authorDashboard: 'ផ្ទាំងគ្រប់គ្រងអ្នកនិពន្ធ',
    authorDescription: 'ការបង្កើតមាតិកា និងការវិភាគផ្ទាល់ខ្លួន',
    newArticle: 'អត្ថបទថ្មី',
    draft: 'ព្រាង',
    myArticles: 'អត្ថបទរបស់ខ្ញុំ',
    inReview: 'កំពុងត្រួតពិនិត្យ',
    myRecentArticles: 'អត្ថបទថ្មីៗរបស់ខ្ញុំ',
    myRecentDescription: 'អត្ថបទថ្មីៗរបស់អ្នក និងស្ថានភាពរបស់វា',
    createArticle: 'បង្កើតអត្ថបទ',
    views: (count: number) => `${count} ដងមើល`,
    noArticlesYet: 'មិនទាន់មានអត្ថបទទេ',
    createFirstArticle: 'បង្កើតអត្ថបទដំបូងរបស់អ្នក',
    writingAnalytics: 'វិភាគការសរសេរ',
    writingAnalyticsDescription: 'ប្រសិទ្ធភាពមាតិកា និងរង្វាស់ការសរសេររបស់អ្នក',
    totalViews: 'ចំនួនមើលសរុប',
    avgRating: 'ពិន្ទុមធ្យម',
    comments: 'មតិយោបល់',
    writingGoals: 'គោលដៅសរសេរ',
    writingGoalsDescription: 'តាមដានវឌ្ឍនភាពការសរសេររបស់អ្នក',
    monthlyArticles: 'អត្ថបទប្រចាំខែ',
    wordsThisWeek: 'ពាក្យសប្តាហ៍នេះ',
    streak: 'ថ្ងៃជាប់គ្នា៖',
    days: (count: number) => `${count} ថ្ងៃ`,
    bestMonth: 'ខែល្អបំផុត៖',
    articlesCount: (count: number) => `${count} អត្ថបទ`,
    recentActivity: 'សកម្មភាពថ្មីៗ',
    recentWritingActivity: 'សកម្មភាពសរសេរថ្មីៗរបស់អ្នក',
    statusLabel: {
      published: 'បានផ្សព្វផ្សាយ',
      draft: 'ព្រាង',
      pending: 'កំពុងរង់ចាំ',
      rejected: 'បានបដិសេធ',
    },
  },
} as const;

export const AdminDashboard: React.FC = () => {
  const { locale } = useAdminLocale();
  const copy = adminDashboardCopy[locale];
  const { activeTenant } = useTenant();
  const { getUserStats, getBasicStats, getUserActivity, loading: userLoading, error: userError } = useUserManagement();
  const { getArticles, loading: articlesLoading, error: articlesError } = useArticles();
  const { getEditorialStats, loading: editorialLoading } = useEditorial();
  const { 
    hasPermission, 
    isAdmin, 
    isEditor, 
    isAuthor, 
    userRole,
    userId,
    isLoading: permissionsLoading 
  } = usePermissions();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [systemActivity, setSystemActivity] = useState<ActivityItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const tenantName = getTenantDisplayName(activeTenant, copy.tenant);

  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch user statistics
      const userStatsData = await getUserStats();
      if (userStatsData) {
        setUserStats(userStatsData);
      }

      // Fetch basic stats as fallback
      const basicStatsData = await getBasicStats();
      
      // Fetch all article data for comprehensive stats
      const [publishedData, draftData, reviewData, allArticlesData] = await Promise.all([
        getArticles({ status: 'PUBLISHED', take: 1000 }),
        getArticles({ status: 'DRAFT', take: 1000 }),
        getArticles({ status: 'REVIEW', take: 1000 }),
        getArticles({ take: 1000 })
      ]);

      // Fetch editorial stats for approval rate
      const editorialStats = await getEditorialStats();

      // Calculate comprehensive dashboard statistics
      const publishedCount = publishedData?.articles?.length || 0;
      const draftCount = draftData?.articles?.length || 0;
      const reviewCount = reviewData?.articles?.length || 0;
      const totalArticles = allArticlesData?.articles?.length || basicStatsData?.totalArticles || 0;
      
      // Calculate approval rate from editorial stats or estimate
      const approvalRate = editorialStats?.approvalRate ||
        (publishedCount + reviewCount > 0
          ? Math.round((publishedCount / (publishedCount + reviewCount)) * 100)
          : 0);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const allArticles = allArticlesData?.articles || [];
      const articleGrowth = allArticles.filter((article: any) => {
        const createdAt = new Date(article.createdAt);
        return createdAt >= thirtyDaysAgo;
      }).length;

      const reviewGrowth = reviewData?.articles?.filter((article: any) => {
        const createdAt = new Date(article.createdAt);
        return createdAt >= sevenDaysAgo;
      }).length || 0;

      const userGrowth = userStatsData?.recentRegistrations || 0;

      const archivedCount = allArticles.filter((article: any) => article.status === 'ARCHIVED').length;
      const featuredCount = allArticles.filter((article: any) => article.isFeatured).length;
      const breakingCount = allArticles.filter((article: any) => article.isBreaking).length;
      const editorsPickCount = allArticles.filter((article: any) => article.isEditorsPick).length;

      const myArticles = allArticles.filter((article: any) => article.author?.id === userId);
      const myPublishedArticles = myArticles.filter((article: any) => article.status === 'PUBLISHED');
      const myDraftArticles = myArticles.filter((article: any) => article.status === 'DRAFT');
      const myPendingArticles = myArticles.filter((article: any) => article.status === 'REVIEW');
      const myTotalViews = myPublishedArticles.reduce((sum: number, article: any) => sum + (article.viewCount || 0), 0);

      const recentArticles = allArticles
        .slice()
        .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((article: any) => ({
          id: article.id,
          title: article.title,
          status: article.status === 'PUBLISHED'
            ? 'published'
            : article.status === 'REVIEW'
            ? 'pending'
            : article.status === 'DRAFT'
            ? 'draft'
            : 'rejected',
          updatedAt: article.updatedAt,
          views: article.viewCount || 0,
        }));

      const stats: DashboardStats = {
        totalUsers: userStatsData?.totalUsers || basicStatsData?.totalUsers || 0,
        activeUsers: userStatsData?.activeUsers || Math.floor((userStatsData?.totalUsers || 0) * 0.85),
        totalArticles,
        publishedArticles: publishedCount,
        draftArticles: draftCount,
        pendingReviews: reviewCount,
        approvalRate,
        userGrowth,
        articleGrowth,
        reviewGrowth,
        myArticles: myArticles.length,
        myPublishedArticles: myPublishedArticles.length,
        myDraftArticles: myDraftArticles.length,
        myPendingArticles: myPendingArticles.length,
        totalViews: myTotalViews,
        averageRating: 0,
        totalComments: 0,
        monthlyArticles: myPublishedArticles.filter((article: any) => new Date(article.publishedAt || article.updatedAt) >= thirtyDaysAgo).length,
        weeklyWords: 0,
        writingStreak: 0,
        bestMonth: 0,
        recentArticles,
        articlesReviewed: publishedCount + archivedCount,
        articlesApproved: publishedCount,
        articlesRejected: archivedCount,
        featuredArticles: featuredCount,
        breakingNewsCount: breakingCount,
        editorsPickCount: editorsPickCount,
        averageReviewTime: 0,
        weeklyReviews: 0,
        monthlyApprovals: 0,
        qualityScore: 0,
        pendingQueue: (reviewData?.articles || []).map((article: any) => ({
          id: article.id,
          title: article.title,
          author: article.authorName || copy.unknown,
          submittedAt: article.createdAt,
          priority: 'medium' as const,
          category: article.category?.name || copy.uncategorized
        })),
        recentReviews: []
      };

      setDashboardStats(stats);

      // Fetch recent system activity
      const activityData = await getUserActivity(undefined, 10);
      if (activityData) {
        const transformedActivity: ActivityItem[] = activityData.map(activity => ({
          id: activity.id,
          type: activity.activityType.toLowerCase() as any,
          title: activity.details?.title || copy.activityFallback(activity.activityType),
          description: activity.details?.description || copy.byUser(activity.user?.name || copy.system),
          user: activity.user ? { name: activity.user.name } : undefined,
          timestamp: activity.timestamp,
          metadata: {
            category: copy.systemCategory
          }
        }));
        setSystemActivity(transformedActivity);
      }

      setSystemHealth(null);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [
    copy,
    getArticles,
    getBasicStats,
    getEditorialStats,
    getUserActivity,
    getUserStats,
    userId,
  ]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const loading = useStableLoading(initialLoading || userLoading || articlesLoading || editorialLoading || permissionsLoading);
  const error = userError || articlesError;

  // Render role-specific dashboard
  const renderRoleBasedDashboard = () => {
    if (isAdmin) {
      return renderAdminDashboard();
    } else if (isEditor) {
      return renderEditorDashboard();
    } else if (isAuthor) {
      return renderAuthorDashboard();
    } else {
      return renderUnauthorizedDashboard();
    }
  };

  // Admin Dashboard Layout
  const renderAdminDashboard = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              {copy.dashboardTitle(tenantName)}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              {copy.adminDescription}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasPermission(Permission.VIEW_SETTINGS) && (
              <Link href="/settings">
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Settings className="h-4 w-4 mr-2" />
                  {copy.settings}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{copy.loadError} {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* System Health */}
              <Card className="border-green-200/70 hover:border-green-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-green-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg dark:bg-green-500/15">
                      <Server className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
                      {systemHealth?.uptime.toFixed(1) || 99.9}%
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {systemHealth?.responseTime || 45}ms
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{copy.responseTime}</p>
                  </div>
                </CardContent>
              </Card>

              {/* User Management */}
              <Card className="border-blue-200/70 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-500/15">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
                      +{dashboardStats?.userGrowth || 0}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {dashboardStats?.totalUsers?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{copy.totalUsers}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Main-tenant analytics */}
              <Card className="border-purple-200/70 hover:border-purple-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-500/15">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300">
                      {dashboardStats?.approvalRate || 0}%
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {dashboardStats?.totalArticles?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{copy.publishedArticles}</p>
                  </div>
                </CardContent>
              </Card>

              {/* System Activity */}
              <Card className="border-orange-200/70 hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-500/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-500/15">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge 
                      variant={(systemHealth?.activeConnections ?? 0) > 100 ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {copy.live}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {systemHealth?.activeConnections?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{copy.activeConnections}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Admin Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Content Overview - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Management Section */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-red-600" />
                      {copy.userManagement}
                    </CardTitle>
                    <CardDescription>{copy.userManagementDescription}</CardDescription>
                  </div>
                  {hasPermission(Permission.VIEW_ALL_USERS) && (
                    <Link href="/users">
                      <Button variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {copy.manageUsers}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading || !userStats ? (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 dark:border-red-500/20 dark:bg-red-500/10">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <p className="text-xl font-bold text-red-900 dark:text-red-300">{userStats.usersByRole.admin}</p>
                      <p className="text-xs text-red-700 dark:text-red-300">{copy.admins}</p>
                      {hasPermission(Permission.MANAGE_USER_ROLES) && (
                        <Button size="sm" variant="ghost" className="mt-2 text-xs" asChild>
                          <Link href="/users?role=ADMIN">
                            <Lock className="h-3 w-3 mr-1" />
                            {copy.manage}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{userStats.usersByRole.editor}</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{copy.editors}</p>
                      {hasPermission(Permission.MANAGE_USER_ROLES) && (
                        <Button size="sm" variant="ghost" className="mt-2 text-xs" asChild>
                          <Link href="/users?role=EDITOR">
                            <FileEdit className="h-3 w-3 mr-1" />
                            {copy.manage}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 dark:border-green-500/20 dark:bg-green-500/10">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-xl font-bold text-green-900 dark:text-green-300">{userStats.usersByRole.author}</p>
                      <p className="text-xs text-green-700 dark:text-green-300">{copy.authors}</p>
                      {hasPermission(Permission.MANAGE_USER_ROLES) && (
                        <Button size="sm" variant="ghost" className="mt-2 text-xs" asChild>
                          <Link href="/users?role=AUTHOR">
                            <Newspaper className="h-3 w-3 mr-1" />
                            {copy.manage}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Website Analytics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-600" />
                  {copy.websiteAnalytics}
                </CardTitle>
                <CardDescription>{copy.websiteAnalyticsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100 dark:border-green-500/20 dark:bg-green-500/10">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-bold text-green-900 dark:text-green-300">
                      {dashboardStats?.publishedArticles || 0}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">{copy.published}</p>
                    {hasPermission(Permission.PUBLISH_ARTICLE) && (
                      <Button size="sm" variant="ghost" className="mt-1 text-xs" asChild>
                        <Link href="/articles">
                          <Eye className="h-3 w-3 mr-1" />
                          {copy.view}
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                    <p className="text-lg font-bold text-yellow-900 dark:text-amber-300">
                      {dashboardStats?.pendingReviews || 0}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-amber-300">{copy.pendingReview}</p>
                    {hasPermission(Permission.REVIEW_ARTICLES) && (
                      <Button size="sm" variant="ghost" className="mt-1 text-xs" asChild>
                        <Link href="/review">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {copy.review}
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100 dark:border-slate-700 dark:bg-slate-800/70">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      {dashboardStats?.draftArticles || 0}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-slate-300">{copy.drafts}</p>
                    {hasPermission(Permission.UPDATE_ANY_ARTICLE) && (
                      <Button size="sm" variant="ghost" className="mt-1 text-xs" asChild>
                        <Link href="/articles">
                          <FileEdit className="h-3 w-3 mr-1" />
                          {copy.edit}
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10">
                    <Award className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                      {dashboardStats?.approvalRate || 0}%
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">{copy.approvalRate}</p>
                    {hasPermission(Permission.VIEW_AUDIT_LOGS) && (
                      <Button size="sm" variant="ghost" className="mt-1 text-xs" asChild>
                        <Link href="/analytics">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {copy.analytics}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin System Sidebar */}
          <div className="space-y-6">
            {/* System Health */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Server className="h-5 w-5 text-red-600" />
                  {copy.systemHealth}
                </CardTitle>
                <CardDescription>{copy.systemHealthDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!systemHealth ? (
                  <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{copy.uptime}</span>
                        <span className="font-medium">{systemHealth.uptime.toFixed(1)}%</span>
                      </div>
                      <Progress value={systemHealth.uptime} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{copy.memory}</span>
                        <span className="font-medium">{systemHealth.memoryUsage}%</span>
                      </div>
                      <Progress 
                        value={systemHealth.memoryUsage} 
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{copy.cpu}</span>
                        <span className="font-medium">{systemHealth.cpuUsage}%</span>
                      </div>
                      <Progress 
                        value={systemHealth.cpuUsage} 
                        className="h-2"
                      />
                    </div>
                    <div className="pt-2 border-t text-xs text-gray-500 dark:text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>{copy.responseTimeLabel}</span>
                        <span>{systemHealth.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{copy.connections}</span>
                        <span>{systemHealth.activeConnections.toLocaleString()}</span>
                      </div>
                    </div>
                    {hasPermission(Permission.SYSTEM_ADMINISTRATION) && (
                      <Button size="sm" variant="outline" className="w-full mt-3" asChild>
                        <Link href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          {copy.settings}
                        </Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            {/* System Activity Feed */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  {copy.systemActivity}
                </CardTitle>
                <CardDescription>{copy.systemActivityDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded mb-1"></div>
                          <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : systemActivity.length > 0 ? (
                  <div className="space-y-3">
                    {systemActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="p-1 bg-red-100 rounded-full mt-0.5 dark:bg-red-500/15">
                          <Activity className="h-3 w-3 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
                            {activity.title}
                          </p>
                          <p className="text-gray-600 dark:text-slate-400 text-xs">
                            {activity.description}
                          </p>
                          <p className="text-gray-400 dark:text-slate-500 text-xs">
                            {new Date(activity.timestamp).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">
                    {copy.noRecentActivity}
                  </p>
                )}
                {hasPermission(Permission.VIEW_AUDIT_LOGS) && (
                  <Button size="sm" variant="outline" className="w-full mt-4" asChild>
                    <Link href="/audit">
                      <Eye className="h-4 w-4 mr-2" />
                      {copy.viewAuditLogs}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Editor Dashboard Layout
  const renderEditorDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Editor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              {copy.editorDashboard}
            </h1>
            <p className="text-gray-600 text-sm">{copy.editorDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasPermission(Permission.REVIEW_ARTICLES) && (
              <Link href="/review">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  {copy.review}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{copy.loadError} {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* Articles Reviewed */}
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {copy.total}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.articlesReviewed || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.articlesReviewed}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Articles Approved */}
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {copy.approved}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.articlesApproved || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.approved}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Reviews */}
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge 
                      variant={(dashboardStats?.pendingReviews ?? 0) > 0 ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {(dashboardStats?.pendingReviews ?? 0) > 0 ? copy.pending : copy.clear}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.pendingReviews || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.pendingReview}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Articles */}
              <Card className="border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      {copy.featured}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.featuredArticles || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.featured}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Editor Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">{copy.mainContentComing}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">{copy.sidebarContentComing}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Author Dashboard Layout
  const renderAuthorDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Author Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-600" />
              {copy.authorDashboard}
            </h1>
            <p className="text-gray-600 text-sm">{copy.authorDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasPermission(Permission.CREATE_ARTICLE) && (
              <Link href="/articles/new">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {copy.newArticle}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{copy.loadError} {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Author Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              {/* My Articles */}
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {copy.total}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(dashboardStats?.myArticles || 0)}
                    </p>
                    <p className="text-sm text-gray-600">{copy.myArticles}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Published Articles */}
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      {copy.live}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.myPublishedArticles || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.published}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Draft Articles */}
              <Card className="border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Edit className="h-5 w-5 text-yellow-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                      {copy.draft}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.myDraftArticles || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.drafts}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Review */}
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge 
                      variant={(dashboardStats?.myPendingArticles ?? 0) > 0 ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {(dashboardStats?.myPendingArticles ?? 0) > 0 ? copy.pending : copy.clear}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats?.myPendingArticles || 0}
                    </p>
                    <p className="text-sm text-gray-600">{copy.inReview}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Author Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Author Content Overview - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Recent Articles */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      {copy.myRecentArticles}
                    </CardTitle>
                    <CardDescription>{copy.myRecentDescription}</CardDescription>
                  </div>
                  {hasPermission(Permission.CREATE_ARTICLE) && (
                    <Link href="/articles/new">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {copy.createArticle}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-12 w-12 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : dashboardStats?.recentArticles && dashboardStats.recentArticles.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardStats.recentArticles.slice(0, 5).map((article) => (
                      <div key={article.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-green-50 transition-colors">
                        <div className="p-2 bg-green-100 rounded-lg">
                          {article.status === 'published' && <Globe className="h-5 w-5 text-green-600" />}
                          {article.status === 'draft' && <Edit className="h-5 w-5 text-yellow-600" />}
                          {article.status === 'pending' && <Clock className="h-5 w-5 text-orange-600" />}
                          {article.status === 'rejected' && <X className="h-5 w-5 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{article.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="capitalize">{copy.statusLabel[article.status]}</span>
                            <span>{new Date(article.updatedAt).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}</span>
                            {article.views && <span>{copy.views(article.views)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              article.status === 'published' ? 'default' :
                              article.status === 'pending' ? 'secondary' :
                              article.status === 'draft' ? 'outline' : 'destructive'
                            }
                            className="text-xs"
                          >
                            {copy.statusLabel[article.status]}
                          </Badge>
                          {hasPermission(Permission.UPDATE_OWN_ARTICLE) && (
                            <Link href={`/articles/${article.id}/edit`}>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">{copy.noArticlesYet}</p>
                    {hasPermission(Permission.CREATE_ARTICLE) && (
                      <Link href="/articles/new">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {copy.createFirstArticle}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Writing Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  {copy.writingAnalytics}
                </CardTitle>
                <CardDescription>{copy.writingAnalyticsDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Eye className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-bold text-green-900">
                      {dashboardStats?.totalViews?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-green-700">{copy.totalViews}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-lg font-bold text-blue-900">
                      {dashboardStats?.averageRating?.toFixed(1) || '0.0'}
                    </p>
                    <p className="text-xs text-blue-700">{copy.avgRating}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <MessageCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-lg font-bold text-purple-900">
                      {dashboardStats?.totalComments || 0}
                    </p>
                    <p className="text-xs text-purple-700">{copy.comments}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Award className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-lg font-bold text-orange-900">
                      {dashboardStats?.approvalRate || 0}%
                    </p>
                    <p className="text-xs text-orange-700">{copy.approvalRate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Author Sidebar */}
          <div className="space-y-6">
            {/* Writing Goals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  {copy.writingGoals}
                </CardTitle>
                <CardDescription>{copy.writingGoalsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{copy.monthlyArticles}</span>
                    <span className="font-medium">{dashboardStats?.monthlyArticles || 0}/10</span>
                  </div>
                  <Progress value={(dashboardStats?.monthlyArticles || 0) * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{copy.wordsThisWeek}</span>
                    <span className="font-medium">{dashboardStats?.weeklyWords?.toLocaleString() || 0}/5000</span>
                  </div>
                  <Progress 
                    value={Math.min(((dashboardStats?.weeklyWords || 0) / 5000) * 100, 100)} 
                    className="h-2"
                  />
                </div>
                <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>{copy.streak}</span>
                    <span>{copy.days(dashboardStats?.writingStreak || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{copy.bestMonth}</span>
                    <span>{copy.articlesCount(dashboardStats?.bestMonth || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  {copy.recentActivity}
                </CardTitle>
                <CardDescription>{copy.recentWritingActivity}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : systemActivity.length > 0 ? (
                  <div className="space-y-3">
                    {systemActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="p-1 bg-green-100 rounded-full mt-0.5">
                          <Activity className="h-3 w-3 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-gray-600 text-xs">
                            {activity.description}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(activity.timestamp).toLocaleDateString(locale === "km" ? "km-KH" : undefined)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {copy.noRecentActivity}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // Unauthorized Dashboard Layout
  const renderUnauthorizedDashboard = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center py-20">
          <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">{copy.accessDenied}</h2>
          <p className="text-gray-600 dark:text-slate-400">{copy.accessDeniedDescription}</p>
          <p className="text-gray-500 dark:text-slate-500 text-sm mt-2">{copy.currentRole(userRole || copy.unknown)}</p>
        </div>
      </div>
    </div>
  );

  return renderRoleBasedDashboard();
};

export default AdminDashboard;
