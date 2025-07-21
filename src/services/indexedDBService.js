
export class IndexedDBService {
  #dbName = "i45DB"; // Name of the IndexedDB database
  #dbVersion = 1; // Version of the IndexedDB database
  #db = null; // Reference to the IndexedDB database
  #storageAvailable = false; // Flag to check if IndexedDB is available
  #objectStoreName = "Items"; // Name of the object store

  constructor(databaseName, version, objectStoreName) {
    this.#dbName = databaseName || this.#dbName;
    this.#dbVersion = version || this.#dbVersion;
    this.#objectStoreName = objectStoreName || this.#objectStoreName;
    this.#storageAvailable = this.#isStorageTypeAvailable("indexedDB");
    this.#openDatabase();
  }

    // Open the IndexedDB database
    #openDatabase() {
        const request = indexedDB.open(this.#dbName, this.#dbVersion);
    
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create an object store if it doesn't exist
            if (!db.objectStoreNames.contains(this.#objectStoreName)) {
            db.createObjectStore(this.#objectStoreName, { keyPath: "id" });
            }
        };
    
        request.onsuccess = (event) => {
            this.#db = event.target.result;
        };
    
        request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event.target.error);
        };
    }

  #isStorageTypeAvailable(type) {
    let indexedDB;
    try {
      indexedDB = window[type];
      const x = "__storage_test__";
      indexedDB.setItem(x, x);
      indexedDB.removeItem(x);
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
        indexedDB &&
        indexedDB.length !== 0
      );
    }
    
  }
};