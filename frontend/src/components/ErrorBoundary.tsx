import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorState } from "@/components/ui";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render-time failures so the shell never shows a blank screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ClubOps] Unhandled UI error", error, info.componentStack);
  }

  private handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <ErrorState
          className="max-w-lg"
          title="The interface stopped unexpectedly"
          description="An unexpected error occurred while rendering this view."
          detail={error.message}
          onRetry={this.handleReset}
          retryLabel="Reload view"
        />
      </div>
    );
  }
}
