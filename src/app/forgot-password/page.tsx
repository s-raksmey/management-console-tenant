"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { UserService } from "@/services/user.gql";
import { useAdminLocale } from "@/hooks/useAdminLocale";

const forgotPasswordCopy = {
  en: {
    console: "Tenant Console",
    pageDescription: "Reset your password",
    title: "Forgot Password",
    description: "Enter your account email and we will send a password reset link if the account exists.",
    emailAddress: "Email Address",
    emailPlaceholder: "Enter your email",
    emailRequired: "Enter your email address",
    processFailed: "Unable to process password reset",
    processFailedRetry: "Unable to process password reset. Please try again.",
    successMessage: "If the account exists, a reset link has been sent.",
    sending: "Sending reset link...",
    send: "Send Reset Link",
    backToLogin: "Back to login",
  },
  km: {
    console: "ផ្ទាំងគ្រប់គ្រង",
    pageDescription: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ",
    title: "ភ្លេចពាក្យសម្ងាត់",
    description: "បញ្ចូលអ៊ីមែលគណនីរបស់អ្នក ហើយយើងនឹងផ្ញើតំណកំណត់ពាក្យសម្ងាត់ឡើងវិញ ប្រសិនបើគណនីមាន។",
    emailAddress: "អាសយដ្ឋានអ៊ីមែល",
    emailPlaceholder: "បញ្ចូលអ៊ីមែលរបស់អ្នក",
    emailRequired: "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល",
    processFailed: "មិនអាចដំណើរការកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ",
    processFailedRetry: "មិនអាចដំណើរការកំណត់ពាក្យសម្ងាត់ឡើងវិញបានទេ។ សូមព្យាយាមម្ដងទៀត។",
    successMessage: "ប្រសិនបើគណនីមាន តំណកំណត់ឡើងវិញត្រូវបានផ្ញើរួចហើយ។",
    sending: "កំពុងផ្ញើតំណកំណត់ឡើងវិញ...",
    send: "ផ្ញើតំណកំណត់ឡើងវិញ",
    backToLogin: "ត្រឡប់ទៅចូលប្រើ",
  },
} as const;

export default function ForgotPasswordPage() {
  const { locale } = useAdminLocale();
  const copy = forgotPasswordCopy[locale];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError(copy.emailRequired);
      return;
    }

    try {
      setLoading(true);
      const result = await UserService.requestPasswordReset({ email: email.trim() });

      if (result.success) {
        setSuccessMessage(locale === "en" ? result.message : copy.successMessage);
      } else {
        setError(locale === "en" ? result.message || copy.processFailed : copy.processFailed);
      }
    } catch {
      setError(copy.processFailedRetry);
    } finally {
      setLoading(false);
    }
  };

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg border border-slate-200 p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{copy.title}</h2>
            <p className="text-slate-600">
              {copy.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {copy.emailAddress}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={copy.emailPlaceholder}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {copy.sending}
                </>
              ) : (
                copy.send
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {copy.backToLogin}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
