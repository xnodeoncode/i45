/**
 * Validation Utilities
 * Shared validation logic for storage operations
 */

import { StorageLocations, StorageLocation } from "../models/storageLocations";
import { StorageKeyError } from "../errors/StorageKeyError";
import { StorageLocationError } from "../errors/StorageLocationError";

/**
 * Validation utilities class
 */
export class ValidationUtils {
  /**
   * Validate storage key
   * @param key - The storage key to validate
   * @throws {StorageKeyError} If key is invalid
   */
  static validateStorageKey(key: string): void {
    if (typeof key !== "string") {
      throw new StorageKeyError(
        key,
        `Expected a string, but got ${typeof key}`
      );
    }

    if (!key || key.trim().length === 0) {
      throw new StorageKeyError(
        key,
        "Storage key cannot be empty or whitespace only"
      );
    }
  }

  /**
   * Validate storage location
   * @param location - The storage location to validate
   * @throws {StorageLocationError} If location is invalid
   */
  static validateStorageLocation(location: StorageLocation): void {
    if (typeof location !== "string") {
      throw new StorageLocationError(
        String(location),
        Object.values(StorageLocations)
      );
    }

    if (!Object.values(StorageLocations).includes(location as any)) {
      throw new StorageLocationError(location, Object.values(StorageLocations));
    }
  }

  /**
   * Validate array input
   * @param items - The items to validate
   * @param paramName - The parameter name for error messages
   * @throws {TypeError} If items is not an array
   */
  static validateArray<T>(items: T[], paramName: string = "items"): void {
    if (items === null || items === undefined) {
      throw new TypeError(`${paramName} cannot be null or undefined`);
    }

    if (!Array.isArray(items)) {
      throw new TypeError(`${paramName} must be an array`);
    }
  }

  /**
   * Check if key is a reserved storage location name
   * @param key - The key to check
   * @returns True if key is reserved
   */
  static isReservedKey(key: string): boolean {
    return Object.values(StorageLocations).includes(key as any);
  }

  /**
   * Sanitize storage key
   * @param key - The key to sanitize
   * @returns Sanitized key
   */
  static sanitizeKey(key: string): string {
    return key.trim();
  }
}
