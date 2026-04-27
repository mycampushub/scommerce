/**
 * React hook for CSRF token management
 * Provides CSRF tokens for API requests
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

interface CSRFState {
  token: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage CSRF tokens
 * @returns CSRF token state and refresh function
 */
export function useCSRF(): CSRFState {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCSRFToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/csrf');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch CSRF token');
      }

      const data = await response.json();
      setToken(data.token);

      // Store in localStorage for persistence across page loads
      if (typeof window !== 'undefined') {
        localStorage.setItem('csrf_token', data.token);
        localStorage.setItem('csrf_token_expires', String(Date.now() + (data.expiresIn * 1000)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
      console.error('CSRF token fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if we have a valid token in localStorage
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('csrf_token');
      const expiresAt = localStorage.getItem('csrf_token_expires');

      if (storedToken && expiresAt) {
        const now = Date.now();
        const expires = parseInt(expiresAt, 10);

        // Use stored token if it's still valid and has more than 5 minutes remaining
        if (expires > now + (5 * 60 * 1000)) {
          setToken(storedToken);
          setLoading(false);
          return;
        }
      }
    }

    // Fetch new token if no valid token exists
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  // Periodically refresh token (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCSRFToken();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [fetchCSRFToken]);

  return {
    token,
    loading,
    error,
    refresh: fetchCSRFToken,
  };
}

/**
 * Enhanced fetch function that includes CSRF token
 * Automatically adds CSRF token to state-changing requests
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from localStorage
  let csrfToken: string | null = null;

  if (typeof window !== 'undefined') {
    csrfToken = localStorage.getItem('csrf_token');
  }

  // For state-changing methods, ensure we have a CSRF token
  const method = options.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) {
      // Try to fetch a new token
      try {
        const tokenResponse = await fetch('/api/auth/csrf');
        if (tokenResponse.ok) {
          const data = await tokenResponse.json();
          csrfToken = data.token;
          if (typeof window !== 'undefined') {
            localStorage.setItem('csrf_token', csrfToken);
          }
        }
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
      }
    }

    // Add CSRF token to headers
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
        'X-XSRF-Token': csrfToken,
      };
    }
  }

  return fetch(url, options);
}

/**
 * Hook to get a fetch function with CSRF protection
 * @returns Fetch function with CSRF token automatically included
 */
export function useCSRFFetch() {
  const { token } = useCSRF();

  const csrfFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const method = options.method?.toUpperCase();

    // Add CSRF token to state-changing requests
    if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method) && token) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': token,
        'X-XSRF-Token': token,
      };
    }

    return fetch(url, options);
  }, [token]);

  return csrfFetch;
}
