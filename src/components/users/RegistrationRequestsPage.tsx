// src/components/users/RegistrationRequestsPage.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  User, 
  Calendar,
  MapPin,
  Monitor,
  AlertCircle,
  RefreshCw,
  CheckSquare,
  X
} from 'lucide-react';
import { RegistrationRequestService } from '@/services/registrationRequest.gql';
import type { 
  RegistrationRequest, 
  RegistrationStatsResponse,
  RegistrationRequestStatus 
} from '@/types/registrationRequest';
import { useToast } from '@/hooks/use-toast';
import { RegistrationRequestCard } from './RegistrationRequestCard';
import { BulkActionsBar } from './BulkActionsBar';
import { RegistrationStatsCards } from './RegistrationStatsCards';

export function RegistrationRequestsPage() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [stats, setStats] = useState<RegistrationStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<RegistrationRequestStatus | 'ALL'>('PENDING_APPROVAL');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load both requests and stats in parallel
      const [requestsResult, statsResult] = await Promise.all([
        RegistrationRequestService.listRegistrationRequests({
          status: activeTab === 'ALL' ? undefined : activeTab,
          limit: 50,
          offset: 0
        }),
        RegistrationRequestService.getRegistrationStats()
      ]);

      if (requestsResult.success) {
        setRequests(requestsResult.requests);
      } else {
        toast({
          title: "Error",
          description: requestsResult.message || "Failed to load registration requests",
          variant: "destructive"
        });
      }

      setStats(statsResult);
    } catch (error) {
      console.error('Error loading registration data:', error);
      toast({
        title: "Error",
        description: "Failed to load registration data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (requestId: string, notes?: string) => {
    try {
      const result = await RegistrationRequestService.approveRegistrationRequest({
        registrationId: requestId,
        reviewNotes: notes
      });

      if (result.success) {
        toast({
          title: "Request Approved",
          description: result.message,
          variant: "success"
        });
        
        // Remove from current list and reload data
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setSelectedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        loadData(); // Reload to update stats
      } else {
        toast({
          title: "Approval Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string, reason?: string) => {
    try {
      const result = await RegistrationRequestService.rejectRegistrationRequest({
        registrationId: requestId,
        reviewNotes: reason
      });

      if (result.success) {
        toast({
          title: "Request Rejected",
          description: result.message,
          variant: "success"
        });
        
        // Remove from current list and reload data
        setRequests(prev => prev.filter(req => req.id !== requestId));
        setSelectedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        loadData(); // Reload to update stats
      } else {
        toast({
          title: "Rejection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = async (notes?: string) => {
    if (selectedRequests.size === 0) return;

    try {
      const result = await RegistrationRequestService.bulkApproveRegistrationRequests({
        registrationIds: Array.from(selectedRequests),
        reviewNotes: notes
      });

      if (result.success) {
        toast({
          title: "Bulk Approval Complete",
          description: `${selectedRequests.size} requests approved successfully`,
          variant: "success"
        });
        
        setSelectedRequests(new Set());
        loadData();
      } else {
        toast({
          title: "Bulk Approval Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in bulk approval:', error);
      toast({
        title: "Error",
        description: "Failed to approve requests. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleBulkReject = async (reason?: string) => {
    if (selectedRequests.size === 0) return;

    try {
      const result = await RegistrationRequestService.bulkRejectRegistrationRequests({
        registrationIds: Array.from(selectedRequests),
        reviewNotes: reason
      });

      if (result.success) {
        toast({
          title: "Bulk Rejection Complete",
          description: `${selectedRequests.size} requests rejected`,
          variant: "success"
        });
        
        setSelectedRequests(new Set());
        loadData();
      } else {
        toast({
          title: "Bulk Rejection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      toast({
        title: "Error",
        description: "Failed to reject requests. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSelectRequest = (requestId: string, selected: boolean) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(requestId);
      } else {
        newSet.delete(requestId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRequests(new Set(requests.map(req => req.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const getTabCount = (status: RegistrationRequestStatus | 'ALL') => {
    if (!stats) return 0;
    
    switch (status) {
      case 'PENDING_VERIFICATION':
        return stats.pendingVerification;
      case 'PENDING_APPROVAL':
        return stats.pendingApproval;
      case 'APPROVED':
        return stats.approved;
      case 'REJECTED':
        return stats.rejected;
      case 'EXPIRED':
        return stats.expired;
      case 'ALL':
        return stats.totalRequests;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Registration Requests</h1>
          <p className="text-muted-foreground">
            Review and manage new user registration requests
          </p>
        </div>
        <Button 
          onClick={loadData} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && <RegistrationStatsCards stats={stats} />}

      {/* Bulk Actions Bar */}
      {selectedRequests.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedRequests.size}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onClear={() => setSelectedRequests(new Set())}
        />
      )}

      {/* Tabs for different request statuses */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RegistrationRequestStatus | 'ALL')}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="PENDING_APPROVAL" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval
            {getTabCount('PENDING_APPROVAL') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('PENDING_APPROVAL')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="PENDING_VERIFICATION" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Pending Email
            {getTabCount('PENDING_VERIFICATION') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('PENDING_VERIFICATION')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
            {getTabCount('APPROVED') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('APPROVED')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
            {getTabCount('REJECTED') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('REJECTED')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="EXPIRED" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Expired
            {getTabCount('EXPIRED') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('EXPIRED')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ALL" className="flex items-center gap-2">
            All
            {getTabCount('ALL') > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getTabCount('ALL')}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading registration requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Registration Requests</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'PENDING_APPROVAL' 
                    ? "No requests are currently pending approval."
                    : `No requests found with status: ${RegistrationRequestService.getStatusDisplayName(activeTab)}`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Select All Checkbox */}
              {activeTab === 'PENDING_APPROVAL' && requests.length > 0 && (
                <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedRequests.size === requests.length && requests.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select all {requests.length} requests
                  </label>
                </div>
              )}

              {/* Request Cards */}
              {requests.map((request) => (
                <RegistrationRequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSelect={handleSelectRequest}
                  isSelected={selectedRequests.has(request.id)}
                  showActions={activeTab === 'PENDING_APPROVAL'}
                  showSelection={activeTab === 'PENDING_APPROVAL'}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
