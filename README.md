# i45

NodeJS package: https://www.npmjs.com/package/i45

A wrapper for browser storage.

## Installation

```javascript
npm i i45

```

## Usage

### Default Storage Settings

```javascript
import { DataContext } from "i45";

// Create an instance of the datacontext.
// The default storage location is Cookie storage using a default table name.
var dataContext = new DataContext();

// Create an array of objects. This is a sample collection of books
var book = { title: "The Road to React", author: "Robin Wieruch", id: 123456 };
var bookTwo = {
  title: "Creating NPM Package",
  author: "Oluwatobi Sofela",
  id: 123457,
};

var books = [];
books.push(book);
books.push(bookTwo);

// Persist the collection to the datastore, passing in array of objects.
dataContext.persist(books);
```

### Custom Storage Settings

```javascript
import { DataContext, DatabaseSettings, PersistenceTypes } from "i45";

// Create a database settings object with the desired values.
// An id field name is required. This example uses "id".
// PersistenceTypes.CookieStore uses the table name as the key.
var settings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  PersistenceTypes.LocalStorage
);

// Create an instance of the datacontext, passing in the database settings.
var dataContext = new DataContext(settings);

// create an array of objects. This is a sample collection of books
var book = { title: "The Road to React", author: "Robin Wieruch", id: 123456 };
var bookTwo = {
  title: "Creating NPM Package",
  author: "Oluwatobi Sofela",
  id: 123457,
};

var books = [];
books.push(book);
books.push(bookTwo);

// persist the collection to the datastore, passing in the database settings and the collection.
dataContext.persist(books);
```

### Multiple Data Contexts

```javascript
/* 
A database settings object with a unique database and/or, as in the case of CookieStore storage, a unique table name is required to have multiple data stores.

See the examples below.
*/

import { DataContext, DatabaseSettings, PersistenceTypes } from "i45";

// These settings can be used to create a data store for storing and retrieving books.
var bookshelfSettings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  PersistenceTypes.LocalStorage
);

// These settings can be used to create a data store for storing and retrieving cities.
var mapSettings = new DatabaseSettings(
  "Map",
  1,
  "Cities",
  "id",
  PersistenceTypes.LocalStorage
);

// Create instances of the datacontext, passing in the relevant database settings. For Cookie storage, tableName is used as the cookie name.
var booksContext = new DataContext(bookshelfSettings);
var mapContext = new DataContext(mapSettings);

// create an array of objects. This is a sample collection of books
var book = { title: "The Road to React", author: "Robin Wieruch", id: 123456 };
var bookTwo = {
  title: "Creating NPM Package",
  author: "Oluwatobi Sofela",
  id: 123457,
};

var books = [];
books.push(book);
books.push(bookTwo);

// create an array of cities for the mapContext.
var conroe = { id: 1, name: "Conroe", state: "Texas", postalCode: "77301" };
var houston = { id: 2, name: "Houston", state: "Texas", postalCode: "77056" };

var cities = [];
cities.push(conroe);
cities.push(houston);

// persist the objects using the associated context.
booksContext.persist(books);
mapContext.persist(cities);

// or create a single context and pass the relevant settings object to each request.
var combinedDataStoreContext = new DataContext();

// persist books to the combined data store context
combinedDataStoreContext.persist(bookshelfSettings, books);
var returnedBooks = combinedDataStoreContext.retrieve(bookshelfSettings);

// persist cities to the combined data store context
combinedDataStoreContext.persist(mapSettings, cities);
var returnedCities = combinedDataStoreContext.retrieve(mapSettings);
```

### PersistenceTypes

PersistenceTypes is an enum of the available storage options which currently are, CookieStore, LocalStorage, and SessionStorage.

#### Using PersistenceTypes

When creating a DatabaseSettings object and/or creating an instance of a DataContext, one of the persistence types below are required.

```javascript
PersistenceTypes.CookieStore; // uses window.cookieStore to persist data.
PersistenceTypes.LocalStorage; // uses window.localStorage to persist data.
PersistenceTypes.SessionStorage; // uses window.sessionStorage to persist data.
```
