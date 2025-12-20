/**
 * DataContext Configuration
 * Configuration options for DataContext instances
 */

import type { Logger } from "i45-jslogger";
import { StorageLocations, StorageLocation } from "./storageLocations";

/**
 * Configuration options for DataContext
 */
export interface DataContextConfig {
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
}

/**
 * Create default configuration
 */
export function createDefaultConfig(): Required<DataContextConfig> {
  return {
    storageKey: "Items",
    storageLocation: StorageLocations.LocalStorage,
    logger: null,
    loggingEnabled: false,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig?: DataContextConfig
): Required<DataContextConfig> {
  const defaults = createDefaultConfig();

  if (!userConfig) {
    return defaults;
  }

  return {
    storageKey: userConfig.storageKey ?? defaults.storageKey,
    storageLocation: userConfig.storageLocation ?? defaults.storageLocation,
    logger: userConfig.logger ?? defaults.logger,
    loggingEnabled: userConfig.loggingEnabled ?? defaults.loggingEnabled,
  };
}
