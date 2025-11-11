# Stored Signals

This document explains how persistent state management works in this application using the `storedSignal` utility.

## Overview

The application uses a custom `storedSignal` utility to automatically persist signal values to localStorage. This provides a seamless way to maintain user preferences and state across browser sessions.

## What is storedSignal?

`storedSignal` is a utility function located in `src/app/shared/utils/stored-signal.ts` that creates Angular signals with automatic localStorage persistence. It combines the reactivity of Angular signals with the durability of browser storage.

### Key Features

- **Automatic Persistence**: Changes are automatically saved to localStorage with debouncing (default: 300ms)
- **SSR-Safe**: Works in server-side rendering environments where localStorage is unavailable
- **Type-Safe**: Full TypeScript support with generic types
- **Error Handling**: Gracefully handles localStorage errors and corrupted data
- **Initialization**: Automatically restores values from localStorage on creation

## Usage

### Basic Usage

```typescript
import { inject, Injector } from '@angular/core';
import { storedSignal } from '../shared/utils/stored-signal';

export class MyService {
  private readonly injector = inject(Injector);
  
  // Create a stored signal
  public readonly mySetting = storedSignal<string>(
    'my.setting.key',      // localStorage key
    'default value',       // default/initial value
    this.injector,         // Angular injector
  );
  
  // Use it like a normal signal
  changeValue() {
    this.mySetting.set('new value');  // Automatically saved to localStorage
  }
}
```

### With Custom Debounce

```typescript
public readonly fastSetting = storedSignal<number>(
  'fast.setting',
  0,
  this.injector,
  100  // Custom debounce in milliseconds
);
```

## Current Usage in the App

### 1. Randomizer Settings (`RandomizerStateService`)

**Location**: `src/app/services/randomizer-state.service.ts`

```typescript
// Blacklisted champions (fearless draft)
public readonly blacklistedChampions = storedSignal<string[]>(
  'randomizer.blacklistedChampions',
  [],
  this.injector,
);

// Fearless draft enabled/disabled
public readonly fearlessDraftEnabled = storedSignal<boolean>(
  'randomizer.fearlessDraftEnabled',
  true,
  this.injector,
);
```

**What's Stored**:
- List of blacklisted champion names (accumulated when fearless draft is enabled)
- Whether fearless draft mode is enabled

**Behavior**:
- When fearless draft is enabled, selected champions are automatically added to the blacklist
- Blacklist persists across sessions, so users can continue their fearless draft series
- When fearless draft is disabled, the blacklist is cleared

### 2. Language Preference (`LanguageService`)

**Location**: `src/app/services/language.service.ts`

```typescript
public readonly currentLang = storedSignal<string>(
  'app.language',
  this.getInitialLanguage(),
  this.injector,
);
```

**What's Stored**:
- The user's selected language code (e.g., 'en', 'fr', 'zh')

**Behavior**:
- Language preference persists across sessions
- Automatically syncs with the TranslateService
- Falls back to browser language detection for first-time users
- Handles migration from old 'lang' localStorage key

## localStorage Keys

All stored values use namespaced keys to avoid conflicts:

| Key | Type | Purpose |
|-----|------|---------|
| `randomizer.blacklistedChampions` | `string[]` | List of blacklisted champion names |
| `randomizer.fearlessDraftEnabled` | `boolean` | Fearless draft mode toggle |
| `app.language` | `string` | User's language preference |

## Benefits

1. **User Experience**: Settings and preferences are preserved across sessions
2. **Fearless Draft**: Players can continue their draft series even after closing the browser
3. **Performance**: Debouncing prevents excessive localStorage writes
4. **Type Safety**: TypeScript ensures type correctness at compile time
5. **Maintainability**: Centralized storage logic in one utility function

## Best Practices

1. **Use Descriptive Keys**: Prefix keys with module/feature names (e.g., `randomizer.`, `app.`)
2. **Provide Sensible Defaults**: Always include a reasonable initial value
3. **Keep Data JSON-Serializable**: Store simple data structures (primitives, arrays, objects)
4. **Don't Store Sensitive Data**: localStorage is not secure; never store passwords or tokens

## Testing

When testing components or services that use `storedSignal`, ensure:

1. Clear localStorage before each test
2. Use `provideZonelessChangeDetection()` in TestBed setup
3. Call `TestBed.flushEffects()` after signal changes to trigger effects
4. Wait for debounce timeouts when testing persistence

Example:
```typescript
it('should persist value', (done) => {
  service.mySetting.set('new value');
  TestBed.flushEffects();
  
  setTimeout(() => {
    expect(localStorage.getItem('my.setting.key')).toBe('"new value"');
    done();
  }, 400); // Wait for 300ms debounce + buffer
});
```

## Future Enhancements

Potential improvements to consider:

- [ ] Add support for session storage
- [ ] Implement storage quota management
- [ ] Add encryption option for sensitive data
- [ ] Support for storage events (sync across tabs)
- [ ] Configurable serialization/deserialization functions
- [ ] Storage versioning and migration support
