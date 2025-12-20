/**
 * Base Storage Service
 * Abstract base class providing common functionality for all storage implementations
 */

import type { StorageItem } from "../../models/storageItem";
import type { IStorageService } from "./IStorageService";
import { PersistenceServiceNotEnabled } from "../../errors/PersistenceServiceNotEnabled";

/**
 * Abstract base class for storage services
 */
export abstract class BaseStorageService implements IStorageService {
  protected storageAvailable: boolean = false;
  protected abstract readonly storageType: string;
  protected storage: Storage | null = null;

  constructor() {
    this.storageAvailable = this.checkAvailability();
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.storageAvailable;
  }

  /**
   * Save a storage item
   */
  abstract save(key: string, value: string): void;

  /**
   * Retrieve a storage item
   */
  abstract retrieve(key: string): StorageItem | null;

  /**
   * Remove a storage item
   */
  abstract remove(key: string): void;

  /**
   * Clear all items
   */
  abstract clear(): void;

  /**
   * Check if storage type is available
   * Reference: MDN Web Docs
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
   */
  protected checkAvailability(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const storage = this.getStorage();
      if (!storage) {
        return false;
      }

      const testKey = "__storage_test__";
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      // Storage might be available but quota exceeded
      const storage = this.getStorage();
      return (
        e instanceof DOMException &&
        (e.code === 22 ||
          e.code === 1014 ||
          e.name === "QuotaExceededError" ||
          e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
        storage !== null &&
        storage.length !== 0
      );
    }
  }

  /**
   * Get the underlying storage object
   */
  protected abstract getStorage(): Storage | null;

  /**
   * Throw error if storage is unavailable
   */
  protected throwIfUnavailable(): void {
    if (!this.storageAvailable) {
      throw new PersistenceServiceNotEnabled(
        `${this.storageType} is not available`
      );
    }
  }
}
