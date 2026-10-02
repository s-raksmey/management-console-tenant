'use client';

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { useArticles, useArticleMutations, useRevisions } from "@/hooks/useGraphQL";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArticleShareDialog } from "@/components/articles/article-share-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Article, ArticleStatus } from "@/types/article";
import { StatusBadge } from "@/components/ui/status-badge";
import { useVisibilityPolling } from "@/hooks/usePolling";
import { useToastHelpers } from "@/components/ui/toast";
import { getStatusChangeNotification } from "@/utils/workflowNotifications";
import { Permission } from "@/components/permissions/PermissionGuard";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Plus, RefreshCw, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const PAGE_SIZE = 10;

const myArticlesCopy = {
  en: {
    confirm: "Confirm",
    loadError: "Error loading articles:",
    loading: "Loading your articles...",
    title: "My Articles",
    description: "Manage your personal articles",
    autoUpdating: "Auto-updating every 10s",
    pauseUpdates: "Pause Updates",
    resumeUpdates: "Resume Updates",
    newArticle: "New Article",
    status: "Status",
    all: "All",
    draft: "Draft",
    review: "Review",
    published: "Published",
    archived: "Archived",
    emptySignedIn: "No articles found. Create your first article!",
    emptySignedOut: "Please log in to view your articles.",
    edit: "Edit",
    submitForReview: "Submit for Review",
    submitForReviewTitle: "Submit for Review?",
    submitForReviewDescription: (title: string) => `Submit "${title}" to the review queue?`,
    submit: "Submit",
    publish: "Publish",
    publishTitle: "Publish Article?",
    publishDescription: (title: string) => `Publish "${title}" now?`,
    sendBack: "Send Back",
    sendBackToDraft: "Send Back to Draft",
    sendBackTitle: "Send Back to Draft?",
    sendBackDescription: (title: string) => `Move "${title}" back to draft?`,
    archive: "Archive",
    archiveTitle: "Archive Article?",
    archiveDescription: (title: string) => `Archive "${title}"?`,
    share: "Share",
    delete: "Delete",
    deleteTitle: "Delete Article?",
    deleteDescription: (title: string) => `Delete "${title}"? This action cannot be undone.`,
    deleteArticle: "Delete Article",
    uncategorized: "Uncategorized",
    breaking: "Breaking",
    revision: (status: string) => `Revision ${status.toLowerCase()}`,
    revisionRequested: "Revision Requested",
    revisionApproved: "Revision Approved",
    revisionRejected: "Revision Rejected",
    revisionEnd: "Revision End",
    updated: "Updated",
    category: "Category",
    actions: "Actions",
    showing: (start: number, end: number, total: number) => `Showing ${start}-${end} of ${total} articles`,
    previous: "Previous",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
    next: "Next",
    cancel: "Cancel",
    noServerResponse: "No response from server. Please try again.",
    updateStatusFailedTitle: "Failed to update status",
    updateStatusFailedMessage: "Failed to update status. Please try again or contact support",
  },
  km: {
    confirm: "បញ្ជាក់",
    loadError: "មានបញ្ហាផ្ទុកអត្ថបទ៖",
    loading: "កំពុងផ្ទុកអត្ថបទរបស់អ្នក...",
    title: "អត្ថបទរបស់ខ្ញុំ",
    description: "គ្រប់គ្រងអត្ថបទផ្ទាល់ខ្លួនរបស់អ្នក",
    autoUpdating: "ធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តិរៀងរាល់ 10 វិនាទី",
    pauseUpdates: "ផ្អាកបច្ចុប្បន្នភាព",
    resumeUpdates: "បន្តបច្ចុប្បន្នភាព",
    newArticle: "អត្ថបទថ្មី",
    status: "ស្ថានភាព",
    all: "ទាំងអស់",
    draft: "ព្រាង",
    review: "ត្រួតពិនិត្យ",
    published: "បានផ្សព្វផ្សាយ",
    archived: "បានដាក់ប័ណ្ណសារ",
    emptySignedIn: "រកមិនឃើញអត្ថបទ។ បង្កើតអត្ថបទដំបូងរបស់អ្នក!",
    emptySignedOut: "សូមចូលប្រើ ដើម្បីមើលអត្ថបទរបស់អ្នក។",
    edit: "កែសម្រួល",
    submitForReview: "ផ្ញើទៅត្រួតពិនិត្យ",
    submitForReviewTitle: "ផ្ញើទៅត្រួតពិនិត្យ?",
    submitForReviewDescription: (title: string) => `ផ្ញើ "${title}" ទៅជួរត្រួតពិនិត្យ?`,
    submit: "ផ្ញើ",
    publish: "ផ្សព្វផ្សាយ",
    publishTitle: "ផ្សព្វផ្សាយអត្ថបទ?",
    publishDescription: (title: string) => `ផ្សព្វផ្សាយ "${title}" ឥឡូវនេះ?`,
    sendBack: "ផ្ញើត្រឡប់",
    sendBackToDraft: "ផ្ញើត្រឡប់ទៅព្រាង",
    sendBackTitle: "ផ្ញើត្រឡប់ទៅព្រាង?",
    sendBackDescription: (title: string) => `ផ្លាស់ទី "${title}" ត្រឡប់ទៅព្រាង?`,
    archive: "ដាក់ប័ណ្ណសារ",
    archiveTitle: "ដាក់អត្ថបទក្នុងប័ណ្ណសារ?",
    archiveDescription: (title: string) => `ដាក់ "${title}" ក្នុងប័ណ្ណសារ?`,
    share: "ចែករំលែក",
    delete: "លុប",
    deleteTitle: "លុបអត្ថបទ?",
    deleteDescription: (title: string) => `លុប "${title}"? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteArticle: "លុបអត្ថបទ",
    uncategorized: "មិនមានប្រភេទ",
    breaking: "ទាន់ហេតុការណ៍",
    revision: (status: string) => `ការកែសម្រួល ${status.toLowerCase()}`,
    revisionRequested: "បានស្នើកែសម្រួល",
    revisionApproved: "ការកែសម្រួលបានអនុម័ត",
    revisionRejected: "ការកែសម្រួលត្រូវបានបដិសេធ",
    revisionEnd: "ការកែសម្រួលបានបញ្ចប់",
    updated: "បានធ្វើបច្ចុប្បន្នភាព",
    category: "ប្រភេទ",
    actions: "សកម្មភាព",
    showing: (start: number, end: number, total: number) => `បង្ហាញ ${start}-${end} ក្នុងចំណោម ${total} អត្ថបទ`,
    previous: "មុន",
    pageOf: (page: number, total: number) => `ទំព័រ ${page} ក្នុងចំណោម ${total}`,
    next: "បន្ទាប់",
    cancel: "បោះបង់",
    noServerResponse: "មិនមានការឆ្លើយតបពីម៉ាស៊ីនមេ។ សូមព្យាយាមម្តងទៀត។",
    updateStatusFailedTitle: "ធ្វើបច្ចុប្បន្នភាពស្ថានភាពមិនបានសម្រេច",
    updateStatusFailedMessage: "ធ្វើបច្ចុប្បន្នភាពស្ថានភាពមិនបានសម្រេច។ សូមព្យាយាមម្តងទៀត ឬទាក់ទងផ្នែកជំនួយ។",
  },
} as const;

const statusCopyKeys: Record<ArticleStatus, "draft" | "review" | "published" | "archived"> = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export default function MyArticlesPage() {
  const { locale } = useAdminLocale();
  const copy = myArticlesCopy[locale];
  const [articles, setArticles] = useState<Article[]>([]);
  const [previousArticles, setPreviousArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [isPolling, setIsPolling] = useState(true);
  const [revisionRequestStatusById, setRevisionRequestStatusById] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<{
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
  
  const { getArticles, loading, error } = useArticles();
  const loadStarted = useRef(false);
  const [initialReady, setInitialReady] = useState(false);

  useEffect(() => {
    if (loading) loadStarted.current = true;
    if (loadStarted.current && !loading) setInitialReady(true);
  }, [loading]);
  const { getLatestRevisionRequest } = useRevisions();
  const { setArticleStatus, performWorkflowAction, deleteArticle, loading: mutationLoading } = useArticleMutations();
  const { user } = useAuth();
  const { activeTenant } = useTenant();
  const { userRole, hasPermission } = usePermissions();
  const { showSuccess, showError, showInfo } = useToastHelpers();
  const publicBaseUrl = activeTenant?.sites.find((site) => site.isPrimary)?.publicBaseUrl
    ?? activeTenant?.sites[0]?.publicBaseUrl
    ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const loadRevisionStatuses = useCallback(async (list: Article[]) => {
    if (!list.length) {
      setRevisionRequestStatusById({});
      return;
    }

    try {
      const results = await Promise.all(
        list.map(async (article) => {
          const data = await getLatestRevisionRequest(article.id);
          const latest = data?.latestRevisionRequest;
          if (latest?.consumedAt) {
            return [article.id, 'CONSUMED'] as const;
          }
          return [article.id, latest?.status] as const;
        })
      );

      const nextMap: Record<string, string> = {};
      results.forEach(([id, status]) => {
        if (status) {
          nextMap[id] = status;
        }
      });
      setRevisionRequestStatusById(nextMap);
    } catch (error) {
      console.error('Failed to load revision request statuses:', error);
    }
  }, [getLatestRevisionRequest]);

  // Polling function to check for status changes
  const pollForUpdates = useCallback(async () => {
    if (!user?.id || loading) return;
    
    try {
      const response = await getArticles({ 
        status: statusFilter,
        authorId: user.id,
        take: 1000,
        skip: 0,
      });
      
      if (response?.articles) {
        const newArticles = response.articles;
        
        // Check for status changes
        if (previousArticles.length > 0) {
          newArticles.forEach((newArticle: { id: string; status: ArticleStatus; }) => {
            const oldArticle = previousArticles.find(a => a.id === newArticle.id);
            if (oldArticle && oldArticle.status !== newArticle.status) {
              const notification = getStatusChangeNotification(
                oldArticle.status,
                newArticle.status,
                userRole || 'AUTHOR',
                locale,
              );
              
              if (notification) {
                if (notification.type === 'success') {
                  showSuccess(notification.title, notification.message);
                } else if (notification.type === 'warning') {
                  showError(notification.title, notification.message);
                } else {
                  showInfo(notification.title, notification.message);
                }
              }
            }
          });
        }
        
        setPreviousArticles(articles);
        setArticles(newArticles);
        await loadRevisionStatuses(newArticles);
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Don't show error toast for polling failures to avoid spam
    }
  }, [user?.id, statusFilter, loading, articles, previousArticles, userRole, locale, showSuccess, showError, showInfo, getArticles, loadRevisionStatuses]);

  // Set up 10-second polling
  useVisibilityPolling(pollForUpdates, {
    interval: 10000, // 10 seconds
    enabled: isPolling && !!user?.id,
    immediate: false
  });

  const loadMyArticles = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const response = await getArticles({ 
      status: statusFilter,
      authorId: user.id, // Filter to only current user's articles
      take: 1000,
      skip: 0,
    });
    
    if (response?.articles) {
      setArticles(response.articles);
      await loadRevisionStatuses(response.articles);
    } else {
      setArticles([]);
    }
  }, [getArticles, loadRevisionStatuses, statusFilter, user]);

  useEffect(() => {
    void loadMyArticles();
  }, [loadMyArticles]);

  const handleStatusChange = async (articleId: string, newStatus: ArticleStatus) => {
    try {
      const article = articles.find(a => a.id === articleId);
      const oldStatus = article?.status;
      const result = oldStatus === 'DRAFT' && newStatus === 'REVIEW'
        ? await performWorkflowAction({
            articleId,
            action: 'SUBMIT_FOR_REVIEW',
          })
        : await setArticleStatus(articleId, newStatus);
      
      if (!result) {
        throw new Error(copy.noServerResponse);
      }
      
      // Show notification for status change
      if (oldStatus) {
        const notification = getStatusChangeNotification(
          oldStatus,
          newStatus,
          userRole || 'AUTHOR',
          locale,
        );
        
        if (notification) {
          if (notification.type === 'success') {
            showSuccess(notification.title, notification.message);
          } else if (notification.type === 'warning') {
            showError(notification.title, notification.message);
          } else {
            showInfo(notification.title, notification.message);
          }
        }
      }
      
      loadMyArticles(); // Reload articles after status change
    } catch (error) {
      console.error('❌ Error updating article status:', error);
      const errorMessage = locale === "en" && error instanceof Error ? error.message : copy.updateStatusFailedMessage;
      showError(copy.updateStatusFailedTitle, errorMessage);
    }
  };

  const requestAction = (input: {
    title: string;
    description: string;
    confirmText: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmation({
      open: true,
      title: input.title,
      description: input.description,
      confirmText: input.confirmText,
      variant: input.variant,
      onConfirm: input.onConfirm,
    });
  };

  const handleDelete = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      loadMyArticles(); // Reload articles after deletion
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

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

  if (!initialReady) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">{copy.loadError} {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-muted-foreground">
              {copy.description}
            </p>
            {isPolling && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{copy.autoUpdating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolling(!isPolling)}
          >
            {isPolling ? copy.pauseUpdates : copy.resumeUpdates}
          </Button>
          {hasPermission(Permission.CREATE_ARTICLE) && (
            <Link href="/articles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {copy.newArticle}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {copy.status}: {statusFilter ? copy[statusCopyKeys[statusFilter]] : copy.all}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
              {copy.all}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('DRAFT')}>
              {copy.draft}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('REVIEW')}>
              {copy.review}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('PUBLISHED')}>
              {copy.published}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ARCHIVED')}>
              {copy.archived}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Article Cards */}
      <div className="overflow-hidden rounded-xl border bg-white md:hidden">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {user?.id ? copy.emptySignedIn : copy.emptySignedOut}
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <article key={article.id} className="border-b py-5 last:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={article.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hasPermission(Permission.UPDATE_OWN_ARTICLE) && (
                      <DropdownMenuItem asChild>
                        <Link href={`/articles/${article.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {copy.edit}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {article.status === 'DRAFT' && hasPermission(Permission.CREATE_ARTICLE) && (
                      <DropdownMenuItem
                        onClick={() =>
                          requestAction({
                            title: copy.submitForReviewTitle,
                            description: copy.submitForReviewDescription(article.title),
                            confirmText: copy.submit,
                            onConfirm: () => handleStatusChange(article.id, 'REVIEW'),
                          })
                        }
                        disabled={mutationLoading}
                      >
                        {copy.submitForReview}
                      </DropdownMenuItem>
                    )}
                    {article.status === 'REVIEW' && hasPermission(Permission.APPROVE_ARTICLES) && (
                        <DropdownMenuItem
                          onClick={() =>
                            requestAction({
                              title: copy.publishTitle,
                              description: copy.publishDescription(article.title),
                              confirmText: copy.publish,
                              onConfirm: () => handleStatusChange(article.id, 'PUBLISHED'),
                            })
                          }
                          disabled={mutationLoading}
                        >
                          {copy.publish}
                        </DropdownMenuItem>
                    )}
                    {article.status === 'REVIEW' && hasPermission(Permission.REJECT_ARTICLES) && (
                        <DropdownMenuItem
                          onClick={() =>
                            requestAction({
                              title: copy.sendBackTitle,
                              description: copy.sendBackDescription(article.title),
                              confirmText: copy.sendBack,
                              onConfirm: () => handleStatusChange(article.id, 'DRAFT'),
                            })
                          }
                          disabled={mutationLoading}
                        >
                          {copy.sendBackToDraft}
                        </DropdownMenuItem>
                    )}
                    {article.status === 'PUBLISHED' && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                      <DropdownMenuItem
                        onClick={() =>
                          requestAction({
                            title: copy.archiveTitle,
                            description: copy.archiveDescription(article.title),
                            confirmText: copy.archive,
                            variant: "destructive",
                            onConfirm: () => handleStatusChange(article.id, 'ARCHIVED'),
                          })
                        }
                        disabled={mutationLoading}
                      >
                        {copy.archive}
                      </DropdownMenuItem>
                    )}
                    {article.status === 'PUBLISHED' && (
                      <DropdownMenuItem onClick={() => setShareArticle(article)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {copy.share}
                      </DropdownMenuItem>
                    )}
                    {hasPermission(Permission.DELETE_OWN_ARTICLE) && (
                      <DropdownMenuItem
                        onClick={() =>
                          requestAction({
                            title: copy.deleteTitle,
                            description: copy.deleteDescription(article.title),
                            confirmText: copy.deleteArticle,
                            variant: "destructive",
                            onConfirm: () => handleDelete(article.id),
                          })
                        }
                        disabled={mutationLoading}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {copy.delete}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 px-4 py-4">
                <div className="min-w-0">
                  <Link
                    href={`/articles/${article.id}/edit`}
                    className="block truncate text-base font-semibold hover:underline"
                    title={article.title}
                  >
                    {article.title}
                  </Link>
                  {article.excerpt && (
                    <p className="mt-1 truncate text-xs text-muted-foreground" title={article.excerpt}>
                      {article.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className="max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                    title={article.category?.name || copy.uncategorized}
                  >
                    {article.category?.name || copy.uncategorized}
                  </span>
                  {article.isBreaking && <Badge variant="destructive" className="text-xs">{copy.breaking}</Badge>}
                  {revisionRequestStatusById[article.id] && (
                    <Badge variant="outline" className="text-xs">
                      {copy.revision(revisionRequestStatusById[article.id])}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{copy.updated}</span>
                  <span className="font-semibold text-foreground">
                    {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Desktop Articles Table */}
      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed">
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">{copy.title}</th>
                <th className="text-left p-4 font-medium">{copy.status}</th>
                <th className="text-left p-4 font-medium">{copy.category}</th>
                <th className="text-left p-4 font-medium">{copy.updated}</th>
                <th className="text-right p-4 font-medium">{copy.actions}</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    {user?.id ? copy.emptySignedIn : copy.emptySignedOut}
                  </td>
                </tr>
              ) : (
                paginatedArticles.map((article) => (
                  <tr key={article.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="min-w-0">
                        <Link 
                          href={`/articles/${article.id}/edit`}
                          className="block truncate font-medium hover:underline"
                          title={article.title}
                        >
                          {article.title}
                        </Link>
                        {article.excerpt && (
                          <p className="mt-1 truncate text-sm text-muted-foreground" title={article.excerpt}>
                            {article.excerpt.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-2 flex-wrap">
                        <StatusBadge status={article.status} />
                        {article.isBreaking && (
                          <Badge variant="destructive" className="text-xs">{copy.breaking}</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'PENDING' && (
                          <Badge variant="outline" className="bg-purple-50 border-purple-200">📝 {copy.revisionRequested}</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'APPROVED' && (
                          <Badge variant="outline" className="bg-green-50 border-green-200">✅ {copy.revisionApproved}</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'REJECTED' && (
                          <Badge variant="outline" className="bg-red-50 border-red-200">❌ {copy.revisionRejected}</Badge>
                        )}
                        {revisionRequestStatusById[article.id] === 'CONSUMED' && (
                          <Badge variant="outline" className="bg-slate-50 border-slate-200">✔ {copy.revisionEnd}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="truncate p-4 align-middle" title={article.category?.name || copy.uncategorized}>
                      {article.category?.name || copy.uncategorized}
                    </td>
                    <td className="whitespace-nowrap p-4 text-sm text-muted-foreground align-middle">
                      {format(new Date(article.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-right align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {hasPermission(Permission.UPDATE_OWN_ARTICLE) && (
                            <DropdownMenuItem asChild>
                              <Link href={`/articles/${article.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {copy.edit}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {article.status === 'DRAFT' && hasPermission(Permission.CREATE_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: copy.submitForReviewTitle,
                                  description: copy.submitForReviewDescription(article.title),
                                  confirmText: copy.submit,
                                  onConfirm: () => handleStatusChange(article.id, 'REVIEW'),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              {copy.submitForReview}
                            </DropdownMenuItem>
                          )}
                          {article.status === 'REVIEW' && hasPermission(Permission.APPROVE_ARTICLES) && (
                              <DropdownMenuItem 
                                onClick={() =>
                                  requestAction({
                                    title: copy.publishTitle,
                                    description: copy.publishDescription(article.title),
                                    confirmText: copy.publish,
                                    onConfirm: () => handleStatusChange(article.id, 'PUBLISHED'),
                                  })
                                }
                                disabled={mutationLoading}
                              >
                                {copy.publish}
                              </DropdownMenuItem>
                          )}
                          {article.status === 'REVIEW' && hasPermission(Permission.REJECT_ARTICLES) && (
                              <DropdownMenuItem 
                                onClick={() =>
                                  requestAction({
                                    title: copy.sendBackTitle,
                                    description: copy.sendBackDescription(article.title),
                                    confirmText: copy.sendBack,
                                    onConfirm: () => handleStatusChange(article.id, 'DRAFT'),
                                  })
                                }
                                disabled={mutationLoading}
                              >
                                {copy.sendBackToDraft}
                              </DropdownMenuItem>
                          )}
                          {article.status === 'PUBLISHED' && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: copy.archiveTitle,
                                  description: copy.archiveDescription(article.title),
                                  confirmText: copy.archive,
                                  variant: "destructive",
                                  onConfirm: () => handleStatusChange(article.id, 'ARCHIVED'),
                                })
                              }
                              disabled={mutationLoading}
                            >
                              {copy.archive}
                            </DropdownMenuItem>
                          )}
                          {article.status === 'PUBLISHED' && (
                            <DropdownMenuItem onClick={() => setShareArticle(article)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              {copy.share}
                            </DropdownMenuItem>
                          )}
                          {hasPermission(Permission.DELETE_OWN_ARTICLE) && (
                            <DropdownMenuItem 
                              onClick={() =>
                                requestAction({
                                  title: copy.deleteTitle,
                                  description: copy.deleteDescription(article.title),
                                  confirmText: copy.deleteArticle,
                                  variant: "destructive",
                                  onConfirm: () => handleDelete(article.id),
                                })
                              }
                              disabled={mutationLoading}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {copy.delete}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {articles.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
            <span className="min-w-20 text-center text-xs font-medium">
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
        open={confirmation.open}
        onOpenChange={(open) =>
          setConfirmation((current) => ({ ...current, open }))
        }
        title={confirmation.title}
        description={confirmation.description}
        confirmText={confirmation.confirmText}
        cancelText={copy.cancel}
        variant={confirmation.variant}
        onConfirm={() => {
          void confirmation.onConfirm();
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
    </div>
  );
}
