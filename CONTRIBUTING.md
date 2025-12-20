# Contributing to i45

Thank you for your interest in contributing to i45! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Getting Help](#getting-help)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

**Expected Behavior:**

- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community and project
- Show empathy towards other community members

---

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/i45.git
   cd i45
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/xnodeoncode/i45.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

---

## Development Setup

### Prerequisites

- **Node.js:** >= 14.0.0
- **npm:** >= 6.0.0
- **TypeScript:** 5.9+ (installed as dev dependency)

### Installation

```bash
# Install all dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Watch mode for development
npm run dev
```

### Available Scripts

```bash
npm run build          # Clean, compile TypeScript, and bundle with Rollup
npm run build:types    # Generate TypeScript declarations
npm run build:bundle   # Bundle with Rollup
npm run clean          # Remove dist directory
npm run dev            # Watch mode for development
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run typecheck      # Type check without emitting files
npm run lint           # Lint TypeScript files
```

---

## Project Structure

```
i45/
├── src/
│   ├── core/              # Core classes (DataContext, StorageManager)
│   ├── services/          # Storage service implementations
│   │   └── base/          # Base service abstractions
│   ├── models/            # Data models and types
│   ├── errors/            # Custom error classes
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── tests/                 # Test files
│   ├── setup.ts           # Test configuration
│   ├── test-utils.ts      # Testing utilities
│   └── *.test.ts          # Test files
├── docs/                  # Documentation
│   ├── API.md             # API reference
│   ├── TYPESCRIPT.md      # TypeScript guide
│   ├── EXAMPLES.md        # Usage examples
│   ├── MIGRATION.md       # Migration guide
│   └── TESTING.md         # Testing documentation
├── dist/                  # Compiled output (generated)
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── rollup.config.js       # Rollup bundler configuration
└── jest.config.json       # Jest test configuration
```

---

## Coding Standards

### TypeScript

- **Strict Mode:** All code must pass TypeScript strict mode checks
- **No `any` types:** Use proper types or `unknown` when type is truly unknown
- **Generic Types:** Leverage TypeScript generics for type safety
- **Explicit Return Types:** Always specify return types for functions

```typescript
// ✅ Good
export function validateKey(key: string): boolean {
  return typeof key === "string" && key.trim().length > 0;
}

// ❌ Avoid
export function validateKey(key) {
  return typeof key === "string" && key.trim().length > 0;
}
```

### Naming Conventions

- **Classes:** PascalCase (`DataContext`, `StorageManager`)
- **Interfaces/Types:** PascalCase with descriptive names (`StorageLocation`, `DataContextConfig`)
- **Functions/Methods:** camelCase (`store`, `retrieve`, `validateStorageKey`)
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Private Fields:** Use `#` prefix for private class fields (`#storageKey`)

### Code Style

- **Indentation:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Double quotes for strings
- **Line Length:** Prefer lines under 100 characters
- **Comments:** Use JSDoc for public APIs

```typescript
/**
 * Stores items in browser storage
 *
 * @param items - Array of items to store
 * @returns Promise resolving to the DataContext instance
 * @throws {StorageKeyError} If storage key is invalid
 *
 * @example
 * await context.store([{ id: 1, name: "Item 1" }]);
 */
async store(items: T[]): Promise<this> {
  // Implementation
}
```

### Linting

Run ESLint before committing:

```bash
npm run lint
```

All code must pass linting without errors.

---

## Testing Guidelines

### Test Coverage Requirements

- **Statement Coverage:** Minimum 80% (current: 92%)
- **Branch Coverage:** Target 80% (current: 68%)
- **All new features:** Must include tests
- **Bug fixes:** Should include regression tests

### Writing Tests

```typescript
describe("DataContext", () => {
  describe("store()", () => {
    it("should store items successfully", async () => {
      const context = new DataContext();
      const items = [{ id: 1, name: "Test" }];

      await context.store(items);
      const retrieved = await context.retrieve();

      expect(retrieved).toEqual(items);
    });

    it("should throw error for invalid items", async () => {
      const context = new DataContext();

      await expect(context.store(null as any)).rejects.toThrow(TypeError);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/dataContext.test.ts
```

### Test Files

- Place test files in `tests/` directory
- Name test files: `*.test.ts`
- Group related tests using `describe()` blocks
- Use descriptive test names with `it()` or `test()`

---

## Submitting Changes

### Branch Naming

Use descriptive branch names:

```
feature/add-indexeddb-support
fix/storage-quota-error
docs/update-api-reference
refactor/simplify-validation
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(services): add IndexedDB storage service

Implements IndexedDBService extending BaseStorageService.
Includes full test coverage and documentation.

Closes #42

---

fix(validation): handle empty string in storage key

Previously, empty strings were not properly validated.
Now throws StorageKeyError for empty/whitespace keys.

Fixes #38

---

docs(api): update DataContext examples

Added TypeScript examples and improved clarity
for store/retrieve methods.
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following coding standards
3. **Write/update tests** ensuring coverage requirements
4. **Update documentation** if needed
5. **Run all checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
6. **Commit your changes** with clear commit messages
7. **Push to your fork**
8. **Create a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/examples if applicable

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] Test coverage maintained or improved
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with `main`

---

## Reporting Bugs

### Before Submitting

1. **Check existing issues** to avoid duplicates
2. **Test with latest version** of i45
3. **Gather information**:
   - i45 version
   - Browser/environment
   - Steps to reproduce
   - Expected vs actual behavior

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Create DataContext with '...'
2. Call method '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**

- i45 version: [e.g., 3.0.0]
- Browser: [e.g., Chrome 120]
- TypeScript version: [e.g., 5.9.3]

**Additional context**
Any other relevant information.
```

**Submit at:** [GitHub Issues](https://github.com/xnodeoncode/i45/issues)

---

## Suggesting Features

We welcome feature suggestions! When suggesting a feature:

1. **Check existing issues** and discussions
2. **Explain the use case** - why is this needed?
3. **Describe the solution** - how should it work?
4. **Consider alternatives** - other approaches?
5. **Assess breaking changes** - does it affect existing APIs?

### Feature Request Template

````markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**API Design (if applicable)**

```typescript
// Proposed API usage
const context = new DataContext();
await context.newFeature();
```
````

**Additional context**
Any other relevant information.

```

**Submit at:** [GitHub Discussions](https://github.com/xnodeoncode/i45/discussions)

---

## Getting Help

### Documentation

- **README:** [README.md](./README.md) - Getting started
- **API Reference:** [docs/API.md](./docs/API.md) - Complete API documentation
- **TypeScript Guide:** [docs/TYPESCRIPT.md](./docs/TYPESCRIPT.md) - TypeScript usage
- **Examples:** [docs/EXAMPLES.md](./docs/EXAMPLES.md) - Comprehensive examples
- **Migration Guide:** [docs/MIGRATION.md](./docs/MIGRATION.md) - v2.x → v3.x migration

### Community

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and discussions
- **Email:** cisguru@outlook.com

### Development Questions

If you have questions about:
- **Architecture:** Review [docs/API.md](./docs/API.md) architecture section
- **Testing:** See [docs/EXAMPLES.md](./docs/EXAMPLES.md) testing examples
- **TypeScript:** Check [docs/TYPESCRIPT.md](./docs/TYPESCRIPT.md)
- **Still stuck?** Open a discussion on GitHub

---

## License

By contributing to i45, you agree that your contributions will be licensed under the MIT License.

---

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- CHANGES.md for significant contributions
- Special thanks in release notes

Thank you for contributing to i45! 🎉
```
