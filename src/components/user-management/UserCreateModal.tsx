// src/components/user-management/UserCreateModal.tsx
'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/components/permissions/PermissionGuard';
import { UserService } from '../../services/user.gql';
import type { AssignableUserRole, CreateUserInput } from '../../types/user';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const createUserCopy = {
  en: {
    tenantRole: 'Sub-tenant Role',
    admin: 'Admin',
    editor: 'Editor',
    author: 'Author',
    superAdminBlocked: 'Sub-tenant users cannot create super admin accounts.',
    createFailed: 'Failed to create user',
    title: 'Create New User',
    close: 'Close',
    fullName: 'Full Name *',
    fullNamePlaceholder: 'Enter full name',
    email: 'Email Address *',
    emailPlaceholder: 'Enter email address',
    password: 'Password *',
    passwordPlaceholder: 'Enter password (min 8 characters)',
    accountActive: 'Account is active',
    sendWelcomeEmail: 'Send welcome email',
    cancel: 'Cancel',
    creating: 'Creating...',
    createUser: 'Create User',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  km: {
    tenantRole: 'តួនាទីគេហទំព័រ',
    admin: 'អ្នកគ្រប់គ្រង',
    editor: 'អ្នកកែសម្រួល',
    author: 'អ្នកនិពន្ធ',
    superAdminBlocked: 'អ្នកប្រើគេហទំព័រមិនអាចបង្កើតគណនីអ្នកគ្រប់គ្រងកំពូលបានទេ។',
    createFailed: 'មិនអាចបង្កើតអ្នកប្រើបានទេ',
    title: 'បង្កើតអ្នកប្រើថ្មី',
    close: 'បិទ',
    fullName: 'ឈ្មោះពេញ *',
    fullNamePlaceholder: 'បញ្ចូលឈ្មោះពេញ',
    email: 'អ៊ីមែល *',
    emailPlaceholder: 'បញ្ចូលអ៊ីមែល',
    password: 'ពាក្យសម្ងាត់ *',
    passwordPlaceholder: 'បញ្ចូលពាក្យសម្ងាត់ (យ៉ាងតិច 8 តួ)',
    accountActive: 'គណនីសកម្ម',
    sendWelcomeEmail: 'ផ្ញើអ៊ីមែលស្វាគមន៍',
    cancel: 'បោះបង់',
    creating: 'កំពុងបង្កើត...',
    createUser: 'បង្កើតអ្នកប្រើ',
    showPassword: 'បង្ហាញពាក្យសម្ងាត់',
    hidePassword: 'លាក់ពាក្យសម្ងាត់',
  },
};

export default function UserCreateModal({ isOpen, onClose, onUserCreated }: UserCreateModalProps) {
  const { locale } = useAdminLocale();
  const copy = createUserCopy[locale];
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canAssignSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const defaultRole: AssignableUserRole = canAssignSuperAdmin ? 'SUPER_ADMIN' : 'AUTHOR';
  const roleOptions: Array<{ value: AssignableUserRole; label: string }> = canManageRoles
    ? [
        { value: 'ADMIN', label: copy.admin },
        { value: 'EDITOR', label: copy.editor },
        { value: 'AUTHOR', label: copy.author },
      ]
    : [{ value: 'AUTHOR', label: copy.author }];
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    isActive: true,
    sendWelcomeEmail: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignSuperAdmin && formData.role === 'SUPER_ADMIN') {
      setError(copy.superAdminBlocked);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await UserService.createUser({
        ...formData,
        role: canAssignSuperAdmin ? 'SUPER_ADMIN' : formData.role,
      });
      
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          role: defaultRole,
          isActive: true,
          sendWelcomeEmail: true,
        });
        onUserCreated();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(locale === 'en' && err instanceof Error ? err.message : copy.createFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        isActive: true,
        sendWelcomeEmail: true,
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{copy.title}</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label={copy.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {copy.fullName}
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={copy.fullNamePlaceholder}
              disabled={loading}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {copy.email}
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={copy.emailPlaceholder}
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {copy.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={copy.passwordPlaceholder}
                minLength={8}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!canAssignSuperAdmin && (
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                {copy.tenantRole}
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as AssignableUserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || !canManageRoles}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Account Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              {copy.accountActive}
            </label>
          </div>

          {/* Welcome Email */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-700">
              {copy.sendWelcomeEmail}
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? copy.creating : copy.createUser}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
