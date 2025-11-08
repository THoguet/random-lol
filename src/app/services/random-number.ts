import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class RandomNumber {
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
