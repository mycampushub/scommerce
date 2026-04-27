/**
 * Intelligent Prefetching
 * Predict and prefetch resources user is likely to need
 */

'use client';

import React from 'react';
import { fetchWithCache } from './client-cache';
import { ClientCacheOptions } from './client-cache';

export interface PrefetchConfig {
  /** Priority: high, medium, low */
  priority?: 'high' | 'medium' | 'low';
  /** Delay before prefetching (ms) */
  delay?: number;
  /** Prefetch only when idle */
  whenIdle?: boolean;
  /** Use client cache */
  cache?: ClientCacheOptions;
}

type PrefetchTask = {
  key: string;
  fetchFn: () => Promise<unknown>;
  config: PrefetchConfig;
};

class PrefetchManager {
  private static instance: PrefetchManager;
  private queue: Map<string, PrefetchTask> = new Map();
  private pending: Set<string> = new Set();
  private observer: IntersectionObserver | null = null;
  private idleCallback: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              const prefetchKey = target.dataset.prefetch;

              if (prefetchKey && this.queue.has(prefetchKey)) {
                this.execute(prefetchKey);
              }
            }
          });
        },
        { threshold: 0.1, rootMargin: '100px' }
      );
    }
  }

  static getInstance(): PrefetchManager {
    if (!this.instance) {
      this.instance = new PrefetchManager();
    }
    return this.instance;
  }

  /**
   * Add resource to prefetch queue
   */
  add(key: string, fetchFn: () => Promise<unknown>, config: PrefetchConfig = {}): void {
    this.queue.set(key, { key, fetchFn, config });

    // Execute immediately if high priority
    if (config.priority === 'high') {
      this.schedule(key, 0);
    }
  }

  /**
   * Schedule prefetch with delay
   */
  private schedule(key: string, delay: number): void {
    const task = this.queue.get(key);
    if (!task) return;

    if (task.config.whenIdle && 'requestIdleCallback' in window) {
      // Prefetch when browser is idle
      window.requestIdleCallback(() => this.execute(key), {
        timeout: 2000,
      });
    } else {
      // Prefetch after delay
      setTimeout(() => this.execute(key), delay);
    }
  }

  /**
   * Execute prefetch
   */
  private async execute(key: string): Promise<void> {
    if (this.pending.has(key)) return;

    const task = this.queue.get(key);
    if (!task) return;

    this.pending.add(key);

    try {
      await fetchWithCache(key, task.fetchFn, task.config.cache);
    } catch (error) {
      console.error(`Prefetch error for ${key}:`, error);
    } finally {
      this.pending.delete(key);
    }
  }

  /**
   * Enable intersection-based prefetching
   */
  observeElement(element: HTMLElement, key: string): void {
    if (this.observer) {
      element.dataset.prefetch = key;
      this.observer.observe(element);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.idleCallback && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleCallback);
    }
    this.queue.clear();
    this.pending.clear();
  }
}

/**
 * React hook for prefetching
 */
export function usePrefetch() {
  const manager = PrefetchManager.getInstance();

  const prefetch = useCallback((
    key: string,
    fetchFn: () => Promise<unknown>,
    config: PrefetchConfig = {}
  ) => {
    manager.add(key, fetchFn, config);
  }, [manager]);

  const prefetchOnHover = useCallback((
    key: string,
    fetchFn: () => Promise<unknown>,
    config: PrefetchConfig = {}
  ) => {
    // Prefetch on hover with slight delay
    manager.add(key, fetchFn, {
      ...config,
      delay: config.delay || 300,
      priority: 'medium',
    });
  }, [manager]);

  const prefetchOnMount = useCallback((
    key: string,
    fetchFn: () => Promise<unknown>,
    config: PrefetchConfig = {}
  ) => {
    // Prefetch immediately on mount
    manager.add(key, fetchFn, {
      ...config,
      delay: 0,
      priority: 'high',
    });
  }, [manager]);

  const prefetchOnIdle = useCallback((
    key: string,
    fetchFn: () => Promise<unknown>,
    config: PrefetchConfig = {}
  ) => {
    // Prefetch when browser is idle
    manager.add(key, fetchFn, {
      ...config,
      whenIdle: true,
      priority: 'low',
    });
  }, [manager]);

  return {
    prefetch,
    prefetchOnHover,
    prefetchOnMount,
    prefetchOnIdle,
  };
}

/**
 * Link prefetching component
 */
export function PrefetchLink({
  href,
  prefetchKey,
  fetchFn,
  children,
  config = {},
  ...props
}: React.HTMLAttributes<HTMLAnchorElement> & {
  prefetchKey: string;
  fetchFn: () => Promise<unknown>;
  config?: PrefetchConfig;
}) {
  const { prefetchOnHover } = usePrefetch();
  const linkRef = React.useRef<HTMLAnchorElement>(null);

  const handleMouseEnter = () => {
    prefetchOnHover(prefetchKey, fetchFn, config);
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Image prefetching
 */
export function prefetchImage(src: string): void {
  if (typeof window === 'undefined') return;

  const img = new Image();
  img.src = src;
}

/**
 * Prefetch multiple images
 */
export function prefetchImages(srcs: string[]): void {
  srcs.forEach(src => prefetchImage(src));
}

/**
 * Predictive prefetching based on user behavior
 */
export class PredictivePrefetcher {
  private userHistory: Set<string> = new Set();
  private pageTransitions: Map<string, string[]> = new Map();

  /**
   * Track user navigation
   */
  trackNavigation(from: string, to: string): void {
    if (!this.pageTransitions.has(from)) {
      this.pageTransitions.set(from, []);
    }

    const transitions = this.pageTransitions.get(from)!;
    transitions.push(to);

    // Keep only last 100 transitions
    if (transitions.length > 100) {
      transitions.shift();
    }

    this.userHistory.add(to);
  }

  /**
   * Get predicted next pages
   */
  predictNext(currentPage: string): string[] {
    const transitions = this.pageTransitions.get(currentPage);
    if (!transitions || transitions.length === 0) {
      return [];
    }

    // Count occurrences
    const counts = new Map<string, number>();
    transitions.forEach(page => {
      counts.set(page, (counts.get(page) || 0) + 1);
    });

    // Sort by frequency and return top 3
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([page]) => page);
  }

  /**
   * Prefetch predicted resources
   */
  prefetchPredicted(currentPage: string, prefetchFn: (page: string) => void): void {
    const predicted = this.predictNext(currentPage);
    predicted.forEach(page => prefetchFn(page));
  }
}

/**
 * Route-based prefetching
 */
export function prefetchRouteData(route: string): void {
  // Common route patterns and their data needs
  const routeDataMap: Record<string, string[]> = {
    '/products': ['/api/products', '/api/categories'],
    '/products/[id]': ['/api/products/[id]', '/api/products/[id]/reviews'],
    '/categories': ['/api/categories'],
    '/checkout': ['/api/cart', '/api/user/address'],
    '/account': ['/api/user/profile', '/api/orders'],
  };

  // Match route pattern
  const matchedRoute = Object.keys(routeDataMap).find(pattern => {
    if (pattern.includes('[id]')) {
      return route.startsWith(pattern.replace('[id]', ''));
    }
    return route === pattern;
  });

  if (matchedRoute) {
    const endpoints = routeDataMap[matchedRoute];
    endpoints.forEach(endpoint => {
      // Prefetch endpoint data
      fetchWithCache(`route:${route}:${endpoint}`, async () => {
        // Actual fetch would go here
        return fetch(endpoint).then(res => res.json());
      }, { ttl: 300000 });
    });
  }
}
