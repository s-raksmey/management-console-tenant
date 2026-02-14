// src/components/users/RegistrationRequestCard.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RegistrationRequestService } from '@/services/registrationRequest.gql';
import type { RegistrationRequest } from '@/types/registrationRequest';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface RegistrationRequestCardProps {
  request: RegistrationRequest;
  onApprove: (requestId: string, notes?: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  onSelect: (requestId: string, selected: boolean) => void;
  isSelected: boolean;
  showActions: boolean;
  showSelection: boolean;
}

export function RegistrationRequestCard({
  request,
  onApprove,
  onReject,
  onSelect,
  isSelected,
  showActions,
  showSelection
}: RegistrationRequestCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  const handleApprove = () => {
    onApprove(request.id, approvalNotes.trim() || undefined);
    setApprovalNotes('');
    setShowApprovalDialog(false);
  };

  const handleReject = () => {
    onReject(request.id, rejectionReason.trim() || undefined);
    setRejectionReason('');
    setShowRejectionDialog(false);
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case 'PENDING_VERIFICATION':
        return <Mail className="h-4 w-4" />;
      case 'PENDING_APPROVAL':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'EXPIRED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {showSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(request.id, e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold">{request.name}</h3>
                <Badge 
                  variant="secondary" 
                  className={RegistrationRequestService.getStatusBadgeColor(request.status)}
                >
                  {getStatusIcon()}
                  <span className="ml-1">
                    {RegistrationRequestService.getStatusDisplayName(request.status)}
                  </span>
                </Badge>
                <Badge 
                  variant="outline"
                  className={RegistrationRequestService.getRoleBadgeColor(request.requestedRole)}
                >
                  {RegistrationRequestService.getRoleDisplayName(request.requestedRole)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{request.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{RegistrationRequestService.getTimeAgo(request.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showActions && (
              <>
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Registration Request</DialogTitle>
                      <DialogDescription>
                        Approve {request.name}'s registration request for {request.email}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                        <Textarea
                          id="approval-notes"
                          placeholder="Add any notes about this approval..."
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                        Approve Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Registration Request</DialogTitle>
                      <DialogDescription>
                        Reject {request.name}'s registration request for {request.email}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Provide a reason for rejection (will be sent to the user)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleReject}>
                        Reject Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Request Details
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="text-sm font-medium">{request.email}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="text-sm font-medium">{request.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Requested Role:</span>
                  <Badge variant="outline" className={RegistrationRequestService.getRoleBadgeColor(request.requestedRole)}>
                    {RegistrationRequestService.getRoleDisplayName(request.requestedRole)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={RegistrationRequestService.getStatusBadgeColor(request.status)}>
                    {RegistrationRequestService.getStatusDisplayName(request.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Submitted:</span>
                  <span className="text-sm font-medium">
                    {RegistrationRequestService.formatDate(request.createdAt)}
                  </span>
                </div>

                {request.emailVerifiedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email Verified:</span>
                    <span className="text-sm font-medium">
                      {RegistrationRequestService.formatDate(request.emailVerifiedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Technical Details
              </h4>
              
              <div className="space-y-2">
                {request.ipAddress && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">IP: {request.ipAddress}</span>
                  </div>
                )}
                
                {request.userAgent && (
                  <div className="flex items-start space-x-2">
                    <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm text-muted-foreground break-all">
                      {request.userAgent}
                    </span>
                  </div>
                )}
              </div>

              {(request.reviewedBy || request.reviewNotes) && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Review Information
                  </h4>
                  
                  {request.reviewer && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Reviewed by:</span>
                      <span className="text-sm font-medium">{request.reviewer.name}</span>
                    </div>
                  )}
                  
                  {request.reviewedAt && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Reviewed at:</span>
                      <span className="text-sm font-medium">
                        {RegistrationRequestService.formatDate(request.reviewedAt)}
                      </span>
                    </div>
                  )}
                  
                  {request.reviewNotes && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Notes:</span>
                      <p className="text-sm mt-1 p-2 bg-background rounded border">
                        {request.reviewNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
