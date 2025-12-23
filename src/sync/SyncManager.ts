/**
 * Sync Manager
 * Coordinates synchronization between local storage and remote server
 */

import type { DataContext } from "../core/DataContext";
import type {
  SyncConfig,
  SyncResult,
  SyncStatus,
  SyncError,
} from "./SyncTypes";
import type { SyncStrategy } from "./strategies/SyncStrategy";
import { ImmediateStrategy } from "./strategies/ImmediateStrategy";
import { QueuedStrategy } from "./strategies/QueuedStrategy";
import { BatchStrategy } from "./strategies/BatchStrategy";

/**
 * Manages synchronization between local storage and remote server
 */
export class SyncManager<T> {
  private context: DataContext<T>;
  private config: SyncConfig<T>;
  private strategy: SyncStrategy<T>;
  private status: SyncStatus;
  private syncTimer?: NodeJS.Timeout | number;
  private isEnabled: boolean = false;

  constructor(context: DataContext<T>, config: SyncConfig<T>) {
    this.context = context;
    this.config = this.validateConfig(config);
    this.strategy = this.createStrategy(config.strategy);
    this.status = this.initializeStatus();
  }

  /**
   * Enable sync - starts listening for network changes and begins periodic sync if configured
   */
  async enable(): Promise<void> {
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;

    // Set up network listeners (browser only)
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
    }

    // Start periodic sync for batch strategy
    if (this.config.strategy === "batch" && this.config.syncInterval) {
      this.syncTimer = setInterval(
        () => this.sync(),
        this.config.syncInterval
      ) as any;
    }

    // Initial sync if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await this.sync();
    }
  }

  /**
   * Disable sync - stops all sync operations
   */
  disable(): void {
    this.isEnabled = false;

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer as any);
      this.syncTimer = undefined;
    }
  }

  /**
   * Manually trigger a sync operation
   */
  async sync(): Promise<SyncResult> {
    if (!this.isEnabled || this.status.isSyncing) {
      return {
        success: 0,
        failed: 0,
        conflicts: 0,
        duration: 0,
      };
    }

    this.status.isSyncing = true;
    this.config.onSyncStart?.();

    const startTime = Date.now();

    try {
      const result = await this.strategy.execute(this.context, this.config);

      this.status.synced += result.success;
      this.status.failed += result.failed;
      this.status.lastSync = new Date().toISOString();
      this.status.pending = await this.strategy.getPendingCount(this.context);

      result.duration = Date.now() - startTime;

      this.config.onSyncComplete?.(result);

      return result;
    } catch (error) {
      const err = error as Error;
      this.config.onSyncError?.(err);

      // Add to error log
      this.addError({
        itemId: "unknown",
        attempts: 1,
        lastAttempt: new Date().toISOString(),
        error: err.message,
      });

      throw error;
    } finally {
      this.status.isSyncing = false;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Check if sync is currently enabled
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Handle online event
   */
  private handleOnline = async (): Promise<void> => {
    if (this.isEnabled && this.config.strategy !== "batch") {
      await this.sync();
    }
  };

  /**
   * Validate and set defaults for sync configuration
   */
  private validateConfig(config: SyncConfig<T>): SyncConfig<T> {
    if (!config.endpoint) {
      throw new Error("Sync endpoint is required");
    }

    if (!config.strategy) {
      throw new Error("Sync strategy is required");
    }

    // Set defaults
    return {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 50,
      ...config,
    };
  }

  /**
   * Create the appropriate sync strategy
   */
  private createStrategy(strategy: string): SyncStrategy<T> {
    switch (strategy) {
      case "immediate":
        return new ImmediateStrategy<T>();
      case "queued":
        return new QueuedStrategy<T>();
      case "batch":
        return new BatchStrategy<T>();
      default:
        throw new Error(`Unknown sync strategy: ${strategy}`);
    }
  }

  /**
   * Initialize sync status
   */
  private initializeStatus(): SyncStatus {
    return {
      pending: 0,
      synced: 0,
      failed: 0,
      lastSync: null,
      isSyncing: false,
      errors: [],
    };
  }

  /**
   * Add an error to the error log (keep last 10)
   */
  private addError(error: SyncError): void {
    this.status.errors.unshift(error);
    if (this.status.errors.length > 10) {
      this.status.errors = this.status.errors.slice(0, 10);
    }
  }
}
