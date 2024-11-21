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

import { DatabaseSettings } from "./models/databaseSettings.js";

export { DatabaseSettings };

/*************************************************************************************
 * PeristenceTypes provides a strongly typed interface to the types of persistence
 * services that are available to the application.
 ************************************************************************************/
import { PersistenceTypes } from "./models/persistenceTypes.js";
export { PersistenceTypes };

/*************************************************************************************
 * The DataContext class definition.
 * persistenceType: The persistenceType to be used for storage.
 * databaseName: The name for the database.
 * databaseVersion: The version of the database to be used.
 * objectStoreName: The name of the specific object store being used.
 * keyPathField: The object's field or property that will be used for key values.
 ************************************************************************************/
export class DataContext {
  constructor(
    databaseName,
    databaseVersion,
    objectStoreName,
    keyPathField,
    persistenceType
  ) {
    this._databaseDefaults = new DatabaseSettings(
      (databaseName = "myDatabase"),
      (databaseVersion = 1),
      (objectStoreName = "myObjectStore"),
      (keyPathField = "id"),
      (persistenceType = PersistenceTypes.CookieStore)
    );
    this._databaseName = databaseName || this._databaseDefaults.databaseName;
    this._databaseVersion =
      databaseVersion || this._databaseDefaults.databaseVersion;
    this._objectStoreName =
      objectStoreName || this._databaseDefaults.objectStoreName;
    this._keyPathField = keyPathField || this._databaseDefaults.keyPathField;
    this._persistenceType =
      persistenceType || this._databaseDefaults.persistenceType;
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
        storageItem = cookieService.retrieve(this._objectStoreName);
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
        storageItem = cookieService.retrieve(
          databaseProperties.objectStoreName
        );
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
          typeof arguments[0] === DatabaseSettings
        ) {
          this.persistItemsWithProperties(arguments[0], aruguements[1]);
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
        cookieService.save(this._objectStoreName, cookieData);
        break;

      //persist to LocalStorage service
      case PersistenceTypes.LocalStorage:
        var localStorageService = new LocalStorageService();
        localStorageService.save(this._database, JSON.stringify(items));
        break;

      //persist to sessionStorage service
      case PersistenceTypes.SessionStorage:
        var sessionStorageService = new SessionStorageService();
        sessionStorageService.save(this._database, JSON.stringify(items));
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
        cookieService.save(databaseProperties.objectStoreName, cookieData);
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
