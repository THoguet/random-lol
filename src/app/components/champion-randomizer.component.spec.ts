import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ChampionRandomizerComponent } from './champion-randomizer.component';
import { RandomizerStateService } from '../services/randomizer-state.service';

describe('ChampionRandomizerComponent', () => {
	let component: ChampionRandomizerComponent;
	let fixture: ComponentFixture<ChampionRandomizerComponent>;
	let mockStateService: jasmine.SpyObj<RandomizerStateService>;

	beforeEach(async () => {
		mockStateService = jasmine.createSpyObj('RandomizerStateService', [
			'rollAssignments',
			'retryLoad',
			'copyDraftToClipboard',
			'resetBlacklist',
			'changeChampion',
			'toggleLane',
			'laneLabel',
			'roleLabel',
			'setFearlessDraftEnabled',
		]);

		// Minimal signal-like stubs used by the component template/computeds
		(mockStateService as any).isLoading = () => false;
		(mockStateService as any).hasChampions = () => true;
		(mockStateService as any).showAndy = () => false;
		(mockStateService as any).disabledLanes = () => new Set();
		(mockStateService as any).assignments = () => new Map();
		(mockStateService as any).laneAssignments = () => [];
		(mockStateService as any).fearlessDraftEnabled = () => true;
		(mockStateService as any).reRollBank = () => 0;
		(mockStateService as any).rerollPercentage = () => 0;

		await TestBed.configureTestingModule({
			imports: [ChampionRandomizerComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: RandomizerStateService, useValue: mockStateService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ChampionRandomizerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have access to state service', () => {
		expect(component['state']).toBe(mockStateService);
	});
});
