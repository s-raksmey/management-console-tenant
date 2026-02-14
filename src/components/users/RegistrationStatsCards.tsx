// src/components/users/RegistrationStatsCards.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Users,
  AlertCircle
} from 'lucide-react';
import type { RegistrationStatsResponse } from '@/types/registrationRequest';

interface RegistrationStatsCardsProps {
  stats: RegistrationStatsResponse;
}

export function RegistrationStatsCards({ stats }: RegistrationStatsCardsProps) {
  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'All registration requests'
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Awaiting admin review'
    },
    {
      title: 'Pending Email',
      value: stats.pendingVerification,
      icon: Mail,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Email verification needed'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Successfully approved'
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Declined requests'
    },
    {
      title: 'Expired',
      value: stats.expired,
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Token expired'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
