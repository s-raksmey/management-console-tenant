// src/components/dashboard/RoleDashboard.tsx
"use client";

import React from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionGuard } from "../permissions/PermissionGuard";
import AdminDashboard from "./AdminDashboard";
import EditorDashboard from "./EditorDashboard";
import AuthorDashboard from "./AuthorDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";
import { useAdminLocale } from "@/hooks/useAdminLocale";

interface RoleDashboardProps {
  // Optional props to pass specific data to each dashboard
  adminStats?: any;
  editorStats?: any;
  authorStats?: any;
}

/**
 * Main dashboard component that renders the appropriate dashboard based on user role
 */
export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  adminStats,
  editorStats,
  authorStats,
}) => {
  const { userRole, isLoading } = usePermissions();
  const { locale } = useAdminLocale();
  const copy = locale === "km"
    ? {
        loadingDashboard: "កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង",
        unknownRole: "មិនស្គាល់តួនាទី",
        unknownRoleDescription: (role?: string | null) =>
          `តួនាទីអ្នកប្រើ (${role || "-"}) មិនត្រូវបានស្គាល់។`,
        contactAdmin: "សូមទាក់ទងអ្នកគ្រប់គ្រង ដើម្បីកំណត់តួនាទីត្រឹមត្រូវ។",
      }
    : {
        loadingDashboard: "Loading dashboard",
        unknownRole: "Unknown Role",
        unknownRoleDescription: (role?: string | null) =>
          `Your user role (${role}) is not recognized.`,
        contactAdmin: "Please contact an administrator to assign you a proper role.",
      };

  // Reserve the dashboard area while permissions resolve without flashing a spinner.
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-950"
        aria-busy="true"
        aria-label={copy.loadingDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Admin Dashboard */}
      <PermissionGuard roles={["SUPER_ADMIN"]} fallback={null}>
        <SuperAdminDashboard />
      </PermissionGuard>

      {/* Admin Dashboard */}
      <PermissionGuard roles={["ADMIN"]} fallback={null}>
        <AdminDashboard />
      </PermissionGuard>

      {/* Editor Dashboard */}
      <PermissionGuard roles={["EDITOR"]} fallback={null}>
        <EditorDashboard />
      </PermissionGuard>

      {/* Author Dashboard */}
      <PermissionGuard roles={["AUTHOR"]} fallback={null}>
        <AuthorDashboard />
      </PermissionGuard>

      {/* Fallback for unknown roles */}
      {!["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"].includes(
        userRole || "",
      ) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">🤔</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              {copy.unknownRole}
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {copy.unknownRoleDescription(userRole)}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              {copy.contactAdmin}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleDashboard;
