'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  FileText,
  Settings,
  Image,
  Folder,
  RefreshCw,
  Clock,
  MapPin,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/components/ui/toast';
import { PermissionGuard, Permission } from '@/components/permissions/PermissionGuard';
import { AuditService } from '@/services/audit.gql';
import type { AuditLog, AuditLogFilters } from '@/types/audit';
import { useAdminLocale } from '@/hooks/useAdminLocale';

const auditCopy = {
  en: {
    title: 'Audit Logs',
    description: 'Track all system activities and user actions',
    refresh: 'Refresh',
    exporting: 'Exporting...',
    exportCsv: 'Export CSV',
    loadFailedTitle: 'Audit Logs Failed',
    loadFailedDescription: 'Unable to load audit logs.',
    exportReadyTitle: 'Export Ready',
    exportReadyDescription: 'Audit logs CSV has been downloaded.',
    exportFailedTitle: 'Export Failed',
    exportFailedDescription: 'Unable to export audit logs.',
    totalLogs: 'Total Logs',
    today: 'Today',
    uniqueUsers: 'Unique Users',
    thisHour: 'This Hour',
    searchPlaceholder: 'Search by user, resource, or IP address...',
    allActions: 'All Actions',
    allResources: 'All Resources',
    actions: {
      USER_LOGIN: 'User Login',
      USER_LOGOUT: 'User Logout',
      USER_CREATED: 'User Created',
      USER_UPDATED: 'User Updated',
      USER_DELETED: 'User Deleted',
      USER_ROLE_CHANGED: 'User Role Changed',
      PASSWORD_CHANGED: 'Password Changed',
      ARTICLE_CREATED: 'Article Created',
      ARTICLE_UPDATED: 'Article Updated',
      ARTICLE_PUBLISHED: 'Article Published',
      ARTICLE_DELETED: 'Article Deleted',
      ARTICLE_FEATURED: 'Article Featured',
      ARTICLE_APPROVED: 'Article Approved',
      ARTICLE_REJECTED: 'Article Rejected',
      CATEGORY_CREATED: 'Category Created',
      CATEGORY_UPDATED: 'Category Updated',
      SETTING_UPDATED: 'Setting Updated',
      PERMISSION_DENIED: 'Permission Denied',
    },
    resources: {
      User: 'Users',
      Article: 'Articles',
      Category: 'Categories',
      Setting: 'Settings',
      USER: 'User',
      ARTICLE: 'Article',
      CATEGORY: 'Category',
      SETTINGS: 'Settings',
      MEDIA: 'Media',
    },
    table: {
      timestamp: 'Timestamp',
      user: 'User',
      action: 'Action',
      resource: 'Resource',
      ipAddress: 'IP Address',
      details: 'Details',
    },
    loading: 'Loading audit logs...',
    empty: 'No audit logs found',
    emptyDescription: 'Try adjusting your filters or search criteria',
    system: 'System',
    viewDetails: 'View Details',
    showing: (start: number, end: number, total: number) => `Showing ${start} to ${end} of ${total} results`,
    previous: 'Previous',
    next: 'Next',
  },
  km: {
    title: 'កំណត់ហេតុសវនកម្ម',
    description: 'តាមដានសកម្មភាពប្រព័ន្ធ និងសកម្មភាពអ្នកប្រើទាំងអស់',
    refresh: 'ធ្វើបច្ចុប្បន្នភាព',
    exporting: 'កំពុងនាំចេញ...',
    exportCsv: 'នាំចេញ CSV',
    loadFailedTitle: 'ផ្ទុកកំណត់ហេតុសវនកម្មមិនបាន',
    loadFailedDescription: 'មិនអាចផ្ទុកកំណត់ហេតុសវនកម្មបានទេ។',
    exportReadyTitle: 'ឯកសារនាំចេញរួចរាល់',
    exportReadyDescription: 'បានទាញយកឯកសារ CSV កំណត់ហេតុសវនកម្ម។',
    exportFailedTitle: 'នាំចេញមិនបានសម្រេច',
    exportFailedDescription: 'មិនអាចនាំចេញកំណត់ហេតុសវនកម្មបានទេ។',
    totalLogs: 'កំណត់ហេតុសរុប',
    today: 'ថ្ងៃនេះ',
    uniqueUsers: 'អ្នកប្រើមិនស្ទួន',
    thisHour: 'ម៉ោងនេះ',
    searchPlaceholder: 'ស្វែងរកតាមអ្នកប្រើ ធនធាន ឬ IP address...',
    allActions: 'សកម្មភាពទាំងអស់',
    allResources: 'ធនធានទាំងអស់',
    actions: {
      USER_LOGIN: 'អ្នកប្រើចូលប្រើ',
      USER_LOGOUT: 'អ្នកប្រើចេញ',
      USER_CREATED: 'បានបង្កើតអ្នកប្រើ',
      USER_UPDATED: 'បានកែប្រែអ្នកប្រើ',
      USER_DELETED: 'បានលុបអ្នកប្រើ',
      USER_ROLE_CHANGED: 'បានប្តូរតួនាទីអ្នកប្រើ',
      PASSWORD_CHANGED: 'បានប្តូរពាក្យសម្ងាត់',
      ARTICLE_CREATED: 'បានបង្កើតអត្ថបទ',
      ARTICLE_UPDATED: 'បានកែប្រែអត្ថបទ',
      ARTICLE_PUBLISHED: 'បានផ្សព្វផ្សាយអត្ថបទ',
      ARTICLE_DELETED: 'បានលុបអត្ថបទ',
      ARTICLE_FEATURED: 'បានដាក់អត្ថបទពិសេស',
      ARTICLE_APPROVED: 'បានអនុម័តអត្ថបទ',
      ARTICLE_REJECTED: 'បានបដិសេធអត្ថបទ',
      CATEGORY_CREATED: 'បានបង្កើតប្រភេទ',
      CATEGORY_UPDATED: 'បានកែប្រែប្រភេទ',
      SETTING_UPDATED: 'បានកែប្រែការកំណត់',
      PERMISSION_DENIED: 'បានបដិសេធសិទ្ធិ',
    },
    resources: {
      User: 'អ្នកប្រើ',
      Article: 'អត្ថបទ',
      Category: 'ប្រភេទ',
      Setting: 'ការកំណត់',
      USER: 'អ្នកប្រើ',
      ARTICLE: 'អត្ថបទ',
      CATEGORY: 'ប្រភេទ',
      SETTINGS: 'ការកំណត់',
      MEDIA: 'មេឌៀ',
    },
    table: {
      timestamp: 'ពេលវេលា',
      user: 'អ្នកប្រើ',
      action: 'សកម្មភាព',
      resource: 'ធនធាន',
      ipAddress: 'អាសយដ្ឋាន IP',
      details: 'ព័ត៌មានលម្អិត',
    },
    loading: 'កំពុងផ្ទុកកំណត់ហេតុសវនកម្ម...',
    empty: 'រកមិនឃើញកំណត់ហេតុសវនកម្ម',
    emptyDescription: 'សូមកែចម្រោះ ឬលក្ខខណ្ឌស្វែងរករបស់អ្នក',
    system: 'ប្រព័ន្ធ',
    viewDetails: 'មើលព័ត៌មានលម្អិត',
    showing: (start: number, end: number, total: number) => `បង្ហាញ ${start} ដល់ ${end} ក្នុងចំណោម ${total} លទ្ធផល`,
    previous: 'មុន',
    next: 'បន្ទាប់',
  },
} as const;

export default function AuditLogsPage() {
  const { locale } = useAdminLocale();
  const copy = auditCopy[locale];
  const { showSuccess, showError } = useToastHelpers();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const filters: AuditLogFilters = {};
      
      if (searchQuery) filters.search = searchQuery;
      if (selectedAction !== 'all') filters.action = selectedAction;
      if (selectedResourceType !== 'all') filters.resourceType = selectedResourceType;
      if (dateRange.start) filters.startDate = dateRange.start;
      if (dateRange.end) filters.endDate = dateRange.end;

      const result = await AuditService.listAuditLogs(
        (currentPage - 1) * pageSize,
        pageSize,
        filters
      );

      setLogs(result.logs);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showError(copy.loadFailedTitle, copy.loadFailedDescription);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, selectedAction, selectedResourceType]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const filters: AuditLogFilters = {};
      
      if (searchQuery) filters.search = searchQuery;
      if (selectedAction !== 'all') filters.action = selectedAction;
      if (selectedResourceType !== 'all') filters.resourceType = selectedResourceType;
      if (dateRange.start) filters.startDate = dateRange.start;
      if (dateRange.end) filters.endDate = dateRange.end;

      const blob = await AuditService.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(copy.exportReadyTitle, copy.exportReadyDescription);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      showError(copy.exportFailedTitle, copy.exportFailedDescription);
    } finally {
      setIsExporting(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800';
    if (action.includes('PUBLISHED')) return 'bg-purple-100 text-purple-800';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-gray-100 text-gray-800';
    if (action.includes('PERMISSION') || action.includes('UNAUTHORIZED')) return 'bg-orange-100 text-orange-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User className="h-4 w-4" />;
      case 'ARTICLE': return <FileText className="h-4 w-4" />;
      case 'CATEGORY': return <Folder className="h-4 w-4" />;
      case 'SETTINGS': return <Settings className="h-4 w-4" />;
      case 'MEDIA': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const numberLocale = locale === 'km' ? 'km-KH' : undefined;

  return (
    <PermissionGuard permissions={[Permission.VIEW_AUDIT_LOGS]} showError>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              {copy.title}
            </h1>
            <p className="mt-2 text-slate-600">
              {copy.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {copy.refresh}
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? copy.exporting : copy.exportCsv}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{copy.totalLogs}</p>
                <p className="text-2xl font-bold text-slate-900">{totalCount.toLocaleString(numberLocale)}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{copy.today}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {logs.filter(log => 
                    new Date(log.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{copy.uniqueUsers}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(logs.map(log => log.userId)).size}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{copy.thisHour}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {logs.filter(log => {
                    const logDate = new Date(log.createdAt);
                    const now = new Date();
                    return logDate.getHours() === now.getHours() &&
                           logDate.toDateString() === now.toDateString();
                  }).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={copy.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder={copy.allActions} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allActions}</SelectItem>
                {(Object.keys(copy.actions) as Array<keyof typeof copy.actions>).map((action) => (
                  <SelectItem key={action} value={action}>{copy.actions[action]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger>
                <SelectValue placeholder={copy.allResources} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allResources}</SelectItem>
                <SelectItem value="User">{copy.resources.User}</SelectItem>
                <SelectItem value="Article">{copy.resources.Article}</SelectItem>
                <SelectItem value="Category">{copy.resources.Category}</SelectItem>
                <SelectItem value="Setting">{copy.resources.Setting}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.timestamp}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.user}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.action}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.resource}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.ipAddress}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    {copy.table.details}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>{copy.loading}</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">{copy.empty}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {copy.emptyDescription}
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-900">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{log.userEmail || copy.system}</p>
                            <p className="text-xs text-slate-500">{log.userId || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {copy.actions[log.action as keyof typeof copy.actions] ?? log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getResourceIcon(log.resourceType || '')}
                          <div>
                            {log.resourceType ? (
                              <>
                                <p className="text-sm font-medium text-slate-900">
                                  {log.resourceName || (log.resourceId ? `[ID: ${log.resourceId.substring(0, 8)}]` : '-')}
                                </p>
                                <p className="text-xs text-slate-500">{copy.resources[log.resourceType as keyof typeof copy.resources] ?? log.resourceType}</p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">-</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          {log.ipAddress ? (
                            <span className="font-mono text-slate-700">{log.ipAddress}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-slate-400" />
                            <details className="cursor-pointer">
                              <summary className="text-sm text-blue-600 hover:text-blue-700">
                                {copy.viewDetails}
                              </summary>
                              <div className="mt-2 bg-slate-50 rounded p-2 text-xs font-mono text-slate-700 max-w-xs overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {copy.showing(((currentPage - 1) * pageSize) + 1, Math.min(currentPage * pageSize, totalCount), totalCount)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {copy.previous}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {copy.next}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
}
