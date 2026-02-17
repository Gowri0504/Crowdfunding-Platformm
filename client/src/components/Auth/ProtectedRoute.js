import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  useEffect(() => {
    console.log('ProtectedRoute - Auth State:', { isAuthenticated, loading, user });
    
    // Debug localStorage token
    const token = localStorage.getItem('token');
    console.log('Token in localStorage:', token ? 'Present' : 'Missing');
  }, [isAuthenticated, loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Check if token exists in localStorage as a fallback
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Not authenticated, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    // If token exists but isAuthenticated is false, we're probably still loading user data
    console.log('Token exists but not authenticated yet, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Verifying authentication..." />
      </div>
    );
  }

  console.log('Authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;