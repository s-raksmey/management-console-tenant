// src/components/users/BulkActionsBar.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, X } from 'lucide-react';
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

interface BulkActionsBarProps {
  selectedCount: number;
  onApprove: (notes?: string) => void;
  onReject: (reason?: string) => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onApprove,
  onReject,
  onClear
}: BulkActionsBarProps) {
  const [bulkApprovalNotes, setBulkApprovalNotes] = useState('');
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false);
  const [showBulkRejectionDialog, setShowBulkRejectionDialog] = useState(false);

  const handleBulkApprove = () => {
    onApprove(bulkApprovalNotes.trim() || undefined);
    setBulkApprovalNotes('');
    setShowBulkApprovalDialog(false);
  };

  const handleBulkReject = () => {
    onReject(bulkRejectionReason.trim() || undefined);
    setBulkRejectionReason('');
    setShowBulkRejectionDialog(false);
  };

  return (
    <div className="sticky top-4 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedCount} request{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showBulkApprovalDialog} onOpenChange={setShowBulkApprovalDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Approve Registration Requests</DialogTitle>
                  <DialogDescription>
                    Approve {selectedCount} registration request{selectedCount !== 1 ? 's' : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-approval-notes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="bulk-approval-notes"
                      placeholder="Add notes that will apply to all approved requests..."
                      value={bulkApprovalNotes}
                      onChange={(e) => setBulkApprovalNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkApprovalDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                    Approve {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showBulkRejectionDialog} onOpenChange={setShowBulkRejectionDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Reject Registration Requests</DialogTitle>
                  <DialogDescription>
                    Reject {selectedCount} registration request{selectedCount !== 1 ? 's' : ''}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-rejection-reason">Rejection Reason (Optional)</Label>
                    <Textarea
                      id="bulk-rejection-reason"
                      placeholder="Provide a reason for rejection (will be sent to all users)..."
                      value={bulkRejectionReason}
                      onChange={(e) => setBulkRejectionReason(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBulkRejectionDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleBulkReject}>
                    Reject {selectedCount} Request{selectedCount !== 1 ? 's' : ''}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
