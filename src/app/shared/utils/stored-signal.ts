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

	if (isLocalStorageAvailable()) {
		try {
			const storedValue = localStorage.getItem(key);
			if (storedValue) {
				parsedValue = JSON.parse(storedValue) as T;
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
