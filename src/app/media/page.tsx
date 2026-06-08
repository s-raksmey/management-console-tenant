'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FolderPlus, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const MEDIA_ACCESS_PERMISSIONS = [Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA];

export default function MediaPage() {
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
        toast({ title: 'Media load failed', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({ title: 'Media load failed', description: 'Unable to load media files.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [canAccessMedia, permissionsLoading, toast]);

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
        toast({ title: 'Files deleted', description: `${successfullyDeleted.length} file(s) removed.`, variant: 'success' });
      }
      
      const failedCount = results.filter(result => !result.success).length;
      if (failedCount > 0) {
        console.error(`Failed to delete ${failedCount} files`);
        toast({ title: 'Some files were not deleted', description: `${failedCount} file(s) could not be removed.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error during bulk delete:', error);
      toast({ title: 'Delete failed', description: 'Unable to delete the selected files.', variant: 'destructive' });
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
        toast({ title: 'File deleted', description: `${file.originalName} was removed.`, variant: 'success' });
      } else {
        console.error('Failed to delete file:', data.message);
        toast({ title: 'Delete failed', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: 'Delete failed', description: 'Unable to delete the file.', variant: 'destructive' });
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
        throw new Error(data.message || 'Unable to update file metadata.');
      }

      setFiles(prev => prev.map(file => file.id === data.file.id ? data.file : file));
      setEditingFile(null);
      toast({ title: 'Metadata saved', description: `${editingFile.originalName} was updated.`, variant: 'success' });
    } catch (error) {
      toast({
        title: 'Metadata update failed',
        description: error instanceof Error ? error.message : 'Unable to update file metadata.',
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

  return (
    <PermissionGuard permissions={MEDIA_ACCESS_PERMISSIONS} showError>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Media Library
          </h1>
          <p className="text-slate-600">
            Manage your files and images. {stats.totalFiles} files ({formatFileSize(stats.totalSize)})
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <div className="flex items-center border border-slate-200 rounded-lg">
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
            <div key={type} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-sm text-slate-500 capitalize">{type}s</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="library" className="space-y-6">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          {canManageMedia && <TabsTrigger value="upload">Upload</TabsTrigger>}
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
                Select All ({filteredFiles.length} files)
              </label>
            </div>
          )}

          {/* Selection Actions */}
          {canManageMedia && selectedFiles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkDownload}>
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Files Grid */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500">Loading files...</p>
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
        title="Delete Selected Files?"
        description={`Delete ${selectedFiles.length} selected file${selectedFiles.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete Files"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          void handleBulkDelete();
        }}
      />
      <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit media metadata</DialogTitle>
            <DialogDescription>
              Update accessibility text, caption, and comma-separated tags for this file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-alt">Alt text</Label>
              <Input id="media-alt" value={editAlt} onChange={(event) => setEditAlt(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-caption">Caption</Label>
              <Textarea id="media-caption" value={editCaption} onChange={(event) => setEditCaption(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-tags">Tags</Label>
              <Input id="media-tags" value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder="newsroom, homepage, politics" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingFile(null)}>Cancel</Button>
            <Button type="button" onClick={() => void handleMetadataSave()} disabled={savingMetadata}>
              {savingMetadata ? 'Saving...' : 'Save metadata'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
