/**
 * Request Batching and Deduplication
 * Combines multiple similar requests into single API calls to reduce server load
 */

export interface BatchRequest<T> {
  id: string;
  resourceType: string;
  params: Record<string, unknown>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

export interface BatchConfig {
  /** Maximum batch size */
  maxSize?: number;
  /** Maximum time to wait before flushing (ms) */
  maxWaitTime?: number;
  /** Function to execute batch */
  executeBatch: <T>(requests: BatchRequest<T>[]) => Promise<void>;
}

export class RequestBatcher {
  private static instances: Map<string, RequestBatcher> = new Map();
  private queue: Map<string, BatchRequest<unknown>[]> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig;

  private constructor(
    private batchKey: string,
    config: BatchConfig
  ) {
    this.config = {
      maxSize: 10,
      maxWaitTime: 100, // 100ms default
      ...config,
    };
  }

  /**
   * Get or create a batcher instance
   */
  static getInstance(batchKey: string, config: BatchConfig): RequestBatcher {
    if (!this.instances.has(batchKey)) {
      this.instances.set(batchKey, new RequestBatcher(batchKey, config));
    }
    return this.instances.get(batchKey)!;
  }

  /**
   * Add a request to the batch
   */
  async addRequest<T>(
    resourceType: string,
    params: Record<string, unknown>,
    cacheKey: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest<T> = {
        id: cacheKey,
        resourceType,
        params,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      // Add to queue
      if (!this.queue.has(resourceType)) {
        this.queue.set(resourceType, []);
      }
      this.queue.get(resourceType)!.push(request);

      // Check if we should flush immediately
      const currentQueue = this.queue.get(resourceType)!;
      if (currentQueue.length >= this.config.maxSize!) {
        this.flush(resourceType);
      } else {
        // Set timeout to flush
        const existingTimeout = this.timeouts.get(resourceType);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
          this.flush(resourceType);
        }, this.config.maxWaitTime!);

        this.timeouts.set(resourceType, timeout);
      }
    });
  }

  /**
   * Flush pending requests for a resource type
   */
  private async flush(resourceType: string): Promise<void> {
    const queue = this.queue.get(resourceType);
    if (!queue || queue.length === 0) return;

    // Clear timeout
    const timeout = this.timeouts.get(resourceType);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(resourceType);
    }

    // Remove from queue
    this.queue.delete(resourceType);

    try {
      await this.config.executeBatch(queue);
    } catch (error) {
      // Reject all requests in batch
      queue.forEach(req => req.reject(error));
    }
  }

  /**
   * Flush all pending requests
   */
  flushAll(): void {
    Array.from(this.queue.keys()).forEach(resourceType => {
      this.flush(resourceType);
    });
  }
}

/**
 * Simple request deduplication
 * Prevents duplicate in-flight requests to same endpoint
 */
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pending: Map<string, Promise<unknown>> = new Map();

  private constructor() {}

  static getInstance(): RequestDeduplicator {
    if (!this.instance) {
      this.instance = new RequestDeduplicator();
    }
    return this.instance;
  }

  /**
   * Execute a request or return pending promise if exists
   */
  async deduplicate<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetchFn().finally(() => {
      // Remove from pending after completion
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pending.clear();
  }
}

/**
 * Optimized fetch with deduplication and retry
 */
export interface OptimizedFetchOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Enable request deduplication */
  deduplicate?: boolean;
  /** Custom cache key */
  cacheKey?: string;
}

export async function optimizedFetch<T>(
  url: string,
  options: RequestInit = {},
  optimizedOptions: OptimizedFetchOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    retryDelay = 500,
    deduplicate = true,
    cacheKey = url,
  } = optimizedOptions;

  const fetchFn = async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          // Add cache control header
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on network errors after last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError;
  };

  // Use deduplication if enabled
  if (deduplicate) {
    const deduplicator = RequestDeduplicator.getInstance();
    return deduplicator.deduplicate(cacheKey, fetchFn);
  }

  return fetchFn();
}

/**
 * Batch multiple API calls into single request
 * Useful for fetching multiple resources at once
 */
export interface BatchRequestItem {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  params?: Record<string, unknown>;
  body?: unknown;
}

export interface BatchResponse {
  success: boolean;
  data: unknown[];
  errors: Array<{ index: number; error: string }>;
}

export async function batchRequests(
  items: BatchRequestItem[],
  batchEndpoint: string = '/api/batch'
): Promise<BatchResponse> {
  try {
    const response = await fetch(batchEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: items }),
    });

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Batch request error:', error);
    throw error;
  }
}
