'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ error: error.message, digest: error.digest }, 'Global error boundary caught error');
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Something went wrong</h1>
          <p className="text-slate-400 mt-2">
            We apologize for the inconvenience. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-500 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-accent text-slate-900 rounded-md font-medium hover:opacity-90 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-slate-600 text-slate-300 rounded-md font-medium hover:bg-slate-800 transition"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
