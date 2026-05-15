"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { VERIFY_EMAIL_MUTATION } from "@/services/registrationSubmission.gql";

type VerifyEmailResult = {
  verifyEmail?: {
    success: boolean;
    message?: string;
    token?: string;
    user?: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "EDITOR" | "AUTHOR";
      isActive: boolean;
    };
    registrationRequest?: {
      id: string;
      email: string;
      name: string;
      status: string;
    };
  };
};

const TOKEN_KEY = "pulse_news_admin_token";

function getDashboardPath(role?: string): string {
  switch (role) {
    case "ADMIN":
    case "EDITOR":
    case "AUTHOR":
      return "/";
    default:
      return "/";
  }
}

export function EmailVerificationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifyEmail, { loading: isLoading }] = useMutation<VerifyEmailResult>(
    VERIFY_EMAIL_MUTATION,
  );

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "invalid"
  >("loading");
  const [message, setMessage] = useState("");
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleVerification = useCallback(
    async (token: string, email: string) => {
      try {
        const result = await verifyEmail({
          variables: {
            input: {
              token,
              email,
            },
          },
        });

        if (result.data?.verifyEmail?.success) {
          setStatus("success");
          setMessage(
            result.data.verifyEmail.message || "Email verified successfully!",
          );

          if (result.data.verifyEmail.registrationRequest) {
            setUserInfo({
              name: result.data.verifyEmail.registrationRequest.name,
              email: result.data.verifyEmail.registrationRequest.email,
            });
          }

          const verifiedUser = result.data.verifyEmail.user;
          const authToken = result.data.verifyEmail.token;

          if (authToken) {
            localStorage.setItem(TOKEN_KEY, authToken);
          }

          // Redirect into the verified user's own authenticated dashboard session.
          setTimeout(() => {
            window.location.assign(getDashboardPath(verifiedUser?.role));
          }, 3000);
        } else {
          setStatus("error");
          setMessage(
            result.data?.verifyEmail?.message ||
              "Email verification failed. Please try again.",
          );
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(
          "An error occurred during verification. Please try again or contact support.",
        );
      }
    },
    [verifyEmail],
  );

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      queueMicrotask(() => {
        setStatus("invalid");
        setMessage(
          "Invalid verification link. Please check your email for the correct link.",
        );
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleVerification(token, email);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [handleVerification, searchParams]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verifying your email...
            </h3>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </motion.div>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Email Verified Successfully!
            </h3>
            {userInfo && (
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Welcome, <strong>{userInfo.name}</strong>!
                </p>
                <p className="text-sm text-green-700">
                  Your account ({userInfo.email}) has been created and is now
                  active.
                </p>
              </div>
            )}
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                You will be redirected to your account in a few seconds...
              </p>
            </div>
            <button
              onClick={() => window.location.assign("/")}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to My Account
            </button>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">This could happen if:</p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>The verification link has expired</li>
                <li>The link has already been used</li>
                <li>The link is invalid or corrupted</li>
              </ul>
            </div>
            <button
              onClick={() => router.push("/register")}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Back to Registration
            </button>
          </motion.div>
        );

      case "invalid":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Invalid Verification Link
            </h3>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                Please check your email for the correct verification link, or
                request a new one.
              </p>
            </div>
            <button
              onClick={() => router.push("/register")}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Registration
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {renderContent()}
    </div>
  );
}
