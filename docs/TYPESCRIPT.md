# TypeScript Guide for i45

Comprehensive guide to using i45 with TypeScript for maximum type safety.

## Table of Contents

- [Getting Started](#getting-started)
- [Type Parameters](#type-parameters)
- [Interface Definitions](#interface-definitions)
- [Type Safety Examples](#type-safety-examples)
- [Type Inference](#type-inference)
- [Advanced Patterns](#advanced-patterns)
- [TSConfig Recommendations](#tsconfig-recommendations)
- [Common TypeScript Patterns](#common-typescript-patterns)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

i45 is built with TypeScript and provides full type definitions out of the box.

### Installation

```bash
npm install i45
```

No need for `@types/i45` - types are included!

### Basic TypeScript Setup

```typescript
import { DataContext, StorageLocations, Logger } from "i45";

// Define your data type
interface User {
  id: number;
  name: string;
  email: string;
}

// Create type-safe context
const context = new DataContext<User>({
  storageKey: "Users",
  storageLocation: StorageLocations.LocalStorage,
});

// TypeScript knows the types!
await context.store([{ id: 1, name: "Alice", email: "alice@example.com" }]);

// users is typed as User[]
const users = await context.retrieve();
```

---

## Type Parameters

### Generic Type Parameter `<T>`

`DataContext` uses a generic type parameter to provide type safety.

```typescript
class DataContext<T = any> { ... }
```

**Default:** `any` (if not specified)

### Examples

#### Explicit Type

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

const context = new DataContext<Product>();
```

#### Using Default (any)

```typescript
const context = new DataContext(); // T = any
await context.store([1, 2, 3]); // Works, but no type safety
```

#### Type Inference

```typescript
const products: Product[] = [...];
const context = new DataContext<Product>();
await context.store(products); // Type-safe!

// TypeScript error - wrong type!
await context.store([{ id: 1 }]); // Error: missing 'name' and 'price'
```

---

## Interface Definitions

### Simple Interface

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const context = new DataContext<User>();
```

### Nested Interface

```typescript
interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface User {
  id: number;
  name: string;
  address: Address;
}

const context = new DataContext<User>();

await context.store([
  {
    id: 1,
    name: "Alice",
    address: {
      street: "123 Main St",
      city: "Springfield",
      zipCode: "12345",
    },
  },
]);
```

### Optional Properties

```typescript
interface User {
  id: number;
  name: string;
  email?: string; // Optional
  phone?: string; // Optional
}

const context = new DataContext<User>();

// Valid - email is optional
await context.store([
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob", email: "bob@example.com" },
]);
```

### Union Types

```typescript
type Status = "active" | "inactive" | "pending";

interface User {
  id: number;
  name: string;
  status: Status;
}

const context = new DataContext<User>();

await context.store([{ id: 1, name: "Alice", status: "active" }]);

// TypeScript error!
await context.store([
  { id: 2, name: "Bob", status: "invalid" }, // Error: "invalid" not in union
]);
```

### Enum Types

```typescript
enum UserRole {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

interface User {
  id: number;
  name: string;
  role: UserRole;
}

const context = new DataContext<User>();

await context.store([{ id: 1, name: "Alice", role: UserRole.Admin }]);
```

---

## Type Safety Examples

### Compile-Time Safety

TypeScript catches errors at compile time:

```typescript
interface User {
  id: number;
  name: string;
}

const context = new DataContext<User>();

// ✅ Valid
await context.store([{ id: 1, name: "Alice" }]);

// ❌ TypeScript Error: missing 'name'
await context.store([{ id: 1 }]);

// ❌ TypeScript Error: wrong type for 'id'
await context.store([{ id: "1", name: "Alice" }]);

// ❌ TypeScript Error: extra property
await context.store([{ id: 1, name: "Alice", extra: "value" }]);
```

### Type-Safe Retrieval

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

const context = new DataContext<Product>();

// products is typed as Product[]
const products = await context.retrieve();

// TypeScript knows the type!
products.forEach((product) => {
  console.log(product.name); // ✅ Valid
  console.log(product.price); // ✅ Valid
  console.log(product.invalid); // ❌ Error: property doesn't exist
});

// Type-safe operations
const total = products.reduce((sum, p) => sum + p.price, 0);
```

---

## Type Inference

TypeScript can infer types from context.

### From Variable Type

```typescript
interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];

const context = new DataContext<User>();
await context.store(users); // Type inferred from 'users'
```

### From Function Return

```typescript
function getUsers(): User[] {
  return [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];
}

const context = new DataContext<User>();
await context.store(getUsers()); // Type inferred from function
```

### From Imported Types

```typescript
import { StateType } from "i45-sample-data";

const context = new DataContext<StateType>();
// TypeScript knows the structure of StateType
```

---

## Advanced Patterns

### Readonly Properties

```typescript
interface User {
  readonly id: number;
  name: string;
}

const context = new DataContext<User>();
const users = await context.retrieve();

// TypeScript error - id is readonly!
users[0].id = 999; // Error
```

### Partial Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Store partial updates
type PartialUser = Partial<User> & { id: number };

const context = new DataContext<PartialUser>();
await context.store([
  { id: 1, name: "Alice" }, // email is optional
  { id: 2, email: "bob@example.com" }, // name is optional
]);
```

### Pick and Omit

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Store only public fields
type PublicUser = Omit<User, "password">;

const context = new DataContext<PublicUser>();
await context.store([
  { id: 1, name: "Alice", email: "alice@example.com" },
  // password is not included
]);

// Or pick specific fields
type UserSummary = Pick<User, "id" | "name">;

const summaryContext = new DataContext<UserSummary>();
await summaryContext.store([{ id: 1, name: "Alice" }]);
```

### Generic Constraints

```typescript
interface HasId {
  id: string | number;
}

function createContext<T extends HasId>(key: string) {
  return new DataContext<T>({ storageKey: key });
}

interface User {
  id: number;
  name: string;
}

// ✅ Valid - User has 'id'
const userContext = createContext<User>("Users");

interface NoId {
  name: string;
}

// ❌ Error - NoId doesn't have 'id'
const noIdContext = createContext<NoId>("NoId");
```

### Type Guards

```typescript
interface User {
  id: number;
  name: string;
}

function isUser(obj: any): obj is User {
  return typeof obj.id === "number" && typeof obj.name === "string";
}

const context = new DataContext<User>();
const data = await context.retrieve();

data.forEach((item) => {
  if (isUser(item)) {
    console.log(item.name); // TypeScript knows it's a User
  }
});
```

---

## TSConfig Recommendations

### Recommended `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Key Settings for i45

- **`strict: true`** - Enables all strict type checking
- **`esModuleInterop: true`** - Enables ES module interop
- **`moduleResolution: "bundler"`** - Modern module resolution
- **`lib: ["DOM"]`** - Required for localStorage/sessionStorage types

---

## Common TypeScript Patterns

### Pattern 1: Config Object with Types

```typescript
import { DataContext, DataContextConfig, StorageLocations } from "i45";

interface User {
  id: number;
  name: string;
}

const config: DataContextConfig = {
  storageKey: "Users",
  storageLocation: StorageLocations.SessionStorage,
  loggingEnabled: true,
};

const context = new DataContext<User>(config);
```

### Pattern 2: Type-Safe Error Handling

```typescript
import {
  DataContext,
  StorageKeyError,
  StorageQuotaError,
  DataRetrievalError,
} from "i45";

const context = new DataContext<User>();

try {
  await context.store(users);
} catch (error) {
  if (error instanceof StorageKeyError) {
    console.error("Invalid key:", error.key);
  } else if (error instanceof StorageQuotaError) {
    console.error("Quota exceeded:", error.storageType);
  } else if (error instanceof DataRetrievalError) {
    console.error("Retrieval failed:", error.key);
  }
}
```

### Pattern 3: Factory Function

```typescript
function createTypedContext<T>(
  key: string,
  useSession: boolean = false
): DataContext<T> {
  return new DataContext<T>({
    storageKey: key,
    storageLocation: useSession
      ? StorageLocations.SessionStorage
      : StorageLocations.LocalStorage,
  });
}

// Usage
const userContext = createTypedContext<User>("Users");
const sessionContext = createTypedContext<Session>("Sessions", true);
```

### Pattern 4: Async Initialization

```typescript
interface User {
  id: number;
  name: string;
}

async function initUserContext(): Promise<DataContext<User>> {
  const context = new DataContext<User>({ storageKey: "Users" });

  // Load initial data
  try {
    await context.retrieve();
  } catch (error) {
    // Initialize with empty array if no data
    await context.store([]);
  }

  return context;
}

// Usage
const context = await initUserContext();
```

### Pattern 5: Multiple Contexts

```typescript
interface User {
  id: number;
  name: string;
}

interface Settings {
  theme: "light" | "dark";
  notifications: boolean;
}

class AppStorage {
  private userContext: DataContext<User>;
  private settingsContext: DataContext<Settings>;

  constructor() {
    this.userContext = new DataContext<User>({ storageKey: "Users" });
    this.settingsContext = new DataContext<Settings>({
      storageKey: "Settings",
    });
  }

  async saveUser(user: User): Promise<void> {
    const users = await this.userContext.retrieve();
    users.push(user);
    await this.userContext.store(users);
  }

  async getSettings(): Promise<Settings | null> {
    const settings = await this.settingsContext.retrieve();
    return settings[0] || null;
  }
}
```

---

## Troubleshooting

### Issue: "Cannot find module 'i45'"

**Solution:** Ensure i45 is installed:

```bash
npm install i45
```

### Issue: "Type 'any' is not assignable to type 'T'"

**Problem:** Not providing a generic type parameter.

**Solution:** Specify the type:

```typescript
// ❌ Bad
const context = new DataContext();

// ✅ Good
const context = new DataContext<User>();
```

### Issue: "Property does not exist on type"

**Problem:** TypeScript doesn't know the structure.

**Solution:** Define an interface:

```typescript
interface MyData {
  id: number;
  name: string;
}

const context = new DataContext<MyData>();
const data = await context.retrieve();
console.log(data[0].name); // ✅ TypeScript knows the type
```

### Issue: "Argument of type X is not assignable to parameter of type Y"

**Problem:** Type mismatch.

**Solution:** Check your data structure matches the interface:

```typescript
interface User {
  id: number;
  name: string;
}

const context = new DataContext<User>();

// ❌ Wrong type
await context.store([
  { id: "1", name: "Alice" }, // id should be number
]);

// ✅ Correct
await context.store([{ id: 1, name: "Alice" }]);
```

### Issue: "Object is possibly 'null'"

**Problem:** Strict null checks enabled.

**Solution:** Handle null cases:

```typescript
const users = await context.retrieve();

// ❌ May be null
console.log(users[0].name);

// ✅ Safe
if (users && users.length > 0) {
  console.log(users[0].name);
}

// ✅ Using optional chaining
console.log(users?.[0]?.name);
```

---

## See Also

- [API.md](./API.md) - Complete API reference
- [README.md](../README.md) - Getting started
- [EXAMPLES.md](./EXAMPLES.md) - More examples
- [MIGRATION.md](./MIGRATION.md) - Migration guide

---

**i45 v3.0.0+** | [GitHub](https://github.com/yourusername/i45) | [npm](https://www.npmjs.com/package/i45)
