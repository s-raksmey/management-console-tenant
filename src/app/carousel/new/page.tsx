"use client";

import { CarouselSlideForm } from "../_components/CarouselSlideForm";
import { Permission } from "@/components/permissions/PermissionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function NewCarouselSlidePage() {
  const { user } = useAuth();
  const { hasPermission, isLoading } = usePermissions();
  const canCreate =
    user?.role === "SUPER_ADMIN" || hasPermission(Permission.CREATE_CAROUSEL);

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading permissions...</div>;
  }

  if (!canCreate) {
    return (
      <div className="text-sm text-red-600">
        Access denied: Insufficient permissions
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Create Slide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a new public hero carousel slide with image or video media.
        </p>
      </div>

      <CarouselSlideForm />
    </div>
  );
}
