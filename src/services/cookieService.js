/********************************************************************
 * Import StorageItem class for a strongly typed storage object.
 ********************************************************************/
import { StorageItem } from "../models/storageItem.js";

/************************************************************************************
 * Wrapper class used to work with document.cookie.
 ************************************************************************************/
export class CookieService {
  constructor() {}

  /************************************************************************************
   * Creates/updates a document cookie.
   * CookieName|string: The name of the cookie.
   * CookieData|string: The value to be stored.
   ************************************************************************************/
  save(cookieName, cookieData) {
    //TODO: validate size of cookie.
    // if it is too large, fall back to indexedDB and log a message.
    let day = 24 * 60 * 60 * 1000;
    let cookie = {
      name: `${cookieName}`,
      value: `${cookieData}`,
      expires: Date.now() + day,
    };
    cookieStore.set(cookie);
  }

  /************************************************************************************
   * Gets a document.cookie value.
   * CookieName|string: The name of the cookie that will be retrieved.
   ************************************************************************************/
  retrieve(cookieName) {
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
  remove(cookieName) {}
}
