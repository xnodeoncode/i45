/**
 * Queued Sync Strategy
 * Queues changes and syncs periodically
 */

import type { DataContext } from "../../core/DataContext";
import type { SyncConfig, SyncResult, SyncedItem } from "../SyncTypes";
import type { SyncStrategy } from "./SyncStrategy";
import { ConflictResolver } from "../ConflictResolver";

/**
 * Queued sync strategy - queues changes and syncs on demand or periodically
 */
export class QueuedStrategy<T> implements SyncStrategy<T> {
  async execute(
    context: DataContext<T>,
    config: SyncConfig<T>
  ): Promise<SyncResult> {
    const items = await context.retrieve();
    const syncedItems = items as SyncedItem<T>[];

    // Find items that need syncing
    const unsyncedItems = syncedItems.filter(
      (item) => item._needsSync === true || item._syncFailed === true
    );

    if (unsyncedItems.length === 0) {
      return { success: 0, failed: 0, conflicts: 0, duration: 0 };
    }

    let success = 0;
    let failed = 0;
    let conflicts = 0;

    const batchSize = config.batchSize || 50;

    // Process in batches
    for (let i = 0; i < unsyncedItems.length; i += batchSize) {
      const batch = unsyncedItems.slice(i, i + batchSize);

      for (const item of batch) {
        // Check retry limit - skip if already exhausted
        const maxRetries = config.maxRetries || 3;
        if (item._syncAttempts && item._syncAttempts >= maxRetries) {
          // Already exhausted retries - count as failed this time
          failed++;
          continue;
        }

        try {
          const result = await this.syncItem(item, config);

          if (result.conflict) {
            conflicts++;
          }

          // Mark as synced
          item._needsSync = false;
          item._syncFailed = false;
          item._lastSynced = new Date().toISOString();
          item._syncAttempts = 0;
          success++;
        } catch (error) {
          item._syncFailed = true;
          item._syncAttempts = (item._syncAttempts || 0) + 1;
          failed++;

          // If we should retry, wait before continuing to next item
          if (item._syncAttempts < maxRetries) {
            await this.delay(config.retryDelay || 1000);
          }
        }
      }

      // Save progress after each batch
      await context.store(items);
    }

    return { success, failed, conflicts, duration: 0 };
  }

  async getPendingCount(context: DataContext<T>): Promise<number> {
    const items = await context.retrieve();
    const syncedItems = items as SyncedItem<T>[];
    return syncedItems.filter((item) => item._needsSync === true).length;
  }

  private async syncItem(
    item: SyncedItem<T>,
    config: SyncConfig<T>
  ): Promise<{ conflict: boolean }> {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const serverData = await response.json();

    // Check for conflicts
    if (this.hasConflict(item, serverData)) {
      const resolver = ConflictResolver.getResolver(config.conflictResolution);
      const resolved = await resolver(item, serverData, {
        storageKey: "",
        itemId: (item as any).id || 0,
      });

      Object.assign(item, resolved);
      return { conflict: true };
    }

    return { conflict: false };
  }

  private hasConflict(local: any, remote: any): boolean {
    return !!(
      remote.version &&
      local.version &&
      remote.version !== local.version
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
