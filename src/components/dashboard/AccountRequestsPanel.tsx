import React, { useState } from 'react';
import { useAccountRequests } from '../../hooks/useAccountRequests';

export default function AccountRequestsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const {
    requests,
    loading,
    error,
    approveAccountRequest,
    rejectAccountRequest,
    refetch,
  } = useAccountRequests(statusFilter || undefined);

  if (loading) return <div>Loading account requests...</div>;
  if (error) return <div>Error loading requests.</div>;

  const handleApprove = async (id: string) => {
    await approveAccountRequest({
      variables: {
        id,
        customMessage: 'Welcome! Please check your email for verification.',
      },
    });
    refetch();
  };

  const handleReject = async (id: string) => {
    await rejectAccountRequest({
      variables: {
        id,
        customMessage: 'Sorry, your request was not approved.',
      },
    });
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      awaiting_verification: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    const statusLabels = {
      pending: 'Pending Review',
      awaiting_verification: 'Awaiting Verification',
      active: 'Active',
      rejected: 'Rejected',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Account Requests</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All Requests</option>
            <option value="pending">Pending Review</option>
            <option value="awaiting_verification">Awaiting Verification</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      {requests.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          {statusFilter ? `No requests with status "${statusFilter}".` : 'No requests found.'}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{req.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{req.requesterName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{req.requestedRole}</td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">{req.customMessage || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(req.id)} 
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)} 
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {req.status === 'awaiting_verification' && (
                      <span className="text-blue-600 text-xs">Waiting for user verification</span>
                    )}
                    {req.status === 'active' && (
                      <span className="text-green-600 text-xs">Account activated</span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="text-red-600 text-xs">Request rejected</span>
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
