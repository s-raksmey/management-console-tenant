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

export default function EditAdvertisementPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "";
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canUpdate = hasPermission(Permission.UPDATE_ADS);
  const canCreate = hasPermission(Permission.CREATE_ADS);
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (permissionsLoading || !canUpdate) { setLoading(false); return; }
      try {
        const client = getAuthenticatedGqlClient();
        if (user?.role === "SUPER_ADMIN" && tenantId) client.setHeader("x-tenant-id", tenantId);
        const response = await client.request<{ advertisements: Advertisement[] }>(Q_ADVERTISEMENTS, {});
        const selected = response.advertisements.find((item) => item.id === id) ?? null;
        if (!mounted) return;
        if (!selected) setError("Advertisement was not found.");
        setAdvertisement(selected ? { ...selected, tenantId: tenantId || selected.tenantId } : null);
      } catch (err: any) {
        if (mounted) setError(err?.response?.errors?.[0]?.message || "Failed to load advertisement.");
      } finally { if (mounted) setLoading(false); }
    };
    void load();
    return () => { mounted = false; };
  }, [canUpdate, id, permissionsLoading, tenantId, user?.role]);

  if (!permissionsLoading && !canUpdate) return <div className="text-sm text-red-600">Access denied: Insufficient permissions</div>;
  if (loading) return <Card><CardContent className="flex items-center justify-center py-16 text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading advertisement...</CardContent></Card>;
  if (error || !advertisement) return <Card><CardContent className="py-16 text-center"><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-semibold">Unable to Load Advertisement</h1><p className="mt-2 text-sm text-slate-600">{error}</p><Button className="mt-5" asChild><a href="/ads">Back to Ads</a></Button></CardContent></Card>;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-slate-950">Edit Advertisement</h1><p className="mt-2 text-sm text-slate-600">Update campaign creative and delivery settings.</p></div><AdsNavigation canCreate={canCreate} /><Button variant="outline" size="sm" asChild><Link href="/ads"><ArrowLeft className="h-4 w-4" />Back to Advertisements</Link></Button><AdvertisementForm advertisement={advertisement} initialTenantId={tenantId} /></div>;
}
