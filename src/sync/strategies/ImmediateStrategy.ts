/**
 * Immediate Sync Strategy
 * Syncs every change immediately to the server
 */

import type { DataContext } from "../../core/DataContext";
import type { SyncConfig, SyncResult, SyncedItem } from "../SyncTypes";
import type { SyncStrategy } from "./SyncStrategy";
import { ConflictResolver } from "../ConflictResolver";

/**
 * Immediate sync strategy - syncs changes as they happen
 */
export class ImmediateStrategy<T> implements SyncStrategy<T> {
  async execute(
    context: DataContext<T>,
    config: SyncConfig<T>
  ): Promise<SyncResult> {
    const items = await context.retrieve();
    const syncedItems = items as SyncedItem<T>[];

    // Find items that need syncing
    const unsyncedItems = syncedItems.filter(
      (item) => item._needsSync === true
    );

    if (unsyncedItems.length === 0) {
      return { success: 0, failed: 0, conflicts: 0, duration: 0 };
    }

    let success = 0;
    let failed = 0;
    let conflicts = 0;

    // Sync each item immediately (no retries - that's what "immediate" means)
    for (let i = 0; i < unsyncedItems.length; i++) {
      const item = unsyncedItems[i];
      console.log(
        `[ImmediateStrategy] Syncing item ${i}:`,
        JSON.stringify(item, null, 2)
      );
      try {
        const result = await this.syncItem(item, config);
        console.log(`[ImmediateStrategy] syncItem result:`, {
          conflict: result.conflict,
          hasResolvedItem: !!result.resolvedItem,
        });

        if (result.conflict) {
          conflicts++;
        }

        // Update item with server data (whether conflict or not)
        if (result.resolvedItem) {
          console.log(
            `[ImmediateStrategy] Applying resolvedItem:`,
            JSON.stringify(result.resolvedItem, null, 2)
          );
          // Copy all properties from resolved item
          for (const key in result.resolvedItem) {
            (item as any)[key] = (result.resolvedItem as any)[key];
          }
          console.log(
            `[ImmediateStrategy] Item after applying resolved:`,
            JSON.stringify(item, null, 2)
          );
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
      }
    }

    // Save updated items
    console.log(
      `[ImmediateStrategy] About to store items:`,
      JSON.stringify(items, null, 2)
    );
    await context.store(items);

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
  ): Promise<{ conflict: boolean; resolvedItem?: SyncedItem<T> }> {
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
    console.log(
      `[ImmediateStrategy.syncItem] serverData:`,
      JSON.stringify(serverData, null, 2)
    );

    // Check for conflicts (if server returns different version)
    if (this.hasConflict(item, serverData)) {
      console.log(`[ImmediateStrategy.syncItem] Conflict detected!`);
      const resolver = ConflictResolver.getResolver(config.conflictResolution);
      const resolved = await resolver(item, serverData, {
        storageKey: "",
        itemId: (item as any).id || 0,
      });
      console.log(
        `[ImmediateStrategy.syncItem] Resolved item:`,
        JSON.stringify(resolved, null, 2)
      );

      // Return the resolved item - it should be the complete merged object
      return { conflict: true, resolvedItem: resolved as SyncedItem<T> };
    }

    // No conflict - return server data as resolved item to update local
    return { conflict: false, resolvedItem: serverData as SyncedItem<T> };
  }

  private hasConflict(local: any, remote: any): boolean {
    return !!(
      remote.version &&
      local.version &&
      remote.version !== local.version
    );
  }
}
