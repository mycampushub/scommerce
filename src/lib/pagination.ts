/**
 * Pagination and Infinite Scroll Utilities
 * Helps reduce API calls by loading data in chunks
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextPage?: number;
    prevPage?: number;
    nextCursor?: string;
  };
}

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationOptions {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const cursor = searchParams.get('cursor') || undefined;

  // Validate and clamp values
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page
  const validOffset = Math.max(0, offset);

  return {
    page: validPage,
    limit: validLimit,
    offset: validOffset,
    cursor,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginatedResponse<unknown>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
    nextPage: hasMore ? page + 1 : undefined,
    prevPage: page > 1 ? page - 1 : undefined,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  nextCursor?: string
): PaginatedResponse<T> {
  const pagination = calculatePagination(total, page, limit);

  return {
    data,
    pagination: {
      ...pagination,
      nextCursor,
    },
  };
}

/**
 * Create cursor-based paginated response
 */
export function createCursorPaginatedResponse<T>(
  data: T[],
  nextCursor?: string,
  limit?: number
): CursorPaginatedResponse<T> {
  return {
    data,
    nextCursor,
    hasMore: !!nextCursor && (data.length >= (limit || 20)),
  };
}

/**
 * Build SQL query with pagination
 */
export function buildPaginatedQuery(
  baseQuery: string,
  options: PaginationOptions
): { sql: string; offset: number; limit: number } {
  const { page = 1, limit = 20, offset = 0 } = options;

  // Calculate offset from page if not provided
  const calculatedOffset = offset > 0 ? offset : (page - 1) * limit;

  // Add LIMIT and OFFSET
  const sql = `${baseQuery} LIMIT ? OFFSET ?`;

  return {
    sql,
    offset: calculatedOffset,
    limit,
  };
}

/**
 * React hook for pagination
 */

export function usePagination<T>(
  fetchFn: (options: PaginationOptions) => Promise<PaginatedResponse<T>>,
  initialLimit: number = 20
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || String(initialLimit), 10);

  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination']>({
    page,
    limit,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  const fetchPage = useCallback(async (pageNum: number, pageLimit?: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchFn({
        page: pageNum,
        limit: pageLimit || limit,
      });

      setData(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, limit]);

  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      router.push(`?page=${pagination.page + 1}&limit=${limit}`);
    }
  }, [router, pagination.page, pagination.hasMore, limit]);

  const prevPage = useCallback(() => {
    if (pagination.prevPage) {
      router.push(`?page=${pagination.prevPage}&limit=${limit}`);
    }
  }, [router, pagination.prevPage, limit]);

  const goToPage = useCallback((pageNum: number) => {
    router.push(`?page=${pageNum}&limit=${limit}`);
  }, [router, limit]);

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return {
    data,
    loading,
    error,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchPage(page),
  };
}

/**
 * React hook for infinite scroll
 */
export function useInfiniteScroll<T>(
  fetchFn: (options: CursorPaginationOptions) => Promise<CursorPaginatedResponse<T>>,
  initialLimit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetchFn({
        cursor: nextCursor,
        limit: initialLimit,
      });

      setData(prev => [...prev, ...response.data]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, loading, hasMore, nextCursor, initialLimit]);

  const reset = useCallback(() => {
    setData([]);
    setNextCursor(undefined);
    setHasMore(true);
    setError(null);
  }, []);

  const refetch = useCallback(async () => {
    reset();
    await fetchMore();
  }, [reset, fetchMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    reset,
    refetch,
  };
}

/**
 * Intersection Observer hook for infinite scroll
 */
export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  onIntersect: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [targetRef, onIntersect, enabled]);
}

/**
 * Virtual scrolling utility for large lists
 */
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}
