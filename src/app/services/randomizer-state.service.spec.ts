import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RandomizerStateService } from './randomizer-state.service';

describe('RandomizerStateService', () => {
	let service: RandomizerStateService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				// Tests in this repo use zoneless change detection; provide it so TestBed
				// doesn't try to create a Zone (which requires zone.js in this setup).
				provideZonelessChangeDetection(),
			],
		});
		service = TestBed.inject(RandomizerStateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
