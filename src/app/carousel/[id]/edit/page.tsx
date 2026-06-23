"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { CarouselSlide, Q_HOME_CAROUSEL_SLIDES } from "@/services/carousel.gql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CarouselSlideForm } from "../../_components/CarouselSlideForm";
import { Permission } from "@/components/permissions/PermissionGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Tenant, TenantService } from "@/services/tenant.gql";

export default function EditCarouselSlidePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canUpdate =
    isSuperAdmin || hasPermission(Permission.UPDATE_CAROUSEL);
  const [slide, setSlide] = useState<CarouselSlide | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(searchParams.get("tenantId") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;

    let isMounted = true;

    const loadTenants = async () => {
      try {
        const items = await TenantService.listTenants();
        if (!isMounted) return;

        const activeItems = items.filter((tenant) => tenant.status === "ACTIVE");
        setTenants(activeItems);
        setSelectedTenantId((current) => current || activeItems[0]?.id || "");
      } catch {
        setError("Failed to load tenant options.");
      }
    };

    void loadTenants();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  useEffect(() => {
    let isMounted = true;

    const loadSlide = async () => {
      if (permissionsLoading || !canUpdate) {
        setLoading(false);
        return;
      }

      if (isSuperAdmin && !selectedTenantId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const client = getAuthenticatedGqlClient();
        if (isSuperAdmin && selectedTenantId) {
          client.setHeader("x-tenant-id", selectedTenantId);
        }
        const response = await client.request<{
          homeCarouselSlides: CarouselSlide[];
        }>(Q_HOME_CAROUSEL_SLIDES);
        const selectedSlide =
          response.homeCarouselSlides.find((item) => item.id === id) ?? null;

        if (!isMounted) return;

        if (!selectedSlide) {
          setError("Carousel slide was not found.");
          setSlide(null);
          return;
        }

        setSlide({
          ...selectedSlide,
          tenantId: isSuperAdmin ? selectedTenantId : selectedSlide.tenantId,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err?.response?.errors?.[0]?.message ||
            "Failed to load carousel slide.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSlide();

    return () => {
      isMounted = false;
    };
  }, [canUpdate, id, isSuperAdmin, permissionsLoading, selectedTenantId]);

  if (!permissionsLoading && !canUpdate) {
    return (
      <div className="text-sm text-red-600">
        Access denied: Insufficient permissions
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading slide...
        </CardContent>
      </Card>
    );
  }

  if (error || !slide) {
    return (
      <div className="space-y-6">
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Select Tenant</CardTitle>
              <CardDescription>
                Choose the tenant that owns this carousel slide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
                className="flex h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} /{tenant.slug}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="py-16 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            Unable to Load Slide
          </h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button className="mt-5" asChild>
            <a href="/carousel">Back to Carousel</a>
          </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Edit Slide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update the public hero slide content and media.
        </p>
      </div>

      <CarouselSlideForm slide={slide} />
    </div>
  );
}
