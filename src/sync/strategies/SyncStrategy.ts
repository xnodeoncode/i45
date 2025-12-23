/**
 * Sync Strategy Interface
 * Base interface for all sync strategies
 */

import type { DataContext } from "../../core/DataContext";
import type { SyncConfig, SyncResult } from "../SyncTypes";

/**
 * Base interface that all sync strategies must implement
 */
export interface SyncStrategy<T> {
  /**
   * Execute the sync operation
   */
  execute(context: DataContext<T>, config: SyncConfig<T>): Promise<SyncResult>;

  /**
   * Get count of items pending sync
   */
  getPendingCount(context: DataContext<T>): Promise<number>;
}
