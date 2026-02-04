// src/components/dashboard/AuthorDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp, 
  Eye,
  Edit,
  Calendar,
  Target,
  Award,
  BookOpen,
  PlusCircle,
  RefreshCw,
  BarChart3,
  Zap,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useAuthorStats } from '@/hooks/useAuthorStats';
import { 
  StatCard, 
  MetricCard, 
  ActivityFeed, 
  StatCardSkeleton, 
  MetricCardSkeleton,
  ActivityFeedSkeleton,
  type ActivityItem 
} from './shared';

export const AuthorDashboard: React.FC = () => {
  const {
    loading,
    error,
    getAuthorStats,
    getAuthorArticles,
    getAuthorInsights,
    getWritingGoals
  } = useAuthorStats();

  const [stats, setStats] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      const [statsData, articlesData, insightsData, goalsData] = await Promise.all([
        getAuthorStats(),
        getAuthorArticles(10),
        getAuthorInsights(),
        getWritingGoals()
      ]);

      setStats(statsData);
      setArticles(articlesData);
      setInsights(insightsData);
      setGoals(goalsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ARCHIVED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'REVIEW': return <Clock className="h-4 w-4" />;
      case 'DRAFT': return <Edit className="h-4 w-4" />;
      case 'ARCHIVED': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Transform recent articles to activity items
  const recentActivity: ActivityItem[] = articles.slice(0, 5).map(article => ({
    id: article.id,
    type: article.status === 'PUBLISHED' ? 'publish' : 
          article.status === 'REVIEW' ? 'update' : 'create',
    title: article.title,
    description: `${article.status.toLowerCase()} • ${article.category.name}`,
    timestamp: article.updatedAt,
    metadata: {
      category: article.category.name,
      status: article.status
    }
  }));

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Author Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Your writing journey and content analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            className="border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/articles/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Articles"
              value={stats.totalArticles}
              icon={FileText}
              gradient="from-blue-500 to-blue-600"
              change={{
                value: 15,
                type: 'increase',
                period: 'vs last month'
              }}
            />
            <StatCard
              title="Published"
              value={stats.publishedArticles}
              icon={CheckCircle}
              gradient="from-green-500 to-emerald-500"
              change={{
                value: stats.approvalRate,
                type: 'increase',
                period: 'approval rate'
              }}
            />
            <StatCard
              title="Total Views"
              value={stats.totalViews.toLocaleString()}
              icon={Eye}
              gradient="from-purple-500 to-pink-500"
              change={{
                value: 23,
                type: 'increase',
                period: 'vs last month'
              }}
            />
            <StatCard
              title="In Review"
              value={stats.inReviewArticles}
              icon={Clock}
              gradient="from-yellow-500 to-orange-500"
              change={{
                value: stats.inReviewArticles > 0 ? 100 : 0,
                type: stats.inReviewArticles > 0 ? 'neutral' : 'decrease',
                period: 'pending'
              }}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                    Recent Articles
                  </CardTitle>
                  <CardDescription>Your latest content and submissions</CardDescription>
                </div>
                <Link href="/articles">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No articles yet</p>
                  <p className="text-sm mb-4">Start writing your first article!</p>
                  <Link href="/articles/new">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Article
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div key={article.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{article.title}</h3>
                            <Badge className={getStatusColor(article.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(article.status)}
                                <span>{article.status}</span>
                              </div>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {article.category.name}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatTimeAgo(article.updatedAt)}
                            </span>
                            {article.views && (
                              <span className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                {article.views.toLocaleString()} views
                              </span>
                            )}
                          </div>
                          
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/articles/${article.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Writing Goals */}
          {loading || !stats ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Monthly Goal"
              description="Articles this month"
              value={stats.monthlyProgress}
              target={stats.monthlyGoal}
              icon={Target}
              color="purple"
              showProgress={true}
            >
              <div className="mt-3 text-xs text-gray-500">
                {stats.monthlyGoal - stats.monthlyProgress} more to reach your goal
              </div>
            </MetricCard>
          )}

          {/* Performance Metrics */}
          {loading || !stats ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Approval Rate"
              description="Articles approved vs submitted"
              value={stats.approvalRate}
              maxValue={100}
              unit="%"
              icon={Award}
              color="green"
              showProgress={true}
            />
          )}

          {/* Average Views */}
          {loading || !stats ? (
            <MetricCardSkeleton />
          ) : (
            <MetricCard
              title="Avg Views"
              description="Per published article"
              value={stats.avgViewsPerArticle}
              icon={TrendingUp}
              color="blue"
              showProgress={false}
            />
          )}

          {/* Recent Activity */}
          {loading ? (
            <ActivityFeedSkeleton />
          ) : (
            <ActivityFeed
              title="Recent Activity"
              activities={recentActivity}
              maxItems={5}
              showViewAll={true}
              onViewAll={() => {}}
            />
          )}
        </div>
      </div>

      {/* Insights and Analytics */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Articles */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Top Performing Articles
              </CardTitle>
              <CardDescription>Your most viewed published content</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.topPerformingArticles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No published articles yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.topPerformingArticles.map((article: any, index: number) => (
                    <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{article.title}</p>
                          <p className="text-xs text-gray-500">{article.category.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{article.views?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Writing Statistics */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                Writing Statistics
              </CardTitle>
              <CardDescription>Your content creation insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This Week Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{insights.recentActivity.articlesThisWeek}</p>
                    <p className="text-xs text-gray-600">Articles This Week</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{insights.recentActivity.viewsThisWeek.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Views This Week</p>
                  </div>
                </div>

                {/* Category Distribution */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Content by Category</h4>
                  <div className="space-y-2">
                    {insights.categoryDistribution.slice(0, 3).map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{cat.category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{cat.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Writing Streak */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Writing Streak</p>
                      <p className="text-lg font-bold text-purple-600">{insights.writingStreak.current} days</p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Best: {insights.writingStreak.longest} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuthorDashboard;
