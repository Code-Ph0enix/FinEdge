/**
 * FinEdge Protected Route Component
 * 
 * Wraps protected routes with authentication check and onboarding redirect logic.
 * Redirects unauthenticated users to sign-in and users who haven't completed 
 * onboarding to the onboarding flow.
 * 
 * @version 2.0.0 - Added onboarding check
 */


// File: frontend/src/pages/Onboarding.tsx

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkOnboardingStatus } from '../utils/onboardingApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Skip onboarding check if already on onboarding page
  const isOnboardingPage = location.pathname === '/onboarding';

  useEffect(() => {
    const checkOnboarding = async () => {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // Redirect to sign-in if not authenticated
      if (!isSignedIn) {
        navigate('/sign-in');
        return;
      }

      // Skip onboarding check if on onboarding page
      if (isOnboardingPage) {
        setIsCheckingOnboarding(false);
        setOnboardingCompleted(true);
        return;
      }

      // Check onboarding status from backend
      try {
        if (user?.id) {
          const status = await checkOnboardingStatus(user.id);
          
          if (!status.onboardingCompleted) {
            // User hasn't completed onboarding - redirect
            navigate('/onboarding');
            setOnboardingCompleted(false);
          } else {
            // User has completed onboarding - allow access
            setOnboardingCompleted(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow access (graceful degradation)
        // You can change this to redirect to onboarding if preferred
        setOnboardingCompleted(true);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, user, navigate, isOnboardingPage]);

  // Show loading state
  if (!isLoaded || isCheckingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if redirecting
  if (!isSignedIn || (!onboardingCompleted && !isOnboardingPage)) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
