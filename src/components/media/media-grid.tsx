'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FileText, Video, Music, File, Download, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { cn } from '@/lib/utils';
import type { MediaFile } from '@/types/media';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface MediaGridProps {
  files: MediaFile[];
  onFileSelect?: (file: MediaFile) => void;
  onFileDelete?: (file: MediaFile) => void;
  onFileEdit?: (file: MediaFile) => void;
  selectedFiles?: string[];
  selectable?: boolean;
  className?: string;
}

const getFileIcon = (type: string, className?: string) => {
  const iconClass = cn('w-6 h-6', className);
  
  if (type.startsWith('image/')) return <Image className={iconClass} width={24} height={24} alt="" src={''} />;
  if (type.startsWith('video/')) return <Video className={iconClass} />;
  if (type.startsWith('audio/')) return <Music className={iconClass} />;
  if (type === 'application/pdf' || type.startsWith('text/')) return <FileText className={iconClass} />;
  return <File className={iconClass} />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getTypeColor = (type: string): string => {
  if (type.startsWith('image/')) return 'bg-green-100 text-green-800';
  if (type.startsWith('video/')) return 'bg-purple-100 text-purple-800';
  if (type.startsWith('audio/')) return 'bg-blue-100 text-blue-800';
  if (type === 'application/pdf') return 'bg-red-100 text-red-800';
  if (type.startsWith('text/')) return 'bg-gray-100 text-gray-800';
  return 'bg-slate-100 text-slate-800';
};

const mediaGridCopy = {
  en: {
    emptyTitle: 'No files found',
    emptyDescription: 'Upload some files to get started.',
    deleteTitle: 'Delete File?',
    deleteDescription: 'Are you sure you want to delete this file? This action cannot be undone.',
    deleteConfirm: 'Delete',
    cancel: 'Cancel',
    viewFile: 'View file',
    downloadFile: 'Download file',
    editFile: 'Edit file',
  },
  km: {
    emptyTitle: 'រកមិនឃើញឯកសារ',
    emptyDescription: 'ផ្ទុកឯកសារខ្លះដើម្បីចាប់ផ្តើម។',
    deleteTitle: 'លុបឯកសារ?',
    deleteDescription: 'តើអ្នកប្រាកដថាចង់លុបឯកសារនេះមែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    deleteConfirm: 'លុប',
    cancel: 'បោះបង់',
    viewFile: 'មើលឯកសារ',
    downloadFile: 'ទាញយកឯកសារ',
    editFile: 'កែឯកសារ',
  },
} as const;

export function MediaGrid({
  files,
  onFileSelect,
  onFileDelete,
  onFileEdit,
  selectedFiles = [],
  selectable = false,
  className,
}: MediaGridProps) {
  const { locale } = useAdminLocale();
  const copy = mediaGridCopy[locale];
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    file: MediaFile | null;
  }>({ open: false, file: null });

  const handleFileClick = (file: MediaFile) => {
    if (selectable && onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDeleteClick = (file: MediaFile) => {
    setDeleteDialog({ open: true, file });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.file && onFileDelete) {
      onFileDelete(deleteDialog.file);
    }
    setDeleteDialog({ open: false, file: null });
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">{copy.emptyTitle}</h3>
        <p className="text-slate-500">{copy.emptyDescription}</p>
      </div>
    );
  }

  return (
    <><div className={cn('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4', className)}>
      {files.map((file) => {
        const isSelected = selectedFiles.includes(file.id);
        const isImage = file.type === 'image';

        return (
          <div
            key={file.id}
            className={cn(
              'group relative bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200',
              selectable && 'cursor-pointer',
              isSelected && 'ring-2 ring-blue-500 border-blue-500'
            )}
            onClick={() => handleFileClick(file)}
          >
            {/* File Preview */}
            <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden">
              {isImage ? (
                <Image
                  src={file.url}
                  alt={file.alt || file.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              ) : (
                <div className="text-slate-400">
                  {getFileIcon(file.mimeType, 'w-12 h-12')}
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={copy.viewFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    } }
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={copy.downloadFile}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    } }
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {onFileEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={copy.editFile}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileEdit(file);
                      } }
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onFileDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={copy.deleteConfirm}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(file);
                      } }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* File Info */}
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900 truncate text-sm" title={file.originalName}>
                  {file.originalName}
                </h4>
                <Badge variant="secondary" className={cn('text-xs ml-2 flex-shrink-0', getTypeColor(file.mimeType))}>
                  {file.type}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  {formatFileSize(file.size)}
                  {file.width && file.height && (
                    <span className="ml-2">{file.width} × {file.height}</span>
                  )}
                </p>

                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {file.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{file.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  {new Date(file.uploadedAt).toLocaleDateString(locale === 'km' ? 'km-KH' : undefined)}
                </p>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectable && (
              <div className={cn(
                'absolute top-2 right-2 w-5 h-5 rounded-full border-2 transition-all',
                isSelected
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-slate-300 group-hover:border-slate-400'
              )}>
                {isSelected && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div><ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmText={copy.deleteConfirm}
        cancelText={copy.cancel}
        variant="destructive"
        onConfirm={handleDeleteConfirm} /></>
  );
}
