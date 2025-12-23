/**
 * Type definitions for data migration system
 * @module MigrationTypes
 */

// Re-export VersionMetadata types for convenience
export type { VersionMetadata, MigrationRecord } from "./VersionMetadata.js";

/**
 * Function that migrates items from one version to the next
 * @template T - The type of items being migrated
 * @param items - Items at the previous version
 * @returns Migrated items (can be async)
 */
export type MigrationFunction<T> = (items: T[]) => T[] | Promise<T[]>;

/**
 * Map of version numbers to their migration functions
 * Keys represent the target version, values are the migration functions
 *
 * @example
 * ```typescript
 * const migrations: MigrationMap<Order> = {
 *   2: (items) => items.map(item => ({ ...item, status: 'pending' })),
 *   3: async (items) => {
 *     // Async migration
 *     return Promise.all(items.map(async item => ({
 *       ...item,
 *       total: await convertCurrency(item.total)
 *     })));
 *   }
 * };
 * ```
 */
export type MigrationMap<T = any> = {
  [toVersion: number]: MigrationFunction<T>;
};

/**
 * Configuration options for data versioning and migration
 */
export interface MigrationConfig<T = any> {
  /** Current schema version (default: 1) */
  version?: number;

  /** Map of migration functions keyed by target version */
  migrations?: MigrationMap<T>;

  /** Callback invoked when migration starts */
  onMigrationStart?: (fromVersion: number, toVersion: number) => void;

  /** Callback invoked when migration completes successfully */
  onMigrationComplete?: (
    fromVersion: number,
    toVersion: number,
    itemCount: number
  ) => void;

  /** Callback invoked when migration encounters an error */
  onMigrationError?: (
    fromVersion: number,
    toVersion: number,
    error: Error
  ) => void;

  /** Whether to automatically run migrations on retrieve (default: true) */
  autoMigrate?: boolean;
}
