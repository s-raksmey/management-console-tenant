// src/app/users/requests/page.tsx
'use client';

import React from 'react';
import { RegistrationRequestsPage } from '@/components/users/RegistrationRequestsPage';
import { PermissionGuard, Permission } from '@/components/permissions/PermissionGuard';

export default function UserRequestsPage() {
  return (
    <PermissionGuard permissions={[Permission.MANAGE_USERS]} showError>
      <RegistrationRequestsPage />
    </PermissionGuard>
  );
}
