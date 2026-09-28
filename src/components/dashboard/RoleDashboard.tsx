// src/components/dashboard/RoleDashboard.tsx
'use client';

import React from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionGuard } from "../permissions/PermissionGuard";
import AdminDashboard from "./AdminDashboard";
import EditorDashboard from "./EditorDashboard";
import AuthorDashboard from "./AuthorDashboard";
import { useAdminLocale } from "@/hooks/useAdminLocale";

/**
 * Tenant-console dashboard. Super admins use the main console instead.
 */
export const RoleDashboard: React.FC = () => {
  const { userRole, isLoading } = usePermissions();
  const { locale } = useAdminLocale();
  const copy = locale === "km"
    ? {
        loadingDashboard: "កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង",
        unknownRole: "មិនស្គាល់តួនាទី",
        unknownRoleDescription: (role?: string | null) =>
          `តួនាទីអ្នកប្រើ (${role || "-"}) មិនអាចប្រើកុងសូលគេហទំព័រនេះបានទេ។`,
        contactAdmin: "អ្នកគ្រប់គ្រងកំពូលត្រូវចូលតាមកុងសូលមេ។",
      }
    : {
        loadingDashboard: "Loading dashboard",
        unknownRole: "Wrong console",
        unknownRoleDescription: (role?: string | null) =>
          `This account (${role || "unknown role"}) cannot use the tenant console.`,
        contactAdmin: "Super admins sign in on the main console.",
      };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950"
        aria-busy="true"
        aria-label={copy.loadingDashboard}
      />
    );
  }

  if (!userRole || !["ADMIN", "EDITOR", "AUTHOR"].includes(userRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
            {copy.unknownRole}
          </h1>
          <p className="mb-4 text-gray-600 dark:text-slate-400">
            {copy.unknownRoleDescription(userRole)}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-500">
            {copy.contactAdmin}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PermissionGuard roles={["ADMIN"]} fallback={null}>
        <AdminDashboard />
      </PermissionGuard>
      <PermissionGuard roles={["EDITOR"]} fallback={null}>
        <EditorDashboard />
      </PermissionGuard>
      <PermissionGuard roles={["AUTHOR"]} fallback={null}>
        <AuthorDashboard />
      </PermissionGuard>
    </div>
  );
};

export default RoleDashboard;
