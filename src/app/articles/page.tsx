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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/components/permissions/PermissionGuard";

const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800",
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    articleId: string | null;
    articleTitle: string;
  }>({
    open: false,
    articleId: null,
    articleTitle: "",
  });
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
      take: 50,
      skip: 0,
    });

    if (response?.articles) {
      setArticles(response.articles);
      await loadRevisionStatuses(response.articles);
    }
  }, [getArticles, loadRevisionStatuses, statusFilter]);

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

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Articles</h1>
          <p className="text-sm text-slate-600">
            Create, edit, and publish articles.
          </p>
        </div>
        <Link href="/articles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Topic</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {articles.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500">
            No articles found.{" "}
            <Link
              href="/articles/new"
              className="text-blue-600 hover:underline"
            >
              Create your first article
            </Link>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-12 items-center px-4 py-3 text-sm border-b last:border-b-0 hover:bg-slate-50"
            >
              <div className="col-span-4">
                <div className="font-medium">{article.title}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  /{article.slug}
                  {article.isFeatured && (
                    <Badge variant="secondary" className="text-xs">
                      Featured
                    </Badge>
                  )}
                  {article.isEditorsPick && (
                    <Badge variant="secondary" className="text-xs">
                      Editor&apos;s Pick
                    </Badge>
                  )}
                  {article.isBreaking && (
                    <Badge variant="destructive" className="text-xs">
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
                    <div className="text-xs text-slate-500 mt-1">
                      Revision note: {revisionRequestNoteById[article.id]}
                    </div>
                  )}
              </div>
              <div className="col-span-2">
                <Badge className={`text-xs ${statusColors[article.status]}`}>
                  {article.status}
                </Badge>
              </div>
              <div className="col-span-2 text-slate-600 text-xs">
                {article.category?.name ?? "—"}
              </div>
              <div className="col-span-1 text-slate-600 text-xs">
                {article.topic ?? "—"}
              </div>
              <div className="col-span-2 text-slate-600 text-xs">
                {format(new Date(article.updatedAt), "MMM d, yyyy")}
              </div>
              <div className="col-span-1 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/articles/${article.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {article.status === "DRAFT" &&
                      hasPermission(Permission.PUBLISH_ARTICLE) && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(article.id, "PUBLISHED")
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
                            handleStatusChange(article.id, "PUBLISHED")
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
                            handleStatusChange(article.id, "ARCHIVED")
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
                            handleStatusChange(article.id, "DRAFT")
                          }
                          disabled={mutationLoading}
                        >
                          Unpublish
                        </DropdownMenuItem>
                      )}
                    {article.revisionStatus === "REQUESTED" &&
                      hasPermission(Permission.APPROVE_ARTICLES) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleApproveRevision(article.id)}
                            disabled={mutationLoading}
                          >
                            ✓ Approve Revision
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRejectRevision(article.id)}
                            disabled={mutationLoading}
                          >
                            ✗ Reject Revision
                          </DropdownMenuItem>
                        </>
                      )}
                    <DropdownMenuItem
                      onClick={() => requestDelete(article)}
                      disabled={mutationLoading}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

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
    </main>
  );
}
