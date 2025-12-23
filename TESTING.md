# Testing Guide

This document provides detailed information about the testing setup and best practices for the Learn a Maze project.

## Overview

The project uses **Vitest** as the test runner and **React Testing Library** for component testing. The test suite ensures that dependency updates from Dependabot don't break core functionality.

## Test Statistics

- **Total Tests:** 79
- **Test Files:** 3
- **Test Coverage:** Services and UI components

### Test Breakdown

#### MazeGenerator Tests (15 tests)

Tests for the maze generation algorithm in [`services/MazeGenerator.test.ts`](services/MazeGenerator.test.ts):

- Constructor and initialization
- Maze generation with correct dimensions
- Deterministic maze generation (same seed produces identical mazes)
- Start and goal position accessibility
- Corner carving for navigation
- Cell coordinate validation
- Path vs. wall ratio
- Different maze sizes support
- Minimum viable maze size handling
- Path connectivity verification

#### QLearningAgent Tests (41 tests)

Tests for the Q-learning algorithm in [`services/QLearningAgent.test.ts`](services/QLearningAgent.test.ts):

- Constructor and parameter initialization
- Q-value retrieval and initialization
- Maximum Q-value calculation
- Action selection (exploration vs. exploitation)
- Bellman equation implementation
- Learning rate (alpha) application
- Discount factor (gamma) application
- Epsilon decay (curiosity reduction)
- Q-table reset functionality
- Parameter updates
- Q-table state management
- Integration scenarios and learning cycles

#### LandingPage Tests (23 tests)

Tests for the React landing page in [`components/LandingPage.test.tsx`](components/LandingPage.test.tsx):

- Component rendering
- Navigation elements
- CTA buttons
- Educational content display
- Code snippets and explanations
- Navigation callbacks
- Hero animation (mocked)
- Information cards
- Accessibility features

## Running Tests

### Interactive Watch Mode

Best for development - automatically reruns tests on file changes:

```bash
npm test
```

### Single Run (CI Mode)

Runs all tests once and exits - used in CI/CD:

```bash
npm run test:run
```

### UI Mode

Opens an interactive browser-based UI for exploring tests:

```bash
npm run test:ui
```

### Coverage Report

Generates detailed coverage reports in HTML, JSON, and text formats:

```bash
npm run test:coverage
```

Coverage reports are saved to the `coverage/` directory (gitignored).

## Test Configuration

### Vitest Configuration ([`vitest.config.ts`](vitest.config.ts))

- **Test Environment:** jsdom (browser-like environment)
- **Globals:** Enabled for cleaner test syntax
- **Setup Files:** [`vitest.setup.ts`](vitest.setup.ts) for global test configuration
- **Coverage Provider:** v8 (built-in, fast)
- **Pool:** forks (for better isolation)

### Setup File ([`vitest.setup.ts`](vitest.setup.ts))

- Imports `@testing-library/jest-dom` matchers for enhanced assertions
- Configures automatic cleanup after each test

## Writing Tests

### Best Practices

1. **Use descriptive test names**

   ```typescript
   it("should generate a maze with correct dimensions", () => {
     // test implementation
   });
   ```

2. **Organize tests with describe blocks**

   ```typescript
   describe("MazeGenerator", () => {
     describe("generate", () => {
       it("should...", () => {});
     });
   });
   ```

3. **Clean up after tests**

   ```typescript
   beforeEach(() => {
     // setup
   });
   ```

4. **Test behavior, not implementation**

   - Focus on what the code does, not how it does it
   - Test from the user's perspective

5. **Use appropriate queries**
   - `getByRole` for semantic queries
   - `getByText` for text content
   - `getAllByText` when multiple elements match

### Example Test Structure

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  beforeEach(() => {
    // Setup code
  });

  describe("feature group", () => {
    it("should do something specific", () => {
      // Arrange
      const input = "test";

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

The CI pipeline runs on every push and pull request:

1. **Test Job**

   - Runs on Node.js 18.x, 20.x, and 22.x
   - Executes full test suite
   - Generates coverage report (Node 20.x only)
   - Uploads coverage to Codecov

2. **Build Job**

   - Runs after tests pass
   - Creates production build
   - Uploads build artifacts

3. **TypeScript Check Job**
   - Validates TypeScript types
   - Ensures no type errors

### Dependabot Configuration ([`.github/dependabot.yml`](.github/dependabot.yml))

Automated dependency updates:

- **Schedule:** Weekly on Mondays
- **Package Ecosystem:** npm and GitHub Actions
- **Grouping:** Separates dev and production dependencies
- **Auto-labeling:** Tags PRs with "dependencies" label

## Troubleshooting

### Tests Failing After Dependency Update

1. Check if the test failure is legitimate (breaking change in dependency)
2. Review the dependency's changelog
3. Update test expectations if needed
4. Update code if the dependency API changed

### Coverage Not Generated

Ensure you're using the coverage command:

```bash
npm run test:coverage
```

### Tests Timing Out

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Mock Issues with Three.js/React Components

We mock heavy dependencies like MazeScene:

```typescript
vi.mock("./MazeScene", () => ({
  MazeScene: () => <div data-testid="maze-scene">Mock</div>,
}));
```

## Continuous Improvement

### Adding New Tests

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure tests are isolated and repeatable
3. Update this documentation if adding new test patterns
4. Maintain or improve coverage percentage

### Reviewing Test PRs

When reviewing test changes:

- Verify tests actually test the intended behavior
- Check for test isolation (no shared state)
- Ensure descriptive test names
- Confirm proper cleanup
- Look for edge cases

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Happy Testing!** 🧪
