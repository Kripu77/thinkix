'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@thinkix/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class CollaborationErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Collaboration error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-600 mb-2">
            Collaboration connection error
          </p>
          <p className="text-xs text-red-500 mb-3">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ConnectionIndicatorProps {
  isConnected: boolean;
  isReconnecting: boolean;
  onRetry?: () => void;
}

export function ConnectionIndicator({ isConnected, isReconnecting, onRetry }: ConnectionIndicatorProps) {
  if (isConnected) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-50 border border-yellow-200">
      {isReconnecting ? (
        <>
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-xs text-yellow-700">Reconnecting...</span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-xs text-red-700">Disconnected</span>
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry} className="h-5 px-2 text-xs">
              Retry
            </Button>
          )}
        </>
      )}
    </div>
  );
}
