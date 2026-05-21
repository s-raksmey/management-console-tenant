"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Loader2,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import { getAuthFetchHeaders, getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  CarouselSlide,
  CarouselSlideInput,
  M_CREATE_HOME_CAROUSEL_SLIDE,
  M_UPDATE_HOME_CAROUSEL_SLIDE,
} from "@/services/carousel.gql";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToastHelpers } from "@/components/ui/toast";
import { Q_CATEGORIES, type Category } from "@/services/category.gql";
import { Q_TOPICS, type Topic } from "@/services/topic.gql";
import { useAuth } from "@/contexts/AuthContext";
import { Tenant, TenantService } from "@/services/tenant.gql";

export type SlideForm = {
  placement: "HOME" | "CATEGORY" | "TOPIC";
  categorySlug: string;
  topicSlug: string;
  title: string;
  titleKhmer: string;
  subtitle: string;
  subtitleKhmer: string;
  imageUrl: string;
  linkUrl: string;
  ctaLabel: string;
  ctaLabelKhmer: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: SlideForm = {
  placement: "HOME",
  categorySlug: "",
  topicSlug: "",
  title: "",
  titleKhmer: "",
  subtitle: "",
  subtitleKhmer: "",
  imageUrl: "",
  linkUrl: "",
  ctaLabel: "",
  ctaLabelKhmer: "",
  sortOrder: "0",
  isActive: true,
};

function toForm(slide?: CarouselSlide | null): SlideForm {
  if (!slide) return emptyForm;

  return {
    placement: slide.placement,
    categorySlug: slide.categorySlug ?? "",
    topicSlug: slide.topicSlug ?? "",
    title: slide.title,
    titleKhmer: slide.titleKhmer ?? "",
    subtitle: slide.subtitle ?? "",
    subtitleKhmer: slide.subtitleKhmer ?? "",
    imageUrl: slide.imageUrl ?? "",
    linkUrl: slide.linkUrl ?? "",
    ctaLabel: slide.ctaLabel ?? "",
    ctaLabelKhmer: slide.ctaLabelKhmer ?? "",
    sortOrder: String(slide.sortOrder),
    isActive: slide.isActive,
  };
}

function toInput(form: SlideForm): CarouselSlideInput {
  return {
    placement: form.placement,
    categorySlug:
      form.placement === "HOME" ? null : form.categorySlug.trim() || null,
    topicSlug:
      form.placement === "TOPIC" ? form.topicSlug.trim() || null : null,
    title: form.title.trim(),
    titleKhmer: form.titleKhmer.trim() || null,
    subtitle: form.subtitle.trim() || null,
    subtitleKhmer: form.subtitleKhmer.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    linkUrl: form.linkUrl.trim() || null,
    ctaLabel: form.ctaLabel.trim() || null,
    ctaLabelKhmer: form.ctaLabelKhmer.trim() || null,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    isActive: form.isActive,
  };
}

type CarouselSlideFormProps = {
  slide?: CarouselSlide | null;
};

export function CarouselSlideForm({ slide }: CarouselSlideFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToastHelpers();
  const showErrorRef = useRef(showError);
  const [form, setForm] = useState<SlideForm>(() => toForm(slide));
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(slide?.tenantId ?? "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isEditing = !!slide;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const previewTitle = form.title.trim() || "Pulse News";
  const previewSubtitle =
    form.subtitle.trim() ||
    "Breaking news, insightful analysis, and stories that matter";

  const hasImage = useMemo(
    () => form.imageUrl.trim().length > 0,
    [form.imageUrl],
  );
  const availableTopics = useMemo(
    () => topics.filter((topic) => topic.category?.slug === form.categorySlug),
    [form.categorySlug, topics],
  );

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

  useEffect(() => {
    const loadPlacementOptions = async () => {
      if (isSuperAdmin && !selectedTenantId) {
        setCategories([]);
        setTopics([]);
        return;
      }

      setLoadingOptions(true);
      try {
        const client = getAuthenticatedGqlClient();
        if (isSuperAdmin && selectedTenantId) {
          client.setHeader("x-tenant-id", selectedTenantId);
        }
        const [categoryResult, topicResult] = await Promise.all([
          client.request<{ categories: Category[] }>(Q_CATEGORIES),
          client.request<{ topics: Topic[] }>(Q_TOPICS),
        ]);
        setCategories(categoryResult.categories ?? []);
        setTopics(topicResult.topics ?? []);
      } catch {
        showErrorRef.current("Error", "Failed to load category options.");
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadPlacementOptions();
  }, [isSuperAdmin, selectedTenantId]);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showError("Upload Error", "Please select an image file.");
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append(
        "options",
        JSON.stringify({
          folder: "carousel",
          maxWidth: 1920,
          maxHeight: 720,
          quality: 90,
        }),
      );

      const response = await fetch("/api/media/upload", {
        method: "POST",
        headers: {
          ...getAuthFetchHeaders(),
          ...(isSuperAdmin && selectedTenantId
            ? { "x-tenant-id": selectedTenantId }
            : {}),
        },
        body: payload,
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.file?.url) {
        throw new Error(data.message || "Upload failed");
      }

      setForm((current) => ({
        ...current,
        imageUrl: data.file.url,
      }));
      showSuccess("Image Uploaded", "Carousel image is ready.");
    } catch (error) {
      showError(
        "Upload Error",
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showError("Validation Error", "English title is required.");
      return;
    }

    if (form.placement !== "HOME" && !form.categorySlug) {
      showError("Validation Error", "Please select a category.");
      return;
    }

    if (form.placement === "TOPIC" && !form.topicSlug) {
      showError("Validation Error", "Please select a sub-category.");
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      showError("Validation Error", "Please select the tenant for this slide.");
      return;
    }

    setSaving(true);
    try {
      const client = getAuthenticatedGqlClient();
      if (isSuperAdmin && selectedTenantId) {
        client.setHeader("x-tenant-id", selectedTenantId);
      }
      const input = toInput(form);

      if (slide) {
        await client.request(M_UPDATE_HOME_CAROUSEL_SLIDE, {
          id: slide.id,
          input,
        });
        showSuccess("Success", "Carousel slide updated.");
      } else {
        await client.request(M_CREATE_HOME_CAROUSEL_SLIDE, { input });
        showSuccess("Success", "Carousel slide created.");
      }

      router.push("/carousel");
      router.refresh();
    } catch (error: any) {
      showError(
        "Error",
        error?.response?.errors?.[0]?.message ||
          "Failed to save carousel slide.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Slide" : "Create Slide"}</CardTitle>
          <CardDescription>
            Manage the copy, placement, destination link, display order, and
            image for one public carousel slide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSuperAdmin && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Label htmlFor="tenant">Tenant Website</Label>
                <select
                  id="tenant"
                  value={selectedTenantId}
                  onChange={(event) => {
                    setSelectedTenantId(event.target.value);
                    setForm((current) => ({
                      ...current,
                      categorySlug: "",
                      topicSlug: "",
                    }));
                  }}
                  disabled={isEditing}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} /{tenant.slug}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  This slide will be managed inside the selected tenant public website.
                  {selectedTenant ? ` Current tenant: ${selectedTenant.name}.` : ""}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="placement">Show On</Label>
                <select
                  id="placement"
                  value={form.placement}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      placement: event.target.value as SlideForm["placement"],
                      categorySlug:
                        event.target.value === "HOME"
                          ? ""
                          : current.categorySlug,
                      topicSlug:
                        event.target.value === "TOPIC" ? current.topicSlug : "",
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="HOME">Homepage</option>
                  <option value="CATEGORY">Category page</option>
                  <option value="TOPIC">Sub-category page</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.categorySlug}
                  disabled={form.placement === "HOME" || loadingOptions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categorySlug: event.target.value,
                      topicSlug: "",
                      linkUrl:
                        current.placement === "CATEGORY" && event.target.value
                          ? `/${event.target.value}`
                          : current.linkUrl,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.placement === "TOPIC" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="topic">Sub-category</Label>
                  <select
                    id="topic"
                    value={form.topicSlug}
                    disabled={!form.categorySlug}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        topicSlug: event.target.value,
                        linkUrl:
                          current.categorySlug && event.target.value
                            ? `/${current.categorySlug}/${event.target.value}`
                            : current.linkUrl,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select sub-category</option>
                    {availableTopics.map((topic) => (
                      <option key={topic.id} value={topic.slug}>
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">English Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title-khmer">Khmer Title</Label>
                <Input
                  id="title-khmer"
                  value={form.titleKhmer}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      titleKhmer: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subtitle">English Subtitle</Label>
                <Textarea
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subtitle: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle-khmer">Khmer Subtitle</Label>
                <Textarea
                  id="subtitle-khmer"
                  value={form.subtitleKhmer}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subtitleKhmer: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="link-url">Link URL</Label>
                <Input
                  id="link-url"
                  value={form.linkUrl}
                  placeholder="/world"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      linkUrl: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Input
                  id="sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cta-label">CTA Label</Label>
                <Input
                  id="cta-label"
                  value={form.ctaLabel}
                  placeholder="Read More"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ctaLabel: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-label-khmer">CTA Label Khmer</Label>
                <Input
                  id="cta-label-khmer"
                  value={form.ctaLabelKhmer}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ctaLabelKhmer: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={form.imageUrl}
                    placeholder="/uploads/carousel/image.jpg"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <label className="cursor-pointer">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="mr-2 h-4 w-4" />
                    )}
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleImageUpload(file);
                      }}
                    />
                  </label>
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Recommended size: 1920x720 or wider. Uploaded files are stored
                in /uploads/carousel.
              </p>
            </div>

            <label className="flex w-fit items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Show this slide publicly
            </label>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/carousel")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Update Slide" : "Create Slide"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How the slide will feel on the selected public page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-lg bg-slate-950">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt={previewTitle}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center bg-slate-100">
                  <ImageIcon className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-red-950/50" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-200">
                  Pulse News
                </p>
                <h2 className="line-clamp-2 text-2xl font-black">
                  {previewTitle}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">
                  {previewSubtitle}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
