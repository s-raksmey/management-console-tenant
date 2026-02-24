"use client";

import { Suspense } from 'react';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Complete your account setup by verifying your email address
          </p>
        </div>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <EmailVerificationForm />
        </Suspense>
      </div>
    </div>
  );
}
