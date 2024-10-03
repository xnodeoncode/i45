/*************************************************************************************
 * Persistence store class with default property values which can be overwritten by constructor values.
 * DatabaseName|string: The name of the database.
 * DatabaseVersion|int: The version of the database being used.
 * TableName|string: The name of the table used to store data.
 * KeyPathField|string: The name of the field/property used to store key values.
 * PersistenceType|string: The type of persistence used to store data.
 ************************************************************************************/
export class DatabaseSettings {
  constructor(
    databaseName,
    databaseVersion,
    tableName,
    keyPathField,
    persistenceType
  ) {
    this.databaseName = databaseName || "Default";
    this.databaseVersion = databaseVersion || 1;
    this.objectStoreName = tableName || "ItemStore";
    this.keyPathField = keyPathField || "id";
    this.persistenceType = persistenceType || PersistenceTypes.Cookie;
  }
}
