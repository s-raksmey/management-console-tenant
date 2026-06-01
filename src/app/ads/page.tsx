"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit,
  Eye,
  Image as ImageIcon,
  Link2,
  Loader2,
  Megaphone,
  MousePointerClick,
  PauseCircle,
  PencilLine,
  Trash2,
} from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  Advertisement,
  AdvertisementPlacement,
  AdvertisementStatus,
  M_DELETE_ADVERTISEMENT,
  Q_ADVERTISEMENTS,
} from "@/services/ads.gql";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useToastHelpers } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Tenant, TenantService } from "@/services/tenant.gql";
import { AdsNavigation } from "./_components/AdsNavigation";

const placements: AdvertisementPlacement[] = [
  "HOME_TOP",
  "HOME_SIDEBAR",
  "CATEGORY_TOP",
  "ARTICLE_INLINE",
  "ARTICLE_SIDEBAR",
  "FOOTER",
];
const statuses: AdvertisementStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];

function label(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "No limit";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/uploads/")) return imageUrl;
  try {
    const url = new URL(imageUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getDeliveryState(ad: Advertisement) {
  const now = new Date();
  if (ad.status === "ARCHIVED") return { label: "Archived", variant: "secondary" as const, icon: Trash2 };
  if (ad.status === "PAUSED") return { label: "Paused", variant: "warning" as const, icon: PauseCircle };
  if (ad.status === "DRAFT") return { label: "Draft", variant: "secondary" as const, icon: PencilLine };
  if (ad.startAt && new Date(ad.startAt) > now) return { label: "Scheduled", variant: "outline" as const, icon: Clock3 };
  if (ad.endAt && new Date(ad.endAt) < now) return { label: "Expired", variant: "secondary" as const, icon: CalendarDays };
  if (ad.format !== "HTML" && !ad.targetUrl) return { label: "Needs URL", variant: "warning" as const, icon: Link2 };
  return { label: "Live", variant: "success" as const, icon: CheckCircle2 };
}

export default function AdsPage() {
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { showSuccess, showError } = useToastHelpers();
  const showErrorRef = useRef(showError);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canView = hasPermission(Permission.VIEW_ADS);
  const canCreate = hasPermission(Permission.CREATE_ADS);
  const canUpdate = hasPermission(Permission.UPDATE_ADS);
  const canDelete = hasPermission(Permission.DELETE_ADS);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdvertisementStatus | "ALL">("ALL");
  const [placementFilter, setPlacementFilter] = useState<AdvertisementPlacement | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<Advertisement | null>(null);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    void TenantService.listTenants().then((items) => {
      if (!mounted) return;
      const active = items.filter((tenant) => tenant.status === "ACTIVE");
      setTenants(active);
      setSelectedTenantId((current) => current || active[0]?.id || "");
    }).catch(() => showErrorRef.current("Error", "Failed to load tenant options."));
    return () => { mounted = false; };
  }, [isSuperAdmin]);

  const loadAds = useCallback(async () => {
    if (permissionsLoading || !canView) return;
    if (isSuperAdmin && !selectedTenantId) {
      setAds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && selectedTenantId) client.setHeader("x-tenant-id", selectedTenantId);
      const response = await client.request<{ advertisements: Advertisement[] }>(Q_ADVERTISEMENTS, {
        status: statusFilter === "ALL" ? null : statusFilter,
        placement: placementFilter === "ALL" ? null : placementFilter,
      });
      setAds(response.advertisements ?? []);
    } catch (error: any) {
      showErrorRef.current("Error", error?.response?.errors?.[0]?.message || "Failed to load advertisements.");
    } finally {
      setLoading(false);
    }
  }, [canView, isSuperAdmin, permissionsLoading, placementFilter, selectedTenantId, statusFilter]);

  useEffect(() => { void loadAds(); }, [loadAds]);

  const stats = useMemo(() => ({
    active: ads.filter((ad) => ad.status === "ACTIVE").length,
    scheduled: ads.filter((ad) => ad.startAt && new Date(ad.startAt) > new Date()).length,
    impressions: ads.reduce((sum, ad) => sum + ad.impressions, 0),
    clicks: ads.reduce((sum, ad) => sum + ad.clicks, 0),
  }), [ads]);

  const archiveAd = async () => {
    if (!archiveTarget) return;
    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && selectedTenantId) client.setHeader("x-tenant-id", selectedTenantId);
      await client.request(M_DELETE_ADVERTISEMENT, { id: archiveTarget.id });
      setAds((current) => current.filter((ad) => ad.id !== archiveTarget.id));
      showSuccess("Archived", "Advertisement moved to archive.");
    } catch (error: any) {
      showError("Error", error?.response?.errors?.[0]?.message || "Failed to archive advertisement.");
    } finally {
      setArchiveTarget(null);
    }
  };

  if (!permissionsLoading && !canView) return <div className="text-sm text-red-600">Access denied: Ads permission required.</div>;

  const metrics = [
    { label: "Active", value: stats.active, detail: "Publishing now", icon: CheckCircle2 },
    { label: "Scheduled", value: stats.scheduled, detail: "Starting later", icon: Clock3 },
    { label: "Impressions", value: stats.impressions, detail: "Creative views", icon: Eye },
    { label: "Clicks", value: stats.clicks, detail: "Outbound visits", icon: MousePointerClick },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700"><Megaphone className="h-4 w-4" />Revenue Workspace</div>
          <h1 className="text-3xl font-bold text-slate-950">Ads Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review sponsored placements, delivery health, schedules, and campaign performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isSuperAdmin && (
            <select aria-label="Selected tenant" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)} className="h-10 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm">
              <option value="">Select tenant</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name} /{tenant.slug}</option>)}
            </select>
          )}
        </div>
      </header>
      <AdsNavigation canCreate={canCreate} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label: metricLabel, value, detail, icon: Icon }) => (
          <div key={metricLabel} className="flex items-center gap-4 border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Icon className="h-5 w-5" /></div>
            <div><p className="text-xs text-slate-500">{detail}</p><p className="text-xl font-semibold text-slate-950">{value.toLocaleString()}</p><p className="text-xs font-medium text-slate-600">{metricLabel}</p></div>
          </div>
        ))}
      </section>

      <Card className="overflow-hidden rounded-lg">
        <CardHeader className="border-b border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div><CardTitle className="text-base">Campaign Placements</CardTitle><CardDescription>{ads.length} advertisements in this view</CardDescription></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdvertisementStatus | "ALL")} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="ALL">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
              <select aria-label="Filter by placement" value={placementFilter} onChange={(event) => setPlacementFilter(event.target.value as AdvertisementPlacement | "ALL")} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="ALL">All placements</option>{placements.map((placement) => <option key={placement} value={placement}>{label(placement)}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center py-20 text-sm text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading advertisements...</div> : ads.length === 0 ? (
            <div className="py-20 text-center"><Megaphone className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-700">No advertisements match this view</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ads.map((ad) => {
                const imageUrl = getImageUrl(ad.imageUrl);
                const delivery = getDeliveryState(ad);
                const DeliveryIcon = delivery.icon;
                const ctr = ad.impressions ? (ad.clicks / ad.impressions) * 100 : 0;
                return (
                  <div key={ad.id} className="grid gap-4 bg-white p-4 transition hover:bg-slate-50 lg:grid-cols-[128px_minmax(0,1fr)_240px_auto] lg:items-center">
                    <div className="flex h-20 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">{imageUrl ? <img src={imageUrl} alt={ad.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-slate-400" />}</div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><Badge variant={delivery.variant} className="gap-1"><DeliveryIcon className="h-3 w-3" />{delivery.label}</Badge><Badge variant="outline">{label(ad.placement)}</Badge><Badge variant="outline">{label(ad.targetScope ?? "GLOBAL")}</Badge><span className="text-xs text-slate-400">{label(ad.format)}</span></div>
                      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{ad.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{ad.headline || ad.sponsorName || "No public headline"}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{formatDate(ad.startAt)} - {formatDate(ad.endAt)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-sm font-semibold">{ad.impressions.toLocaleString()}</p><p className="text-[11px] uppercase text-slate-400">Views</p></div>
                      <div><p className="text-sm font-semibold">{ad.clicks.toLocaleString()}</p><p className="text-[11px] uppercase text-slate-400">Clicks</p></div>
                      <div><p className="text-sm font-semibold">{ctr.toFixed(1)}%</p><p className="text-[11px] uppercase text-slate-400">CTR</p></div>
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      {canUpdate && <Button variant="outline" size="sm" asChild><Link href={`/ads/${ad.id}/edit${selectedTenantId ? `?tenantId=${selectedTenantId}` : ""}`}><Edit className="h-4 w-4" />Edit</Link></Button>}
                      {canDelete && <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" title="Archive advertisement" onClick={() => setArchiveTarget(ad)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)} title="Archive Advertisement?" description={`Archive "${archiveTarget?.name ?? "this advertisement"}"? It will stop appearing on the public website.`} confirmText="Archive Advertisement" variant="destructive" onConfirm={() => { void archiveAd(); }} />
    </div>
  );
}
