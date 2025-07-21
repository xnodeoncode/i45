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
  async save(cookieName, cookieData, options = {}) {
    if (typeof cookieName !== "string" || typeof cookieData !== "string") {
      console.error("Cookie name and data must be strings.");
      return;
    }
    if (cookieName.length === 0 || cookieData.length === 0) {
      console.error("Cookie name and data cannot be empty.");
      return;
    }
    if (cookieName.length > 200) {
      console.error("Cookie name is too long. Max length is 200 characters.");
      return;
    }

    options = {
      path: "/",
      ...options
    }
    
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }

    //TODO: validate size of cookie.
    // if it is too large, fall back to indexedDB and log a message.
    let cookieSize = cookieName.length + cookieData.length;
    if (cookieSize > 4096) {
      console.error(
        "Cookie size is too large. Consider using Web Storage instead. Cookie size: " +
          cookieSize +
          " bytes. Max size: 4096 bytes."
      );
      return;
    }

    let day = 24 * 60 * 60 * 1000;
    let expiryDate = new Date(Date.now() + day);

    let cookie = {
      name: encodeURIComponent(cookieName),
      value: encodeURIComponent(cookieData),
      expires: expiryDate.toUTCString(),
    };
    
    // Set cookie options
    if (options.expires) {
      if (typeof options.expires === "number") {
        let edate = new Date(Date.now() + options.expires * day);
        cookie.expires = edate.toUTCString();
      } else if (options.expires instanceof Date) {
        cookie.expires = options.expires.toUTCString();
      }
    }

    for (let optionKey in options) {
    cookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      cookie += "=" + optionValue;
    }
  }

    try {
      await cookieStore.set(cookie);
    } catch (error) {
      console.warn("Error setting cookie in CookieStore. Falling back to document.cookie.", error);
      try {
        document.cookie = `${cookie.name}=${cookie.value}; expires=${cookie.expires};`;
      } catch (error) {
        console.warn("Error setting cookie:", error);
      }
    }
  }

  /************************************************************************************
   * Gets a document.cookie value.
   * CookieName|string: The name of the cookie that will be retrieved.
   ************************************************************************************/
  async retrieve(cookieName) {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }
    
    let encodedName = encodeURIComponent(cookieName);

    try{
      await cookieStore.get(encodedName).then((cookie) => {
        if (cookie)
          return new StorageItem(decodeURIComponent(cookie.name), decodeURIComponent(cookie.value));
      });
    } catch (error) {
      console.warn("Error retrieving cookie from CookieStore:", error);
    }

    // Fallback to document.cookie if cookieStore is not available
    // or if the cookie is not found in cookieStore

    let item = new StorageItem(cookieName, "");
    let cookieData = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${encodedName}=`))
      ?.split("=")[1];

    if (cookieData != null && cookieData.length > 0) {
      item.data = decodeURIComponent(cookieData);
      return item
    } else {
      console.warn(`Cookie ${cookieName} not found.`);
      return item;
    }
  }

  /************************************************************************************
   * Deletes a document cookie.
   * CookieName|string: The name of the cookie tha will be deleted.
   ************************************************************************************/
  async remove(cookieName) {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }
    let encodedName = encodeURIComponent(cookieName);
    try {
      await cookieStore.delete(encodedName);
    } catch (e) {
      console.warn("Error deleting cookie from CookieStore:", e);
      try {
        document.cookie = `${encodedName}=""; max-age=-1;`;
      } catch (error) {
        console.warn("Error deleting cookie:", error);
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
