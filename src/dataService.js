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
 * @property {string} databaseName - The name of the database.
 * @property {int} databaseVersion - The version of the database being used.
 * @property {string} tableName - The name of the table used to store data.
 * @property {string} primaryKeyField - The name of the field/property used to store key values.
 * @property {string} persistenceType - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 * @property {DatabaseSettings} databaseDefaults - The default settings for the database.
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
  #databaseDefaults;
  #databaseName;
  #databaseVersion;
  #tableName;
  #primaryKeyField;
  #persistenceType;

  constructor(databaseSettings) {
    this.#databaseDefaults = new DatabaseSettings();
    if (databaseSettings instanceof DatabaseSettings) {
      this.#databaseName = databaseSettings.databaseName;
      this.#databaseVersion = databaseSettings.databaseVersion;
      this.#tableName = databaseSettings.tableName;
      this.#primaryKeyField = databaseSettings.primaryKeyField;
      this.#persistenceType = databaseSettings.persistenceType;
    } else {
      this.#databaseName = this.#databaseDefaults.databaseName;
      this.#databaseVersion = this.#databaseDefaults.databaseVersion;
      this.#tableName = this.#databaseDefaults.tableName;
      this.#primaryKeyField = this.#databaseDefaults._primaryKeyField;
      this.#persistenceType = this.#databaseDefaults.persistenceType;
    }
  }

  async retrieve(databaseSettings) {
    let data = [];

    if (arguments.length === 0) {
      data = await this.#retrieveItems();
    } else if (
      arguments.length === 1 &&
      databaseSettings instanceof DatabaseSettings
    ) {
      data = await this.#retrieveItemsWithProperties(databaseSettings);
    }
    return data;
  }

  /*************************************************************************************
   * Retrieves data from persistence layer and returns an array.
   ************************************************************************************/
  async #retrieveItems() {
    let data = [];
    let storageItem = new StorageItem();

    switch (this.#persistenceType) {
      //retrieve from cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        storageItem = cookieService.retrieve(this.#tableName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from localStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        storageItem = localStorageService.retrieve(this.#databaseName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        storageItem = sessionStorageService.retrieve(this.#databaseName);
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
  async #retrieveItemsWithProperties(databaseSettings) {
    let data = [];
    let storageItem = new StorageItem();

    switch (databaseSettings.persistenceType) {
      //retrieve from cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        storageItem = cookieService.retrieve(databaseSettings.tableName);
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        storageItem = localStorageService.retrieve(
          databaseSettings.databaseName
        );
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      //retrieve from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        storageItem = sessionStorageService.retrieve(
          databaseSettings.databaseName
        );
        if (storageItem != null) data = JSON.parse(storageItem.Value);
        break;

      default:
        break;
    }

    return data;
  }

  async persist(databaseSettings, items) {
    switch (arguments.length) {
      case 1:
        if (Array.isArray(arguments[0])) {
          this.#persistItems(arguments[0]);
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
          this.#persistItemsWithProperties(databaseSettings, items);
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
  async #persistItems(items) {
    switch (this.#persistenceType) {
      //persist to Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        let cookieData = JSON.stringify(items);
        cookieService.save(this.#tableName, cookieData);
        break;

      //persist to LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.save(this.#databaseName, JSON.stringify(items));
        break;

      //persist to sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.save(this.#databaseName, JSON.stringify(items));
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
  async #persistItemsWithProperties(databaseSettings, items) {
    switch (databaseSettings.persistenceType) {
      //persist to Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        let cookieData = JSON.stringify(items);
        cookieService.save(databaseSettings.tableName, cookieData);
        break;

      //persist to LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.save(
          databaseSettings.databaseName,
          JSON.stringify(items)
        );
        break;

      //persist to sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.save(
          databaseSettings.databaseName,
          JSON.stringify(items)
        );
        break;

      default:
        break;
    }
  }

  async clear(databaseSettings) {
    switch (arguments.length) {
      case 0:
        this.removeItems();
        break;
      case 1:
        if (databaseSettings instanceof DatabaseSettings) {
          this.#removeItemsWithProperties(databaseSettings);
        } else {
          console.error(
            "DatabaseProperties must be an instance of DatabaseSettings."
          );
        }
        break;
      default:
        console.warn(
          "Invalid arguments. Please provide databaseProperties as an instance of DatabaseSettings."
        );
        break;
    }
  }

  async #removeItems() {
    switch (this.#persistenceType) {
      //remove from Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        cookieService.remove(this.#tableName);
        break;

      //remove from LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.remove(this.#databaseName);
        break;

      //remove from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.remove(this.#databaseName);
        break;

      default:
        break;
    }
  }

  async #removeItemsWithProperties(databaseSettings) {
    switch (databaseSettings.persistenceType) {
      //remove from Cookie service
      case PersistenceTypes.CookieStore:
        let cookieService = new CookieService();
        cookieService.remove(databaseSettings.tableName);
        break;

      //remove from LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.remove(databaseSettings.databaseName);
        break;

      //remove from sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.remove(databaseSettings.databaseName);
        break;

      default:
        break;
    }
  }
}
