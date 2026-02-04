// @/types/article.ts

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

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
    data: Record<string, any>;
    tunes?: {
      highlight?: {
        highlighted: boolean;
      };
    };
  }>;
  version: string;
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

