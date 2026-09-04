import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LayoutDashboard, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTab?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      localStorage.setItem('aravanta_active_tab', 'dashboard');
      window.location.reload();
    }
  };

  private handleClearCache = () => {
    const token = localStorage.getItem('aravanta_token');
    const user = localStorage.getItem('aravanta_user');
    localStorage.clear();
    if (token) localStorage.setItem('aravanta_token', token);
    if (user) localStorage.setItem('aravanta_user', user);
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] h-full w-full flex items-center justify-center p-6 font-mono text-xs">
          <div className="max-w-lg w-full bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                  Operations Console Render Issue
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  The control plane captured an unexpected rendering exception.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] overflow-x-auto max-h-32">
                <code className="text-rose-400 font-bold">{this.state.error.toString()}</code>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
              <button
                onClick={this.handleClearCache}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Local State
              </button>

              <button
                onClick={this.handleReset}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Return to Dashboard
              </button>

              <button
                onClick={this.handleReload}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
