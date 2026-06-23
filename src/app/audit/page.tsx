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

export default function AuditLogsPage() {
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
      showError('Audit Logs Failed', 'Unable to load audit logs.');
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
      showSuccess('Export Ready', 'Audit logs CSV has been downloaded.');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      showError('Export Failed', 'Unable to export audit logs.');
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
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <PermissionGuard permissions={[Permission.VIEW_AUDIT_LOGS]} showError>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Audit Logs
            </h1>
            <p className="mt-2 text-slate-600">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Logs</p>
                <p className="text-2xl font-bold text-slate-900">{totalCount.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Today</p>
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
                <p className="text-sm font-medium text-slate-600">Unique Users</p>
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
                <p className="text-sm font-medium text-slate-600">This Hour</p>
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
                  placeholder="Search by user, resource, or IP address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_LOGIN">User Login</SelectItem>
                <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                <SelectItem value="USER_CREATED">User Created</SelectItem>
                <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                <SelectItem value="USER_DELETED">User Deleted</SelectItem>
                <SelectItem value="USER_ROLE_CHANGED">User Role Changed</SelectItem>
                <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                <SelectItem value="ARTICLE_CREATED">Article Created</SelectItem>
                <SelectItem value="ARTICLE_UPDATED">Article Updated</SelectItem>
                <SelectItem value="ARTICLE_PUBLISHED">Article Published</SelectItem>
                <SelectItem value="ARTICLE_DELETED">Article Deleted</SelectItem>
                <SelectItem value="ARTICLE_FEATURED">Article Featured</SelectItem>
                <SelectItem value="ARTICLE_APPROVED">Article Approved</SelectItem>
                <SelectItem value="ARTICLE_REJECTED">Article Rejected</SelectItem>
                <SelectItem value="CATEGORY_CREATED">Category Created</SelectItem>
                <SelectItem value="CATEGORY_UPDATED">Category Updated</SelectItem>
                <SelectItem value="SETTING_UPDATED">Setting Updated</SelectItem>
                <SelectItem value="PERMISSION_DENIED">Permission Denied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="User">Users</SelectItem>
                <SelectItem value="Article">Articles</SelectItem>
                <SelectItem value="Category">Categories</SelectItem>
                <SelectItem value="Setting">Settings</SelectItem>
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
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Loading audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">No audit logs found</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Try adjusting your filters or search criteria
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
                            <p className="text-sm font-medium text-slate-900">{log.userEmail || 'System'}</p>
                            <p className="text-xs text-slate-500">{log.userId || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action.replace(/_/g, ' ')}
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
                                <p className="text-xs text-slate-500">{log.resourceType}</p>
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
                                View Details
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
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
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
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
}
