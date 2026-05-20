// src/components/user-management/UserTableRow.tsx
'use client';

import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '../../services/user.gql';
import type { AssignableUserRole, User } from '../../types/user';
import { Permission } from '../permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onUserUpdate: (user: User) => void;
  onUserDelete: (userId: string) => void;
}

export default function UserTableRow({ 
  user, 
  isSelected, 
  onSelect, 
  onUserUpdate, 
  onUserDelete 
}: UserTableRowProps) {
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();
  const [showActions, setShowActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const canUpdateUser = hasPermission(Permission.UPDATE_USER);
  const canDeleteUser = hasPermission(Permission.DELETE_USER);
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const roleOptions: AssignableUserRole[] =
    currentUser?.role === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR']
      : ['ADMIN', 'EDITOR', 'AUTHOR'];

  const handleRoleChange = async (newRole: AssignableUserRole) => {
    try {
      setIsUpdating(true);
      const result = await UserService.updateUserRole({
        userId: user.id,
        role: newRole,
      });
      
      if (result.success && result.user) {
        onUserUpdate(result.user);
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      setIsUpdating(true);
      const result = await UserService.updateUserStatus({
        userId: user.id,
        isActive: !user.isActive,
      });
      
      if (result.success && result.user) {
        onUserUpdate(result.user);
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      const result = await UserService.deleteUser(user.id);
      
      if (result.success) {
        onUserDelete(user.id);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setIsUpdating(false);
      setShowActions(false);
    }
  };

  return (
    <tr className={`hover:bg-slate-50 ${isUpdating ? 'opacity-50' : ''}`}>
      {/* Selection Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(user.id, e.target.checked)}
          disabled={isUpdating}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
        />
      </td>

      {/* User Info */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${UserService.getRoleBadgeColor(user.role)}`}>
          {UserService.getRoleDisplayName(user.role)}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${UserService.getStatusBadgeColor(user.isActive)}`}>
          {UserService.getStatusDisplayName(user.isActive)}
        </span>
      </td>

      {/* Created Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            disabled={isUpdating}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showActions && (canUpdateUser || canDeleteUser || canManageRoles) && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-10">
              <div className="py-1">
                {/* Role Change Options */}
                {canManageRoles && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Change Role
                    </div>
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        disabled={user.role === role}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center space-x-2 ${
                          user.role === role ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'
                        }`}
                      >
                        <Shield className="h-4 w-4" />
                        <span>{UserService.getRoleDisplayName(role)}</span>
                      </button>
                    ))}

                    <div className="border-t border-slate-200 my-1"></div>
                  </>
                )}

                {/* Status Toggle */}
                {canUpdateUser && (
                  <>
                    <button
                      onClick={handleStatusToggle}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="h-4 w-4" />
                          <span>Deactivate User</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          <span>Activate User</span>
                        </>
                      )}
                    </button>

                    <div className="border-t border-slate-200 my-1"></div>
                  </>
                )}

                {/* Delete */}
                {canDeleteUser && (
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete User</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
