/**
 * Sync Types
 * Type definitions for the sync layer
 */

/**
 * Sync strategy type
 */
export type SyncStrategyType = "immediate" | "queued" | "batch";

/**
 * Conflict resolution strategy type
 */
export type ConflictResolutionType =
  | "last-write-wins"
  | "first-write-wins"
  | "server-wins";

/**
 * Context information for conflict resolution
 */
export interface ConflictContext {
  storageKey: string;
  itemId: string | number;
  localVersion?: number;
  remoteVersion?: number;
}

/**
 * Metadata for individual items (not to be confused with StorageMetadata which wraps arrays)
 */
export interface ItemMetadata {
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

/**
 * Callback for custom conflict resolution
 */
export type ConflictResolverCallback<T> = (
  local: T & { metadata?: ItemMetadata },
  remote: T & { metadata?: ItemMetadata },
  context: ConflictContext
) =>
  | (T & { metadata?: ItemMetadata })
  | Promise<T & { metadata?: ItemMetadata }>;

/**
 * Sync result returned after sync operation
 */
export interface SyncResult {
  success: number;
  failed: number;
  conflicts: number;
  duration: number;
}

/**
 * Sync error details
 */
export interface SyncError {
  itemId: string | number;
  attempts: number;
  lastAttempt: string;
  error: string;
}

/**
 * Sync status tracking
 */
export interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSync: string | null;
  isSyncing: boolean;
  errors: SyncError[];
}

/**
 * Sync configuration options
 */
export interface SyncConfig<T = any> {
  endpoint: string;
  strategy: SyncStrategyType;
  conflictResolution: ConflictResolutionType | ConflictResolverCallback<T>;
  syncInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  onSyncStart?: () => void;
  onSyncComplete?: (results: SyncResult) => void;
  onSyncError?: (error: Error) => void;
  batchSize?: number;
}

/**
 * Internal metadata fields added to synced items
 */
export interface SyncMetadata {
  _needsSync?: boolean;
  _syncFailed?: boolean;
  _syncAttempts?: number;
  _lastSynced?: string;
}

/**
 * Type helper for items with sync metadata
 */
export type SyncedItem<T> = T & SyncMetadata;
