"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import {
  Q_ARTICLE_BY_ID,
  M_UPSERT_ARTICLE,
  M_DELETE_ARTICLE,
} from "@/services/article.gql";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MEGA_NAV } from "@/data/mega-nav";
import { useCategories } from "@/hooks/useCategories";
import { usePermissions } from "@/hooks/usePermissions";
import { ArticleStatusSelect } from "@/components/forms/ArticleStatusSelect";
import { ArticleStatus, canEditArticle } from "@/utils/articlePermissions";
import { Permission } from "@/components/permissions/PermissionGuard";

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
  
  // Category validation hook
  const { categories, loading: categoriesLoading, error: categoriesError, isValidCategory } = useCategories();
  
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
    Object.keys(MEGA_NAV)[0]
  );
  const [topic, setTopic] = useState<string>("");

  const [status, setStatus] = useState<ArticleStatus>("DRAFT");
  const [originalStatus, setOriginalStatus] = useState<ArticleStatus>("DRAFT");
  const [articleAuthorId, setArticleAuthorId] = useState<string>("");
  const [isBreaking, setIsBreaking] = useState(false);

  /** Editor initial content (ONE TIME) */
  const [initialContent, setInitialContent] = useState<OutputData>({
    blocks: [],
  });

  /** Stable derived data */
  const categoryOptions = useMemo(() => Object.keys(MEGA_NAV), []);
  const topicOptions = useMemo(() => {
    if (!categorySlug) return [];

    const cfg = MEGA_NAV[categorySlug];
    if (!cfg) return [];

    const allItems = [
      ...cfg.explore.items,
      ...cfg.shop.items,
      ...cfg.more.items,
    ];

    return Array.from(
      new Set(
        allItems
          .map((i) => i.href.split("/").pop())
          .filter((t): t is string => Boolean(t))
      )
    );
  }, [categorySlug]);
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
      setCategorySlug(article.category?.slug ?? categoryOptions[0]);
      setTopic(article.topic ?? "");
      setStatus(article.status);
      setOriginalStatus(article.status); // Track original status for permission checks
      setArticleAuthorId(article.author?.id ?? ""); // Track author for ownership checks
      setIsBreaking(article.isBreaking ?? false);
      setInitialContent(article.contentJson ?? { blocks: [] });

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [client, id, categoryOptions]);

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
      const contentJson = (await editorRef.current?.save()) ?? { blocks: [] };

      await client.request(M_UPSERT_ARTICLE, {
        id,
        input: {
          title,
          slug,
          excerpt,
          authorName, // ✅ ADDED
          categorySlug,
          topic: topic || null,
          status: nextStatus,
          isBreaking,
          contentJson,
        },
      });

      setStatus(nextStatus);

      if (redirectToList) {
        router.push("/articles");
      }
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

  function preview() {
    // Use article ID for preview instead of slug to avoid "article not found" issues
    window.open(`/preview/id/${id}`, "_blank");
  }

  if (loading) {
    return <div className="text-sm text-slate-600">Loading…</div>;
  }

  // Check if user can edit this article
  const canEdit = canEditArticle(articleAuthorId, userId, userRole, hasPermission);
  
  if (!canEdit) {
    return (
      <main className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-sm text-red-600 mb-4">
            You do not have permission to edit this article.
            {userRole === 'AUTHOR' && articleAuthorId !== userId && 
              ' Authors can only edit their own articles.'
            }
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

  return (
    <main className="space-y-4">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Edit Article</h2>
          <p className="text-sm text-slate-600">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={preview}>
            Preview
          </Button>
          <Button variant="outline" onClick={togglePublish} disabled={saving}>
            {status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={save} disabled={saving || !title}>
            Save
          </Button>
          <Button variant="ghost" onClick={remove} disabled={saving}>
            Delete
          </Button>
        </div>
      </div>

      {/* ---------- Meta ---------- */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Title</label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>

        {/* ✅ AUTHOR FIELD — ADDED, NOTHING REMOVED */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">Author</label>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">
            Excerpt
          </label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Category
            </label>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={categorySlug}
              onChange={(e) => {
                setCategorySlug(e.target.value);
                setTopic("");
              }}
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {MEGA_NAV[cat].root.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Topic (optional)
            </label>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="">— No topic —</option>
              {topicOptions.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
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
            disabled={saving || !canEditArticle(articleAuthorId, userId, userRole, hasPermission)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="breaking-news"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-red-600"
            checked={isBreaking}
            onChange={(e) => setIsBreaking(e.target.checked)}
            disabled={saving || !hasPermission(Permission.SET_BREAKING_NEWS) || !canEditArticle(articleAuthorId, userId, userRole, hasPermission)}
          />
          <label
            htmlFor="breaking-news"
            className={`text-xs font-semibold ${
              hasPermission(Permission.SET_BREAKING_NEWS) && canEditArticle(articleAuthorId, userId, userRole, hasPermission)
                ? 'text-slate-600' 
                : 'text-slate-400'
            }`}
            title={
              !canEditArticle(articleAuthorId, userId, userRole, hasPermission)
                ? 'You do not have permission to edit this article'
                : !hasPermission(Permission.SET_BREAKING_NEWS)
                ? 'You do not have permission to set breaking news'
                : 'Mark this article as breaking news'
            }
          >
            Mark as breaking news
            {!hasPermission(Permission.SET_BREAKING_NEWS) && (
              <span className="ml-1 text-xs text-slate-400">(Editors/Admins only)</span>
            )}
          </label>
        </div>
      </div>

      {/* ---------- Editor ---------- */}
      <NewsEditor ref={editorRef} initialData={initialContent} />
    </main>
  );
}
