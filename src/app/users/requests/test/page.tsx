// src/app/users/requests/test/page.tsx
'use client';

import React, { useEffect } from 'react';

export default function TestUserRequestsPage() {
  useEffect(() => {
    console.log('Test UserRequestsPage component mounted - routing works!');
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-600 mb-4">✅ Routing Test Successful!</h1>
      <p className="text-lg mb-4">
        If you can see this page, it means the notification routing is working correctly.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Debug Information:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Route: <code>/users/requests/test</code></li>
          <li>Component: TestUserRequestsPage</li>
          <li>Status: Successfully mounted</li>
        </ul>
      </div>
      <div className="mt-6">
        <a 
          href="/users/requests" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Main Registration Requests Page
        </a>
      </div>
    </div>
  );
}
