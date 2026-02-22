# Testing

This directory contains all tests for the Thinkix project.

## Running Tests

**IMPORTANT**: This project uses **Vitest**, not Bun's built-in test runner.

```bash
# Run all tests (Vitest)
bun run test

# Run tests once (CI mode)
bun run test:run

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

**Note**: Do NOT use `bun test` - that runs Bun's native test runner which is not configured for this project. Always use `bun run test` commands.

## Writing Tests

### Unit Tests

Place unit tests in `tests/unit/`. These test individual functions or modules in isolation.

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@thinkix/my-package';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe('expected');
  });
});
```

### Component Tests

Place component tests in `tests/components/`. Use React Testing Library.

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@thinkix/ui';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

Place integration tests in `tests/integration/`. These test multiple modules working together.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyStore } from '@thinkix/my-package';

describe('useMyStore', () => {
  beforeEach(() => {
    // Reset store state
  });

  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());
    // assertions
  });
});
```

## Mocks

### Available Mocks

The setup file (`tests/__mocks__/setup.ts`) provides mocks for:

- **Canvas API**: `HTMLCanvasElement.getContext`, `toDataURL`, `toBlob`
- **File System API**: `FileSystemFileHandle`, `FileSystemDirectoryHandle`
- **browser-fs-access**: `fileOpen`, `fileSave`
- **IndexedDB**: Basic indexedDB mock
- **Plait Core**: `toSvgData`, `toImage`, `getSelectedElements`
- **Plait React Board**: `useBoard`, `useListRender`
- **Other**: `ResizeObserver`, `IntersectionObserver`, `matchMedia`, `PointerEvent`

### Using Mocks

```typescript
import { vi } from 'vitest';

// Override a mock for a specific test
vi.mock('@plait/core', async () => {
  const actual = await vi.importActual('@plait/core');
  return {
    ...actual,
    getSelectedElements: vi.fn().mockReturnValue([{ id: '1' }]),
  };
});
```

## Test Utilities

### createMockBoard

Creates a mock PlaitBoard for testing:

```typescript
import { createMockBoard } from '../__utils__/test-utils';

const board = createMockBoard({
  elements: [{ id: '1', type: 'shape' }],
  viewport: { zoom: 1, x: 0, y: 0 },
});
```

### createMockThinkixFile

Creates a mock .thinkix file:

```typescript
import { createMockThinkixFile } from '../__utils__/test-utils';

const file = createMockThinkixFile([{ id: '1' }], 'test.thinkix');
```

## Coverage

Coverage reports are generated in the `coverage/` directory after running `bun run test:coverage`.

Coverage thresholds are set to 70% for:
- Lines
- Functions
- Branches
- Statements

## CI/CD

Tests run automatically on:
- Every push to `main`
- Every pull request to `main`

The GitHub Actions workflow:
1. Installs dependencies
2. Runs linting
3. Runs type checking
4. Runs tests with coverage
5. Builds the application

## Best Practices

1. **Descriptive test names**: Use clear, descriptive test names
2. **One assertion per test**: Keep tests focused
3. **Use beforeEach/afterEach**: Clean up between tests
4. **Mock external dependencies**: Don't rely on external services
5. **Test edge cases**: Not just happy paths
6. **Keep tests fast**: Use mocks instead of real implementations
