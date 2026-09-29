"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { UserService } from "@/services/user.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const resetPasswordCopy = {
  en: {
    invalidLink: "Invalid reset link. Please request a new password reset email.",
    passwordMinLength: "Password must be at least 8 characters long",
    passwordsMismatch: "Passwords do not match",
    resetSuccess: "Password reset successfully",
    resetFailed: "Unable to reset password",
    resetFailedNewLink: "Unable to reset password. Please request a new reset link.",
    setNewPassword: "Set New Password",
    description: "Choose a new password for your account.",
    missingToken: "This reset link is missing a token. Please request a new password reset email.",
    passwordUpdated: "Password Updated",
    backToLoginTitle: "Back to Login",
    newPassword: "New Password",
    newPasswordPlaceholder: "Enter new password",
    confirmNewPassword: "Confirm New Password",
    confirmPlaceholder: "Confirm new password",
    resetting: "Resetting password...",
    resetPassword: "Reset Password",
    backToLogin: "Back to login",
    console: "Tenant Console",
    pageDescription: "Password recovery",
    loading: "Loading...",
    showPassword: "Show password",
    hidePassword: "Hide password",
    showConfirmPassword: "Show confirm password",
    hideConfirmPassword: "Hide confirm password",
  },
  km: {
    invalidLink: "តំណកំណត់ឡើងវិញមិនត្រឹមត្រូវ។ សូមស្នើអ៊ីមែលកំណត់ពាក្យសម្ងាត់ឡើងវិញថ្មី។",
    passwordMinLength: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ",
    passwordsMismatch: "ពាក្យសម្ងាត់មិនដូចគ្នាទេ",
    resetSuccess: "បានកំណត់ពាក្យសម្ងាត់ឡើងវិញដោយជោគជ័យ",
    resetFailed: "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ",
    resetFailedNewLink: "មិនអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។ សូមស្នើតំណកំណត់ឡើងវិញថ្មី។",
    setNewPassword: "កំណត់ពាក្យសម្ងាត់ថ្មី",
    description: "ជ្រើសពាក្យសម្ងាត់ថ្មីសម្រាប់គណនីរបស់អ្នក។",
    missingToken: "តំណកំណត់ឡើងវិញនេះខ្វះលេខសម្គាល់សុវត្ថិភាព។ សូមស្នើអ៊ីមែលកំណត់ពាក្យសម្ងាត់ឡើងវិញថ្មី។",
    passwordUpdated: "បានកែប្រែពាក្យសម្ងាត់",
    backToLoginTitle: "ត្រឡប់ទៅចូលប្រើ",
    newPassword: "ពាក្យសម្ងាត់ថ្មី",
    newPasswordPlaceholder: "បញ្ចូលពាក្យសម្ងាត់ថ្មី",
    confirmNewPassword: "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
    confirmPlaceholder: "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
    resetting: "កំពុងកំណត់ពាក្យសម្ងាត់ឡើងវិញ...",
    resetPassword: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ",
    backToLogin: "ត្រឡប់ទៅចូលប្រើ",
    console: "ផ្ទាំងគ្រប់គ្រង",
    pageDescription: "សង្គ្រោះពាក្យសម្ងាត់",
    loading: "កំពុងផ្ទុក...",
    showPassword: "បង្ហាញពាក្យសម្ងាត់",
    hidePassword: "លាក់ពាក្យសម្ងាត់",
    showConfirmPassword: "បង្ហាញការបញ្ជាក់ពាក្យសម្ងាត់",
    hideConfirmPassword: "លាក់ការបញ្ជាក់ពាក្យសម្ងាត់",
  },
} as const;

function ResetPasswordContent() {
  const { locale } = useAdminLocale();
  const copy = resetPasswordCopy[locale];
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError(copy.invalidLink);
      return;
    }

    if (password.length < 8) {
      setError(copy.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(copy.passwordsMismatch);
      return;
    }

    try {
      setLoading(true);
      const result = await UserService.resetPassword({ token, newPassword: password });

      if (result.success) {
        setSuccessMessage(locale === "en" ? result.message || copy.resetSuccess : copy.resetSuccess);
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(locale === "en" ? result.message || copy.resetFailed : copy.resetFailed);
      }
    } catch {
      setError(copy.resetFailedNewLink);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-slate-200 p-8"
    >
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{copy.setNewPassword}</h2>
        <p className="text-slate-600">{copy.description}</p>
      </div>

      {!token && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">
            {copy.missingToken}
          </p>
        </div>
      )}

      {successMessage ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <h3 className="text-lg font-semibold text-green-700 mb-2">{copy.passwordUpdated}</h3>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
          <Link
            href="/login"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {copy.backToLoginTitle}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              {copy.newPassword}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                }}
                minLength={8}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={copy.newPasswordPlaceholder}
                required
                disabled={loading || !token}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                disabled={loading || !token}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
              {copy.confirmNewPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (error) setError("");
                }}
                minLength={8}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={copy.confirmPlaceholder}
                required
                disabled={loading || !token}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? copy.hideConfirmPassword : copy.showConfirmPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                disabled={loading || !token}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                {copy.resetting}
              </>
            ) : (
              copy.resetPassword
            )}
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.backToLogin}
            </Link>
          </div>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  const { locale } = useAdminLocale();
  const copy = resetPasswordCopy[locale];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{copy.console}</h1>
            <p className="text-slate-600">{copy.pageDescription}</p>
          </motion.div>
        </div>

        <Suspense fallback={<div className="bg-white rounded-lg border border-slate-200 p-8">{copy.loading}</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
