/**
 * i45 - Type-safe browser storage wrapper
 * Main entry point
 */

// Export main DataContext class
export { DataContext } from "./core/DataContext.js";

// Export models
export { StorageLocations } from "./models/storageLocations";
export type { StorageLocation } from "./models/storageLocations";
export type { StorageItem } from "./models/storageItem";
export { createStorageItem } from "./models/storageItem";
export type { DatabaseSettings } from "./models/databaseSettings";
export { createDatabaseSettings } from "./models/databaseSettings";
export type { DataContextConfig } from "./models/DataContextConfig";
export { createDefaultConfig, mergeConfig } from "./models/DataContextConfig";

// Export error classes
export {
  PersistenceServiceNotEnabled,
  DataServiceUnavailable,
  StorageKeyError,
  StorageLocationError,
  DataRetrievalError,
  StorageQuotaError,
} from "./errors/index";

// Export services
export type { IStorageService } from "./services/base/IStorageService";
export { BaseStorageService } from "./services/base/BaseStorageService";
export { LocalStorageService } from "./services/LocalStorageService";
export { SessionStorageService } from "./services/SessionStorageService";

// Export core utilities
export { StorageManager } from "./core/StorageManager";
export { ValidationUtils } from "./utils/ValidationUtils";
export { ErrorHandler } from "./utils/ErrorHandler";

// Re-export dependencies
export { SampleData } from "i45-sample-data";
export { Logger } from "i45-jslogger";

// Default export (DataContext)
export { DataContext as default } from "./core/DataContext";
