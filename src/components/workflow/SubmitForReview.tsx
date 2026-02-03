'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/components/permissions/PermissionGuard';
import { ArticleStatus } from '@/types/article';
import { useToastHelpers } from '@/components/ui/toast';
import { getSubmissionNotification } from '@/utils/workflowNotifications';

interface SubmitForReviewProps {
  articleId: string;
  currentStatus: ArticleStatus;
  onStatusChange: (newStatus: ArticleStatus) => Promise<void>;
  disabled?: boolean;
}

export function SubmitForReview({ 
  articleId, 
  currentStatus, 
  onStatusChange, 
  disabled = false 
}: SubmitForReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasPermission, userRole } = usePermissions();
  const { showSuccess, showError } = useToastHelpers();

  // Only show for draft articles
  if (currentStatus !== 'DRAFT') {
    return null;
  }

  // Check if user has permission to submit for review
  if (!hasPermission(Permission.CREATE_ARTICLE)) {
    return null;
  }

  const handleSubmitForReview = async () => {
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      await onStatusChange('REVIEW');
      
      const notification = getSubmissionNotification();
      showSuccess(notification.title, notification.message);
    } catch (error) {
      console.error('Failed to submit article for review:', error);
      showError(
        'Failed to submit for review',
        'Please try again or contact support if the problem persists'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button
        onClick={handleSubmitForReview}
        disabled={isSubmitting || disabled}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit for Review
          </>
        )}
      </Button>
      
      <p className="text-sm text-gray-600">
        Your article will be sent to editors and admins for review and approval.
      </p>
    </div>
  );
}
