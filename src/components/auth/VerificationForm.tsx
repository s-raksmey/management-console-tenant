"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { VERIFY_ACCOUNT_REQUEST_MUTATION } from '@/services/verifyAccount.gql';

interface VerificationFormProps {
  requestId: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

type VerifyAccountResult = {
  verifyAccountRequest?: {
    success: boolean;
    message?: string;
    request?: {
      id: string;
      email: string;
      requesterName: string;
      status: string;
    };
  };
};

export function VerificationForm({ requestId, onSuccess, onBackToLogin }: VerificationFormProps) {
  const [verifyAccount, { loading: isLoading }] = useMutation<VerifyAccountResult>(VERIFY_ACCOUNT_REQUEST_MUTATION);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!verificationCode.trim()) {
      setError('Please enter your verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 characters long');
      return;
    }

    try {
      const { data } = await verifyAccount({
        variables: {
          id: requestId,
          code: verificationCode.toUpperCase(),
        },
      });

      if (data?.verifyAccountRequest?.success) {
        setSuccess(true);
        onSuccess?.();
        // Redirect to login after a short delay
        setTimeout(() => {
          onBackToLogin?.();
        }, 3000);
      } else {
        setError(data?.verifyAccountRequest?.message || 'Verification failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
      if (error) setError('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Verify Your Account
          </h1>
          <p className="text-slate-600">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-700 mb-2">Account Verified!</h2>
            <p className="text-green-600 mb-4">
              Your account has been successfully activated. You can now log in with your credentials.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-700">
                Redirecting to login page in a few seconds...
              </p>
            </div>
            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="mt-4 font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Go to Login Now
              </button>
            )}
          </motion.div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Verification Code Field */}
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XXXXXX"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter the 6-character code from your email
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="-ml-1 mr-2 h-4 w-4" />
                    Verify Account
                  </>
                )}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  disabled={isLoading}
                >
                  Resend verification email
                </button>
              </p>
              {onBackToLogin && (
                <p className="text-sm text-slate-600 mt-2">
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    disabled={isLoading}
                  >
                    Back to Login
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

