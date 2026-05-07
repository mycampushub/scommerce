/**
 * Cache Metrics Manager
 * Monitor and track cache effectiveness across different cache layers
 */

export interface CacheMetrics {
  layer: 'service-worker' | 'indexeddb' | 'react-query' | 'http';
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  avgResponseTime: number;
  lastUpdated: number;
}

export interface CacheEntry {
  key: string;
  layer: 'service-worker' | 'indexeddb' | 'react-query' | 'http';
  hit: boolean;
  responseTime: number;
  timestamp: number;
  size?: number;
}

class CacheMetricsManager {
  private metrics: Map<string, CacheMetrics> = new Map();
  private entries: CacheEntry[] = [];
  private maxEntries: number = 1000;

  /**
   * Initialize cache metrics
   */
  init(): void {
    this.loadFromStorage();
    this.setupAutoSave();

    // Clear old entries periodically
    setInterval(() => this.cleanupOldEntries(), 60000); // Every minute

    console.log('Cache metrics initialized');
  }

  /**
   * Record cache access
   */
  recordAccess(entry: Omit<CacheEntry, 'timestamp'>): void {
    const cacheEntry: CacheEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // Add to entries
    this.entries.push(cacheEntry);

    // Keep only last N entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Update metrics for this layer
    this.updateMetrics(entry.layer, entry.hit, entry.responseTime);

    // Save to storage
    this.saveToStorage();
  }

  /**
   * Update metrics for a cache layer
   */
  private updateMetrics(
    layer: 'service-worker' | 'indexeddb' | 'react-query' | 'http',
    hit: boolean,
    responseTime: number
  ): void {
    let metrics = this.metrics.get(layer);

    if (!metrics) {
      metrics = {
        layer,
        hits: 0,
        misses: 0,
        totalRequests: 0,
        hitRate: 0,
        avgResponseTime: 0,
        lastUpdated: Date.now(),
      };
      this.metrics.set(layer, metrics);
    }

    metrics.totalRequests++;
    metrics.avgResponseTime =
      (metrics.avgResponseTime * (metrics.totalRequests - 1) + responseTime) /
      metrics.totalRequests;

    if (hit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }

    metrics.hitRate = metrics.hits / metrics.totalRequests;
    metrics.lastUpdated = Date.now();

    this.metrics.set(layer, metrics);
  }

  /**
   * Get metrics for a layer
   */
  getMetrics(layer: string): CacheMetrics | undefined {
    return this.metrics.get(layer);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): CacheMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get overall cache stats
   */
  getOverallStats(): {
    totalHits: number;
    totalMisses: number;
    totalRequests: number;
    overallHitRate: number;
    avgResponseTime: number;
    mostEffectiveLayer: string;
  } {
    const allMetrics = this.getAllMetrics();
    const totalHits = allMetrics.reduce((sum, m) => sum + m.hits, 0);
    const totalMisses = allMetrics.reduce((sum, m) => sum + m.misses, 0);
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);

    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    const avgResponseTime =
      allMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length;

    const mostEffectiveLayer =
      allMetrics.length > 0
        ? allMetrics.reduce((best, current) =>
            current.hitRate > best.hitRate ? current : best
          ).layer
        : 'none';

    return {
      totalHits,
      totalMisses,
      totalRequests,
      overallHitRate,
      avgResponseTime,
      mostEffectiveLayer,
    };
  }

  /**
   * Get recent entries
   */
  getRecentEntries(limit: number = 100): CacheEntry[] {
    return this.entries.slice(-limit);
  }

  /**
   * Get entries by layer
   */
  getEntriesByLayer(layer: string, limit: number = 100): CacheEntry[] {
    return this.entries
      .filter((e) => e.layer === layer)
      .slice(-limit);
  }

  /**
   * Reset metrics for a layer
   */
  resetMetrics(layer: string): void {
    this.metrics.delete(layer);
    this.saveToStorage();
    console.log(`Reset metrics for ${layer}`);
  }

  /**
   * Reset all metrics
   */
  resetAll(): void {
    this.metrics.clear();
    this.entries = [];
    this.saveToStorage();
    console.log('Reset all cache metrics');
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        metrics: Array.from(this.metrics.entries()),
        entries: this.entries.slice(-100), // Save last 100 entries
      };
      localStorage.setItem('cache-metrics', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache metrics:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('cache-metrics');
      if (data) {
        const parsed = JSON.parse(data);
        this.metrics = new Map(parsed.metrics || []);
        this.entries = parsed.entries || [];
      }
    } catch (error) {
      console.error('Failed to load cache metrics:', error);
    }
  }

  /**
   * Setup auto-save
   */
  private setupAutoSave(): void {
    window.addEventListener('beforeunload', () => {
      this.saveToStorage();
    });
  }

  /**
   * Cleanup old entries
   */
  private cleanupOldEntries(): void {
    const oneHourAgo = Date.now() - 3600000;
    const beforeCount = this.entries.length;

    this.entries = this.entries.filter((e) => e.timestamp > oneHourAgo);

    const afterCount = this.entries.length;
    if (beforeCount > afterCount) {
      console.log(`Cleaned up ${beforeCount - afterCount} old cache entries`);
    }
  }

  /**
   * Get cache health report
   */
  getHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getOverallStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rate
    if (stats.overallHitRate < 0.5) {
      issues.push('Low cache hit rate (< 50%)');
      recommendations.push('Consider increasing cache TTL');
    } else if (stats.overallHitRate < 0.7) {
      issues.push('Moderate cache hit rate (< 70%)');
      recommendations.push('Review cache expiration times');
    }

    // Check response time
    if (stats.avgResponseTime > 500) {
      issues.push('High average cache response time (> 500ms)');
      recommendations.push('Optimize cache key structure');
    }

    // Check cache size
    const totalSize = this.entries.reduce((sum, e) => sum + (e.size || 0), 0);
    if (totalSize > 50 * 1024 * 1024) {
      // > 50MB
      issues.push('Large cache size (> 50MB)');
      recommendations.push('Consider cache size limits');
    }

    // Determine status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length >= 3) {
      status = 'critical';
    } else if (issues.length >= 1) {
      status = 'warning';
    }

    return { status, issues, recommendations };
  }
}

// Export singleton instance
export const cacheMetrics = new CacheMetricsManager();

/**
 * Convenience functions for recording cache events
 */
export function recordCacheHit(layer: 'service-worker' | 'indexeddb' | 'react-query' | 'http', key: string, responseTime: number): void {
  cacheMetrics.recordAccess({
    key,
    layer,
    hit: true,
    responseTime,
  });
}

export function recordCacheMiss(layer: 'service-worker' | 'indexeddb' | 'react-query' | 'http', key: string, responseTime: number): void {
  cacheMetrics.recordAccess({
    key,
    layer,
    hit: false,
    responseTime,
  });
}

export function getCacheMetrics(): CacheMetrics[] {
  return cacheMetrics.getAllMetrics();
}

export function getCacheStats(): ReturnType<typeof cacheMetrics.getOverallStats> {
  return cacheMetrics.getOverallStats();
}

export function resetCacheMetrics(): void {
  cacheMetrics.resetAll();
}
