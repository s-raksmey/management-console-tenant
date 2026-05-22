// src/components/dashboard/shared/MetricCard.tsx
'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  description?: string;
  value: number;
  maxValue?: number;
  target?: number;
  unit?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  showProgress?: boolean;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  description,
  value,
  maxValue,
  target,
  unit = '',
  icon: Icon,
  color = 'blue',
  showProgress = false,
  loading = false,
  className,
  children
}) => {
  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 dark:bg-slate-700"></div>
            <div className="h-3 bg-gray-200 rounded w-48 dark:bg-slate-700"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-4 dark:bg-slate-700"></div>
            <div className="h-2 bg-gray-200 rounded w-full dark:bg-slate-700"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const colorClasses = {
    blue: {
      icon: 'text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300',
      progress: 'bg-blue-600',
      text: 'text-blue-600 dark:text-blue-300'
    },
    green: {
      icon: 'text-green-600 bg-green-100 dark:bg-green-500/15 dark:text-green-300',
      progress: 'bg-green-600',
      text: 'text-green-600 dark:text-green-300'
    },
    yellow: {
      icon: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-500/15 dark:text-yellow-300',
      progress: 'bg-yellow-600',
      text: 'text-yellow-600 dark:text-yellow-300'
    },
    red: {
      icon: 'text-red-600 bg-red-100 dark:bg-red-500/15 dark:text-red-300',
      progress: 'bg-red-600',
      text: 'text-red-600 dark:text-red-300'
    },
    purple: {
      icon: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300',
      progress: 'bg-purple-600',
      text: 'text-purple-600 dark:text-purple-300'
    },
    indigo: {
      icon: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300',
      progress: 'bg-indigo-600',
      text: 'text-indigo-600 dark:text-indigo-300'
    }
  };

  const progressValue = maxValue ? (value / maxValue) * 100 : target ? (value / target) * 100 : 0;
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card className={cn("transition-colors duration-200 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {title}
            </CardTitle>
            {description && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-2 rounded-lg", colorClasses[color].icon)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              {displayValue}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 dark:text-slate-400">{unit}</span>
            )}
            {target && (
              <span className="text-sm text-gray-400 dark:text-slate-500">
                / {target.toLocaleString()}
              </span>
            )}
          </div>
          
          {showProgress && (maxValue || target) && (
            <div className="space-y-2">
              <Progress 
                value={progressValue} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>Progress</span>
                <span>{Math.round(progressValue)}%</span>
              </div>
            </div>
          )}
          
          {children}
        </div>
      </CardContent>
    </Card>
  );
};
