// src/components/forms/ArticleStatusSelect.tsx
'use client';

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../permissions/PermissionGuard';
import {
  ArticleStatus,
  StatusOption,
  getAllowedNewArticleStatuses,
  getAllowedStatusTransitions,
  getStatusActionLabel,
  getWorkflowGuidance,
} from '../../utils/articlePermissions';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface ArticleStatusSelectProps {
  value: ArticleStatus;
  onChange: (status: ArticleStatus) => void;
  currentStatus?: ArticleStatus; // For existing articles
  articleAuthorId?: string; // For ownership checks
  disabled?: boolean;
  className?: string;
  showGuidance?: boolean;
}

export const ArticleStatusSelect: React.FC<ArticleStatusSelectProps> = ({
  value,
  onChange,
  currentStatus,
  articleAuthorId,
  disabled = false,
  className = '',
  showGuidance = false,
}) => {
  const { locale } = useAdminLocale();
  const copy = {
    en: {
      status: 'Status',
      current: (status: string) => `(Current: ${status})`,
      keepCurrent: 'Keep current status',
      workflowGuide: 'Workflow Guide:',
      noOptionsTitle: 'No Status Options Available:',
      noOptionsDescription: "You don't have permission to change the status of this article.",
      limitedTitle: 'Limited Options:',
      limitedDescription: (role: string) => `Based on your role (${role}), you can only keep the current status.`,
      publishedLocked: ' Published articles can only be modified by editors or admins.',
      statusLabels: {
        DRAFT: 'Draft',
        REVIEW: 'Review',
        PUBLISHED: 'Published',
        ARCHIVED: 'Archived',
      },
      actionLabels: {
        saveDraft: 'Save as Draft',
        submitReview: 'Submit for Review',
        publishNow: 'Publish Now',
        noChange: 'No Change',
        fallback: (status: ArticleStatus) => `Save as ${status}`,
      },
      transitionDescriptions: {
        DRAFT_REVIEW: 'Submit article for editorial review',
        DRAFT_PUBLISHED: 'Publish article directly (editors/admins only)',
        REVIEW_DRAFT: 'Return article to draft for further editing',
        REVIEW_PUBLISHED: 'Approve and publish article',
        REVIEW_ARCHIVED: 'Reject and archive article',
        PUBLISHED_DRAFT: 'Unpublish article and return to draft',
        PUBLISHED_ARCHIVED: 'Archive published article',
        ARCHIVED_DRAFT: 'Restore archived article to draft',
        ARCHIVED_PUBLISHED: 'Restore and publish archived article',
      },
      workflowGuidance: {
        AUTHOR: 'Create articles as drafts, then submit for editorial review. You cannot publish directly.',
        EDITOR: 'You can create, review, and publish articles. Review submitted articles in the review queue.',
        ADMIN: 'Full access to all article statuses and workflow actions.',
        DEFAULT: 'Contact your administrator for information about article permissions.',
      },
    },
    km: {
      status: 'ស្ថានភាព',
      current: (status: string) => `(បច្ចុប្បន្ន៖ ${status})`,
      keepCurrent: 'រក្សាស្ថានភាពបច្ចុប្បន្ន',
      workflowGuide: 'ការណែនាំលំហូរការងារ៖',
      noOptionsTitle: 'មិនមានជម្រើសស្ថានភាព៖',
      noOptionsDescription: 'អ្នកមិនមានសិទ្ធិកែស្ថានភាពអត្ថបទនេះទេ។',
      limitedTitle: 'ជម្រើសមានកំណត់៖',
      limitedDescription: (role: string) => `ផ្អែកលើតួនាទីរបស់អ្នក (${role}) អ្នកអាចរក្សាស្ថានភាពបច្ចុប្បន្នប៉ុណ្ណោះ។`,
      publishedLocked: ' អត្ថបទដែលបានផ្សព្វផ្សាយអាចកែបានតែដោយអ្នកកែសម្រួល ឬអ្នកគ្រប់គ្រង។',
      statusLabels: {
        DRAFT: 'ព្រាង',
        REVIEW: 'ត្រួតពិនិត្យ',
        PUBLISHED: 'បានផ្សព្វផ្សាយ',
        ARCHIVED: 'បានដាក់ប័ណ្ណសារ',
      },
      actionLabels: {
        saveDraft: 'រក្សាទុកជាព្រាង',
        submitReview: 'ផ្ញើទៅត្រួតពិនិត្យ',
        publishNow: 'ផ្សព្វផ្សាយឥឡូវនេះ',
        noChange: 'មិនផ្លាស់ប្តូរ',
        fallback: (status: ArticleStatus) => `រក្សាទុកជា ${status}`,
      },
      transitionDescriptions: {
        DRAFT_REVIEW: 'ផ្ញើអត្ថបទទៅត្រួតពិនិត្យ',
        DRAFT_PUBLISHED: 'ផ្សព្វផ្សាយអត្ថបទដោយផ្ទាល់ (សម្រាប់អ្នកកែសម្រួល/អ្នកគ្រប់គ្រង)',
        REVIEW_DRAFT: 'ត្រឡប់អត្ថបទទៅព្រាង ដើម្បីកែសម្រួលបន្ថែម',
        REVIEW_PUBLISHED: 'អនុម័ត និងផ្សព្វផ្សាយអត្ថបទ',
        REVIEW_ARCHIVED: 'បដិសេធ និងដាក់អត្ថបទក្នុងប័ណ្ណសារ',
        PUBLISHED_DRAFT: 'ដកអត្ថបទចេញពីការផ្សព្វផ្សាយ ហើយត្រឡប់ទៅព្រាង',
        PUBLISHED_ARCHIVED: 'ដាក់អត្ថបទដែលបានផ្សព្វផ្សាយក្នុងប័ណ្ណសារ',
        ARCHIVED_DRAFT: 'ស្តារអត្ថបទពីប័ណ្ណសារទៅព្រាង',
        ARCHIVED_PUBLISHED: 'ស្តារ និងផ្សព្វផ្សាយអត្ថបទពីប័ណ្ណសារ',
      },
      workflowGuidance: {
        AUTHOR: 'បង្កើតអត្ថបទជាព្រាង បន្ទាប់មកផ្ញើទៅក្រុមកែសម្រួលត្រួតពិនិត្យ។ អ្នកមិនអាចផ្សព្វផ្សាយដោយផ្ទាល់បានទេ។',
        EDITOR: 'អ្នកអាចបង្កើត ត្រួតពិនិត្យ និងផ្សព្វផ្សាយអត្ថបទ។ សូមពិនិត្យអត្ថបទដែលបានដាក់ស្នើក្នុងជួរត្រួតពិនិត្យ។',
        ADMIN: 'មានសិទ្ធិពេញលេញលើស្ថានភាពអត្ថបទ និងសកម្មភាពលំហូរការងារ។',
        DEFAULT: 'សូមទាក់ទងអ្នកគ្រប់គ្រង ដើម្បីសួរព័ត៌មានអំពីសិទ្ធិអត្ថបទ។',
      },
    },
  }[locale];
  const { hasPermission, userRole, userId } = usePermissions();

  // Determine if user owns the article
  const isOwner = articleAuthorId ? articleAuthorId === userId : true; // Assume ownership for new articles

  // Get allowed status options
  const allowedStatuses: StatusOption[] = currentStatus
    ? getAllowedStatusTransitions(currentStatus, userRole, hasPermission, isOwner)
    : getAllowedNewArticleStatuses(userRole, hasPermission);

  // Filter out current status if it's not in allowed transitions (shouldn't happen, but safety check)
  const statusOptions = allowedStatuses.filter(option => option !== undefined);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as ArticleStatus;
    onChange(newStatus);
  };

  const getOptionLabel = (option: StatusOption): string => {
    if (currentStatus) {
      if (locale === 'km') {
        if (currentStatus === option.value) return copy.actionLabels.noChange;
        const transitionKey = `${currentStatus}_${option.value}` as keyof typeof copy.transitionDescriptions;
        return copy.transitionDescriptions[transitionKey] ?? copy.statusLabels[option.value];
      }
      return getStatusActionLabel(currentStatus, option.value, userRole);
    }
    if (locale === 'km') {
      switch (option.value) {
        case 'DRAFT':
          return copy.actionLabels.saveDraft;
        case 'REVIEW':
          return copy.actionLabels.submitReview;
        case 'PUBLISHED':
          return copy.actionLabels.publishNow;
        default:
          return copy.actionLabels.fallback(option.value);
      }
    }
    return option.label;
  };

  const getOptionDescription = (option: StatusOption): string => {
    if (currentStatus && currentStatus === option.value) {
      return copy.keepCurrent;
    }
    if (locale === 'km') {
      if (currentStatus) {
        const transitionKey = `${currentStatus}_${option.value}` as keyof typeof copy.transitionDescriptions;
        return copy.transitionDescriptions[transitionKey] ?? copy.statusLabels[option.value];
      }
      return copy.statusLabels[option.value];
    }
    return option.description;
  };

  const workflowGuidance =
    locale === 'km'
      ? copy.workflowGuidance[userRole.toUpperCase() as keyof typeof copy.workflowGuidance] ?? copy.workflowGuidance.DEFAULT
      : getWorkflowGuidance(userRole);

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-slate-600">
          {copy.status}
          {currentStatus && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              {copy.current(copy.statusLabels[currentStatus])}
            </span>
          )}
        </label>
        
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled || statusOptions.length === 0}
          className={`h-10 rounded-md border border-slate-200 bg-white px-3 text-sm ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${className}`}
          title={statusOptions.find(opt => opt.value === value)?.description || ''}
        >
          {statusOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              title={getOptionDescription(option)}
            >
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>

      {/* Status descriptions */}
      {statusOptions.length > 0 && (
        <div className="text-xs text-slate-500">
          {statusOptions.find(opt => opt.value === value) ? getOptionDescription(statusOptions.find(opt => opt.value === value)!) : ''}
        </div>
      )}

      {/* Workflow guidance */}
      {showGuidance && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            <strong>{copy.workflowGuide}</strong> {workflowGuidance}
          </p>
        </div>
      )}

      {/* No permissions warning */}
      {statusOptions.length === 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-600">
            <strong>{copy.noOptionsTitle}</strong> {copy.noOptionsDescription}
          </p>
        </div>
      )}

      {/* Limited options info */}
      {statusOptions.length === 1 && statusOptions[0].value === value && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">
            <strong>{copy.limitedTitle}</strong> {copy.limitedDescription(userRole)}
            {userRole === 'AUTHOR' && currentStatus === 'PUBLISHED' && 
              copy.publishedLocked
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ArticleStatusSelect;
