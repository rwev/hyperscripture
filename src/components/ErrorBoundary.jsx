import { Component } from 'react';

/**
 * Error boundary that catches rendering errors and displays a fallback UI.
 * Prevents the entire app from white-screening on unexpected runtime errors.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">{this.state.error.message}</p>
          <button
            className="error-boundary-retry"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
