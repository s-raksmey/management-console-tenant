"use client";

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  locale?: 'en' | 'km';
}

const loginCopy = {
  en: {
    verifyTitle: 'Verify Your Login',
    welcomeTitle: 'Welcome Back',
    setupDescription: 'Scan the QR code once, then enter the 6-digit code.',
    verifyDescription: 'Enter the 6-digit code from your authenticator app.',
    signInDescription: 'Sign in to your admin account',
    verificationCode: 'Verification Code',
    manualSetupKey: 'Manual setup key',
    verifying: 'Verifying...',
    backToPassword: 'Back to password',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot password?',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    missingFields: 'Please fill in all fields',
    loginFailed: 'Login failed',
    unexpectedError: 'An unexpected error occurred',
    codeError: 'Enter the 6-digit code from your authenticator app',
    verificationFailed: 'Verification failed',
    noAccount: 'Do not have an account?',
    createAccount: 'Create one here',
    qrAlt: 'Two-factor setup QR code',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  km: {
    verifyTitle: 'ផ្ទៀងផ្ទាត់ការចូល',
    welcomeTitle: 'សូមស្វាគមន៍ត្រឡប់មកវិញ',
    setupDescription: 'ស្កេនកូដ QR ម្តង រួចបញ្ចូលលេខកូដ ៦ ខ្ទង់។',
    verifyDescription: 'បញ្ចូលលេខកូដ ៦ ខ្ទង់ពីកម្មវិធីផ្ទៀងផ្ទាត់របស់អ្នក។',
    signInDescription: 'ចូលទៅកាន់គណនីគ្រប់គ្រងរបស់អ្នក',
    verificationCode: 'លេខកូដផ្ទៀងផ្ទាត់',
    manualSetupKey: 'លេខកូដដំឡើងដោយដៃ',
    verifying: 'កំពុងផ្ទៀងផ្ទាត់...',
    backToPassword: 'ត្រឡប់ទៅលេខសម្ងាត់',
    email: 'អាសយដ្ឋានអ៊ីមែល',
    emailPlaceholder: 'បញ្ចូលអ៊ីមែលរបស់អ្នក',
    password: 'លេខសម្ងាត់',
    passwordPlaceholder: 'បញ្ចូលលេខសម្ងាត់របស់អ្នក',
    forgotPassword: 'ភ្លេចលេខសម្ងាត់?',
    signingIn: 'កំពុងចូល...',
    signIn: 'ចូល',
    missingFields: 'សូមបំពេញព័ត៌មានទាំងអស់',
    loginFailed: 'ការចូលបានបរាជ័យ',
    unexpectedError: 'មានបញ្ហាមិនបានរំពឹងទុក',
    codeError: 'បញ្ចូលលេខកូដ ៦ ខ្ទង់ពីកម្មវិធីផ្ទៀងផ្ទាត់របស់អ្នក',
    verificationFailed: 'ការផ្ទៀងផ្ទាត់បានបរាជ័យ',
    noAccount: 'មិនទាន់មានគណនី?',
    createAccount: 'បង្កើតគណនីនៅទីនេះ',
    qrAlt: 'កូដ QR សម្រាប់ដំឡើងការផ្ទៀងផ្ទាត់ពីរជាន់',
    showPassword: 'បង្ហាញពាក្យសម្ងាត់',
    hidePassword: 'លាក់ពាក្យសម្ងាត់',
  },
};

export function LoginForm({ onSuccess, onSwitchToRegister, locale = 'en' }: LoginFormProps) {
  const copy = loginCopy[locale];
  const { login, verifyTwoFactorLogin, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [twoFactorState, setTwoFactorState] = useState<{
    token: string;
    setupRequired: boolean;
    setup?: {
      secret: string;
      otpAuthUrl: string;
      qrCodeUrl: string;
    };
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError(copy.missingFields);
      return;
    }

    try {
      const response = await login(formData);

      if (response.requiresTwoFactor && response.twoFactorToken) {
        setTwoFactorState({
          token: response.twoFactorToken,
          setupRequired: Boolean(response.twoFactorSetupRequired),
          setup: response.twoFactorSetup,
        });
        setTwoFactorCode('');
        return;
      }

      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.message || copy.loginFailed);
      }
    } catch (error) {
      setError(copy.unexpectedError);
    }
  };

  const verifyTwoFactorCode = useCallback(async (code: string) => {
    setError('');

    if (!twoFactorState) return;

    if (!/^\d{6}$/.test(code.replace(/\s+/g, ''))) {
      setError(copy.codeError);
      return;
    }

    try {
      const response = await verifyTwoFactorLogin({
        twoFactorToken: twoFactorState.token,
        code,
      });

      if (response.success) {
        onSuccess?.();
      } else {
        setError(response.message || copy.verificationFailed);
      }
    } catch (error) {
      setError(copy.unexpectedError);
    }
  }, [copy.codeError, copy.unexpectedError, copy.verificationFailed, onSuccess, twoFactorState, verifyTwoFactorLogin]);

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyTwoFactorCode(twoFactorCode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleBackToPassword = () => {
    setTwoFactorState(null);
    setTwoFactorCode('');
    setError('');
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            {twoFactorState ? <ShieldCheck className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {twoFactorState ? copy.verifyTitle : copy.welcomeTitle}
          </h1>
          <p className="text-slate-600">
            {twoFactorState
              ? twoFactorState.setupRequired
                ? copy.setupDescription
                : copy.verifyDescription
              : copy.signInDescription}
          </p>
        </div>

        {twoFactorState ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
            {twoFactorState.setupRequired && twoFactorState.setup && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={twoFactorState.setup.qrCodeUrl}
                    alt={copy.qrAlt}
                    className="h-48 w-48 rounded-md border border-white bg-white p-2 shadow-sm"
                  />
                  <div className="w-full rounded-md bg-white p-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {copy.manualSetupKey}
                    </p>
                    <p className="mt-1 break-all font-mono text-sm text-slate-900">
                      {twoFactorState.setup.secret}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="twoFactorCode" className="block text-sm font-medium text-slate-700 mb-2">
                {copy.verificationCode}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="twoFactorCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(e) => {
                    const nextCode = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(nextCode);
                    if (error) setError('');
                    if (nextCode.length === 6 && !isLoading) {
                      void verifyTwoFactorCode(nextCode);
                    }
                  }}
                  className="w-full px-3 py-2 pl-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456"
                  required
                  disabled={isLoading}
                />
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 rounded-md p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.verifying}
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToPassword}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.backToPassword}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              {copy.email}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={copy.emailPlaceholder}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                {copy.password}
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {copy.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={copy.passwordPlaceholder}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-200 rounded-md p-3"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {copy.signingIn}
              </>
            ) : (
              <>
                <LogIn className="-ml-1 mr-2 h-4 w-4" />
                {copy.signIn}
              </>
            )}
          </button>
        </form>
        )}

        {/* Register Link */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {copy.noAccount}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                disabled={isLoading}
              >
                {copy.createAccount}
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
