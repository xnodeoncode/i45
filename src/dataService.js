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
 * Import the SampleData class to provide sample data for testing and development.
 ************************************************************************************/
import { SampleData } from "i45-sample-data";

/*************************************************************************************
 * Import StorageLocations enum for strongly typed storage location values.
 ************************************************************************************/
import { StorageLocations } from "./models/storageLocations.js";

/*************************************************************************************
 * Import the Logger service for logging events and errors.
 ************************************************************************************/
import { Logger, iLogger, iLoggerValidator } from "i45-jslogger";

/**
 * Export the DatabaseSettings and PersistenceTypes classes for use with this datacontext in consuming modules.
 */
export { SampleData, StorageLocations, iLogger, iLoggerValidator, Logger };

/**
 * @class DataContext
 * @property {string} storageKey - The key used to store data. Defaults to "Items". Replaces the deprecated dataStoreName property.
 * @property {string} storageLocation - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 *
 * @constructor
 * @param {string} storageKey - The settings to be used for the database.
 * @param {StorageLocation} storageLocation - The location for browser storage. Local storage or session storage.
 *
 * @example
 * let context = new DataContext();
 * let currentSettings = context.getCurrentSettings();
 * console.log(currentSettings.storageKey); // "Items"
 * console.log(currentSettings.storageLocation); // "localStorage"
 */
export class DataContext {
  // private fields
  #dataStoreName;
  #storageKey;
  #storageLocation;
  #dataStores;

  #loggerService;
  #localStorageService;
  #sessionStorageService;

  #logActions = {
    Store: "STORE",
    Retrieve: "RETRIEVE",
    Remove: "REMOVE",
  };

  #loggingEnabled = false;

  constructor(
    storageKey = "Items",
    storageLocation = StorageLocations.LocalStorage
  ) {
    this.#storageKey = storageKey;
    this.#storageLocation = storageLocation;
    this.#dataStores = [];

    this.#loggerService = new Logger();
    this.#localStorageService = new LocalStorageService();
    this.#sessionStorageService = new SessionStorageService();

    return this;
  }

  get loggingEnabled() {
    return this.#loggingEnabled;
  }
  set loggingEnabled(value) {
    if (typeof value !== "boolean") {
      this.#error(`Expected a boolean, but got ${typeof value}`, true, [
        {
          data: value,
        },
      ]);
    }
    this.#loggingEnabled = value;
  }

  getCurrentSettings() {
    var settings = {
      storageKey: this.#storageKey,
      storageLocation: this.#storageLocation,
    };

    var currentLoggingSetting = this.#loggingEnabled;
    this.#loggingEnabled = true;
    this.#info(
      `Current dataContext settings: ${window.location.href.split("/").pop()}`,
      JSON.stringify(settings)
    );
    this.#loggingEnabled = currentLoggingSetting;
    return settings;
  }

  getData() {
    var currentLoggingSetting = this.#loggingEnabled;
    this.#loggingEnabled = true;
    this.#info("Current data:", this.#dataStores);
    this.#loggingEnabled = currentLoggingSetting;
    return [...this.#dataStores];
  }

  /****************************************************************
   * Enables or disables logging for the DataContext instance.
   * @deprecated This method will be removed in future versions. Use the loggingEnabled property instead.
   * @param {boolean} value - Set to true to enable logging, false to disable.
   * @returns {DataContext} - The current DataContext instance.
   ***************************************************************
   */
  enableLogging(value = false) {
    if (typeof value !== "boolean") {
      this.#error(`Expected a boolean, but got ${typeof value}`, true, [
        {
          data: value,
        },
      ]);
    }
    this.#loggingEnabled = value;
    this.#info(`Logging ${value ? "enabled" : "disabled"}.`);
    return this;
  }

  printLog() {
    if (
      !Object.hasOwn(this.#loggerService, "getEvents") ||
      typeof this.#loggerService.getEvents !== "function"
    ) {
      this.#warn("Logger does not implement getEvents() method.");
      return [];
    }
    var currentLoggingSetting = this.#loggingEnabled;
    this.#loggingEnabled = true;
    this.#info("Printing log history");
    console.log(this.#loggerService.getEvents());
    this.#loggingEnabled = currentLoggingSetting;

    return [...this.#loggerService.getEvents()];
  }

  /*****************************************************************
   * Registers a custom logger that implements the iLogger interface.
   * If the provided logger does not implement the interface, the
   * default logger will be used instead.
   * @deprecated This method will be removed in future versions. Use addClient() instead.
   * @param {iLogger} myLogger - The custom logger to be used.
   * @returns {DataContext} - The current DataContext instance.
   ****************************************************************
   */
  registerLogger(myLogger) {
    if (iLoggerValidator.isValid(myLogger, iLogger)) {
      this.#loggerService = myLogger;

      var currentLoggingSetting = this.#loggingEnabled;
      this.#loggingEnabled = true;
      this.#info("New logger registered successfully.");
      this.#loggingEnabled = currentLoggingSetting;
    } else {
      var currentLoggingSetting = this.#loggingEnabled;
      this.#loggingEnabled = true;
      this.#warn(
        "The provided logger does not implement the iLogger interface. Using the default logger instead.",
        true,
        iLogger
      );
      this.#loggingEnabled = currentLoggingSetting;
    }
    return this;
  }

  /*****************************************************************
   * Adds a client that implements the iLogger interface to the
   * current logger service. If the provided client does not
   * implement the interface, a warning will be logged.
   * @param {object} client - The client to be added.
   * @returns {DataContext} - The current DataContext instance.
   ****************************************************************
   */
  addClient(client) {
    if (client && typeof client === "object") {
      try {
        this.#loggerService.addClient(client);

        var currentLoggingSetting = this.#loggingEnabled;
        this.#loggingEnabled = true;
        this.#info("New logger registered successfully from client.");
        this.#loggingEnabled = currentLoggingSetting;
      } catch (e) {
        this.#error("Error adding client to logger service.", false, [
          { Details: e },
        ]);
      }
    } else {
      var currentLoggingSetting = this.#loggingEnabled;
      this.#loggingEnabled = true;
      this.#warn(`Expected an object for client, but got ${typeof client}.`);
      this.#loggingEnabled = currentLoggingSetting;
    }
    return this;
  }

  // public properties
  get storageKey() {
    return this.#storageKey;
  }

  set storageKey(value) {
    if (typeof value !== "string")
      this.#error(`Expected a string, but got ${typeof value}`, true, [
        { data: value },
      ]);

    if (Object.values(StorageLocations).includes(value))
      this.#warn(
        `The storageKey should not be one of the reserved storage locations: ${Object.values(
          StorageLocations
        ).join(", ")}.`
      );
    this.#storageKey = value;
  }

  get storageLocation() {
    return this.#storageLocation;
  }

  set storageLocation(value) {
    if (typeof value !== "string")
      this.#error(`Expected a string, but got ${typeof value}`, true, [
        { data: value },
      ]);
    if (Object.values(StorageLocations).includes(value)) {
      this.#storageLocation = value;
    } else {
      this.#error(
        `The storageLocation must be one of the following: ${Object.values(
          StorageLocations
        ).join(", ")}. Found ${value}.`,
        true,
        [{ data: value }]
      );
    }
  }

  /****************************************************************
   * Sets the name of the data store.
   * @deprecated This method will be removed in future versions. Use the setStorageKey method instead.
   * @param {string} dataStoreName - The name of the data store. Default is "Items".
   * @returns {DataContext} - The current DataContext instance.
   ***************************************************************
   */
  DataStoreName = function (dataStoreName = "Items") {
    if (typeof dataStoreName !== "string")
      this.#error(`Expected a string, but got ${typeof dataStoreName}`, true, [
        { data: dataStoreName },
      ]);

    if (Object.values(StorageLocations).includes(dataStoreName))
      this.#warn(
        `The dataStoreName should not be one of the reserved storage locations: ${Object.values(
          StorageLocations
        ).join(", ")}.`
      );
    this.#dataStoreName = dataStoreName;
    return this;
  };

  /****************************************************************
   * Sets the name of the data store.
   * @param {string} storageKey - The key used to store items. Default is "Items".
   * @returns {DataContext} - The current DataContext instance.
   ***************************************************************
   */
  setStorageKey = function (storageKey = "Items") {
    if (typeof storageKey !== "string")
      this.#error(`Expected a string, but got ${typeof storageKey}`, true, [
        { data: storageKey },
      ]);

    if (Object.values(StorageLocations).includes(storageKey))
      this.#warn(
        `The storageKey should not be one of the reserved storage locations: ${Object.values(
          StorageLocations
        ).join(", ")}.`
      );
    this.#storageKey = storageKey;
    return this;
  };

  /****************************************************************
   * Sets the storage location for the data store.
   * @deprecated This method will be removed in future versions. Use the setStorageLocation method instead.
   * @param {StorageLocation} storageLocation - The location for browser storage. Default is StorageLocations.LocalStorage.
   * @returns {DataContext} - The current DataContext instance.
   ***************************************************************
   */
  StorageLocation = function (storageLocation = StorageLocations.LocalStorage) {
    if (typeof storageLocation !== "string")
      this.#error(
        `Expected a string, but got ${typeof storageLocation}`,
        true,
        [{ data: storageLocation }]
      );
    if (Object.values(StorageLocations).includes(storageLocation)) {
      this.#storageLocation = storageLocation;
    } else {
      this.#error(
        `The storageLocation must be one of the following: ${Object.values(
          StorageLocations
        ).join(", ")}. Found ${storageLocation}.`,
        true,
        [{ data: storageLocation }]
      );
    }
    return this;
  };

  /****************************************************************
   * Sets the storage location for the data store.
   * @param {StorageLocation} storageLocation - The location for browser storage. Default is StorageLocations.LocalStorage.
   * @returns {DataContext} - The current DataContext instance.
   ***************************************************************
   */
  setStorageLocation = function (
    storageLocation = StorageLocations.LocalStorage
  ) {
    if (typeof storageLocation !== "string")
      this.#error(
        `Expected a string, but got ${typeof storageLocation}`,
        true,
        [{ data: storageLocation }]
      );
    if (Object.values(StorageLocations).includes(storageLocation)) {
      this.#storageLocation = storageLocation;
    } else {
      this.#error(
        `The storageLocation must be one of the following: ${Object.values(
          StorageLocations
        ).join(", ")}. Found ${storageLocation}.`,
        true,
        [{ data: storageLocation }]
      );
    }
    return this;
  };

  async store(
    storageKey = this.#storageKey,
    storageLocation = this.#storageLocation,
    items = []
  ) {
    switch (arguments.length) {
      case 1:
        if (Array.isArray(arguments[0]) && arguments[0].length > 0) {
          this.#storeItems(arguments[0]);
        } else {
          this.#error("Items must be an array of objects or values.", false, [
            { items: arguments[0] },
          ]);
        }
        break;
      case 2:
        if (
          Array.isArray(arguments[1]) &&
          arguments[1].length > 0 &&
          typeof arguments[0] === "string" &&
          !Object.values(StorageLocations).includes(arguments[0])
        ) {
          this.#storeItemsByStorageKey(storageKey, items);
        } else {
          this.#error(
            "Invalid Arguments Error",
            `The storageKey must be a string and cannot be one of the reserved storage locations: ${Object.values(
              StorageLocations
            ).join(", ")}. Items must be an array of objects or values.`,
            false,
            [{ storageKey: arguments[0], items: arguments[1] }]
          );
        }
        break;
      case 3:
        if (
          Array.isArray(arguments[2]) &&
          arguments[2].length > 0 &&
          typeof arguments[0] === "string" &&
          Object.values(StorageLocations).includes(arguments[1])
        ) {
          this.#storeItemsByStorageLocation(storageKey, storageLocation, items);
        } else {
          this.#error(
            "Invalid Arguments Error",
            `StorageKey must be a string. StorageLocation must be one of the following: ${Object.values(
              StorageLocations
            ).join(", ")}. Items must be an array of objects or values.`,
            false,
            [
              {
                storageKey: arguments[0],
                storageLocation: arguments[1],
                items: arguments[2],
              },
            ]
          );
        }
        break;
      default:
        this.#error("Invalid arguments at DataContext store()", true);
    }
    return this;
  }

  async #storeItems(items) {
    switch (this.#storageLocation) {
      //persist to LocalStorage service
      case StorageLocations.LocalStorage:
        this.#localStorageService.save(this.#storageKey, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          this.#storageKey,
          StorageLocations.LocalStorage,
          items
        );
        break;

      //persist to sessionStorage service
      case StorageLocations.SessionStorage:
        this.#sessionStorageService.save(
          this.#storageKey,
          JSON.stringify(items)
        );
        this.#logDataEntry(
          this.#logActions.Store,
          this.#storageKey,
          StorageLocations.SessionStorage,
          items
        );
        break;

      default:
        break;
    }
  }

  /*****************************************************************************
   * Stores items using a specific data store name.
   * @deprecated This method will be removed in future versions. Use storeItemsByStorageKey instead.
   * @param {string} dataStoreName - The name of the data store.
   * @param {Array} items - The items to be stored.
   ****************************************************************************
   */
  async #storeItemsByDataStoreName(dataStoreName, items) {
    switch (this.#storageLocation) {
      //persist to LocalStorage service
      case StorageLocations.LocalStorage:
        this.#localStorageService.save(dataStoreName, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          dataStoreName,
          StorageLocations.LocalStorage,
          items
        );
        break;

      //persist to sessionStorage service
      case StorageLocations.SessionStorage:
        this.#sessionStorageService.save(dataStoreName, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          dataStoreName,
          StorageLocations.SessionStorage,
          items
        );
        break;

      default:
        break;
    }
  }

  /*****************************************************************************
   * Stores items using a specific storage key.
   * @param {string} storageKey - The storage key.
   * @param {Array} items - The items to be stored.
   ****************************************************************************
   */
  async #storeItemsByStorageKey(storageKey, items) {
    switch (this.#storageLocation) {
      //persist to LocalStorage service
      case StorageLocations.LocalStorage:
        this.#localStorageService.save(storageKey, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          storageKey,
          StorageLocations.LocalStorage,
          items
        );
        break;

      //persist to sessionStorage service
      case StorageLocations.SessionStorage:
        this.#sessionStorageService.save(storageKey, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          storageKey,
          StorageLocations.SessionStorage,
          items
        );
        break;

      default:
        break;
    }
  }

  /*****************************************************************************
   * Stores items using a specific storage location.
   * @param {string} storageKey - The key used to store the data.
   * @param {StorageLocation} storageLocation - The storage location.
   * @param {Array} items - The items to be stored.
   ****************************************************************************
   */
  async #storeItemsByStorageLocation(storageKey, storageLocation, items) {
    switch (storageLocation) {
      //persist to LocalStorage service
      case StorageLocations.LocalStorage:
        this.#localStorageService.save(storageKey, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          storageKey,
          StorageLocations.LocalStorage,
          items
        );
        break;

      //persist to sessionStorage service
      case StorageLocations.SessionStorage:
        this.#sessionStorageService.save(storageKey, JSON.stringify(items));
        this.#logDataEntry(
          this.#logActions.Store,
          storageKey,
          StorageLocations.SessionStorage,
          items
        );
        break;

      default:
        break;
    }
  }

  async retrieve(
    storageKey = this.#storageKey,
    storageLocation = this.#storageLocation
  ) {
    let data = [];

    switch (arguments.length) {
      case 0:
        data = await this.#retrieveItems();
        break;
      case 1:
        if (typeof arguments[0] === "string") {
          data = await this.#retrieveItemsByStorageKey(storageKey);
        } else {
          this.#error(
            `Invalid Arguments Error. Expected a string but found type ${typeof arguments[0]}.`,
            false,
            [{ data: arguments[0] }]
          );
        }
        break;
      case 2:
        if (
          typeof arguments[0] === "string" &&
          Object.values(StorageLocations).includes(storageLocation)
        ) {
          data = await this.#retrieveItemsByStorageLocation(
            storageKey,
            storageLocation
          );
        } else {
          this.#error(
            `Invalid Arguments Error. StorageKey must be a string and cannot be one of the reserved storage locations: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. StorageLocation must be one of the following: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. Found types ${typeof arguments[0]} and ${typeof arguments[1]}.`,
            false,
            [{ storageKey: arguments[0], storageLocation: arguments[1] }]
          );
        }
        break;
      default:
        break;
    }
    return data;
  }

  async #retrieveItems() {
    let data = [];
    switch (this.#storageLocation) {
      //retrieve from localStorage service
      case StorageLocations.LocalStorage:
        var result = this.#localStorageService.retrieve(this.#storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Local Storage Error",
            "Unable to retrieve data from local storage service.",
            false,
            [{ Details: e, Result: result }]
          );
        }
        break;

      //retrieve from sessionStorage service
      case StorageLocations.SessionStorage:
        var result = this.#sessionStorageService.retrieve(this.#storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Session Storage Error",
            "Unable to retrieve data from session storage service.",
            false,
            [{ Details: e, Result: result }]
          );
        }
        break;

      default:
        break;
    }
    return data;
  }

  /*****************************************************************************
   * Retrieves items using a specific data store name.
   * @deprecated This method will be removed in future versions. Use retrieveItemsByStorageKey instead.
   * @param {string} dataStoreName - The name of the data store.
   * @returns {Array} - The retrieved items.
   ****************************************************************************
   */
  async #retrieveItemsByDataStoreName(dataStoreName) {
    let data = [];
    switch (this.#storageLocation) {
      //retrieve from localStorage service
      case StorageLocations.LocalStorage:
        var result = this.#localStorageService.retrieve(dataStoreName);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Local Storage Error",
            "Unable to retrieve data from local storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      //retrieve from sessionStorage service
      case StorageLocations.SessionStorage:
        var result = this.#sessionStorageService.retrieve(dataStoreName);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Session Storage Error",
            "Unable to retrieve data from session storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      default:
        break;
    }
    return data;
  }

  /*****************************************************************************
   * Retrieves items using a specific storage key.
   * @param {string} storageKey - The storage key.
   * @returns {Array} - The retrieved items.
   ****************************************************************************
   */
  async #retrieveItemsByStorageKey(storageKey) {
    let data = [];
    switch (this.#storageLocation) {
      //retrieve from localStorage service
      case StorageLocations.LocalStorage:
        var result = this.#localStorageService.retrieve(storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Local Storage Error",
            "Unable to retrieve data from local storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      //retrieve from sessionStorage service
      case StorageLocations.SessionStorage:
        var result = this.#sessionStorageService.retrieve(storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Session Storage Error",
            "Unable to retrieve data from session storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      default:
        break;
    }
    return data;
  }

  async #retrieveItemsByStorageLocation(storageKey, storageLocation) {
    let data = [];
    switch (storageLocation) {
      //retrieve from localStorage service
      case StorageLocations.LocalStorage:
        var result = this.#localStorageService.retrieve(storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Local Storage Error",
            "Unable to retrieve data from local storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      //retrieve from sessionStorage service
      case StorageLocations.SessionStorage:
        var result = this.#sessionStorageService.retrieve(storageKey);
        try {
          data = result ? JSON.parse(result.Value) : [];
        } catch (e) {
          this.#error(
            "Session Storage Error",
            "Unable to retrieve data from session storage service.",
            false,
            [{ "Details:": e, "Result:": result }]
          );
        }
        break;

      default:
        break;
    }
    return data;
  }

  async remove(
    storageKey = this.#storageKey,
    storageLocation = this.#storageLocation
  ) {
    switch (arguments.length) {
      case 0:
        this.#removeItems();
        break;
      case 1:
        if (typeof arguments[0] === "string") {
          this.#removeItemsByStorageKey(storageKey);
        } else {
          this.#error(
            `Invalid Arguments Error. StorageKey must be a string. Found ${typeof arguments[0]}.`
          );
        }
        break;
      case 2:
        if (
          typeof arguments[0] === "string" &&
          Object.values(StorageLocations).includes(arguments[1])
        ) {
          this.#removeItemsByStorageLocation(storageKey, storageLocation);
        } else {
          this.#error(
            `Invalid Arguments Error. StorageKey must be a string and cannot be one of the reserved storage locations: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. StorageLocation must be one of the following: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. Found ${typeof arguments[0]} and ${typeof arguments[1]}.`
          );
        }
        break;
      default:
        this.#warn("Invalid arguments.");
        break;
    }
    return this;
  }

  async #removeItems() {
    switch (this.#storageLocation) {
      //remove from LocalStorage service
      case StorageLocations.LocalStorage:
        var items = this.#localStorageService.retrieve(this.#storageKey);
        if (items && items.length > 0) {
          this.#localStorageService.remove(this.#storageKey);
        } else {
          this.#warn(`No items found in LocalStorage for ${this.#storageKey}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          this.#storageKey,
          this.#storageLocation
        );
        break;

      //remove from sessionStorage service
      case StorageLocations.SessionStorage:
        var items = this.#sessionStorageService.retrieve(this.#storageKey);
        if (items && items.length > 0) {
          this.#sessionStorageService.remove(this.#storageKey);
        } else {
          this.#warn(
            `No items found in SessionStorage for ${this.#storageKey}`
          );
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          this.#storageKey,
          this.#storageLocation
        );

        break;

      default:
        break;
    }
  }

  /*****************************************************************************
   * Removes items using a specific data store name.
   * @deprecated This method will be removed in future versions. Use removeItemsByStorageKey instead.
   * @param {string} dataStoreName - The name of the data store.
   ****************************************************************************
   */
  async #removeItemsByDataStoreName(dataStoreName) {
    switch (this.#storageLocation) {
      //remove from LocalStorage service
      case StorageLocations.LocalStorage:
        var items = this.#localStorageService.retrieve(dataStoreName);
        if (items && items.length > 0) {
          this.#localStorageService.remove(dataStoreName);
        } else {
          this.#warn(`No items found in LocalStorage for ${dataStoreName}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          dataStoreName,
          this.#storageLocation
        );

        break;

      //remove from sessionStorage service
      case StorageLocations.SessionStorage:
        var items = this.#sessionStorageService.retrieve(dataStoreName);
        if (items && items.length > 0) {
          this.#sessionStorageService.remove(dataStoreName);
        } else {
          this.#warn(`No items found in SessionStorage for ${dataStoreName}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          dataStoreName,
          this.#storageLocation
        );
        break;

      default:
        break;
    }
  }

  /*****************************************************************************
   * Removes items using a specific data store name.
   * @param {string} storageKey - The key of the storage item.
   ****************************************************************************
   */
  async #removeItemsByStorageKey(storageKey) {
    switch (this.#storageLocation) {
      //remove from LocalStorage service
      case StorageLocations.LocalStorage:
        var items = this.#localStorageService.retrieve(storageKey);
        if (items && items.length > 0) {
          this.#localStorageService.remove(storageKey);
        } else {
          this.#warn(`No items found in LocalStorage for ${storageKey}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          storageKey,
          this.#storageLocation
        );

        break;

      //remove from sessionStorage service
      case StorageLocations.SessionStorage:
        var items = this.#sessionStorageService.retrieve(storageKey);
        if (items && items.length > 0) {
          this.#sessionStorageService.remove(storageKey);
        } else {
          this.#warn(`No items found in SessionStorage for ${storageKey}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          storageKey,
          this.#storageLocation
        );
        break;

      default:
        break;
    }
  }

  async #removeItemsByStorageLocation(storageKey, storageLocation) {
    switch (storageLocation) {
      //remove from LocalStorage service
      case StorageLocations.LocalStorage:
        var items = this.#localStorageService.retrieve(storageKey);
        if (items && items.length > 0) {
          this.#localStorageService.remove(storageKey);
        } else {
          this.#warn(`No items found in LocalStorage for ${storageKey}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          storageKey,
          storageLocation
        );

        break;

      //remove from sessionStorage service
      case StorageLocations.SessionStorage:
        var items = this.#sessionStorageService.retrieve(storageKey);
        if (items && items.length > 0) {
          this.#sessionStorageService.remove(storageKey);
        } else {
          this.#warn(`No items found in SessionStorage for ${storageKey}`);
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          storageKey,
          storageLocation
        );

        break;

      default:
        break;
    }
  }

  async #logDataEntry(action, storageKey, storageLocation, items) {
    //TODO: Implement logging functionality as a separate logging service using a ServiceWorker and Singleton pattern.
    const timestamp = new Date().toISOString();
    var logEntry = {};
    switch (action) {
      case "STORE":
        logEntry = {
          storageKey: storageKey,
          storageLocation: storageLocation,
          action: action,
          modifiedOn: timestamp,
          value: items,
        };
        this.#dataStores.push(logEntry);
        if (this.#loggingEnabled) {
          this.#info(`Data stored as ${storageKey} in ${storageLocation}`);
        }
        break;
      case "RETRIEVE":
        // Implement retrieve action logging
        if (this.#loggingEnabled) {
          this.#info(`Retrieved data as ${storageKey} from ${storageLocation}`);
        }
        break;
      case "REMOVE":
        this.#dataStores = this.#dataStores.filter(
          (entry) => entry.storageKey !== storageKey
        );
        if (this.#loggingEnabled) {
          this.#info(`Removed data ${storageKey} from ${storageLocation}`);
        }
        break;
      default:
        this.#warn(`Unknown action type: ${action}`);
        break;
    }
  }

  #warn(message, ...args) {
    if (this.#loggingEnabled && this.#loggerService) {
      this.#loggerService.warn(message, ...args);
    }
  }

  #error(message, throwError = false, ...args) {
    if (this.#loggingEnabled && this.#loggerService) {
      this.#loggerService.error(message, ...args);
    }
    if (throwError) {
      throw new Error(message, ...args);
    }
  }

  #info(message, ...args) {
    if (this.#loggingEnabled && this.#loggerService) {
      this.#loggerService.info(message, ...args);
    }
  }

  async clear() {
    this.#localStorageService.clear();
    this.#sessionStorageService.clear();
    return this;
  }
}
