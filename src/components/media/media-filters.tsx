'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { MediaFilters, MediaType } from '@/types/media';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface MediaFiltersProps {
  filters: MediaFilters;
  onFiltersChange: (filters: MediaFilters) => void;
  folders?: string[];
  className?: string;
}

const mediaFilterCopy = {
  en: {
    searchPlaceholder: 'Search files...',
    allTypes: 'All types',
    allFolders: 'All folders',
    clear: 'Clear',
    activeSearch: (value: string) => `Search: ${value}`,
    activeType: (value?: string) => `Type: ${value}`,
    activeFolder: (value: string) => `Folder: ${value}`,
    activeTags: (value: string) => `Tags: ${value}`,
    mediaTypes: {
      image: 'Images',
      video: 'Videos',
      audio: 'Audio',
      document: 'Documents',
      other: 'Other',
    },
    sortOptions: {
      name: 'Name',
      date: 'Date',
      size: 'Size',
      type: 'Type',
    },
  },
  km: {
    searchPlaceholder: 'ស្វែងរកឯកសារ...',
    allTypes: 'ប្រភេទទាំងអស់',
    allFolders: 'ថតទាំងអស់',
    clear: 'សម្អាត',
    activeSearch: (value: string) => `ស្វែងរក៖ ${value}`,
    activeType: (value?: string) => `ប្រភេទ៖ ${value}`,
    activeFolder: (value: string) => `ថត៖ ${value}`,
    activeTags: (value: string) => `ស្លាក៖ ${value}`,
    mediaTypes: {
      image: 'រូបភាព',
      video: 'វីដេអូ',
      audio: 'សំឡេង',
      document: 'ឯកសារ',
      other: 'ផ្សេងៗ',
    },
    sortOptions: {
      name: 'ឈ្មោះ',
      date: 'កាលបរិច្ឆេទ',
      size: 'ទំហំ',
      type: 'ប្រភេទ',
    },
  },
} as const;

const mediaTypes: { value: MediaType }[] = [
  { value: 'image' },
  { value: 'video' },
  { value: 'audio' },
  { value: 'document' },
  { value: 'other' },
];

const sortOptions = ['name', 'date', 'size', 'type'] as const;

export function MediaFilters({
  filters,
  onFiltersChange,
  folders = [],
  className,
}: MediaFiltersProps) {
  const { locale } = useAdminLocale();
  const copy = mediaFilterCopy[locale];

  const updateFilter = (key: keyof MediaFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.type ||
    filters.folder ||
    filters.tags?.length ||
    filters.dateFrom ||
    filters.dateTo
  );

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={copy.searchPlaceholder}
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder={copy.allTypes} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allTypes}</SelectItem>
            {mediaTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {copy.mediaTypes[type.value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Folder Filter */}
        {folders.length > 0 && (
          <Select
            value={filters.folder || 'all'}
            onValueChange={(value) => updateFilter('folder', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder={copy.allFolders} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.allFolders}</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy || 'date'}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {copy.sortOptions[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortOrder || 'desc'}
            onValueChange={(value) => updateFilter('sortOrder', value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">A-Z</SelectItem>
              <SelectItem value="desc">Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {copy.clear}
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {copy.activeSearch(filters.search)}
              <button
                onClick={() => updateFilter('search', undefined)}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.type && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {copy.activeType(filters.type ? copy.mediaTypes[filters.type] : undefined)}
              <button
                onClick={() => updateFilter('type', undefined)}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.folder && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {copy.activeFolder(filters.folder)}
              <button
                onClick={() => updateFilter('folder', undefined)}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.tags && filters.tags.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {copy.activeTags(filters.tags.join(', '))}
              <button
                onClick={() => updateFilter('tags', undefined)}
                className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
