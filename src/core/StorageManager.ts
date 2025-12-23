/**
 * Storage Manager
 * Orchestrates storage operations across different storage services
 */

import type { IStorageService } from "../services/base/IStorageService";
import type { StorageLocation } from "../models/StorageLocations";
import { StorageLocations } from "../models/StorageLocations";
import { LocalStorageService } from "../services/LocalStorageService";
import { SessionStorageService } from "../services/SessionStorageService";
import { IndexedDBService } from "../services/IndexedDBService";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ErrorHandler } from "../utils/ErrorHandler";

/**
 * Storage manager class for coordinating storage operations
 */
export class StorageManager {
  private localStorageService: IStorageService;
  private sessionStorageService: IStorageService;
  private indexedDBService: IStorageService;
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.localStorageService = new LocalStorageService();
    this.sessionStorageService = new SessionStorageService();
    this.indexedDBService = new IndexedDBService();
    this.errorHandler = errorHandler;
  }

  /**
   * Get the appropriate storage service for a location
   */
  private getService(location: StorageLocation): IStorageService {
    switch (location) {
      case StorageLocations.LocalStorage:
        return this.localStorageService;
      case StorageLocations.SessionStorage:
        return this.sessionStorageService;
      case StorageLocations.IndexedDB:
        return this.indexedDBService;
      default:
        ValidationUtils.validateStorageLocation(location);
        return this.localStorageService; // This will never be reached due to validation
    }
  }

  /**
   * Store items in storage
   * @param key - Storage key
   * @param location - Storage location
   * @param data - Data to store (array of items or metadata object)
   */
  async store<T = any>(
    key: string,
    location: StorageLocation,
    data: T[] | any
  ): Promise<void> {
    ValidationUtils.validateStorageKey(key);
    ValidationUtils.validateStorageLocation(location);

    // Only validate as array if it is an array
    if (Array.isArray(data)) {
      ValidationUtils.validateArray(data);
    }

    const service = this.getService(location);
    const serialized = JSON.stringify(data);
    await service.save(key, serialized);

    const itemCount = Array.isArray(data) ? data.length : data.itemCount ?? 0;
    this.errorHandler.info(`Data stored as ${key} in ${location}`, {
      key,
      location,
      itemCount,
    });
  }

  /**
   * Retrieve items from storage
   * @param key - Storage key
   * @param location - Storage location
   * @returns Retrieved data (array or metadata object) or null
   */
  async retrieve<T = any>(
    key: string,
    location: StorageLocation
  ): Promise<T[] | any> {
    ValidationUtils.validateStorageKey(key);
    ValidationUtils.validateStorageLocation(location);

    const service = this.getService(location);
    const result = await service.retrieve(key);

    if (!result) {
      return null;
    }

    try {
      const data = JSON.parse(result.value);
      const itemCount = Array.isArray(data) ? data.length : data.itemCount ?? 0;
      this.errorHandler.info(`Retrieved data as ${key} from ${location}`, {
        key,
        location,
        itemCount,
      });
      return data;
    } catch (error) {
      this.errorHandler.handleRetrievalError(
        key,
        error as Error,
        location === StorageLocations.LocalStorage
          ? "Local Storage"
          : "Session Storage"
      );
      return null;
    }
  }

  /**
   * Remove items from storage
   * @param key - Storage key
   * @param location - Storage location
   */
  async remove(key: string, location: StorageLocation): Promise<void> {
    ValidationUtils.validateStorageKey(key);
    ValidationUtils.validateStorageLocation(location);

    const service = this.getService(location);
    await service.remove(key);

    this.errorHandler.info(`Removed data ${key} from ${location}`, {
      key,
      location,
    });
  }

  /**
   * Clear all items from storage location
   * @param location - Storage location
   */
  async clear(location: StorageLocation): Promise<void> {
    ValidationUtils.validateStorageLocation(location);

    const service = this.getService(location);
    await service.clear();

    this.errorHandler.info(`Cleared all data from ${location}`, { location });
  }
}
