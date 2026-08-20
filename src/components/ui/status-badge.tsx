'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArticleStatus } from '@/types/article';
import { useAdminLocale } from '@/hooks/useAdminLocale';

interface StatusBadgeProps {
  status: ArticleStatus;
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Article is being written'
  },
  REVIEW: {
    label: 'Under Review',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Submitted for editorial review'
  },
  PUBLISHED: {
    label: 'Published',
    className: 'bg-green-100 text-green-800 border-green-200',
    description: 'Live and visible to readers'
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-red-100 text-red-800 border-red-200',
    description: 'No longer active'
  }
};

const localizedStatusConfig = {
  en: statusConfig,
  km: {
    DRAFT: {
      label: 'ព្រាង',
      className: statusConfig.DRAFT.className,
      description: 'អត្ថបទកំពុងសរសេរ',
    },
    REVIEW: {
      label: 'កំពុងត្រួតពិនិត្យ',
      className: statusConfig.REVIEW.className,
      description: 'បានផ្ញើទៅក្រុមកែសម្រួលត្រួតពិនិត្យ',
    },
    PUBLISHED: {
      label: 'បានផ្សព្វផ្សាយ',
      className: statusConfig.PUBLISHED.className,
      description: 'កំពុងបង្ហាញជាសាធារណៈឱ្យអ្នកអានមើល',
    },
    ARCHIVED: {
      label: 'បានដាក់ប័ណ្ណសារ',
      className: statusConfig.ARCHIVED.className,
      description: 'លែងសកម្ម',
    },
  },
} as const;

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { locale } = useAdminLocale();
  const config = localizedStatusConfig[locale][status];
  
  if (!config) {
    return (
      <Badge className={`bg-gray-100 text-gray-800 ${className}`}>
        {locale === 'km' ? 'មិនស្គាល់' : 'Unknown'}
      </Badge>
    );
  }

  return (
    <Badge 
      className={`${config.className} ${className}`}
      title={config.description}
    >
      {config.label}
    </Badge>
  );
}

// Helper function to get status color for other components
export function getStatusColor(status: ArticleStatus): string {
  return statusConfig[status]?.className || 'bg-gray-100 text-gray-800';
}

// Helper function to get status label
export function getStatusLabel(status: ArticleStatus): string {
  return statusConfig[status]?.label || 'Unknown';
}
