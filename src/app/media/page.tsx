'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FolderPlus, Grid, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInitialPageReady } from '@/lib/use-initial-page-ready';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/media/file-upload';
import { MediaGrid } from '@/components/media/media-grid';
import { MediaFilters } from '@/components/media/media-filters';
import type { MediaFile, MediaFilters as MediaFiltersType } from '@/types/media';
import { Permission, PermissionGuard } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { getAuthFetchHeaders } from '@/services/graphql-client';
import { useToast } from '@/hooks/use-toast';
import { useAdminLocale } from '@/hooks/useAdminLocale';

const MEDIA_ACCESS_PERMISSIONS = [Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA];

const mediaPageCopy = {
  en: {
    loadFailedTitle: 'Media load failed',
    loadFailedDescription: 'Unable to load media files.',
    filesDeletedTitle: 'Files deleted',
    filesDeletedDescription: (count: number) => `${count} file(s) removed.`,
    someDeleteFailedTitle: 'Some files were not deleted',
    someDeleteFailedDescription: (count: number) => `${count} file(s) could not be removed.`,
    deleteFailedTitle: 'Delete failed',
    deleteSelectedFailedDescription: 'Unable to delete the selected files.',
    fileDeletedTitle: 'File deleted',
    fileDeletedDescription: (name: string) => `${name} was removed.`,
    deleteFileFailedDescription: 'Unable to delete the file.',
    metadataUpdateFailed: 'Unable to update file metadata.',
    metadataSavedTitle: 'Metadata saved',
    metadataSavedDescription: (name: string) => `${name} was updated.`,
    metadataUpdateFailedTitle: 'Metadata update failed',
    pageTitle: 'Media Library',
    viewOnlyBanner: 'Your role can view media but cannot upload, edit, or delete files.',
    pageDescription: (count: number, size: string) => `Manage your files and images. ${count} files (${size})`,
    typeCount: (type: string) => `${type}s`,
    library: 'Library',
    upload: 'Upload',
    selectAll: (count: number) => `Select All (${count} files)`,
    selectedCount: (count: number) => `${count} file${count !== 1 ? 's' : ''} selected`,
    download: 'Download',
    delete: 'Delete',
    clear: 'Clear',
    loadingFiles: 'Loading files...',
    bulkDeleteTitle: 'Delete Selected Files?',
    bulkDeleteDescription: (count: number) =>
      `Delete ${count} selected file${count !== 1 ? 's' : ''}? This action cannot be undone.`,
    bulkDeleteConfirm: 'Delete Files',
    cancel: 'Cancel',
    editMetadataTitle: 'Edit media metadata',
    editMetadataDescription: 'Update accessibility text, caption, and comma-separated tags for this file.',
    altText: 'Alt text',
    caption: 'Caption',
    tags: 'Tags',
    tagsPlaceholder: 'newsroom, homepage, politics',
    saving: 'Saving...',
    saveMetadata: 'Save metadata',
  },
  km: {
    loadFailedTitle: 'ផ្ទុកមេឌៀមិនបាន',
    loadFailedDescription: 'មិនអាចផ្ទុកឯកសារមេឌៀបានទេ។',
    filesDeletedTitle: 'បានលុបឯកសារ',
    filesDeletedDescription: (count: number) => `បានលុប ${count} ឯកសារ។`,
    someDeleteFailedTitle: 'ឯកសារខ្លះមិនបានលុប',
    someDeleteFailedDescription: (count: number) => `${count} ឯកសារមិនអាចលុបបានទេ។`,
    deleteFailedTitle: 'លុបមិនបាន',
    deleteSelectedFailedDescription: 'មិនអាចលុបឯកសារដែលបានជ្រើសបានទេ។',
    fileDeletedTitle: 'បានលុបឯកសារ',
    fileDeletedDescription: (name: string) => `បានលុប ${name}។`,
    deleteFileFailedDescription: 'មិនអាចលុបឯកសារបានទេ។',
    metadataUpdateFailed: 'មិនអាចកែទិន្នន័យមេតារបស់ឯកសារបានទេ។',
    metadataSavedTitle: 'បានរក្សាទុកទិន្នន័យមេតា',
    metadataSavedDescription: (name: string) => `បានកែប្រែ ${name}។`,
    metadataUpdateFailedTitle: 'កែទិន្នន័យមេតាមិនបាន',
    pageTitle: 'បណ្ណាល័យមេឌៀ',
    viewOnlyBanner: 'តួនាទីរបស់អ្នកអាចមើលមេឌៀ ប៉ុន្តែមិនអាចផ្ទុកឡើង កែ ឬលុបឯកសារបានទេ។',
    pageDescription: (count: number, size: string) => `គ្រប់គ្រងឯកសារ និងរូបភាព។ ${count} ឯកសារ (${size})`,
    typeCount: (type: string) => `${type}`,
    library: 'បណ្ណាល័យ',
    upload: 'ផ្ទុកឡើង',
    selectAll: (count: number) => `ជ្រើសទាំងអស់ (${count} ឯកសារ)`,
    selectedCount: (count: number) => `បានជ្រើស ${count} ឯកសារ`,
    download: 'ទាញយក',
    delete: 'លុប',
    clear: 'សម្អាត',
    loadingFiles: 'កំពុងផ្ទុកឯកសារ...',
    bulkDeleteTitle: 'លុបឯកសារដែលបានជ្រើស?',
    bulkDeleteDescription: (count: number) =>
      `លុប ${count} ឯកសារដែលបានជ្រើស? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`,
    bulkDeleteConfirm: 'លុបឯកសារ',
    cancel: 'បោះបង់',
    editMetadataTitle: 'កែទិន្នន័យមេតារបស់មេឌៀ',
    editMetadataDescription: 'កែអត្ថបទជំនួស ចំណងជើងភ្ជាប់ និងស្លាកដែលបំបែកដោយសញ្ញាក្បៀសសម្រាប់ឯកសារនេះ។',
    altText: 'អត្ថបទជំនួស',
    caption: 'ចំណងជើងភ្ជាប់',
    tags: 'ស្លាក',
    tagsPlaceholder: 'newsroom, homepage, politics',
    saving: 'កំពុងរក្សាទុក...',
    saveMetadata: 'រក្សាទុកទិន្នន័យមេតា',
  },
} as const;

export default function MediaPage() {
  const { locale } = useAdminLocale();
  const copy = mediaPageCopy[locale];
  const { toast } = useToast();
  const {
    hasPermission,
    hasAnyPermission,
    isLoading: permissionsLoading,
  } = usePermissions();
  const canManageMedia = hasPermission(Permission.MANAGE_MEDIA);
  const canAccessMedia = hasAnyPermission(MEDIA_ACCESS_PERMISSIONS);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pageReady = useInitialPageReady(loading);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filters, setFilters] = useState<MediaFiltersType>({
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editTags, setEditTags] = useState('');
  const [savingMetadata, setSavingMetadata] = useState(false);

  // Load media files
  const loadFiles = React.useCallback(async () => {
    if (permissionsLoading || !canAccessMedia) return;

    try {
      setLoading(true);
      const response = await fetch('/api/media/upload', {
        headers: getAuthFetchHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setFolders(data.folders || []);
      } else {
        toast({
          title: copy.loadFailedTitle,
          description: locale === 'en' ? data.message : copy.loadFailedDescription,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({ title: copy.loadFailedTitle, description: copy.loadFailedDescription, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [canAccessMedia, copy.loadFailedDescription, copy.loadFailedTitle, locale, permissionsLoading, toast]);

  useEffect(() => {
    if (permissionsLoading) return;

    if (!canAccessMedia) {
      setLoading(false);
      return;
    }

    void loadFiles();
  }, [canAccessMedia, loadFiles, permissionsLoading]);

  // Filter and sort files
  const filteredFiles = React.useMemo(() => {
    let result = [...files];

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(file => 
        file.originalName.toLowerCase().includes(search) ||
        file.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (filters.type) {
      result = result.filter(file => file.type === filters.type);
    }

    if (filters.folder) {
      result = result.filter(file => file.folder === filters.folder);
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(file => 
        filters.tags!.some(tag => file.tags?.includes(tag))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.originalName.toLowerCase();
          bValue = b.originalName.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'date':
        default:
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, filters]);

  const handleUploadComplete = (uploadedFiles: MediaFile[]) => {
    setFiles(prev => [...uploadedFiles, ...prev]);
  };

  const handleFileSelect = (file: MediaFile) => {
    setSelectedFiles(prev => {
      if (prev.includes(file.id)) {
        return prev.filter(id => id !== file.id);
      } else {
        return [...prev, file.id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      // Deselect all
      setSelectedFiles([]);
    } else {
      // Select all
      setSelectedFiles(filteredFiles.map(file => file.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!canManageMedia) return;
    if (selectedFiles.length === 0) return;
    
    const filesToDelete = files.filter(file => selectedFiles.includes(file.id));
    
    try {
      // Delete files one by one
      const deletePromises = filesToDelete.map(file =>
        fetch(`/api/media/upload?id=${file.id}&filename=${file.filename}`, {
          method: 'DELETE',
          headers: getAuthFetchHeaders(),
        })
      );
      
      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));
      
      // Filter out successfully deleted files
      const successfullyDeleted = results
        .map((result, index) => ({ result, file: filesToDelete[index] }))
        .filter(({ result }) => result.success)
        .map(({ file }) => file.id);
      
      if (successfullyDeleted.length > 0) {
        setFiles(prev => prev.filter(f => !successfullyDeleted.includes(f.id)));
        setSelectedFiles([]);
        toast({ title: copy.filesDeletedTitle, description: copy.filesDeletedDescription(successfullyDeleted.length), variant: 'success' });
      }
      
      const failedCount = results.filter(result => !result.success).length;
      if (failedCount > 0) {
        console.error(`Failed to delete ${failedCount} files`);
        toast({ title: copy.someDeleteFailedTitle, description: copy.someDeleteFailedDescription(failedCount), variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast({ title: copy.deleteFailedTitle, description: copy.deleteSelectedFailedDescription, variant: 'destructive' });
    }
  };

  const handleFileDelete = async (file: MediaFile) => {
    if (!canManageMedia) return;

    try {
      const response = await fetch(`/api/media/upload?id=${file.id}&filename=${file.filename}`, {
        method: 'DELETE',
        headers: getAuthFetchHeaders(),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        toast({ title: copy.fileDeletedTitle, description: copy.fileDeletedDescription(file.originalName), variant: 'success' });
      } else {
        console.error('Failed to delete file:', data.message);
        toast({ title: copy.deleteFailedTitle, description: locale === 'en' ? data.message : copy.deleteFileFailedDescription, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: copy.deleteFailedTitle, description: copy.deleteFileFailedDescription, variant: 'destructive' });
    }
  };

  const handleFileEdit = (file: MediaFile) => {
    setEditingFile(file);
    setEditAlt(file.alt || '');
    setEditCaption(file.caption || '');
    setEditTags(file.tags.join(', '));
  };

  const handleMetadataSave = async () => {
    if (!editingFile) return;

    try {
      setSavingMetadata(true);
      const response = await fetch('/api/media/upload', {
        method: 'PUT',
        headers: {
          ...getAuthFetchHeaders(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: editingFile.id,
          alt: editAlt,
          caption: editCaption,
          tags: editTags.split(','),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(locale === 'en' ? data.message || copy.metadataUpdateFailed : copy.metadataUpdateFailed);
      }

      setFiles(prev => prev.map(file => file.id === data.file.id ? data.file : file));
      setEditingFile(null);
      toast({ title: copy.metadataSavedTitle, description: copy.metadataSavedDescription(editingFile.originalName), variant: 'success' });
    } catch (error) {
      toast({
        title: copy.metadataUpdateFailedTitle,
        description: locale === 'en' && error instanceof Error ? error.message : copy.metadataUpdateFailed,
        variant: 'destructive',
      });
    } finally {
      setSavingMetadata(false);
    }
  };

  const handleBulkDownload = () => {
    files
      .filter(file => selectedFiles.includes(file.id))
      .forEach((file, index) => {
        window.setTimeout(() => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.originalName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 150);
      });
  };

  const stats = React.useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const byType = files.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: files.length,
      totalSize,
      byType,
    };
  }, [files]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!pageReady) {
    return null;
  }

  return (
    <PermissionGuard permissions={MEDIA_ACCESS_PERMISSIONS} showError>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {copy.pageTitle}
          </h1>
          <p className="text-slate-600">
            {copy.pageDescription(stats.totalFiles, formatFileSize(stats.totalSize))}
          </p>
          {!canManageMedia ? (
            <p className="mt-3 max-w-2xl rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {copy.viewOnlyBanner}
            </p>
          ) : null}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.totalFiles > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-sm text-slate-500 capitalize">{copy.typeCount(type)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="library" className="space-y-6">
        <TabsList>
          <TabsTrigger value="library">{copy.library}</TabsTrigger>
          {canManageMedia && <TabsTrigger value="upload">{copy.upload}</TabsTrigger>}
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          {/* Filters */}
          <MediaFilters
            filters={filters}
            onFiltersChange={setFilters}
            folders={folders}
          />

          {/* Select All */}
          {canManageMedia && filteredFiles.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="select-all" className="text-sm font-medium text-slate-700">
                {copy.selectAll(filteredFiles.length)}
              </label>
            </div>
          )}

          {/* Selection Actions */}
          {canManageMedia && selectedFiles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {copy.selectedCount(selectedFiles.length)}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                    {copy.download}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    {copy.delete}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedFiles([])}
                  >
                    {copy.clear}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Files Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500">{copy.loadingFiles}</p>
            </div>
          ) : (
            <MediaGrid
              files={filteredFiles}
              onFileSelect={handleFileSelect}
              onFileDelete={canManageMedia ? handleFileDelete : undefined}
              onFileEdit={canManageMedia ? handleFileEdit : undefined}
              selectedFiles={selectedFiles}
              selectable={canManageMedia}
            />
          )}
        </TabsContent>

        {canManageMedia && (
          <TabsContent value="upload" className="space-y-6">
            <FileUpload
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
            />
          </TabsContent>
        )}
      </Tabs>
      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title={copy.bulkDeleteTitle}
        description={copy.bulkDeleteDescription(selectedFiles.length)}
        confirmText={copy.bulkDeleteConfirm}
        cancelText={copy.cancel}
        variant="destructive"
        onConfirm={() => {
          void handleBulkDelete();
        }}
      />
      <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.editMetadataTitle}</DialogTitle>
            <DialogDescription>
              {copy.editMetadataDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-alt">{copy.altText}</Label>
              <Input id="media-alt" value={editAlt} onChange={(event) => setEditAlt(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-caption">{copy.caption}</Label>
              <Textarea id="media-caption" value={editCaption} onChange={(event) => setEditCaption(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-tags">{copy.tags}</Label>
              <Input id="media-tags" value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder={copy.tagsPlaceholder} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingFile(null)}>{copy.cancel}</Button>
            <Button type="button" onClick={() => void handleMetadataSave()} disabled={savingMetadata}>
              {savingMetadata ? copy.saving : copy.saveMetadata}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
