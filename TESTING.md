# Testing Guide for Random LOL

## Quick Start

Run all tests:
```bash
npm test
```

## Test Files Overview

```
src/app/
├── app.spec.ts                                          # Main app component tests
├── components/
│   ├── champion-randomizer.component.spec.ts            # Main randomizer logic tests
│   ├── control-header/
│   │   └── control-header.component.spec.ts             # Header controls tests
│   └── lane-card/
│       └── lane-card.component.spec.ts                  # Lane card tests
├── services/
│   ├── champion-data.service.spec.ts                    # Champion data loading tests
│   ├── image-preload.service.spec.ts                    # Image preloading tests
│   └── random-number.spec.ts                            # Random number generation tests
├── directives/
│   └── preload-link.directive.spec.ts                   # Preload link directive tests
└── interceptors/
    └── image-cache.interceptor.spec.ts                  # Image caching interceptor tests
```

## What's Tested

### Components (4)
- ✅ **App** - Main application component
- ✅ **ChampionRandomizerComponent** - Core randomization logic
- ✅ **ControlHeaderComponent** - User controls
- ✅ **LaneCardComponent** - Individual lane display

### Services (3)
- ✅ **ChampionDataService** - Data fetching and caching
- ✅ **ImagePreloadService** - Image preloading
- ✅ **RandomNumber** - Secure random generation

### Directives (1)
- ✅ **PreloadLinkDirective** - Link preloading

### Interceptors (1)
- ✅ **imageCacheInterceptor** - HTTP caching

## Key Test Scenarios

### Champion Randomizer
- Random champion assignment for each lane
- Lane enable/disable functionality
- Reroll system with bank management
- Duplicate champion prevention
- Shift-key forced rerolls
- Copy draft to clipboard

### Champion Data Service
- API data fetching
- LocalStorage caching (24-hour expiry)
- Cache validation and invalidation
- HTTP error handling
- Champion filtering and sorting

### Random Number Service
- Cryptographically secure random numbers
- Range validation
- Edge case handling

### Image Management
- Cache control headers
- Image preloading
- Duplicate prevention
- Cache expiration

## Test Configuration

The project uses:
- **Framework**: Jasmine
- **Runner**: Karma
- **Browser**: Chrome (or ChromeHeadless for CI)

## Continuous Integration

For CI environments without a display:
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Code Coverage

Generate coverage report:
```bash
ng test --no-watch --code-coverage
```

Coverage report will be available in `coverage/` directory.

## Best Practices Used

1. **Isolation**: Each test is independent
2. **Mocking**: External dependencies are mocked
3. **Async Handling**: Proper async/await patterns
4. **Signal Testing**: Angular signals are properly tested
5. **HTTP Testing**: Uses HttpClientTestingModule
6. **Protected Access**: Tests access protected members correctly

## Troubleshooting

### Tests won't run
- Ensure all dependencies are installed: `npm install`
- Check that Chrome is installed for Karma

### Specific test failing
- Run tests in watch mode: `npm test`
- Check console output for specific error messages

### Coverage not generating
- Ensure you're using the `--code-coverage` flag
- Check that all test files end with `.spec.ts`

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain high code coverage
4. Follow existing test patterns
