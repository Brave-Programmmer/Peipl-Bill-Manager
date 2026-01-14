import React, { useState, useEffect } from 'react';

/**
 * Error Boundary component for graceful error handling
 * Catches errors and displays user-friendly error message
 */
export function TableErrorBoundary({ children, onError }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleError = (event) => {
      console.error('Table error:', event.error);
      setError(event.error);
      setHasError(true);
      
      if (onError) {
        onError(event.error);
      }
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled rejection:', event.reason);
      setError(event.reason);
      setHasError(true);
      
      if (onError) {
        onError(event.reason);
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);
  
  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-red-600 text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Something went wrong</h3>
            <p className="text-sm text-red-700 mb-3">
              An error occurred while processing the table. Please try refreshing the page or contact support if the problem persists.
            </p>
            {error && process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                <summary className="cursor-pointer font-mono">Error details</summary>
                <pre className="mt-2 overflow-auto">{error.toString()}</pre>
              </details>
            )}
            <button
              onClick={() => {
                setHasError(false);
                setError(null);
                window.location.reload();
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
}

/**
 * Recovery Modal component for restoring unsaved data
 */
export function DataRecoveryModal({
  isVisible,
  onRecover,
  onDiscard,
  savedTime = null
}) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">💾</div>
          <h3 className="font-bold text-lg">Recover Unsaved Data?</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          We found unsaved data from your previous session. Would you like to recover it?
        </p>
        
        {savedTime && (
          <p className="text-xs text-gray-500 mb-4">
            Last saved: {new Date(savedTime).toLocaleString()}
          </p>
        )}
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Discard
          </button>
          <button
            onClick={onRecover}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Recover Data
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading indicator component
 */
export function LoadingIndicator({ isVisible, message = "Processing..." }) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
