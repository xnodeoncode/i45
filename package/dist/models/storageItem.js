/*************************************************************************************
 * StorageItem class to be used with various storage types.
 * Name|string: The name of the storage item.
 * Value|object: The value to be stored.
 ************************************************************************************/
export class StorageItem {
  constructor(name, value) {
    this.Name = name;
    this.Value = value;
  }
}
