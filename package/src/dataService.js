/*************************************************************************************
 * Service provider to manage storing values to various data stores using custom
 * services.
 *************************************************************************************/

/*************************************************************************************
 * Import the SessionStorage service in order to persist to window.sessionStorage.
 ************************************************************************************/
import { SessionStorageService } from "./services/sessionStorageService.js";

/*************************************************************************************
 * Import the LocalStorage service in order to persist to window.localStorage.
 ************************************************************************************/
import { LocalStorageService } from "./services/localStorageService.js";

/*************************************************************************************
 * Import the CookieStorage service in order to persist to document.cookie.
 ************************************************************************************/
import { CookieService } from "./services/cookieService.js";

/*************************************************************************************
 * Import StorageItem class for a strongly typed storage object.
 ************************************************************************************/
import { StorageItem } from "./models/storageItem.js";

/**
 * Import the DatabaseSettings class to provide strongly typed settings for the database.
 * Import the PersistenceTypes enum to provide strongly typed values for the persistence types.
 */
import {
  DatabaseSettings,
  PersistenceTypes,
} from "./models/databaseSettings.js";

/**
 * Export the DatabaseSettings and PersistenceTypes classes for use with this datacontext in consuming modules.
 */
export { DatabaseSettings, PersistenceTypes };

/**
 * @class DataContext
 * @property {string} _databaseName - The name of the database.
 * @property {int} _databaseVersion - The version of the database being used.
 * @property {string} _tableName - The name of the table used to store data.
 * @property {string} _primaryKeyField - The name of the field/property used to store key values.
 * @property {string} _persistenceType - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 * @property {DatabaseSettings} _databaseDefaults - The default settings for the database.
 *
 * @constructor
 * @param {DatabaseSettings} databaseSettings - The settings to be used for the database.
 *
 * @example
 * let settings = new DatabaseSettings("MyDatabase", 1, "MyTable", "id", PersistenceTypes.localStorage);
 * let context = new DataContext(settings);
 * console.log(context._databaseName); // "MyDatabase"
 * console.log(context._databaseVersion); // 1
 * console.log(context._tableName); // "MyTable"
 * console.log(context._primaryKeyField); // "id"
 * console.log(context._persistenceType); // "localStorage"
 */
export class DataContext {
  constructor(databaseSettings) {
    this._databaseDefaults = new DatabaseSettings();
    if (databaseSettings instanceof DatabaseSettings) {
      this._databaseName = databaseSettings.databaseName;
      this._databaseVersion = databaseSettings.databaseVersion;
      this._tableName = databaseSettings.tableName;
      this._primaryKeyField = databaseSettings.primaryKeyField;
      this._persistenceType = databaseSettings.persistenceType;
    } else {
      this._databaseName = this._databaseDefaults.databaseName;
      this._databaseVersion = this._databaseDefaults.databaseVersion;
      this._tableName = this._databaseDefaults.tableName;
      this._primaryKeyField = this._databaseDefaults._primaryKeyField;
      this._persistenceType = this._databaseDefaults.persistenceType;
    }
  }

  async retrieve(databaseProperties) {
    let data = [];

    if (arguments.length === 0) {
      data = await this.retrieveItems();
    } else if (
      arguments.length === 1 &&
      databaseProperties instanceof DatabaseSettings
    ) {
      data = await this.retrieveItemsWithProperties(databaseProperties);
    }
    return data;
  }

  /*************************************************************************************
   * Retrieves data from persistence layer and returns an array.
   ************************************************************************************/
  async retrieveItems() {
    let data = [];
    let storageItem = new StorageItem();

    switch (this._persistenceType) {
      //retrieve from cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        storageItem = cookieService.retrieve(this._tableName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from localStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        storageItem = localStorageService.retrieve(this._databaseName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        storageItem = sessionStorageService.retrieve(this._databaseName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      default:
        break;
    }
    return data;
  }

  /*************************************************************************************
   * Retrieves data from persistence store and returns an array.
   * DatabaseProperties: The database settings to be used when storing the items.
   ************************************************************************************/
  async retrieveItemsWithProperties(databaseProperties) {
    let data = [];
    let storageItem = new StorageItem();

    switch (databaseProperties.persistenceType) {
      //retrieve from cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        storageItem = cookieService.retrieve(databaseProperties.tableName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        storageItem = localStorageService.retrieve(
          databaseProperties.databaseName
        );
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        storageItem = sessionStorageService.retrieve(
          databaseProperties.databaseName
        );
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      default:
        break;
    }

    return data;
  }

  async persist(databaseProperties, items) {
    switch (arguments.length) {
      case 1:
        if (Array.isArray(arguments[0])) {
          this.persistItems(arguments[0]);
        } else {
          console.error(
            "Items must be an array of objects or values.",
            arguments[0]
          );
        }
        break;
      case 2:
        if (
          Array.isArray(arguments[1]) &&
          arguments[0] instanceof DatabaseSettings
        ) {
          this.persistItemsWithProperties(databaseProperties, items);
        } else {
          console.error(
            "Items must be an array of objects or values. DatabaseProperties must be an instance of DatabaseSettings."
          );
        }
        break;
      default:
        console.warn(
          "Invalid arguments. Please provide databaseProperties as an instance of DatabaseSettings and/or an array of items."
        );
        break;
    }
  }

  /*************************************************************************************
   * Saves items to the data store based on properties set in service initialization.
   * Items: The array of objects or values to be stored.
   ************************************************************************************/
  async persistItems(items) {
    switch (this._persistenceType) {
      //persist to Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        let cookieData = JSON.stringify(items);
        cookieService.save(this._tableName, cookieData);
        break;

      //persist to LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.save(this._databaseName, JSON.stringify(items));
        break;

      //persist to sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.save(this._databaseName, JSON.stringify(items));
        break;

      default:
        break;
    }
  }

  /*************************************************************************************
   * Saves items to the data store based on database properties object that is passed in.
   * DatabaseProperties: The database settings to be used when storing the items.
   * Items: The array of objects or values to be stored.
   ************************************************************************************/
  async persistItemsWithProperties(databaseProperties, items) {
    switch (databaseProperties.persistenceType) {
      //persist to Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        let cookieData = JSON.stringify(items);
        cookieService.save(databaseProperties.tableName, cookieData);
        break;

      //persist to LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.save(
          databaseProperties.databaseName,
          JSON.stringify(items)
        );
        break;

      //persist to sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.save(
          databaseProperties.databaseName,
          JSON.stringify(items)
        );
        break;

      default:
        break;
    }
  }
}
