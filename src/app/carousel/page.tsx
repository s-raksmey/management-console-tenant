"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Edit, Image as ImageIcon, Loader2, PlayCircle, Plus, Trash2 } from "lucide-react";
import { shouldBypassImageOptimizer } from "@/lib/cms-media";
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
import { useAdminLocale } from "@/hooks/useAdminLocale";

const CAROUSEL_ACCESS_PERMISSIONS = [
  Permission.CREATE_CAROUSEL,
  Permission.UPDATE_CAROUSEL,
  Permission.DELETE_CAROUSEL,
];

const carouselListCopy = {
  en: {
    error: "Error",
    success: "Success",
    loadTenantFailed: "Failed to load sub-tenant options.",
    loadSlidesFailed: "Failed to load carousel slides",
    deleted: "Carousel slide deleted.",
    deleteFailed: "Failed to delete carousel slide",
    accessDenied: "Access denied: Insufficient permissions",
    title: "Public Carousel",
    description: "Manage hero slides for the homepage, category pages, and sub-category pages.",
    newSlide: "New Slide",
    selectTenant: "Select Sub-tenant",
    selectTenantDescription:
      "Super admin carousel changes are applied to the selected sub-tenant public website.",
    selectTenantPlaceholder: "Select sub-tenant",
    allSlides: "All Slides",
    slidesConfigured: (count: number) => `${count} slides configured`,
    loadingSlides: "Loading slides...",
    empty: "No carousel slides yet",
    createFirst: "Create First Slide",
    active: "Active",
    inactive: "Inactive",
    order: (order: number) => `Order ${order}`,
    standard: "Standard",
    wide: "Wide",
    image: "Image",
    video: (provider?: string | null) => `Video${provider ? `: ${provider}` : ""}`,
    homepage: "Homepage",
    category: (slug?: string | null) => `Category: ${slug}`,
    topic: (category?: string | null, topic?: string | null) => `Sub-category: ${category}/${topic}`,
    khmer: "Khmer",
    createdBy: (name: string) => `Created by ${name}`,
    createdUnknown: "Created by unknown user",
    edit: "Edit",
    delete: "Delete",
    deleteTitle: "Delete Carousel Slide?",
    deleteDescription: (title?: string) =>
      `Delete "${title ?? "this slide"}"? This action cannot be undone.`,
    deleteConfirm: "Delete Slide",
    cancel: "Cancel",
  },
  km: {
    error: "បញ្ហា",
    success: "ជោគជ័យ",
    loadTenantFailed: "មិនអាចផ្ទុកជម្រើសគេហទំព័របានទេ។",
    loadSlidesFailed: "មិនអាចផ្ទុកស្លាយការ៉ូសែលបានទេ",
    deleted: "បានលុបស្លាយការ៉ូសែល។",
    deleteFailed: "លុបស្លាយការ៉ូសែលមិនបាន",
    accessDenied: "គ្មានសិទ្ធិ៖ សិទ្ធិមិនគ្រប់គ្រាន់",
    title: "ការ៉ូសែលសាធារណៈ",
    description: "គ្រប់គ្រងស្លាយមុខសម្រាប់ទំព័រដើម ទំព័រប្រភេទ និងទំព័រប្រធានបទរង។",
    newSlide: "ស្លាយថ្មី",
    selectTenant: "ជ្រើសគេហទំព័រ",
    selectTenantDescription:
      "ការកែការ៉ូសែលរបស់អ្នកគ្រប់គ្រងកំពូលនឹងអនុវត្តលើគេហទំព័រសាធារណៈដែលបានជ្រើស។",
    selectTenantPlaceholder: "ជ្រើសគេហទំព័រ",
    allSlides: "ស្លាយទាំងអស់",
    slidesConfigured: (count: number) => `បានកំណត់ស្លាយ ${count}`,
    loadingSlides: "កំពុងផ្ទុកស្លាយ...",
    empty: "មិនទាន់មានស្លាយការ៉ូសែល",
    createFirst: "បង្កើតស្លាយដំបូង",
    active: "សកម្ម",
    inactive: "មិនសកម្ម",
    order: (order: number) => `លំដាប់ ${order}`,
    standard: "ស្តង់ដារ",
    wide: "ធំ",
    image: "រូបភាព",
    video: (provider?: string | null) => `វីដេអូ${provider ? `: ${provider}` : ""}`,
    homepage: "ទំព័រដើម",
    category: (slug?: string | null) => `ប្រភេទ៖ ${slug}`,
    topic: (category?: string | null, topic?: string | null) => `ប្រធានបទរង៖ ${category}/${topic}`,
    khmer: "ខ្មែរ",
    createdBy: (name: string) => `បង្កើតដោយ ${name}`,
    createdUnknown: "មិនស្គាល់អ្នកបង្កើត",
    edit: "កែ",
    delete: "លុប",
    deleteTitle: "លុបស្លាយការ៉ូសែល?",
    deleteDescription: (title?: string) =>
      `លុប "${title ?? "ស្លាយនេះ"}"? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteConfirm: "លុបស្លាយ",
    cancel: "បោះបង់",
  },
} as const;

export default function CarouselListPage() {
  const { locale } = useAdminLocale();
  const copy = carouselListCopy[locale];
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
        showErrorRef.current(copy.error, copy.loadTenantFailed);
      }
    };

    void loadTenants();

    return () => {
      isMounted = false;
    };
  }, [copy.error, copy.loadTenantFailed, isSuperAdmin]);

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
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.loadSlidesFailed
          : copy.loadSlidesFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [canAccessCarousel, copy.error, copy.loadSlidesFailed, isSuperAdmin, locale, permissionsLoading, selectedTenantId]);

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
        showSuccess(copy.success, copy.deleted);
      }
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.deleteFailed
          : copy.deleteFailed,
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {!permissionsLoading && !canAccessCarousel ? (
        <div className="text-sm text-red-600">
          {copy.accessDenied}
        </div>
      ) : (
      <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {copy.description}
          </p>
        </div>
        {(isSuperAdmin || hasAnyPermission([Permission.CREATE_CAROUSEL])) && (
          <Button asChild>
            <Link href="/carousel/new">
              <Plus className="mr-2 h-4 w-4" />
              {copy.newSlide}
            </Link>
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{copy.selectTenant}</CardTitle>
            <CardDescription>
              {copy.selectTenantDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
              className="flex h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">{copy.selectTenantPlaceholder}</option>
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
          <CardTitle>{copy.allSlides}</CardTitle>
          <CardDescription>{copy.slidesConfigured(slides.length)}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {copy.loadingSlides}
            </div>
          ) : slides.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                {copy.empty}
              </p>
              {(isSuperAdmin || hasAnyPermission([Permission.CREATE_CAROUSEL])) && (
                <Button asChild className="mt-4">
                  <Link href="/carousel/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {copy.createFirst}
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
                  <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                    {slide.mediaType === "VIDEO" && slide.videoProvider === "MP4" && slide.videoUrl ? (
                      <video
                        src={slide.videoUrl}
                        poster={slide.imageUrl || undefined}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                    ) : slide.imageUrl ? (
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title}
                        fill
                        sizes="144px"
                        unoptimized={shouldBypassImageOptimizer(slide.imageUrl)}
                        className="object-cover"
                      />
                    ) : slide.mediaType === "VIDEO" ? (
                      <PlayCircle className="h-7 w-7 text-slate-400" />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={slide.isActive ? "success" : "secondary"}>
                        {slide.isActive ? copy.active : copy.inactive}
                      </Badge>
                      <Badge variant="outline">{copy.order(slide.sortOrder)}</Badge>
                      <Badge variant="outline">
                        {slide.size === "STANDARD" ? copy.standard : copy.wide}
                      </Badge>
                      <Badge variant="outline">
                        {slide.mediaType === "VIDEO"
                          ? copy.video(slide.videoProvider)
                          : copy.image}
                      </Badge>
                      <Badge variant="outline">
                        {slide.placement === "HOME"
                          ? copy.homepage
                          : slide.placement === "CATEGORY"
                            ? copy.category(slide.categorySlug)
                            : copy.topic(slide.categorySlug, slide.topicSlug)}
                      </Badge>
                      {slide.titleKhmer && (
                        <Badge variant="outline">{copy.khmer}</Badge>
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
                        ? copy.createdBy(slide.createdBy.name)
                        : copy.createdUnknown}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:justify-center">
                    {(isSuperAdmin || hasAnyPermission([Permission.UPDATE_CAROUSEL])) && (
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={`/carousel/${slide.id}/edit?tenantId=${slide.tenantId}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {copy.edit}
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
                        {copy.delete}
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
        title={copy.deleteTitle}
        description={copy.deleteDescription(deleteTarget?.title)}
        confirmText={copy.deleteConfirm}
        cancelText={copy.cancel}
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
