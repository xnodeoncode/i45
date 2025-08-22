/**
 * @module PersistenceTypes models/persistenceTypes
 * @description This module exports the persistence types.
 * @deprecated This module is deprecated in favor of using StorageLocations.
 *
 */
export const PersistenceTypes = Object.freeze({
  CookieStore: "cookieStore",
  SessionStorage: "sessionStorage",
  LocalStorage: "localStorage",
  indexedDB: "indexedDB",
});
