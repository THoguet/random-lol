import { TestBed } from '@angular/core/testing';
import { RandomizerStateService } from './randomizer-state.service';

describe('RandomizerStateService', () => {
	let service: RandomizerStateService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(RandomizerStateService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
