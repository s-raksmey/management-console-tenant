import React from 'react';
import { useAccountRequests } from '../../hooks/useAccountRequests';

export default function AccountRequestsPanel() {
  const {
    requests,
    loading,
    error,
    approveAccountRequest,
    rejectAccountRequest,
    refetch,
  } = useAccountRequests();

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

  return (
    <div>
      <h2>Account Requests</h2>
      {requests.length === 0 ? (
        <div>No pending requests.</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req: any) => (
              <tr key={req.id}>
                <td>{req.email}</td>
                <td>{req.requesterName}</td>
                <td>{req.requestedRole}</td>
                <td>{req.customMessage}</td>
                <td>
                  <button onClick={() => handleApprove(req.id)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                  <button onClick={() => handleReject(req.id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
