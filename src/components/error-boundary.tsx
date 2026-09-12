'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("React error boundary caught error", {
      error: error.message,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center" role="alert" aria-live="assertive">
          <h2 className="font-display text-xl font-bold text-vermilion mb-2">
            Something went wrong
          </h2>
          <p className="text-inksoft mb-4">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="neo-btn neo-btn-accent rounded-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
