// src/utils/articlePermissions.ts
import { Permission } from '../components/permissions/PermissionGuard';

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface StatusOption {
  value: ArticleStatus;
  label: string;
  description: string;
  requiresPermission?: Permission;
}

export interface StatusTransition {
  from: ArticleStatus;
  to: ArticleStatus;
  requiredPermission: Permission;
  description: string;
}

/**
 * All possible article status options with their metadata
 */
export const ALL_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'DRAFT',
    label: 'Draft',
    description: 'Article is being written and not ready for review',
  },
  {
    value: 'REVIEW',
    label: 'Review',
    description: 'Article is submitted for editorial review',
    requiresPermission: Permission.CREATE_ARTICLE, // Authors can submit for review
  },
  {
    value: 'PUBLISHED',
    label: 'Published',
    description: 'Article is live and visible to readers',
    requiresPermission: Permission.PUBLISH_ARTICLE,
  },
  {
    value: 'ARCHIVED',
    label: 'Archived',
    description: 'Article is no longer active but preserved',
    requiresPermission: Permission.UNPUBLISH_ARTICLE,
  },
];

/**
 * Valid status transitions based on permissions
 */
export const STATUS_TRANSITIONS: StatusTransition[] = [
  // From DRAFT
  {
    from: 'DRAFT',
    to: 'REVIEW',
    requiredPermission: Permission.CREATE_ARTICLE,
    description: 'Submit article for editorial review',
  },
  {
    from: 'DRAFT',
    to: 'PUBLISHED',
    requiredPermission: Permission.PUBLISH_ARTICLE,
    description: 'Publish article directly (editors/admins only)',
  },
  
  // From REVIEW
  {
    from: 'REVIEW',
    to: 'DRAFT',
    requiredPermission: Permission.UPDATE_OWN_ARTICLE, // Authors can pull back from review
    description: 'Return article to draft for further editing',
  },
  {
    from: 'REVIEW',
    to: 'PUBLISHED',
    requiredPermission: Permission.APPROVE_ARTICLES,
    description: 'Approve and publish article',
  },
  {
    from: 'REVIEW',
    to: 'ARCHIVED',
    requiredPermission: Permission.REJECT_ARTICLES,
    description: 'Reject and archive article',
  },
  
  // From PUBLISHED
  {
    from: 'PUBLISHED',
    to: 'DRAFT',
    requiredPermission: Permission.UNPUBLISH_ARTICLE,
    description: 'Unpublish article and return to draft',
  },
  {
    from: 'PUBLISHED',
    to: 'ARCHIVED',
    requiredPermission: Permission.UNPUBLISH_ARTICLE,
    description: 'Archive published article',
  },
  
  // From ARCHIVED
  {
    from: 'ARCHIVED',
    to: 'DRAFT',
    requiredPermission: Permission.UPDATE_ANY_ARTICLE,
    description: 'Restore archived article to draft',
  },
  {
    from: 'ARCHIVED',
    to: 'PUBLISHED',
    requiredPermission: Permission.PUBLISH_ARTICLE,
    description: 'Restore and publish archived article',
  },
];

/**
 * Get allowed status options for creating a new article
 */
export function getAllowedNewArticleStatuses(
  userRole: string,
  hasPermission: (permission: Permission) => boolean
): StatusOption[] {
  // For new articles, users can typically create as DRAFT or submit for REVIEW
  // Only editors/admins can create directly as PUBLISHED
  
  const allowedStatuses: StatusOption[] = [
    ALL_STATUS_OPTIONS.find(s => s.value === 'DRAFT')!,
  ];
  
  // Authors can submit for review
  if (hasPermission(Permission.CREATE_ARTICLE)) {
    const reviewOption = ALL_STATUS_OPTIONS.find(s => s.value === 'REVIEW');
    if (reviewOption) {
      allowedStatuses.push(reviewOption);
    }
  }
  
  // Editors and admins can publish directly
  if (hasPermission(Permission.PUBLISH_ARTICLE)) {
    const publishedOption = ALL_STATUS_OPTIONS.find(s => s.value === 'PUBLISHED');
    if (publishedOption) {
      allowedStatuses.push(publishedOption);
    }
  }
  
  return allowedStatuses;
}

/**
 * Get allowed status transitions for an existing article
 */
export function getAllowedStatusTransitions(
  currentStatus: ArticleStatus,
  userRole: string,
  hasPermission: (permission: Permission) => boolean,
  isOwner: boolean = false
): StatusOption[] {
  const validTransitions = STATUS_TRANSITIONS.filter(transition => {
    if (transition.from !== currentStatus) return false;
    
    // Any role with article creation/update rights can submit owned drafts for review.
    if (transition.from === 'DRAFT' && 
        transition.to === 'REVIEW' && 
        isOwner && 
        (hasPermission(Permission.CREATE_ARTICLE) || hasPermission(Permission.UPDATE_OWN_ARTICLE))) {
      return true;
    }
    
    // Special case: authors can pull their own articles back from review (REVIEW -> DRAFT)
    if (transition.from === 'REVIEW' && 
        transition.to === 'DRAFT' && 
        isOwner && 
        hasPermission(Permission.UPDATE_OWN_ARTICLE)) {
      return true;
    }
    
    // Check if user has the required permission
    const hasRequiredPermission = hasPermission(transition.requiredPermission);
    if (!hasRequiredPermission) {
      // Additional fallback for DRAFT -> REVIEW for owned articles.
      if (transition.from === 'DRAFT' && 
          transition.to === 'REVIEW' && 
          isOwner && 
          (hasPermission(Permission.CREATE_ARTICLE) || hasPermission(Permission.UPDATE_OWN_ARTICLE))) {
        return true;
      }
      
      return false;
    }
    
    return true;
  });
  
  // Convert transitions to status options
  const allowedStatuses = validTransitions.map(transition => 
    ALL_STATUS_OPTIONS.find(option => option.value === transition.to)!
  );
  
  // Always include current status as an option (no change)
  const currentOption = ALL_STATUS_OPTIONS.find(option => option.value === currentStatus);
  if (currentOption && !allowedStatuses.find(s => s.value === currentStatus)) {
    allowedStatuses.unshift(currentOption);
  }
  
  return allowedStatuses;
}

/**
 * Get user-friendly workflow guidance based on role
 */
export function getWorkflowGuidance(userRole: string): string {
  switch (userRole.toUpperCase()) {
    case 'AUTHOR':
      return 'Create articles as drafts, then submit for editorial review. You cannot publish directly.';
    case 'EDITOR':
      return 'You can create, review, and publish articles. Review submitted articles in the review queue.';
    case 'ADMIN':
      return 'Full access to all article statuses and workflow actions.';
    default:
      return 'Contact your administrator for information about article permissions.';
  }
}

/**
 * Get status-specific action labels for better UX
 */
export function getStatusActionLabel(
  currentStatus: ArticleStatus | null,
  targetStatus: ArticleStatus,
  userRole: string
): string {
  if (!currentStatus) {
    // New article
    switch (targetStatus) {
      case 'DRAFT':
        return 'Save as Draft';
      case 'REVIEW':
        return 'Submit for Review';
      case 'PUBLISHED':
        return 'Publish Now';
      default:
        return `Save as ${targetStatus}`;
    }
  }
  
  // Existing article
  if (currentStatus === targetStatus) {
    return 'No Change';
  }
  
  const transition = STATUS_TRANSITIONS.find(
    t => t.from === currentStatus && t.to === targetStatus
  );
  
  return transition?.description || `Change to ${targetStatus}`;
}

/**
 * Check if user can view article for editing (access the edit page)
 */
export function canViewArticleForEdit(
  articleAuthorId: string,
  currentUserId: string,
  userRole: string,
  hasPermission: (permission: Permission) => boolean
): boolean {
  // User has permission to edit any article
  if (hasPermission(Permission.UPDATE_ANY_ARTICLE)) {
    return true;
  }
  
  if (articleAuthorId === currentUserId && hasPermission(Permission.UPDATE_OWN_ARTICLE)) {
    return true;
  }

  if (hasPermission(Permission.VIEW_ALL_ARTICLES) || hasPermission(Permission.REVIEW_ARTICLES)) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can edit article based on ownership, permissions, and article status
 */
export function canEditArticle(
  articleAuthorId: string,
  currentUserId: string,
  userRole: string,
  hasPermission: (permission: Permission) => boolean,
  articleStatus?: ArticleStatus,
  revisionStatus?: string,
  revisionRequestStatus?: string
): boolean {
  // User has permission to edit any article (admins/editors can always edit)
  if (hasPermission(Permission.UPDATE_ANY_ARTICLE)) {
    return true;
  }
  
  // User owns the article and has permission to edit own articles
  if (articleAuthorId === currentUserId && hasPermission(Permission.UPDATE_OWN_ARTICLE)) {
    // Authors can edit DRAFT articles
    if (!articleStatus || articleStatus === 'DRAFT') {
      return true;
    }
    
    // Authors can edit REVIEW articles only after a revision decision
    if (articleStatus === 'REVIEW') {
      if (revisionRequestStatus === 'CONSUMED') {
        return false;
      }
      if (revisionRequestStatus === 'APPROVED' || revisionRequestStatus === 'REJECTED') {
        return true;
      }
      if (revisionStatus === 'REQUESTED' && revisionRequestStatus !== 'PENDING') {
        return true;
      }
    }
    
    // Authors cannot edit REVIEW, PUBLISHED, or ARCHIVED articles without a revision request
    return false;
  }
  
  return false;
}

/**
 * Check if user can delete article based on ownership and permissions
 */
export function canDeleteArticle(
  articleAuthorId: string,
  currentUserId: string,
  userRole: string,
  hasPermission: (permission: Permission) => boolean
): boolean {
  // User owns the article and has permission to delete own articles
  if (articleAuthorId === currentUserId && hasPermission(Permission.DELETE_OWN_ARTICLE)) {
    return true;
  }
  
  // User has permission to delete any article
  if (hasPermission(Permission.DELETE_ANY_ARTICLE)) {
    return true;
  }
  
  return false;
}
