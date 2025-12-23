/**
 * Batch Sync Strategy
 * Collects multiple changes and syncs them in batches
 */

import type { DataContext } from "../../core/DataContext";
import type { SyncConfig, SyncResult, SyncedItem } from "../SyncTypes";
import type { SyncStrategy } from "./SyncStrategy";
import { ConflictResolver } from "../ConflictResolver";

/**
 * Batch sync strategy - collects changes and syncs in larger batches
 * Optimized for high-write scenarios
 */
export class BatchStrategy<T> implements SyncStrategy<T> {
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

      try {
        const result = await this.syncBatch(batch, config);

        success += result.success;
        failed += result.failed;
        conflicts += result.conflicts;

        // Mark successfully synced items
        batch.forEach((item, index) => {
          if (result.successfulIndices?.includes(index)) {
            item._needsSync = false;
            item._syncFailed = false;
            item._lastSynced = new Date().toISOString();
            item._syncAttempts = 0;
          } else {
            item._syncFailed = true;
            item._syncAttempts = (item._syncAttempts || 0) + 1;
          }
        });

        // Save progress after each batch
        await context.store(items);
      } catch (error) {
        // Entire batch failed
        batch.forEach((item) => {
          item._syncFailed = true;
          item._syncAttempts = (item._syncAttempts || 0) + 1;
        });
        failed += batch.length;

        await context.store(items);
      }
    }

    return { success, failed, conflicts, duration: 0 };
  }

  async getPendingCount(context: DataContext<T>): Promise<number> {
    const items = await context.retrieve();
    const syncedItems = items as SyncedItem<T>[];
    return syncedItems.filter((item) => item._needsSync === true).length;
  }

  private async syncBatch(
    batch: SyncedItem<T>[],
    config: SyncConfig<T>
  ): Promise<{
    success: number;
    failed: number;
    conflicts: number;
    successfulIndices?: number[];
  }> {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify({ items: batch }),
    });

    if (!response.ok) {
      throw new Error(`Batch sync failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Assume server returns:
    // {
    //   results: Array<{ index: number, success: boolean, data?: any, conflict?: boolean }>
    // }

    const successfulIndices: number[] = [];
    let conflicts = 0;

    if (result.results && Array.isArray(result.results)) {
      for (const itemResult of result.results) {
        if (itemResult.success) {
          successfulIndices.push(itemResult.index);

          // Handle conflicts
          if (itemResult.conflict && itemResult.data) {
            const item = batch[itemResult.index];
            const resolver = ConflictResolver.getResolver(
              config.conflictResolution
            );
            const resolved = await resolver(item, itemResult.data, {
              storageKey: "",
              itemId: (item as any).id || 0,
            });
            Object.assign(item, resolved);
            conflicts++;
          }
        }
      }
    }

    return {
      success: successfulIndices.length,
      failed: batch.length - successfulIndices.length,
      conflicts,
      successfulIndices,
    };
  }
}
