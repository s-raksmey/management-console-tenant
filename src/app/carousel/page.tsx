"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Edit, Image as ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  CarouselSlide,
  M_DELETE_HOME_CAROUSEL_SLIDE,
  Q_HOME_CAROUSEL_SLIDES,
} from "@/services/carousel.gql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToastHelpers } from "@/components/ui/toast";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { Tenant, TenantService } from "@/services/tenant.gql";

const CAROUSEL_ACCESS_PERMISSIONS = [
  Permission.CREATE_CAROUSEL,
  Permission.UPDATE_CAROUSEL,
  Permission.DELETE_CAROUSEL,
];

export default function CarouselListPage() {
  const { user } = useAuth();
  const { hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canAccessCarousel =
    isSuperAdmin || hasAnyPermission(CAROUSEL_ACCESS_PERMISSIONS);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CarouselSlide | null>(null);
  const { showSuccess, showError } = useToastHelpers();
  const showErrorRef = useRef(showError);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

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
        showErrorRef.current("Error", "Failed to load tenant options.");
      }
    };

    void loadTenants();

    return () => {
      isMounted = false;
    };
  }, [isSuperAdmin]);

  const loadSlides = useCallback(async () => {
    if (permissionsLoading || !canAccessCarousel) return;
    if (isSuperAdmin && !selectedTenantId) {
      setSlides([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && selectedTenantId) {
        client.setHeader("x-tenant-id", selectedTenantId);
      }
      const response = await client.request<{
        homeCarouselSlides: CarouselSlide[];
      }>(Q_HOME_CAROUSEL_SLIDES);
      setSlides(
        (response.homeCarouselSlides ?? []).map((slide) => ({
          ...slide,
          tenantId: isSuperAdmin ? selectedTenantId : slide.tenantId,
        })),
      );
    } catch (error: any) {
      showErrorRef.current(
        "Error",
        error?.response?.errors?.[0]?.message ||
          "Failed to load carousel slides",
      );
    } finally {
      setLoading(false);
    }
  }, [canAccessCarousel, isSuperAdmin, permissionsLoading, selectedTenantId]);

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canAccessCarousel) {
      setLoading(false);
      return;
    }

    void loadSlides();
  }, [canAccessCarousel, loadSlides, permissionsLoading]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && deleteTarget.tenantId) {
        client.setHeader("x-tenant-id", deleteTarget.tenantId);
      }
      const response = await client.request<{
        deleteHomeCarouselSlide: boolean;
      }>(M_DELETE_HOME_CAROUSEL_SLIDE, { id: deleteTarget.id });

      if (response.deleteHomeCarouselSlide) {
        setSlides((current) =>
          current.filter((slide) => slide.id !== deleteTarget.id),
        );
        showSuccess("Success", "Carousel slide deleted.");
      }
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message ||
          "Failed to delete carousel slide",
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {!permissionsLoading && !canAccessCarousel ? (
        <div className="text-sm text-red-600">
          Access denied: Insufficient permissions
        </div>
      ) : (
      <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Public Carousel</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage hero slides for the homepage, category pages, and
            sub-category pages.
          </p>
        </div>
        {(isSuperAdmin || hasAnyPermission([Permission.CREATE_CAROUSEL])) && (
          <Button asChild>
            <Link href="/carousel/new">
              <Plus className="mr-2 h-4 w-4" />
              New Slide
            </Link>
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tenant</CardTitle>
            <CardDescription>
              Super admin carousel changes are applied to the selected tenant public website.
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
        <CardHeader>
          <CardTitle>All Slides</CardTitle>
          <CardDescription>{slides.length} slides configured</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading slides...
            </div>
          ) : slides.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                No carousel slides yet
              </p>
              {(isSuperAdmin || hasAnyPermission([Permission.CREATE_CAROUSEL])) && (
                <Button asChild className="mt-4">
                  <Link href="/carousel/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Slide
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="grid gap-4 bg-white p-4 transition-colors hover:bg-slate-50 lg:grid-cols-[144px_1fr_auto]"
                >
                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                    {slide.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={slide.isActive ? "success" : "secondary"}>
                        {slide.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Order {slide.sortOrder}</Badge>
                      <Badge variant="outline">
                        {slide.size === "STANDARD" ? "Standard" : "Wide"}
                      </Badge>
                      <Badge variant="outline">
                        {slide.placement === "HOME"
                          ? "Homepage"
                          : slide.placement === "CATEGORY"
                            ? `Category: ${slide.categorySlug}`
                            : `Sub-category: ${slide.categorySlug}/${slide.topicSlug}`}
                      </Badge>
                      {slide.titleKhmer && (
                        <Badge variant="outline">Khmer</Badge>
                      )}
                    </div>
                    <h3 className="truncate text-base font-semibold text-slate-950">
                      {slide.title}
                    </h3>
                    {slide.subtitle && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {slide.subtitle}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {slide.createdBy
                        ? `Created by ${slide.createdBy.name}`
                        : "Created by unknown user"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:justify-center">
                    {(isSuperAdmin || hasAnyPermission([Permission.UPDATE_CAROUSEL])) && (
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={`/carousel/${slide.id}/edit?tenantId=${slide.tenantId}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    )}
                    {(isSuperAdmin || hasAnyPermission([Permission.DELETE_CAROUSEL])) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteTarget(slide)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Carousel Slide?"
        description={`Delete "${deleteTarget?.title ?? "this slide"}"? This action cannot be undone.`}
        confirmText="Delete Slide"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          void confirmDelete();
        }}
      />
      </div>
      )}
    </>
  );
}
