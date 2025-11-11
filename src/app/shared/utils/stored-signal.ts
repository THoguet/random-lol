import { signal, effect, WritableSignal, Injector, runInInjectionContext } from '@angular/core';

/**
 * Checks if localStorage is available in the current environment.
 * @returns true if localStorage is accessible, false otherwise
 */
function isLocalStorageAvailable(): boolean {
	try {
		return typeof localStorage !== 'undefined' && localStorage !== null;
	} catch {
		return false;
	}
}

/**
 * Cache for stored signal values to avoid redundant localStorage reads.
 * Maps storage keys to their parsed values.
 */
const signalCache = new Map<string, unknown>();

/**
 * Cache for stored Map signal values to avoid redundant localStorage reads.
 * Maps storage keys to their parsed Map instances.
 */
const mapSignalCache = new Map<string, Map<unknown, unknown>>();

/**
 * Cache for stored Set signal values to avoid redundant localStorage reads.
 * Maps storage keys to their parsed Set instances.
 */
const setSignalCache = new Map<string, Set<unknown>>();

/**
 * Creates a signal that automatically persists its value to localStorage.
 *
 * The signal will:
 * - Initialize with the stored value from localStorage if available
 * - Fall back to the provided initial value if no stored value exists or parsing fails
 * - Automatically sync changes to localStorage with debouncing (300ms delay)
 * - Work safely in SSR and environments where localStorage is unavailable
 *
 * @template T - The type of value stored in the signal (must be JSON-serializable)
 * @param key - The localStorage key used to store the value
 * @param initialValue - The default value used when no stored value exists
 * @param injector - The Angular injector (use inject(Injector) to get current context)
 * @param debounceMs - Optional debounce delay in milliseconds (default: 300ms)
 * @returns A writable signal that persists to localStorage
 *
 * @example
 * ```typescript
 * const injector = inject(Injector);
 * const darkMode = storedSignal('theme.darkMode', false, injector);
 * darkMode.set(true); // Automatically saved to localStorage after 300ms
 * console.log(darkMode()); // true
 * ```
 *
 * @remarks
 * - Requires an Injector to create the effect in the proper context
 * - Values must be JSON-serializable (no functions, circular references, etc.)
 * - In SSR or when localStorage is unavailable, the signal works normally but won't persist
 * - Corrupted localStorage data is automatically cleared and reset to initial value
 * - localStorage writes are debounced to improve performance with frequent updates
 */
export function storedSignal<T>(
	key: string,
	initialValue: T,
	injector: Injector,
	debounceMs = 300,
): WritableSignal<T> {
	let parsedValue = initialValue;

	// Check cache first
	if (signalCache.has(key)) {
		parsedValue = signalCache.get(key) as T;
	} else if (isLocalStorageAvailable()) {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				parsedValue = JSON.parse(storedValue) as T;
				// Cache the parsed value
				signalCache.set(key, parsedValue);
			}
		} catch (error) {
			console.warn(
				`Failed to parse stored value for key "${key}". Using initial value.`,
				error,
			);
			try {
				localStorage.removeItem(key);
			} catch {
				// Ignore removal errors
			}
		}
	}

	const s = signal(parsedValue);

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let isFirstRun = true;

	runInInjectionContext(injector, () => {
		effect(() => {
			const value = s();

			// Skip the first execution to avoid writing back what we just read
			if (isFirstRun) {
				isFirstRun = false;
				return;
			}

			// Clear any pending timeout
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}

			// Debounce the localStorage write
			timeoutId = setTimeout(() => {
				if (isLocalStorageAvailable()) {
					try {
						localStorage.setItem(key, JSON.stringify(value));
						// Update cache
						signalCache.set(key, value);
					} catch (error) {
						console.warn(
							`Failed to save value for key "${key}" to localStorage.`,
							error,
						);
					}
				}
				timeoutId = null;
			}, debounceMs);
		});
	});

	return s;
}

/**
 * Creates a signal that automatically persists a Map to localStorage.
 *
 * The signal will:
 * - Initialize with the stored Map from localStorage if available
 * - Fall back to the provided initial Map if no stored value exists or parsing fails
 * - Automatically sync changes to localStorage with debouncing (300ms delay)
 * - Work safely in SSR and environments where localStorage is unavailable
 *
 * @template K - The type of the Map keys (must be JSON-serializable)
 * @template V - The type of the Map values (must be JSON-serializable)
 * @param key - The localStorage key used to store the Map
 * @param initialValue - The default Map used when no stored value exists
 * @param injector - The Angular injector (use inject(Injector) to get current context)
 * @param debounceMs - Optional debounce delay in milliseconds (default: 300ms)
 * @returns A writable signal containing a Map that persists to localStorage
 *
 * @example
 * ```typescript
 * const injector = inject(Injector);
 * const userPrefs = storedMapSignal<string, boolean>('user.preferences', new Map(), injector);
 * userPrefs.update(map => new Map(map).set('darkMode', true));
 * console.log(userPrefs().get('darkMode')); // true
 * ```
 *
 * @remarks
 * - Requires an Injector to create the effect in the proper context
 * - Keys and values must be JSON-serializable (no functions, circular references, etc.)
 * - In SSR or when localStorage is unavailable, the signal works normally but won't persist
 * - Corrupted localStorage data is automatically cleared and reset to initial Map
 * - localStorage writes are debounced to improve performance with frequent updates
 * - Maps are stored as arrays of [key, value] pairs in localStorage
 */
export function storedMapSignal<K, V>(
	key: string,
	initialValue: Map<K, V>,
	injector: Injector,
	debounceMs = 300,
): WritableSignal<Map<K, V>> {
	let parsedValue = initialValue;

	// Check cache first
	if (mapSignalCache.has(key)) {
		parsedValue = mapSignalCache.get(key) as Map<K, V>;
	} else if (isLocalStorageAvailable()) {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				const entries = JSON.parse(storedValue) as Array<[K, V]>;
				parsedValue = new Map(entries);
				// Cache the parsed Map
				mapSignalCache.set(key, parsedValue as Map<unknown, unknown>);
			}
		} catch (error) {
			console.warn(
				`Failed to parse stored Map for key "${key}". Using initial value.`,
				error,
			);
			try {
				localStorage.removeItem(key);
			} catch {
				// Ignore removal errors
			}
		}
	}

	const s = signal(parsedValue);

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let isFirstRun = true;

	runInInjectionContext(injector, () => {
		effect(() => {
			const value = s();

			// Skip the first execution to avoid writing back what we just read
			if (isFirstRun) {
				isFirstRun = false;
				return;
			}

			// Clear any pending timeout
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}

			// Debounce the localStorage write
			timeoutId = setTimeout(() => {
				if (isLocalStorageAvailable()) {
					try {
						// Convert Map to array of entries for JSON serialization
						const entries = Array.from(value.entries());
						localStorage.setItem(key, JSON.stringify(entries));
						// Update cache
						mapSignalCache.set(key, value as Map<unknown, unknown>);
					} catch (error) {
						console.warn(`Failed to save Map for key "${key}" to localStorage.`, error);
					}
				}
				timeoutId = null;
			}, debounceMs);
		});
	});

	return s;
}

/**
 * Creates a signal that automatically persists a Set to localStorage.
 *
 * The signal will:
 * - Initialize with the stored Set from localStorage if available
 * - Fall back to the provided initial Set if no stored value exists or parsing fails
 * - Automatically sync changes to localStorage with debouncing (300ms delay)
 * - Work safely in SSR and environments where localStorage is unavailable
 *
 * @template T - The type of the Set elements (must be JSON-serializable)
 * @param key - The localStorage key used to store the Set
 * @param initialValue - The default Set used when no stored value exists
 * @param injector - The Angular injector (use inject(Injector) to get current context)
 * @param debounceMs - Optional debounce delay in milliseconds (default: 300ms)
 * @returns A writable signal containing a Set that persists to localStorage
 *
 * @example
 * ```typescript
 * const injector = inject(Injector);
 * const favorites = storedSetSignal<string>('user.favorites', new Set(), injector);
 * favorites.update(set => new Set(set).add('item1'));
 * console.log(favorites().has('item1')); // true
 * ```
 *
 * @remarks
 * - Requires an Injector to create the effect in the proper context
 * - Elements must be JSON-serializable (no functions, circular references, etc.)
 * - In SSR or when localStorage is unavailable, the signal works normally but won't persist
 * - Corrupted localStorage data is automatically cleared and reset to initial Set
 * - localStorage writes are debounced to improve performance with frequent updates
 * - Sets are stored as arrays in localStorage
 */
export function storedSetSignal<T>(
	key: string,
	initialValue: Set<T>,
	injector: Injector,
	debounceMs = 300,
): WritableSignal<Set<T>> {
	let parsedValue = initialValue;

	// Check cache first
	if (setSignalCache.has(key)) {
		parsedValue = setSignalCache.get(key) as Set<T>;
	} else if (isLocalStorageAvailable()) {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				const values = JSON.parse(storedValue) as T[];
				parsedValue = new Set(values);
				// Cache the parsed Set
				setSignalCache.set(key, parsedValue as Set<unknown>);
			}
		} catch (error) {
			console.warn(
				`Failed to parse stored Set for key "${key}". Using initial value.`,
				error,
			);
			try {
				localStorage.removeItem(key);
			} catch {
				// Ignore removal errors
			}
		}
	}

	const s = signal(parsedValue);

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let isFirstRun = true;

	runInInjectionContext(injector, () => {
		effect(() => {
			const value = s();

			// Skip the first execution to avoid writing back what we just read
			if (isFirstRun) {
				isFirstRun = false;
				return;
			}

			// Clear any pending timeout
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}

			// Debounce the localStorage write
			timeoutId = setTimeout(() => {
				if (isLocalStorageAvailable()) {
					try {
						// Convert Set to array for JSON serialization
						const values = Array.from(value);
						localStorage.setItem(key, JSON.stringify(values));
						// Update cache
						setSignalCache.set(key, value as Set<unknown>);
					} catch (error) {
						console.warn(`Failed to save Set for key "${key}" to localStorage.`, error);
					}
				}
				timeoutId = null;
			}, debounceMs);
		});
	});

	return s;
}
