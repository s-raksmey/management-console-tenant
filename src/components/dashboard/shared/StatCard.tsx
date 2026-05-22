// src/components/dashboard/shared/StatCard.tsx
'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon: LucideIcon;
  gradient?: string;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient = 'from-blue-500 to-blue-600',
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24 dark:bg-slate-700"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg dark:bg-slate-700"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2 dark:bg-slate-700"></div>
            <div className="h-3 bg-gray-200 rounded w-32 dark:bg-slate-700"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-green-600 dark:text-green-300';
      case 'decrease': return 'text-red-600 dark:text-red-300';
      default: return 'text-gray-600 dark:text-slate-400';
    }
  };

  const getChangeSymbol = (type: string) => {
    switch (type) {
      case 'increase': return '+';
      case 'decrease': return '-';
      default: return '';
    }
  };

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600", className)}>
      {/* Gradient Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5", gradient)} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide dark:text-slate-300">
            {title}
          </h3>
          <div className={cn("p-2 rounded-lg bg-gradient-to-br", gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {change && (
            <div className="flex items-center space-x-1">
              <span className={cn("text-sm font-medium", getChangeColor(change.type))}>
                {getChangeSymbol(change.type)}{Math.abs(change.value)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {change.period || 'vs last period'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
