import { ArticleStatus } from '@/types/article';

type AdminLocale = 'en' | 'km';

export interface WorkflowNotification {
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export function getStatusChangeNotification(
  fromStatus: ArticleStatus,
  toStatus: ArticleStatus,
  userRole: string,
  locale: AdminLocale = 'en',
): WorkflowNotification | null {
  const isKm = locale === 'km';

  // Author notifications
  if (userRole === 'AUTHOR') {
    if (fromStatus === 'DRAFT' && toStatus === 'REVIEW') {
      return {
        title: isKm ? '📤 បានផ្ញើអត្ថបទទៅត្រួតពិនិត្យ' : '📤 Article submitted for review',
        message: isKm
          ? 'អត្ថបទរបស់អ្នកត្រូវបានផ្ញើទៅអ្នកកែសម្រួល និងអ្នកគ្រប់គ្រងដើម្បីត្រួតពិនិត្យ'
          : 'Your article has been sent to editors and admins for review',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'PUBLISHED') {
      return {
        title: isKm ? '✅ អត្ថបទរបស់អ្នកត្រូវបានផ្សព្វផ្សាយហើយ!' : '✅ Your article has been published and is now live!',
        message: isKm ? 'អ្នកអានអាចមើលអត្ថបទរបស់អ្នកបានឥឡូវនេះ' : 'Readers can now view your article',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'ARCHIVED') {
      return {
        title: isKm ? '📝 អត្ថបទត្រូវការកែសម្រួល' : '📝 Article needs revision',
        message: isKm ? 'អត្ថបទរបស់អ្នកត្រូវបានផ្ញើត្រឡប់ដើម្បីកែសម្រួល' : 'Your article was sent back for revision',
        type: 'warning'
      };
    }
  }
  
  // Editor/Admin notifications
  if (userRole === 'EDITOR' || userRole === 'ADMIN') {
    if (fromStatus === 'REVIEW' && toStatus === 'PUBLISHED') {
      return {
        title: isKm ? '✅ បានផ្សព្វផ្សាយអត្ថបទដោយជោគជ័យ' : '✅ Article published successfully',
        message: isKm ? 'អត្ថបទកំពុងបង្ហាញជាសាធារណៈ ហើយអ្នកអានអាចមើលបាន' : 'The article is now live and visible to readers',
        type: 'success'
      };
    }
    
    if (fromStatus === 'REVIEW' && toStatus === 'ARCHIVED') {
      return {
        title: isKm ? '📝 បានបដិសេធអត្ថបទ' : '📝 Article rejected',
        message: isKm ? 'អត្ថបទត្រូវបានផ្ញើត្រឡប់ទៅអ្នកនិពន្ធ' : 'The article has been sent back to the author',
        type: 'info'
      };
    }
    
    if (fromStatus === 'PUBLISHED' && toStatus === 'ARCHIVED') {
      return {
        title: isKm ? '📦 បានដាក់អត្ថបទក្នុងប័ណ្ណសារ' : '📦 Article archived',
        message: isKm ? 'អត្ថបទនេះលែងបង្ហាញឱ្យអ្នកអានមើលទៀតហើយ' : 'The article is no longer visible to readers',
        type: 'info'
      };
    }
  }
  
  return null;
}

export function getBreakingNewsNotification(
  isBreaking: boolean,
  userRole: string,
  locale: AdminLocale = 'en',
): WorkflowNotification {
  const isKm = locale === 'km';

  if (isBreaking) {
    return {
      title: isKm ? '🚨 បានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍' : '🚨 Breaking news flag set',
      message: isKm ? 'អត្ថបទនេះត្រូវបានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍' : 'This article is now marked as breaking news',
      type: 'success'
    };
  } else {
    return {
      title: isKm ? '📰 បានដកសម្គាល់ព័ត៌មានទាន់ហេតុការណ៍' : '📰 Breaking news flag removed',
      message: isKm ? 'អត្ថបទនេះលែងត្រូវបានកំណត់ជាព័ត៌មានទាន់ហេតុការណ៍ទៀតហើយ' : 'This article is no longer marked as breaking news',
      type: 'info'
    };
  }
}

export function getSubmissionNotification(locale: AdminLocale = 'en'): WorkflowNotification {
  const isKm = locale === 'km';

  return {
    title: isKm ? '📤 បានផ្ញើអត្ថបទទៅត្រួតពិនិត្យ' : '📤 Article submitted for review',
    message: isKm ? 'បានជូនដំណឹងដល់អ្នកកែសម្រួល និងអ្នកគ្រប់គ្រង' : 'Editors and admins have been notified',
    type: 'success'
  };
}

export function getApprovalNotification(locale: AdminLocale = 'en'): WorkflowNotification {
  const isKm = locale === 'km';

  return {
    title: isKm ? '✅ បានអនុម័ត និងផ្សព្វផ្សាយអត្ថបទ' : '✅ Article approved and published',
    message: isKm ? 'អត្ថបទកំពុងបង្ហាញជាសាធារណៈ ហើយអ្នកអានអាចមើលបាន' : 'The article is now live and visible to readers',
    type: 'success'
  };
}

export function getRejectionNotification(locale: AdminLocale = 'en'): WorkflowNotification {
  const isKm = locale === 'km';

  return {
    title: isKm ? '📝 បានបដិសេធអត្ថបទ' : '📝 Article rejected',
    message: isKm ? 'អត្ថបទត្រូវបានផ្ញើត្រឡប់ទៅអ្នកនិពន្ធដើម្បីកែសម្រួល' : 'The article has been sent back to the author for revision',
    type: 'info'
  };
}
