// @/types/article.ts
import type { JsonObject } from './json';

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type BreakingNewsRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ArticleBreakingNewsRequestStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type RevisionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RevisionStatus = 'NONE' | 'REQUESTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR';
  isActive: boolean;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  coverVideoUrl?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleContentJson {
  time: number;
  blocks: Array<{
    id: string;
    type: string;
    data: JsonObject;
    tunes?: {
      highlight?: {
        highlighted: boolean;
      };
    };
  }>;
  version: string;
}

export interface ArticleRevisionChanges {
  title?: string;
  excerpt?: string;
  topic?: string;
  contentJson?: ArticleContentJson;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  categorySlug?: string;
  tagSlugs?: string[];
  isFeatured?: boolean;
  isEditorsPick?: boolean;
  isBreaking?: boolean;
  pinnedAt?: string;
}

export interface ArticleRevisionRequest {
  id: string;
  articleId: string;
  status: RevisionRequestStatus;
  note?: string;
  proposedChanges: ArticleRevisionChanges;
  createdAt: string;
  requester: User;
  reviewedAt?: string;
  reviewedBy?: User;
  reviewComment?: string;
}

export interface ArticleRevisionHistory {
  id: string;
  articleId: string;
  summary: string;
  changes: ArticleRevisionChanges;
  appliedAt: string;
  appliedBy: User;
  revisionRequest?: ArticleRevisionRequest;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  contentJson: ArticleContentJson;
  excerpt?: string | null;
  status: ArticleStatus;
  topic?: string;
  
  // Media
  coverImageUrl?: string;
  authorName?: string | null;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  
  // Features
  isFeatured: boolean;
  isEditorsPick: boolean;
  isBreaking: boolean;
  pinnedAt?: string;
  viewCount?: number;
  
  // Breaking News Request
  breakingNewsRequestStatus?: ArticleBreakingNewsRequestStatus;
  breakingNewsRequestedAt?: string;
  breakingNewsRequestedBy?: User | null;
  
  // Revision Status
  revisionStatus?: RevisionStatus;
  revisionRequestedAt?: string;
  currentRevisionRequest?: ArticleRevisionRequest;
  revisionHistory?: ArticleRevisionHistory[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  
  // Relations
  category?: ArticleCategory;
  categoryId?: string;
  tags?: Tag[];
  author?: {
    id: string;
  };
}

export interface ArticleInput {
  title: string;
  slug: string;
  excerpt?: string;
  contentJson?: ArticleContentJson;
  status?: ArticleStatus;
  categorySlug?: string;
  topic?: string;
  
  // Media
  coverImageUrl?: string;
  authorName?: string;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  
  // Features
  isFeatured?: boolean;
  isEditorsPick?: boolean;
  isBreaking?: boolean;
  pinnedAt?: string;
  
  // Tags
  tagSlugs?: string[];
}

export interface ArticleFilters {
  status?: ArticleStatus;
  categorySlug?: string;
  topic?: string;
  take?: number;
  skip?: number;
}

export interface ArticleListResponse {
  articles: Article[];
}

export interface ArticleResponse {
  articleById?: Article;
  articleBySlug?: Article;
}

export interface RequestArticleRevisionInput {
  articleId: string;
  note?: string;
  changes: ArticleRevisionChanges;
}

export interface ApproveRevisionInput {
  requestId: string;
  reviewComment?: string;
}

export interface RejectRevisionInput {
  requestId: string;
  reviewComment?: string;
}
