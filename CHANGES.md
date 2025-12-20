# i45 Revisions

## v3.0.0-alpha.1

### December 19, 2025

This is a major release representing a complete TypeScript migration and architectural overhaul of the i45 library.

**Breaking Changes:**

- **TypeScript Migration**: Entire codebase rewritten in TypeScript with full type safety
- **Generic DataContext**: Main class is now generic `DataContext<T>` for type-safe storage operations
- **Property Name Changes**: `StorageItem` now uses camelCase: `name` and `value` (previously `Name` and `Value`)
- **Logger Changes**: Removed `iLogger` and `iLoggerValidator` exports (simplified to just `Logger` from i45-jslogger)

**New Features:**

- TypeScript type definitions (`.d.ts`) generated for all exports
- Strict type checking with TypeScript compiler
- ESM build output with source maps
- Generic type support: `DataContext<T>` for type-safe operations
- Abstract `BaseStorageService` class with `IStorageService` interface

**Improvements:**

- Fixed typo in package.json description: "brower" → "browser"
- Removed duplicate `dataService.js` file
- All models converted to TypeScript interfaces/enums
- All services use proper inheritance pattern
- Better error handling with typed exceptions
- Comprehensive type safety throughout codebase

**Build System:**

- Rollup bundler with TypeScript plugin
- Automatic type declaration generation
- Source maps for debugging
- Clean ESM output format

**Files Changed:**

- All `.js` files converted to `.ts`
- New models: `storageLocations.ts`, `storageItem.ts`, `databaseSettings.ts`, `exceptions.ts`
- New services: `baseStorageService.ts`, `localStorageService.ts`, `sessionStorageService.ts`
- Main: `dataContext.ts` (now generic), `index.ts` (entry point)
- Build: `rollup.config.js`, updated `tsconfig.json`

**Migration Guide:**

```typescript
// v2.x (JavaScript)
const context = new DataContext();
await context.store([{ id: 1, name: "Test" }]);

// v3.x (TypeScript)
interface User {
  id: number;
  name: string;
}
const context = new DataContext<User>();
await context.store([{ id: 1, name: "Test" }]); // Type-safe!
```

**Requirements:**

- Node.js 16+ recommended
- TypeScript 5.x for type checking (if using TypeScript)
- Modern browsers with ES2015+ support

## v0.0.0-alpha.4

### October 3, 2024

- Added application files.
- Created NPM Package.
- Linked package for testing.

## v0.0.0-alpha.9

### October 31, 2024

- Cleaned up package files and directories.
- Added test project.

## v0.0.0-alpha.10

### November 1, 2024

- Updated README.md
- Updated versioning to reflect alpha stage of development.

## v0.0.0-alpha.15

### November 21, 2024

- Added default settings to reduce steps required to implement the data context.
- Users can now implement browser storage in three lines of code.

## v0.0.0-alpha.16

### November 25, 2024

- NOTE: i45 versions v0.0.0-alpha.16 and later are _not_ compatible with versions v0.0.0-alpha.15 and earlier.
- Upgrading to version v0.0.0-alpha.16 from any previous version could break existing code.
- Update documentation.

## v0.0.0-alpha-18

### December 8, 2024

- Added clear() method to data context to allow data removal.

## v.0.0-alpha-20

### May 12, 2025

- Added cookie validation.

## v.0.0-alpha-21

- Code refactoring and clean-up.
- Merged with i45-Sample-Data package.
- Implemented new public methods and chaining.
- PersistenceTypes have been deprecated, but remain for backward compatibility. Use StorageLocatons instead.
- Updated README.md

```javascript
// import modules
import { DataContext, StorageLocations } from "i45";

// create an instace of the context class.
const context = new DataContext();

// modify database properties as needed.
context.StorageLocation(StorageLocations.LocalStorage).DatabaseName("My Items");

// store a single value. The store method accepts an array of values.
context.store([1, "tennis ball", true, { id: 4, name: "John" }]);

// retrieve item from storage and do perform desired operation.
context.retrieve().then(async (i) => {
  console.log("My Items", i);
});

// clear storage.
context.remove();
```

### Merged i45-Sample-Data package

Full usage details can be found at [i45-Sample-Data](https://www.npmjs.com/package/i45-sample-data)

Sample data has been included in this package for convenience.

```javascript
import { SampleData } from "i45";

var books = SampleData.JsonData.Books;

console.log(books);
```

## v2.0.0

#### August 24, 2025

- This is a major release consisting of a complete refactoring of the data context. It is not compatible with 1.x.x versions.
- Consolidated the verbs removing deprecated methods and properties.
- Added remove() method to remove a specific data store.
- Refactored clear() method to clear all data stores.
- Added application logging support via the [i45-jslogger](https://www.npmjs.com/package/i45-jslogger) package.
- Logging is turned on/off via the enableLogging() method.
- Added default values to public method parameters to improve error handling.
- Deprecated methods removed.

## v2.1.0

#### August 28, 2025

- Added custom logging support via the registerLogger() method.
- The Logger must implement three of the browser console methods.
  - info(), warn(), and error().

```javascript
import { DataContext } from "i45";

// an instance of a logger is needed. it may be a class or any other module.
var myLogger = new CustomLogger();

var context = new DataContext();
context.registerLogger(myLogger);
```

- Upon successful registration, DataContext messages will be routed to the custom router.

## v2.2.0

### September 6, 2025

- Deprecated enableLogging, DataStoreName() and StorageLocations() methods.
- Added loggingEnabled, dataStoreName, and storageLocations properties with validation.
- Deprecated registerLogger() method. Added addClient() method.
- Allows for multiple clients to be added.
- Updated documentation.
