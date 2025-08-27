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
import { SampleData } from "./services/sampleDataService.js";

/*************************************************************************************
 * Import StorageLocations enum for strongly typed storage location values.
 ************************************************************************************/
import { StorageLocations } from "./models/storageLocations.js";

/*************************************************************************************
 * Import the Logger service for logging events and errors.
 ************************************************************************************/
import { Logger } from "i45-jslogger";

/**
 * Export the DatabaseSettings and PersistenceTypes classes for use with this datacontext in consuming modules.
 */
export { SampleData, StorageLocations };

/**
 * @class DataContext
 * @property {string} dataStoreName - The name of the database.
 * @property {string} storageLocation - The type of persistence used to store data. (cookie, localStorage, sessionStorage)
 *
 * @constructor
 * @param {string} dataStoreName - The settings to be used for the database.
 * @param {StorageLocation} storageLocation - The location for browser storage. Local storage or session storage.
 *
 * @example
 * let context = new DataContext();
 * let currentSettings = context.getCurrentSettings();
 * console.log(currentSettings.dataStoreName); // "Items"
 * console.log(currentSettings.storageLocation); // "localStorage"
 */
export class DataContext {
  // private fields
  #dataStoreName;
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
    dataStoreName = "Items",
    storageLocation = StorageLocations.LocalStorage
  ) {
    this.#dataStoreName = dataStoreName;
    this.#storageLocation = storageLocation;
    this.#dataStores = [];

    this.#loggerService = new Logger();
    this.#localStorageService = new LocalStorageService();
    this.#sessionStorageService = new SessionStorageService();

    return this;
  }

  getCurrentSettings() {
    var settings = {
      dataStoreName: this.#dataStoreName,
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
    var currentLoggingSetting = this.#loggingEnabled;
    this.#loggingEnabled = true;
    this.#info("Printing log history");
    console.log(this.#loggerService.getEvents());
    this.#loggingEnabled = currentLoggingSetting;

    return [...this.#loggerService.getEvents()];
  }

  // public properties
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

  async store(
    dataStoreName = this.#dataStoreName,
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
          this.#storeItemsByDataStoreName(dataStoreName, items);
        } else {
          this.#error(
            "Invalid Arguments Error",
            `The dataStoreName must be a string and cannot be one of the reserved storage locations: ${Object.values(
              StorageLocations
            ).join(", ")}. Items must be an array of objects or values.`,
            false,
            [{ dataStoreName: arguments[0], items: arguments[1] }]
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
          this.#storeItemsByStorageLocation(
            dataStoreName,
            storageLocation,
            items
          );
        } else {
          this.#error(
            "Invalid Arguments Error",
            `DataStoreName must be a string. StorageLocation must be one of the following: ${Object.values(
              StorageLocations
            ).join(", ")}. Items must be an array of objects or values.`,
            false,
            [
              {
                dataStoreName: arguments[0],
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
    var dataEvent = {};

    switch (this.#storageLocation) {
      //persist to LocalStorage service
      case StorageLocations.LocalStorage:
        this.#localStorageService.save(
          this.#dataStoreName,
          JSON.stringify(items)
        );
        this.#logDataEntry(
          this.#logActions.Store,
          this.#dataStoreName,
          StorageLocations.LocalStorage,
          items
        );
        break;

      //persist to sessionStorage service
      case StorageLocations.SessionStorage:
        this.#sessionStorageService.save(
          this.#dataStoreName,
          JSON.stringify(items)
        );
        this.#logDataEntry(
          this.#logActions.Store,
          this.#dataStoreName,
          StorageLocations.SessionStorage,
          items
        );
        break;

      default:
        break;
    }
  }

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

  async #storeItemsByStorageLocation(dataStoreName, storageLocation, items) {
    switch (storageLocation) {
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

  async retrieve(
    dataStoreName = this.#dataStoreName,
    storageLocation = this.#storageLocation
  ) {
    let data = [];

    switch (arguments.length) {
      case 0:
        data = await this.#retrieveItems();
        break;
      case 1:
        if (typeof arguments[0] === "string") {
          data = await this.#retrieveItemsByDataStoreName(dataStoreName);
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
            dataStoreName,
            storageLocation
          );
        } else {
          this.#error(
            `Invalid Arguments Error. DataStoreName must be a string and cannot be one of the reserved storage locations: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. StorageLocation must be one of the following: ${Object.values(
              StorageLocations
            ).join(
              ", "
            )}. Found types ${typeof arguments[0]} and ${typeof arguments[1]}.`,
            false,
            [{ dataStoreName: arguments[0], storageLocation: arguments[1] }]
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
        var result = this.#localStorageService.retrieve(this.#dataStoreName);
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
        var result = this.#sessionStorageService.retrieve(this.#dataStoreName);
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

  async #retrieveItemsByStorageLocation(dataStoreName, storageLocation) {
    let data = [];
    switch (storageLocation) {
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

  async remove(
    dataStoreName = this.#dataStoreName,
    storageLocation = this.#storageLocation
  ) {
    switch (arguments.length) {
      case 0:
        this.#removeItems();
        break;
      case 1:
        if (typeof arguments[0] === "string") {
          this.#removeItemsByDataStoreName(dataStoreName);
        } else {
          this.#error(
            `Invalid Arguments Error. DataStoreName must be a string. Found ${typeof arguments[0]}.`
          );
        }
        break;
      case 2:
        if (
          typeof arguments[0] === "string" &&
          Object.values(StorageLocations).includes(arguments[1])
        ) {
          this.#removeItemsByStorageLocation(dataStoreName, storageLocation);
        } else {
          this.#error(
            `Invalid Arguments Error. DataStoreName must be a string and cannot be one of the reserved storage locations: ${Object.values(
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
        var items = this.#localStorageService.retrieve(this.#dataStoreName);
        if (items && items.length > 0) {
          this.#localStorageService.remove(this.#dataStoreName);
        } else {
          this.#warn(
            `No items found in LocalStorage for ${this.#dataStoreName}`
          );
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          this.#dataStoreName,
          this.#storageLocation
        );
        break;

      //remove from sessionStorage service
      case StorageLocations.SessionStorage:
        var items = this.#sessionStorageService.retrieve(this.#dataStoreName);
        if (items && items.length > 0) {
          this.#sessionStorageService.remove(this.#dataStoreName);
        } else {
          this.#warn(
            `No items found in SessionStorage for ${this.#dataStoreName}`
          );
          return;
        }
        this.#logDataEntry(
          this.#logActions.Remove,
          this.#dataStoreName,
          this.#storageLocation
        );

        break;

      default:
        break;
    }
  }

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

  async #removeItemsByStorageLocation(dataStoreName, storageLocation) {
    switch (storageLocation) {
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
          storageLocation
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
          storageLocation
        );

        break;

      default:
        break;
    }
  }

  async #logDataEntry(action, dataStoreName, storageLocation, items) {
    //TODO: Implement logging functionality as a separate logging service using a ServiceWorker and Singleton pattern.
    const timestamp = new Date().toISOString();
    var logEntry = {};
    switch (action) {
      case "STORE":
        logEntry = {
          dataStoreName: dataStoreName,
          storageLocation: storageLocation,
          action: action,
          modifiedOn: timestamp,
          value: items,
        };
        this.#dataStores.push(logEntry);
        if (this.#loggingEnabled) {
          this.#info(`Data stored as ${dataStoreName} in ${storageLocation}`);
        }
        break;
      case "RETRIEVE":
        // Implement retrieve action logging
        if (this.#loggingEnabled) {
          this.#info(
            `Retrieved data as ${dataStoreName} from ${storageLocation}`
          );
        }
        break;
      case "REMOVE":
        this.#dataStores = this.#dataStores.filter(
          (entry) => entry.dataStoreName !== dataStoreName
        );
        if (this.#loggingEnabled) {
          this.#info(`Removed data ${dataStoreName} from ${storageLocation}`);
        }
        break;
      default:
        this.#warn(`Unknown action type: ${action}`);
        break;
    }
  }

  #warn(message, ...args) {
    if (this.#loggingEnabled) {
      this.#loggerService.warn(message, ...args);
    }
  }

  #error(message, throwError = false, ...args) {
    if (this.#loggingEnabled) {
      this.#loggerService.error(message, ...args);
    }
    if (throwError) {
      throw new Error(message, ...args);
    }
  }

  #info(message, ...args) {
    if (this.#loggingEnabled) {
      this.#loggerService.info(message, ...args);
    }
  }

  async clear() {
    this.#localStorageService.clear();
    this.#sessionStorageService.clear();
    return this;
  }
}
