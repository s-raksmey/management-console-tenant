'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RegistrationRequestService } from '@/services/registrationRequest.gql';
import type {
  RegistrationRequest,
  RegistrationRequestStatus,
} from '@/types/registrationRequest';

type StatusFilter = RegistrationRequestStatus | '';

export default function AccountRequestsPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING_APPROVAL');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await RegistrationRequestService.listRegistrationRequests({
        status: statusFilter || undefined,
        limit: 8,
        offset: 0,
      });

      if (!result.success) {
        setError(result.message || 'Failed to load account requests.');
        setRequests([]);
        return;
      }

      setRequests(result.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleApprove = async (id: string) => {
    try {
      setActionId(id);
      await RegistrationRequestService.approveRegistrationRequest({
        registrationId: id,
        reviewNotes: 'Approved from dashboard.',
      });
      await loadRequests();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionId(id);
      await RegistrationRequestService.rejectRegistrationRequest({
        registrationId: id,
        reviewNotes: 'Rejected from dashboard.',
      });
      await loadRequests();
    } finally {
      setActionId(null);
    }
  };

  const getStatusBadge = (status: RegistrationRequestStatus) => {
    const statusLabels: Record<RegistrationRequestStatus, string> = {
      PENDING_APPROVAL: 'Pending Review',
      PENDING_VERIFICATION: 'Awaiting Verification',
      APPROVED: 'Active',
      REJECTED: 'Rejected',
      EXPIRED: 'Expired',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${RegistrationRequestService.getStatusBadgeColor(
          status,
        )}`}
      >
        {statusLabels[status]}
      </span>
    );
  };

  if (loading) return <div>Loading account requests...</div>;
  if (error) return <div className="text-sm text-red-600">Error loading requests: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Account Requests</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All Requests</option>
            <option value="PENDING_APPROVAL">Pending Review</option>
            <option value="PENDING_VERIFICATION">Awaiting Verification</option>
            <option value="APPROVED">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          {statusFilter
            ? `No requests with status "${RegistrationRequestService.getStatusDisplayName(statusFilter)}".`
            : 'No requests found.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{req.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{req.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {RegistrationRequestService.getRoleDisplayName(req.requestedRole)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {RegistrationRequestService.getTimeAgo(req.createdAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {req.status === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionId === req.id}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionId === req.id}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {req.status === 'PENDING_VERIFICATION' && (
                      <span className="text-blue-600 text-xs">Waiting for user verification</span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="text-green-600 text-xs">Account activated</span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span className="text-red-600 text-xs">Request rejected</span>
                    )}
                    {req.status === 'EXPIRED' && (
                      <span className="text-gray-600 text-xs">Verification expired</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
