// src/components/users/UserList.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  UserX,
  Loader2,
  AlertTriangle,
  Plus,
  KeyRound,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserManagement, User, ListUsersInput } from '@/hooks/useUserManagement';
import { useToastHelpers } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, PermissionGuard } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { UserService } from '@/services/user.gql';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface UserListProps {}

const userListCopy = {
  en: {
    loadingUsers: 'Loading users...',
    errorTitle: 'Error Loading Users',
    title: 'User Management',
    superAdminDescription: 'Manage platform super admins only.',
    tenantDescription: 'Manage this tenant’s admins, editors, and authors.',
    createUser: 'Create User',
    filter: 'Filter',
    searchPlaceholder: 'Search name or email',
    superAdmins: 'Super admins',
    allRoles: 'All roles',
    tenantAdmins: 'Tenant admins',
    tenantAdmin: 'Tenant admin',
    editor: 'Editor',
    author: 'Author',
    allStatus: 'All status',
    active: 'Active',
    inactive: 'Inactive',
    clear: 'Clear',
    users: 'Users',
    showingUsers: (shown: number, total: number) => `Showing ${shown} of ${total} users`,
    name: 'Name',
    email: 'Email',
    role: 'Role',
    status: 'Status',
    created: 'Created',
    actions: 'Actions',
    pageCount: (page: number, total: number) => `Page ${page} of ${total}`,
    previous: 'Previous',
    next: 'Next',
    editUser: 'Edit User',
    makeTenantAdmin: 'Make Tenant Admin',
    makeEditor: 'Make Editor',
    makeAuthor: 'Make Author',
    showQrAgain: 'Show QR Again',
    deactivate: 'Deactivate',
    activate: 'Activate',
    deleteUser: 'Delete User',
    confirm: 'Confirm',
    changeRole: 'Change Role',
    resetTwoFactor: 'Reset Two-Factor',
    roleUpdateBlockedTitle: 'Role Update Blocked',
    roleUpdateBlockedDescription: 'Tenant users cannot be promoted to super admin.',
    roleUpdatedTitle: 'Role Updated',
    roleUpdatedDescription: (role: string) => `User role updated to ${role}.`,
    roleUpdateFailedTitle: 'Role Update Failed',
    roleUpdateFailedDescription: 'Failed to update user role.',
    userUpdatedTitle: 'User Updated',
    userStatusUpdatedDescription: 'User status updated.',
    statusUpdateFailedTitle: 'Status Update Failed',
    statusUpdateFailedDescription: 'Failed to update user status.',
    userDeletedTitle: 'User Deleted',
    userDeletedDescription: 'User deleted.',
    deleteFailedTitle: 'Delete Failed',
    deleteFailedDescription: 'Failed to delete user.',
    twoFactorResetTitle: 'Two-Factor Reset',
    twoFactorResetDescription: 'Two-factor setup was reset.',
    twoFactorResetFailedTitle: 'Two-Factor Reset Failed',
    twoFactorResetFailedDescription: 'Failed to reset two-factor setup.',
    makeTenantAdminTitle: 'Make Tenant Admin?',
    makeEditorTitle: 'Make Editor?',
    makeAuthorTitle: 'Make Author?',
    roleConfirmDescription: (name: string, role: string) => `${name} will receive ${role} access.`,
    showQrAgainTitle: 'Show QR Again?',
    showQrAgainDescription: (name: string) =>
      `${name} will need to scan a new two-factor QR code on next login.`,
    deactivateTitle: 'Deactivate User?',
    activateTitle: 'Activate User?',
    statusConfirmDescription: (name: string, isActive: boolean) =>
      `${name} will be ${isActive ? 'blocked from signing in' : 'allowed to sign in again'}.`,
    deleteUserTitle: 'Delete User?',
    deleteUserDescription: (name: string) =>
      `This will permanently delete ${name}. This action cannot be undone.`,
    roleLabel: {
      SUPER_ADMIN: 'Super admin',
      ADMIN: 'Tenant admin',
      EDITOR: 'Editor',
      AUTHOR: 'Author',
    },
  },
  km: {
    loadingUsers: 'កំពុងផ្ទុកអ្នកប្រើ...',
    errorTitle: 'មានបញ្ហាក្នុងការផ្ទុកអ្នកប្រើ',
    title: 'គ្រប់គ្រងអ្នកប្រើ',
    superAdminDescription: 'គ្រប់គ្រងអ្នកគ្រប់គ្រងកំពូលរបស់វេទិកាប៉ុណ្ណោះ។',
    tenantDescription: 'គ្រប់គ្រងអ្នកគ្រប់គ្រង អ្នកកែសម្រួល និងអ្នកនិពន្ធរបស់គេហទំព័រនេះ។',
    createUser: 'បង្កើតអ្នកប្រើ',
    filter: 'តម្រង',
    searchPlaceholder: 'ស្វែងរកឈ្មោះ ឬអ៊ីមែល',
    superAdmins: 'អ្នកគ្រប់គ្រងកំពូល',
    allRoles: 'តួនាទីទាំងអស់',
    tenantAdmins: 'អ្នកគ្រប់គ្រងគេហទំព័រ',
    tenantAdmin: 'អ្នកគ្រប់គ្រងគេហទំព័រ',
    editor: 'អ្នកកែសម្រួល',
    author: 'អ្នកនិពន្ធ',
    allStatus: 'ស្ថានភាពទាំងអស់',
    active: 'សកម្ម',
    inactive: 'អសកម្ម',
    clear: 'សម្អាត',
    users: 'អ្នកប្រើ',
    showingUsers: (shown: number, total: number) => `បង្ហាញ ${shown} ក្នុងចំណោម ${total} អ្នកប្រើ`,
    name: 'ឈ្មោះ',
    email: 'អ៊ីមែល',
    role: 'តួនាទី',
    status: 'ស្ថានភាព',
    created: 'បានបង្កើត',
    actions: 'សកម្មភាព',
    pageCount: (page: number, total: number) => `ទំព័រ ${page} នៃ ${total}`,
    previous: 'មុន',
    next: 'បន្ទាប់',
    editUser: 'កែអ្នកប្រើ',
    makeTenantAdmin: 'កំណត់ជាអ្នកគ្រប់គ្រងគេហទំព័រ',
    makeEditor: 'កំណត់ជាអ្នកកែសម្រួល',
    makeAuthor: 'កំណត់ជាអ្នកនិពន្ធ',
    showQrAgain: 'បង្ហាញ QR ម្តងទៀត',
    deactivate: 'បិទ',
    activate: 'បើក',
    deleteUser: 'លុបអ្នកប្រើ',
    confirm: 'បញ្ជាក់',
    changeRole: 'ប្តូរតួនាទី',
    resetTwoFactor: 'កំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញ',
    roleUpdateBlockedTitle: 'បានរារាំងការប្តូរតួនាទី',
    roleUpdateBlockedDescription: 'អ្នកប្រើគេហទំព័រមិនអាចត្រូវបានដំឡើងជាអ្នកគ្រប់គ្រងកំពូលបានទេ។',
    roleUpdatedTitle: 'បានប្តូរតួនាទី',
    roleUpdatedDescription: (role: string) => `បានប្តូរតួនាទីអ្នកប្រើទៅជា ${role}។`,
    roleUpdateFailedTitle: 'ប្តូរតួនាទីមិនបាន',
    roleUpdateFailedDescription: 'មិនអាចប្តូរតួនាទីអ្នកប្រើបានទេ។',
    userUpdatedTitle: 'បានកែប្រែអ្នកប្រើ',
    userStatusUpdatedDescription: 'បានកែប្រែស្ថានភាពអ្នកប្រើ។',
    statusUpdateFailedTitle: 'កែប្រែស្ថានភាពមិនបាន',
    statusUpdateFailedDescription: 'មិនអាចកែប្រែស្ថានភាពអ្នកប្រើបានទេ។',
    userDeletedTitle: 'បានលុបអ្នកប្រើ',
    userDeletedDescription: 'បានលុបអ្នកប្រើ។',
    deleteFailedTitle: 'លុបមិនបាន',
    deleteFailedDescription: 'មិនអាចលុបអ្នកប្រើបានទេ។',
    twoFactorResetTitle: 'បានកំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញ',
    twoFactorResetDescription: 'បានកំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញ។',
    twoFactorResetFailedTitle: 'កំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញមិនបាន',
    twoFactorResetFailedDescription: 'មិនអាចកំណត់ការផ្ទៀងផ្ទាត់ពីរជំហានឡើងវិញបានទេ។',
    makeTenantAdminTitle: 'កំណត់ជាអ្នកគ្រប់គ្រងគេហទំព័រ?',
    makeEditorTitle: 'កំណត់ជាអ្នកកែសម្រួល?',
    makeAuthorTitle: 'កំណត់ជាអ្នកនិពន្ធ?',
    roleConfirmDescription: (name: string, role: string) => `${name} នឹងទទួលសិទ្ធិជា ${role}។`,
    showQrAgainTitle: 'បង្ហាញ QR ម្តងទៀត?',
    showQrAgainDescription: (name: string) =>
      `${name} ត្រូវស្កេន Two-Factor QR code ថ្មីនៅពេលចូលលើកក្រោយ។`,
    deactivateTitle: 'បិទអ្នកប្រើ?',
    activateTitle: 'បើកអ្នកប្រើ?',
    statusConfirmDescription: (name: string, isActive: boolean) =>
      `${name} នឹងត្រូវបាន${isActive ? 'រារាំងមិនឱ្យចូល' : 'អនុញ្ញាតឱ្យចូលវិញ'}។`,
    deleteUserTitle: 'លុបអ្នកប្រើ?',
    deleteUserDescription: (name: string) =>
      `វានឹងលុប ${name} ជាអចិន្ត្រៃយ៍។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    roleLabel: {
      SUPER_ADMIN: 'Super admin',
      ADMIN: 'អ្នកគ្រប់គ្រងគេហទំព័រ',
      EDITOR: 'អ្នកកែសម្រួល',
      AUTHOR: 'អ្នកនិពន្ធ',
    },
  },
};

export const UserList: React.FC<UserListProps> = () => {
  const { showSuccess, showError } = useToastHelpers();
  const { locale } = useAdminLocale();
  const copy = userListCopy[locale];
  const {
    user: currentUser,
    isAuthenticated,
    isInitializing,
  } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const canUpdateUser = hasPermission(Permission.UPDATE_USER);
  const canDeleteUser = hasPermission(Permission.DELETE_USER);
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const { 
    listUsers, 
    updateUserRole, 
    updateUserStatus, 
    deleteUser, 
    loading, 
    error 
  } = useUserManagement();

  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [savingTwoFactorUserId, setSavingTwoFactorUserId] = useState<string | null>(null);
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

  const applyVisibleUserScope = useCallback(
    (items: User[]) =>
      isSuperAdmin ? items : items.filter((user) => user.role !== 'SUPER_ADMIN'),
    [isSuperAdmin],
  );

  const fetchUsers = useCallback(async (page = 1) => {
    if (!isAuthenticated || isInitializing) return;

    const input: ListUsersInput = {
      take: pageSize,
      skip: (page - 1) * pageSize,
      search: searchTerm || undefined,
      role: isSuperAdmin ? 'SUPER_ADMIN' : roleFilter === 'ALL' ? undefined : roleFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      sortBy,
      sortOrder,
    };

    const result = await listUsers(input);
    if (result) {
      const visibleUsers = applyVisibleUserScope(result.users);
      setUsers(visibleUsers);
      setTotalCount(isSuperAdmin ? result.totalCount : visibleUsers.length);
      setHasMore(result.hasMore);
    }
  }, [applyVisibleUserScope, isAuthenticated, isInitializing, isSuperAdmin, listUsers, pageSize, roleFilter, searchTerm, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    let isCurrent = true;

    const loadUsers = async () => {
      if (!isAuthenticated || isInitializing) {
        if (isCurrent) {
          setUsers([]);
          setTotalCount(0);
          setHasMore(false);
        }
        return;
      }

      const input: ListUsersInput = {
        take: pageSize,
        skip: (currentPage - 1) * pageSize,
        search: searchTerm || undefined,
        role: isSuperAdmin ? 'SUPER_ADMIN' : roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sortBy,
        sortOrder,
      };

      const result = await listUsers(input);
      if (result && isCurrent) {
        const visibleUsers = applyVisibleUserScope(result.users);
        setUsers(visibleUsers);
        setTotalCount(isSuperAdmin ? result.totalCount : visibleUsers.length);
        setHasMore(result.hasMore);
      }
    };

    void loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [applyVisibleUserScope, currentPage, isAuthenticated, isInitializing, isSuperAdmin, listUsers, pageSize, roleFilter, searchTerm, sortBy, sortOrder, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value as 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'ALL');
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as 'ACTIVE' | 'INACTIVE' | 'ALL');
    setCurrentPage(1);
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR',
  ) => {
    if (!isSuperAdmin && newRole === 'SUPER_ADMIN') {
      showError(copy.roleUpdateBlockedTitle, copy.roleUpdateBlockedDescription);
      return;
    }

    const result = await updateUserRole({ userId, role: newRole });
    if (result?.success) {
      showSuccess(
        copy.roleUpdatedTitle,
        locale === 'en' && result.message ? result.message : copy.roleUpdatedDescription(copy.roleLabel[newRole]),
      );
      void fetchUsers(currentPage);
    } else {
      showError(
        copy.roleUpdateFailedTitle,
        locale === 'en' && result?.message ? result.message : copy.roleUpdateFailedDescription,
      );
    }
  };

  const handleUpdateStatus = async (userId: string, isActive: boolean) => {
    const result = await updateUserStatus({ userId, isActive });
    if (result?.success) {
      showSuccess(
        copy.userUpdatedTitle,
        locale === 'en' && result.message ? result.message : copy.userStatusUpdatedDescription,
      );
      void fetchUsers(currentPage);
    } else {
      showError(
        copy.statusUpdateFailedTitle,
        locale === 'en' && result?.message ? result.message : copy.statusUpdateFailedDescription,
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result?.success) {
      showSuccess(
        copy.userDeletedTitle,
        locale === 'en' && result.message ? result.message : copy.userDeletedDescription,
      );
      void fetchUsers(currentPage);
    } else {
      showError(
        copy.deleteFailedTitle,
        locale === 'en' && result?.message ? result.message : copy.deleteFailedDescription,
      );
    }
  };

  const handleResetTwoFactor = async (targetUser: User) => {
    setSavingTwoFactorUserId(targetUser.id);
    try {
      const result = await UserService.resetUserTwoFactor(targetUser.id);
      if (result.success) {
        showSuccess(
          copy.twoFactorResetTitle,
          locale === 'en' && result.message ? result.message : copy.twoFactorResetDescription,
        );
        void fetchUsers(currentPage);
      } else {
        showError(
          copy.twoFactorResetFailedTitle,
          locale === 'en' && result.message ? result.message : copy.twoFactorResetFailedDescription,
        );
      }
    } catch (error: any) {
      showError(
        copy.twoFactorResetFailedTitle,
        locale === 'en'
          ? error?.response?.errors?.[0]?.message || copy.twoFactorResetFailedDescription
          : copy.twoFactorResetFailedDescription,
      );
    } finally {
      setSavingTwoFactorUserId(null);
    }
  };

  const requestConfirmation = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmation({ open: true, ...input });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <ShieldCheck className="h-4 w-4" />;
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'EDITOR': return <ShieldCheck className="h-4 w-4" />;
      case 'AUTHOR': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'outline';
      case 'ADMIN': return 'destructive';
      case 'EDITOR': return 'default';
      case 'AUTHOR': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters = Boolean(searchTerm) || statusFilter !== 'ALL' || (!isSuperAdmin && roleFilter !== 'ALL');
  const roleScopeLabel = isSuperAdmin
    ? copy.superAdmins
    : roleFilter === 'ALL'
      ? copy.allRoles
      : roleFilter === 'ADMIN'
        ? copy.tenantAdmins
        : roleFilter === 'EDITOR'
          ? copy.editor
          : copy.author;

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };
  const getUserDisplayName = (user: User) => user.name || user.email;
  const getRoleLabel = (role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR') => copy.roleLabel[role];

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">{copy.loadingUsers}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{copy.errorTitle}</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{copy.title}</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? copy.superAdminDescription
              : copy.tenantDescription}
          </p>
        </div>
        <PermissionGuard permissions={[Permission.CREATE_USER]} fallback={null}>
          <Button asChild>
            <Link href="/users/new">
              <Plus className="h-4 w-4 mr-2" />
              {copy.createUser}
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{copy.filter}</span>
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={copy.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 border-slate-200 bg-slate-50 pl-9 text-sm shadow-none dark:border-slate-800 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {isSuperAdmin ? (
              <div className="flex h-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                {roleScopeLabel}
              </div>
            ) : (
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950 sm:w-[150px]">
                  <SelectValue placeholder={copy.allRoles} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{copy.allRoles}</SelectItem>
                  <SelectItem value="ADMIN">{copy.tenantAdmin}</SelectItem>
                  <SelectItem value="EDITOR">{copy.editor}</SelectItem>
                  <SelectItem value="AUTHOR">{copy.author}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="h-9 w-full border-slate-200 bg-slate-50 shadow-none dark:border-slate-800 dark:bg-slate-950 sm:w-[140px]">
                <SelectValue placeholder={copy.allStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{copy.allStatus}</SelectItem>
                <SelectItem value="ACTIVE">{copy.active}</SelectItem>
                <SelectItem value="INACTIVE">{copy.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <X className="mr-1.5 h-4 w-4" />
              {copy.clear}
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {copy.users} ({totalCount})
          </CardTitle>
          <CardDescription>
            {copy.showingUsers(users.length, totalCount)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>{copy.name}</TableHead>
                <TableHead>{copy.email}</TableHead>
                <TableHead>{copy.role}</TableHead>
                <TableHead>{copy.status}</TableHead>
                <TableHead>{copy.created}</TableHead>
                <TableHead className="text-right">{copy.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role) as any} className="gap-1">
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.isActive) as any} className="gap-1">
                      {user.isActive ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {user.isActive ? copy.active : copy.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString(locale === 'km' ? 'km-KH' : undefined)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{copy.actions}</DropdownMenuLabel>
                        {canUpdateUser && (
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              {copy.editUser}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {!isSuperAdmin && canManageRoles && (
                          <>
                            <DropdownMenuItem 
                              onClick={() =>
                                requestConfirmation({
                                  title: copy.makeTenantAdminTitle,
                                  description: copy.roleConfirmDescription(getUserDisplayName(user), copy.tenantAdmin),
                                  confirmText: copy.changeRole,
                                  onConfirm: () => handleUpdateRole(user.id, 'ADMIN'),
                                })
                              }
                              disabled={user.role === 'ADMIN'}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {copy.makeTenantAdmin}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestConfirmation({
                                  title: copy.makeEditorTitle,
                                  description: copy.roleConfirmDescription(getUserDisplayName(user), copy.editor),
                                  confirmText: copy.changeRole,
                                  onConfirm: () => handleUpdateRole(user.id, 'EDITOR'),
                                })
                              }
                              disabled={user.role === 'EDITOR'}
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              {copy.makeEditor}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestConfirmation({
                                  title: copy.makeAuthorTitle,
                                  description: copy.roleConfirmDescription(getUserDisplayName(user), copy.author),
                                  confirmText: copy.changeRole,
                                  onConfirm: () => handleUpdateRole(user.id, 'AUTHOR'),
                                })
                              }
                              disabled={user.role === 'AUTHOR'}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {copy.makeAuthor}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canUpdateUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                requestConfirmation({
                                  title: copy.showQrAgainTitle,
                                  description: copy.showQrAgainDescription(getUserDisplayName(user)),
                                  confirmText: copy.resetTwoFactor,
                                  onConfirm: () => handleResetTwoFactor(user),
                                })
                              }
                              disabled={savingTwoFactorUserId === user.id}
                            >
                              {savingTwoFactorUserId === user.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <KeyRound className="h-4 w-4 mr-2" />
                              )}
                              {copy.showQrAgain}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() =>
                                requestConfirmation({
                                  title: user.isActive ? copy.deactivateTitle : copy.activateTitle,
                                  description: copy.statusConfirmDescription(getUserDisplayName(user), user.isActive),
                                  confirmText: user.isActive ? copy.deactivate : copy.activate,
                                  variant: user.isActive ? 'destructive' : 'default',
                                  onConfirm: () => handleUpdateStatus(user.id, !user.isActive),
                                })
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  {copy.deactivate}
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  {copy.activate}
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDeleteUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() =>
                                requestConfirmation({
                                  title: copy.deleteUserTitle,
                                  description: copy.deleteUserDescription(getUserDisplayName(user)),
                                  confirmText: copy.deleteUser,
                                  variant: 'destructive',
                                  onConfirm: () => handleDeleteUser(user.id),
                                })
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {copy.deleteUser}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                {copy.pageCount(currentPage, totalPages)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  {copy.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasMore || loading}
                >
                  {copy.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
