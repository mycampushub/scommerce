'use client';

import { useState, useEffect } from 'react';
import {
  listenToServiceWorkerEvents,
  syncOfflineMutations as syncMutations,
  invalidateCache,
  type SWEventType,
  type SWEventData,
} from '@/lib/service-worker-cache';

/**
 * React hook to listen to service worker events
 * @returns Object containing event state and sync function
 *
 * @example
 * function MyComponent() {
 *   const { isOnline, syncMutations, eventLog } = useServiceWorkerEvents();
 *
 *   return (
 *     <div>
 *       <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
 *       <button onClick={syncMutations}>Sync Now</button>
 *       <pre>{eventLog.join('\n')}</pre>
 *     </div>
 *   );
 * }
 */
export function useServiceWorkerEvents() {
  const [isOnline, setIsOnline] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      cleanup = listenToServiceWorkerEvents((eventType, data) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${eventType}: ${JSON.stringify(data)}`;

        console.log('[SW Cache] Event:', eventType, data);
        setEventLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 events

        if (eventType === 'online') {
          setIsOnline(true);
        } else if (eventType === 'offline') {
          setIsOnline(false);
        }
      });
    }

    // Listen to browser online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    syncMutations,
    invalidateCache,
    eventLog,
  };
}

/**
 * React hook to check if service worker is ready
 * @returns Boolean indicating if service worker is ready
 *
 * @example
 * function MyComponent() {
 *   const isSWReady = useServiceWorkerReady();
 *
 *   return isSWReady ? <p>SW Active</p> : <p>SW Not Ready</p>;
 * }
 */
export function useServiceWorkerReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsReady(navigator.serviceWorker.controller !== null);

      const handler = () => {
        setIsReady(navigator.serviceWorker.controller !== null);
      };

      navigator.serviceWorker.addEventListener('controllerchange', handler);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handler);
      };
    }
  }, []);

  return isReady;
}
