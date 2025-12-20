/**
 * Storage Manager
 * Orchestrates storage operations across different storage services
 */

import type { IStorageService } from "../services/base/IStorageService";
import type { StorageLocation } from "../models/storageLocations";
import { StorageLocations } from "../models/storageLocations";
import { LocalStorageService } from "../services/LocalStorageService";
import { SessionStorageService } from "../services/SessionStorageService";
import { ValidationUtils } from "../utils/ValidationUtils";
import { ErrorHandler } from "../utils/ErrorHandler";

/**
 * Storage manager class for coordinating storage operations
 */
export class StorageManager {
  private localStorageService: IStorageService;
  private sessionStorageService: IStorageService;
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler) {
    this.localStorageService = new LocalStorageService();
    this.sessionStorageService = new SessionStorageService();
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
      default:
        ValidationUtils.validateStorageLocation(location);
        return this.localStorageService; // This will never be reached due to validation
    }
  }

  /**
   * Store items in storage
   * @param key - Storage key
   * @param location - Storage location
   * @param items - Items to store
   */
  async store<T = any>(
    key: string,
    location: StorageLocation,
    items: T[]
  ): Promise<void> {
    ValidationUtils.validateStorageKey(key);
    ValidationUtils.validateStorageLocation(location);
    ValidationUtils.validateArray(items);

    const service = this.getService(location);
    const serialized = JSON.stringify(items);
    service.save(key, serialized);

    this.errorHandler.info(`Data stored as ${key} in ${location}`, {
      key,
      location,
      itemCount: items.length,
    });
  }

  /**
   * Retrieve items from storage
   * @param key - Storage key
   * @param location - Storage location
   * @returns Retrieved items or empty array
   */
  async retrieve<T = any>(
    key: string,
    location: StorageLocation
  ): Promise<T[]> {
    ValidationUtils.validateStorageKey(key);
    ValidationUtils.validateStorageLocation(location);

    const service = this.getService(location);
    const result = service.retrieve(key);

    if (!result) {
      return [];
    }

    try {
      const items = JSON.parse(result.value);
      this.errorHandler.info(`Retrieved data as ${key} from ${location}`, {
        key,
        location,
        itemCount: items.length,
      });
      return items;
    } catch (error) {
      this.errorHandler.handleRetrievalError(
        key,
        error as Error,
        location === StorageLocations.LocalStorage
          ? "Local Storage"
          : "Session Storage"
      );
      return [];
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
    service.remove(key);

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
    service.clear();

    this.errorHandler.info(`Cleared all data from ${location}`, { location });
  }
}
