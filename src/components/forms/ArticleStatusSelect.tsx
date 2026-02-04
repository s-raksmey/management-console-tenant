// src/components/forms/ArticleStatusSelect.tsx
'use client';

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import {
  ArticleStatus,
  StatusOption,
  getAllowedNewArticleStatuses,
  getAllowedStatusTransitions,
  getStatusActionLabel,
  getWorkflowGuidance,
} from '../../utils/articlePermissions';

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
  const { hasPermission, userRole, userId } = usePermissions();

  // Determine if user owns the article
  const isOwner = articleAuthorId ? articleAuthorId === userId : true; // Assume ownership for new articles

  // Debug logging
  console.log('ArticleStatusSelect Debug:', {
    currentStatus,
    userRole,
    userId,
    articleAuthorId,
    isOwner,
    hasCreatePermission: hasPermission(Permission.CREATE_ARTICLE),
    hasUpdateOwnPermission: hasPermission(Permission.UPDATE_OWN_ARTICLE),
  });

  // Get allowed status options
  const allowedStatuses: StatusOption[] = currentStatus
    ? getAllowedStatusTransitions(currentStatus, userRole, hasPermission, isOwner)
    : getAllowedNewArticleStatuses(userRole, hasPermission);

  // Debug the allowed statuses
  console.log('Allowed statuses:', allowedStatuses.map(s => s.value));

  // Filter out current status if it's not in allowed transitions (shouldn't happen, but safety check)
  const statusOptions = allowedStatuses.filter(option => option !== undefined);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as ArticleStatus;
    onChange(newStatus);
  };

  const getOptionLabel = (option: StatusOption): string => {
    if (currentStatus) {
      return getStatusActionLabel(currentStatus, option.value, userRole);
    }
    return option.label;
  };

  const getOptionDescription = (option: StatusOption): string => {
    if (currentStatus && currentStatus === option.value) {
      return 'Keep current status';
    }
    return option.description;
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <label className="text-xs font-semibold text-slate-600">
          Status
          {currentStatus && (
            <span className="ml-1 text-xs font-normal text-slate-500">
              (Current: {currentStatus})
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
          {statusOptions.find(opt => opt.value === value)?.description}
        </div>
      )}

      {/* Workflow guidance */}
      {showGuidance && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            <strong>Workflow Guide:</strong> {getWorkflowGuidance(userRole)}
          </p>
        </div>
      )}

      {/* No permissions warning */}
      {statusOptions.length === 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-600">
            <strong>No Status Options Available:</strong> You don't have permission to change the status of this article.
          </p>
        </div>
      )}

      {/* Limited options info */}
      {statusOptions.length === 1 && statusOptions[0].value === value && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700">
            <strong>Limited Options:</strong> Based on your role ({userRole}), you can only keep the current status.
            {userRole === 'AUTHOR' && currentStatus === 'PUBLISHED' && 
              ' Published articles can only be modified by editors or admins.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ArticleStatusSelect;
