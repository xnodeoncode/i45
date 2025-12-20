/**
 * Storage Service Interface
 * Defines the contract that all storage services must implement
 */

import type { StorageItem } from "../../models/storageItem";

/**
 * Interface for storage service implementations
 */
export interface IStorageService {
  /**
   * Save a storage item
   * @param key - The storage key
   * @param value - The value to store
   */
  save(key: string, value: string): void;

  /**
   * Retrieve a storage item
   * @param key - The storage key
   * @returns The stored item or null if not found
   */
  retrieve(key: string): StorageItem | null;

  /**
   * Remove a storage item
   * @param key - The storage key
   */
  remove(key: string): void;

  /**
   * Clear all items from storage
   */
  clear(): void;

  /**
   * Check if storage is available
   * @returns True if storage is available, false otherwise
   */
  isAvailable(): boolean;
}
