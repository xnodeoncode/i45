/**
 * LocalStorage Service
 * Wrapper for browser localStorage API
 */

import { StorageItem, createStorageItem } from "../models/StorageItem";
import { BaseStorageService } from "./base/BaseStorageService";

/**
 * LocalStorage service implementation
 */
export class LocalStorageService extends BaseStorageService {
  protected readonly storageType = "localStorage";

  /**
   * Get the localStorage object
   */
  protected getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  }

  /**
   * Save an item to localStorage
   */
  async save(key: string, value: string): Promise<void> {
    this.throwIfUnavailable();
    const storage = this.getStorage();
    if (storage) {
      storage.setItem(key, value);
    }
  }

  /**
   * Retrieve an item from localStorage
   */
  async retrieve(key: string): Promise<StorageItem | null> {
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
   * Remove an item from localStorage
   */
  async remove(key: string): Promise<void> {
    this.throwIfUnavailable();

    if (key && key.length > 0) {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(key);
      }
    }
  }

  /**
   * Clear all items from localStorage
   */
  async clear(): Promise<void> {
    this.throwIfUnavailable();
    const storage = this.getStorage();
    if (storage) {
      storage.clear();
    }
  }
}
