"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useArticles,
  useArticleMutations,
  useRevisions,
} from "@/hooks/useGraphQL";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Q_REVISION_REQUESTS } from "@/services/article.gql";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Article, ArticleStatus } from "@/types/article";
import { Badge } from "@/components/ui/badge";
import { ArticleShareDialog } from "@/components/articles/article-share-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus, Share2, Eye } from "lucide-react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { ArticleScopeTabs, type ArticleScope } from "@/components/articles/article-scope-tabs";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
};

const PAGE_SIZE = 10;

const articlesCopy = {
  en: {
    confirm: "Confirm",
    pageTitle: "Articles",
    pageDescription: "Create, edit, and publish articles.",
    myPageTitle: "My Articles",
    myPageDescription: "Manage your personal articles.",
    newArticle: "New Article",
    all: "All",
    statuses: {
      DRAFT: "DRAFT",
      REVIEW: "REVIEW",
      PUBLISHED: "PUBLISHED",
      ARCHIVED: "ARCHIVED",
      SCHEDULED: "SCHEDULED",
    },
    empty: "No articles found.",
    createFirst: "Create your first article",
    edit: "Edit",
    submitForReview: "Submit for Review",
    view: "View",
    publish: "Publish",
    publishTitle: "Publish Article?",
    publishDescription: (title: string) => `Publish "${title}" now?`,
    approvePublish: "Approve & Publish",
    approvePublishTitle: "Approve and Publish?",
    approvePublishDescription: (title: string) => `Approve "${title}" and publish it?`,
    reject: "Reject",
    rejectTitle: "Reject Article?",
    rejectDescription: (title: string) => `Reject "${title}" and archive it?`,
    unpublish: "Unpublish",
    unpublishTitle: "Unpublish Article?",
    unpublishDescription: (title: string) => `Move "${title}" back to draft?`,
    share: "Share",
    delete: "Delete",
    uncategorized: "Uncategorized",
    featured: "Featured",
    editorsPick: "Editor's Pick",
    breaking: "Breaking",
    revisionStatus: (status: string) => `Revision ${status.toLowerCase()}`,
    updated: "Updated",
    tableTitle: "Title",
    status: "Status",
    category: "Category",
    topic: "Topic",
    actions: "Actions",
    breakingRequestPending: "Breaking Request: Pending",
    breakingRequestApproved: "Breaking Request: Approved",
    breakingRequestRejected: "Breaking Request: Rejected",
    revisionRequested: "Revision Requested",
    revisionApproved: "Revision Approved",
    revisionRejected: "Revision Rejected",
    revisionEnd: "Revision End",
    revisionNote: (note: string) => `Revision note: ${note}`,
    approveRevision: "Approve Revision",
    approveRevisionTitle: "Approve Revision?",
    approveRevisionDescription: (title: string) => `Approve the revision request for "${title}"?`,
    rejectRevision: "Reject Revision",
    rejectRevisionTitle: "Reject Revision?",
    rejectRevisionDescription: (title: string) => `Reject the revision request for "${title}"?`,
    noActions: "-",
    showing: (start: number, end: number, total: number) =>
      `Showing ${start}-${end} of ${total} articles`,
    previous: "Previous",
    next: "Next",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    deleteTitle: "Delete Article?",
    deleteDescription: (title: string) =>
      `Delete "${title || "this article"}"? This action cannot be undone.`,
    deleteConfirm: "Delete Article",
    cancel: "Cancel",
  },
  km: {
    confirm: "បញ្ជាក់",
    pageTitle: "អត្ថបទ",
    pageDescription: "បង្កើត កែសម្រួល និងផ្សព្វផ្សាយអត្ថបទ។",
    myPageTitle: "អត្ថបទរបស់ខ្ញុំ",
    myPageDescription: "គ្រប់គ្រងអត្ថបទផ្ទាល់ខ្លួនរបស់អ្នក។",
    newArticle: "អត្ថបទថ្មី",
    all: "ទាំងអស់",
    statuses: {
      DRAFT: "ព្រាង",
      REVIEW: "រង់ចាំពិនិត្យ",
      PUBLISHED: "បានផ្សព្វផ្សាយ",
      ARCHIVED: "បានដាក់ប័ណ្ណសារ",
      SCHEDULED: "បានកំណត់ពេល",
    },
    empty: "រកមិនឃើញអត្ថបទទេ។",
    createFirst: "បង្កើតអត្ថបទដំបូង",
    edit: "កែសម្រួល",
    submitForReview: "ផ្ញើទៅពិនិត្យ",
    view: "មើល",
    publish: "ផ្សព្វផ្សាយ",
    publishTitle: "ផ្សព្វផ្សាយអត្ថបទ?",
    publishDescription: (title: string) => `ផ្សព្វផ្សាយ "${title}" ឥឡូវនេះ?`,
    approvePublish: "អនុម័ត និងផ្សព្វផ្សាយ",
    approvePublishTitle: "អនុម័ត និងផ្សព្វផ្សាយ?",
    approvePublishDescription: (title: string) => `អនុម័ត "${title}" ហើយផ្សព្វផ្សាយ?`,
    reject: "បដិសេធ",
    rejectTitle: "បដិសេធអត្ថបទ?",
    rejectDescription: (title: string) => `បដិសេធ "${title}" ហើយដាក់ក្នុងប័ណ្ណសារ?`,
    unpublish: "ដកចេញពីការផ្សព្វផ្សាយ",
    unpublishTitle: "ដកអត្ថបទចេញពីការផ្សព្វផ្សាយ?",
    unpublishDescription: (title: string) => `ប្ដូរ "${title}" ត្រឡប់ទៅជាព្រាង?`,
    share: "ចែករំលែក",
    delete: "លុប",
    uncategorized: "មិនទាន់មានប្រភេទ",
    featured: "អត្ថបទពិសេស",
    editorsPick: "ជម្រើសអ្នកនិពន្ធ",
    breaking: "ព័ត៌មានទាន់ហេតុការណ៍",
    revisionStatus: (status: string) => `ការកែសម្រួល ${status.toLowerCase()}`,
    updated: "បានកែប្រែ",
    tableTitle: "ចំណងជើង",
    status: "ស្ថានភាព",
    category: "ប្រភេទ",
    topic: "ប្រធានបទ",
    actions: "សកម្មភាព",
    breakingRequestPending: "សំណើព័ត៌មានទាន់ហេតុការណ៍៖ រង់ចាំ",
    breakingRequestApproved: "សំណើព័ត៌មានទាន់ហេតុការណ៍៖ បានអនុម័ត",
    breakingRequestRejected: "សំណើព័ត៌មានទាន់ហេតុការណ៍៖ បានបដិសេធ",
    revisionRequested: "បានស្នើកែសម្រួល",
    revisionApproved: "បានអនុម័តការកែសម្រួល",
    revisionRejected: "បានបដិសេធការកែសម្រួល",
    revisionEnd: "ការកែសម្រួលបានបញ្ចប់",
    revisionNote: (note: string) => `ចំណាំការកែសម្រួល៖ ${note}`,
    approveRevision: "អនុម័តការកែសម្រួល",
    approveRevisionTitle: "អនុម័តការកែសម្រួល?",
    approveRevisionDescription: (title: string) => `អនុម័តសំណើកែសម្រួលសម្រាប់ "${title}"?`,
    rejectRevision: "បដិសេធការកែសម្រួល",
    rejectRevisionTitle: "បដិសេធការកែសម្រួល?",
    rejectRevisionDescription: (title: string) => `បដិសេធសំណើកែសម្រួលសម្រាប់ "${title}"?`,
    noActions: "-",
    showing: (start: number, end: number, total: number) =>
      `បង្ហាញ ${start}-${end} ក្នុងចំណោម ${total} អត្ថបទ`,
    previous: "មុន",
    next: "បន្ទាប់",
    pageOf: (page: number, total: number) => `ទំព័រ ${page} ក្នុងចំណោម ${total}`,
    deleteTitle: "លុបអត្ថបទ?",
    deleteDescription: (title: string) =>
      `លុប "${title || "អត្ថបទនេះ"}"? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteConfirm: "លុបអត្ថបទ",
    cancel: "បោះបង់",
  },
} as const;

export default function AdminArticlesPage() {
  const { locale } = useAdminLocale();
  const copy = articlesCopy[locale];
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [articleScope, setArticleScope] = useState<ArticleScope>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    articleId: string | null;
    articleTitle: string;
  }>({
    open: false,
    articleId: null,
    articleTitle: "",
  });
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: copy.confirm,
    onConfirm: () => {},
  });
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [revisionRequestStatusById, setRevisionRequestStatusById] = useState<
    Record<string, string>
  >({});
  const [revisionRequestNoteById, setRevisionRequestNoteById] = useState<
    Record<string, string>
  >({});
  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const { getArticles, loading, error } = useArticles();
  const { getLatestRevisionRequest } = useRevisions();
  const {
    setArticleStatus,
    performWorkflowAction,
    deleteArticle,
    approveRevisionRequest,
    rejectRevisionRequest,
    loading: mutationLoading,
  } = useArticleMutations();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const publicBaseUrl = useMemo(() => {
    const primarySite =
      activeTenant?.sites.find((site) => site.isPrimary) ||
      activeTenant?.sites[0];

    return primarySite?.publicBaseUrl ?? null;
  }, [activeTenant]);

  useEffect(() => {
    const canViewAll = hasPermission(Permission.VIEW_ALL_ARTICLES);
    const canViewMine = hasPermission(Permission.UPDATE_OWN_ARTICLE);
    const requestedMine = new URLSearchParams(window.location.search).get("scope") === "my";
    setArticleScope(
      (requestedMine && canViewMine) || (!canViewAll && canViewMine)
        ? "mine"
        : "all",
    );
  }, [hasPermission]);

  const handleScopeChange = useCallback((scope: ArticleScope) => {
    setArticleScope(scope);
    setCurrentPage(1);
    const url = new URL(window.location.href);
    if (scope === "mine") url.searchParams.set("scope", "my");
    else url.searchParams.delete("scope");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const loadRevisionStatuses = useCallback(
    async (list: Article[]) => {
      if (!list.length) {
        setRevisionRequestStatusById({});
        setRevisionRequestNoteById({});
        return;
      }

      try {
        const results = await Promise.all(
          list.map(async (article) => {
            const data = await getLatestRevisionRequest(article.id);
            const latest = data?.latestRevisionRequest;
            if (latest?.consumedAt) {
              return [article.id, "CONSUMED", latest?.note] as const;
            }
            return [article.id, latest?.status, latest?.note] as const;
          }),
        );

        const nextMap: Record<string, string> = {};
        const nextNotes: Record<string, string> = {};
        results.forEach(([id, status, note]) => {
          if (status) {
            nextMap[id] = status;
          }
          if (note) {
            nextNotes[id] = note;
          }
        });
        setRevisionRequestStatusById(nextMap);
        setRevisionRequestNoteById(nextNotes);
      } catch (err) {
        console.error("Failed to load revision request statuses:", err);
      }
    },
    [getLatestRevisionRequest],
  );

  const loadArticles = useCallback(async () => {
    try {
      if (articleScope === "mine" && !user?.id) {
        setArticles([]);
        return;
      }
      const response = await getArticles({
        status: statusFilter,
        ...(articleScope === "mine" ? { authorId: user?.id } : {}),
        take: 1000,
        skip: 0,
      });

      if (response?.articles) {
        setArticles(response.articles);
        await loadRevisionStatuses(response.articles);
      }
    } finally {
      setPageReady(true);
    }
  }, [articleScope, getArticles, loadRevisionStatuses, statusFilter, user?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadArticles();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadArticles]);

  const handleStatusChange = async (
    articleId: string,
    newStatus: ArticleStatus,
  ) => {
    const article = articles.find((item) => item.id === articleId);
    const isReviewApproval =
      article?.status === "REVIEW" && newStatus === "PUBLISHED";
    const isReviewRejection =
      article?.status === "REVIEW" && newStatus === "ARCHIVED";

    const response =
      isReviewApproval || isReviewRejection
        ? await performWorkflowAction({
            articleId,
            action: isReviewApproval ? "APPROVE" : "REJECT",
            notifyAuthor: true,
          })
        : await setArticleStatus(articleId, newStatus);

    if (response) {
      // Refresh the list
      loadArticles();
    }
  };

  const requestDelete = (article: Article) => {
    setDeleteDialog({
      open: true,
      articleId: article.id,
      articleTitle: article.title,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.articleId) return;

    const response = await deleteArticle(deleteDialog.articleId);
    if (response) {
      setDeleteDialog({ open: false, articleId: null, articleTitle: "" });
      loadArticles();
    }
  };

  const handleApproveRevision = async (articleId: string) => {
    try {
      // Fetch the pending revision request
      const data = await client.request(Q_REVISION_REQUESTS, {
        articleId,
        status: "PENDING",
      });

      if (data?.revisionRequests && data.revisionRequests.length > 0) {
        const requestId = data.revisionRequests[0].id;
        const response = await approveRevisionRequest(requestId);
        if (response) {
          loadArticles();
        }
      }
    } catch (err) {
      console.error("Error approving revision:", err);
    }
  };

  const handleRejectRevision = async (articleId: string) => {
    try {
      // Fetch the pending revision request
      const data = await client.request(Q_REVISION_REQUESTS, {
        articleId,
        status: "PENDING",
      });

      if (data?.revisionRequests && data.revisionRequests.length > 0) {
        const requestId = data.revisionRequests[0].id;
        const response = await rejectRevisionRequest(requestId);
        if (response) {
          loadArticles();
        }
      }
    } catch (err) {
      console.error("Error rejecting revision:", err);
    }
  };

  const requestArticleAction = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }) => {
    setActionDialog({
      open: true,
      title: input.title,
      description: input.description,
      confirmText: input.confirmText,
      variant: input.variant,
      onConfirm: input.onConfirm,
    });
  };

  const hasRowActions = (article: Article) =>
    hasPermission(Permission.UPDATE_ANY_ARTICLE) ||
    (articleScope === "mine" && hasPermission(Permission.UPDATE_OWN_ARTICLE)) ||
    hasPermission(Permission.VIEW_ALL_ARTICLES) ||
    hasPermission(Permission.REVIEW_ARTICLES) ||
    (article.status === "DRAFT" && hasPermission(Permission.PUBLISH_ARTICLE)) ||
    (article.status === "REVIEW" &&
      (hasPermission(Permission.APPROVE_ARTICLES) ||
        hasPermission(Permission.REJECT_ARTICLES))) ||
    (article.status === "PUBLISHED" &&
      hasPermission(Permission.UNPUBLISH_ARTICLE)) ||
    (article.revisionStatus === "REQUESTED" &&
      hasPermission(Permission.APPROVE_ARTICLES)) ||
    hasPermission(Permission.DELETE_ANY_ARTICLE) ||
    (articleScope === "mine" && hasPermission(Permission.DELETE_OWN_ARTICLE));

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedArticles = articles.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );
  const startItem = articles.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(safeCurrentPage * PAGE_SIZE, articles.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!pageReady) {
    return <PageSkeleton />;
  }

  return (
    <PermissionGuard
      permissions={[articleScope === "mine" ? Permission.UPDATE_OWN_ARTICLE : Permission.VIEW_ALL_ARTICLES]}
      showError
    >
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {articleScope === "mine" ? copy.myPageTitle : copy.pageTitle}
          </h1>
          <p className="text-sm text-slate-600">
            {articleScope === "mine" ? copy.myPageDescription : copy.pageDescription}
          </p>
        </div>
        {hasPermission(Permission.CREATE_ARTICLE) && (
          <Link href="/articles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {copy.newArticle}
            </Button>
          </Link>
        )}
      </div>

      <ArticleScopeTabs scope={articleScope} onScopeChange={handleScopeChange} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          {copy.all}
        </Button>
        {(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as ArticleStatus[]).map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {copy.statuses[status]}
            </Button>
          ),
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white md:hidden">
        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            {copy.empty}{" "}
            {hasPermission(Permission.CREATE_ARTICLE) && (
              <Link href="/articles/new" className="text-blue-600 hover:underline">
                {copy.createFirst}
              </Link>
            )}
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <article
              key={article.id}
              className="border-b border-slate-200 py-5 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge className={`text-[11px] font-bold tracking-wide ${statusColors[article.scheduledAt && new Date(article.scheduledAt) > new Date() ? "SCHEDULED" : article.status]}`}>
                  {copy.statuses[article.scheduledAt && new Date(article.scheduledAt) > new Date() ? "SCHEDULED" : article.status]}
                </Badge>
                {hasRowActions(article) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission(Permission.UPDATE_ANY_ARTICLE) ||
                      (articleScope === "mine" && hasPermission(Permission.UPDATE_OWN_ARTICLE)) ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            {copy.edit}
                          </Link>
                        </DropdownMenuItem>
                      ) : (hasPermission(Permission.VIEW_ALL_ARTICLES) ||
                          hasPermission(Permission.REVIEW_ARTICLES)) ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {copy.view}
                          </Link>
                        </DropdownMenuItem>
                      ) : null}
                      {article.status === "DRAFT" &&
                        articleScope === "mine" &&
                        (hasPermission(Permission.CREATE_ARTICLE) ||
                          hasPermission(Permission.UPDATE_OWN_ARTICLE)) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.submitForReview,
                                description: `${copy.submitForReview} "${article.title}"?`,
                                confirmText: copy.submitForReview,
                                onConfirm: () => handleStatusChange(article.id, "REVIEW"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.submitForReview}
                          </DropdownMenuItem>
                        )}
                      {article.status === "DRAFT" &&
                        hasPermission(Permission.PUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.publishTitle,
                                description: copy.publishDescription(article.title),
                                confirmText: copy.publish,
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.publish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.approvePublishTitle,
                                description: copy.approvePublishDescription(article.title),
                                confirmText: copy.approvePublish,
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.approvePublish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.REJECT_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.rejectTitle,
                                description: copy.rejectDescription(article.title),
                                confirmText: copy.reject,
                                variant: "destructive",
                                onConfirm: () => handleStatusChange(article.id, "ARCHIVED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.reject}
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" &&
                        hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.unpublishTitle,
                                description: copy.unpublishDescription(article.title),
                                confirmText: copy.unpublish,
                                onConfirm: () => handleStatusChange(article.id, "DRAFT"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.unpublish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" && (
                        <DropdownMenuItem onClick={() => setShareArticle(article)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          {copy.share}
                        </DropdownMenuItem>
                      )}
                      {(hasPermission(Permission.DELETE_ANY_ARTICLE) ||
                        (articleScope === "mine" && hasPermission(Permission.DELETE_OWN_ARTICLE))) && (
                        <DropdownMenuItem
                          onClick={() => requestDelete(article)}
                          disabled={mutationLoading}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {copy.delete}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-950" title={article.title}>
                    {article.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-slate-500" title={`/${article.slug}`}>
                    /{article.slug}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    title={article.category?.name ?? copy.uncategorized}
                  >
                    {article.category?.name ?? copy.uncategorized}
                  </span>
                  {article.topic && (
                    <span
                      className="max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      title={article.topic}
                    >
                      {article.topic}
                    </span>
                  )}
                  {article.isFeatured && <Badge variant="secondary" className="text-xs">{copy.featured}</Badge>}
                  {article.isEditorsPick && <Badge variant="secondary" className="text-xs">{copy.editorsPick}</Badge>}
                  {article.isBreaking && <Badge variant="destructive" className="text-xs">{copy.breaking}</Badge>}
                  {revisionRequestStatusById[article.id] && (
                    <Badge variant="outline" className="text-xs">
                      {copy.revisionStatus(revisionRequestStatusById[article.id])}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{copy.updated}</span>
                  <span className="font-semibold text-slate-700">
                    {format(new Date(article.updatedAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_108px_48px] items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 xl:grid-cols-[minmax(0,1fr)_120px_140px_140px_112px_48px]">
          <div>{articleScope === "mine" ? copy.myPageTitle : copy.tableTitle}</div>
          <div>{copy.status}</div>
          <div>{copy.category}</div>
          <div className="hidden xl:block">{copy.topic}</div>
          <div>{copy.updated}</div>
          <div className="text-right">{copy.actions}</div>
        </div>

        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            {copy.empty}{" "}
            {hasPermission(Permission.CREATE_ARTICLE) && (
              <Link
                href="/articles/new"
                className="text-blue-600 hover:underline"
              >
                {copy.createFirst}
              </Link>
            )}
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-[minmax(0,1fr)_120px_120px_108px_48px] items-center gap-4 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50 xl:grid-cols-[minmax(0,1fr)_120px_140px_140px_112px_48px]"
            >
              <div className="min-w-0">
                <div className="truncate font-medium" title={article.title}>
                  {article.title}
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                  <span className="truncate" title={`/${article.slug}`}>/{article.slug}</span>
                  {article.isFeatured && (
                    <Badge variant="secondary" className="hidden shrink-0 text-xs lg:inline-flex">
                      {copy.featured}
                    </Badge>
                  )}
                  {article.isEditorsPick && (
                    <Badge variant="secondary" className="hidden shrink-0 text-xs 2xl:inline-flex">
                      {copy.editorsPick}
                    </Badge>
                  )}
                  {article.isBreaking && (
                    <Badge variant="destructive" className="hidden shrink-0 text-xs lg:inline-flex">
                      {copy.breaking}
                    </Badge>
                  )}
                  {article.breakingNewsRequestStatus === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 border-yellow-200"
                    >
                      {copy.breakingRequestPending}
                    </Badge>
                  )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) &&
                    article.breakingNewsRequestStatus === "APPROVED" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 border-green-200"
                      >
                        {copy.breakingRequestApproved}
                      </Badge>
                    )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) &&
                    article.breakingNewsRequestStatus === "REJECTED" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-red-50 border-red-200"
                      >
                        {copy.breakingRequestRejected}
                      </Badge>
                    )}
                  {revisionRequestStatusById[article.id] === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-50 border-purple-200"
                    >
                      {copy.revisionRequested}
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "APPROVED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 border-green-200"
                    >
                      {copy.revisionApproved}
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "REJECTED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-50 border-red-200"
                    >
                      {copy.revisionRejected}
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "CONSUMED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-50 border-slate-200"
                    >
                      {copy.revisionEnd}
                    </Badge>
                  )}
                </div>
                {revisionRequestStatusById[article.id] === "PENDING" &&
                  revisionRequestNoteById[article.id] && (
                    <div className="mt-1 truncate text-xs text-slate-500" title={revisionRequestNoteById[article.id]}>
                      {copy.revisionNote(revisionRequestNoteById[article.id])}
                    </div>
                  )}
              </div>
              <div>
                <Badge className={`text-xs ${statusColors[article.scheduledAt && new Date(article.scheduledAt) > new Date() ? "SCHEDULED" : article.status]}`}>
                  {copy.statuses[article.scheduledAt && new Date(article.scheduledAt) > new Date() ? "SCHEDULED" : article.status]}
                </Badge>
              </div>
              <div className="truncate text-xs text-slate-600" title={article.category?.name ?? "—"}>
                {article.category?.name ?? "—"}
              </div>
              <div className="hidden truncate text-xs text-slate-600 xl:block" title={article.topic ?? "—"}>
                {article.topic ?? "—"}
              </div>
              <div className="whitespace-nowrap text-xs text-slate-600">
                {format(new Date(article.updatedAt), "MMM d, yyyy")}
              </div>
              <div className="text-right">
                {hasRowActions(article) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission(Permission.UPDATE_ANY_ARTICLE) ||
                      (articleScope === "mine" && hasPermission(Permission.UPDATE_OWN_ARTICLE)) ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            {copy.edit}
                          </Link>
                        </DropdownMenuItem>
                      ) : (hasPermission(Permission.VIEW_ALL_ARTICLES) ||
                          hasPermission(Permission.REVIEW_ARTICLES)) ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Eye className="w-4 h-4 mr-2" />
                            {copy.view}
                          </Link>
                        </DropdownMenuItem>
                      ) : null}
                      {article.status === "DRAFT" &&
                        articleScope === "mine" &&
                        (hasPermission(Permission.CREATE_ARTICLE) ||
                          hasPermission(Permission.UPDATE_OWN_ARTICLE)) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.submitForReview,
                                description: `${copy.submitForReview} "${article.title}"?`,
                                confirmText: copy.submitForReview,
                                onConfirm: () => handleStatusChange(article.id, "REVIEW"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.submitForReview}
                          </DropdownMenuItem>
                        )}
                      {article.status === "DRAFT" &&
                        hasPermission(Permission.PUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.publishTitle,
                                description: copy.publishDescription(article.title),
                                confirmText: copy.publish,
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.publish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.approvePublishTitle,
                                description: copy.approvePublishDescription(article.title),
                                confirmText: copy.approvePublish,
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.approvePublish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.REJECT_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.rejectTitle,
                                description: copy.rejectDescription(article.title),
                                confirmText: copy.reject,
                                variant: "destructive",
                                onConfirm: () => handleStatusChange(article.id, "ARCHIVED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.reject}
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" &&
                        hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: copy.unpublishTitle,
                                description: copy.unpublishDescription(article.title),
                                confirmText: copy.unpublish,
                                onConfirm: () => handleStatusChange(article.id, "DRAFT"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            {copy.unpublish}
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" && (
                        <DropdownMenuItem onClick={() => setShareArticle(article)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          {copy.share}
                        </DropdownMenuItem>
                      )}
                      {article.revisionStatus === "REQUESTED" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                requestArticleAction({
                                  title: copy.approveRevisionTitle,
                                  description: copy.approveRevisionDescription(article.title),
                                  confirmText: copy.approveRevision,
                                  onConfirm: () => handleApproveRevision(article.id),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              {copy.approveRevision}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestArticleAction({
                                  title: copy.rejectRevisionTitle,
                                  description: copy.rejectRevisionDescription(article.title),
                                  confirmText: copy.rejectRevision,
                                  variant: "destructive",
                                  onConfirm: () => handleRejectRevision(article.id),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              {copy.rejectRevision}
                            </DropdownMenuItem>
                          </>
                        )}
                      {(hasPermission(Permission.DELETE_ANY_ARTICLE) ||
                        (articleScope === "mine" && hasPermission(Permission.DELETE_OWN_ARTICLE))) && (
                        <DropdownMenuItem
                          onClick={() => requestDelete(article)}
                          disabled={mutationLoading}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {copy.delete}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-slate-400">{copy.noActions}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {articles.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {copy.showing(startItem, endItem, articles.length)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1 || loading}
            >
              {copy.previous}
            </Button>
            <span className="min-w-20 text-center text-xs font-medium text-slate-500">
              {copy.pageOf(safeCurrentPage, totalPages)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages || loading}
            >
              {copy.next}
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((current) => ({ ...current, open }))
        }
        title={copy.deleteTitle}
        description={copy.deleteDescription(deleteDialog.articleTitle)}
        confirmText={copy.deleteConfirm}
        cancelText={copy.cancel}
        variant="destructive"
        onConfirm={() => {
          void confirmDelete();
        }}
      />
      <ArticleShareDialog
        article={shareArticle}
        open={!!shareArticle}
        onOpenChange={(open) => {
          if (!open) setShareArticle(null);
        }}
        publicBaseUrl={publicBaseUrl}
      />
      <ConfirmationDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog((current) => ({ ...current, open }))
        }
        title={actionDialog.title}
        description={actionDialog.description}
        confirmText={actionDialog.confirmText}
        cancelText={copy.cancel}
        variant={actionDialog.variant}
        onConfirm={() => {
          void actionDialog.onConfirm();
        }}
      />
    </main>
    </PermissionGuard>
  );
}
