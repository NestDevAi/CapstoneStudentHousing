import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if ((this as any).state.hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let isPermissionError = false;

      if ((this as any).state.error?.message.startsWith('{')) {
        try {
          const errData = JSON.parse((this as any).state.error.message);
          errorMessage = `Permission Denied: ${errData.operationType} on ${errData.path}`;
          isPermissionError = true;
        } catch (e) {
          // Fallback to default message
        }
      } else if ((this as any).state.error?.message.includes('permission-denied')) {
        errorMessage = 'You do not have permission to perform this action.';
        isPermissionError = true;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              {isPermissionError ? 'Access Restricted' : 'Something went wrong'}
            </h2>
            
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {errorMessage}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Application
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (this as any).state.error && (
              <div className="mt-8 p-4 bg-slate-900 rounded-2xl text-left overflow-auto max-h-40">
                <pre className="text-[10px] text-emerald-400 font-mono">
                  {(this as any).state.error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
