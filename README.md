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

// Save the collection to localStorage, passing in array of objects.
dataContext.store(terms);
```

### Custom Storage Settings

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// This creates a dataset with the name Books stored in sessionStorage.
var context = new DataContext("Books", StorageLocations.SessionStorage);

// create an array of objects. This is a sample collection of books using the SampleData module.
var books = SampleData.JsonData.Books;

// save the collection to session storage.
dataContext.store(books);
```

### Retrieving Data

The example below demonstrates how to retrieve data using default database settings.

```javascript
import { DataContext, SampleData } from "i45";

// create an instance of data context.
var context = new DataContext();

// store the data, in this case, in local storage.
context.store(SampleData.JsonData.States);

// retrieve the data and log it to the console.
context.retrieve().then((data) => console.log("State data:", data));
```

### Retrieving Data from Custom Data Stores

To retrieve data using customized settings, call the retrieve() method passing in the DataStoreName(key).

```javascript
import { DataContext, StorageLocations, SampleData } from "i45";

// This creates a dataset with the name Quiz stored in sessionStorage.
var context = new DataContext("Quiz", StorageLocations.SessionStorage);

// create an array of objects. This is a sample collection of trivia questions.
dataContext.store("Questions", SampleData.JsonData.TriviaQuestions);

// retrieve the data.
datacontext.retrieve("Questions");
```

In the case of multiple datasets in multiple locations, pass in both the data store name and the location, in order to retrieve the correct data.

```javascript
var data = context.retrieve("MyItems", StorageLocations.LocalStorage);
```

### Removing Items and Clearing the Data Store

To delete an entry, call the remove() method on the data context passing in the DataStoreName(key).

To clear all entries in all storage locations, call the clear() method.

**Warning:** Calling the clear() method will clear all entries in all storage locations.

```javascript
import { DataContext } from "i45";

var dataContext = new DataContext();

// create an array of countries using sample data.
var countries = SampleData.KeyValueLists.Countries;

// save the collection
dataContext.store("Countries", countries);

// removes the item from storage.
dataContext.remove("Countries");

// removes all items from all storage locations.
datacontext.clear();
```

### Storage Locations

StorageLocations is an enum of the available storage options. Currently, those are LocalStorage and SessionStorage.

#### Using StorageLocations

LocalStorage is used by default, and can be changed by calling the StoreLocation() method.

```javascript
StorageLocations.LocalStorage; // uses window.localStorage to persist data.
StorageLocations.SessionStorage; // uses window.sessionStorage to persist data.

// change the storage location to session storage.
context.StorageLocation(StorageLocations.SessionStorage);

// or when creating a new instance of a data context.
var context = new DataContext("MyItems", StorageLocations.SessionStorage);
```

### Using Sample Data

The i45-Sample-Data package is a library of sample datasets that can be used during development.

The package has been merged for convenience.

Full usage details can be found at [i45-Sample-Data](https://www.npmjs.com/package/i45-sample-data)

```javascript
import { SampleData } from "i45";

var books = SampleData.JsonData.Books;

console.log(books);
```

### Logging

#### Built-In Logging

The i45-jslogging package is integrated for data context logging. The enableLogging() method, which accepts true or false, will turn logging on or off.

```javascript
import { DataContext } from "i45";

var context = new DataContext();
context.enableLogging(true);
```

When enabled, messages are written both to the console as well as to localStorage as"eventLog".

See [i45-jsLogger](https://www.npmjs.com/package/i45-jslogger) for full details on how the module works. The logger is not exposed in this module.

#### Using a Custom Logger

The DataContext can accept a custom logger which implements the ILogger Interface:

```javascript
export const ILogger = {
  info: (message) => {},
  warn: (message) => {},
  error: (message) => {},
  getEvents: () => {},
};
```

##### Custom Logger Example

Upon succesfull registration, messages (info, warnings, errors) from the DataContext will be sent to the custom logger.

```javascript
import { DataContext } from "i45";

// get an instance of the custom logger. This example assumes the use of a class.
var myLogger = new CustomLogger();

// create an instance of the datacontext.
const context = new DataContext();

// Register the custom logger.
context.registerLogger(myLogger);

// Enable logging.
context.enableLogging(true);
```
