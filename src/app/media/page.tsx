'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FolderPlus, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/media/file-upload';
import { MediaGrid } from '@/components/media/media-grid';
import { MediaFilters } from '@/components/media/media-filters';
import type { MediaFile, MediaFilters as MediaFiltersType } from '@/types/media';
import { Permission, PermissionGuard } from '@/components/permissions/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { getAuthFetchHeaders } from '@/services/graphql-client';

export default function MediaPage() {
  const { hasPermission } = usePermissions();
  const canManageMedia = hasPermission(Permission.MANAGE_MEDIA);
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

  // Load media files
  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media/upload', {
        headers: getAuthFetchHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

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
      }
      
      const failedCount = results.filter(result => !result.success).length;
      if (failedCount > 0) {
        console.error(`Failed to delete ${failedCount} files`);
      }
    } catch (error) {
      console.error('Error during bulk delete:', error);
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
        // Show success message (you can add toast notification here)
      } else {
        console.error('Failed to delete file:', data.message);
        // Show error message (you can add toast notification here)
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Show error message (you can add toast notification here)
    }
  };

  const handleFileEdit = (file: MediaFile) => {
    // TODO: Implement edit modal
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
    <PermissionGuard permissions={[Permission.VIEW_MEDIA, Permission.MANAGE_MEDIA]} showError>
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
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
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
              onFileDelete={handleFileDelete}
              onFileEdit={handleFileEdit}
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
      </div>
    </PermissionGuard>
  );
}
