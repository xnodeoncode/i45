/**
 * IndexedDB Service
 * Wrapper for browser IndexedDB API
 * Provides larger storage capacity (~50MB+) compared to localStorage/sessionStorage
 */

import { StorageItem, createStorageItem } from "../models/StorageItem";
import { BaseStorageService } from "./base/BaseStorageService";

/**
 * IndexedDB service implementation
 */
export class IndexedDBService extends BaseStorageService {
  protected readonly storageType = "indexedDB";
  private readonly dbName = "i45Storage";
  private readonly dbVersion = 1;
  private readonly storeName = "items";
  private db: IDBDatabase | null = null;

  /**
   * Get the IndexedDB object (not used same way as localStorage/sessionStorage)
   */
  protected getStorage(): Storage | null {
    // IndexedDB doesn't have a Storage object like localStorage
    // Return null but override checkAvailability for proper detection
    return null;
  }

  /**
   * Check if IndexedDB is available
   */
  protected checkAvailability(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return (
        "indexedDB" in window &&
        window.indexedDB !== null &&
        window.indexedDB !== undefined
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Get or open the IndexedDB database
   */
  private async getDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "key" });
        }
      };
    });
  }

  /**
   * Save an item to IndexedDB
   */
  async save(key: string, value: string): Promise<void> {
    this.throwIfUnavailable();

    const db = await this.getDatabase();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to save to IndexedDB: ${request.error}`));
    });
  }

  /**
   * Retrieve an item from IndexedDB
   */
  async retrieve(key: string): Promise<StorageItem | null> {
    this.throwIfUnavailable();

    if (!key || key.length === 0) {
      return null;
    }

    const db = await this.getDatabase();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.hasOwnProperty("value")) {
          resolve(createStorageItem(key, result.value));
        } else {
          resolve(null);
        }
      };

      request.onerror = () =>
        reject(
          new Error(`Failed to retrieve from IndexedDB: ${request.error}`)
        );
    });
  }

  /**
   * Remove an item from IndexedDB
   */
  async remove(key: string): Promise<void> {
    this.throwIfUnavailable();

    if (!key || key.length === 0) {
      return;
    }

    const db = await this.getDatabase();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to remove from IndexedDB: ${request.error}`));
    });
  }

  /**
   * Clear all items from IndexedDB
   */
  async clear(): Promise<void> {
    this.throwIfUnavailable();

    const db = await this.getDatabase();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error(`Failed to clear IndexedDB: ${request.error}`));
    });
  }

  /**
   * Close the database connection
   * Should be called when done with the service
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
