// src/utils/rbac.ts
export type UserRole = 'ADMIN' | 'EDITOR' | 'AUTHOR';

export type Permission = 
  // Article permissions
  | 'CREATE_ARTICLE'
  | 'VIEW_ALL_ARTICLES'
  | 'UPDATE_OWN_ARTICLE'
  | 'UPDATE_ANY_ARTICLE'
  | 'DELETE_OWN_ARTICLE'
  | 'DELETE_ANY_ARTICLE'
  | 'PUBLISH_ARTICLE'
  | 'REVIEW_ARTICLES'
  | 'FEATURE_ARTICLES'
  
  // Category permissions
  | 'MANAGE_CATEGORIES'
  | 'VIEW_CATEGORIES'
  
  // User management permissions
  | 'MANAGE_USERS'
  | 'VIEW_USERS'
  
  // System permissions
  | 'MANAGE_SETTINGS'
  | 'VIEW_ANALYTICS'
  | 'VIEW_SYSTEM_LOGS'
  
  // Media permissions
  | 'MANAGE_MEDIA'
  | 'VIEW_MEDIA';

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'CREATE_ARTICLE',
    'VIEW_ALL_ARTICLES',
    'UPDATE_OWN_ARTICLE',
    'UPDATE_ANY_ARTICLE',
    'DELETE_OWN_ARTICLE',
    'DELETE_ANY_ARTICLE',
    'PUBLISH_ARTICLE',
    'REVIEW_ARTICLES',
    'FEATURE_ARTICLES',
    'MANAGE_CATEGORIES',
    'VIEW_CATEGORIES',
    'MANAGE_USERS',
    'VIEW_USERS',
    'MANAGE_SETTINGS',
    'VIEW_ANALYTICS',
    'VIEW_SYSTEM_LOGS',
    'MANAGE_MEDIA',
    'VIEW_MEDIA'
  ],
  
  EDITOR: [
    // Editorial workflow permissions
    'VIEW_ALL_ARTICLES',
    'UPDATE_ANY_ARTICLE',
    'PUBLISH_ARTICLE',
    'REVIEW_ARTICLES',
    'FEATURE_ARTICLES',
    'VIEW_CATEGORIES',
    'MANAGE_CATEGORIES', // Editors can manage categories if permitted
    'VIEW_ANALYTICS',
    'VIEW_MEDIA',
    'MANAGE_MEDIA' // Editors can manage media for articles
  ],
  
  AUTHOR: [
    // Content creation permissions
    'CREATE_ARTICLE',
    'UPDATE_OWN_ARTICLE',
    'DELETE_OWN_ARTICLE',
    'VIEW_CATEGORIES',
    'VIEW_MEDIA'
  ]
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole];
}

/**
 * Filter features based on user permissions
 */
export function getAccessibleFeatures(userRole: UserRole) {
  const permissions = getRolePermissions(userRole);
  
  return {
    // Dashboard sections
    canViewDashboard: true, // All roles can view their respective dashboards
    canViewArticles: hasAnyPermission(userRole, ['CREATE_ARTICLE', 'VIEW_ALL_ARTICLES', 'REVIEW_ARTICLES']),
    canViewReviewQueue: hasPermission(userRole, 'REVIEW_ARTICLES'),
    canViewCategories: hasPermission(userRole, 'VIEW_CATEGORIES'),
    canViewMedia: hasPermission(userRole, 'VIEW_MEDIA'),
    canViewAnalytics: hasPermission(userRole, 'VIEW_ANALYTICS'),
    canViewUsers: hasPermission(userRole, 'VIEW_USERS'),
    canViewSettings: hasPermission(userRole, 'MANAGE_SETTINGS'),
    
    // Actions
    canCreateArticle: hasPermission(userRole, 'CREATE_ARTICLE'),
    canEditAnyArticle: hasPermission(userRole, 'UPDATE_ANY_ARTICLE'),
    canPublishArticle: hasPermission(userRole, 'PUBLISH_ARTICLE'),
    canReviewArticles: hasPermission(userRole, 'REVIEW_ARTICLES'),
    canFeatureArticles: hasPermission(userRole, 'FEATURE_ARTICLES'),
    canManageCategories: hasPermission(userRole, 'MANAGE_CATEGORIES'),
    canManageMedia: hasPermission(userRole, 'MANAGE_MEDIA'),
    canManageUsers: hasPermission(userRole, 'MANAGE_USERS'),
    canManageSettings: hasPermission(userRole, 'MANAGE_SETTINGS'),
    
    // Quick Actions based on role
    quickActions: getQuickActionsForRole(userRole)
  };
}

/**
 * Get appropriate quick actions for each role
 */
function getQuickActionsForRole(userRole: UserRole) {
  switch (userRole) {
    case 'ADMIN':
      return [
        { id: 'new-article', label: 'New Article', icon: 'FileText', permission: 'CREATE_ARTICLE' },
        { id: 'review-queue', label: 'Review Queue', icon: 'FileText', permission: 'REVIEW_ARTICLES' },
        { id: 'manage-users', label: 'Manage Users', icon: 'Users', permission: 'MANAGE_USERS' },
        { id: 'system-settings', label: 'Settings', icon: 'Settings', permission: 'MANAGE_SETTINGS' }
      ];
    
    case 'EDITOR':
      return [
        { id: 'review-queue', label: 'Review Queue', icon: 'FileText', permission: 'REVIEW_ARTICLES' },
        { id: 'feature-article', label: 'Feature Article', icon: 'Star', permission: 'FEATURE_ARTICLES' },
        { id: 'manage-categories', label: 'Categories', icon: 'Tag', permission: 'MANAGE_CATEGORIES' }
      ];
    
    case 'AUTHOR':
      return [
        { id: 'new-article', label: 'New Article', icon: 'FileText', permission: 'CREATE_ARTICLE' },
        { id: 'my-drafts', label: 'My Drafts', icon: 'FileText', permission: 'UPDATE_OWN_ARTICLE' },
        { id: 'writing-goals', label: 'Writing Goals', icon: 'Target', permission: 'CREATE_ARTICLE' }
      ];
    
    default:
      return [];
  }
}
