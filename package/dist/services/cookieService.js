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

    if(!this.storageAvailable())
    {
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
    if(cookieData.length > 4096){
      console.warn("Cookie size is too large. Consider using indexedDB instead.");
    }

    try{
      cookieStore.set(cookie);
    } catch (error){
      console.warn("CookieStore is not supported in this browser.");
      try {
        document.cookie = `${cookie.name}=${cookie.value}; expires=${new Date(cookie.expires).toUTCString()}`;
      } catch (error){
        console.warn("Cookie could not be saved.");
    }
  }
  }

  /************************************************************************************
   * Gets a document.cookie value.
   * CookieName|string: The name of the cookie that will be retrieved.
   ************************************************************************************/
  retrieve(cookieName) {

    if(!this.storageAvailable())
      {
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
  remove(cookieName) {}

  storageAvailable(){
    if (!("cookieStore" in window)) {
      console.log("Not supported");
      return;
    }
  }
  
}
