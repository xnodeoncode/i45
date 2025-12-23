/**
 * DataContext Configuration
 * Configuration options for DataContext instances
 */

import type { Logger } from "i45-jslogger";
import { StorageLocations, StorageLocation } from "./StorageLocations";
import type { MigrationConfig } from "./MigrationTypes";

/**
 * Configuration options for DataContext
 */
export interface DataContextConfig extends MigrationConfig {
  /**
   * The key used to store data (default: "Items")
   */
  storageKey?: string;

  /**
   * The storage location (default: localStorage)
   */
  storageLocation?: StorageLocation;

  /**
   * Logger instance for logging operations
   */
  logger?: Logger | null;

  /**
   * Enable/disable logging (default: false)
   */
  loggingEnabled?: boolean;

  /**
   * Enable automatic timestamp tracking with metadata wrapper (default: true)
   * When enabled, data is stored with createdAt, updatedAt timestamps
   */
  trackTimestamps?: boolean;

  /**
   * Enable cross-tab synchronization (default: false)
   * When enabled, changes are automatically synchronized between browser tabs/windows
   */
  enableCrossTabSync?: boolean;

  /**
   * Callback invoked when another tab updates the data
   * @param items - Updated items from another tab
   */
  onCrossTabUpdate?: (items: any[]) => void | Promise<void>;

  /**
   * Callback invoked when another tab removes the data
   */
  onCrossTabRemove?: () => void | Promise<void>;

  /**
   * Callback invoked when another tab clears the data
   */
  onCrossTabClear?: () => void | Promise<void>;

  // Migration config properties inherited from MigrationConfig:
  // version?: number;
  // migrations?: MigrationMap<T>;
  // onMigrationStart?: (fromVersion: number, toVersion: number) => void;
  // onMigrationComplete?: (fromVersion: number, toVersion: number, itemCount: number) => void;
  // onMigrationError?: (fromVersion: number, toVersion: number, error: Error) => void;
  // autoMigrate?: boolean;
}

/**
 * Create default configuration
 */
export function createDefaultConfig(): Required<
  Omit<
    DataContextConfig,
    | "onCrossTabUpdate"
    | "onCrossTabRemove"
    | "onCrossTabClear"
    | "version"
    | "migrations"
    | "onMigrationStart"
    | "onMigrationComplete"
    | "onMigrationError"
  >
> {
  return {
    storageKey: "Items",
    storageLocation: StorageLocations.LocalStorage,
    logger: null,
    loggingEnabled: false,
    trackTimestamps: true,
    enableCrossTabSync: false,
    autoMigrate: true,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig?: DataContextConfig
): Required<
  Omit<
    DataContextConfig,
    | "onCrossTabUpdate"
    | "onCrossTabRemove"
    | "onCrossTabClear"
    | "version"
    | "migrations"
    | "onMigrationStart"
    | "onMigrationComplete"
    | "onMigrationError"
  >
> &
  Pick<
    DataContextConfig,
    | "onCrossTabUpdate"
    | "onCrossTabRemove"
    | "onCrossTabClear"
    | "version"
    | "migrations"
    | "onMigrationStart"
    | "onMigrationComplete"
    | "onMigrationError"
  > {
  const defaults = createDefaultConfig();

  if (!userConfig) {
    return defaults;
  }

  return {
    storageKey: userConfig.storageKey ?? defaults.storageKey,
    storageLocation: userConfig.storageLocation ?? defaults.storageLocation,
    logger: userConfig.logger ?? defaults.logger,
    trackTimestamps: userConfig.trackTimestamps ?? defaults.trackTimestamps,
    loggingEnabled: userConfig.loggingEnabled ?? defaults.loggingEnabled,
    enableCrossTabSync:
      userConfig.enableCrossTabSync ?? defaults.enableCrossTabSync,
    autoMigrate: userConfig.autoMigrate ?? defaults.autoMigrate,
    onCrossTabUpdate: userConfig.onCrossTabUpdate,
    onCrossTabRemove: userConfig.onCrossTabRemove,
    onCrossTabClear: userConfig.onCrossTabClear,
    version: userConfig.version,
    migrations: userConfig.migrations,
    onMigrationStart: userConfig.onMigrationStart,
    onMigrationComplete: userConfig.onMigrationComplete,
    onMigrationError: userConfig.onMigrationError,
  };
}
