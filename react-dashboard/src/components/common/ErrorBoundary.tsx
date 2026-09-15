import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center glass-panel rounded-3xl border border-rose-500/30 shadow-2xl bg-slate-950/80 my-4">
          <div className="p-3 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/30 mb-4">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">
            {this.props.fallbackTitle || 'Component Encountered a Telemetry Error'}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'Unexpected application render exception.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/50 apple-transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Operational View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
