"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  Q_ARTICLE_BY_ID,
  M_UPSERT_ARTICLE,
  M_DELETE_ARTICLE,
  Q_BREAKING_NEWS_REQUESTS,
} from "@/services/article.gql";
import { useArticleMutations } from "@/hooks/useGraphQL";
import { useRevisions } from "@/hooks/useGraphQL";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useCategories } from "@/hooks/useCategories";
import { useTopics } from "@/hooks/useTopics";
import { usePermissions } from "@/hooks/usePermissions";
import { ArticleStatusSelect } from "@/components/forms/ArticleStatusSelect";
import { ArticleStatus, canDeleteArticle, canEditArticle, canViewArticleForEdit } from "@/utils/articlePermissions";
import { ArticleBreakingNewsRequestStatus } from "@/types/article";
import { Permission } from "@/components/permissions/PermissionGuard";
import { format } from "date-fns";

import type { OutputData } from "@editorjs/editorjs";
import type { NewsEditorRef } from "@/components/editor/news-editor";

/* -------------------------
   Editor (client-only)
------------------------- */
const NewsEditor = dynamic(() => import("@/components/editor/news-editor"), {
  ssr: false,
});

/* -------------------------
   Helpers
------------------------- */
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeTopic(value: string) {
  return slugify(value);
}

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* =========================
   Page
========================= */
export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const editorRef = useRef<NewsEditorRef>(null);
  const {
    performWorkflowAction,
    requestBreakingNews,
    requestRevision,
    approveRevisionRequest,
    rejectRevisionRequest,
    approveBreakingNewsRequest,
    rejectBreakingNewsRequest,
    consumeRevisionRequest
  } = useArticleMutations();
  const { getLatestRevisionRequest } = useRevisions();
  
  // Category validation hook
  const { categories, loading: categoriesLoading, error: categoriesError, isValidCategory } = useCategories();
  const { topics, loading: topicsLoading, error: topicsError, loadTopicsForCategory, clearTopics } = useTopics();
  
  // Permission hooks
  const { hasPermission, userRole, userId } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");

  /* ✅ ADDED */
  const [authorName, setAuthorName] = useState("");

  const [categorySlug, setCategorySlug] = useState<string>(
    ""
  );
  const [topic, setTopic] = useState<string>("");

  const [status, setStatus] = useState<ArticleStatus>("DRAFT");
  const [originalStatus, setOriginalStatus] = useState<ArticleStatus>("DRAFT");
  const [articleAuthorId, setArticleAuthorId] = useState<string>("");
  const [isBreaking, setIsBreaking] = useState(false);
  const [shouldRequestBreakingNews, setShouldRequestBreakingNews] = useState(false);
  const [breakingNewsReason, setBreakingNewsReason] = useState("");
  const [breakingNewsRequestStatus, setBreakingNewsRequestStatus] = useState<ArticleBreakingNewsRequestStatus | undefined>();
  const [breakingNewsRequestedAt, setBreakingNewsRequestedAt] = useState<string | undefined>();
  const [breakingNewsRequestedBy, setBreakingNewsRequestedBy] = useState<string | undefined>();
  const [revisionStatus, setRevisionStatus] = useState<string | undefined>();
  const [currentRevisionRequest, setCurrentRevisionRequest] = useState<any | undefined>();
  const [revisionNote, setRevisionNote] = useState<string>("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  
  // Track original values for change detection
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [originalExcerpt, setOriginalExcerpt] = useState("");
  const [originalCategorySlug, setOriginalCategorySlug] = useState("");
  const [originalTopic, setOriginalTopic] = useState("");
  const [originalIsBreaking, setOriginalIsBreaking] = useState(false);

  /** Editor initial content (ONE TIME) */
  const [initialContent, setInitialContent] = useState<OutputData>({
    blocks: [],
  });

  // Load topics when category changes
  useEffect(() => {
    if (categorySlug) {
      loadTopicsForCategory(categorySlug);
    } else {
      clearTopics();
    }
  }, [categorySlug, loadTopicsForCategory, clearTopics]);
  /* -------------------------
     Load article
  ------------------------- */
  useEffect(() => {
    let active = true;

    (async () => {
      const data = await client.request(Q_ARTICLE_BY_ID, { id });
      if (!active) return;

      const article = data.articleById;

      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt ?? "");
      setAuthorName(article.authorName ?? ""); // ✅ ADDED
      setCategorySlug(article.category?.slug ?? "");
      setTopic(article.topic ? normalizeTopic(article.topic) : "");
      setStatus(article.status);
      setOriginalStatus(article.status); // Track original status for permission checks
      setArticleAuthorId(article.author?.id ?? ""); // Track author for ownership checks
      setIsBreaking(article.isBreaking ?? false);
      setRevisionStatus(article.revisionStatus);
      setInitialContent(article.contentJson ?? { blocks: [] });
      
      // Load breaking news request status directly from article data
      setBreakingNewsRequestStatus(article.breakingNewsRequestStatus ?? undefined);
      setBreakingNewsRequestedAt(article.breakingNewsRequestedAt);
      setBreakingNewsRequestedBy(article.breakingNewsRequestedBy?.name);
      
      // Load latest revision request (any status) for edit permissions
      const latestRevision = await getLatestRevisionRequest(id);
      const latestRequest = latestRevision?.latestRevisionRequest;
      if (latestRequest) {
        setCurrentRevisionRequest(
          latestRequest.consumedAt
            ? { ...latestRequest, status: 'CONSUMED' }
            : latestRequest
        );
      } else {
        setCurrentRevisionRequest(undefined);
      }
      
      // Set original values for change detection
      setOriginalTitle(article.title);
      setOriginalSlug(article.slug);
      setOriginalExcerpt(article.excerpt ?? "");
      setOriginalCategorySlug(article.category?.slug ?? "");
      setOriginalTopic(article.topic ? normalizeTopic(article.topic) : "");
      setOriginalIsBreaking(article.isBreaking ?? false);

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [client, id]);

  /* -------------------------
     Actions
  ------------------------- */
  async function upsertArticle(nextStatus = status, redirectToList = false) {
    // Validate category exists in database
    setValidationError(null);
    if (!categoriesLoading && !isValidCategory(categorySlug)) {
      setValidationError(`Category "${categorySlug}" does not exist in the database. Please select a valid category.`);
      return;
    }

    setSaving(true);
    try {
      const shouldSubmitForReview = nextStatus === 'REVIEW' && originalStatus !== 'REVIEW';
      const statusForSave = shouldSubmitForReview ? 'DRAFT' : nextStatus;
      const contentJson = (await editorRef.current?.save()) ?? { blocks: [] };

      const response = await client.request(M_UPSERT_ARTICLE, {
        id,
        input: {
          title,
          slug,
          excerpt,
          authorName, // ✅ ADDED
          categorySlug,
          topic: topic ? normalizeTopic(topic) : null,
          status: statusForSave,
          isBreaking,
          contentJson,
        },
      });

      if (shouldSubmitForReview && response?.upsertArticle?.id) {
        const result = await performWorkflowAction({
          articleId: response.upsertArticle.id,
          action: 'SUBMIT_FOR_REVIEW',
        });

        if (!result?.performWorkflowAction?.success) {
          const message = result?.performWorkflowAction?.message || 'Failed to submit for review.';
          throw new Error(message);
        }
      }

      // If user requested breaking news, send the request after updating article
      const currentBreakingStatus = response?.upsertArticle?.breakingNewsRequestStatus;
      const canRequestBreakingNews = currentBreakingStatus === undefined || currentBreakingStatus === 'NONE';
      if (shouldRequestBreakingNews && response?.upsertArticle?.id && canRequestBreakingNews) {
        try {
          const breakingResponse = await requestBreakingNews(response.upsertArticle.id, breakingNewsReason);
          // Reset the checkbox and reason after request is sent
          setShouldRequestBreakingNews(false);
          setBreakingNewsReason("");
          setBreakingNewsRequestStatus('PENDING');
          setBreakingNewsRequestedAt(breakingResponse?.requestBreakingNews?.createdAt);
          if (breakingResponse?.requestBreakingNews?.id) {
            alert('Breaking news request submitted for review.');
          } else {
            alert('Breaking news request was not accepted by the server.');
          }
        } catch (err) {
          console.warn('Breaking news request submission failed:', err);
          alert('Breaking news request submission failed.');
          // Don't block the article save if breaking news request fails
        }
      }

      setStatus(shouldSubmitForReview ? 'REVIEW' : nextStatus);
      setOriginalStatus(shouldSubmitForReview ? 'REVIEW' : nextStatus);

      if (response?.upsertArticle?.id) {
        setOriginalTitle(title);
        setOriginalSlug(slug);
        setOriginalExcerpt(excerpt ?? "");
        setOriginalCategorySlug(categorySlug);
        setOriginalTopic(topic ?? "");
        setOriginalIsBreaking(isBreaking);
        setInitialContent(contentJson);

        if (userRole === 'AUTHOR' && (currentRevisionRequest?.status === 'APPROVED' || currentRevisionRequest?.status === 'REJECTED')) {
          if (currentRevisionRequest?.id && !currentRevisionRequest?.consumedAt) {
            await consumeRevisionRequest(currentRevisionRequest.id);
          }
          setCurrentRevisionRequest({
            ...currentRevisionRequest,
            status: 'CONSUMED',
            consumedAt: new Date().toISOString()
          });
        }
      }

      if (redirectToList) {
        router.push("/articles");
      }
    } catch (error) {
      console.error('Error saving article:', error);
      const message = error instanceof Error ? error.message : 'Failed to save article.';
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    await upsertArticle(status, true);
  }

  async function togglePublish() {
    const nextStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    await upsertArticle(nextStatus, false);
  }

  async function publish() {
    if (status === "REVIEW") {
      await approveFromReview();
      return;
    }
    await upsertArticle("PUBLISHED", false);
  }

  async function approveFromReview() {
    if (!hasPermission(Permission.APPROVE_ARTICLES)) {
      setValidationError("You do not have permission to approve articles.");
      return;
    }

    setSaving(true);
    try {
      const result = await performWorkflowAction({
        articleId: id,
        action: "APPROVE",
        notifyAuthor: true,
      });

      if (!result?.performWorkflowAction?.success) {
        const message = result?.performWorkflowAction?.message || "Failed to approve article.";
        throw new Error(message);
      }

      setStatus("PUBLISHED");
      setOriginalStatus("PUBLISHED");
      setValidationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve article.";
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  async function rejectFromReview() {
    if (!hasPermission(Permission.REJECT_ARTICLES)) {
      setValidationError("You do not have permission to reject articles.");
      return;
    }

    setSaving(true);
    try {
      const result = await performWorkflowAction({
        articleId: id,
        action: "REJECT",
        notifyAuthor: true,
      });

      if (!result?.performWorkflowAction?.success) {
        const message = result?.performWorkflowAction?.message || "Failed to reject article.";
        throw new Error(message);
      }

      setStatus("ARCHIVED");
      setOriginalStatus("ARCHIVED");
      setValidationError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject article.";
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this article?")) return;
    setSaving(true);
    try {
      await client.request(M_DELETE_ARTICLE, { id });
      router.push("/articles");
    } finally {
      setSaving(false);
    }
  }

  const refreshRevisionState = async () => {
    const data = await client.request(Q_ARTICLE_BY_ID, { id });
    const article = data.articleById;
    setRevisionStatus(article.revisionStatus);

    const latestRevision = await getLatestRevisionRequest(id);
    const latestRequest = latestRevision?.latestRevisionRequest;
    if (latestRequest) {
      setCurrentRevisionRequest(
        latestRequest.consumedAt
          ? { ...latestRequest, status: 'CONSUMED' }
          : latestRequest
      );
    } else {
      setCurrentRevisionRequest(undefined);
    }
  };

  async function submitRevisionRequest() {
    setValidationError(null);
    if (status !== 'REVIEW') {
      alert('Revisions can only be requested while the article is in review.');
      return;
    }
    if (!revisionNote.trim()) {
      alert("Please describe the changes you'd like to make");
      return;
    }

    setSaving(true);
    try {
      // Save current editor content
      const contentJson = (await editorRef.current?.save()) ?? { blocks: [] };
      
      // Build proposed changes object - only include fields that have changed
      const proposedChanges: any = {};
      
      if (title !== originalTitle) proposedChanges.title = title;
      if (slug !== originalSlug) proposedChanges.slug = slug;
      if (excerpt !== originalExcerpt) proposedChanges.excerpt = excerpt;
      if (categorySlug !== originalCategorySlug) proposedChanges.categorySlug = categorySlug;
      if (topic !== originalTopic) proposedChanges.topic = topic;
      if (isBreaking !== originalIsBreaking) proposedChanges.isBreaking = isBreaking;
      
      // Always include contentJson if editor has content
      if (contentJson.blocks?.length > 0) {
        proposedChanges.contentJson = contentJson;
      }
      
      if (Object.keys(proposedChanges).length === 0) {
        setValidationError('Please make at least one change before submitting a revision request.');
        setSaving(false);
        return;
      }

      // Call the new requestRevision mutation with proper input structure
      await requestRevision({
        articleId: id,
        note: revisionNote.trim(),
        changes: proposedChanges
      });

      setShowRevisionForm(false);
      setRevisionNote("");
      
      await refreshRevisionState();
    } finally {
      setSaving(false);
    }
  }

  async function approveRevision() {
    if (!currentRevisionRequest?.id) return;
    setSaving(true);
    try {
      await approveRevisionRequest(currentRevisionRequest.id);
      await refreshRevisionState();
      alert('Revision request approved');
    } catch (err) {
      console.error('Error approving revision request:', err);
      alert('Failed to approve revision request');
    } finally {
      setSaving(false);
    }
  }

  async function rejectRevision() {
    if (!currentRevisionRequest?.id) return;
    setSaving(true);
    try {
      await rejectRevisionRequest(currentRevisionRequest.id);
      await refreshRevisionState();
      alert('Revision request rejected');
    } catch (err) {
      console.error('Error rejecting revision request:', err);
      alert('Failed to reject revision request');
    } finally {
      setSaving(false);
    }
  }

  async function approveBreakingNews() {
    setSaving(true);
    try {
      // Fetch breaking news requests to find the pending one for this article
      const data = await client.request(Q_BREAKING_NEWS_REQUESTS, { articleId: id });
      const request = data?.breakingNewsRequests?.find((r: any) => r.status === 'PENDING');
      if (request) {
        const response = await approveBreakingNewsRequest(request.id);
        if (response) {
          // Refresh article data to get updated isBreaking status
          const articleData = await client.request(Q_ARTICLE_BY_ID, { id });
          const article = articleData.articleById;
          setIsBreaking(article.isBreaking);
          // Clear the breaking news request status since it was approved
          setBreakingNewsRequestStatus(undefined);
          setBreakingNewsRequestedAt(undefined);
          setBreakingNewsRequestedBy(undefined);
        }
      }
    } catch (err) {
      console.error('Error approving breaking news:', err);
    } finally {
      setSaving(false);
    }
  }

  async function rejectBreakingNews() {
    setSaving(true);
    try {
      // Fetch breaking news requests to find the pending one for this article
      const data = await client.request(Q_BREAKING_NEWS_REQUESTS, { articleId: id });
      const request = data?.breakingNewsRequests?.find((r: any) => r.status === 'PENDING');
      if (request) {
        const response = await rejectBreakingNewsRequest(request.id);
        if (response) {
          // Clear the breaking news request status since it was rejected
          setBreakingNewsRequestStatus(undefined);
          setBreakingNewsRequestedAt(undefined);
          setBreakingNewsRequestedBy(undefined);
        }
      }
    } catch (err) {
      console.error('Error rejecting breaking news:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-600">Loading…</div>;
  }

  // Check if user can view this article
  const canView = canViewArticleForEdit(articleAuthorId, userId, userRole, hasPermission);
  
  if (!canView) {
    return (
      <main className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-sm text-red-600 mb-4">
            Authors can only view their own articles.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/articles')}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Back to Articles
          </Button>
        </div>
      </main>
    );
  }
  
  // Check if user can edit this article
  const canEdit = canEditArticle(
    articleAuthorId,
    userId,
    userRole,
    hasPermission,
    status,
    revisionStatus,
    currentRevisionRequest?.status
  );
  const isReadOnly = !canEdit;
  const canDelete = canDeleteArticle(articleAuthorId, userId, userRole, hasPermission);

  const canRequestRevision =
    articleAuthorId === userId &&
    hasPermission(Permission.UPDATE_OWN_ARTICLE) &&
    status === 'REVIEW';

  return (
    <main className="space-y-4">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">📝</div>
            <div>
              <h3 className="font-semibold text-amber-900">Read-Only Mode</h3>
              <p className="text-sm text-amber-800 mt-1">
                {status === 'REVIEW' && 'This article is in review. To propose changes, use the "Request Revision" form below.'}
                {status === 'PUBLISHED' && 'This article is published. To propose changes, use the "Request Revision" form below.'}
                {status === 'ARCHIVED' && 'This article is archived and cannot be modified.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Edit Article</h2>
          <p className="text-sm text-slate-600">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          {status === "PUBLISHED" && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
            <Button variant="outline" onClick={togglePublish} disabled={saving}>
              Unpublish
            </Button>
          )}
          {status === "REVIEW" && (
            <>
              {hasPermission(Permission.APPROVE_ARTICLES) && (
                <Button variant="outline" onClick={approveFromReview} disabled={saving}>
                  Approve & Publish
                </Button>
              )}
              {hasPermission(Permission.REJECT_ARTICLES) && (
                <Button variant="outline" onClick={rejectFromReview} disabled={saving}>
                  Reject
                </Button>
              )}
            </>
          )}
          {status !== "PUBLISHED" && status !== "REVIEW" && hasPermission(Permission.PUBLISH_ARTICLE) && (
            <Button variant="outline" onClick={publish} disabled={saving}>
              Publish
            </Button>
          )}
          <Button onClick={save} disabled={saving || !title || isReadOnly}>
            Save
          </Button>
          {canDelete && (
            <Button variant="ghost" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* ---------- Meta ---------- */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Title</label>
          <Input
            value={title}
            disabled={isReadOnly}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Slug</label>
          <Input value={slug} disabled={isReadOnly} onChange={(e) => setSlug(e.target.value)} />
        </div>

        {/* ✅ AUTHOR FIELD — ADDED, NOTHING REMOVED */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Author</label>
          <Input
            value={authorName}
            disabled={isReadOnly}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Excerpt
          </label>
          <Input value={excerpt} disabled={isReadOnly} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Category
            </label>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={categorySlug}
              disabled={isReadOnly || categoriesLoading}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setTopic("");
              }}
            >
              <option value="">— Select Category —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <p className="text-xs text-slate-500">Loading categories...</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Topic (optional)
            </label>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={topic}
              disabled={isReadOnly || topicsLoading || !categorySlug}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">— No topic —</option>
              {topics.map((topicItem) => (
                <option key={topicItem.id} value={topicItem.slug}>
                  {topicItem.title}
                </option>
              ))}
            </select>
            {topicsLoading && (
              <p className="text-xs text-slate-500">Loading topics...</p>
            )}
            {!categorySlug && (
              <p className="text-xs text-slate-500">Select a category first</p>
            )}
          </div>
        </div>

        {/* Error Display */}
        {categoriesError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>Category Error:</strong> {categoriesError}
            </p>
          </div>
        )}

        {topicsError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>Topics Error:</strong> {topicsError}
            </p>
          </div>
        )}
        
        {validationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>Validation Error:</strong> {validationError}
            </p>
          </div>
        )}

        {categoriesLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-600">
              Loading categories...
            </p>
          </div>
        )}

        <div className="sm:w-1/2">
          <ArticleStatusSelect
            value={status}
            onChange={setStatus}
            currentStatus={originalStatus}
            articleAuthorId={articleAuthorId}
            showGuidance={true}
              disabled={saving || isReadOnly}
          />
        </div>

        {hasPermission(Permission.SET_BREAKING_NEWS) && canEditArticle(articleAuthorId, userId, userRole, hasPermission, status, revisionStatus, currentRevisionRequest?.status) && (
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
              title="Mark this article as breaking news"
            >
              Mark as breaking news
            </label>
          </div>
        )}

        {!hasPermission(Permission.SET_BREAKING_NEWS) && !isBreaking && !shouldRequestBreakingNews && canEditArticle(articleAuthorId, userId, userRole, hasPermission, status, revisionStatus, currentRevisionRequest?.status) && (
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
              title="Request this article to be marked as breaking news"
            >
              Request as breaking news
              <span className="ml-1 text-xs text-slate-500">(Editors/Admins will review)</span>
            </label>
          </div>
        )}

        {/* Breaking News Reason */}
        {!hasPermission(Permission.SET_BREAKING_NEWS) && !isBreaking && shouldRequestBreakingNews && canEditArticle(articleAuthorId, userId, userRole, hasPermission, status, revisionStatus, currentRevisionRequest?.status) && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3 space-y-3">
            <div>
              <label htmlFor="breaking-news-reason" className="block text-sm font-medium text-orange-900 mb-1">
                Why is this breaking news?
              </label>
              <textarea
                id="breaking-news-reason"
                value={breakingNewsReason}
                onChange={(e) => setBreakingNewsReason(e.target.value)}
                placeholder="Explain why this article should be marked as breaking news..."
                className="w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                rows={3}
                disabled={saving}
              />
              <p className="text-xs text-orange-700 mt-2">
                Admins and editors will review your request and decide if this article qualifies as breaking news.
              </p>
            </div>
          </div>
        )}

        {/* Breaking News Request Status (for Editors/Admins) */}
        {breakingNewsRequestStatus === 'PENDING' && hasPermission(Permission.SET_BREAKING_NEWS) && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔔</span>
                  <h3 className="text-sm font-semibold text-orange-900">Breaking News Request Pending</h3>
                </div>
                <p className="text-xs text-orange-700 mb-2">
                  The author has requested this article to be marked as breaking news.
                </p>
                {breakingNewsRequestedBy && (
                  <p className="text-xs text-orange-600">
                    <strong>Requested by:</strong> {breakingNewsRequestedBy}
                  </p>
                )}
                {breakingNewsRequestedAt && (
                  <p className="text-xs text-orange-600">
                    <strong>Requested at:</strong> {format(new Date(breakingNewsRequestedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={async () => {
                    try {
                      const breakingNewsData = await client.request(Q_BREAKING_NEWS_REQUESTS, { articleId: id });
                      const request = breakingNewsData?.breakingNewsRequests?.find((r: any) => r.status === 'PENDING');
                      if (request) {
                        await approveBreakingNewsRequest(request.id);
                        setBreakingNewsRequestStatus(undefined);
                        setIsBreaking(true);
                        alert('Breaking news request approved!');
                      }
                    } catch (err) {
                      console.error('Error approving breaking news:', err);
                      alert('Failed to approve breaking news request');
                    }
                  }}
                  disabled={saving}
                >
                  ✓ Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={async () => {
                    try {
                      const breakingNewsData = await client.request(Q_BREAKING_NEWS_REQUESTS, { articleId: id });
                      const request = breakingNewsData?.breakingNewsRequests?.find((r: any) => r.status === 'PENDING');
                      if (request) {
                        await rejectBreakingNewsRequest(request.id);
                        setBreakingNewsRequestStatus(undefined);
                        alert('Breaking news request rejected');
                      }
                    } catch (err) {
                      console.error('Error rejecting breaking news:', err);
                      alert('Failed to reject breaking news request');
                    }
                  }}
                  disabled={saving}
                >
                  ✗ Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Request Status (for Editors/Admins) */}
        {currentRevisionRequest?.status === 'PENDING' && hasPermission(Permission.APPROVE_ARTICLES) && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📝</span>
                  <h3 className="text-sm font-semibold text-purple-900">Revision Request Pending</h3>
                </div>
                <p className="text-xs text-purple-700 mb-2">
                  The author has requested permission to revise this article.
                </p>
                {currentRevisionRequest?.note && (
                  <p className="text-xs text-purple-700">
                    <strong>Request note:</strong> {currentRevisionRequest.note}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={approveRevision}
                  disabled={saving}
                >
                  ✓ Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={rejectRevision}
                  disabled={saving}
                >
                  ✗ Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Request Section */}
        {canRequestRevision && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Request Revision</h3>
                <p className="text-xs text-blue-700 mb-3">
                  {currentRevisionRequest?.status === 'PENDING'
                    ? '⏳ Revision request is pending review'
                    : currentRevisionRequest?.status === 'APPROVED'
                    ? '✓ Your revision request was approved'
                    : currentRevisionRequest?.status === 'REJECTED'
                    ? '✗ Your revision request was rejected'
                    : currentRevisionRequest?.status === 'CONSUMED'
                    ? 'Changes saved. Request a new revision to edit again.'
                    : 'Request permission to edit this article'}
                </p>
                {currentRevisionRequest?.reviewComment && (
                  <p className="text-xs text-blue-600 mt-2 italic">
                    Editor comment: {currentRevisionRequest.reviewComment}
                  </p>
                )}
              </div>
              {!showRevisionForm && (!currentRevisionRequest || currentRevisionRequest.status !== 'PENDING') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowRevisionForm(true)}
                  disabled={saving}
                  className="whitespace-nowrap"
                >
                  Propose Changes
                </Button>
              )}
            </div>

            {showRevisionForm && (
              <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-blue-900">
                    Describe the changes you'd like to make
                  </label>
                  <textarea
                    className="min-h-20 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Fix typo in paragraph 2, add recent data from Q4, update author bio..."
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    The system will automatically track which fields you've modified and submit them as proposed changes.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowRevisionForm(false);
                      setRevisionNote("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitRevisionRequest}
                    disabled={saving || !revisionNote.trim()}
                  >
                    {saving ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}


        {breakingNewsRequestStatus === 'APPROVED' && (
          <div className="rounded-md border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">✓ Breaking News Request Approved</p>
            <p className="text-xs text-green-700 mt-1">
              This article has been approved as breaking news and will be marked accordingly.
            </p>
          </div>
        )}

        {breakingNewsRequestStatus === 'REJECTED' && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">✗ Breaking News Request Rejected</p>
            <p className="text-xs text-red-700 mt-1">
              The breaking news request for this article was rejected.
            </p>
          </div>
        )}
      </div>

      {/* ---------- Editor ---------- */}
      <NewsEditor ref={editorRef} initialData={initialContent} />
    </main>
  );
}
