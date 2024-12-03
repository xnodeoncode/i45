/**
 * @class StorageItem
 * @description StorageItem model
 * @param {string} name - The name of the storage item.
 * @param {string} value - The value of the storage item.
 * @example
 * const storageItem = new StorageItem("name", "value");
 * console.log(storageItem.Name); // "name"
 * console.log(storageItem.Value); // "value"
 * @returns {StorageItem} A new StorageItem instance.
 */
export class StorageItem {
  constructor(name, value) {
    this.Name = name;
    this.Value = value;
  }
}
