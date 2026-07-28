import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React render error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-romantic-cream flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-rose-100 shadow-xl rounded-3xl p-8 text-center">
            <h1 className="font-serif text-3xl font-bold text-romantic-gray mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-romantic-gray/70 mb-6">
              The app hit a runtime error while rendering this page.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-left bg-rose-50 border border-rose-100 rounded-2xl p-4 text-romantic-gray mb-6">
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-3 rounded-2xl bg-romantic-rose text-white text-sm font-semibold"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
