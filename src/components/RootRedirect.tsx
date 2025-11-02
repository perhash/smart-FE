import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { TESTING_MODE } from '@/config/api';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin, isRider, loading } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);

  // Check if admin exists on first load
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await apiService.checkAdminExists();
        if (response.success) {
          setHasAdmin(response.data.hasAdmin);
        }
      } catch (error) {
        console.error('Error checking admin:', error);
        // Default to assuming admin exists to avoid breaking flow
        setHasAdmin(true);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    // In testing mode, skip admin check
    if (TESTING_MODE) {
      setCheckingAdmin(false);
      setHasAdmin(false); // Force onboarding flow
    } else if (!isAuthenticated && !loading) {
      checkAdmin();
    } else if (isAuthenticated || loading) {
      setCheckingAdmin(false);
    }
  }, [isAuthenticated, loading]);

  // Show loading spinner while checking authentication or admin
  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If authenticated, redirect based on role
  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else if (isRider) {
      return <Navigate to="/rider" replace />;
    }
  }

  // If no admin exists, redirect to onboarding
  if (!hasAdmin) {
    return <Navigate to="/onboarding" replace />;
  }

  // If admin exists but not authenticated, show login page
  return <Navigate to="/login" replace />;
};

export default RootRedirect;
