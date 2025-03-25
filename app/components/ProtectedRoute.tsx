'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { SignIn } from "@clerk/nextjs";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser();

  // Handle loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // If authenticated, store user details and render children
  if (isSignedIn && user) {
    // Store Clerk details in localStorage
    localStorage.setItem('clerk-user-id', user.id);
    localStorage.setItem('clerk-user-email', user.primaryEmailAddress?.emailAddress || '');
    localStorage.setItem('clerk-user-name', user.firstName || '');
    localStorage.setItem('clerk-auth-status', 'authenticated');
    
    return <>{children}</>;
  }

  // If not authenticated, show SignIn component
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <SignIn />
      </div>
    </div>
  );
} 