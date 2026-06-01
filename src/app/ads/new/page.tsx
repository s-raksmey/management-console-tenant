"use client";

import { useSearchParams } from "next/navigation";
import { AdvertisementForm } from "../_components/AdvertisementForm";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { AdsNavigation } from "../_components/AdsNavigation";

export default function NewAdvertisementPage() {
  const searchParams = useSearchParams();
  const { hasPermission, isLoading } = usePermissions();
  const canCreate = hasPermission(Permission.CREATE_ADS);
  if (isLoading) return <div className="text-sm text-slate-500">Loading permissions...</div>;
  if (!canCreate) return <div className="text-sm text-red-600">Access denied: Insufficient permissions</div>;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-slate-950">Create Advertisement</h1><p className="mt-2 text-sm text-slate-600">Add a new sponsored placement for the public website.</p></div><AdsNavigation canCreate={canCreate} /><AdvertisementForm initialTenantId={searchParams.get("tenantId") ?? ""} /></div>;
}
