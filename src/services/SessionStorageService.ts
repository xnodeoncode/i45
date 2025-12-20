/**
 * SessionStorage Service
 * Wrapper for browser sessionStorage API
 */

import { StorageItem, createStorageItem } from "../models/storageItem";
import { BaseStorageService } from "./base/BaseStorageService";

/**
 * SessionStorage service implementation
 */
export class SessionStorageService extends BaseStorageService {
  protected readonly storageType = "sessionStorage";

  /**
   * Get the sessionStorage object
   */
  protected getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.sessionStorage;
  }

  /**
   * Save an item to sessionStorage
   */
  save(key: string, value: string): void {
    this.throwIfUnavailable();
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  /**
   * Retrieve an item from sessionStorage
   */
  retrieve(key: string): StorageItem | null {
    this.throwIfUnavailable();

    if (!key || key.length === 0) {
      return null;
    }

    const storage = this.getStorage();
    if (!storage) {
      return null;
    }

    const storedValue = storage.getItem(key);
    if (storedValue === null) {
      return null;
    }

    return createStorageItem(key, storedValue);
  }

  /**
   * Remove an item from sessionStorage
   */
  remove(key: string): void {
    this.throwIfUnavailable();

    if (key && key.length > 0) {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(key);
      }
    }
  }

  /**
   * Clear all items from sessionStorage
   */
  clear(): void {
    this.throwIfUnavailable();
    const storage = this.getStorage();
    if (storage) {
      storage.clear();
    }
  }
}
