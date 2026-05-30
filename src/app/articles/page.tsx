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
import { MoreHorizontal, Edit, Trash2, Plus, Share2 } from "lucide-react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, PermissionGuard } from "@/components/permissions/PermissionGuard";
import { useTenant } from "@/contexts/TenantContext";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 10;

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
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
    confirmText: "Confirm",
    onConfirm: () => {},
  });
  const [shareArticle, setShareArticle] = useState<Article | null>(null);
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
  const { activeTenant } = useTenant();
  const publicBaseUrl = useMemo(() => {
    const primarySite =
      activeTenant?.sites.find((site) => site.isPrimary) ||
      activeTenant?.sites[0];

    return primarySite?.publicBaseUrl ?? null;
  }, [activeTenant]);

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
    const response = await getArticles({
      status: statusFilter,
      take: 1000,
      skip: 0,
    });

    if (response?.articles) {
      setArticles(response.articles);
      await loadRevisionStatuses(response.articles);
    }
  }, [getArticles, loadRevisionStatuses, statusFilter]);

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
    (article.status === "DRAFT" && hasPermission(Permission.PUBLISH_ARTICLE)) ||
    (article.status === "REVIEW" &&
      (hasPermission(Permission.APPROVE_ARTICLES) ||
        hasPermission(Permission.REJECT_ARTICLES))) ||
    (article.status === "PUBLISHED" &&
      hasPermission(Permission.UNPUBLISH_ARTICLE)) ||
    (article.revisionStatus === "REQUESTED" &&
      hasPermission(Permission.APPROVE_ARTICLES)) ||
    hasPermission(Permission.DELETE_ANY_ARTICLE);

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

  return (
    <PermissionGuard permissions={[Permission.VIEW_ALL_ARTICLES]} showError>
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Articles</h1>
          <p className="text-sm text-slate-600">
            Create, edit, and publish articles.
          </p>
        </div>
        {hasPermission(Permission.CREATE_ARTICLE) && (
          <Link href="/articles/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as ArticleStatus[]).map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ),
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {articles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500">
            No articles found.{" "}
            {hasPermission(Permission.CREATE_ARTICLE) && (
              <Link href="/articles/new" className="text-blue-600 hover:underline">
                Create your first article
              </Link>
            )}
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <article
              key={article.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <Badge className={`text-[11px] font-bold tracking-wide ${statusColors[article.status]}`}>
                  {article.status}
                </Badge>
                {hasRowActions(article) ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {hasPermission(Permission.UPDATE_ANY_ARTICLE) && (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {article.status === "DRAFT" &&
                        hasPermission(Permission.PUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Publish Article?",
                                description: `Publish "${article.title}" now?`,
                                confirmText: "Publish",
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Publish
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Approve and Publish?",
                                description: `Approve "${article.title}" and publish it?`,
                                confirmText: "Approve & Publish",
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Approve & Publish
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.REJECT_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Reject Article?",
                                description: `Reject "${article.title}" and archive it?`,
                                confirmText: "Reject",
                                variant: "destructive",
                                onConfirm: () => handleStatusChange(article.id, "ARCHIVED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Reject
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" &&
                        hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Unpublish Article?",
                                description: `Move "${article.title}" back to draft?`,
                                confirmText: "Unpublish",
                                onConfirm: () => handleStatusChange(article.id, "DRAFT"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Unpublish
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" && (
                        <DropdownMenuItem onClick={() => setShareArticle(article)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                      )}
                      {hasPermission(Permission.DELETE_ANY_ARTICLE) && (
                        <DropdownMenuItem
                          onClick={() => requestDelete(article)}
                          disabled={mutationLoading}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
                    title={article.category?.name ?? "Uncategorized"}
                  >
                    {article.category?.name ?? "Uncategorized"}
                  </span>
                  {article.topic && (
                    <span
                      className="max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                      title={article.topic}
                    >
                      {article.topic}
                    </span>
                  )}
                  {article.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  {article.isEditorsPick && <Badge variant="secondary" className="text-xs">Editor&apos;s Pick</Badge>}
                  {article.isBreaking && <Badge variant="destructive" className="text-xs">Breaking</Badge>}
                  {revisionRequestStatusById[article.id] && (
                    <Badge variant="outline" className="text-xs">
                      Revision {revisionRequestStatusById[article.id].toLowerCase()}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>Updated</span>
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
          <div>Title</div>
          <div>Status</div>
          <div>Category</div>
          <div className="hidden xl:block">Topic</div>
          <div>Updated</div>
          <div className="text-right">Actions</div>
        </div>

        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            No articles found.{" "}
            {hasPermission(Permission.CREATE_ARTICLE) && (
              <Link
                href="/articles/new"
                className="text-blue-600 hover:underline"
              >
                Create your first article
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
                      Featured
                    </Badge>
                  )}
                  {article.isEditorsPick && (
                    <Badge variant="secondary" className="hidden shrink-0 text-xs 2xl:inline-flex">
                      Editor&apos;s Pick
                    </Badge>
                  )}
                  {article.isBreaking && (
                    <Badge variant="destructive" className="hidden shrink-0 text-xs lg:inline-flex">
                      Breaking
                    </Badge>
                  )}
                  {article.breakingNewsRequestStatus === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 border-yellow-200"
                    >
                      🔔 Breaking Request: Pending
                    </Badge>
                  )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) &&
                    article.breakingNewsRequestStatus === "APPROVED" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 border-green-200"
                      >
                        ✅ Breaking Request: Approved
                      </Badge>
                    )}
                  {!hasPermission(Permission.SET_BREAKING_NEWS) &&
                    article.breakingNewsRequestStatus === "REJECTED" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-red-50 border-red-200"
                      >
                        ❌ Breaking Request: Rejected
                      </Badge>
                    )}
                  {revisionRequestStatusById[article.id] === "PENDING" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-purple-50 border-purple-200"
                    >
                      📝 Revision Requested
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "APPROVED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 border-green-200"
                    >
                      ✅ Revision Approved
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "REJECTED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-50 border-red-200"
                    >
                      ❌ Revision Rejected
                    </Badge>
                  )}
                  {revisionRequestStatusById[article.id] === "CONSUMED" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-50 border-slate-200"
                    >
                      ✔ Revision End
                    </Badge>
                  )}
                </div>
                {revisionRequestStatusById[article.id] === "PENDING" &&
                  revisionRequestNoteById[article.id] && (
                    <div className="mt-1 truncate text-xs text-slate-500" title={revisionRequestNoteById[article.id]}>
                      Revision note: {revisionRequestNoteById[article.id]}
                    </div>
                  )}
              </div>
              <div>
                <Badge className={`text-xs ${statusColors[article.status]}`}>
                  {article.status}
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
                      {hasPermission(Permission.UPDATE_ANY_ARTICLE) && (
                        <DropdownMenuItem asChild>
                          <Link href={`/articles/${article.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {article.status === "DRAFT" &&
                        hasPermission(Permission.PUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Publish Article?",
                                description: `Publish "${article.title}" now?`,
                                confirmText: "Publish",
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Publish
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Approve and Publish?",
                                description: `Approve "${article.title}" and publish it?`,
                                confirmText: "Approve & Publish",
                                onConfirm: () => handleStatusChange(article.id, "PUBLISHED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Approve & Publish
                          </DropdownMenuItem>
                        )}
                      {article.status === "REVIEW" &&
                        hasPermission(Permission.REJECT_ARTICLES) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Reject Article?",
                                description: `Reject "${article.title}" and archive it?`,
                                confirmText: "Reject",
                                variant: "destructive",
                                onConfirm: () => handleStatusChange(article.id, "ARCHIVED"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Reject
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" &&
                        hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                          <DropdownMenuItem
                            onClick={() =>
                              requestArticleAction({
                                title: "Unpublish Article?",
                                description: `Move "${article.title}" back to draft?`,
                                confirmText: "Unpublish",
                                onConfirm: () => handleStatusChange(article.id, "DRAFT"),
                              })
                            }
                            disabled={mutationLoading}
                          >
                            Unpublish
                          </DropdownMenuItem>
                        )}
                      {article.status === "PUBLISHED" && (
                        <DropdownMenuItem onClick={() => setShareArticle(article)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                      )}
                      {article.revisionStatus === "REQUESTED" &&
                        hasPermission(Permission.APPROVE_ARTICLES) && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                requestArticleAction({
                                  title: "Approve Revision?",
                                  description: `Approve the revision request for "${article.title}"?`,
                                  confirmText: "Approve Revision",
                                  onConfirm: () => handleApproveRevision(article.id),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              ✓ Approve Revision
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                requestArticleAction({
                                  title: "Reject Revision?",
                                  description: `Reject the revision request for "${article.title}"?`,
                                  confirmText: "Reject Revision",
                                  variant: "destructive",
                                  onConfirm: () => handleRejectRevision(article.id),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              ✗ Reject Revision
                            </DropdownMenuItem>
                          </>
                        )}
                      {hasPermission(Permission.DELETE_ANY_ARTICLE) && (
                        <DropdownMenuItem
                          onClick={() => requestDelete(article)}
                          disabled={mutationLoading}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {articles.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Showing {startItem}-{endItem} of {articles.length} articles
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="min-w-20 text-center text-xs font-medium text-slate-500">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((current) => ({ ...current, open }))
        }
        title="Delete Article?"
        description={`Delete "${deleteDialog.articleTitle || "this article"}"? This action cannot be undone.`}
        confirmText="Delete Article"
        cancelText="Cancel"
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
        cancelText="Cancel"
        variant={actionDialog.variant}
        onConfirm={() => {
          void actionDialog.onConfirm();
        }}
      />
    </main>
    </PermissionGuard>
  );
}
