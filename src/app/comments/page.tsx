"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, MessageSquare, Send, Trash2, UserRound } from "lucide-react";
import { getAuthenticatedGqlClient } from "@/services/graphql-client";
import { Permission } from "@/components/permissions/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToastHelpers } from "@/components/ui/toast";
import { useAdminLocale } from "@/hooks/useAdminLocale";

type Comment = {
  id: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  createdAt: string;
  article: { id: string; title: string };
  publicReader?: { id: string; name: string; email: string } | null;
  replies: CommentReply[];
};

type CommentReply = {
  id: string;
  parentReplyId?: string | null;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  createdAt: string;
  author?: { id: string; name: string; email: string } | null;
  publicReader?: { id: string; name: string; email: string } | null;
  parentReply?: { id: string; authorName: string } | null;
};

const Q_COMMENTS = `query TenantComments { tenantComments { id authorName authorEmail content createdAt article { id title } publicReader { id name email } replies { id parentReplyId authorName authorEmail content createdAt author { id name email } publicReader { id name email } parentReply { id authorName } } } }`;
const M_REPLY = `mutation ReplyToArticleComment($input: ArticleCommentReplyInput!) { replyToArticleComment(input: $input) { id parentReplyId authorName authorEmail content createdAt author { id name email } publicReader { id name email } parentReply { id authorName } } }`;
const M_DELETE_COMMENT = `mutation DeleteArticleComment($id: ID!) { deleteArticleComment(id: $id) { success message } }`;
const M_DELETE_REPLY = `mutation DeleteArticleCommentReply($id: ID!) { deleteArticleCommentReply(id: $id) { success message } }`;

const commentsCopy = {
  en: {
    delete: "Delete",
    commentDeleteFallback: "The comment could not be deleted.",
    commentDeleted: "Comment Deleted",
    commentDeletedDescription: "The comment and its replies were removed.",
    replyDeleteFallback: "The reply could not be deleted.",
    replyDeleted: "Reply Deleted",
    replyDeletedDescription: "The reply was removed.",
    deleteFailed: "Delete Failed",
    commentDeleteFailed: "Failed to delete comment.",
    replyDeleteFailed: "Failed to delete reply.",
    deleteCommentTitle: "Delete Comment?",
    deleteCommentDescription: (title: string) =>
      `Delete this comment on "${title}" and all replies? This action cannot be undone.`,
    deleteComment: "Delete Comment",
    deleteReplyTitle: "Delete Reply?",
    deleteReplyDescription: (name: string) =>
      `Delete this reply from ${name}? This action cannot be undone.`,
    deleteReply: "Delete Reply",
    accessDenied: "Access denied: Review permission required.",
    eyebrow: "Reader Activity",
    title: "Article Comments",
    description: "See which signed-in readers and anonymous visitors commented on each article.",
    loading: "Loading comments...",
    empty: "No comments yet.",
    anonymous: "Anonymous",
    googleReader: "Google reader",
    collapse: "Collapse",
    manage: "Manage",
    hideReplies: "Hide replies",
    replyCount: (count: number) => `${count} ${count === 1 ? "reply" : "replies"}`,
    tenant: "Website",
    reader: "Reader",
    to: "to",
    replyPlaceholder: "Reply as sub-tenant...",
    reply: "Reply",
    deleting: "Deleting...",
  },
  km: {
    delete: "លុប",
    commentDeleteFallback: "មិនអាចលុបមតិនេះបានទេ។",
    commentDeleted: "បានលុបមតិ",
    commentDeletedDescription: "បានលុបមតិ និងការឆ្លើយតបទាំងអស់។",
    replyDeleteFallback: "មិនអាចលុបការឆ្លើយតបនេះបានទេ។",
    replyDeleted: "បានលុបការឆ្លើយតប",
    replyDeletedDescription: "បានលុបការឆ្លើយតប។",
    deleteFailed: "លុបមិនបានសម្រេច",
    commentDeleteFailed: "លុបមតិមិនបានសម្រេច។",
    replyDeleteFailed: "លុបការឆ្លើយតបមិនបានសម្រេច។",
    deleteCommentTitle: "លុបមតិ?",
    deleteCommentDescription: (title: string) =>
      `លុបមតិនេះលើ "${title}" និងការឆ្លើយតបទាំងអស់? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteComment: "លុបមតិ",
    deleteReplyTitle: "លុបការឆ្លើយតប?",
    deleteReplyDescription: (name: string) =>
      `លុបការឆ្លើយតបនេះពី ${name}? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteReply: "លុបការឆ្លើយតប",
    accessDenied: "គ្មានសិទ្ធិ៖ ត្រូវការសិទ្ធិត្រួតពិនិត្យ។",
    eyebrow: "សកម្មភាពអ្នកអាន",
    title: "មតិយោបល់លើអត្ថបទ",
    description: "មើលអ្នកអានដែលបានចូលប្រើ និងភ្ញៀវអនាមិកដែលបានបញ្ចេញមតិលើអត្ថបទនីមួយៗ។",
    loading: "កំពុងផ្ទុកមតិយោបល់...",
    empty: "មិនទាន់មានមតិយោបល់ទេ។",
    anonymous: "អនាមិក",
    googleReader: "អ្នកអាន Google",
    collapse: "បង្រួម",
    manage: "គ្រប់គ្រង",
    hideReplies: "លាក់ការឆ្លើយតប",
    replyCount: (count: number) => `${count} ការឆ្លើយតប`,
    tenant: "គេហទំព័រ",
    reader: "អ្នកអាន",
    to: "ទៅកាន់",
    replyPlaceholder: "ឆ្លើយតបក្នុងនាមគេហទំព័រ...",
    reply: "ឆ្លើយតប",
    deleting: "កំពុងលុប...",
  },
} as const;

export default function CommentsPage() {
  const { locale } = useAdminLocale();
  const copy = commentsCopy[locale];
  const { showSuccess, showError } = useToastHelpers();
  const { hasPermission, isSuperAdmin, isLoading: permissionsLoading } = usePermissions();
  const canReview = isSuperAdmin || hasPermission(Permission.REVIEW_ARTICLES);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmText: copy.delete,
    onConfirm: () => {},
  });

  const loadComments = useCallback(async () => {
    if (permissionsLoading || !canReview) return;
    setLoading(true);
    try {
      const response = await getAuthenticatedGqlClient().request<{ tenantComments: Comment[] }>(Q_COMMENTS);
      setComments(response.tenantComments ?? []);
    } finally {
      setLoading(false);
    }
  }, [canReview, permissionsLoading]);

  useEffect(() => { void loadComments(); }, [loadComments]);

  const submitReply = async (commentId: string) => {
    const content = (replyDrafts[commentId] ?? "").trim();
    if (!content) return;
    setReplyingId(commentId);
    try {
      const response = await getAuthenticatedGqlClient().request<{ replyToArticleComment: CommentReply }>(
        M_REPLY,
        { input: { commentId, content } },
      );
      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: [...(comment.replies ?? []), response.replyToArticleComment] }
            : comment,
        ),
      );
      setReplyDrafts((current) => ({ ...current, [commentId]: "" }));
    } finally {
      setReplyingId(null);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const response = await getAuthenticatedGqlClient().request<{
        deleteArticleComment: { success: boolean; message?: string | null };
      }>(M_DELETE_COMMENT, { id: commentId });
      if (!response.deleteArticleComment.success) {
        throw new Error(response.deleteArticleComment.message || copy.commentDeleteFallback);
      }
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      showSuccess(copy.commentDeleted, locale === "en" ? response.deleteArticleComment.message || copy.commentDeletedDescription : copy.commentDeletedDescription);
    } catch (err) {
      const message = locale === "en" && err instanceof Error ? err.message : copy.commentDeleteFailed;
      showError(copy.deleteFailed, message);
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  const deleteReply = async (commentId: string, replyId: string) => {
    setDeletingId(replyId);
    try {
      const response = await getAuthenticatedGqlClient().request<{
        deleteArticleCommentReply: { success: boolean; message?: string | null };
      }>(M_DELETE_REPLY, { id: replyId });
      if (!response.deleteArticleCommentReply.success) {
        throw new Error(response.deleteArticleCommentReply.message || copy.replyDeleteFallback);
      }
      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? { ...comment, replies: comment.replies.filter((reply) => reply.id !== replyId) }
          : comment,
        ),
      );
      showSuccess(copy.replyDeleted, locale === "en" ? response.deleteArticleCommentReply.message || copy.replyDeletedDescription : copy.replyDeletedDescription);
    } catch (err) {
      const message = locale === "en" && err instanceof Error ? err.message : copy.replyDeleteFailed;
      showError(copy.deleteFailed, message);
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  const previewText = (value: string, max = 140) =>
    value.length > max ? `${value.slice(0, max).trim()}...` : value;

  const requestDeleteComment = (comment: Comment) => {
    setDeleteDialog({
      open: true,
      title: copy.deleteCommentTitle,
      description: copy.deleteCommentDescription(comment.article.title),
      confirmText: copy.deleteComment,
      onConfirm: () => deleteComment(comment.id),
    });
  };

  const requestDeleteReply = (comment: Comment, reply: CommentReply) => {
    setDeleteDialog({
      open: true,
      title: copy.deleteReplyTitle,
      description: copy.deleteReplyDescription(reply.author?.name ?? reply.publicReader?.name ?? reply.authorName),
      confirmText: copy.deleteReply,
      onConfirm: () => deleteReply(comment.id, reply.id),
    });
  };

  if (!permissionsLoading && !canReview) return <div className="text-sm text-red-600">{copy.accessDenied}</div>;

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300"><MessageSquare className="h-4 w-4" />{copy.eyebrow}</div>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{copy.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.description}</p>
      </header>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        {loading ? <div className="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{copy.loading}</div> : comments.length === 0 ? <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">{copy.empty}</p> : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{comments.map((comment) => {
            const replies = comment.replies ?? [];
            const repliesOpen = openReplies[comment.id] ?? false;
            const expanded = expandedComments[comment.id] ?? false;
            return <article key={comment.id} className="p-4 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/45">
              <div className="flex gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-slate-900 dark:text-white">{comment.publicReader?.name ?? copy.anonymous}</strong>
                    {comment.publicReader ? <Badge variant="success">{copy.googleReader}</Badge> : <Badge variant="secondary">{copy.anonymous}</Badge>}
                    {comment.publicReader && <span className="truncate text-xs text-slate-400">{comment.publicReader.email}</span>}
                    <time className="text-xs text-slate-400">{formatDate(comment.createdAt)}</time>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-blue-700 dark:text-sky-300">{comment.article.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{expanded ? comment.content : previewText(comment.content)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedComments((current) => ({
                          ...current,
                          [comment.id]: !expanded,
                        }))
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      {expanded ? copy.collapse : copy.manage}
                    </button>
                    {replies.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenReplies((current) => ({
                            ...current,
                            [comment.id]: !repliesOpen,
                          }))
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        aria-expanded={repliesOpen}
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${repliesOpen ? "rotate-180" : ""}`} />
                        {repliesOpen ? copy.hideReplies : copy.replyCount(replies.length)}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => requestDeleteComment(comment)}
                      disabled={deletingId === comment.id}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {copy.delete}
                    </button>
                  </div>

                  {replies.length > 0 && repliesOpen && (
                    <div className="mt-3 space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-100 dark:bg-slate-950/40 dark:ring-slate-800">
                      {replies.map((reply) => (
                        <div key={reply.id} className="border-l-2 border-blue-200 pl-3 dark:border-blue-400/40">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <strong className="text-slate-800 dark:text-slate-100">{reply.author?.name ?? reply.publicReader?.name ?? reply.authorName}</strong>
                            <Badge variant="secondary">{reply.author ? copy.tenant : reply.publicReader ? copy.reader : copy.anonymous}</Badge>
                            {reply.parentReply && <span>{copy.to} {reply.parentReply.authorName}</span>}
                            <time>{formatDate(reply.createdAt)}</time>
                            <button
                              type="button"
                              onClick={() => requestDeleteReply(comment, reply)}
                              disabled={deletingId === reply.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-500 disabled:opacity-60 dark:text-red-300 dark:hover:text-red-200"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {copy.delete}
                            </button>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {expanded && (
                    <div className="mt-3">
                      <textarea
                        rows={2}
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                        placeholder={copy.replyPlaceholder}
                        className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void submitReply(comment.id)}
                          disabled={replyingId === comment.id || !(replyDrafts[comment.id] ?? "").trim()}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {replyingId === comment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          {copy.reply}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </article>;
          })}</div>
        )}
      </section>
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((current) => ({ ...current, open }))}
        title={deleteDialog.title}
        description={deleteDialog.description}
        confirmText={deleteDialog.confirmText}
        pendingText={copy.deleting}
        variant="destructive"
        onConfirm={() => {
          void deleteDialog.onConfirm();
        }}
      />
    </div>
  );
}
