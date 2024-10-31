import { DataContext, PersistenceTypes, DatabaseSettings } from "i45";
var settings = new DatabaseSettings("myDatabase", 1, "myDatabaseTable", "id", PersistenceTypes.Cookie);

var dataContext = new DataContext(settings.persistenceType, settings.databaseName, settings.databaseVersion, settings.objectStoreName, settings.keyPathField);
var book = {"title":"myBook", "author":"myAuthor", "id":123456};
var books = [];
books.push(book);

dataContext.persist(settings, books);

console.log(dataContext.retrieve(settings));