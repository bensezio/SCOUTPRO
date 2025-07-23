import { useAuth } from '@/contexts/auth-context';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login',
  allowedRoles
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  // Check authentication on every render (important for back button security)
  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      console.log('🔍 PROTECTED ROUTE DEBUG: Redirecting to login - not authenticated');
      // Clear browser history and force redirect to login
      window.history.replaceState(null, '', redirectTo);
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate]);

  // Additional check: verify token exists in localStorage
  useEffect(() => {
    if (requireAuth && !localStorage.getItem('token')) {
      window.history.replaceState(null, '', redirectTo);
      navigate(redirectTo);
    }
  }, [requireAuth, redirectTo, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Double check: If authentication is required and user is not authenticated, don't render children
  if (requireAuth && (!isAuthenticated || !localStorage.getItem('token'))) {
    return null;
  }

  // Role-based access control
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Restricted</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You don't have permission to access this page. This feature is restricted to specific user roles.
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Component for routes that should only be accessible to unauthenticated users
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, don't render children (they'll be redirected)
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}