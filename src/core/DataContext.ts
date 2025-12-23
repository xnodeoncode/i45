/**
 * DataContext - Centralized data storage management
 * Refactored to eliminate code duplication using service orchestration
 */

import type { Logger } from "i45-jslogger";
import { SampleData } from "i45-sample-data";
import {
  StorageLocations,
  type StorageLocation,
} from "../models/StorageLocations.js";
import { StorageManager } from "./StorageManager.js";
import { ValidationUtils } from "../utils/ValidationUtils.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import type { DataContextConfig } from "../models/DataContextConfig.js";
import { mergeConfig } from "../models/DataContextConfig.js";
import type { StorageInfo } from "../models/StorageInfo.js";
import {
  type StorageMetadata,
  createMetadata,
  updateMetadata,
  hasMetadata,
  getMetadataInfo,
} from "../models/StorageMetadata.js";
import { CrossTabManager } from "../sync/CrossTabManager.js";

/**
 * Export dependencies for use in consuming modules
 */
export { SampleData, StorageLocations };
export type { Logger };

/**
 * DataContext - Service provider for managing data storage across multiple storage types
 *
 * @class DataContext
 * @template T - The type of items stored in the context
 *
 * @property {string} storageKey - The key used to store data (defaults to "Items")
 * @property {StorageLocation} storageLocation - The storage location (localStorage or sessionStorage)
 * @property {boolean} loggingEnabled - Enable/disable logging
 * @property {Logger | null} logger - Logger instance for logging events and errors
 *
 * @example
 * // Basic usage with defaults
 * const context = new DataContext();
 * await context.store([{ id: 1, name: "Item 1" }]);
 * const items = await context.retrieve();
 *
 * @example
 * // Custom configuration
 * const context = new DataContext({
 *   storageKey: "MyData",
 *   storageLocation: StorageLocations.SessionStorage,
 *   loggingEnabled: true,
 *   logger: new Logger()
 * });
 */
export class DataContext<T = any> {
  // Private fields
  #storageKey: string;
  #storageLocation: StorageLocation;
  #dataStores: any[] = [];
  #storageManager: StorageManager;
  #errorHandler: ErrorHandler;
  #trackTimestamps: boolean;
  #crossTabManager?: CrossTabManager<T>;
  #syncManager?: any; // SyncManager<T> - using any to avoid circular dependency
  #migrationManager?: any; // MigrationManager<T> - using any to avoid circular dependency
  #autoMigrate: boolean;

  #logActions = {
    Store: "STORE",
    Retrieve: "RETRIEVE",
    Remove: "REMOVE",
  };

  /**
   * Creates a new DataContext instance
   *
   * @param config - Configuration options or storage key (for backward compatibility)
   * @param storageLocation - Storage location (for backward compatibility)
   *
   * @example
   * // New config object approach (recommended)
   * const context = new DataContext({
   *   storageKey: "Items",
   *   storageLocation: StorageLocations.LocalStorage,
   *   loggingEnabled: true
   * });
   *
   * @example
   * // Legacy parameter approach (maintained for backward compatibility)
   * const context = new DataContext("Items", StorageLocations.LocalStorage);
   */
  constructor(
    config?: string | DataContextConfig,
    storageLocation?: StorageLocation
  ) {
    // Handle backward compatibility: constructor(storageKey, storageLocation)
    let finalConfig: ReturnType<typeof mergeConfig>;

    if (typeof config === "string") {
      // Legacy: constructor(storageKey: string, storageLocation?: StorageLocation)
      finalConfig = mergeConfig({
        storageKey: config,
        storageLocation: storageLocation,
      });
    } else {
      // Modern: constructor(config?: DataContextConfig)
      finalConfig = mergeConfig(config);
    }

    this.#storageKey = finalConfig.storageKey;
    this.#storageLocation = finalConfig.storageLocation;
    this.#trackTimestamps = finalConfig.trackTimestamps;
    this.#autoMigrate = finalConfig.autoMigrate;

    this.#errorHandler = new ErrorHandler(
      finalConfig.logger,
      finalConfig.loggingEnabled
    );

    this.#storageManager = new StorageManager(this.#errorHandler);

    // Initialize cross-tab sync if enabled
    if (finalConfig.enableCrossTabSync) {
      this.#initializeCrossTabSync(finalConfig);
    }

    // Initialize migration manager if version/migrations configured
    if (finalConfig.version || finalConfig.migrations) {
      this.#initializeMigrationManager(finalConfig);
    }
  }

  // ============================================================================
  // Properties - Logging Configuration
  // ============================================================================

  /**
   * Gets whether logging is enabled
   */
  get loggingEnabled(): boolean {
    return this.#errorHandler.loggingEnabled;
  }

  /**
   * Sets whether logging is enabled
   */
  set loggingEnabled(value: boolean) {
    if (typeof value !== "boolean") {
      this.#errorHandler.error(
        `Expected a boolean, but got ${typeof value}`,
        true,
        { data: value }
      );
    }
    this.#errorHandler.loggingEnabled = value;
  }

  /**
   * Gets the logger instance
   */
  get logger(): Logger | null {
    return this.#errorHandler.logger;
  }

  /**
   * Sets the logger instance
   */
  set logger(value: Logger | null) {
    if (value !== null && !(value instanceof require("i45-jslogger").Logger)) {
      this.#errorHandler.error(`Expected Logger instance or null`, true, {
        data: value,
      });
    }
    this.#errorHandler.logger = value;
  }

  // ============================================================================
  // Properties - Storage Configuration
  // ============================================================================

  /**
   * Gets the storage key
   */
  get storageKey(): string {
    return this.#storageKey;
  }

  /**
   * Sets the storage key
   */
  set storageKey(value: string) {
    ValidationUtils.validateStorageKey(value);

    if (ValidationUtils.isReservedKey(value)) {
      this.#errorHandler.warn(
        `The storageKey should not be one of the reserved storage locations: ${Object.values(
          StorageLocations
        ).join(", ")}.`
      );
    }

    this.#storageKey = value;
  }

  /**
   * Gets the storage location
   */
  get storageLocation(): StorageLocation {
    return this.#storageLocation;
  }

  /**
   * Sets the storage location
   */
  set storageLocation(value: StorageLocation) {
    ValidationUtils.validateStorageLocation(value);
    this.#storageLocation = value;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Gets the current DataContext settings
   *
   * @returns Current storage key and location
   */
  getCurrentSettings(): {
    storageKey: string;
    storageLocation: StorageLocation;
  } {
    const settings = {
      storageKey: this.#storageKey,
      storageLocation: this.#storageLocation,
    };

    const currentLoggingSetting = this.loggingEnabled;
    this.loggingEnabled = true;
    this.#errorHandler.info(
      `Current dataContext settings: ${window.location.href.split("/").pop()}`,
      JSON.stringify(settings)
    );
    this.loggingEnabled = currentLoggingSetting;

    return settings;
  }

  /**
   * Gets a copy of the current data stores log
   *
   * @returns Copy of data stores array
   */
  getData(): any[] {
    const currentLoggingSetting = this.loggingEnabled;
    this.loggingEnabled = true;
    this.#errorHandler.info("Current data:", this.#dataStores);
    this.loggingEnabled = currentLoggingSetting;

    return [...this.#dataStores];
  }

  /**
   * Prints the logger's event history
   *
   * @returns Array of logged events
   */
  printLog(): any[] {
    if (!this.logger) {
      this.#errorHandler.warn("Logger service is not configured.");
      return [];
    }

    const currentLoggingSetting = this.loggingEnabled;
    this.loggingEnabled = true;
    this.#errorHandler.info("Printing log history");
    const events = (this.logger as any).getEvents?.() || [];
    console.log(events);
    this.loggingEnabled = currentLoggingSetting;

    return [...events];
  }

  /**
   * Adds a client to the logger service
   *
   * @param client - The client to add to the logger
   * @returns The current DataContext instance
   */
  addClient(client: any): this {
    if (!this.logger) {
      const { Logger } = require("i45-jslogger");
      this.logger = new Logger();
    }

    if (client && typeof client === "object") {
      try {
        (this.logger as any).addClient?.(client);

        const currentLoggingSetting = this.loggingEnabled;
        this.loggingEnabled = true;
        this.#errorHandler.info(
          "New logger registered successfully from client."
        );
        this.loggingEnabled = currentLoggingSetting;
      } catch (e) {
        this.#errorHandler.error(
          "Error adding client to logger service.",
          false,
          {
            Details: e,
          }
        );
      }
    } else {
      const currentLoggingSetting = this.loggingEnabled;
      this.loggingEnabled = true;
      this.#errorHandler.warn(
        `Expected an object for client, but got ${typeof client}.`
      );
      this.loggingEnabled = currentLoggingSetting;
    }

    return this;
  }

  // ============================================================================
  // Store Operations
  // ============================================================================

  /**
   * Stores items using default storage key and location
   *
   * @param items - Array of items to store
   * @returns The current DataContext instance
   *
   * @example
   * await context.store([{ id: 1, name: "Item 1" }]);
   */
  async store(items: T[]): Promise<this> {
    ValidationUtils.validateArray(items, "items");

    if (items.length === 0) {
      this.#errorHandler.warn("Storing an empty array");
    }

    // Mark items for sync if server sync is enabled
    let itemsToStore = items;
    if (this.#syncManager?.isActive()) {
      itemsToStore = items.map((item: any) => ({
        ...item,
        _needsSync: true,
        _syncAttempts: item._syncAttempts || 0,
      }));
    }

    // Wrap with metadata if timestamp tracking is enabled
    let dataToStore: any = this.#trackTimestamps
      ? await this.#wrapWithMetadata(
          this.#storageKey,
          this.#storageLocation,
          itemsToStore
        )
      : itemsToStore;

    // Wrap with version metadata if migration manager is configured
    if (this.#migrationManager) {
      const { createVersionedData } = await import(
        "../models/VersionMetadata.js"
      );
      const version = this.#migrationManager.getCurrentVersion();

      // Get existing metadata if present
      const existingData = await this.#storageManager.retrieve<any>(
        this.#storageKey,
        this.#storageLocation
      );

      const { isVersionedData } = await import("../models/VersionMetadata.js");

      // Preserve migration history if updating existing versioned data
      const migrationHistory =
        existingData && isVersionedData(existingData)
          ? existingData.migrationHistory
          : [];

      dataToStore = {
        ...createVersionedData(dataToStore, version),
        migrationHistory,
      };
    }

    await this.#storageManager.store(
      this.#storageKey,
      this.#storageLocation,
      dataToStore
    );

    this.#logDataEntry(
      this.#logActions.Store,
      this.#storageKey,
      this.#storageLocation,
      items
    );

    // Broadcast to other tabs if cross-tab sync is enabled
    if (this.#crossTabManager?.isActive()) {
      await this.#crossTabManager.broadcast(items);
    }

    return this;
  }

  /**
   * Stores items using a custom storage key with default location
   *
   * @param storageKey - The key to store items under
   * @param items - Array of items to store
   * @returns The current DataContext instance
   *
   * @example
   * await context.storeAs("CustomKey", [{ id: 1 }]);
   */
  async storeAs(storageKey: string, items: T[]): Promise<this> {
    ValidationUtils.validateStorageKey(storageKey);

    if (ValidationUtils.isReservedKey(storageKey)) {
      this.#errorHandler.error(
        `The storageKey cannot be one of the reserved storage locations: ${Object.values(
          StorageLocations
        ).join(", ")}.`,
        true,
        { storageKey }
      );
    }

    ValidationUtils.validateArray(items, "items");

    // Wrap with metadata if timestamp tracking is enabled
    const dataToStore = this.#trackTimestamps
      ? await this.#wrapWithMetadata(storageKey, this.#storageLocation, items)
      : items;

    await this.#storageManager.store(
      storageKey,
      this.#storageLocation,
      dataToStore
    );

    this.#logDataEntry(
      this.#logActions.Store,
      storageKey,
      this.#storageLocation,
      items
    );

    return this;
  }

  /**
   * Stores items using a custom storage key and location
   *
   * @param storageKey - The key to store items under
   * @param storageLocation - The storage location
   * @param items - Array of items to store
   * @returns The current DataContext instance
   *
   * @example
   * await context.storeAt("Key", StorageLocations.SessionStorage, [{ id: 1 }]);
   */
  async storeAt(
    storageKey: string,
    storageLocation: StorageLocation,
    items: T[]
  ): Promise<this> {
    ValidationUtils.validateStorageKey(storageKey);
    ValidationUtils.validateStorageLocation(storageLocation);
    ValidationUtils.validateArray(items, "items");

    // Wrap with metadata if timestamp tracking is enabled
    const dataToStore = this.#trackTimestamps
      ? await this.#wrapWithMetadata(storageKey, storageLocation, items)
      : items;

    await this.#storageManager.store(storageKey, storageLocation, dataToStore);

    this.#logDataEntry(
      this.#logActions.Store,
      storageKey,
      storageLocation,
      items
    );

    return this;
  }

  // ============================================================================
  // Retrieve Operations
  // ============================================================================

  /**
   * Retrieves items from default storage key and location
   * If migrations are configured and needed, automatically runs them
   *
   * @returns Array of stored items
   *
   * @example
   * const items = await context.retrieve();
   */
  async retrieve(): Promise<T[]> {
    let data = await this.#storageManager.retrieve<any>(
      this.#storageKey,
      this.#storageLocation
    );

    // Check if auto-migration is needed
    if (
      this.#migrationManager &&
      this.#autoMigrate &&
      data &&
      data.length > 0 &&
      this.#migrationManager.needsMigration(data)
    ) {
      if (this.loggingEnabled) {
        this.#errorHandler.info("Auto-migration triggered");
      }

      // Run migration
      const migratedData = await this.#migrationManager.migrate(data);

      // Save migrated data
      await this.#storageManager.store(
        this.#storageKey,
        this.#storageLocation,
        migratedData
      );

      data = migratedData;
    }

    return this.#unwrapMetadata(data);
  }

  /**
   * Retrieves items from a custom storage key with default location
   *
   * @param storageKey - The key to retrieve items from
   * @returns Array of stored items
   *
   * @example
   * const items = await context.retrieveFrom("CustomKey");
   */
  async retrieveFrom(storageKey: string): Promise<T[]> {
    ValidationUtils.validateStorageKey(storageKey);

    const data = await this.#storageManager.retrieve<any>(
      storageKey,
      this.#storageLocation
    );

    return this.#unwrapMetadata(data);
  }

  /**
   * Retrieves items from a custom storage key and location
   *
   * @param storageKey - The key to retrieve items from
   * @param storageLocation - The storage location
   * @returns Array of stored items
   *
   * @example
   * const items = await context.retrieveAt("Key", StorageLocations.SessionStorage);
   */
  async retrieveAt(
    storageKey: string,
    storageLocation: StorageLocation
  ): Promise<T[]> {
    ValidationUtils.validateStorageKey(storageKey);
    ValidationUtils.validateStorageLocation(storageLocation);

    const data = await this.#storageManager.retrieve<any>(
      storageKey,
      storageLocation
    );

    return this.#unwrapMetadata(data);
  }

  // ============================================================================
  // Remove Operations
  // ============================================================================

  /**
   * Removes items from default storage key and location
   *
   * @returns The current DataContext instance
   *
   * @example
   * await context.remove();
   */
  async remove(): Promise<this> {
    await this.#storageManager.remove(this.#storageKey, this.#storageLocation);

    this.#logDataEntry(
      this.#logActions.Remove,
      this.#storageKey,
      this.#storageLocation,
      []
    );

    // Broadcast remove to other tabs if cross-tab sync is enabled
    if (this.#crossTabManager?.isActive()) {
      await this.#crossTabManager.broadcastRemove();
    }

    return this;
  }

  /**
   * Removes items from a custom storage key with default location
   *
   * @param storageKey - The key to remove items from
   * @returns The current DataContext instance
   *
   * @example
   * await context.removeFrom("CustomKey");
   */
  async removeFrom(storageKey: string): Promise<this> {
    ValidationUtils.validateStorageKey(storageKey);

    await this.#storageManager.remove(storageKey, this.#storageLocation);

    this.#logDataEntry(
      this.#logActions.Remove,
      storageKey,
      this.#storageLocation,
      []
    );

    return this;
  }

  /**
   * Removes items from a custom storage key and location
   *
   * @param storageKey - The key to remove items from
   * @param storageLocation - The storage location
   * @returns The current DataContext instance
   *
   * @example
   * await context.removeAt("Key", StorageLocations.SessionStorage);
   */
  async removeAt(
    storageKey: string,
    storageLocation: StorageLocation
  ): Promise<this> {
    ValidationUtils.validateStorageKey(storageKey);
    ValidationUtils.validateStorageLocation(storageLocation);

    await this.#storageManager.remove(storageKey, storageLocation);

    this.#logDataEntry(
      this.#logActions.Remove,
      storageKey,
      storageLocation,
      []
    );

    return this;
  }

  // ============================================================================
  // Clear Operation
  // ============================================================================

  /**
   * Clears all data from the default storage location
   *
   * @returns The current DataContext instance
   *
   * @example
   * await context.clear();
   */
  async clear(): Promise<this> {
    await this.#storageManager.clear(this.#storageLocation);

    // Broadcast clear to other tabs if cross-tab sync is enabled
    if (this.#crossTabManager?.isActive()) {
      await this.#crossTabManager.broadcastClear();
    }

    return this;
  }

  // ============================================================================
  // Metadata Methods
  // ============================================================================

  /**
   * Gets metadata information (timestamps, version) for stored data
   *
   * Returns metadata if timestamp tracking is enabled and data has been stored.
   * Returns null if timestamp tracking is disabled or no data exists.
   *
   * @returns Promise resolving to metadata info or null
   *
   * @example
   * const metadata = await context.getMetadata();
   * if (metadata) {
   *   console.log(`Created: ${metadata.createdAt}`);
   *   console.log(`Updated: ${metadata.updatedAt}`);
   *   console.log(`Version: ${metadata.version}`);
   * }
   */
  async getMetadata(): Promise<Omit<StorageMetadata<T>, "items"> | null> {
    const data = await this.#storageManager.retrieve<any>(
      this.#storageKey,
      this.#storageLocation
    );

    if (data && hasMetadata(data)) {
      return getMetadataInfo(data);
    }

    return null;
  }

  /**
   * Gets metadata from a custom storage key
   *
   * @param storageKey - The key to get metadata from
   * @returns Promise resolving to metadata info or null
   *
   * @example
   * const metadata = await context.getMetadataFrom("CustomKey");
   */
  async getMetadataFrom(
    storageKey: string
  ): Promise<Omit<StorageMetadata<T>, "items"> | null> {
    ValidationUtils.validateStorageKey(storageKey);

    const data = await this.#storageManager.retrieve<any>(
      storageKey,
      this.#storageLocation
    );

    if (data && hasMetadata(data)) {
      return getMetadataInfo(data);
    }

    return null;
  }

  /**
   * Gets metadata from a custom storage key and location
   *
   * @param storageKey - The key to get metadata from
   * @param storageLocation - The storage location
   * @returns Promise resolving to metadata info or null
   *
   * @example
   * const metadata = await context.getMetadataAt("Key", StorageLocations.SessionStorage);
   */
  async getMetadataAt(
    storageKey: string,
    storageLocation: StorageLocation
  ): Promise<Omit<StorageMetadata<T>, "items"> | null> {
    ValidationUtils.validateStorageKey(storageKey);
    ValidationUtils.validateStorageLocation(storageLocation);

    const data = await this.#storageManager.retrieve<any>(
      storageKey,
      storageLocation
    );

    if (data && hasMetadata(data)) {
      return getMetadataInfo(data);
    }

    return null;
  }

  // ============================================================================
  // Storage Quota Methods
  // ============================================================================

  /**
   * Gets remaining storage quota information using the Storage API
   *
   * This method provides overall storage quota information for the origin.
   * Note: Only supported in browsers that implement the Storage API.
   *
   * @returns Promise resolving to StorageInfo with quota details
   * @throws {Error} If Storage API is not supported
   *
   * @example
   * const info = await context.getRemainingStorage();
   * console.log(`${info.remaining} bytes remaining (${info.percentUsed}% used)`);
   */
  async getRemainingStorage(): Promise<StorageInfo> {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error("Storage API is not supported in this browser");
    }

    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const remaining = quota - usage;
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    return {
      type: "overall",
      quota,
      usage,
      remaining,
      percentUsed,
      isEstimate: true,
    };
  }

  /**
   * Gets storage quota information for a specific storage location
   *
   * For IndexedDB, uses the Storage API for accurate quota information.
   * For localStorage/sessionStorage, provides estimated capacity based on typical browser limits.
   *
   * @param location - Optional storage location. Defaults to the configured storage location.
   * @returns Promise resolving to StorageInfo for the specified location
   * @throws {Error} If Storage API is not supported (for IndexedDB queries)
   *
   * @example
   * // Get quota for default storage location
   * const info = await context.getStorageInfo();
   *
   * @example
   * // Get quota for specific location
   * const info = await context.getStorageInfo(StorageLocation.IndexedDB);
   * console.log(`IndexedDB: ${info.remaining} bytes remaining`);
   */
  async getStorageInfo(location?: StorageLocation): Promise<StorageInfo> {
    const storageLocation = location || this.#storageLocation;

    if (storageLocation === StorageLocations.IndexedDB) {
      return this.#getIndexedDBQuota();
    } else {
      return this.#getWebStorageQuota(storageLocation);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Gets quota information for IndexedDB using the Storage API
   * @private
   */
  async #getIndexedDBQuota(): Promise<StorageInfo> {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error("Storage API is not supported in this browser");
    }

    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const remaining = quota - usage;
    const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    return {
      type: "IndexedDB",
      quota,
      usage,
      remaining,
      percentUsed,
      isEstimate: true,
    };
  }

  /**
   * Gets estimated quota information for Web Storage (localStorage/sessionStorage)
   *
   * Since Web Storage doesn't provide a native quota API, this method:
   * 1. Uses typical browser limits as estimated quota (5-10MB)
   * 2. Measures actual usage by calculating stored data size
   *
   * @private
   */
  async #getWebStorageQuota(location: StorageLocation): Promise<StorageInfo> {
    // Typical browser limits for Web Storage
    const ESTIMATED_QUOTA = 10 * 1024 * 1024; // 10MB estimate (conservative)

    const storageType =
      location === StorageLocations.LocalStorage
        ? "localStorage"
        : "sessionStorage";
    const storage =
      location === StorageLocations.LocalStorage
        ? localStorage
        : sessionStorage;

    // Calculate actual usage by measuring stored data
    let usage = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key) || "";
        // Each character is 2 bytes in UTF-16
        usage += (key.length + value.length) * 2;
      }
    }

    const remaining = ESTIMATED_QUOTA - usage;
    const percentUsed = Math.round((usage / ESTIMATED_QUOTA) * 100);

    return {
      type: storageType,
      quota: ESTIMATED_QUOTA,
      usage,
      remaining,
      percentUsed,
      isEstimate: true,
    };
  }

  /**
   * Wraps data with metadata if it doesn't already have it, or updates existing metadata
   * @private
   */
  async #wrapWithMetadata(
    storageKey: string,
    storageLocation: StorageLocation,
    items: T[]
  ): Promise<any> {
    // Check if existing data has metadata
    const existingData = await this.#storageManager.retrieve<any>(
      storageKey,
      storageLocation
    );

    if (existingData && hasMetadata(existingData)) {
      // Update existing metadata
      return updateMetadata(existingData, items);
    } else {
      // Create new metadata
      return createMetadata(items);
    }
  }

  /**
   * Unwraps metadata to return just the items, or returns data as-is if no metadata
   * Handles both timestamp metadata and version metadata
   * @private
   */
  #unwrapMetadata(data: any): T[] {
    if (!data) {
      return [];
    }

    // Check if data is version metadata wrapper
    if (
      data &&
      typeof data === "object" &&
      "version" in data &&
      "items" in data &&
      Array.isArray(data.items)
    ) {
      // It's versioned data, extract items
      const items = data.items;

      // Check if items are wrapped with timestamp metadata
      if (items.length > 0 && hasMetadata(items[0])) {
        return items[0].items as T[];
      }

      return items as T[];
    }

    // Check if data is a metadata wrapper
    if (hasMetadata(data)) {
      return data.items as T[];
    }

    // Return data as-is if no metadata (backward compatibility)
    return Array.isArray(data) ? data : [];
  }

  /**
   * Logs a data operation entry
   *
   * @param action - The action performed (STORE, RETRIEVE, REMOVE)
   * @param storageKey - The storage key
   * @param storageLocation - The storage location
   * @param items - The items involved in the operation
   */
  #logDataEntry(
    action: string,
    storageKey: string,
    storageLocation: StorageLocation,
    items: T[]
  ): void {
    const timestamp = new Date().toISOString();
    let logEntry: any = {};

    switch (action) {
      case "STORE":
        logEntry = {
          storageKey,
          storageLocation,
          action,
          modifiedOn: timestamp,
          value: items,
        };
        this.#dataStores.push(logEntry);
        if (this.loggingEnabled) {
          this.#errorHandler.info(
            `Data stored as ${storageKey} in ${storageLocation}`
          );
        }
        break;

      case "RETRIEVE":
        if (this.loggingEnabled) {
          this.#errorHandler.info(
            `Retrieved data as ${storageKey} from ${storageLocation}`
          );
        }
        break;

      case "REMOVE":
        this.#dataStores = this.#dataStores.filter(
          (entry) => entry.storageKey !== storageKey
        );
        if (this.loggingEnabled) {
          this.#errorHandler.info(
            `Removed data ${storageKey} from ${storageLocation}`
          );
        }
        break;

      default:
        this.#errorHandler.warn(`Unknown action type: ${action}`);
        break;
    }
  }

  // ============================================================================
  // Cross-Tab Synchronization
  // ============================================================================

  /**
   * Initializes cross-tab synchronization
   *
   * @param config - DataContext configuration
   */
  #initializeCrossTabSync(config: DataContextConfig): void {
    try {
      this.#crossTabManager = new CrossTabManager<T>({
        storageKey: this.#storageKey,
        storageLocation: this.#storageLocation,
        onUpdate: config.onCrossTabUpdate,
        onRemove: config.onCrossTabRemove,
        onClear: config.onCrossTabClear,
      });

      if (this.loggingEnabled && this.#crossTabManager.isActive()) {
        this.#errorHandler.info(
          `Cross-tab sync initialized using ${this.#crossTabManager.getSyncMethod()}`
        );
      }
    } catch (error) {
      this.#errorHandler.warn(
        `Failed to initialize cross-tab sync: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Manually refresh data from other tabs' changes
   * Forces a retrieve operation to get the latest data
   *
   * @returns Array of items with latest changes from other tabs
   *
   * @example
   * const latestItems = await context.refreshFromCrossTab();
   */
  async refreshFromCrossTab(): Promise<T[]> {
    return await this.retrieve();
  }

  /**
   * Checks if cross-tab sync is enabled and active
   *
   * @returns true if cross-tab sync is functioning
   *
   * @example
   * if (context.isCrossTabSyncActive()) {
   *   console.log("Changes will sync across tabs");
   * }
   */
  isCrossTabSyncActive(): boolean {
    return this.#crossTabManager?.isActive() ?? false;
  }

  /**
   * Gets the cross-tab sync method being used
   *
   * @returns "broadcast" | "storage-events" | "none"
   *
   * @example
   * const method = context.getCrossTabSyncMethod();
   * console.log(`Using ${method} for cross-tab sync`);
   */
  getCrossTabSyncMethod(): "broadcast" | "storage-events" | "none" {
    return this.#crossTabManager?.getSyncMethod() ?? "none";
  }

  /**
   * Gets the unique identifier for the current tab
   * Only available when using BroadcastChannel
   *
   * @returns Tab ID or undefined
   *
   * @example
   * const tabId = context.getTabId();
   * if (tabId) {
   *   console.log(`This is tab ${tabId}`);
   * }
   */
  getTabId(): string | undefined {
    return this.#crossTabManager?.getTabId();
  }

  /**
   * Cleans up resources including cross-tab sync and server sync
   * Call this when the DataContext is no longer needed
   *
   * @example
   * context.destroy();
   */
  destroy(): void {
    this.#crossTabManager?.close();
    this.#syncManager?.disable();
  }

  // ==========================================
  // Server Sync Methods
  // ==========================================

  /**
   * Enable server synchronization with configuration
   * Requires trackTimestamps to be enabled
   *
   * @param config - Sync configuration
   * @throws Error if trackTimestamps is not enabled
   *
   * @example
   * await context.enableSync({
   *   endpoint: "/api/orders",
   *   strategy: "queued",
   *   conflictResolution: "last-write-wins",
   *   maxRetries: 3,
   *   onSyncComplete: (result) => {
   *     console.log(`Synced ${result.success} items`);
   *   }
   * });
   */
  async enableSync(config: any): Promise<void> {
    if (!this.#trackTimestamps) {
      throw new Error(
        "Server sync requires trackTimestamps to be enabled. " +
          "Set trackTimestamps: true in DataContext configuration."
      );
    }

    // Dynamic import to avoid circular dependency
    const { SyncManager } = await import("../sync/SyncManager.js");

    this.#syncManager = new SyncManager(this, config);
    await this.#syncManager.enable();

    if (this.loggingEnabled) {
      this.#errorHandler.info(
        `Server sync initialized with ${config.strategy} strategy`
      );
    }
  }

  /**
   * Disable server synchronization
   * Stops all sync operations and clears the sync manager
   *
   * @example
   * context.disableSync();
   */
  disableSync(): void {
    if (this.#syncManager) {
      this.#syncManager.disable();
      this.#syncManager = undefined;

      if (this.loggingEnabled) {
        this.#errorHandler.info("Server sync disabled");
      }
    }
  }

  /**
   * Manually trigger a sync operation
   * Syncs all pending changes to the server
   *
   * @returns Sync result with success/failed/conflicts counts
   * @throws Error if sync is not enabled
   *
   * @example
   * const result = await context.sync();
   * console.log(`Synced ${result.success} items, ${result.failed} failed`);
   */
  async sync(): Promise<any> {
    if (!this.#syncManager) {
      throw new Error("Server sync is not enabled. Call enableSync() first.");
    }

    return await this.#syncManager.sync();
  }

  /**
   * Get current sync status
   * Returns information about pending, synced, and failed items
   *
   * @returns Sync status or null if sync not enabled
   *
   * @example
   * const status = context.getSyncStatus();
   * if (status) {
   *   console.log(`Pending: ${status.pending}, Synced: ${status.synced}`);
   * }
   */
  getSyncStatus(): any | null {
    return this.#syncManager?.getStatus() || null;
  }

  /**
   * Check if server sync is enabled and active
   *
   * @returns true if server sync is active
   *
   * @example
   * if (context.isSyncActive()) {
   *   console.log("Changes will sync to server");
   * }
   */
  isSyncActive(): boolean {
    return this.#syncManager?.isActive() ?? false;
  }

  // ==========================================
  // Data Migration Methods
  // ==========================================

  /**
   * Manually trigger data migration
   * Migrates data from its current version to the configured target version
   *
   * @returns Promise that resolves when migration completes
   * @throws {MigrationError} If migration fails or is not configured
   *
   * @example
   * await context.migrate();
   */
  async migrate(): Promise<void> {
    if (!this.#migrationManager) {
      throw new Error(
        "Data versioning is not configured. " +
          "Set version and migrations in DataContext configuration."
      );
    }

    const rawData = await this.#storageManager.retrieve<any>(
      this.#storageKey,
      this.#storageLocation
    );

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      if (this.loggingEnabled) {
        this.#errorHandler.info("No data to migrate");
      }
      return;
    }

    const migratedData = await this.#migrationManager.migrate(rawData);

    await this.#storageManager.store(
      this.#storageKey,
      this.#storageLocation,
      migratedData
    );

    if (this.loggingEnabled) {
      this.#errorHandler.info(
        `Migration complete: v${this.#migrationManager.getDataVersion(
          rawData
        )} → v${this.#migrationManager.getCurrentVersion()}`
      );
    }
  }

  /**
   * Check if data migration is needed
   * Compares current data version with configured version
   *
   * @returns true if migration is needed
   *
   * @example
   * if (await context.needsMigration()) {
   *   console.log("Data will be migrated on next retrieve");
   * }
   */
  async needsMigration(): Promise<boolean> {
    if (!this.#migrationManager) {
      return false;
    }

    const rawData = await this.#storageManager.retrieve<any>(
      this.#storageKey,
      this.#storageLocation
    );

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      return false;
    }

    return this.#migrationManager.needsMigration(rawData);
  }

  /**
   * Get the current data version
   * Returns the version number of stored data
   *
   * @returns Version number (1 for unversioned data)
   *
   * @example
   * const version = await context.getDataVersion();
   * console.log(`Data is at version ${version}`);
   */
  async getDataVersion(): Promise<number> {
    if (!this.#migrationManager) {
      return 1;
    }

    const rawData = await this.#storageManager.retrieve<any>(
      this.#storageKey,
      this.#storageLocation
    );

    if (!rawData || (Array.isArray(rawData) && rawData.length === 0)) {
      return 1;
    }

    return this.#migrationManager.getDataVersion(rawData);
  }

  /**
   * Initialize migration manager with configuration
   * @private
   */
  #initializeMigrationManager(config: DataContextConfig): void {
    // Dynamic import to avoid circular dependency
    import("../migration/MigrationManager.js").then(({ MigrationManager }) => {
      this.#migrationManager = new MigrationManager(config);

      if (this.loggingEnabled) {
        this.#errorHandler.info(
          `Migration manager initialized for version ${config.version || 1}`
        );
      }
    });
  }
}
