// Centralized error handling utilities
import React from 'react';
import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  status?: number;
  errors?: string[];
  code?: string;
}

export class ErrorHandler {
  // Handle API errors with user-friendly messages
  static handleApiError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      return error.response.data.errors.join(', ');
    }
    
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You do not have permission to perform this action.';
        case 404:
          return 'Resource not found.';
        case 409:
          return 'Conflict. The resource already exists.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Show error toast with consistent styling
  static showError(message: string, duration = 4000): void {
    toast.error(message, {
      duration,
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: '500',
        border: '1px solid #dc2626',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  }

  // Show success toast
  static showSuccess(message: string, duration = 3000): void {
    toast.success(message, {
      duration,
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: '500',
        border: '1px solid #059669',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  }

  // Show warning toast
  static showWarning(message: string, duration = 4000): void {
    toast(message, {
      duration,
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        fontWeight: '500',
      },
    });
  }

  // Show info toast
  static showInfo(message: string, duration = 3000): void {
    toast(message, {
      duration,
      icon: 'ℹ️',
      style: {
        background: '#ffffff',
        color: '#2B2B2B',
        border: '1px solid #D9D9D9',
        fontWeight: '500',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '12px 16px',
      },
    });
  }

  // Handle form validation errors
  static handleValidationErrors(errors: string[]): void {
    if (errors.length === 1) {
      this.showError(errors[0]);
    } else {
      this.showError(`Please fix the following errors: ${errors.join(', ')}`);
    }
  }

  // Handle network errors
  static handleNetworkError(): void {
    this.showError('Network error. Please check your connection and try again.');
  }

  // Handle timeout errors
  static handleTimeoutError(): void {
    this.showError('Request timed out. Please try again.');
  }

  // Log error for debugging (in development)
  static logError(error: any, context?: string): void {
    if (import.meta.env.DEV) {
      console.error(`[${context || 'Error'}]`, error);
    }
  }
}

// Error boundary component moved to separate file: components/ErrorBoundary.tsx

// Hook for handling async operations with error handling
export const useAsyncError = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const execute = async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      showErrorToast?: boolean;
      onError?: (error: string) => void;
      onSuccess?: (result: T) => void;
    }
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleApiError(err);
      setError(errorMessage);
      
      if (options?.showErrorToast !== false) {
        ErrorHandler.showError(errorMessage);
      }
      
      options?.onError?.(errorMessage);
      ErrorHandler.logError(err, 'useAsyncError');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { error, loading, execute };
};
