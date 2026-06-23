'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Loader2, Save, ShieldCheck, UserCheck } from 'lucide-react';
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { UserService } from '@/services/user.gql';
import { useAdminLocale } from '@/hooks/useAdminLocale';

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'AUTHOR';

const editUserCopy = {
  en: {
    superAdmin: 'Super Admin',
    tenantAdmin: 'Tenant Admin',
    editor: 'Editor',
    author: 'Author',
    roleUpdateBlockedTitle: 'Role Update Blocked',
    roleUpdateBlockedDescription: 'Tenant users cannot be promoted to super admin.',
    updateFailedTitle: 'Update Failed',
    updateProfileFailed: 'Failed to update user profile.',
    roleUpdateFailedTitle: 'Role Update Failed',
    roleUpdateFailedDescription: 'Failed to update user role.',
    statusUpdateFailedTitle: 'Status Update Failed',
    statusUpdateFailedDescription: 'Failed to update user status.',
    userUpdatedTitle: 'User Updated',
    userUpdatedDescription: 'User details were saved successfully.',
    twoFactorResetFailedTitle: 'Two-Factor Reset Failed',
    twoFactorResetFailedDescription: 'Failed to reset two-factor setup.',
    twoFactorResetTitle: 'Two-Factor Reset',
    twoFactorResetDescription: 'Two-factor setup was reset.',
    loadingUser: 'Loading user...',
    backToUsers: 'Back to Users',
    userNotFound: 'User not found',
    userLoadFailed: 'This user could not be loaded.',
    editUser: 'Edit User',
    description: 'Update account details, role, and access status.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter full name',
    email: 'Email Address',
    emailPlaceholder: 'Enter email address',
    role: 'Role',
    superAdminHelp: 'Platform user management only edits super admin accounts.',
    permissionHelp: 'You can edit profile details, but role changes require role management permission.',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    cancel: 'Cancel',
    saveUser: 'Save User',
    accountCreated: 'Account created',
    twoFactorSetup: 'Two-factor setup',
    twoFactorEnabled: 'Enabled. Reset to show a new QR code on next login.',
    twoFactorNeedsSetup: 'Needs setup. The QR code will show on next login.',
    showQrAgain: 'Show QR Again',
    showQrAgainTitle: 'Show QR Again?',
    showQrAgainDescription: (name: string) =>
      `${name} will need to scan a new two-factor QR code on next login.`,
    resetTwoFactor: 'Reset Two-Factor',
  },
  km: {
    superAdmin: 'Super Admin',
    tenantAdmin: 'Tenant Admin',
    editor: 'Editor',
    author: 'Author',
    roleUpdateBlockedTitle: 'បានរារាំងការប្តូរតួនាទី',
    roleUpdateBlockedDescription: 'អ្នកប្រើ tenant មិនអាចត្រូវបានដំឡើងជា super admin បានទេ។',
    updateFailedTitle: 'កែប្រែមិនបាន',
    updateProfileFailed: 'មិនអាចកែប្រែ profile អ្នកប្រើបានទេ។',
    roleUpdateFailedTitle: 'ប្តូរតួនាទីមិនបាន',
    roleUpdateFailedDescription: 'មិនអាចប្តូរតួនាទីអ្នកប្រើបានទេ។',
    statusUpdateFailedTitle: 'កែប្រែស្ថានភាពមិនបាន',
    statusUpdateFailedDescription: 'មិនអាចកែប្រែស្ថានភាពអ្នកប្រើបានទេ។',
    userUpdatedTitle: 'បានកែប្រែអ្នកប្រើ',
    userUpdatedDescription: 'បានរក្សាទុកព័ត៌មានអ្នកប្រើ។',
    twoFactorResetFailedTitle: 'កំណត់ Two-Factor ឡើងវិញមិនបាន',
    twoFactorResetFailedDescription: 'មិនអាចកំណត់ Two-Factor setup ឡើងវិញបានទេ។',
    twoFactorResetTitle: 'បានកំណត់ Two-Factor ឡើងវិញ',
    twoFactorResetDescription: 'បានកំណត់ Two-Factor setup ឡើងវិញ។',
    loadingUser: 'កំពុងផ្ទុកអ្នកប្រើ...',
    backToUsers: 'ត្រឡប់ទៅអ្នកប្រើ',
    userNotFound: 'រកមិនឃើញអ្នកប្រើ',
    userLoadFailed: 'មិនអាចផ្ទុកអ្នកប្រើនេះបានទេ។',
    editUser: 'កែអ្នកប្រើ',
    description: 'កែព័ត៌មានគណនី តួនាទី និងស្ថានភាពចូលប្រើ។',
    fullName: 'ឈ្មោះពេញ',
    fullNamePlaceholder: 'បញ្ចូលឈ្មោះពេញ',
    email: 'អ៊ីមែល',
    emailPlaceholder: 'បញ្ចូលអ៊ីមែល',
    role: 'តួនាទី',
    superAdminHelp: 'ការគ្រប់គ្រងអ្នកប្រើវេទិកាកែតែគណនី super admin ប៉ុណ្ណោះ។',
    permissionHelp: 'អ្នកអាចកែ profile ប៉ុន្តែការប្តូរតួនាទីត្រូវការសិទ្ធិគ្រប់គ្រងតួនាទី។',
    status: 'ស្ថានភាព',
    active: 'សកម្ម',
    inactive: 'អសកម្ម',
    cancel: 'បោះបង់',
    saveUser: 'រក្សាទុកអ្នកប្រើ',
    accountCreated: 'បានបង្កើតគណនី',
    twoFactorSetup: 'Two-factor setup',
    twoFactorEnabled: 'បានបើក។ កំណត់ឡើងវិញដើម្បីបង្ហាញ QR ថ្មីនៅពេលចូលលើកក្រោយ។',
    twoFactorNeedsSetup: 'ត្រូវ setup។ QR code នឹងបង្ហាញនៅពេលចូលលើកក្រោយ។',
    showQrAgain: 'បង្ហាញ QR ម្តងទៀត',
    showQrAgainTitle: 'បង្ហាញ QR ម្តងទៀត?',
    showQrAgainDescription: (name: string) =>
      `${name} ត្រូវស្កេន Two-Factor QR code ថ្មីនៅពេលចូលលើកក្រោយ។`,
    resetTwoFactor: 'កំណត់ Two-Factor ឡើងវិញ',
  },
};

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale } = useAdminLocale();
  const copy = editUserCopy[locale];
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
  const [isResettingTwoFactor, setIsResettingTwoFactor] = React.useState(false);
  const [twoFactorConfirmationOpen, setTwoFactorConfirmationOpen] = React.useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const roleOptions: Array<{ value: UserRole; label: string }> = isSuperAdmin
    ? [{ value: 'SUPER_ADMIN', label: copy.superAdmin }]
    : [
        { value: 'ADMIN', label: copy.tenantAdmin },
        { value: 'EDITOR', label: copy.editor },
        { value: 'AUTHOR', label: copy.author },
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

    if (!isSuperAdmin && role === 'SUPER_ADMIN') {
      showError(copy.roleUpdateBlockedTitle, copy.roleUpdateBlockedDescription);
      return;
    }

    setIsSaving(true);
    try {
      const profileResult = await updateUserProfile({
        userId: user.id,
        name: name.trim(),
        email: email.trim(),
      });

      if (!profileResult?.success) {
        showError(
          copy.updateFailedTitle,
          locale === 'en' && profileResult?.message ? profileResult.message : copy.updateProfileFailed,
        );
        return;
      }

      if (canManageRoles && role !== user.role) {
        const roleResult = await updateUserRole({ userId: user.id, role });
        if (!roleResult?.success) {
          showError(
            copy.roleUpdateFailedTitle,
            locale === 'en' && roleResult?.message ? roleResult.message : copy.roleUpdateFailedDescription,
          );
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
          showError(
            copy.statusUpdateFailedTitle,
            locale === 'en' && statusResult?.message ? statusResult.message : copy.statusUpdateFailedDescription,
          );
          return;
        }
      }

      showSuccess(copy.userUpdatedTitle, copy.userUpdatedDescription);
      router.push('/users');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTwoFactor = async () => {
    if (!user) return;

    setIsResettingTwoFactor(true);
    try {
      const result = await UserService.resetUserTwoFactor(user.id);
      if (!result.success) {
        showError(
          copy.twoFactorResetFailedTitle,
          locale === 'en' && result.message ? result.message : copy.twoFactorResetFailedDescription,
        );
        return;
      }

      showSuccess(
        copy.twoFactorResetTitle,
        locale === 'en' && result.message ? result.message : copy.twoFactorResetDescription,
      );
      setUser((current) =>
        current
          ? {
              ...current,
              twoFactorEnabled: result.user?.twoFactorEnabled ?? false,
              twoFactorSetupAt: result.user?.twoFactorSetupAt ?? null,
            }
          : current,
      );
    } catch (error: any) {
      showError(
        copy.twoFactorResetFailedTitle,
        locale === 'en'
          ? error?.response?.errors?.[0]?.message || copy.twoFactorResetFailedDescription
          : copy.twoFactorResetFailedDescription,
      );
    } finally {
      setIsResettingTwoFactor(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          {copy.loadingUser}
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
              {copy.backToUsers}
            </Link>
          </Button>
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-xl font-semibold text-slate-950">{copy.userNotFound}</h1>
              <p className="mt-2 text-slate-600">
                {locale === 'en' ? error || copy.userLoadFailed : copy.userLoadFailed}
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
            {copy.backToUsers}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-2xl">{copy.editUser}</CardTitle>
                <CardDescription>
                  {copy.description}
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
                <Label htmlFor="name">{copy.fullName}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.fullNamePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.emailPlaceholder}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.role}</Label>
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
                    {copy.superAdminHelp}
                  </p>
                )}
                {!canManageRoles && (
                  <p className="text-xs text-slate-500">
                    {copy.permissionHelp}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{copy.status}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'ACTIVE' | 'INACTIVE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">{copy.active}</SelectItem>
                    <SelectItem value="INACTIVE">{copy.inactive}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-5">
              <Button asChild variant="outline">
                <Link href="/users">{copy.cancel}</Link>
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !name.trim() || !email.trim()}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {copy.saveUser}
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
                <p className="font-medium text-slate-950">{copy.accountCreated}</p>
                <p className="text-sm text-slate-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
              {status === 'ACTIVE' ? copy.active : copy.inactive}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-950">{copy.twoFactorSetup}</p>
                <p className="text-sm text-slate-500">
                  {user.twoFactorEnabled
                    ? copy.twoFactorEnabled
                    : copy.twoFactorNeedsSetup}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isResettingTwoFactor}
              onClick={() => setTwoFactorConfirmationOpen(true)}
            >
              {isResettingTwoFactor ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {copy.showQrAgain}
            </Button>
          </CardContent>
        </Card>
      </div>
      <ConfirmationDialog
        open={twoFactorConfirmationOpen}
        onOpenChange={setTwoFactorConfirmationOpen}
        title={copy.showQrAgainTitle}
        description={copy.showQrAgainDescription(user.name || user.email)}
        confirmText={copy.resetTwoFactor}
        variant="destructive"
        onConfirm={handleResetTwoFactor}
      />
    </PermissionGuard>
  );
}
