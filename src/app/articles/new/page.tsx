"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useEffect } from "react";

import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { M_UPSERT_ARTICLE } from "@/services/article.gql";
import { useArticleMutations } from "@/hooks/useGraphQL";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useTopics } from "@/hooks/useTopics";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenant } from "@/contexts/TenantContext";
import { getTenantDisplayName } from "@/lib/tenant-display";
import { ArticleStatusSelect } from "@/components/forms/ArticleStatusSelect";
import { ArticleStatus } from "@/utils/articlePermissions";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { SeoPreviewCard } from "@/components/articles/seo-preview-card";
import { useToastHelpers } from "@/components/ui/toast";
import { safeArticleErrorMessage } from "@/utils/articleErrors";
import {
  ArticleReadinessCard,
  getArticleReadinessIssues,
  hasMeaningfulArticleContent,
} from "@/components/articles/article-readiness-card";
import { useAdminLocale } from "@/hooks/useAdminLocale";

import type { OutputData } from "@editorjs/editorjs";
import type { NewsEditorRef } from "@/components/editor/news-editor";

/* -------------------------
   Editor (client only)
------------------------- */
const NewsEditor = dynamic(
  () => import("@/components/editor/news-editor"),
  { ssr: false }
);

/* -------------------------
   Helpers
------------------------- */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTopic(value: string) {
  return slugify(value);
}

function parseTagSlugs(value: string) {
  return Array.from(new Set(value.split(",").map(slugify).filter(Boolean)));
}

const articleCopy = {
  en: {
    selectCategory: "Please select a category.",
    invalidCategory: (slug: string) => `Category "${slug}" does not exist in the database. Please select a valid category.`,
    beforeReview: (issues: string[]) => `Before submitting for review: ${issues.join(", ")}.`,
    beforePublish: (issues: string[]) => `Before publishing: ${issues.join(", ")}.`,
    submitReviewFailed: "Failed to submit for review.",
    breakingRequested: "Breaking News Requested",
    breakingRequestedDescription: "The request was submitted for review.",
    breakingRequestFailed: "Breaking News Request Failed",
    breakingServerRejected: "The server did not accept the request.",
    breakingUnable: "Unable to submit the request.",
    title: "New Article",
    description: "Draft first, publish when ready.",
    publishing: "Publishing...",
    publish: "Publish",
    saving: "Saving...",
    save: "Save",
    titleLabel: "Title",
    titlePlaceholder: "Article title",
    slug: "Slug",
    author: "Author",
    authorPlaceholder: "e.g. John Doe",
    excerpt: "Excerpt",
    excerptPlaceholder: "Short description for cards and SEO.",
    category: "Category",
    selectCategoryOption: "— Select Category —",
    loadingCategories: "Loading categories...",
    topicRequired: "Subcategory *",
    noTopic: "— Select subcategory —",
    selectTopic: "Please select a subcategory.",
    noTopics: "This category has no subcategories. Add one before creating an article.",
    loadingTopics: "Loading topics...",
    selectCategoryFirst: "Select a category first",
    tags: "Tags",
    tagsHelp: "Separate tags with commas.",
    schedulePublishing: "Schedule publishing",
    scheduleHelp: "Saving with a future time keeps the article as a draft until publication.",
    scheduleButton: "Schedule",
    scheduledFor: "Scheduled for",
    categoryError: "Category Error",
    topicsError: "Topics Error",
    validationError: "Validation Error",
    saveFailed: "Unable to save article.",
    publishFailed: "Unable to publish article.",
    scheduleFailed: "Unable to schedule article.",
    markBreaking: "Mark as breaking news",
    markBreakingTitle: "Mark this article as breaking news",
    requestBreaking: "Request as breaking news",
    requestBreakingTitle: "Request this article to be marked as breaking news",
    reviewHint: "(Editors/Admins will review)",
    whyBreaking: "Why is this breaking news?",
    breakingReasonPlaceholder: "Explain why this article should be marked as breaking news...",
    breakingReasonHelp: "Admins and editors will review your request and decide if this article qualifies as breaking news.",
  },
  km: {
    selectCategory: "សូមជ្រើសប្រភេទ។",
    invalidCategory: (slug: string) => `ប្រភេទ "${slug}" មិនមានក្នុងមូលដ្ឋានទិន្នន័យទេ។ សូមជ្រើសប្រភេទត្រឹមត្រូវ។`,
    beforeReview: (issues: string[]) => `មុនផ្ញើទៅពិនិត្យ: ${issues.join(", ")}។`,
    beforePublish: (issues: string[]) => `មុនផ្សព្វផ្សាយ: ${issues.join(", ")}។`,
    submitReviewFailed: "មិនអាចផ្ញើទៅពិនិត្យបានទេ។",
    breakingRequested: "បានស្នើព័ត៌មានទាន់ហេតុការណ៍",
    breakingRequestedDescription: "សំណើត្រូវបានផ្ញើទៅពិនិត្យ។",
    breakingRequestFailed: "ស្នើព័ត៌មានទាន់ហេតុការណ៍មិនបាន",
    breakingServerRejected: "ម៉ាស៊ីនមេមិនទទួលសំណើនេះទេ។",
    breakingUnable: "មិនអាចផ្ញើសំណើបានទេ។",
    title: "អត្ថបទថ្មី",
    description: "រក្សាជាព្រាងមុន ហើយផ្សព្វផ្សាយពេលរួចរាល់។",
    publishing: "កំពុងផ្សព្វផ្សាយ...",
    publish: "ផ្សព្វផ្សាយ",
    saving: "កំពុងរក្សាទុក...",
    save: "រក្សាទុក",
    titleLabel: "ចំណងជើង",
    titlePlaceholder: "ចំណងជើងអត្ថបទ",
    slug: "ស្លាក URL",
    author: "អ្នកនិពន្ធ",
    authorPlaceholder: "ឧ. John Doe",
    excerpt: "សេចក្ដីសង្ខេប",
    excerptPlaceholder: "ពណ៌នាខ្លីសម្រាប់កាត និង SEO។",
    category: "ប្រភេទ",
    selectCategoryOption: "— ជ្រើសប្រភេទ —",
    loadingCategories: "កំពុងផ្ទុកប្រភេទ...",
    topicRequired: "ប្រភេទរង *",
    noTopic: "— ជ្រើសប្រភេទរង —",
    selectTopic: "សូមជ្រើសប្រភេទរង។",
    noTopics: "ប្រភេទនេះមិនទាន់មានប្រភេទរងទេ។ សូមបន្ថែមប្រភេទរងមុនបង្កើតអត្ថបទ។",
    loadingTopics: "កំពុងផ្ទុកប្រធានបទ...",
    selectCategoryFirst: "ជ្រើសប្រភេទជាមុនសិន",
    tags: "ស្លាក",
    tagsHelp: "បំបែកស្លាកដោយសញ្ញាក្បៀស។",
    schedulePublishing: "កំណត់ពេលផ្សព្វផ្សាយ",
    scheduleHelp: "រក្សាទុកជាមួយពេលអនាគត នឹងរក្សាអត្ថបទជាព្រាងរហូតដល់ពេលផ្សព្វផ្សាយ។",
    scheduleButton: "កំណត់ពេល",
    scheduledFor: "បានកំណត់ពេល",
    categoryError: "បញ្ហាប្រភេទ",
    topicsError: "បញ្ហាប្រធានបទ",
    validationError: "ទិន្នន័យមិនត្រឹមត្រូវ",
    saveFailed: "មិនអាចរក្សាទុកអត្ថបទបានទេ។",
    publishFailed: "មិនអាចបោះពុម្ពអត្ថបទបានទេ។",
    scheduleFailed: "មិនអាចកំណត់ពេលអត្ថបទបានទេ។",
    markBreaking: "កំណត់ជាព័ត៌មានទាន់ហេតុការណ៍",
    markBreakingTitle: "កំណត់អត្ថបទនេះជាព័ត៌មានទាន់ហេតុការណ៍",
    requestBreaking: "ស្នើជាព័ត៌មានទាន់ហេតុការណ៍",
    requestBreakingTitle: "ស្នើឱ្យអត្ថបទនេះកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍",
    reviewHint: "(អ្នកកែសម្រួល/អ្នកគ្រប់គ្រងនឹងពិនិត្យ)",
    whyBreaking: "ហេតុអ្វីវាជាព័ត៌មានទាន់ហេតុការណ៍?",
    breakingReasonPlaceholder: "ពន្យល់ថាហេតុអ្វីអត្ថបទនេះគួរត្រូវបានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍...",
    breakingReasonHelp: "អ្នកគ្រប់គ្រង និងអ្នកកែសម្រួលនឹងពិនិត្យសំណើរបស់អ្នក ហើយសម្រេចថាអត្ថបទនេះស័ក្តិសមជាព័ត៌មានទាន់ហេតុការណ៍ឬទេ។",
  },
};

/* =========================
   Page
========================= */
export default function NewArticlePage() {
  const { locale } = useAdminLocale();
  const copy = articleCopy[locale];
  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const editorRef = useRef<NewsEditorRef>(null);
  const { performWorkflowAction, requestBreakingNews } = useArticleMutations();
  const { showSuccess, showError } = useToastHelpers();
  
  // Category and topic hooks
  const { categories, loading: categoriesLoading, error: categoriesError, isValidCategory } = useCategories();
  const { topics, loading: topicsLoading, error: topicsError, loadTopicsForCategory, clearTopics } = useTopics();
  
  // Permission hooks
  const { hasPermission } = usePermissions();
  const { activeTenant } = useTenant();
  const publicBaseUrl = useMemo(() => {
    const primarySite =
      activeTenant?.sites.find((site) => site.isPrimary) ||
      activeTenant?.sites[0];

    return primarySite?.publicBaseUrl ?? null;
  }, [activeTenant]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");

  /* ✅ ADDED */
  const [authorName, setAuthorName] = useState("");

  const [categorySlug, setCategorySlug] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [tags, setTags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [status, setStatus] = useState<ArticleStatus>("DRAFT");
  const [isBreaking, setIsBreaking] = useState(false);
  const [shouldRequestBreakingNews, setShouldRequestBreakingNews] = useState(false);
  const [breakingNewsReason, setBreakingNewsReason] = useState("");
  const [hasBodyContent, setHasBodyContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdArticleId, setCreatedArticleId] = useState<string | undefined>();

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !categorySlug) {
      setCategorySlug(categories[0].slug);
    }
  }, [categories, categorySlug]);

  // Load topics when category changes
  useEffect(() => {
    if (categorySlug) {
      loadTopicsForCategory(categorySlug);
      setTopic(""); // Reset topic when category changes
    } else {
      clearTopics();
    }
  }, [categorySlug, loadTopicsForCategory, clearTopics]);

  /* -------------------------
     Save
  ------------------------- */
  async function save(scheduleOnly = false) {
    if (!title) return;

    // Validate category is selected and exists in database
    setValidationError(null);
    if (!categorySlug) {
      setValidationError(copy.selectCategory);
      return;
    }
    if (!topic || !topics.some((item) => item.slug === normalizeTopic(topic))) {
      setValidationError(copy.selectTopic);
      return;
    }
    if (!categoriesLoading && !isValidCategory(categorySlug)) {
      setValidationError(copy.invalidCategory(categorySlug));
      return;
    }

    setSaving(true);
    try {
      const contentJson: OutputData =
        (await editorRef.current?.save()) ?? { blocks: [] };

      const shouldSubmitForReview = !scheduleOnly && status === 'REVIEW';
      if (shouldSubmitForReview || scheduleOnly) {
        const readinessIssues = getArticleReadinessIssues({
          title,
          slug: slug || slugify(title),
          excerpt,
          categorySlug,
          hasBodyContent: hasMeaningfulArticleContent(contentJson),
        }, locale);

        if (readinessIssues.length > 0) {
          setValidationError(copy.beforeReview(readinessIssues));
          return;
        }
      }

      const statusForSave = scheduleOnly || shouldSubmitForReview ? 'DRAFT' : status;

      const response = await client.request(M_UPSERT_ARTICLE, {
        id: createdArticleId,
        input: {
          title,
          slug: slug || slugify(title),
          excerpt,
          authorName,
          categorySlug,
          topic: topic ? normalizeTopic(topic) : null,
          tagSlugs: parseTagSlugs(tags),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: statusForSave,
          isBreaking,
          contentJson,
        },
      });
      if (response?.upsertArticle?.id) setCreatedArticleId(response.upsertArticle.id);

      if (shouldSubmitForReview && response?.upsertArticle?.id) {
        const result = await performWorkflowAction({
          articleId: response.upsertArticle.id,
          action: 'SUBMIT_FOR_REVIEW',
        });

        if (!result?.performWorkflowAction?.success) {
          const message = locale === "en" ? result?.performWorkflowAction?.message || copy.submitReviewFailed : copy.submitReviewFailed;
          throw new Error(message);
        }
      }

      // If user requested breaking news, send the request after creating article
      if (shouldRequestBreakingNews && response?.upsertArticle?.id) {
        try {
          const breakingResponse = await requestBreakingNews(response.upsertArticle.id, breakingNewsReason);
          if (breakingResponse?.requestBreakingNews?.id) {
            showSuccess(copy.breakingRequested, copy.breakingRequestedDescription);
          } else {
            showError(copy.breakingRequestFailed, copy.breakingServerRejected);
          }
        } catch (err) {
          console.warn('Breaking news request submission failed:', err);
          showError(copy.breakingRequestFailed, copy.breakingUnable);
          // Don't block the article save if breaking news request fails
        }
      }

      window.location.href = "/articles";
    } catch (error) {
      const fallback = scheduleOnly ? copy.scheduleFailed : copy.saveFailed;
      setValidationError(safeArticleErrorMessage(error, fallback));
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------
     Publish (for admins/editors)
  ------------------------- */
  async function publish() {
    if (!title) return;

    // Validate category is selected and exists in database
    setValidationError(null);
    if (!categorySlug) {
      setValidationError(copy.selectCategory);
      return;
    }
    if (!topic || !topics.some((item) => item.slug === normalizeTopic(topic))) {
      setValidationError(copy.selectTopic);
      return;
    }
    if (!categoriesLoading && !isValidCategory(categorySlug)) {
      setValidationError(copy.invalidCategory(categorySlug));
      return;
    }

    setSaving(true);
    try {
      const contentJson: OutputData =
        (await editorRef.current?.save()) ?? { blocks: [] };
      const readinessIssues = getArticleReadinessIssues({
        title,
        slug: slug || slugify(title),
        excerpt,
        categorySlug,
        hasBodyContent: hasMeaningfulArticleContent(contentJson),
      }, locale);

      if (readinessIssues.length > 0) {
        setValidationError(copy.beforePublish(readinessIssues));
        return;
      }

      const response = await client.request(M_UPSERT_ARTICLE, {
        id: createdArticleId,
        input: {
          title,
          slug: slug || slugify(title),
          excerpt,
          authorName,
          categorySlug,
          topic: topic ? normalizeTopic(topic) : null,
          tagSlugs: parseTagSlugs(tags),
          scheduledAt: null,
          status: "PUBLISHED", // Directly publish
          isBreaking,
          contentJson,
        },
      });
      if (response?.upsertArticle?.id) setCreatedArticleId(response.upsertArticle.id);

      // If user requested breaking news, send the request after creating article
      if (shouldRequestBreakingNews && response?.upsertArticle?.id) {
        try {
          const breakingResponse = await requestBreakingNews(response.upsertArticle.id, breakingNewsReason);
          if (breakingResponse?.requestBreakingNews?.id) {
            showSuccess(copy.breakingRequested, copy.breakingRequestedDescription);
          } else {
            showError(copy.breakingRequestFailed, copy.breakingServerRejected);
          }
        } catch (err) {
          console.warn('Breaking news request submission failed:', err);
          showError(copy.breakingRequestFailed, copy.breakingUnable);
          // Don't block the article save if breaking news request fails
        }
      }

      window.location.href = "/articles";
    } catch (error) {
      setValidationError(safeArticleErrorMessage(error, copy.publishFailed));
    } finally {
      setSaving(false);
    }
  }



  return (
    <PermissionGuard permissions={[Permission.CREATE_ARTICLE]} showError>
    <main className="space-y-4">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="text-sm text-slate-600">
            {copy.description}
          </p>
        </div>

        <div className="flex gap-2">
          {scheduledAt && hasPermission(Permission.PUBLISH_ARTICLE) && (
            <Button onClick={() => save(true)} disabled={saving || !title}>
              {saving ? copy.saving : copy.scheduleButton}
            </Button>
          )}
          {hasPermission(Permission.PUBLISH_ARTICLE) && (
            <Button onClick={publish} disabled={saving || !title || !!scheduledAt}>
              {saving ? copy.publishing : copy.publish}
            </Button>
          )}
          {!scheduledAt && <Button onClick={() => save()} disabled={saving || !title}>
            {saving ? copy.saving : copy.save}
          </Button>}
        </div>
      </div>

      {/* ---------- Meta ---------- */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.titleLabel}</label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder={copy.titlePlaceholder}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.slug}</label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-title"
          />
        </div>

        {/* ✅ AUTHOR FIELD — ADDED ONLY */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.author}</label>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={copy.authorPlaceholder}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.excerpt}</label>
          <Input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder={copy.excerptPlaceholder}
          />
        </div>

        <div className="grid items-start gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              {copy.category}
            </label>
            <select
              className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setTopic("");
              }}
              disabled={categoriesLoading}
            >
              <option value="">{copy.selectCategoryOption}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <p className="text-xs text-slate-500">{copy.loadingCategories}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              {copy.topicRequired}
            </label>
            <select
              className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={topicsLoading || !categorySlug || topics.length === 0}
              required
            >
              <option value="">{copy.noTopic}</option>
              {topics.map((topicItem) => (
                <option key={topicItem.id} value={topicItem.slug}>
                  {topicItem.title}
                </option>
              ))}
            </select>
            {topicsLoading && (
              <p className="text-xs text-slate-500">{copy.loadingTopics}</p>
            )}
            {!categorySlug && (
              <p className="text-xs text-slate-500">{copy.selectCategoryFirst}</p>
            )}
            {!topicsLoading && categorySlug && topics.length === 0 && !topicsError && (
              <p className="text-xs text-amber-700">{copy.noTopics}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.tags}</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="politics, election, cambodia"
          />
          <p className="text-xs text-slate-500">{copy.tagsHelp}</p>
        </div>

        {hasPermission(Permission.PUBLISH_ARTICLE) && (
          <div className="grid gap-2 sm:max-w-sm">
            <label className="text-xs font-semibold text-slate-600">{copy.schedulePublishing}</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-slate-500">{copy.scheduleHelp}</p>
            {scheduledAt && !Number.isNaN(new Date(scheduledAt).getTime()) && (
              <p className="text-xs font-medium text-blue-700">
                {copy.scheduledFor} {new Intl.DateTimeFormat(locale === "en" ? "en" : "km", { dateStyle: "medium", timeStyle: "short" }).format(new Date(scheduledAt))} · {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {categoriesError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>{copy.categoryError}:</strong> {categoriesError}
            </p>
          </div>
        )}
        
        {topicsError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>{copy.topicsError}:</strong> {topicsError}
            </p>
          </div>
        )}
        
        {validationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>{copy.validationError}:</strong> {validationError}
            </p>
          </div>
        )}

        {categoriesLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-600">
              {copy.loadingCategories}
            </p>
          </div>
        )}

        <div className="sm:w-1/2">
          <ArticleStatusSelect
            value={status}
            onChange={setStatus}
            showGuidance={true}
            disabled={saving}
          />
        </div>

        {hasPermission(Permission.SET_BREAKING_NEWS) && (
          <div className="flex items-center gap-2">
            <input
              id="breaking-news"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-red-600"
              checked={isBreaking}
              onChange={(e) => setIsBreaking(e.target.checked)}
              disabled={saving}
            />
            <label
              htmlFor="breaking-news"
              className="text-xs font-semibold text-slate-600"
              title={copy.markBreakingTitle}
            >
              {copy.markBreaking}
            </label>
          </div>
        )}

        {!hasPermission(Permission.SET_BREAKING_NEWS) && (
          <div className="flex items-center gap-2">
            <input
              id="request-breaking-news"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-orange-600"
              checked={shouldRequestBreakingNews}
              onChange={(e) => setShouldRequestBreakingNews(e.target.checked)}
              disabled={saving}
            />
            <label
              htmlFor="request-breaking-news"
              className="text-xs font-semibold text-slate-600"
              title={copy.requestBreakingTitle}
            >
              {copy.requestBreaking}
              <span className="ml-1 text-xs text-slate-500">{copy.reviewHint}</span>
            </label>
          </div>
        )}

        {/* Breaking News Reason */}
        {shouldRequestBreakingNews && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3 space-y-3">
            <div>
              <label htmlFor="breaking-news-reason" className="block text-sm font-medium text-orange-900 mb-1">
                {copy.whyBreaking}
              </label>
              <textarea
                id="breaking-news-reason"
                value={breakingNewsReason}
                onChange={(e) => setBreakingNewsReason(e.target.value)}
                placeholder={copy.breakingReasonPlaceholder}
                className="w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                rows={3}
                disabled={saving}
              />
              <p className="text-xs text-orange-700 mt-2">
                {copy.breakingReasonHelp}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Editor ---------- */}
      <NewsEditor
        ref={editorRef}
        onChange={(content) =>
          setHasBodyContent(hasMeaningfulArticleContent(content))
        }
      />

      <div className="grid gap-4">
        <ArticleReadinessCard
          title={title}
          excerpt={excerpt}
          slug={slug || slugify(title)}
          categorySlug={categorySlug}
          hasBodyContent={hasBodyContent}
        />

        <SeoPreviewCard
          title={title}
          excerpt={excerpt}
          slug={slug || slugify(title)}
          categorySlug={categorySlug}
          topicSlug={topic}
          siteName={getTenantDisplayName(activeTenant, "")}
          publicBaseUrl={publicBaseUrl}
        />
      </div>
    </main>
    </PermissionGuard>
  );
}
