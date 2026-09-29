"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { AdvertisementForm } from "../../_components/AdvertisementForm";
import { Advertisement, Q_ADVERTISEMENTS } from "@/services/ads.gql";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdsNavigation } from "../../_components/AdsNavigation";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const editAdCopy = {
  en: {
    notFound: "Advertisement was not found.",
    loadFailed: "Failed to load advertisement.",
    accessDenied: "Access denied: Insufficient permissions",
    viewOnlyBanner: "Your role can view this advertisement but cannot change it.",
    viewOnlyTitle: "View Advertisement",
    viewOnlyDescription: "This campaign is shown as currently configured.",
    loading: "Loading advertisement...",
    unableToLoad: "Unable to Load Advertisement",
    backToAds: "Back to Ads",
    title: "Edit Advertisement",
    description: "Update campaign creative and delivery settings.",
    backToAdvertisements: "Back to Advertisements",
  },
  km: {
    notFound: "រកមិនឃើញពាណិជ្ជកម្ម។",
    loadFailed: "មិនអាចផ្ទុកពាណិជ្ជកម្មបានទេ។",
    accessDenied: "គ្មានសិទ្ធិ៖ សិទ្ធិមិនគ្រប់គ្រាន់",
    viewOnlyBanner: "តួនាទីរបស់អ្នកអាចមើលពាណិជ្ជកម្មនេះ ប៉ុន្តែមិនអាចកែបានទេ។",
    viewOnlyTitle: "មើលពាណិជ្ជកម្ម",
    viewOnlyDescription: "យុទ្ធនាការនេះបង្ហាញតាមការកំណត់បច្ចុប្បន្ន។",
    loading: "កំពុងផ្ទុកពាណិជ្ជកម្ម...",
    unableToLoad: "មិនអាចផ្ទុកពាណិជ្ជកម្មបាន",
    backToAds: "ត្រឡប់ទៅពាណិជ្ជកម្ម",
    title: "កែពាណិជ្ជកម្ម",
    description: "កែមាតិកាផ្សាយ និងការកំណត់ការផ្សាយរបស់យុទ្ធនាការ។",
    backToAdvertisements: "ត្រឡប់ទៅពាណិជ្ជកម្ម",
  },
} as const;

export default function EditAdvertisementPage() {
  const { locale } = useAdminLocale();
  const copy = editAdCopy[locale];
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "";
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canView = hasPermission(Permission.VIEW_ADS);
  const canUpdate = hasPermission(Permission.UPDATE_ADS);
  const canCreate = hasPermission(Permission.CREATE_ADS);
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (permissionsLoading || !canView) { setLoading(false); return; }
      try {
        const client = getAuthenticatedGqlClient();
        if (user?.role === "SUPER_ADMIN" && tenantId) client.setHeader("x-tenant-id", tenantId);
        const response = await client.request<{ advertisements: Advertisement[] }>(Q_ADVERTISEMENTS, {});
        const selected = response.advertisements.find((item) => item.id === id) ?? null;
        if (!mounted) return;
        if (!selected) setError(copy.notFound);
        setAdvertisement(selected ? { ...selected, tenantId: tenantId || selected.tenantId } : null);
      } catch (err: any) {
        if (mounted) setError(locale === "en" ? err?.response?.errors?.[0]?.message || copy.loadFailed : copy.loadFailed);
      } finally { if (mounted) setLoading(false); }
    };
    void load();
    return () => { mounted = false; };
  }, [canView, copy.loadFailed, copy.notFound, id, locale, permissionsLoading, tenantId, user?.role]);

  if (!permissionsLoading && !canView) return <div className="text-sm text-red-600">{copy.accessDenied}</div>;
  if (loading) return <Card><CardContent className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{copy.loading}</CardContent></Card>;
  if (error || !advertisement) return <Card><CardContent className="py-16 text-center"><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-semibold">{copy.unableToLoad}</h1><p className="mt-2 text-sm text-slate-600">{error}</p><Button className="mt-5" asChild><a href="/ads">{copy.backToAds}</a></Button></CardContent></Card>;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{canUpdate ? copy.title : copy.viewOnlyTitle}</h1>
        <p className="mt-2 text-sm text-slate-600">{canUpdate ? copy.description : copy.viewOnlyDescription}</p>
        {!canUpdate ? (
          <p className="mt-3 max-w-2xl rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {copy.viewOnlyBanner}
          </p>
        ) : null}
      </div>
      <AdsNavigation canCreate={canCreate} />
      <Button variant="outline" size="sm" asChild>
        <Link href="/ads">
          <ArrowLeft className="h-4 w-4" />
          {copy.backToAdvertisements}
        </Link>
      </Button>
      <AdvertisementForm advertisement={advertisement} initialTenantId={tenantId} readOnly={!canUpdate} />
    </div>
  );
}
