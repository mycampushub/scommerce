'use client';

import { createContext, useContext, ReactNode } from 'react';
import { clientCache } from '@/lib/client-cache';

interface CacheContextType {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export function CacheProvider({ children }: { children: ReactNode }) {
  const get = <T,>(key: string): Promise<T | null> => {
    return clientCache.get<T>(key);
  };

  const set = <T,>(key: string, value: T, ttl?: number): Promise<void> => {
    return clientCache.set(key, value, { ttl });
  };

  const remove = (key: string): Promise<void> => {
    return clientCache.delete(key);
  };

  const clear = (): Promise<void> => {
    return clientCache.clear();
  };

  return (
    <CacheContext.Provider value={{ get, set, remove, clear }}>
      {children}
    </CacheContext.Provider>
  );
}

export function useCache() {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}
