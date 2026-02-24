"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Pulse News
            </h1>
            <p className="text-slate-600">
              Admin Dashboard
            </p>
          </motion.div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              Request Account
            </h2>
            <p className="text-blue-700 text-sm">
              Apply to join the Pulse News admin team as an author, editor, or admin
            </p>
          </motion.div>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <RegisterForm />
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            © 2024 Pulse News. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
