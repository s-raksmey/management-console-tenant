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
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { useCategories } from "@/hooks/useCategories";
import { useTopics } from "@/hooks/useTopics";
import { usePermissions } from "@/hooks/usePermissions";
import { useTenant } from "@/contexts/TenantContext";
import { ArticleStatusSelect } from "@/components/forms/ArticleStatusSelect";
import { ArticleStatus, canDeleteArticle, canEditArticle, canViewArticleForEdit } from "@/utils/articlePermissions";
import { ArticleBreakingNewsRequestStatus } from "@/types/article";
import { Permission } from "@/components/permissions/PermissionGuard";
import { SeoPreviewCard } from "@/components/articles/seo-preview-card";
import { useToastHelpers } from "@/components/ui/toast";
import {
  ArticleReadinessCard,
  getArticleReadinessIssues,
  hasMeaningfulArticleContent,
} from "@/components/articles/article-readiness-card";
import { format } from "date-fns";
import { useAdminLocale } from "@/hooks/useAdminLocale";

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
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTopic(value: string) {
  return slugify(value);
}

function parseTagSlugs(value: string) {
  return Array.from(new Set(value.split(",").map(slugify).filter(Boolean)));
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

const editArticleCopy = {
  en: {
    invalidCategory: (slug: string) => `Category "${slug}" does not exist in the database. Please select a valid category.`,
    beforeAction: (action: string, issues: string[]) => `Before ${action}: ${issues.join(", ")}.`,
    publishing: "publishing",
    review: "submitting for review",
    submitReviewFailed: "Failed to submit for review.",
    breakingRequested: "Breaking News Requested",
    breakingRequestedDescription: "The request was submitted for review.",
    breakingRequestFailed: "Breaking News Request Failed",
    breakingServerRejected: "The server did not accept the request.",
    breakingUnable: "Unable to submit the request.",
    saveFailed: "Failed to save article.",
    approvePermission: "You do not have permission to approve articles.",
    approveFailed: "Failed to approve article.",
    rejectPermission: "You do not have permission to reject articles.",
    rejectFailed: "Failed to reject article.",
    revisionUnavailable: "Revision Not Available",
    revisionUnavailableDescription: "Revisions can only be requested while the article is in review.",
    revisionNoteRequired: "Revision Note Required",
    revisionNoteRequiredDescription: "Please describe the changes you'd like to make.",
    revisionChangeRequired: "Please make at least one change before submitting a revision request.",
    revisionRequested: "Revision Requested",
    revisionRequestedDescription: "Your changes were submitted for review.",
    revisionApproved: "Revision Approved",
    revisionApprovedDescription: "The revision request was approved.",
    revisionApprovalFailed: "Revision Approval Failed",
    revisionApprovalFailedDescription: "Unable to approve the revision request.",
    revisionRejected: "Revision Rejected",
    revisionRejectedDescription: "The revision request was rejected.",
    revisionRejectionFailed: "Revision Rejection Failed",
    revisionRejectionFailedDescription: "Unable to reject the revision request.",
    loading: "Loading...",
    accessDenied: "Access Denied",
    accessDeniedDescription: "Authors can only view their own articles.",
    backToArticles: "Back to Articles",
    readOnlyMode: "Read-Only Mode",
    readOnlyReview: 'This article is in review. To propose changes, use the "Request Revision" form below.',
    readOnlyPublished: 'This article is published. To propose changes, use the "Request Revision" form below.',
    readOnlyArchived: "This article is archived and cannot be modified.",
    editArticle: "Edit Article",
    unpublish: "Unpublish",
    approvePublish: "Approve & Publish",
    reject: "Reject",
    publish: "Publish",
    save: "Save",
    delete: "Delete",
    title: "Title",
    slug: "Slug",
    author: "Author",
    authorPlaceholder: "e.g. John Doe",
    excerpt: "Excerpt",
    category: "Category",
    selectCategory: "— Select Category —",
    loadingCategories: "Loading categories...",
    topicOptional: "Topic (optional)",
    noTopic: "— No topic —",
    loadingTopics: "Loading topics...",
    selectCategoryFirst: "Select a category first",
    tags: "Tags",
    tagsHelp: "Separate tags with commas.",
    schedulePublishing: "Schedule publishing",
    scheduleHelp: "Leave blank to keep manual publishing.",
    categoryError: "Category Error",
    topicsError: "Topics Error",
    validationError: "Validation Error",
    markBreaking: "Mark as breaking news",
    markBreakingTitle: "Mark this article as breaking news",
    requestBreaking: "Request as breaking news",
    requestBreakingTitle: "Request this article to be marked as breaking news",
    reviewHint: "(Editors/Admins will review)",
    whyBreaking: "Why is this breaking news?",
    breakingReasonPlaceholder: "Explain why this article should be marked as breaking news...",
    breakingReasonHelp: "Admins and editors will review your request and decide if this article qualifies as breaking news.",
    breakingPending: "Breaking News Request Pending",
    breakingPendingDescription: "The author has requested this article to be marked as breaking news.",
    requestedBy: "Requested by",
    requestedAt: "Requested at",
    approve: "Approve",
    breakingApproved: "Breaking News Approved",
    breakingApprovedDescription: "The article is now marked as breaking news.",
    breakingApprovalFailed: "Breaking News Approval Failed",
    breakingApprovalFailedDescription: "Unable to approve the request.",
    breakingRejected: "Breaking News Rejected",
    breakingRejectedDescription: "The request was rejected.",
    breakingRejectionFailed: "Breaking News Rejection Failed",
    breakingRejectionFailedDescription: "Unable to reject the request.",
    revisionPending: "Revision Request Pending",
    revisionPendingDescription: "The author has requested permission to revise this article.",
    requestNote: "Request note",
    requestRevision: "Request Revision",
    revisionPendingReview: "Revision request is pending review",
    revisionWasApproved: "Your revision request was approved",
    revisionWasRejected: "Your revision request was rejected",
    revisionConsumed: "Changes saved. Request a new revision to edit again.",
    requestEditPermission: "Request permission to edit this article",
    editorComment: "Editor comment",
    proposeChanges: "Propose Changes",
    describeChanges: "Describe the changes you'd like to make",
    revisionPlaceholder: "e.g., Fix typo in paragraph 2, add recent data from Q4, update author bio...",
    revisionHelp: "The system will automatically track which fields you've modified and submit them as proposed changes.",
    cancel: "Cancel",
    submitting: "Submitting...",
    submitRequest: "Submit Request",
    breakingRequestApproved: "Breaking News Request Approved",
    breakingRequestApprovedDescription: "This article has been approved as breaking news and will be marked accordingly.",
    breakingRequestRejected: "Breaking News Request Rejected",
    breakingRequestRejectedDescription: "The breaking news request for this article was rejected.",
    deleteTitle: "Delete Article?",
    deleteDescription: (title?: string) => `This will permanently delete "${title || "this article"}". This action cannot be undone.`,
    deleteConfirm: "Delete Article",
  },
  km: {
    invalidCategory: (slug: string) => `ប្រភេទ "${slug}" មិនមានក្នុងមូលដ្ឋានទិន្នន័យទេ។ សូមជ្រើសប្រភេទត្រឹមត្រូវ។`,
    beforeAction: (action: string, issues: string[]) => `មុន${action}: ${issues.join(", ")}។`,
    publishing: "ផ្សព្វផ្សាយ",
    review: "ផ្ញើទៅពិនិត្យ",
    submitReviewFailed: "មិនអាចផ្ញើទៅពិនិត្យបានទេ។",
    breakingRequested: "បានស្នើព័ត៌មានទាន់ហេតុការណ៍",
    breakingRequestedDescription: "សំណើត្រូវបានផ្ញើទៅពិនិត្យ។",
    breakingRequestFailed: "ស្នើព័ត៌មានទាន់ហេតុការណ៍មិនបាន",
    breakingServerRejected: "ម៉ាស៊ីនមេមិនទទួលសំណើនេះទេ។",
    breakingUnable: "មិនអាចផ្ញើសំណើបានទេ។",
    saveFailed: "មិនអាចរក្សាទុកអត្ថបទបានទេ។",
    approvePermission: "អ្នកមិនមានសិទ្ធិអនុម័តអត្ថបទទេ។",
    approveFailed: "មិនអាចអនុម័តអត្ថបទបានទេ។",
    rejectPermission: "អ្នកមិនមានសិទ្ធិបដិសេធអត្ថបទទេ។",
    rejectFailed: "មិនអាចបដិសេធអត្ថបទបានទេ។",
    revisionUnavailable: "មិនអាចស្នើកែប្រែបាន",
    revisionUnavailableDescription: "ការកែប្រែអាចស្នើបានតែពេលអត្ថបទនៅក្នុងការពិនិត្យ។",
    revisionNoteRequired: "ត្រូវការកំណត់សម្គាល់កែប្រែ",
    revisionNoteRequiredDescription: "សូមពណ៌នាការកែប្រែដែលអ្នកចង់ធ្វើ។",
    revisionChangeRequired: "សូមកែប្រែយ៉ាងតិចមួយ មុនផ្ញើសំណើកែប្រែ។",
    revisionRequested: "បានស្នើកែប្រែ",
    revisionRequestedDescription: "ការកែប្រែរបស់អ្នកត្រូវបានផ្ញើទៅពិនិត្យ។",
    revisionApproved: "បានអនុម័តការកែប្រែ",
    revisionApprovedDescription: "សំណើកែប្រែត្រូវបានអនុម័ត។",
    revisionApprovalFailed: "អនុម័តការកែប្រែមិនបាន",
    revisionApprovalFailedDescription: "មិនអាចអនុម័តសំណើកែប្រែបានទេ។",
    revisionRejected: "បានបដិសេធការកែប្រែ",
    revisionRejectedDescription: "សំណើកែប្រែត្រូវបានបដិសេធ។",
    revisionRejectionFailed: "បដិសេធការកែប្រែមិនបាន",
    revisionRejectionFailedDescription: "មិនអាចបដិសេធសំណើកែប្រែបានទេ។",
    loading: "កំពុងផ្ទុក...",
    accessDenied: "មិនមានសិទ្ធិចូល",
    accessDeniedDescription: "អ្នកនិពន្ធអាចមើលតែអត្ថបទរបស់ខ្លួនប៉ុណ្ណោះ។",
    backToArticles: "ត្រឡប់ទៅអត្ថបទ",
    readOnlyMode: "របៀបមើលប៉ុណ្ណោះ",
    readOnlyReview: 'អត្ថបទនេះកំពុងពិនិត្យ។ ដើម្បីស្នើកែប្រែ សូមប្រើទម្រង់ "ស្នើកែប្រែ" ខាងក្រោម។',
    readOnlyPublished: 'អត្ថបទនេះបានផ្សព្វផ្សាយ។ ដើម្បីស្នើកែប្រែ សូមប្រើទម្រង់ "ស្នើកែប្រែ" ខាងក្រោម។',
    readOnlyArchived: "អត្ថបទនេះបានដាក់ប័ណ្ណសារ ហើយមិនអាចកែបានទេ។",
    editArticle: "កែអត្ថបទ",
    unpublish: "ដកពីការផ្សព្វផ្សាយ",
    approvePublish: "អនុម័ត និងផ្សព្វផ្សាយ",
    reject: "បដិសេធ",
    publish: "ផ្សព្វផ្សាយ",
    save: "រក្សាទុក",
    delete: "លុប",
    title: "ចំណងជើង",
    slug: "ស្លាក URL",
    author: "អ្នកនិពន្ធ",
    authorPlaceholder: "ឧ. John Doe",
    excerpt: "សេចក្ដីសង្ខេប",
    category: "ប្រភេទ",
    selectCategory: "— ជ្រើសប្រភេទ —",
    loadingCategories: "កំពុងផ្ទុកប្រភេទ...",
    topicOptional: "ប្រធានបទ (ជម្រើស)",
    noTopic: "— គ្មានប្រធានបទ —",
    loadingTopics: "កំពុងផ្ទុកប្រធានបទ...",
    selectCategoryFirst: "ជ្រើសប្រភេទជាមុនសិន",
    tags: "ស្លាក",
    tagsHelp: "បំបែកស្លាកដោយសញ្ញាក្បៀស។",
    schedulePublishing: "កំណត់ពេលផ្សព្វផ្សាយ",
    scheduleHelp: "ទុកទទេដើម្បីផ្សព្វផ្សាយដោយដៃ។",
    categoryError: "បញ្ហាប្រភេទ",
    topicsError: "បញ្ហាប្រធានបទ",
    validationError: "ទិន្នន័យមិនត្រឹមត្រូវ",
    markBreaking: "កំណត់ជាព័ត៌មានទាន់ហេតុការណ៍",
    markBreakingTitle: "កំណត់អត្ថបទនេះជាព័ត៌មានទាន់ហេតុការណ៍",
    requestBreaking: "ស្នើជាព័ត៌មានទាន់ហេតុការណ៍",
    requestBreakingTitle: "ស្នើឱ្យអត្ថបទនេះកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍",
    reviewHint: "(អ្នកកែសម្រួល/អ្នកគ្រប់គ្រងនឹងពិនិត្យ)",
    whyBreaking: "ហេតុអ្វីវាជាព័ត៌មានទាន់ហេតុការណ៍?",
    breakingReasonPlaceholder: "ពន្យល់ថាហេតុអ្វីអត្ថបទនេះគួរត្រូវបានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍...",
    breakingReasonHelp: "អ្នកគ្រប់គ្រង និងអ្នកកែសម្រួលនឹងពិនិត្យសំណើរបស់អ្នក ហើយសម្រេចថាអត្ថបទនេះស័ក្តិសមជាព័ត៌មានទាន់ហេតុការណ៍ឬទេ។",
    breakingPending: "សំណើព័ត៌មានទាន់ហេតុការណ៍កំពុងរង់ចាំ",
    breakingPendingDescription: "អ្នកនិពន្ធបានស្នើឱ្យអត្ថបទនេះកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍។",
    requestedBy: "ស្នើដោយ",
    requestedAt: "ស្នើនៅ",
    approve: "អនុម័ត",
    breakingApproved: "បានអនុម័តព័ត៌មានទាន់ហេតុការណ៍",
    breakingApprovedDescription: "អត្ថបទនេះត្រូវបានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍ហើយ។",
    breakingApprovalFailed: "អនុម័តព័ត៌មានទាន់ហេតុការណ៍មិនបាន",
    breakingApprovalFailedDescription: "មិនអាចអនុម័តសំណើបានទេ។",
    breakingRejected: "បានបដិសេធព័ត៌មានទាន់ហេតុការណ៍",
    breakingRejectedDescription: "សំណើត្រូវបានបដិសេធ។",
    breakingRejectionFailed: "បដិសេធព័ត៌មានទាន់ហេតុការណ៍មិនបាន",
    breakingRejectionFailedDescription: "មិនអាចបដិសេធសំណើបានទេ។",
    revisionPending: "សំណើកែប្រែកំពុងរង់ចាំ",
    revisionPendingDescription: "អ្នកនិពន្ធបានស្នើសិទ្ធិកែអត្ថបទនេះ។",
    requestNote: "កំណត់សម្គាល់សំណើ",
    requestRevision: "ស្នើកែប្រែ",
    revisionPendingReview: "សំណើកែប្រែកំពុងរង់ចាំពិនិត្យ",
    revisionWasApproved: "សំណើកែប្រែរបស់អ្នកត្រូវបានអនុម័ត",
    revisionWasRejected: "សំណើកែប្រែរបស់អ្នកត្រូវបានបដិសេធ",
    revisionConsumed: "បានរក្សាទុកការកែប្រែ។ ស្នើកែប្រែថ្មីដើម្បីកែម្តងទៀត។",
    requestEditPermission: "ស្នើសិទ្ធិកែអត្ថបទនេះ",
    editorComment: "មតិអ្នកកែសម្រួល",
    proposeChanges: "ស្នើការកែប្រែ",
    describeChanges: "ពណ៌នាការកែប្រែដែលអ្នកចង់ធ្វើ",
    revisionPlaceholder: "ឧ. កែកំហុសក្នុងកថាខណ្ឌទី 2, បន្ថែមទិន្នន័យ Q4, កែប្រវត្តិអ្នកនិពន្ធ...",
    revisionHelp: "ប្រព័ន្ធនឹងតាមដានវាលដែលអ្នកបានកែ ហើយផ្ញើជាការកែប្រែដែលបានស្នើ។",
    cancel: "បោះបង់",
    submitting: "កំពុងផ្ញើ...",
    submitRequest: "ផ្ញើសំណើ",
    breakingRequestApproved: "សំណើព័ត៌មានទាន់ហេតុការណ៍ត្រូវបានអនុម័ត",
    breakingRequestApprovedDescription: "អត្ថបទនេះត្រូវបានអនុម័តជាព័ត៌មានទាន់ហេតុការណ៍ ហើយនឹងត្រូវបានកំណត់តាមនោះ។",
    breakingRequestRejected: "សំណើព័ត៌មានទាន់ហេតុការណ៍ត្រូវបានបដិសេធ",
    breakingRequestRejectedDescription: "សំណើព័ត៌មានទាន់ហេតុការណ៍សម្រាប់អត្ថបទនេះត្រូវបានបដិសេធ។",
    deleteTitle: "លុបអត្ថបទ?",
    deleteDescription: (title?: string) => `វានឹងលុប "${title || "អត្ថបទនេះ"}" ជាអចិន្ត្រៃយ៍។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    deleteConfirm: "លុបអត្ថបទ",
  },
};

/* =========================
   Page
========================= */
export default function EditArticlePage() {
  const { locale } = useAdminLocale();
  const copy = editArticleCopy[locale];
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const client = useMemo(() => getAuthenticatedGqlClient(), []);
  const editorRef = useRef<NewsEditorRef>(null);
  const { showSuccess, showError, showWarning } = useToastHelpers();
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
  const { activeTenant } = useTenant();
  const publicBaseUrl = useMemo(() => {
    const primarySite =
      activeTenant?.sites.find((site) => site.isPrimary) ||
      activeTenant?.sites[0];

    return primarySite?.publicBaseUrl ?? null;
  }, [activeTenant]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  /* ✅ ADDED */
  const [authorName, setAuthorName] = useState("");

  const [categorySlug, setCategorySlug] = useState<string>(
    ""
  );
  const [topic, setTopic] = useState<string>("");
  const [tags, setTags] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

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
  const [hasBodyContent, setHasBodyContent] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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
      setCoverImageUrl(article.coverImageUrl ?? null);
      setAuthorName(article.authorName ?? ""); // ✅ ADDED
      setCategorySlug(article.category?.slug ?? "");
      setTopic(article.topic ? normalizeTopic(article.topic) : "");
      setTags(article.tags?.map((tag: { slug: string }) => tag.slug).join(", ") ?? "");
      setScheduledAt(toDateTimeLocal(article.scheduledAt));
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
      setHasBodyContent(hasMeaningfulArticleContent(article.contentJson));
      
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
      setValidationError(copy.invalidCategory(categorySlug));
      return;
    }

    setSaving(true);
    try {
      const shouldSubmitForReview = nextStatus === 'REVIEW' && originalStatus !== 'REVIEW';
      const statusForSave = shouldSubmitForReview ? 'DRAFT' : nextStatus;
      const contentJson = (await editorRef.current?.save()) ?? { blocks: [] };
      const shouldRequireReadiness =
        shouldSubmitForReview || nextStatus === "PUBLISHED";

      if (shouldRequireReadiness) {
        const readinessIssues = getArticleReadinessIssues({
          title,
          slug: slug || slugify(title),
          excerpt,
          categorySlug,
          hasBodyContent: hasMeaningfulArticleContent(contentJson),
        }, locale);

        if (readinessIssues.length > 0) {
          setValidationError(copy.beforeAction(nextStatus === "PUBLISHED" ? copy.publishing : copy.review, readinessIssues));
          return;
        }
      }

      const response = await client.request(M_UPSERT_ARTICLE, {
        id,
        input: {
          title,
          slug,
          excerpt,
          authorName, // ✅ ADDED
          categorySlug,
          topic: topic ? normalizeTopic(topic) : null,
          tagSlugs: parseTagSlugs(tags),
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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
          const message = locale === "en" ? result?.performWorkflowAction?.message || copy.submitReviewFailed : copy.submitReviewFailed;
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

        if (
          !hasPermission(Permission.UPDATE_ANY_ARTICLE) &&
          (currentRevisionRequest?.status === 'APPROVED' || currentRevisionRequest?.status === 'REJECTED')
        ) {
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
      const message = locale === "en" && error instanceof Error ? error.message : copy.saveFailed;
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
      setValidationError(copy.approvePermission);
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
        const message = locale === "en" ? result?.performWorkflowAction?.message || copy.approveFailed : copy.approveFailed;
        throw new Error(message);
      }

      setStatus("PUBLISHED");
      setOriginalStatus("PUBLISHED");
      setValidationError(null);
    } catch (error) {
      const message = locale === "en" && error instanceof Error ? error.message : copy.approveFailed;
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  async function rejectFromReview() {
    if (!hasPermission(Permission.REJECT_ARTICLES)) {
      setValidationError(copy.rejectPermission);
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
        const message = locale === "en" ? result?.performWorkflowAction?.message || copy.rejectFailed : copy.rejectFailed;
        throw new Error(message);
      }

      setStatus("ARCHIVED");
      setOriginalStatus("ARCHIVED");
      setValidationError(null);
    } catch (error) {
      const message = locale === "en" && error instanceof Error ? error.message : copy.rejectFailed;
      setValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
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
      showWarning(copy.revisionUnavailable, copy.revisionUnavailableDescription);
      return;
    }
    if (!revisionNote.trim()) {
      showWarning(copy.revisionNoteRequired, copy.revisionNoteRequiredDescription);
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
        setValidationError(copy.revisionChangeRequired);
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
      showSuccess(copy.revisionRequested, copy.revisionRequestedDescription);
      
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
      showSuccess(copy.revisionApproved, copy.revisionApprovedDescription);
    } catch (err) {
      console.error('Error approving revision request:', err);
      showError(copy.revisionApprovalFailed, copy.revisionApprovalFailedDescription);
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
      showSuccess(copy.revisionRejected, copy.revisionRejectedDescription);
    } catch (err) {
      console.error('Error rejecting revision request:', err);
      showError(copy.revisionRejectionFailed, copy.revisionRejectionFailedDescription);
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
    return <div className="text-sm text-slate-600">{copy.loading}</div>;
  }

  // Check if user can view this article
  const canView = canViewArticleForEdit(articleAuthorId, userId, userRole, hasPermission);
  
  if (!canView) {
    return (
      <main className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">{copy.accessDenied}</h2>
          <p className="text-sm text-red-600 mb-4">
            {copy.accessDeniedDescription}
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/articles')}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            {copy.backToArticles}
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
              <h3 className="font-semibold text-amber-900">{copy.readOnlyMode}</h3>
              <p className="text-sm text-amber-800 mt-1">
                {status === 'REVIEW' && copy.readOnlyReview}
                {status === 'PUBLISHED' && copy.readOnlyPublished}
                {status === 'ARCHIVED' && copy.readOnlyArchived}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{copy.editArticle}</h2>
          <p className="text-sm text-slate-600">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          {status === "PUBLISHED" && hasPermission(Permission.UNPUBLISH_ARTICLE) && (
            <Button variant="outline" onClick={togglePublish} disabled={saving}>
              {copy.unpublish}
            </Button>
          )}
          {status === "REVIEW" && (
            <>
              {hasPermission(Permission.APPROVE_ARTICLES) && (
                <Button variant="outline" onClick={approveFromReview} disabled={saving}>
                  {copy.approvePublish}
                </Button>
              )}
              {hasPermission(Permission.REJECT_ARTICLES) && (
                <Button variant="outline" onClick={rejectFromReview} disabled={saving}>
                  {copy.reject}
                </Button>
              )}
            </>
          )}
          {status !== "PUBLISHED" && status !== "REVIEW" && hasPermission(Permission.PUBLISH_ARTICLE) && (
            <Button variant="outline" onClick={publish} disabled={saving}>
              {copy.publish}
            </Button>
          )}
          <Button onClick={save} disabled={saving || !title || isReadOnly}>
            {copy.save}
          </Button>
          {canDelete && (
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(true)} disabled={saving}>
              {copy.delete}
            </Button>
          )}
        </div>
      </div>

      {/* ---------- Meta ---------- */}
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.title}</label>
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
          <label className="text-xs font-semibold text-slate-600">{copy.slug}</label>
          <Input value={slug} disabled={isReadOnly} onChange={(e) => setSlug(e.target.value)} />
        </div>

        {/* ✅ AUTHOR FIELD — ADDED, NOTHING REMOVED */}
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.author}</label>
          <Input
            value={authorName}
            disabled={isReadOnly}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={copy.authorPlaceholder}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">
            {copy.excerpt}
          </label>
          <Input value={excerpt} disabled={isReadOnly} onChange={(e) => setExcerpt(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-slate-600">
              {copy.category}
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
              <option value="">{copy.selectCategory}</option>
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
              {copy.topicOptional}
            </label>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={topic}
              disabled={isReadOnly || topicsLoading || !categorySlug}
              onChange={(e) => setTopic(e.target.value)}
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
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold text-slate-600">{copy.tags}</label>
          <Input
            value={tags}
            disabled={isReadOnly}
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
              disabled={isReadOnly || saving}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
            <p className="text-xs text-slate-500">{copy.scheduleHelp}</p>
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
              title={copy.markBreakingTitle}
            >
              {copy.markBreaking}
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
              title={copy.requestBreakingTitle}
            >
              {copy.requestBreaking}
              <span className="ml-1 text-xs text-slate-500">{copy.reviewHint}</span>
            </label>
          </div>
        )}

        {/* Breaking News Reason */}
        {!hasPermission(Permission.SET_BREAKING_NEWS) && !isBreaking && shouldRequestBreakingNews && canEditArticle(articleAuthorId, userId, userRole, hasPermission, status, revisionStatus, currentRevisionRequest?.status) && (
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

        {/* Breaking News Request Status (for Editors/Admins) */}
        {breakingNewsRequestStatus === 'PENDING' && hasPermission(Permission.SET_BREAKING_NEWS) && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🔔</span>
                  <h3 className="text-sm font-semibold text-orange-900">{copy.breakingPending}</h3>
                </div>
                <p className="text-xs text-orange-700 mb-2">
                  {copy.breakingPendingDescription}
                </p>
                {breakingNewsRequestedBy && (
                  <p className="text-xs text-orange-600">
                    <strong>{copy.requestedBy}:</strong> {breakingNewsRequestedBy}
                  </p>
                )}
                {breakingNewsRequestedAt && (
                  <p className="text-xs text-orange-600">
                    <strong>{copy.requestedAt}:</strong> {format(new Date(breakingNewsRequestedAt), 'MMM d, yyyy h:mm a')}
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
                        showSuccess(copy.breakingApproved, copy.breakingApprovedDescription);
                      }
                    } catch (err) {
                      console.error('Error approving breaking news:', err);
                      showError(copy.breakingApprovalFailed, copy.breakingApprovalFailedDescription);
                    }
                  }}
                  disabled={saving}
                >
                  ✓ {copy.approve}
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
                        showSuccess(copy.breakingRejected, copy.breakingRejectedDescription);
                      }
                    } catch (err) {
                      console.error('Error rejecting breaking news:', err);
                      showError(copy.breakingRejectionFailed, copy.breakingRejectionFailedDescription);
                    }
                  }}
                  disabled={saving}
                >
                  ✗ {copy.reject}
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
                  <h3 className="text-sm font-semibold text-purple-900">{copy.revisionPending}</h3>
                </div>
                <p className="text-xs text-purple-700 mb-2">
                  {copy.revisionPendingDescription}
                </p>
                {currentRevisionRequest?.note && (
                  <p className="text-xs text-purple-700">
                    <strong>{copy.requestNote}:</strong> {currentRevisionRequest.note}
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
                  ✓ {copy.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={rejectRevision}
                  disabled={saving}
                >
                  ✗ {copy.reject}
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
                <h3 className="text-sm font-semibold text-blue-900 mb-1">{copy.requestRevision}</h3>
                <p className="text-xs text-blue-700 mb-3">
                  {currentRevisionRequest?.status === 'PENDING'
                    ? `⏳ ${copy.revisionPendingReview}`
                    : currentRevisionRequest?.status === 'APPROVED'
                    ? `✓ ${copy.revisionWasApproved}`
                    : currentRevisionRequest?.status === 'REJECTED'
                    ? `✗ ${copy.revisionWasRejected}`
                    : currentRevisionRequest?.status === 'CONSUMED'
                    ? copy.revisionConsumed
                    : copy.requestEditPermission}
                </p>
                {currentRevisionRequest?.reviewComment && (
                  <p className="text-xs text-blue-600 mt-2 italic">
                    {copy.editorComment}: {currentRevisionRequest.reviewComment}
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
                  {copy.proposeChanges}
                </Button>
              )}
            </div>

            {showRevisionForm && (
              <div className="mt-4 space-y-3 border-t border-blue-200 pt-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-blue-900">
                    {copy.describeChanges}
                  </label>
                  <textarea
                    className="min-h-20 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={copy.revisionPlaceholder}
                    value={revisionNote}
                    onChange={(e) => setRevisionNote(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    {copy.revisionHelp}
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
                    {copy.cancel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitRevisionRequest}
                    disabled={saving || !revisionNote.trim()}
                  >
                    {saving ? copy.submitting : copy.submitRequest}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}


        {breakingNewsRequestStatus === 'APPROVED' && (
          <div className="rounded-md border border-green-300 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">✓ {copy.breakingRequestApproved}</p>
            <p className="text-xs text-green-700 mt-1">
              {copy.breakingRequestApprovedDescription}
            </p>
          </div>
        )}

        {breakingNewsRequestStatus === 'REJECTED' && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">✗ {copy.breakingRequestRejected}</p>
            <p className="text-xs text-red-700 mt-1">
              {copy.breakingRequestRejectedDescription}
            </p>
          </div>
        )}
      </div>

      {/* ---------- Editor ---------- */}
      <NewsEditor
        ref={editorRef}
        initialData={initialContent}
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
          siteName={activeTenant?.name}
          publicBaseUrl={publicBaseUrl}
          coverImageUrl={coverImageUrl}
        />
      </div>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={copy.deleteTitle}
        description={copy.deleteDescription(title)}
        confirmText={copy.deleteConfirm}
        variant="destructive"
        onConfirm={() => void remove()}
      />
    </main>
  );
}
