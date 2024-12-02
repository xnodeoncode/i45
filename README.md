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

// create an instance of the datacontext, the default storage location is Cookie storage, tableName/objectStoreName is used as the cookie name.
var dataContext = new DataContext();

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

// persist the collection to the datastore, passing in array of objects.
dataContext.persist(books);
```

### Custom Storage Settings

```javascript
import { DataContext, DatabaseSettings, PersistenceTypes } from "i45";

// initialize database settings. This object is optional, the settings can be passed as strings.
// An id field is required.
var settings = new DatabaseSettings(
  "BookShelf",
  1,
  "Books",
  "id",
  PersistenceTypes.LocalStorage
);

// create an instance of the datacontext, passing in the database settings. For Cookie storage, tableName/objectStoreName is used as the cookie name.
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

### PersistenceTypes

PersistenceTypes is an enum of the available storage options which currently are, CookieStore, LocalStorage, and SessionStorage.

#### Using PersistenceTypes

When creating a DatabaseSettings object and/or creating an instance of a DataContext, one of the persistence types below are required.

```javascript
-PersistenceTypes.CookieStore - // uses window.cookieStore to persist data.
  -PersistenceTypes.LocalStorage - // uses window.localStorage to persist data.
  -PersistenceTypes.SessionStorage; // uses window.sessionStorage to persist data.
```
