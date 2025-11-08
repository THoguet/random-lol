import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class RandomNumber {
	/**
	 * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive).
	 *
	 * This method uses the Web Crypto API to generate unbiased random numbers by rejecting
	 * values that would introduce bias due to the modulo operation. It repeatedly generates
	 * random values until one falls within a range that evenly divides by max.
	 *
	 * @param max - The upper bound (exclusive) for the random number. Must be between 1 and Number.MAX_SAFE_INTEGER.
	 * @returns A random integer in the range [0, max).
	 * @throws {RangeError} If max is less than or equal to 0, or greater than Number.MAX_SAFE_INTEGER.
	 *
	 * @example
	 * ```typescript
	 * // Generate a random number between 0 and 9
	 * const randomDigit = RandomNumber.getSecureRandomInt(10);
	 *
	 * // Generate a random index for an array
	 * const randomIndex = RandomNumber.getSecureRandomInt(myArray.length);
	 * ```
	 */
	public static getSecureRandomInt(max: number): number {
		if (max <= 0 || max > Number.MAX_SAFE_INTEGER) {
			throw new RangeError('max must be between 1 and Number.MAX_SAFE_INTEGER');
		}

		const range = 0xffffffff; // 2^32 - 1
		const limit = Math.floor(range / max) * max;
		const array = new Uint32Array(1);

		let value;
		do {
			crypto.getRandomValues(array);
			value = array[0];
		} while (value >= limit);

		return value % max;
	}
}
