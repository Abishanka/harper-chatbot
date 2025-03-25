'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export function UserSignOutHandler() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    // Track previous sign in state
    const prevSignedIn = localStorage.getItem('isUserSignedIn') === 'true';
    
    // If user was signed in before and isn't now, clear local storage
    if (prevSignedIn && !isSignedIn) {
      localStorage.removeItem('clerk-db');
      localStorage.removeItem('isUserSignedIn');
      sessionStorage.clear();
      console.log('User signed out, cleared session data');
    }
    
    // Update current sign in state
    if (isSignedIn) {
      localStorage.setItem('isUserSignedIn', 'true');
    }
  }, [isSignedIn]);

  return null; // This component doesn't render anything
} 