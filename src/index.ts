/**
 * i45 - Type-safe browser storage wrapper
 * Main entry point
 */

// Export main DataContext class
export { DataContext } from "./core/DataContext.js";

// Export models
export { StorageLocations } from "./models/StorageLocations.js";
export type { StorageLocation } from "./models/StorageLocations.js";
export type { StorageItem } from "./models/StorageItem.js";
export { createStorageItem } from "./models/StorageItem.js";
export type { DataContextConfig } from "./models/DataContextConfig";
export { createDefaultConfig, mergeConfig } from "./models/DataContextConfig";
export type { StorageInfo } from "./models/StorageInfo";
export { formatBytes, formatStorageInfo } from "./models/StorageInfo";
export type { StorageMetadata } from "./models/StorageMetadata";
export {
  createMetadata,
  updateMetadata,
  hasMetadata,
  getMetadataInfo,
  isModifiedSince,
  isStale,
  getAge,
} from "./models/StorageMetadata";

// Export error classes
export {
  PersistenceServiceNotEnabled,
  DataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError,
  MigrationError,
} from "./errors/index";

// Export services
export type { IStorageService } from "./services/base/IStorageService";
export { BaseStorageService } from "./services/base/BaseStorageService";
export { LocalStorageService } from "./services/LocalStorageService";
export { SessionStorageService } from "./services/SessionStorageService";
export { IndexedDBService } from "./services/IndexedDBService";

// Export core utilities
export { StorageManager } from "./core/StorageManager";
export { ValidationUtils } from "./utils/ValidationUtils";
export { ErrorHandler } from "./utils/ErrorHandler";

// Export sync (cross-tab synchronization and server sync)
export type {
  CrossTabManagerConfig,
  CrossTabUpdateCallback,
  CrossTabMessage,
  CrossTabMessageType,
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
} from "./sync/index";
export {
  CrossTabManager,
  CrossTabSync,
  StorageEventSync,
  getTabId,
  clearTabId,
  isFromCurrentTab,
  SyncManager,
  ConflictResolver,
  ImmediateStrategy,
  QueuedStrategy,
  BatchStrategy,
} from "./sync/index";

// Export migration (data versioning and migration)
export type {
  MigrationFunction,
  MigrationMap,
  MigrationConfig,
  VersionMetadata,
  MigrationRecord,
} from "./models/MigrationTypes";
export {
  createVersionedData,
  isVersionedData,
  extractItems,
  getDataVersion,
} from "./models/VersionMetadata";
export { MigrationManager } from "./migration/index";

// Re-export dependencies
export { SampleData } from "i45-sample-data";
export { Logger } from "i45-jslogger";

// Default export (DataContext)
export { DataContext as default } from "./core/DataContext";
