import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { RandomNumber } from './random-number';

describe('RandomNumber', () => {
	let service: RandomNumber;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()],
		});
		service = TestBed.inject(RandomNumber);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getSecureRandomInt', () => {
		it('should generate a number within the specified range', () => {
			const max = 10;
			const result = RandomNumber.getSecureRandomInt(max);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(max);
		});

		it('should return 0 for max = 1', () => {
			const result = RandomNumber.getSecureRandomInt(1);
			expect(result).toBe(0);
		});

		it('should throw RangeError for max <= 0', () => {
			expect(() => RandomNumber.getSecureRandomInt(0)).toThrowError(RangeError);
			expect(() => RandomNumber.getSecureRandomInt(-1)).toThrowError(RangeError);
		});

		it('should throw RangeError for max > Number.MAX_SAFE_INTEGER', () => {
			expect(() => RandomNumber.getSecureRandomInt(Number.MAX_SAFE_INTEGER + 1)).toThrowError(
				RangeError
			);
		});

		it('should generate different random numbers', () => {
			const max = 100;
			const results = new Set<number>();
			// Generate 50 random numbers
			for (let i = 0; i < 50; i++) {
				results.add(RandomNumber.getSecureRandomInt(max));
			}
			// We should have more than 1 unique value (extremely high probability)
			expect(results.size).toBeGreaterThan(1);
		});

		it('should handle large max values correctly', () => {
			const max = 1000000;
			const result = RandomNumber.getSecureRandomInt(max);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(max);
		});

		it('should use crypto.getRandomValues', () => {
			spyOn(crypto, 'getRandomValues').and.callThrough();
			RandomNumber.getSecureRandomInt(10);
			expect(crypto.getRandomValues).toHaveBeenCalled();
		});
	});
});
