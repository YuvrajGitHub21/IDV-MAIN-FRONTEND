import { useEffect, useCallback } from 'react';
import { refreshAccessToken, getAccessToken, isAuthenticated, logout } from '@/lib/auth';

/**
 * Custom hook to handle automatic token refresh every 10 minutes
 * Also handles token refresh on 401 responses
 */
export const useTokenRefresh = () => {
  const refreshToken = useCallback(async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      console.log('🔄 Attempting automatic token refresh...');
      const newAuthData = await refreshAccessToken();
      
      if (newAuthData) {
        console.log('✅ Token refreshed successfully');
      } else {
        console.warn('❌ Token refresh failed - logging out user');
        await logout();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await logout();
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    // Only set up interval if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    console.log('🕒 Setting up automatic token refresh every 10 minutes');
    
    // Refresh token every 10 minutes (600,000 milliseconds)
    const intervalId = setInterval(refreshToken, 10 * 60 * 1000);

    // Cleanup interval on unmount
    return () => {
      console.log('🧹 Cleaning up token refresh interval');
      clearInterval(intervalId);
    };
  }, [refreshToken]);

  return { refreshToken };
};

/**
 * Enhanced fetch function that automatically handles 401 responses
 * by attempting token refresh and retrying the request
 */
export const fetchWithTokenRefresh = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();
  
  // Add authorization header if token exists
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Make initial request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401 && isAuthenticated()) {
    console.log('🔄 Got 401 response, attempting token refresh...');
    
    const newAuthData = await refreshAccessToken();
    
    if (newAuthData) {
      console.log('✅ Token refreshed, retrying request...');
      
      // Retry request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAuthData.accessToken}`,
        },
      });
    } else {
      console.warn('❌ Token refresh failed - redirecting to login');
      await logout();
      window.location.href = '/login';
    }
  }

  return response;
};
