import { StorageLocations, StorageLocation } from "./storageLocations";

/**
 * Database settings configuration interface
 */
export interface DatabaseSettings {
  databaseName: string;
  databaseVersion: number;
  tableName: string;
  primaryKeyField: string;
  storageLocation: StorageLocation;
}

/**
 * Create database settings with defaults
 */
export function createDatabaseSettings(
  databaseName: string = "ItemStore",
  databaseVersion: number = 1,
  tableName: string = "Items",
  primaryKeyField: string = "id",
  storageLocation: StorageLocation = StorageLocations.LocalStorage
): DatabaseSettings {
  return {
    databaseName,
    databaseVersion,
    tableName,
    primaryKeyField,
    storageLocation,
  };
}
