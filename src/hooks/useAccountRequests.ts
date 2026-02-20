import { useQuery, useMutation } from '@apollo/client/react';
import {
  ACCOUNT_REQUESTS_QUERY,
  APPROVE_ACCOUNT_REQUEST_MUTATION,
  REJECT_ACCOUNT_REQUEST_MUTATION,
} from '../services/accountRequest.gql';

type AccountRequest = {
  id: string;
  email: string;
  requesterName: string;
  requestedRole: string;
  status: string;
  customMessage?: string;
  createdAt: string;
};

type AccountRequestsData = {
  accountRequests: AccountRequest[];
};

export function useAccountRequests(status?: string) {
  const { data, loading, error, refetch } = useQuery<AccountRequestsData>(ACCOUNT_REQUESTS_QUERY, {
    variables: { status },
  });

  const [approveAccountRequest, approveResult] = useMutation(APPROVE_ACCOUNT_REQUEST_MUTATION);
  const [rejectAccountRequest, rejectResult] = useMutation(REJECT_ACCOUNT_REQUEST_MUTATION);

  return {
    requests: data?.accountRequests || [],
    loading,
    error,
    refetch,
    approveAccountRequest,
    approveResult,
    rejectAccountRequest,
    rejectResult,
  };
}
