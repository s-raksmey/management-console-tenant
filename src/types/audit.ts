// src/types/audit.ts

export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  userEmail?: string;
  targetUserId?: string;
  resourceId?: string;
  resourceType?: string;
  resourceName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export enum AuditEventType {
  // Authentication Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTRATION = 'USER_REGISTRATION',
  
  // User Management Events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  TWO_FACTOR_RESET = 'TWO_FACTOR_RESET',
  
  // Article Events
  ARTICLE_CREATED = 'ARTICLE_CREATED',
  ARTICLE_UPDATED = 'ARTICLE_UPDATED',
  ARTICLE_DELETED = 'ARTICLE_DELETED',
  ARTICLE_STATUS_CHANGED = 'ARTICLE_STATUS_CHANGED',
  ARTICLE_PUBLISHED = 'ARTICLE_PUBLISHED',
  ARTICLE_UNPUBLISHED = 'ARTICLE_UNPUBLISHED',
  
  // Article Feature Events
  ARTICLE_FEATURED = 'ARTICLE_FEATURED',
  ARTICLE_UNFEATURED = 'ARTICLE_UNFEATURED',
  ARTICLE_BREAKING_SET = 'ARTICLE_BREAKING_SET',
  ARTICLE_BREAKING_UNSET = 'ARTICLE_BREAKING_UNSET',
  ARTICLE_EDITORS_PICK_SET = 'ARTICLE_EDITORS_PICK_SET',
  ARTICLE_EDITORS_PICK_UNSET = 'ARTICLE_EDITORS_PICK_UNSET',
  
  // Content Review Events
  ARTICLE_SUBMITTED_FOR_REVIEW = 'ARTICLE_SUBMITTED_FOR_REVIEW',
  ARTICLE_APPROVED = 'ARTICLE_APPROVED',
  ARTICLE_REJECTED = 'ARTICLE_REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  REVISION_APPROVED = 'REVISION_APPROVED',
  REVISION_REJECTED = 'REVISION_REJECTED',
  BREAKING_NEWS_REQUESTED = 'BREAKING_NEWS_REQUESTED',
  BREAKING_NEWS_APPROVED = 'BREAKING_NEWS_APPROVED',
  BREAKING_NEWS_REJECTED = 'BREAKING_NEWS_REJECTED',
  
  // Category Events
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',
  
  // Settings Events
  SETTING_UPDATED = 'SETTING_UPDATED',
  SETTINGS_BULK_UPDATED = 'SETTINGS_BULK_UPDATED',
  
  // Security Events
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  PAGE_VIEW = 'PAGE_VIEW',
  UI_INTERACTION = 'UI_INTERACTION',
}

export enum ResourceType {
  USER = 'User',
  ARTICLE = 'Article',
  CATEGORY = 'Category',
  SETTING = 'Setting',
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogListResult {
  logs: AuditLog[];
  totalCount: number;
  hasMore: boolean;
}
