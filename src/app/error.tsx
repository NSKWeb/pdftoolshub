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
    logger.error("Global error boundary caught error", {
      error: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="dept-tag mx-auto">Press Error</div>
        <h1 className="font-display text-4xl font-black text-ink">Something went wrong</h1>
        <p className="text-inksoft">
          We apologize for the inconvenience. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-phantom">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="neo-btn neo-btn-accent rounded-sm">
            Try again
          </button>
          <a href="/" className="neo-btn rounded-sm !bg-cream !text-ink">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
