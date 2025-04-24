/********************************************************************
 * Import StorageItem class for a strongly typed storage object.
 ********************************************************************/
import { StorageItem } from "../models/storageItem.js";

/********************************************************************
 * Session storage wrapper to provide access to window.sessionStorage
 * if it's available.
 ********************************************************************/
export class SessionStorageService {
  #storageAvailable = false; // Flag to check if sessionStorage is available.
  constructor() {
    this.#storageAvailable = this.#isStorageTypeAvailable("sessionStorage");
  }

  /*****************************************************************
   * Add an item to window.sessionStorage.
   * StorageItemName|string: The name of the item being stored.
   * StorageItemValue|object: The value being stored.
   ****************************************************************/
  save(storageItemName, storageItemValue) {
    if (this.#storageAvailable) {
      window.sessionStorage.setItem(storageItemName, storageItemValue);
    } else {
      console.log("Session storage is not available.");
    }
  }

  /*****************************************************************
   * Retrieve an item from window.sessionStorage.
   * StorageItemName|string: The name of the item to be retrieved.
   ****************************************************************/
  retrieve(storageItemName) {
    let item = null;

    if (this.#storageAvailable) {
      if (storageItemName.length > 0) {
        let storedValue = window.sessionStorage.getItem(storageItemName);
        if (storedValue != null) {
          item = new StorageItem(storageItemName, storedValue);
        }
      }
    } else {
      console.log("Session storage is not available.");
    }
    return item;
  }

  /*****************************************************************
   * Remove an item from window.sessionStorage.
   * StorageItemName|string: The name of the item to be removed.
   ****************************************************************/
  remove(storageItemName) {
    if (this.#storageAvailable) {
      window.sessionStorage.removeItem(storageItemName);
    } else {
      console.log("Session storage is not available.");
    }
  }

  /*****************************************************************
   * Clear all items from window.sessionStorage.
   ****************************************************************/
  clear() {
    if (this.#storageAvailable) {
      window.sessionStorage.clear();
    } else {
      console.log("Session storage is not available.");
    }
  }

  /**********************************************************************************
   * Checks for window.localStorage or window.sessionStorage.
   * Type|string: The name of the storage type being tested.
   * Reference:
   * Storage avaialability test taken from MDN Web Docs
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
   ***********************************************************************************/
  #isStorageTypeAvailable(type) {
    let storage;
    try {
      storage = window[type];
      const x = "__storage_test__";
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === "QuotaExceededError" ||
          // Firefox
          e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
      );
    }
  }
}
