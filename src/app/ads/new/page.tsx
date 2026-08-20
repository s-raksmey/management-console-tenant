"use client";

import { useSearchParams } from "next/navigation";
import { AdvertisementForm } from "../_components/AdvertisementForm";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { AdsNavigation } from "../_components/AdsNavigation";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const newAdCopy = {
  en: {
    loadingPermissions: "Loading permissions...",
    accessDenied: "Access denied: Insufficient permissions",
    title: "Create Advertisement",
    description: "Add a new sponsored placement for the public website.",
  },
  km: {
    loadingPermissions: "កំពុងផ្ទុកសិទ្ធិ...",
    accessDenied: "គ្មានសិទ្ធិ៖ សិទ្ធិមិនគ្រប់គ្រាន់",
    title: "បង្កើតពាណិជ្ជកម្ម",
    description: "បន្ថែមទីតាំងផ្សាយដែលបានឧបត្ថម្ភថ្មីសម្រាប់គេហទំព័រសាធារណៈ។",
  },
} as const;

export default function NewAdvertisementPage() {
  const { locale } = useAdminLocale();
  const copy = newAdCopy[locale];
  const searchParams = useSearchParams();
  const { hasPermission, isLoading } = usePermissions();
  const canCreate = hasPermission(Permission.CREATE_ADS);
  if (isLoading) return <div className="text-sm text-slate-500">{copy.loadingPermissions}</div>;
  if (!canCreate) return <div className="text-sm text-red-600">{copy.accessDenied}</div>;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1><p className="mt-2 text-sm text-slate-600">{copy.description}</p></div><AdsNavigation canCreate={canCreate} /><AdvertisementForm initialTenantId={searchParams.get("tenantId") ?? ""} /></div>;
}
