/**
 * StorageMetadata - Timestamp tracking and metadata for stored data
 */

/**
 * Metadata wrapper for stored data with automatic timestamp tracking
 */
export interface StorageMetadata<T = any> {
  /** The actual data items being stored */
  items: T[];
  /** ISO 8601 timestamp when data was first created */
  createdAt: string;
  /** ISO 8601 timestamp when data was last updated */
  updatedAt: string;
  /** Number of items in the collection */
  itemCount: number;
  /** Optional version number for tracking changes */
  version?: number;
}

/**
 * Creates a new metadata wrapper for initial data storage
 *
 * @param items - The data items to wrap with metadata
 * @param version - Optional version number (defaults to 1)
 * @returns StorageMetadata object with current timestamps
 *
 * @example
 * const metadata = createMetadata([{ id: 1, name: "Item 1" }]);
 * // { items: [...], createdAt: "2025-12-22T...", updatedAt: "2025-12-22T...", itemCount: 1, version: 1 }
 */
export function createMetadata<T>(
  items: T[],
  version: number = 1
): StorageMetadata<T> {
  const now = new Date().toISOString();
  return {
    items,
    createdAt: now,
    updatedAt: now,
    itemCount: items.length,
    version,
  };
}

/**
 * Updates existing metadata with new items and refreshed timestamp
 * Preserves createdAt, increments version
 *
 * @param existing - The existing metadata object
 * @param newItems - The new data items
 * @returns Updated StorageMetadata with new updatedAt timestamp
 *
 * @example
 * const updated = updateMetadata(existing, [{ id: 2, name: "Item 2" }]);
 * // Keeps original createdAt, updates updatedAt to current time, increments version
 */
export function updateMetadata<T>(
  existing: StorageMetadata<T>,
  newItems: T[]
): StorageMetadata<T> {
  return {
    ...existing,
    items: newItems,
    updatedAt: new Date().toISOString(),
    itemCount: newItems.length,
    version: (existing.version || 1) + 1,
  };
}

/**
 * Checks if data is stored with metadata wrapper
 *
 * @param data - The data to check
 * @returns True if data has metadata structure
 *
 * @example
 * if (hasMetadata(data)) {
 *   console.log('Created:', data.createdAt);
 * }
 */
export function hasMetadata(data: any): data is StorageMetadata {
  return (
    data !== null &&
    typeof data === "object" &&
    "items" in data &&
    "createdAt" in data &&
    "updatedAt" in data &&
    "itemCount" in data &&
    Array.isArray(data.items)
  );
}

/**
 * Extracts just the metadata info without the items
 *
 * @param metadata - Full metadata object
 * @returns Metadata info without items array
 *
 * @example
 * const info = getMetadataInfo(fullMetadata);
 * // { createdAt: "...", updatedAt: "...", itemCount: 10, version: 5 }
 */
export function getMetadataInfo<T>(
  metadata: StorageMetadata<T>
): Omit<StorageMetadata<T>, "items"> {
  const { items, ...info } = metadata;
  return info;
}

/**
 * Checks if data has been modified since a given timestamp
 *
 * @param metadata - The metadata object to check
 * @param sinceTimestamp - ISO 8601 timestamp to compare against
 * @returns True if data was modified after the given timestamp
 *
 * @example
 * const lastSync = "2025-12-22T10:00:00Z";
 * if (isModifiedSince(metadata, lastSync)) {
 *   // Sync this data
 * }
 */
export function isModifiedSince(
  metadata: Pick<StorageMetadata<any>, "updatedAt">,
  sinceTimestamp: string
): boolean {
  const updatedTime = new Date(metadata.updatedAt).getTime();
  const sinceTime = new Date(sinceTimestamp).getTime();
  return updatedTime > sinceTime;
}

/**
 * Checks if data is older than a given number of milliseconds
 *
 * @param metadata - The metadata object to check
 * @param maxAgeMs - Maximum age in milliseconds
 * @returns True if data is stale (older than maxAgeMs)
 *
 * @example
 * const ONE_HOUR = 60 * 60 * 1000;
 * if (isStale(metadata, ONE_HOUR)) {
 *   console.log('Data is over 1 hour old');
 * }
 */
export function isStale(
  metadata: Pick<StorageMetadata<any>, "updatedAt">,
  maxAgeMs: number
): boolean {
  const now = Date.now();
  const updatedTime = new Date(metadata.updatedAt).getTime();
  const age = now - updatedTime;
  return age > maxAgeMs;
}

/**
 * Calculates the age of the data in milliseconds
 *
 * @param metadata - The metadata object
 * @returns Age in milliseconds since last update
 *
 * @example
 * const ageMs = getAge(metadata);
 * const ageMinutes = Math.floor(ageMs / 1000 / 60);
 * console.log(`Data is ${ageMinutes} minutes old`);
 */
export function getAge(
  metadata: Pick<StorageMetadata<any>, "updatedAt">
): number {
  const now = Date.now();
  const updatedTime = new Date(metadata.updatedAt).getTime();
  return now - updatedTime;
}
