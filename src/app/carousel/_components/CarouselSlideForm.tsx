"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Loader2,
  PlayCircle,
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
import { useAdminLocale } from "@/hooks/useAdminLocale";

export type SlideForm = {
  placement: "HOME" | "CATEGORY" | "TOPIC";
  categorySlug: string;
  topicSlug: string;
  title: string;
  titleKhmer: string;
  subtitle: string;
  subtitleKhmer: string;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  videoUrl: string;
  videoProvider: "MP4" | "YOUTUBE" | "FACEBOOK";
  linkUrl: string;
  ctaLabel: string;
  ctaLabelKhmer: string;
  size: "WIDE" | "STANDARD";
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
  mediaType: "IMAGE",
  videoUrl: "",
  videoProvider: "MP4",
  linkUrl: "",
  ctaLabel: "",
  ctaLabelKhmer: "",
  size: "WIDE",
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
    mediaType: slide.mediaType ?? "IMAGE",
    videoUrl: slide.videoUrl ?? "",
    videoProvider: slide.videoProvider ?? "MP4",
    linkUrl: slide.linkUrl ?? "",
    ctaLabel: slide.ctaLabel ?? "",
    ctaLabelKhmer: slide.ctaLabelKhmer ?? "",
    size: slide.size ?? "WIDE",
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
    mediaType: form.mediaType,
    videoUrl: form.mediaType === "VIDEO" ? form.videoUrl.trim() || null : null,
    videoProvider: form.mediaType === "VIDEO" ? form.videoProvider : null,
    linkUrl: form.linkUrl.trim() || null,
    ctaLabel: form.ctaLabel.trim() || null,
    ctaLabelKhmer: form.ctaLabelKhmer.trim() || null,
    size: form.size,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    isActive: form.isActive,
  };
}

function inferVideoProvider(url: string): SlideForm["videoProvider"] {
  if (/youtu\.be|youtube\.com/i.test(url)) return "YOUTUBE";
  if (/facebook\.com|fb\.watch/i.test(url)) return "FACEBOOK";
  return "MP4";
}

function getEmbedUrl(provider: SlideForm["videoProvider"], url: string) {
  if (!url.trim()) return "";

  if (provider === "YOUTUBE") {
    const directMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/i);
    const videoId = directMatch?.[1];
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=${videoId}`
      : url;
  }

  if (provider === "FACEBOOK") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=1&mute=1&show_text=0`;
  }

  return url;
}

type CarouselSlideFormProps = {
  slide?: CarouselSlide | null;
};

const carouselFormCopy = {
  en: {
    pulseNews: "Pulse News",
    defaultSubtitle: "Breaking news, insightful analysis, and stories that matter",
    error: "Error",
    success: "Success",
    uploadError: "Upload Error",
    validationError: "Validation Error",
    loadTenantFailed: "Failed to load sub-tenant options.",
    loadCategoryFailed: "Failed to load category options.",
    selectImage: "Please select an image file.",
    selectMp4: "Please select an MP4 video file.",
    uploadFailed: "Upload failed",
    imageUploaded: "Image Uploaded",
    videoUploaded: "Video Uploaded",
    imageReady: "Carousel image is ready.",
    videoReady: "Carousel video is ready.",
    mediaUploadFailed: "Failed to upload media.",
    titleRequired: "English title is required.",
    categoryRequired: "Please select a category.",
    topicRequired: "Please select a sub-category.",
    tenantRequired: "Please select the sub-tenant for this slide.",
    videoRequired: "Please add an MP4, YouTube, or Facebook video URL.",
    slideUpdated: "Carousel slide updated.",
    slideCreated: "Carousel slide created.",
    saveFailed: "Failed to save carousel slide.",
    editSlide: "Edit Slide",
    createSlide: "Create Slide",
    formDescription:
      "Manage the copy, placement, destination link, display order, and image or video media for one public carousel slide.",
    tenantWebsite: "Sub-tenant Website",
    selectTenant: "Select sub-tenant",
    tenantHelp: (name?: string) =>
      `This slide will be managed inside the selected sub-tenant public website.${name ? ` Current sub-tenant: ${name}.` : ""}`,
    showOn: "Show On",
    homepage: "Homepage",
    categoryPage: "Category page",
    topicPage: "Sub-category page",
    category: "Category",
    selectCategory: "Select category",
    topic: "Sub-category",
    selectTopic: "Select sub-category",
    englishTitle: "English Title",
    khmerTitle: "Khmer Title",
    englishSubtitle: "English Subtitle",
    khmerSubtitle: "Khmer Subtitle",
    displaySize: "Display Size",
    wideHero: "Wide hero",
    standardBanner: "Standard banner",
    sizeHelp: "Wide spans the page. Standard keeps the carousel inside a contained banner.",
    linkUrl: "Link URL",
    sortOrder: "Sort Order",
    ctaLabel: "CTA Label",
    ctaLabelKhmer: "CTA Label Khmer",
    readMore: "Read More",
    carouselMedia: "Carousel Media",
    image: "Image",
    video: "Video",
    posterImageUrl: "Poster Image URL",
    imageUrl: "Image URL",
    uploadImage: "Upload Image",
    videoSource: "Video Source",
    mp4Source: "MP4 upload / URL",
    videoUrl: "Video URL",
    uploadMp4: "Upload MP4",
    mediaHelp:
      "Recommended image: 1920x720 for wide, 1200x520 for standard. MP4 videos should be muted-friendly and under 100MB.",
    showPublicly: "Show this slide publicly",
    cancel: "Cancel",
    updateSlide: "Update Slide",
    preview: "Preview",
    previewDescription: "How the slide will feel on the selected public page.",
  },
  km: {
    pulseNews: "Pulse News",
    defaultSubtitle: "ព័ត៌មានទាន់ហេតុការណ៍ ការវិភាគ និងរឿងរ៉ាវសំខាន់ៗ",
    error: "បញ្ហា",
    success: "ជោគជ័យ",
    uploadError: "បញ្ហាផ្ទុកឡើង",
    validationError: "បញ្ហាពិនិត្យទិន្នន័យ",
    loadTenantFailed: "មិនអាចផ្ទុកជម្រើសគេហទំព័របានទេ។",
    loadCategoryFailed: "មិនអាចផ្ទុកជម្រើសប្រភេទបានទេ។",
    selectImage: "សូមជ្រើសរូបភាពមួយ។",
    selectMp4: "សូមជ្រើសវីដេអូ MP4 មួយ។",
    uploadFailed: "ផ្ទុកឡើងមិនបាន",
    imageUploaded: "បានផ្ទុករូបភាពឡើង",
    videoUploaded: "បានផ្ទុកវីដេអូឡើង",
    imageReady: "រូបភាពការ៉ូសែលរួចរាល់ហើយ។",
    videoReady: "វីដេអូការ៉ូសែលរួចរាល់ហើយ។",
    mediaUploadFailed: "ផ្ទុកមេឌៀឡើងមិនបាន។",
    titleRequired: "ត្រូវបញ្ចូលចំណងជើងអង់គ្លេស។",
    categoryRequired: "សូមជ្រើសប្រភេទ។",
    topicRequired: "សូមជ្រើសប្រធានបទរង។",
    tenantRequired: "សូមជ្រើសគេហទំព័រសម្រាប់ស្លាយនេះ។",
    videoRequired: "សូមបញ្ចូល URL វីដេអូ MP4, YouTube ឬ Facebook។",
    slideUpdated: "បានកែប្រែស្លាយការ៉ូសែល។",
    slideCreated: "បានបង្កើតស្លាយការ៉ូសែល។",
    saveFailed: "រក្សាទុកស្លាយការ៉ូសែលមិនបាន។",
    editSlide: "កែស្លាយ",
    createSlide: "បង្កើតស្លាយ",
    formDescription:
      "គ្រប់គ្រងអត្ថបទ ទីតាំងតំណ លំដាប់បង្ហាញ និងមេឌៀរូបភាព ឬវីដេអូសម្រាប់ស្លាយការ៉ូសែល។",
    tenantWebsite: "គេហទំព័រ",
    selectTenant: "ជ្រើសគេហទំព័រ",
    tenantHelp: (name?: string) =>
      `ស្លាយនេះនឹងត្រូវគ្រប់គ្រងក្នុងគេហទំព័រសាធារណៈដែលបានជ្រើស។${name ? ` គេហទំព័របច្ចុប្បន្ន៖ ${name}។` : ""}`,
    showOn: "បង្ហាញលើ",
    homepage: "ទំព័រដើម",
    categoryPage: "ទំព័រប្រភេទ",
    topicPage: "ទំព័រប្រធានបទរង",
    category: "ប្រភេទ",
    selectCategory: "ជ្រើសប្រភេទ",
    topic: "ប្រធានបទរង",
    selectTopic: "ជ្រើសប្រធានបទរង",
    englishTitle: "ចំណងជើងអង់គ្លេស",
    khmerTitle: "ចំណងជើងខ្មែរ",
    englishSubtitle: "ចំណងជើងរងអង់គ្លេស",
    khmerSubtitle: "ចំណងជើងរងខ្មែរ",
    displaySize: "ទំហំបង្ហាញ",
    wideHero: "ផ្ទៃមុខធំ",
    standardBanner: "បដាស្តង់ដារ",
    sizeHelp: "ផ្ទៃមុខធំបង្ហាញពេញទំព័រ។ បដាស្តង់ដាររក្សាការ៉ូសែលក្នុងបដាដែលបានកំណត់។",
    linkUrl: "URL តំណ",
    sortOrder: "លំដាប់",
    ctaLabel: "ស្លាកប៊ូតុង",
    ctaLabelKhmer: "ស្លាកប៊ូតុងខ្មែរ",
    readMore: "អានបន្ថែម",
    carouselMedia: "មេឌៀការ៉ូសែល",
    image: "រូបភាព",
    video: "វីដេអូ",
    posterImageUrl: "URL រូបភាពគម្រប",
    imageUrl: "URL រូបភាព",
    uploadImage: "ផ្ទុករូបភាពឡើង",
    videoSource: "ប្រភពវីដេអូ",
    mp4Source: "ផ្ទុក MP4 ឡើង / URL",
    videoUrl: "Video URL",
    uploadMp4: "ផ្ទុក MP4 ឡើង",
    mediaHelp:
      "រូបភាពណែនាំ៖ 1920x720 សម្រាប់ទំហំធំ, 1200x520 សម្រាប់ស្តង់ដារ។ វីដេអូ MP4 គួរតែដំណើរការល្អពេលបិទសំឡេង និងក្រោម 100MB។",
    showPublicly: "បង្ហាញស្លាយនេះជាសាធារណៈ",
    cancel: "បោះបង់",
    updateSlide: "កែស្លាយ",
    preview: "មើលជាមុន",
    previewDescription: "របៀបដែលស្លាយនឹងបង្ហាញលើទំព័រសាធារណៈដែលបានជ្រើស។",
  },
} as const;

export function CarouselSlideForm({ slide }: CarouselSlideFormProps) {
  const { locale } = useAdminLocale();
  const copy = carouselFormCopy[locale];
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
  const previewTitle = form.title.trim() || copy.pulseNews;
  const previewSubtitle =
    form.subtitle.trim() ||
    copy.defaultSubtitle;

  const hasImage = useMemo(
    () => form.imageUrl.trim().length > 0,
    [form.imageUrl],
  );
  const hasVideo = form.mediaType === "VIDEO" && form.videoUrl.trim().length > 0;
  const embedUrl = getEmbedUrl(form.videoProvider, form.videoUrl);
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
        showErrorRef.current(copy.error, copy.loadTenantFailed);
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
        showErrorRef.current(copy.error, copy.loadCategoryFailed);
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadPlacementOptions();
  }, [isSuperAdmin, selectedTenantId]);

  const handleMediaUpload = async (file: File, mediaType: "image" | "video") => {
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      showError(copy.uploadError, copy.selectImage);
      return;
    }

    if (mediaType === "video" && file.type !== "video/mp4") {
      showError(copy.uploadError, copy.selectMp4);
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
          ...(mediaType === "image"
            ? {
                maxWidth: 1920,
                maxHeight: 720,
                quality: 90,
              }
            : {}),
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
        throw new Error(locale === "en" ? data.message || copy.uploadFailed : copy.uploadFailed);
      }

      setForm((current) => ({
        ...current,
        ...(mediaType === "image"
          ? { imageUrl: data.file.url }
          : {
              mediaType: "VIDEO",
              videoProvider: "MP4",
              videoUrl: data.file.url,
            }),
      }));
      showSuccess(
        mediaType === "image" ? copy.imageUploaded : copy.videoUploaded,
        mediaType === "image" ? copy.imageReady : copy.videoReady,
      );
    } catch (error) {
      showError(
        copy.uploadError,
        locale === "en" && error instanceof Error ? error.message : copy.mediaUploadFailed,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      showError(copy.validationError, copy.titleRequired);
      return;
    }

    if (form.placement !== "HOME" && !form.categorySlug) {
      showError(copy.validationError, copy.categoryRequired);
      return;
    }

    if (form.placement === "TOPIC" && !form.topicSlug) {
      showError(copy.validationError, copy.topicRequired);
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      showError(copy.validationError, copy.tenantRequired);
      return;
    }

    if (form.mediaType === "VIDEO" && !form.videoUrl.trim()) {
      showError(copy.validationError, copy.videoRequired);
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
        showSuccess(copy.success, copy.slideUpdated);
      } else {
        await client.request(M_CREATE_HOME_CAROUSEL_SLIDE, { input });
        showSuccess(copy.success, copy.slideCreated);
      }

      router.push("/carousel");
      router.refresh();
    } catch (error: any) {
      showError(
        copy.error,
        locale === "en"
          ? error?.response?.errors?.[0]?.message || copy.saveFailed
          : copy.saveFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? copy.editSlide : copy.createSlide}</CardTitle>
          <CardDescription>
            {copy.formDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSuperAdmin && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Label htmlFor="tenant">{copy.tenantWebsite}</Label>
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
                  <option value="">{copy.selectTenant}</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} /{tenant.slug}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  {copy.tenantHelp(selectedTenant?.name)}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="placement">{copy.showOn}</Label>
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
                  <option value="HOME">{copy.homepage}</option>
                  <option value="CATEGORY">{copy.categoryPage}</option>
                  <option value="TOPIC">{copy.topicPage}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{copy.category}</Label>
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
                  <option value="">{copy.selectCategory}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.placement === "TOPIC" && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="topic">{copy.topic}</Label>
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
                    <option value="">{copy.selectTopic}</option>
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
                <Label htmlFor="title">{copy.englishTitle}</Label>
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
                <Label htmlFor="title-khmer">{copy.khmerTitle}</Label>
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
                <Label htmlFor="subtitle">{copy.englishSubtitle}</Label>
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
                <Label htmlFor="subtitle-khmer">{copy.khmerSubtitle}</Label>
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
                <Label htmlFor="size">{copy.displaySize}</Label>
                <select
                  id="size"
                  value={form.size}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      size: event.target.value as SlideForm["size"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="WIDE">{copy.wideHero}</option>
                  <option value="STANDARD">{copy.standardBanner}</option>
                </select>
                <p className="text-xs text-slate-500">
                  {copy.sizeHelp}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-url">{copy.linkUrl}</Label>
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
                <Label htmlFor="sort-order">{copy.sortOrder}</Label>
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
                <Label htmlFor="cta-label">{copy.ctaLabel}</Label>
                <Input
                  id="cta-label"
                  value={form.ctaLabel}
                  placeholder={copy.readMore}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ctaLabel: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-label-khmer">{copy.ctaLabelKhmer}</Label>
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

            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <Label htmlFor="media-type">{copy.carouselMedia}</Label>
                <select
                  id="media-type"
                  value={form.mediaType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mediaType: event.target.value as SlideForm["mediaType"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="IMAGE">{copy.image}</option>
                  <option value="VIDEO">{copy.video}</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="image-url">
                    {form.mediaType === "VIDEO" ? copy.posterImageUrl : copy.imageUrl}
                  </Label>
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
                    {copy.uploadImage}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleMediaUpload(file, "image");
                      }}
                    />
                  </label>
                </Button>
              </div>
              {form.mediaType === "VIDEO" && (
                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="video-provider">{copy.videoSource}</Label>
                    <select
                      id="video-provider"
                      value={form.videoProvider}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          videoProvider: event.target.value as SlideForm["videoProvider"],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="MP4">{copy.mp4Source}</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="FACEBOOK">Facebook</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="video-url">{copy.videoUrl}</Label>
                    <Input
                      id="video-url"
                      value={form.videoUrl}
                      placeholder={
                        form.videoProvider === "MP4"
                          ? "/uploads/carousel/video.mp4"
                          : form.videoProvider === "YOUTUBE"
                            ? "https://www.youtube.com/watch?v=..."
                            : "https://www.facebook.com/.../videos/..."
                      }
                      onChange={(event) => {
                        const nextUrl = event.target.value;
                        setForm((current) => ({
                          ...current,
                          videoUrl: nextUrl,
                          videoProvider:
                            current.videoProvider === "MP4" && /^https?:\/\//.test(nextUrl)
                              ? inferVideoProvider(nextUrl)
                              : current.videoProvider,
                        }));
                      }}
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
                      {copy.uploadMp4}
                      <input
                        type="file"
                        accept="video/mp4"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void handleMediaUpload(file, "video");
                        }}
                      />
                    </label>
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {copy.mediaHelp}
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
              {copy.showPublicly}
            </label>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/carousel")}
              >
                <X className="mr-2 h-4 w-4" />
                {copy.cancel}
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditing ? copy.updateSlide : copy.createSlide}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{copy.preview}</CardTitle>
            <CardDescription>
              {copy.previewDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative overflow-hidden bg-slate-950 ${
                form.size === "STANDARD" ? "rounded-xl" : "rounded-lg"
              }`}
            >
              {hasVideo && form.videoProvider === "MP4" ? (
                <video
                  src={form.videoUrl}
                  poster={form.imageUrl || undefined}
                  className={`w-full object-cover ${
                    form.size === "STANDARD" ? "h-48" : "h-64"
                  }`}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : hasVideo ? (
                <iframe
                  src={embedUrl}
                  title={previewTitle}
                  className={`w-full border-0 ${
                    form.size === "STANDARD" ? "h-48" : "h-64"
                  }`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt={previewTitle}
                  className={`w-full object-cover ${
                    form.size === "STANDARD" ? "h-48" : "h-64"
                  }`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center bg-slate-100 ${
                    form.size === "STANDARD" ? "h-48" : "h-64"
                  }`}
                >
                  {form.mediaType === "VIDEO" ? (
                    <PlayCircle className="h-10 w-10 text-slate-400" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-400" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-red-950/50" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-200">
                  {copy.pulseNews}
                </p>
                <h2
                  className={`line-clamp-2 font-black ${
                    form.size === "STANDARD" ? "text-xl" : "text-2xl"
                  }`}
                >
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
