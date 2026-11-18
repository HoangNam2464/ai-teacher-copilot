import { Component } from 'react';
import i18n from '@/lib/i18n';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {i18n.t('common.unexpectedError')}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || i18n.t('common.errorTryAgain')}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                {i18n.t('common.reloadPage')}
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
