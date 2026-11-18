import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import i18n from '@/lib/i18n';

/**
 * ErrorBoundary — React class component that catches render-time errors
 * in the component subtree and displays a fallback UI instead of crashing.
 * Deliverable for [FE-020 / ATC-110].
 *
 * Acceptance Criteria:
 * - Runtime error được Error Boundary xử lý
 * - Upload error hiển thị toast
 * - Thông báo lỗi dễ hiểu
 * - UI không bị crash toàn bộ khi component lỗi
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

    // Default fallback UI adhering to Design System
    return (
      <div
        className="p-8 my-6 text-center rounded-2xl bg-destructive/5 border border-destructive/20 max-w-lg mx-auto shadow-sm"
        role="alert"
      >
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">
          {i18n.t('common.unexpectedError', 'Đã xảy ra lỗi hiển thị')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
          {error?.message || i18n.t('common.errorTryAgain', 'Vui lòng thử lại hoặc tải lại trang.')}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            onClick={this.reset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {i18n.t('common.tryAgain', 'Thử lại')}
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => window.location.reload()}
          >
            {i18n.t('common.reloadPage', 'Tải lại trang')}
          </button>
        </div>
      </div>
    );
  }
}
