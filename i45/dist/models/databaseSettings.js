import { PersistenceTypes } from "./persistenceTypes.js";
export { PersistenceTypes };

/**
 * @class DatabaseSettings
 * @property {string} databaseName - The name of the database.
 * @property {int} databaseVersion - The version of the database being used.
 * @property {string} tableName - The name of the table used to store data.
 * @property {string} primaryKeyField - The name of the field/property used to store key values.
 * @property {string} persistenceType - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 *
 * @constructor
 * @param {string} databaseName - The name of the database.
 * @param {int} databaseVersion - The version of the database being used.
 * @param {string} tableName - The name of the table used to store data.
 * @param {string} primaryKeyField - The name of the field/property used to store key values.
 * @param {string} persistenceType - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 *
 * @example
 * let settings = new DatabaseSettings("MyDatabase", 1, "MyTable", "id", PersistenceTypes.localStorage);
 * console.log(settings.databaseName); // "MyDatabase"
 * console.log(settings.databaseVersion); // 1
 * console.log(settings.tableName); // "MyTable"
 * console.log(settings.primaryKeyField); // "id"
 * console.log(settings.persistenceType); // "cookieStore"
 *
 * @example
 * let settings = new DatabaseSettings();
 * console.log(settings.databaseName); // "ItemStore"
 * console.log(settings.databaseVersion); // 1
 * console.log(settings.tableName); // "Items"
 * console.log(settings.primaryKeyField); // "id"
 * console.log(settings.persistenceType); // "localStorage"
 *
 * @returns {DatabaseSettings} - A new instance of DatabaseSettings with the specified properties.
 */
export class DatabaseSettings {
  constructor(
    databaseName,
    databaseVersion,
    tableName,
    primaryKeyField,
    persistenceType
  ) {
    this.databaseName = databaseName || "ItemStore";
    this.databaseVersion = databaseVersion || 1;
    this.tableName = tableName || "Items";
    this.primaryKeyField = primaryKeyField || "id";
    this.persistenceType = persistenceType || PersistenceTypes.CookieStore;
  }
}
