/********************************************************************
 * Import StorageItem class for a strongly typed storage object.
 ********************************************************************/
import { StorageItem } from "../models/storageItem.js";

/************************************************************************************
 * Wrapper class used to work with document.cookie.
 ************************************************************************************/
export class CookieService {
  #storageAvailable = false; // Flag to check if cookieStore is available.
  constructor() {
    this.#storageAvailable = this.#isStorageTypeAvailable("cookieStore");
  }

  /************************************************************************************
   * Creates/updates a document cookie.
   * CookieName|string: The name of the cookie.
   * CookieData|string: The value to be stored.
   ************************************************************************************/
  save(cookieName, cookieData) {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }

    //TODO: validate size of cookie.
    // if it is too large, fall back to indexedDB and log a message.
    let day = 24 * 60 * 60 * 1000;
    let cookie = {
      name: `${cookieName}`,
      value: `${cookieData}`,
      expires: Date.now() + day,
    };
    if (cookieData.length > 4096) {
      console.warn(
        "Cookie size is too large. Consider using indexedDB instead."
      );
    }

    try {
      cookieStore.set(cookie);
    } catch (error) {
      console.warn("CookieStore is not supported in this browser.");
      try {
        document.cookie = `${cookie.name}=${cookie.value}; expires=${new Date(
          cookie.expires
        ).toUTCString()}`;
      } catch (error) {
        console.warn("Cookie could not be saved.");
      }
    }
  }

  /************************************************************************************
   * Gets a document.cookie value.
   * CookieName|string: The name of the cookie that will be retrieved.
   ************************************************************************************/
  retrieve(cookieName) {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }

    let item = null;
    let cookieData = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${cookieName}=`))
      ?.split("=")[1];

    if (cookieData != null && cookieData.length > 0) {
      item = new StorageItem(cookieName, cookieData);
    }
    return item;
  }

  /************************************************************************************
   * Deletes a document cookie.
   * CookieName|string: The name of the cookie tha will be deleted.
   ************************************************************************************/
  remove(cookieName) {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }
    try {
      cookieStore.delete(cookieName);
    } catch (e) {
      console.warn("CookieStore is not supported in this browser.");
      try {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      } catch (error) {
        console.warn("Cookie could not be removed.");
      }
    }
  }

  /***********************************************************************************
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
      storage.set(x, x);
      storage.delete(x);
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
