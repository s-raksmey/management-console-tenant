// src/components/user-management/BulkActionBar.tsx
'use client';

import { useState } from 'react';
import { Users, Shield, UserCheck, UserX, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '../../services/user.gql';
import type { AssignableUserRole } from '../../types/user';
import { Permission } from '../permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

interface BulkActionBarProps {
  selectedUserIds: string[];
  onClearSelection: () => void;
  onBulkActionComplete: () => void;
}

export default function BulkActionBar({ 
  selectedUserIds, 
  onClearSelection, 
  onBulkActionComplete 
}: BulkActionBarProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
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
  const canManageRoles = hasPermission(Permission.MANAGE_USER_ROLES);
  const canUpdateUser = hasPermission(Permission.UPDATE_USER);
  const roleOptions: AssignableUserRole[] =
    user?.role === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN', 'ADMIN']
      : ['ADMIN', 'EDITOR', 'AUTHOR'];

  if (selectedUserIds.length === 0) return null;

  const handleBulkRoleUpdate = async (role: AssignableUserRole) => {
    try {
      setIsProcessing(true);
      const result = await UserService.bulkUpdateUserRoles(selectedUserIds, role);
      
      if (result.success) {
        onBulkActionComplete();
        onClearSelection();
      }
    } catch (error) {
      console.error('Failed to update user roles:', error);
    } finally {
      setIsProcessing(false);
      setShowRoleMenu(false);
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    try {
      setIsProcessing(true);
      const result = await UserService.bulkUpdateUserStatus(selectedUserIds, isActive);
      
      if (result.success) {
        onBulkActionComplete();
        onClearSelection();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestConfirmation = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmation({
      open: true,
      title: input.title,
      description: input.description,
      confirmText: input.confirmText,
      variant: input.variant,
      onConfirm: input.onConfirm,
    });
    setShowRoleMenu(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Role Change Dropdown */}
          {canManageRoles && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Change Role
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-20">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Set Role for {selectedUserIds.length} users
                  </div>
                  {roleOptions.map((role) => (
                    <button
                      key={role}
                      onClick={() =>
                        requestConfirmation({
                          title: 'Change Selected Roles?',
                          description: `Change ${selectedUserIds.length} selected user${selectedUserIds.length !== 1 ? 's' : ''} to ${UserService.getRoleDisplayName(role)}?`,
                          confirmText: 'Change Role',
                          onConfirm: () => handleBulkRoleUpdate(role),
                        })
                      }
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>{UserService.getRoleDisplayName(role)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Status Actions */}
          {canUpdateUser && (
            <>
              <button
                onClick={() =>
                  requestConfirmation({
                    title: 'Activate Selected Users?',
                    description: `Activate ${selectedUserIds.length} selected user${selectedUserIds.length !== 1 ? 's' : ''}?`,
                    confirmText: 'Activate',
                    onConfirm: () => handleBulkStatusUpdate(true),
                  })
                }
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </button>

              <button
                onClick={() =>
                  requestConfirmation({
                    title: 'Deactivate Selected Users?',
                    description: `Deactivate ${selectedUserIds.length} selected user${selectedUserIds.length !== 1 ? 's' : ''}?`,
                    confirmText: 'Deactivate',
                    variant: 'destructive',
                    onConfirm: () => handleBulkStatusUpdate(false),
                  })
                }
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </button>
            </>
          )}

          {/* Clear Selection */}
          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">Processing bulk action...</span>
        </div>
      )}
      <ConfirmationDialog
        open={confirmation.open}
        onOpenChange={(open) =>
          setConfirmation((current) => ({ ...current, open }))
        }
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        cancelText="Cancel"
        variant={confirmation.variant}
        onConfirm={() => {
          void confirmation.onConfirm();
        }}
      />
    </div>
  );
}
