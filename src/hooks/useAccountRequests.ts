import { useQuery, useMutation } from '@apollo/client/react';
import {
  ACCOUNT_REQUESTS_QUERY,
  APPROVE_ACCOUNT_REQUEST_MUTATION,
  REJECT_ACCOUNT_REQUEST_MUTATION,
} from '../services/accountRequest.gql';

type AccountRequest = {
  // define the fields of an account request here, for example:
  id: string;
  // ...other fields
};

type AccountRequestsData = {
  accountRequests: AccountRequest[];
};

export function useAccountRequests(status = 'pending') {
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