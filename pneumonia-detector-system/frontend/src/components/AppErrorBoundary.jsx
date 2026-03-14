import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'An unexpected UI error occurred.',
    };
  }

  componentDidCatch(error) {
    // Keep a console trail for quick debugging in devtools.
    console.error('AppErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card p-6 max-w-xl w-full border border-red-500/30">
            <h1 className="text-xl font-bold text-red-300 mb-2">Something went wrong</h1>
            <p className="text-sm text-[--color-text-secondary] mb-4">
              The page crashed while rendering. Please refresh once. If it repeats, open browser console and share the latest error.
            </p>
            <pre className="text-xs text-red-200 bg-black/20 rounded-lg p-3 overflow-auto">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-4"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
