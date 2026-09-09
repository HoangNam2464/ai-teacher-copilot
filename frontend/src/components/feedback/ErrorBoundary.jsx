import React from 'react';
import i18n from '@/lib/i18n';

/**
 * ErrorBoundary — React class component that catches render-time errors
 * in the component subtree and displays a fallback UI instead of crashing.
 *
 * Props:
 * @param {ReactNode}          children    - Child components to protect.
 * @param {ReactNode|function} fallback    - Custom fallback UI or render function
 *                                          receiving ({ error, reset }) as argument.
 *
 * Usage (simple):
 *   <ErrorBoundary>
 *     <MyFeatureComponent />
 *   </ErrorBoundary>
 *
 * Usage (custom fallback):
 *   <ErrorBoundary fallback={({ error, reset }) => (
 *     <div>
 *       <p>Lỗi: {error.message}</p>
 *       <button onClick={reset}>Thử lại</button>
 *     </div>
 *   )}>
 *     <MyFeatureComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in development; replace with monitoring service (Sentry, etc.) in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    if (fallback) {
      return typeof fallback === 'function'
        ? fallback({ error, reset: this.reset })
        : fallback;
    }

    // Default fallback UI
    return (
      <div className="error-boundary" role="alert">
        <span className="error-boundary__icon" aria-hidden="true">⚠️</span>
        <h3 className="error-boundary__title">{i18n.t('common.unexpectedError')}</h3>
        <p className="error-boundary__message">
          {error?.message || i18n.t('common.errorTryAgain')}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={this.reset}
        >
          {i18n.t('common.tryAgain')}
        </button>
      </div>
    );
  }
}
