/**
 * Background Sync Manager
 * Handles syncing offline mutations when back online
 * Works with IndexedDB offline mutations storage
 */

import { useState, useEffect } from 'react';
import { indexedDB, OfflineMutation } from '@/lib/indexeddb';
import { toast } from 'sonner';

export interface SyncResult {
  success: boolean;
  mutationId: string;
  error?: string;
}

export interface SyncStats {
  total: number;
  successful: number;
  failed: number;
}

class BackgroundSyncManager {
  private isSyncing: boolean = false;
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;

  /**
   * Initialize background sync
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Listen for online events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Also check immediately on load
    if (navigator.onLine) {
      setTimeout(() => this.sync(), 1000);
    }

    console.log('Background sync initialized');
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    console.log('Connection restored. Starting sync...');
    toast.info('Connection restored. Syncing your changes...');

    await this.sync();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Connection lost. You are now offline.');
    toast.error('Connection lost. Your changes will be saved and synced later.');
  }

  /**
   * Sync all pending mutations
   */
  async sync(): Promise<SyncStats> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { total: 0, successful: 0, failed: 0 };
    }

    this.isSyncing = true;

    try {
      const mutations = await indexedDB.getOfflineMutations();
      const pending = mutations.filter((m) => m.status === 'pending');

      if (pending.length === 0) {
        console.log('No pending mutations to sync');
        this.isSyncing = false;
        return { total: 0, successful: 0, failed: 0 };
      }

      console.log(`Syncing ${pending.length} pending mutations...`);

      let successful = 0;
      let failed = 0;

      for (const mutation of pending) {
        const result = await this.syncMutation(mutation);

        if (result.success) {
          successful++;
          await indexedDB.deleteMutation(mutation.id);
          this.retryAttempts.delete(mutation.id);
        } else {
          failed++;
          const attempts = (this.retryAttempts.get(mutation.id) || 0) + 1;
          this.retryAttempts.set(mutation.id, attempts);

          if (attempts >= this.maxRetries) {
            // Give up after max retries
            await indexedDB.updateMutationStatus(mutation.id, 'failed');
            this.retryAttempts.delete(mutation.id);
            console.error(`Mutation ${mutation.id} failed after ${attempts} attempts`);
          } else {
            // Keep as pending for next sync
            console.warn(`Mutation ${mutation.id} failed, will retry (attempt ${attempts}/${this.maxRetries})`);
          }
        }
      }

      const stats: SyncStats = {
        total: pending.length,
        successful,
        failed,
      };

      // Notify user about sync results
      if (stats.total > 0) {
        if (stats.successful > 0 && stats.failed === 0) {
          toast.success(`Successfully synced ${stats.successful} changes`);
        } else if (stats.successful > 0) {
          toast.info(
            `Synced ${stats.successful} changes${stats.failed > 0 ? `, ${stats.failed} failed` : ''}`
          );
        } else if (stats.failed > 0) {
          toast.error(`Failed to sync ${stats.failed} changes. Please try again.`);
        }
      }

      console.log('Sync complete:', stats);
      this.isSyncing = false;

      return stats;
    } catch (error) {
      console.error('Error during sync:', error);
      this.isSyncing = false;

      toast.error('An error occurred while syncing');

      return { total: 0, successful: 0, failed: 0 };
    }
  }

  /**
   * Sync a single mutation
   */
  private async syncMutation(mutation: OfflineMutation): Promise<SyncResult> {
    try {
      await indexedDB.updateMutationStatus(mutation.id, 'syncing');

      let response: Response;

      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header from session cookie or localStorage
      const getAuthHeaders = () => {
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('session='))
          ?.split('=')[1];

        if (sessionCookie) {
          return {
            'Authorization': `Bearer ${sessionCookie}`,
          };
        }
        return {};
      };

      Object.assign(headers, getAuthHeaders());

      switch (mutation.method) {
        case 'POST':
          response = await fetch(mutation.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(mutation.body),
            credentials: 'include',
          });
          break;

        case 'PUT':
          response = await fetch(mutation.url, {
            method: 'PUT',
            headers,
            body: JSON.stringify(mutation.body),
            credentials: 'include',
          });
          break;

        case 'DELETE':
          response = await fetch(`${mutation.url}${mutation.body ? '/' + mutation.body.id : ''}`, {
            method: 'DELETE',
            headers,
            credentials: 'include',
          });
          break;

        default:
          throw new Error(`Unknown method: ${mutation.method}`);
      }

      if (response.ok) {
        return {
          success: true,
          mutationId: mutation.id,
        };
      } else {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          mutationId: mutation.id,
          error: errorData?.error || `HTTP ${response.status}`,
        };
      }
    } catch (error: any) {
      console.error(`Failed to sync mutation ${mutation.id}:`, error);
      return {
        success: false,
        mutationId: mutation.id,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Check sync status
   */
  async getSyncStatus(): Promise<{ pending: number; failed: number }> {
    const mutations = await indexedDB.getOfflineMutations();
    const pending = mutations.filter((m) => m.status === 'pending').length;
    const failed = mutations.filter((m) => m.status === 'failed').length;

    return { pending, failed };
  }

  /**
   * Clear failed mutations
   */
  async clearFailedMutations(): Promise<void> {
    const mutations = await indexedDB.getOfflineMutations();
    const failed = mutations.filter((m) => m.status === 'failed');

    for (const mutation of failed) {
      await indexedDB.deleteMutation(mutation.id);
    }

    console.log(`Cleared ${failed.length} failed mutations`);
    toast.info(`Cleared ${failed.length} failed sync attempts`);
  }

  /**
   * Retry failed mutations
   */
  async retryFailedMutations(): Promise<void> {
    const mutations = await indexedDB.getOfflineMutations();
    const failed = mutations.filter((m) => m.status === 'failed');

    for (const mutation of failed) {
      await indexedDB.updateMutationStatus(mutation.id, 'pending');
      this.retryAttempts.delete(mutation.id);
    }

    if (failed.length > 0) {
      console.log(`Retrying ${failed.length} failed mutations`);
      toast.info(`Retrying ${failed.length} failed sync attempts...`);
      await this.sync();
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(): Promise<OfflineMutation[]> {
    return await indexedDB.getOfflineMutations();
  }
}

// Export singleton instance
export const backgroundSync = new BackgroundSyncManager();

/**
 * React hook for background sync
 */
export function useBackgroundSync() {
  const [syncStatus, setSyncStatus] = useState<{
    pending: number;
    failed: number;
    isSyncing: boolean;
  }>({
    pending: 0,
    failed: 0,
    isSyncing: false,
  });

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize background sync
    backgroundSync.init();

    // Initial status check
    const checkStatus = async () => {
      const status = await backgroundSync.getSyncStatus();
      setSyncStatus({
        ...status,
        isSyncing: false,
      });
    };

    checkStatus();

    // Set up interval to check sync status
    const interval = setInterval(checkStatus, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    const stats = await backgroundSync.sync();
    setSyncStatus({
      pending: await (await backgroundSync.getSyncStatus()).pending,
      failed: await (await backgroundSync.getSyncStatus()).failed,
      isSyncing: false,
    });
    setLastSyncTime(new Date());
    return stats;
  };

  const clearFailed = async () => {
    await backgroundSync.clearFailedMutations();
    const status = await backgroundSync.getSyncStatus();
    setSyncStatus({
      ...status,
      isSyncing: false,
    });
  };

  const retryFailed = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    await backgroundSync.retryFailedMutations();
    const status = await backgroundSync.getSyncStatus();
    setSyncStatus({
      ...status,
      isSyncing: false,
    });
  };

  return {
    syncStatus,
    lastSyncTime,
    triggerSync,
    clearFailed,
    retryFailed,
    isSyncing: syncStatus.isSyncing,
    hasPendingSyncs: syncStatus.pending > 0,
    hasFailedSyncs: syncStatus.failed > 0,
  };
}
