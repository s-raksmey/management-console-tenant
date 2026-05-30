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
  Plus
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

interface UserListProps {}

export const UserList: React.FC<UserListProps> = () => {
  const { showSuccess, showError } = useToastHelpers();
  const { user: currentUser } = useAuth();
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

  const fetchUsers = useCallback(async (page = 1) => {
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
      setUsers(result.users);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    }
  }, [isSuperAdmin, listUsers, pageSize, roleFilter, searchTerm, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    let isCurrent = true;

    const loadUsers = async () => {
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
        setUsers(result.users);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
      }
    };

    void loadUsers();

    return () => {
      isCurrent = false;
    };
  }, [currentPage, isSuperAdmin, listUsers, pageSize, roleFilter, searchTerm, sortBy, sortOrder, statusFilter]);

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
    const result = await updateUserRole({ userId, role: newRole });
    if (result?.success) {
      showSuccess('Role Updated', result.message || `User role updated to ${newRole}.`);
      void fetchUsers(currentPage);
    } else {
      showError('Role Update Failed', result?.message || 'Failed to update user role.');
    }
  };

  const handleUpdateStatus = async (userId: string, isActive: boolean) => {
    const result = await updateUserStatus({ userId, isActive });
    if (result?.success) {
      showSuccess('User Updated', result.message || 'User status updated.');
      void fetchUsers(currentPage);
    } else {
      showError('Status Update Failed', result?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result?.success) {
      showSuccess('User Deleted', result.message || 'User deleted.');
      void fetchUsers(currentPage);
    } else {
      showError('Delete Failed', result?.message || 'Failed to delete user.');
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

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading users...</span>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Users</h2>
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">User Management</h1>
          <p className="text-gray-600 mt-1">
            {isSuperAdmin
              ? 'Manage platform super admins only.'
              : 'Manage this tenant’s admins, editors, and authors.'}
          </p>
        </div>
        <PermissionGuard permissions={[Permission.CREATE_USER]} fallback={null}>
          <Button asChild>
            <Link href="/users/new">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Link>
          </Button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
            <div className="min-w-0 lg:flex-1 lg:min-w-[220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {isSuperAdmin ? (
              <div className="flex h-10 items-center rounded-md border bg-slate-50 px-3 text-sm font-medium text-slate-700">
                Super Admins
              </div>
            ) : (
              <Select value={roleFilter} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Tenant Admin</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="AUTHOR">Author</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({totalCount})
          </CardTitle>
          <CardDescription>
            Showing {users.length} of {totalCount} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.isActive) as any} className="gap-1">
                      {user.isActive ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {canUpdateUser && (
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${user.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {!isSuperAdmin && canManageRoles && (
                          <>
                            <DropdownMenuItem 
                              onClick={() =>
                                requestConfirmation({
                                  title: 'Make Tenant Admin?',
                                  description: `${user.name || user.email} will receive tenant admin access.`,
                                  confirmText: 'Change Role',
                                  onConfirm: () => handleUpdateRole(user.id, 'ADMIN'),
                                })
                              }
                              disabled={user.role === 'ADMIN'}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Tenant Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestConfirmation({
                                  title: 'Make Editor?',
                                  description: `${user.name || user.email} will receive editor access.`,
                                  confirmText: 'Change Role',
                                  onConfirm: () => handleUpdateRole(user.id, 'EDITOR'),
                                })
                              }
                              disabled={user.role === 'EDITOR'}
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestConfirmation({
                                  title: 'Make Author?',
                                  description: `${user.name || user.email} will receive author access.`,
                                  confirmText: 'Change Role',
                                  onConfirm: () => handleUpdateRole(user.id, 'AUTHOR'),
                                })
                              }
                              disabled={user.role === 'AUTHOR'}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Make Author
                            </DropdownMenuItem>
                          </>
                        )}
                        {canUpdateUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() =>
                                requestConfirmation({
                                  title: user.isActive ? 'Deactivate User?' : 'Activate User?',
                                  description: `${user.name || user.email} will be ${user.isActive ? 'blocked from signing in' : 'allowed to sign in again'}.`,
                                  confirmText: user.isActive ? 'Deactivate' : 'Activate',
                                  variant: user.isActive ? 'destructive' : 'default',
                                  onConfirm: () => handleUpdateStatus(user.id, !user.isActive),
                                })
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
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
                                  title: 'Delete User?',
                                  description: `This will permanently delete ${user.name || user.email}. This action cannot be undone.`,
                                  confirmText: 'Delete User',
                                  variant: 'destructive',
                                  onConfirm: () => handleDeleteUser(user.id),
                                })
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
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
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasMore || loading}
                >
                  Next
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
