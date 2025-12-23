/**
 * MigrationManager - Handles data schema versioning and migrations
 * @module MigrationManager
 */

import type {
  MigrationConfig,
  MigrationMap,
} from "../models/MigrationTypes.js";
import type {
  VersionMetadata,
  MigrationRecord,
} from "../models/VersionMetadata.js";
import {
  createVersionedData,
  isVersionedData,
  getDataVersion,
} from "../models/VersionMetadata.js";
import { MigrationError } from "../errors/MigrationError.js";

/**
 * Manages data versioning and sequential migrations
 * @template T - The type of items being migrated
 */
export class MigrationManager<T> {
  private currentVersion: number;
  private migrations: MigrationMap<T>;
  private config: MigrationConfig<T>;

  /**
   * Creates a new MigrationManager
   * @param config - Migration configuration
   */
  constructor(config: MigrationConfig<T>) {
    this.currentVersion = config.version !== undefined ? config.version : 1;
    this.migrations = config.migrations || {};
    this.config = config;

    this.validateConfig();
  }

  /**
   * Migrates data from its current version to the target version
   * @param data - Raw data (versioned or unversioned)
   * @returns Migrated versioned data
   * @throws {MigrationError} If migration fails or configuration is invalid
   */
  async migrate(data: any): Promise<VersionMetadata<T>> {
    // Handle empty or null data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return createVersionedData([], this.currentVersion);
    }

    // Check if data is already versioned
    if (!isVersionedData(data)) {
      // Legacy unversioned data - treat as v1
      data = createVersionedData(data, 1);
    }

    const fromVersion = data.version;
    const toVersion = this.currentVersion;

    // No migration needed
    if (fromVersion === toVersion) {
      return data;
    }

    // Check if downgrade is attempted
    if (fromVersion > toVersion) {
      throw new MigrationError(
        `Cannot downgrade from v${fromVersion} to v${toVersion}. Data version is newer than application version.`
      );
    }

    // Notify migration start
    this.config.onMigrationStart?.(fromVersion, toVersion);

    const startTime = Date.now();
    let items = data.items;

    try {
      // Run migrations sequentially from fromVersion+1 to toVersion
      for (let version = fromVersion + 1; version <= toVersion; version++) {
        const migration = this.migrations[version];

        if (!migration) {
          throw new MigrationError(
            `Missing migration function for version ${version}. Cannot migrate from v${fromVersion} to v${toVersion}.`
          );
        }

        // Execute migration (supports both sync and async)
        items = await Promise.resolve(migration(items));

        // Validate migration result
        if (!Array.isArray(items)) {
          throw new MigrationError(
            `Migration to v${version} did not return an array. Got: ${typeof items}`
          );
        }
      }

      const duration = Date.now() - startTime;

      // Create migration record
      const migrationRecord: MigrationRecord = {
        fromVersion,
        toVersion,
        timestamp: new Date().toISOString(),
        itemCount: items.length,
        duration,
      };

      // Notify migration complete
      this.config.onMigrationComplete?.(fromVersion, toVersion, items.length);

      // Return updated versioned data
      return {
        version: toVersion,
        items,
        migratedAt: migrationRecord.timestamp,
        migrationHistory: [...(data.migrationHistory || []), migrationRecord],
      };
    } catch (error) {
      // Notify migration error
      this.config.onMigrationError?.(fromVersion, toVersion, error as Error);

      // Re-throw as MigrationError if not already
      if (error instanceof MigrationError) {
        throw error;
      }

      throw new MigrationError(
        `Migration failed from v${fromVersion} to v${toVersion}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Checks if migration is needed for the given data
   * @param data - Data to check
   * @returns True if migration is needed
   */
  needsMigration(data: any): boolean {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return false; // Empty data doesn't need migration
    }

    const dataVersion = getDataVersion(data);
    return dataVersion < this.currentVersion;
  }

  /**
   * Gets the current target version
   * @returns Current version number
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Gets the version of the provided data
   * @param data - Data to check
   * @returns Version number
   */
  getDataVersion(data: any): number {
    return getDataVersion(data);
  }

  /**
   * Validates the migration configuration
   * @throws {MigrationError} If configuration is invalid
   */
  private validateConfig(): void {
    if (this.currentVersion < 1) {
      throw new MigrationError(
        `Invalid version: ${this.currentVersion}. Version must be >= 1.`
      );
    }

    // No migrations needed for version 1
    if (this.currentVersion === 1) {
      return;
    }

    // Check that all migration functions are actually functions
    for (const [version, migration] of Object.entries(this.migrations)) {
      if (typeof migration !== "function") {
        throw new MigrationError(
          `Migration for version ${version} is not a function. Got: ${typeof migration}`
        );
      }
    }

    // Note: We don't validate that all migrations exist in the chain here
    // because users might be at version 3 but only have migration 3 defined
    // (if they never stored data at version 1 or 2). We'll validate the
    // migration path when actually migrating in the migrate() method.
  }
}
