import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import LoadingSpinner from './LoadingSpinner';

const AuthRedirect: React.FC = () => {
  const { user, isAuthenticated, needsPasswordChange, isInitialized } = useAuth();

  // Show loading while auth state is being determined
  if (!isInitialized) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user needs to change password, redirect to change password page
  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  // Redirect based on user role (only for root path)
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'agent') {
    return <Navigate to="/user" replace />;
  }

  // Fallback to login if role is not recognized
  return <Navigate to="/login" replace />;
};

export default AuthRedirect;
