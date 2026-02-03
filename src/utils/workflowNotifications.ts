import { ArticleStatus } from '@/types/article';

export interface WorkflowNotification {
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export function getStatusChangeNotification(
  fromStatus: ArticleStatus,
  toStatus: ArticleStatus,
  userRole: string
): WorkflowNotification | null {
  // Author notifications
  if (userRole === 'AUTHOR') {
    if (fromStatus === 'DRAFT' && toStatus === 'REVIEW') {
      return {
        title: '📤 Article submitted for review',
        message: 'Your article has been sent to editors and admins for review',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'PUBLISHED') {
      return {
        title: '✅ Your article has been published and is now live!',
        message: 'Readers can now view your article',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'ARCHIVED') {
      return {
        title: '📝 Article needs revision',
        message: 'Your article was sent back for revision',
        type: 'warning'
      };
    }
  }
  
  // Editor/Admin notifications
  if (userRole === 'EDITOR' || userRole === 'ADMIN') {
    if (fromStatus === 'REVIEW' && toStatus === 'PUBLISHED') {
      return {
        title: '✅ Article published successfully',
        message: 'The article is now live and visible to readers',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'ARCHIVED') {
      return {
        title: '📝 Article rejected',
        message: 'The article has been sent back to the author',
        type: 'info'
      };
    }
    
    if (fromStatus === 'PUBLISHED' && toStatus === 'ARCHIVED') {
      return {
        title: '📦 Article archived',
        message: 'The article is no longer visible to readers',
        type: 'info'
      };
    }
  }
  
  return null;
}

export function getBreakingNewsNotification(
  isBreaking: boolean,
  userRole: string
): WorkflowNotification {
  if (isBreaking) {
    return {
      title: '🚨 Breaking news flag set',
      message: 'This article is now marked as breaking news',
      type: 'success'
    };
  } else {
    return {
      title: '📰 Breaking news flag removed',
      message: 'This article is no longer marked as breaking news',
      type: 'info'
    };
  }
}

export function getSubmissionNotification(): WorkflowNotification {
  return {
    title: '📤 Article submitted for review',
    message: 'Editors and admins have been notified',
    type: 'success'
  };
}

export function getApprovalNotification(): WorkflowNotification {
  return {
    title: '✅ Article approved and published',
    message: 'The article is now live and visible to readers',
    type: 'success'
  };
}

export function getRejectionNotification(): WorkflowNotification {
  return {
    title: '📝 Article rejected',
    message: 'The article has been sent back to the author for revision',
    type: 'info'
  };
}
