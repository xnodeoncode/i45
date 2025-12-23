/**
 * Storage Service Interface
 * Defines the contract that all storage services must implement
 */

import type { StorageItem } from "../../models/StorageItem";

/**
 * Interface for storage service implementations
 * All storage operations are async to support both sync (localStorage/sessionStorage)
 * and async (IndexedDB) storage mechanisms
 */
export interface IStorageService {
  /**
   * Save a storage item
   * @param key - The storage key
   * @param value - The value to store
   */
  save(key: string, value: string): Promise<void>;

  /**
   * Retrieve a storage item
   * @param key - The storage key
   * @returns The stored item or null if not found
   */
  retrieve(key: string): Promise<StorageItem | null>;

  /**
   * Remove a storage item
   * @param key - The storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;

  /**
   * Check if storage is available
   * @returns True if storage is available, false otherwise
   */
  isAvailable(): boolean;
}
