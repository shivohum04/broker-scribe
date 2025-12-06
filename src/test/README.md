# Test Suite

This directory contains automated tests for the core business logic of the application.

## Test Framework

- **Vitest** - Fast, Vite-native unit test framework
- **jsdom** - DOM environment for browser API testing

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Test Coverage

### 1. Calculations (`calculations.test.ts`)
Tests core property calculation logic:
- **Unit conversions**: sqft ↔ acres ↔ hectare
- **Total price calculation**: Handles different rate types (total, per_sqft, per_acre, per_hectare)
- **Rate per unit calculation**: Converts rates to per-unit values
- **Edge cases**: Zero values, null handling, unknown types

### 2. Rate Formatter (`rate-formatter.test.ts`)
Tests Indian currency formatting:
- **Lakhs/Crores conversion**: Formats large amounts in Indian number system
- **Rate type formatting**: Handles total vs per-unit rates
- **Edge cases**: Zero rates, unknown types

### 3. Media Utilities (`media-utils.test.ts`)
Tests media handling utilities:
- **Thumbnail URL generation**: Converts original URLs to thumbnail URLs
- **Media type detection**: Identifies images, videos, and unknown types
- **File size formatting**: Formats bytes to human-readable sizes
- **Thumbnail size estimation**: Estimates compressed thumbnail sizes

### 4. Upload Utilities (`upload-utils.test.ts`)
Tests file upload validation:
- **File type validation**: Images and videos
- **File size validation**: Enforces size limits
- **File size formatting**: Utility function tests

### 5. Property Mapping (`property-mapping.test.ts`)
Tests database-to-domain model mapping:
- **Field mapping**: snake_case (DB) → camelCase (Domain)
- **Null handling**: Optional fields, empty arrays
- **Type conversions**: Rate types, size units
- **JSONB fields**: Media and cover thumbnail handling

## Test Philosophy

These tests focus on **pure business logic** rather than UI components:
- ✅ Pure functions (calculations, formatters, validators)
- ✅ Data transformations (DB → Domain mapping)
- ✅ Utility functions (URL manipulation, file handling)
- ❌ React components (tested manually/integration)
- ❌ API calls (mocked in integration tests)

## Adding New Tests

When adding new business logic:
1. Create a test file in `src/test/`
2. Follow the naming convention: `*.test.ts`
3. Use descriptive test names that read like documentation
4. Test normal cases, edge cases, and error conditions
5. Keep tests focused and independent

## Example Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/my-module';

describe('MyModule', () => {
  describe('myFunction', () => {
    it('handles normal case correctly', () => {
      expect(myFunction(input)).toBe(expected);
    });

    it('handles edge case correctly', () => {
      expect(myFunction(edgeInput)).toBe(expected);
    });
  });
});
```
