# i45

[NodeJS package](https://www.npmjs.com/package/i45)

As a wrapper for browser storage (localStorage and sessionStorage), i45 allows you to store any collection of data in the form of an array.

## Installation

```javascript
npm i i45

```

## Usage

- [Default Storage Settings](#default-storage-settings)
- [Custom Storage Settings](#custom-storage-settings)
- [Retrieving Data](#retrieving-data)
- [Retrieving Data from Custom Data Stores](#retrieving-data-from-custom-data-stores)
- [Removing Items and Clearing the Data Store](#removing-items-and-clearing-the-data-store)
- [Storage Locations](#storage-locations)
- [Using Sample Data](#using-sample-data)
- [Logging](#logging)

### Default Storage Settings

```javascript
import { DataContext, SampleData } from "i45";

// Create an instance of the datacontext.
// The default storage location is local storage using a default key.
var dataContext = new DataContext();

// Create an array of objects or values. This is a sample collection of astronomical terms.
var terms = SampleData.Lists.Astronomy;

// Persist the collection to the datastore, passing in array of objects.
dataContext.store(terms);
```

### Custom Storage Settings

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// This creates a dataset with the name Books stored in sessionStorage.
var context = new DataContext("Books", StorageLocations.SessionStorage);

// create an array of objects. This is a sample collection of books.
var books = SampleData.JsonData.Books;

// persist the collection to the datastore.
dataContext.store(books);
```

### Retrieving Data

The retrieve method on the data context returns a Promise. The example below demonstrates how to retrieve data using default database settings.

```javascript
import { DataContext, SampleData } from "i45";

var context = new DataContext();

context.store(SampleData.JsonData.States);

context.retrieve().then((data) => console.log("State data:", data));
```

### Retrieving Data from Custom Data Stores

To retrieve data using customized settings, the database settings object must be provided.

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// This creates a dataset with the name TriviaQuestions stored in sessionStorage.
var context = new DataContext("Quiz", StorageLocations.SessionStorage);

// create an array of objects. This is a sample collection of trivia questions.
dataContext.store("Questions", SampleData.JsonData.TriviaQuestions);

// retrieve the data.
datacontext.retrieve("Questions");
```

### Removing Items and Clearing the Data Store

To delete an entry, call the remove() method on the data context. To clear all entries, call the clear() method.

```javascript
import { DataContext } from "i45";

var dataContext = new DataContext();

// create an array of countries.
var countries = SampleData.KeyValueLists.Countries;

// persist the collection
dataContext.store("Countries", countries);

// remove the item from storage.
dataContext.remove("Countries");

// remove all items from all storage locations.
datacontext.clear();
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

### Logging

The i45-jslogging package is integrated for data context logging. The enableLogging() method, which accepts true or false, will turn logging on or off.

```javascript
import { DataContext } from "i45";

var context = new DataContext();
context.enableLogging(true);
```

When enabled, messages are written both to the console as well as to localStorage ("eventLog").

See [i45-jsLogger](https://www.npmjs.com/package/i45-jslogger) for full details on how the module works. The logger is not exposed in this module.
