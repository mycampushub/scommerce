'use client'

import { useCallback } from 'react'

interface CSRFState {
  token: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCSRF(): CSRFState {
  return { token: null, loading: false, error: null, refresh: async () => {} }
}

export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, options)
}

export function useCSRFFetch() {
  const csrfFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    return fetch(url, options)
  }, [])

  return csrfFetch
}
