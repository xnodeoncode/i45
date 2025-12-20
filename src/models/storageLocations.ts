/**
 * Storage location constants for browser storage types
 */
export enum StorageLocations {
  SessionStorage = "sessionStorage",
  LocalStorage = "localStorage",
}

export type StorageLocation = `${StorageLocations}`;
