/**
 * Version metadata for tracking data schema versions and migration history
 * @module VersionMetadata
 */

/**
 * Record of a single migration execution
 */
export interface MigrationRecord {
  /** Source version migrated from */
  fromVersion: number;
  /** Target version migrated to */
  toVersion: number;
  /** ISO timestamp when migration occurred */
  timestamp: string;
  /** Number of items migrated */
  itemCount: number;
  /** Migration duration in milliseconds */
  duration: number;
}

/**
 * Wrapper for versioned data with migration tracking
 * @template T - The type of items being stored
 */
export interface VersionMetadata<T> {
  /** Current schema version */
  version: number;
  /** The actual data items */
  items: T[];
  /** ISO timestamp of last migration (if any) */
  migratedAt?: string;
  /** History of all migrations performed */
  migrationHistory?: MigrationRecord[];
}

/**
 * Creates a versioned data structure
 * @template T - The type of items being stored
 * @param items - Data items to version
 * @param version - Schema version number
 * @returns Versioned data structure
 */
export function createVersionedData<T>(
  items: T[],
  version: number
): VersionMetadata<T> {
  return {
    version,
    items,
    migrationHistory: [],
  };
}

/**
 * Type guard to check if data is versioned
 * @param data - Data to check
 * @returns True if data has version metadata
 */
export function isVersionedData(data: any): data is VersionMetadata<any> {
  return !!(
    data &&
    typeof data === "object" &&
    "version" in data &&
    typeof data.version === "number" &&
    "items" in data &&
    Array.isArray(data.items)
  );
}

/**
 * Extracts items from versioned or unversioned data
 * @template T - The type of items
 * @param data - Data to extract from
 * @returns Array of items
 */
export function extractItems<T>(data: any): T[] {
  if (isVersionedData(data)) {
    return data.items;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

/**
 * Gets the version number from data
 * @param data - Data to check
 * @returns Version number (defaults to 1 for unversioned data)
 */
export function getDataVersion(data: any): number {
  if (isVersionedData(data)) {
    return data.version;
  }
  return 1; // Legacy unversioned data is treated as v1
}
