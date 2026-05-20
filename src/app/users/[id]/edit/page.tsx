'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Permission, PermissionGuard } from '@/components/permissions/PermissionGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/components/ui/toast';
import { User, useUserManagement } from '@/hooks/useUserManagement';
import { usePermissions } from '@/hooks/usePermissions';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToastHelpers();
  const {
    getUserById,
    updateUserProfile,
    updateUserRole,
    updateUserStatus,
    loading,
    error,
  } = useUserManagement();

  const [user, setUser] = React.useState<User | null>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('AUTHOR');
  const [status, setStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSaving, setIsSaving] = React.useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const roleOptions: Array<{ value: UserRole; label: string }> = isSuperAdmin
    ? [{ value: 'SUPER_ADMIN', label: 'Super Admin' }]
    : [
        { value: 'ADMIN', label: 'Tenant Admin' },
        { value: 'EDITOR', label: 'Editor' },
        { value: 'AUTHOR', label: 'Author' },
      ];

  React.useEffect(() => {
    let isCurrent = true;

    const loadUser = async () => {
      const result = await getUserById(params.id);
      if (!result || !isCurrent) return;

      setUser(result);
      setName(result.name);
      setEmail(result.email);
      setRole(result.role);
      setStatus(result.isActive ? 'ACTIVE' : 'INACTIVE');
    };

    void loadUser();

    return () => {
      isCurrent = false;
    };
  }, [getUserById, params.id]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const profileResult = await updateUserProfile({
        userId: user.id,
        name: name.trim(),
        email: email.trim(),
      });

      if (!profileResult?.success) {
        showError('Update Failed', profileResult?.message || 'Failed to update user profile.');
        return;
      }

      if (canManageRoles && role !== user.role) {
        const roleResult = await updateUserRole({ userId: user.id, role });
        if (!roleResult?.success) {
          showError('Role Update Failed', roleResult?.message || 'Failed to update user role.');
          return;
        }
      }

      const nextIsActive = status === 'ACTIVE';
      if (nextIsActive !== user.isActive) {
        const statusResult = await updateUserStatus({
          userId: user.id,
          isActive: nextIsActive,
        });

        if (!statusResult?.success) {
          showError('Status Update Failed', statusResult?.message || 'Failed to update user status.');
          return;
        }
      }

      showSuccess('User Updated', 'User details were saved successfully.');
      router.push('/users');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading user...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <PermissionGuard permissions={[Permission.UPDATE_USER]} showError>
        <div className="mx-auto max-w-2xl space-y-4">
          <Button asChild variant="ghost" className="px-0">
            <Link href="/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold text-slate-950">User not found</h1>
              <p className="mt-2 text-slate-600">
                {error || 'This user could not be loaded.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permissions={[Permission.UPDATE_USER]} showError>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl">Edit User</CardTitle>
                <CardDescription>
                  Update account details, role, and access status.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                {user.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                  disabled={!canManageRoles}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSuperAdmin && (
                  <p className="text-xs text-slate-500">
                    Platform user management only edits super admin accounts.
                  </p>
                )}
                {!canManageRoles && (
                  <p className="text-xs text-slate-500">
                    You can edit profile details, but role changes require role management permission.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'ACTIVE' | 'INACTIVE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-5">
              <Button asChild variant="outline">
                <Link href="/users">Cancel</Link>
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim() || !email.trim()}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save User
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-950">Account created</p>
                <p className="text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
              {status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
