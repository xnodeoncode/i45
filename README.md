# i45

[NodeJS package](https://www.npmjs.com/package/i45)

A wrapper for browser storage.

## Installation

```javascript
npm i i45

```

## Usage

- [Default Storage Settings](#default-storage-settings)
- [Custom Storage Settings](#custom-storage-settings)
- [Multiple Data Contexts](#multiple-data-contexts)
- [Multiple Data Stores](#using-a-single-datacontext-with-multiple-data-stores)
- [Retrieving Data](#retrieving-data)
- [Retrieving Data from Custom Data Stores](#retrieving-data-from-custom-data-stores)
- [Clearing the Data Store](#clearing-the-data-store)
- [Storage Locations](#storage-locations)
- [Using Sample Data](#using-sample-data)

### Default Storage Settings

```javascript
import { DataContext } from "i45";

// Create an instance of the datacontext.
// The default storage location is local storage using a default table name.
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
dataContext.store(books);
```

### Custom Storage Settings

```javascript
import { DataContext, DatabaseSettings, StorageLocations } from "i45";

// Create a database settings object with the desired values.
// A primary key field name is required. This example uses "id".
var settings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  StorageLocations.LocalStorage
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
dataContext.store(books);
```

### Multiple Data Contexts

```javascript
/* 
A database settings object with a unique name for each database is required.

See the examples below.
*/

import { DataContext, DatabaseSettings, StorageLocations } from "i45";

// These settings can be used to create a data store for storing and retrieving books.
var bookshelfSettings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  StorageLocations.LocalStorage
);

// These settings can be used to create a data store for storing and retrieving cities.
var mapSettings = new DatabaseSettings(
  "Map",
  1,
  "Cities",
  "id",
  StorageLocations.LocalStorage
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
var c1 = { id: 1, name: "Seattle", state: "Washington", postalCode: "98109" };
var c2 = {
  id: 2,
  name: "Bradfordsville",
  state: "Kentucky",
  postalCode: "40009",
};

var cities = [];
cities.push(c1);
cities.push(c2);

// persist the objects using the associated context.
booksContext.store(books);
mapContext.store(cities);
```

### Using a single DataContext with multiple data stores.

To manage multiple data stores with a single context, you must pass in the associated database settings object with each request.

```javascript
// Create a data store for storing and retrieving books.
var bookshelfSettings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  StorageLocations.LocalStorage
);

// create an array of books.
var book = { title: "The Road to React", author: "Robin Wieruch", id: 123456 };
var bookTwo = {
  title: "Creating NPM Package",
  author: "Oluwatobi Sofela",
  id: 123457,
};

var books = [];
books.push(book);
books.push(bookTwo);

// Create a data store for storing and retrieving cities.
var mapSettings = new DatabaseSettings(
  "Map",
  1,
  "Cities",
  "id",
  StorageLocations.LocalStorage
);

// create an array of cities.
var c1 = { id: 1, name: "Seattle", state: "Washington", postalCode: "98109" };
var c2 = {
  id: 2,
  name: "Bradfordsville",
  state: "Kentucky",
  postalCode: "40009",
};

var cities = [];
cities.push(c1);
cities.push(c2);

// Create a data context object
var combinedDataStoreContext = new DataContext();

/*
Persist and retrieve the items using the combined data context passing in the database settings along with the collection.
*/

// An example uisng the bookshelf settings.
combinedDataStoreContext.store(bookshelfSettings, books);
var returnedBooks = combinedDataStoreContext.retrieve(bookshelfSettings);

// An example using the map settings.
combinedDataStoreContext.store(mapSettings, cities);
var returnedCities = combinedDataStoreContext.retrieve(mapSettings);
```

### Retrieving Data

The retrieve method on the data context returns a Promise. The example below demonstrates how to retrieve data using default database settings.

```javascript
import { DataContext } from "i45";

var context = new DataContext();

var books = [
  { title: "The Road to React", author: "Robin Wieruch", id: 123456 },
  { title: "Creating NPM Package", author: "Oluwatobi Sofela", id: 123457 },
];

context.store(books);

context.retrieve().then((data) => console.log("Cookie Data", data));
```

### Retrieving Data from Custom Data Stores

To retrieve data using customized settings, the database settings object must be provided.

```javascript
import { DataContext, DatabaseSettings, StorageLocations } from "i45";

// Create a database settings object with the desired values.
// A primary key field name is required. This example uses "id".
var settings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  StorageLocations.LocalStorage
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
dataContext.store(settings, books);

// retrieve the data.
datacontext.retrieve(settings);
```

### Clearing the Data Store

To delete an entry, call the clear() method on the data context.

```javascript
import { DataContext } from "i45";

var dataContext = new DataContext();

// create an array of cities.
var cities = [];
cities.push({
  id: 1,
  name: "Seattle",
  state: "Washington",
  postalCode: "98109",
});
cities.push({
  id: 2,
  name: "Bradfordsville",
  state: "Kentucky",
  postalCode: "40009",
});

// persist the collection
dataContext.store(cities);

// remove the item from storage.
dataContext.clear();
```

### Storage Locations

StorageLocations is an enum of the available storage options which are currently LocalStorage and SessionStorage.

#### Using StorageLocations

When creating a DatabaseSettings object and/or creating an instance of a DataContext, one of the storage locations below is required.

```javascript
StorageLocations.LocalStorage; // uses window.localStorage to persist data.
StorageLocations.SessionStorage; // uses window.sessionStorage to persist data.
```

### Using Sample Data

The i45-Sample-Data package is a library of sample datasets that can be used during development.

The package has been merged here for convenience.

Full usage details can be found at [i45-Sample-Data](https://www.npmjs.com/package/i45-sample-data)

```javascript
import { SampleData } from "i45";

var books = SampleData.JsonData.Books;

console.log(books);
```
