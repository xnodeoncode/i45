/**
 * Cookie Service - Browser cookie storage implementation
 * NOTE: Not yet integrated into DataContext - planned for future release
 */

import type { StorageItem } from "../models/StorageItem";
import { createStorageItem } from "../models/StorageItem";

/**
 * Cookie options for setting cookies
 */
export interface CookieOptions {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Wrapper class for working with document.cookie and Cookie Store API
 */
export class CookieService {
  #storageAvailable = false;

  constructor() {
    this.#storageAvailable = this.#isStorageTypeAvailable("cookieStore");
  }

  /**
   * Creates/updates a document cookie
   * @param cookieName - The name of the cookie to create/update
   * @param cookieData - The value to be stored
   * @param options - Optional settings for the cookie (expires, path, domain, secure)
   */
  async save(
    cookieName: string,
    cookieData: string,
    options: CookieOptions = {}
  ): Promise<void> {
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

    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }

    // Validate cookie size
    const cookieSize = cookieName.length + cookieData.length;
    if (cookieSize > 4096) {
      console.error(
        `Cookie size is too large. Cookie size: ${cookieSize} bytes. Max size: 4096 bytes.`
      );
      return;
    }

    const day = 24 * 60 * 60 * 1000;
    const expiryDate = options.expires || new Date(Date.now() + day);

    const cookie = {
      name: encodeURIComponent(cookieName),
      value: encodeURIComponent(cookieData),
      expires: expiryDate.getTime(),
    };

    try {
      console.log("Setting cookie in CookieStore:", { cookieName, cookieData });
      await (cookieStore as any).set(cookie);
    } catch (error) {
      console.warn(
        "Error setting cookie in CookieStore. Falling back to document.cookie.",
        error
      );
      try {
        document.cookie = `${cookie.name}=${
          cookie.value
        }; expires=${expiryDate.toUTCString()};`;
      } catch (fallbackError) {
        console.warn("Error setting cookie:", fallbackError);
      }
    }
  }

  /**
   * Gets a document.cookie value
   * @param cookieName - The name of the cookie to retrieve
   * @returns The StorageItem object containing the cookie name and value
   */
  async retrieve(cookieName: string): Promise<StorageItem | null> {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return null;
    }

    const encodedName = encodeURIComponent(cookieName);

    try {
      const cookie = await (cookieStore as any).get(encodedName);
      console.log("Retrieved cookie from CookieStore:", {
        sender: "cookieService",
        cookie: cookie ? decodeURIComponent(cookie.value) : null,
      });
      if (!cookie) {
        return createStorageItem(cookieName, "");
      }
      return createStorageItem(
        decodeURIComponent(cookie.name),
        decodeURIComponent(cookie.value)
      );
    } catch (error) {
      console.warn("Error retrieving cookie from CookieStore:", error);
    }

    // Fallback to document.cookie if cookieStore is not available
    const cookieData = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${encodedName}=`))
      ?.split("=")[1];

    if (cookieData != null && cookieData.length > 0) {
      return createStorageItem(cookieName, decodeURIComponent(cookieData));
    } else {
      console.warn(`Cookie ${cookieName} not found.`);
      return createStorageItem(cookieName, "");
    }
  }

  /**
   * Deletes a document cookie
   * @param cookieName - The name of the cookie to delete
   */
  async remove(cookieName: string): Promise<void> {
    if (!this.#storageAvailable) {
      console.log("CookieStore is not available.");
      return;
    }

    const encodedName = encodeURIComponent(cookieName);
    try {
      await (cookieStore as any).delete(encodedName);
    } catch (error) {
      console.warn("Error deleting cookie from CookieStore:", error);
      try {
        document.cookie = `${encodedName}=""; max-age=-1;`;
      } catch (fallbackError) {
        console.warn("Error deleting cookie:", fallbackError);
      }
    }
  }

  /**
   * Checks if Cookie Store API is available
   * Reference: MDN Web Docs - Web Storage API
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
   * @param type - The type of storage to check
   * @returns True if the specified storage type is available
   */
  #isStorageTypeAvailable(type: string): boolean {
    let storage: any;
    try {
      storage = (window as any)[type];
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
