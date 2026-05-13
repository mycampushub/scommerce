/**
 * Order Archive API Response Types
 */

/**
 * Response for archive operation
 * Contains count of orders archived in this operation
 */
export interface ArchiveResponse {
  archived: number;
}

/**
 * Response for cleanup operation
 * Contains count of orders permanently deleted in this operation
 */
export interface CleanupResponse {
  cleaned: number;
}

/**
 * Response for both archive and cleanup operations
 * Contains counts for both operations
 */
export interface BothResponse {
  archived: number;
  cleaned: number;
}

/**
 * Response for stats operation
 * Contains total count of archived orders in the system
 */
export interface StatsResponse {
  archivedCount: number;
}

/**
 * Union type for all possible archive API responses
 */
export type ArchiveApiResponse = ArchiveResponse | CleanupResponse | BothResponse | StatsResponse;

/**
 * Request body for POST /api/admin/orders/archive
 */
export interface ArchiveApiRequest {
  operation: 'archive' | 'cleanup' | 'both' | 'stats';
  olderThanDays?: number;
  archiveOlderThanDays?: number; // Used when operation is 'both'
  cleanupOlderThanDays?: number; // Used when operation is 'both'
}
