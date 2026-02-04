'use client';

import { useState } from "react";
import UserList from "@/components/user-management/UserList";
import UserFilters from "@/components/user-management/UserFilters";
import UserStats from "@/components/user-management/UserStats";
import UserCreateModal from "@/components/user-management/UserCreateModal";
import { PermissionGuard, Permission } from "@/components/permissions/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { UserFilters as UserFiltersType } from "@/types/user";

const defaultFilters: UserFiltersType = {
  search: "",
  role: "ALL",
  status: "ALL",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function RoleManagementPage() {
  const [filters, setFilters] = useState<UserFiltersType>(defaultFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <PermissionGuard permissions={[Permission.MANAGE_USER_ROLES]} showError>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update user roles, permissions, and account access.
              </p>
            </div>
            <PermissionGuard permissions={[Permission.CREATE_USER]} fallback={null}>
              <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </PermissionGuard>
          </div>
        </div>

        <UserStats />

        <UserFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        <UserList key={refreshToken} filters={filters} />

        <UserCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={() => {
            setIsCreateModalOpen(false);
            setRefreshToken((prev) => prev + 1);
          }}
        />
      </div>
    </PermissionGuard>
  );
}
