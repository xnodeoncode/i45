/**
 * Sync module - Cross-tab synchronization and server sync components
 * @module sync
 */

// Cross-tab sync exports
export { CrossTabSync, type CrossTabUpdateCallback } from "./CrossTabSync.js";
export { StorageEventSync } from "./StorageEventSync.js";
export {
  CrossTabManager,
  type CrossTabManagerConfig,
} from "./CrossTabManager.js";
export {
  type CrossTabMessage,
  type CrossTabMessageType,
  createUpdateMessage,
  createRemoveMessage,
  createClearMessage,
} from "./CrossTabMessage.js";
export { getTabId, clearTabId, isFromCurrentTab } from "./TabIdGenerator.js";

// Server sync exports
export { SyncManager } from "./SyncManager.js";
export { ConflictResolver } from "./ConflictResolver.js";
export type {
  SyncConfig,
  SyncResult,
  SyncStatus,
  SyncError,
  SyncStrategyType,
  ConflictResolutionType,
  ConflictResolverCallback,
  ConflictContext,
  SyncMetadata,
  SyncedItem,
} from "./SyncTypes.js";
export type { SyncStrategy } from "./strategies/SyncStrategy.js";
export { ImmediateStrategy } from "./strategies/ImmediateStrategy.js";
export { QueuedStrategy } from "./strategies/QueuedStrategy.js";
export { BatchStrategy } from "./strategies/BatchStrategy.js";
