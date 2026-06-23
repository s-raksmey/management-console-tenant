'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, Video, Music, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { MediaFile, MediaUploadProgress, MediaUploadOptions } from '@/types/media';
import { getAuthFetchHeaders } from '@/services/graphql-client';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface FileUploadProps {
  onUploadComplete?: (files: MediaFile[]) => void;
  onUploadProgress?: (progress: MediaUploadProgress[]) => void;
  options?: MediaUploadOptions;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-8 h-8" />;
  if (type.startsWith('video/')) return <Video className="w-8 h-8" />;
  if (type.startsWith('audio/')) return <Music className="w-8 h-8" />;
  if (type === 'application/pdf' || type.startsWith('text/')) return <FileText className="w-8 h-8" />;
  return <File className="w-8 h-8" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const fileUploadCopy = {
  en: {
    uploadFailed: 'Upload failed',
    unknownError: 'Unknown error',
    dropFilesHere: 'Drop files here',
    unsupportedFiles: 'Some files are not supported',
    dragDrop: 'Drag & drop files here',
    browse: 'or click to browse files',
    maximumFiles: (count: number) => `Maximum ${count} files`,
    selectedCount: (count: number) => `${count} file${count !== 1 ? 's' : ''} selected`,
    selectedFiles: 'Selected Files',
    uploadCount: (count: number) => `Upload ${count} file${count !== 1 ? 's' : ''}`,
    clearAll: 'Clear All',
    uploadProgress: 'Upload Progress',
    statuses: {
      uploading: 'uploading',
      processing: 'processing',
      completed: 'completed',
      error: 'error',
    },
  },
  km: {
    uploadFailed: 'Upload មិនបាន',
    unknownError: 'បញ្ហាមិនស្គាល់',
    dropFilesHere: 'ទម្លាក់ឯកសារនៅទីនេះ',
    unsupportedFiles: 'ឯកសារខ្លះមិនគាំទ្រ',
    dragDrop: 'អូស និងទម្លាក់ឯកសារនៅទីនេះ',
    browse: 'ឬចុចដើម្បីជ្រើសឯកសារ',
    maximumFiles: (count: number) => `អតិបរមា ${count} ឯកសារ`,
    selectedCount: (count: number) => `បានជ្រើស ${count} ឯកសារ`,
    selectedFiles: 'ឯកសារដែលបានជ្រើស',
    uploadCount: (count: number) => `Upload ${count} ឯកសារ`,
    clearAll: 'សម្អាតទាំងអស់',
    uploadProgress: 'ដំណើរការ Upload',
    statuses: {
      uploading: 'កំពុង Upload',
      processing: 'កំពុងដំណើរការ',
      completed: 'បានបញ្ចប់',
      error: 'មានបញ្ហា',
    },
  },
} as const;

export function FileUpload({
  onUploadComplete,
  onUploadProgress,
  options = {},
  accept,
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const { locale } = useAdminLocale();
  const copy = fileUploadCopy[locale];
  const [uploadProgress, setUploadProgress] = useState<MediaUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const uploadFile = useCallback(async (file: File): Promise<MediaFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (Object.keys(options).length > 0) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: getAuthFetchHeaders(),
      body: formData,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(locale === 'en' ? result.message || copy.uploadFailed : copy.uploadFailed);
    }

    return result.file;
  }, [copy.uploadFailed, locale, options]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const progressItems: MediaUploadProgress[] = files.map(file => ({
      id: `${Date.now()}-${file.name}`,
      filename: file.name,
      progress: 0,
      status: 'uploading',
    }));

    setUploadProgress(progressItems);
    onUploadProgress?.(progressItems);

    const uploadedFiles: MediaFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progressItem = progressItems[i];

      try {
        // Update progress to show processing
        progressItem.progress = 50;
        progressItem.status = 'processing';
        setUploadProgress([...progressItems]);
        onUploadProgress?.([...progressItems]);

        const uploadedFile = await uploadFile(file);
        uploadedFiles.push(uploadedFile);

        // Complete this file
        progressItem.progress = 100;
        progressItem.status = 'completed';
        setUploadProgress([...progressItems]);
        onUploadProgress?.([...progressItems]);

      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : copy.unknownError}`);
        
        progressItem.status = 'error';
        progressItem.error = error instanceof Error ? error.message : copy.unknownError;
        setUploadProgress([...progressItems]);
        onUploadProgress?.([...progressItems]);
      }
    }

    setIsUploading(false);
    
    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles);
    }

    if (errors.length > 0) {
      console.error('Upload errors:', errors);
      // You might want to show these errors in a toast or modal
    }

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 3000);
  }, [copy, onUploadComplete, onUploadProgress, uploadFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const handleManualUpload = () => {
    if (selectedFiles.length > 0) {
      handleUpload(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles,
    disabled: isUploading,
  });

  const removeProgressItem = (id: string) => {
    setUploadProgress(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
          isDragReject && 'border-red-500 bg-red-50',
          isUploading && 'cursor-not-allowed opacity-50',
          !isDragActive && !isDragReject && 'border-slate-300 hover:border-slate-400'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className={cn(
            'w-12 h-12',
            isDragActive && !isDragReject && 'text-blue-500',
            isDragReject && 'text-red-500',
            !isDragActive && !isDragReject && 'text-slate-400'
          )} />
          
          <div>
            <p className="text-lg font-medium text-slate-900">
              {isDragActive && !isDragReject && copy.dropFilesHere}
              {isDragReject && copy.unsupportedFiles}
              {!isDragActive && copy.dragDrop}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {copy.browse}
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-slate-400 mt-2">
                {copy.maximumFiles(maxFiles)}
              </p>
            )}
            {selectedFiles.length > 0 && (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                {copy.selectedCount(selectedFiles.length)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">{copy.selectedFiles}</h4>
            <div className="flex gap-2">
              <Button
                onClick={handleManualUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {copy.uploadCount(selectedFiles.length)}
              </Button>
              <Button
                variant="outline"
                onClick={clearSelectedFiles}
                disabled={isUploading}
              >
                {copy.clearAll}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="text-slate-400">
                    {getFileIcon(file.type)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSelectedFile(index)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">{copy.uploadProgress}</h4>
          {uploadProgress.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-slate-400">
                    {getFileIcon('application/octet-stream')}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 truncate max-w-xs">
                      {item.filename}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">
                      {copy.statuses[item.status]}
                    </p>
                  </div>
                </div>
                
                {item.status === 'completed' || item.status === 'error' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProgressItem(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
              
              {item.status !== 'completed' && (
                <Progress 
                  value={item.progress} 
                  className={cn(
                    'h-2',
                    item.status === 'error' && 'bg-red-100'
                  )}
                />
              )}
              
              {item.error && (
                <p className="text-sm text-red-600 mt-2">{item.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
