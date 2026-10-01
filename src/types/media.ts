// @/types/media.ts

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // for video/audio
  alt?: string;
  caption?: string;
  folder?: string;
  tags: string[];
  uploadedAt: string;
  uploadedBy: string;
  lastModified: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  children?: MediaFolder[];
}

export interface MediaUploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface MediaFilters {
  type?: MediaType;
  folder?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'name' | 'date' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MediaLibraryResponse {
  files: MediaFile[];
  folders: MediaFolder[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MediaUploadOptions {
  folder?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fit?: "inside" | "cover";
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<MediaType, number>;
  recentUploads: number;
  storageUsed: string;
  storageLimit: string;
}
