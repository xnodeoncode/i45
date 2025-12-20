/**
 * DataContext - Centralized data storage management
 * Refactored to eliminate code duplication using service orchestration
 */

import type { Logger } from "i45-jslogger";
import { SampleData } from "i45-sample-data";
import {
  StorageLocations,
  type StorageLocation,
} from "../models/storageLocations.js";
import { StorageManager } from "./StorageManager.js";
import { ValidationUtils } from "../utils/ValidationUtils.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import type { DataContextConfig } from "../models/DataContextConfig.js";
import { mergeConfig } from "../models/DataContextConfig.js";

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
    let finalConfig: Required<DataContextConfig>;

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

    this.#errorHandler = new ErrorHandler(
      finalConfig.logger,
      finalConfig.loggingEnabled
    );

    this.#storageManager = new StorageManager(this.#errorHandler);
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

    await this.#storageManager.store(
      this.#storageKey,
      this.#storageLocation,
      items
    );

    this.#logDataEntry(
      this.#logActions.Store,
      this.#storageKey,
      this.#storageLocation,
      items
    );

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

    await this.#storageManager.store(storageKey, this.#storageLocation, items);

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

    await this.#storageManager.store(storageKey, storageLocation, items);

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
   *
   * @returns Array of stored items
   *
   * @example
   * const items = await context.retrieve();
   */
  async retrieve(): Promise<T[]> {
    return await this.#storageManager.retrieve<T>(
      this.#storageKey,
      this.#storageLocation
    );
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

    return await this.#storageManager.retrieve<T>(
      storageKey,
      this.#storageLocation
    );
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

    return await this.#storageManager.retrieve<T>(storageKey, storageLocation);
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
    return this;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

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
}
